import os
from datetime import datetime, timezone
from urllib.parse import urlparse

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError

import setup_mongodb

CARPETA = os.path.dirname(os.path.abspath(__file__))

# Carga .env si existe
load_dotenv(os.path.join(CARPETA, ".env"))

# ---------------------------------------------------------------
# Variables de entorno para MongoDB Atlas (Cloud) o Local
# ---------------------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/").strip()
MONGO_DB = os.getenv("MONGO_DB", "el_volcan_db").strip()
AUTO_SEED = os.getenv("AUTO_SEED_MONGODB", "true").strip().lower() in ("1", "true", "yes", "si")


def es_cloud():
    """Indica si la URI apunta a MongoDB Atlas Cloud (mongodb+srv / mongodb.net)."""
    return MONGO_URI.startswith("mongodb+srv://") or "mongodb.net" in MONGO_URI


def obtener_usuario_y_host():
    """Extrae usuario y host legibles desde MONGO_URI sin exponer la contraseña."""
    try:
        parsed = urlparse(MONGO_URI)
        usuario = parsed.username or ("atlas-user" if es_cloud() else "local")
        host = parsed.hostname or "localhost"
        return usuario, host
    except Exception:
        return "mongodb", "localhost"


def uri_enmascarada():
    """Devuelve la URI ocultando la contraseña para mostrarla en pantalla de forma segura."""
    try:
        parsed = urlparse(MONGO_URI)
        if parsed.password:
            return MONGO_URI.replace(f":{parsed.password}@", ":****@")
    except Exception:
        pass
    return MONGO_URI


USUARIO, HOST = obtener_usuario_y_host()
DSN = f"{HOST}/{MONGO_DB}"


class ErrorNegocio(Exception):
    """Error de validación de reglas de negocio (equivalente a ORA-20001..20999)."""

    def __init__(self, codigo, mensaje):
        super().__init__(mensaje)
        self.code = codigo
        self.message = mensaje


# ---------------------------------------------------------------
# Conexión reutilizable (Pool de MongoClient)
# ---------------------------------------------------------------
_client = None
_inicializado = False


def conectar(inicializar=True):
    """Abre o reutiliza el pool de conexión a MongoDB y devuelve la base de datos."""
    global _client, _inicializado, USUARIO, HOST, DSN
    MONGO_URI_ACTUAL = os.getenv("MONGO_URI", MONGO_URI).strip()
    MONGO_DB_ACTUAL = os.getenv("MONGO_DB", MONGO_DB).strip()

    if _client is None:
        _client = MongoClient(MONGO_URI_ACTUAL, serverSelectionTimeoutMS=6000)

    # Verifica que el servidor responda
    _client.admin.command("ping")
    database = _client[MONGO_DB_ACTUAL]

    if inicializar and AUTO_SEED and not _inicializado:
        setup_mongodb.configurar_base_datos(database, reset=False, silencioso=True)
        _inicializado = True

    return database


# ---------------------------------------------------------------
# Operaciones de negocio en MongoDB (Equivalentes NoSQL)
# ---------------------------------------------------------------
def fn_stock_disponible(database, cod_producto):
    """Devuelve el stock actual del producto o -1 si no existe."""
    prod = database.productos.find_one({"_id": cod_producto}, {"stock_actual": 1})
    if not prod:
        return -1
    return int(prod.get("stock_actual", 0))


def fn_total_cliente(database, id_cliente):
    """Calcula el total comprado por un cliente en pedidos no anulados ($match + $group)."""
    pipeline = [
        {"$match": {"id_cliente": int(id_cliente), "estado": {"$ne": "ANULADO"}}},
        {"$group": {"_id": "$id_cliente", "total": {"$sum": "$total"}}},
    ]
    resultado = list(database.pedidos.aggregate(pipeline))
    return int(resultado[0]["total"]) if resultado else 0


def sp_crear_pedido(database, id_cliente, cod_producto, cantidad):
    """
    Crea un pedido validando reglas de negocio y esquema ($jsonSchema),
    descuenta el stock en `productos` y registra el egreso en `movimientos_stock`.
    """
    # Validación 1: cantidad positiva
    if cantidad is None or int(cantidad) <= 0:
        raise ErrorNegocio(20003, "La cantidad debe ser mayor que cero.")
    cantidad = int(cantidad)

    # Validación 2: cliente existe y está activo
    cliente = database.clientes.find_one({"_id": int(id_cliente)})
    if not cliente:
        raise ErrorNegocio(20004, f"No existe el cliente {id_cliente}.")
    if not cliente.get("activo", True):
        raise ErrorNegocio(20005, f"El cliente {cliente.get('nombre', id_cliente)} está inactivo.")

    # Validación 3: producto existe
    producto = database.productos.find_one({"_id": cod_producto})
    if not producto:
        raise ErrorNegocio(20002, f"El producto {cod_producto} no existe.")

    # Validación 4: stock suficiente
    stock_actual = int(producto.get("stock_actual", 0))
    if stock_actual < cantidad:
        raise ErrorNegocio(
            20001,
            f"Stock insuficiente de {cod_producto}. Disponible: {stock_actual}, pedido: {cantidad}",
        )

    # Precio según tipo de cliente (RESIDENCIAL o COMERCIAL)
    tipo_cliente = cliente.get("tipo_cliente", "RESIDENCIAL")
    precios = producto.get("precios", {})
    precio_unitario = int(precios.get(tipo_cliente, precios.get("RESIDENCIAL", 0)))
    subtotal = int(precio_unitario * cantidad)

    # Siguiente correlativo de pedido
    ult_pedido = database.pedidos.find_one(sort=[("_id", -1)])
    id_pedido = int(ult_pedido["_id"]) + 1 if ult_pedido else 1001

    ahora = datetime.now(timezone.utc)
    direccion_cli = cliente.get("direccion", {})
    calle = direccion_cli.get("calle", "")
    comuna = direccion_cli.get("comuna", "")
    direccion_texto = f"{calle}, {comuna}".strip(", ") if comuna and comuna not in calle else calle

    nuevo_pedido = {
        "_id": id_pedido,
        "id_cliente": int(id_cliente),
        "id_repartidor": None,
        "id_zona": int(cliente.get("id_zona", 1)),
        "fecha_pedido": ahora,
        "fecha_entrega": None,
        "estado": "PENDIENTE",
        "entrega": {
            "direccion_entrega": direccion_texto,
            "ubicacion": direccion_cli.get(
                "ubicacion", {"type": "Point", "coordinates": [-72.1023, -36.6067]}
            ),
        },
        "lineas": [
            {
                "nro_linea": 1,
                "cod_producto": cod_producto,
                "cantidad": cantidad,
                "precio_unitario": precio_unitario,
                "subtotal": subtotal,
            }
        ],
        "total": subtotal,
        "pago": None,
        "auditoria": [
            {
                "id_auditoria": 1,
                "estado_anterior": None,
                "estado_nuevo": "PENDIENTE",
                "usuario_bd": "operadora_web",
                "fecha_cambio": ahora,
            }
        ],
    }

    # 1. Insertar pedido (validado por $jsonSchema de la colección `pedidos`)
    database.pedidos.insert_one(nuevo_pedido)

    # 2. Descontar stock en `productos` y registrar en `movimientos_stock`
    nuevo_stock = int(stock_actual - cantidad)
    database.productos.update_one(
        {"_id": cod_producto},
        {"$set": {"stock_actual": nuevo_stock}},
    )

    ult_mov = database.movimientos_stock.find_one(sort=[("_id", -1)])
    id_movimiento = int(ult_mov["_id"]) + 1 if ult_mov else 1

    database.movimientos_stock.insert_one(
        {
            "_id": id_movimiento,
            "cod_producto": cod_producto,
            "tipo_mov": "EGRESO",
            "cantidad": cantidad,
            "stock_resultante": nuevo_stock,
            "id_pedido": id_pedido,
            "fecha_mov": ahora,
        }
    )

    return id_pedido


def limpiar_mensaje(mensaje):
    texto = str(mensaje).split("\n")[0]
    if ":" in texto:
        texto = texto.split(":", 1)[1].strip()
    return texto
