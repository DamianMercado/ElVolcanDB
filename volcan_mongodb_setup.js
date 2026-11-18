/* ============================================================================
   DISTRIBUIDORA DE GAS EL VOLCÁN - SCRIPT INTEGRAL PARA MONGODB COMPASS (MONGOSH)
   Equivalente NoSQL Híbrido (Referencias + Embebidos sin duplicación crítica)
   de volcan_plsql.sql + Catalogo Distribuidora Gas El Volcan.xlsx
   ============================================================================ */

// 1. Seleccionar / Crear la base de datos
use("el_volcan_db");

// 2. Validación de Esquemas ($jsonSchema) — Equivalente a los CHECK de Oracle
db.createCollection("zonas_despacho", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "nombre_zona", "comunas", "dias_despacho", "horario"],
      properties: {
        _id: { bsonType: "int" },
        nombre_zona: { bsonType: "string" },
        comunas: { bsonType: "array", items: { bsonType: "string" } },
        dias_despacho: { bsonType: "array", items: { bsonType: "string" } }
      }
    }
  }
});

db.createCollection("productos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "categoria", "nombre", "precios", "stock_actual", "stock_critico"],
      properties: {
        _id: { bsonType: "string" },
        stock_actual: { bsonType: "int", minimum: 0 }, // ck_prod_stock >= 0
        precios: {
          bsonType: "object",
          required: ["RESIDENCIAL", "COMERCIAL"],
          properties: {
            RESIDENCIAL: { bsonType: "int", minimum: 1 }, // ck_prod_precios > 0
            COMERCIAL: { bsonType: "int", minimum: 1 }
          }
        }
      }
    }
  }
});

db.createCollection("clientes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "rut", "nombre", "tipo_cliente", "direccion", "id_zona", "activo"],
      properties: {
        tipo_cliente: { enum: ["RESIDENCIAL", "COMERCIAL"] }, // ck_cliente_tipo
        activo: { bsonType: "bool" }                          // ck_cliente_act
      }
    }
  }
});

db.createCollection("repartidores", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "rut", "nombre", "activo"],
      properties: {
        activo: { bsonType: "bool" }
      }
    }
  }
});

db.createCollection("pedidos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "id_cliente", "id_zona", "fecha_pedido", "estado", "lineas", "total"],
      properties: {
        estado: { enum: ["PENDIENTE", "ASIGNADO", "EN_CAMINO", "ENTREGADO", "ANULADO"] },
        lineas: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["nro_linea", "cod_producto", "cantidad", "precio_unitario", "subtotal"],
            properties: {
              cantidad: { bsonType: "int", minimum: 1 } // ck_det_cant > 0
            }
          }
        }
      }
    }
  }
});

db.createCollection("movimientos_stock", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "cod_producto", "tipo_mov", "cantidad", "stock_resultante", "fecha_mov"],
      properties: {
        tipo_mov: { enum: ["INGRESO", "EGRESO", "AJUSTE"] } // ck_mov_tipo
      }
    }
  }
});

// 3. Índices de Integridad, Rendimiento y Geolocalización (Leaflet / Google Maps)
db.clientes.createIndex({ rut: 1 }, { unique: true, name: "uk_cliente_rut" });
db.clientes.createIndex({ "direccion.ubicacion": "2dsphere" }, { name: "idx_cliente_geo" });

db.repartidores.createIndex({ rut: 1 }, { unique: true, name: "uk_repartidor_rut" });
db.repartidores.createIndex({ ubicacion_actual: "2dsphere" }, { name: "idx_repartidor_geo" });

db.pedidos.createIndex({ fecha_pedido: 1, id_zona: 1 }, { name: "idx_pedido_fecha_zona" });
db.pedidos.createIndex({ id_repartidor: 1, estado: 1 }, { name: "idx_pedido_repartidor" });
db.pedidos.createIndex({ "entrega.ubicacion": "2dsphere" }, { name: "idx_pedido_geo" });

db.movimientos_stock.createIndex({ cod_producto: 1, fecha_mov: -1 }, { name: "idx_mov_prod_fecha" });

// 4. Vistas Calculadas en MongoDB Compass (Equivalentes a PKG_REPORTES y PKG_STOCK)

// 4.1 Vista: v_alerta_stock_critico (Equivalente a PKG_STOCK.sp_alerta_stock_critico)
db.createView("v_alerta_stock_critico", "productos", [
  { $match: { $expr: { $lte: ["$stock_actual", "$stock_critico"] } } },
  { $sort: { stock_actual: 1 } },
  {
    $project: {
      _id: 0,
      cod_producto: "$_id",
      nombre: 1,
      categoria: 1,
      es_cilindro: 1,
      stock_actual: 1,
      stock_critico: 1
    }
  }
]);

// 4.2 Vista: v_resumen_despacho_zonas (Equivalente a PKG_REPORTES.sp_reporte_despacho_diario)
// Une pedidos con zonas_despacho sin tener datos duplicados
db.createView("v_resumen_despacho_zonas", "zonas_despacho", [
  {
    $lookup: {
      from: "pedidos",
      localField: "_id",
      foreignField: "id_zona",
      as: "pedidos_zona"
    }
  },
  {
    $project: {
      _id: 1,
      nombre_zona: 1,
      comunas_descripcion: 1,
      total_pedidos: { $size: "$pedidos_zona" },
      pedidos_entregados: {
        $size: {
          $filter: {
            input: "$pedidos_zona",
            as: "p",
            cond: { $eq: ["$$p.estado", "ENTREGADO"] }
          }
        }
      },
      pedidos_pendientes: {
        $size: {
          $filter: {
            input: "$pedidos_zona",
            as: "p",
            cond: { $in: ["$$p.estado", ["PENDIENTE", "ASIGNADO", "EN_CAMINO"]] }
          }
        }
      },
      monto_recaudado: {
        $sum: {
          $map: {
            input: {
              $filter: {
                input: "$pedidos_zona",
                as: "p",
                cond: { $eq: ["$$p.estado", "ENTREGADO"] }
              }
            },
            as: "ent",
            in: "$$ent.total"
          }
        }
      }
    }
  },
  { $sort: { _id: 1 } }
]);

// 4.3 Vista: v_liquidacion_repartidores (Equivalente a PKG_REPORTES.sp_liquidacion_repartidores)
db.createView("v_liquidacion_repartidores", "repartidores", [
  { $match: { activo: true } },
  {
    $lookup: {
      from: "pedidos",
      let: { repId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$id_repartidor", "$$repId"] },
                { $eq: ["$estado", "ENTREGADO"] }
              ]
            }
          }
        },
        {
          $lookup: {
            from: "zonas_despacho",
            localField: "id_zona",
            foreignField: "_id",
            as: "zona_info"
          }
        },
        { $unwind: "$zona_info" },
        {
          $addFields: {
            comision_entrega: { $add: [350, "$zona_info.comision_extra_clp"] }
          }
        }
      ],
      as: "entregas"
    }
  },
  {
    $project: {
      _id: 1,
      nombre: 1,
      patente_camion: 1,
      entregas_realizadas: { $size: "$entregas" },
      comision_total_clp: { $sum: "$entregas.comision_entrega" }
    }
  },
  { $sort: { nombre: 1 } }
]);

print("=== Estructura, Validaciones, Índices y Vistas creadas en el_volcan_db ===");
