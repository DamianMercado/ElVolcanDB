"""
Script de configuración e importación automática para MongoDB (Atlas Cloud o Local).
Ejecuta el equivalente exacto de volcan_mongodb_setup.js (colecciones con $jsonSchema,
índices 2dsphere/unique y las 3 vistas calculadas) e importa los 6 archivos JSON.

Uso:
  python setup_mongodb.py           # Crea estructura e importa datos si las colecciones están vacías
  python setup_mongodb.py --reset   # Borra y recrea toda la estructura y datos desde cero
"""

import os
import sys
from bson import json_util
from pymongo.errors import CollectionInvalid, OperationFailure

CARPETA = os.path.dirname(os.path.abspath(__file__))

# Esquemas de validación ($jsonSchema) idénticos a volcan_mongodb_setup.js
VALIDADORES = {
    "zonas_despacho": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["_id", "nombre_zona", "comunas", "dias_despacho", "horario"],
            "properties": {
                "_id": {"bsonType": "int"},
                "nombre_zona": {"bsonType": "string"},
                "comunas": {"bsonType": "array", "items": {"bsonType": "string"}},
                "dias_despacho": {"bsonType": "array", "items": {"bsonType": "string"}},
            },
        }
    },
    "productos": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["_id", "categoria", "nombre", "precios", "stock_actual", "stock_critico"],
            "properties": {
                "_id": {"bsonType": "string"},
                "stock_actual": {"bsonType": "int", "minimum": 0},
                "precios": {
                    "bsonType": "object",
                    "required": ["RESIDENCIAL", "COMERCIAL"],
                    "properties": {
                        "RESIDENCIAL": {"bsonType": "int", "minimum": 1},
                        "COMERCIAL": {"bsonType": "int", "minimum": 1},
                    },
                },
            },
        }
    },
    "clientes": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["_id", "rut", "nombre", "tipo_cliente", "direccion", "id_zona", "activo"],
            "properties": {
                "tipo_cliente": {"enum": ["RESIDENCIAL", "COMERCIAL"]},
                "activo": {"bsonType": "bool"},
            },
        }
    },
    "repartidores": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["_id", "rut", "nombre", "activo"],
            "properties": {
                "activo": {"bsonType": "bool"},
            },
        }
    },
    "pedidos": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["_id", "id_cliente", "id_zona", "fecha_pedido", "estado", "lineas", "total"],
            "properties": {
                "estado": {"enum": ["PENDIENTE", "ASIGNADO", "EN_CAMINO", "ENTREGADO", "ANULADO"]},
                "lineas": {
                    "bsonType": "array",
                    "minItems": 1,
                    "items": {
                        "bsonType": "object",
                        "required": ["nro_linea", "cod_producto", "cantidad", "precio_unitario", "subtotal"],
                        "properties": {
                            "cantidad": {"bsonType": "int", "minimum": 1},
                        },
                    },
                },
            },
        }
    },
    "movimientos_stock": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["_id", "cod_producto", "tipo_mov", "cantidad", "stock_resultante", "fecha_mov"],
            "properties": {
                "tipo_mov": {"enum": ["INGRESO", "EGRESO", "AJUSTE"]},
            },
        }
    },
}

# Vistas calculadas idénticas a volcan_mongodb_setup.js
VISTAS = {
    "v_alerta_stock_critico": {
        "viewOn": "productos",
        "pipeline": [
            {"$match": {"$expr": {"$lte": ["$stock_actual", "$stock_critico"]}}},
            {"$sort": {"stock_actual": 1}},
            {
                "$project": {
                    "_id": 0,
                    "cod_producto": "$_id",
                    "nombre": 1,
                    "categoria": 1,
                    "es_cilindro": 1,
                    "stock_actual": 1,
                    "stock_critico": 1,
                }
            },
        ],
    },
    "v_resumen_despacho_zonas": {
        "viewOn": "zonas_despacho",
        "pipeline": [
            {
                "$lookup": {
                    "from": "pedidos",
                    "localField": "_id",
                    "foreignField": "id_zona",
                    "as": "pedidos_zona",
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "nombre_zona": 1,
                    "comunas_descripcion": 1,
                    "total_pedidos": {"$size": "$pedidos_zona"},
                    "pedidos_entregados": {
                        "$size": {
                            "$filter": {
                                "input": "$pedidos_zona",
                                "as": "p",
                                "cond": {"$eq": ["$$p.estado", "ENTREGADO"]},
                            }
                        }
                    },
                    "pedidos_pendientes": {
                        "$size": {
                            "$filter": {
                                "input": "$pedidos_zona",
                                "as": "p",
                                "cond": {"$in": ["$$p.estado", ["PENDIENTE", "ASIGNADO", "EN_CAMINO"]]},
                            }
                        }
                    },
                    "monto_recaudado": {
                        "$sum": {
                            "$map": {
                                "input": {
                                    "$filter": {
                                        "input": "$pedidos_zona",
                                        "as": "p",
                                        "cond": {"$eq": ["$$p.estado", "ENTREGADO"]},
                                    }
                                },
                                "as": "ent",
                                "in": "$$ent.total",
                            }
                        }
                    },
                }
            },
            {"$sort": {"_id": 1}},
        ],
    },
    "v_liquidacion_repartidores": {
        "viewOn": "repartidores",
        "pipeline": [
            {"$match": {"activo": True}},
            {
                "$lookup": {
                    "from": "pedidos",
                    "let": {"repId": "$_id"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        {"$eq": ["$id_repartidor", "$$repId"]},
                                        {"$eq": ["$estado", "ENTREGADO"]},
                                    ]
                                }
                            }
                        },
                        {
                            "$lookup": {
                                "from": "zonas_despacho",
                                "localField": "id_zona",
                                "foreignField": "_id",
                                "as": "zona_info",
                            }
                        },
                        {"$unwind": "$zona_info"},
                        {
                            "$addFields": {
                                "comision_entrega": {"$add": [350, "$zona_info.comision_extra_clp"]}
                            }
                        },
                    ],
                    "as": "entregas",
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "nombre": 1,
                    "patente_camion": 1,
                    "entregas_realizadas": {"$size": "$entregas"},
                    "comision_total_clp": {"$sum": "$entregas.comision_entrega"},
                }
            },
            {"$sort": {"nombre": 1}},
        ],
    },
}

ARCHIVOS_JSON = [
    ("zonas_despacho", "1_zonas_despacho.json"),
    ("productos", "2_productos.json"),
    ("clientes", "3_clientes.json"),
    ("repartidores", "4_repartidores.json"),
    ("pedidos", "5_pedidos.json"),
    ("movimientos_stock", "6_movimientos_stock.json"),
]


def configurar_base_datos(database, reset=False, silencioso=False):
    """
    Crea las colecciones con sus validadores $jsonSchema, los índices, las 3 vistas
    e importa los 6 archivos JSON en la base de datos MongoDB.
    """
    def log(msg):
        if not silencioso:
            print(msg)

    existentes = set(database.list_collection_names())

    if reset:
        log("Reiniciando colecciones y vistas existentes...")
        for vista in VISTAS:
            if vista in existentes:
                database.drop_collection(vista)
        for col in VALIDADORES:
            if col in existentes:
                database.drop_collection(col)
        existentes = set()

    # 1. Crear colecciones con validación $jsonSchema
    for nombre_col, validador in VALIDADORES.items():
        if nombre_col not in existentes:
            try:
                database.create_collection(nombre_col, validator=validador)
                log(f"  [OK] Colección creada con $jsonSchema: {nombre_col}")
            except CollectionInvalid:
                pass
        else:
            try:
                database.command("collMod", nombre_col, validator=validador)
            except OperationFailure:
                pass

    # 2. Crear índices
    database.clientes.create_index([("rut", 1)], unique=True, name="uk_cliente_rut")
    database.clientes.create_index([("direccion.ubicacion", "2dsphere")], name="idx_cliente_geo")

    database.repartidores.create_index([("rut", 1)], unique=True, name="uk_repartidor_rut")
    database.repartidores.create_index([("ubicacion_actual", "2dsphere")], name="idx_repartidor_geo")

    database.pedidos.create_index([("fecha_pedido", 1), ("id_zona", 1)], name="idx_pedido_fecha_zona")
    database.pedidos.create_index([("id_repartidor", 1), ("estado", 1)], name="idx_pedido_repartidor")
    database.pedidos.create_index([("entrega.ubicacion", "2dsphere")], name="idx_pedido_geo")

    database.movimientos_stock.create_index(
        [("cod_producto", 1), ("fecha_mov", -1)], name="idx_mov_prod_fecha"
    )
    log("  [OK] Índices únicos, compuestos y 2dsphere verificados.")

    # 3. Crear vistas calculadas
    existentes = set(database.list_collection_names())
    for nombre_vista, cfg in VISTAS.items():
        if nombre_vista not in existentes:
            try:
                database.command(
                    "create",
                    nombre_vista,
                    viewOn=cfg["viewOn"],
                    pipeline=cfg["pipeline"],
                )
                log(f"  [OK] Vista creada: {nombre_vista}")
            except OperationFailure:
                pass

    # 4. Importar los 6 archivos JSON si las colecciones están vacías
    for nombre_col, archivo in ARCHIVOS_JSON:
        ruta = os.path.join(CARPETA, archivo)
        if not os.path.isfile(ruta):
            log(f"  [AVISO] No se encontró {archivo}")
            continue

        coleccion = database[nombre_col]
        cantidad_actual = coleccion.count_documents({})
        if cantidad_actual == 0:
            with open(ruta, "r", encoding="utf-8") as f:
                documentos = json_util.loads(f.read())
            if documentos:
                coleccion.insert_many(documentos)
                log(f"  [OK] Importados {len(documentos)} documentos desde {archivo} -> {nombre_col}")
        else:
            log(f"  [INFO] {nombre_col} ya tiene {cantidad_actual} documentos (omitido).")


if __name__ == "__main__":
    import db

    reiniciar = "--reset" in sys.argv
    print("=" * 60)
    print("  CONFIGURACIÓN E IMPORTACIÓN MONGODB - EL VOLCÁN")
    print("=" * 60)
    try:
        base_datos = db.conectar(inicializar=False)
        configurar_base_datos(base_datos, reset=reiniciar, silencioso=False)
        print("\n=== Base de datos el_volcan_db lista en MongoDB ===")
    except Exception as exc:
        print(f"\n[ERROR] No se pudo conectar o configurar MongoDB:\n  {exc}")
        sys.exit(1)
