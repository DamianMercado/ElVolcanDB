"""
Aplicación de consola que usa la base de datos MongoDB (el_volcan_db):

  - Opción 1: Ver productos y stock disponible (colección `productos`)
  - Opción 2: Crear un pedido y descontar stock (`pedidos` + `movimientos_stock`)
  - Opción 3: Total comprado por cliente (agregación sobre `pedidos`)
  - Opción 4: Ver movimientos de stock (`movimientos_stock`)
  - Opción 5: Ver vistas calculadas (`v_alerta_stock_critico`, `v_resumen_despacho_zonas`, `v_liquidacion_repartidores`)

Uso:  python app.py
"""

import sys
from datetime import datetime
from pymongo.errors import PyMongoError
import db


def formatear_fecha(valor):
    if isinstance(valor, datetime):
        return valor.strftime("%d/%m/%Y %H:%M")
    return str(valor or "")


# ---------------------------------------------------------------
# 1. Ver productos y stock disponible
# ---------------------------------------------------------------
def ver_productos(database):
    productos = list(database.productos.find().sort("_id", 1))

    print("\n  CODIGO  PRODUCTO                        RESIDENCIAL  COMERCIAL   STOCK")
    print("  " + "-" * 72)

    for p in productos:
        codigo = p["_id"]
        nombre = p.get("nombre", "")[:30]
        precios = p.get("precios", {})
        p_res = int(precios.get("RESIDENCIAL", 0))
        p_com = int(precios.get("COMERCIAL", 0))
        stock = db.fn_stock_disponible(database, codigo)
        print(f"  {codigo:<8}{nombre:<32}${p_res:>10,}  ${p_com:>8,}{stock:>8}")


# ---------------------------------------------------------------
# 2. Crear pedido + descontar stock + registrar movimiento
# ---------------------------------------------------------------
def crear_pedido(database):
    try:
        id_cliente = int(input("\n  ID del cliente (1 al 6): "))
        codigo = input("  Código del producto (ej. CL002): ").strip().upper()
        cantidad = int(input("  Cantidad: "))
    except ValueError:
        print("  Debes escribir un número válido.")
        return

    try:
        id_pedido = db.sp_crear_pedido(database, id_cliente, codigo, cantidad)
        print(f"\n  Pedido N° {id_pedido} creado correctamente en MongoDB.")
        print("  Se descontó el stock y se registró el movimiento automáticamente.")
    except db.ErrorNegocio as e:
        print("\n  No se pudo crear el pedido:")
        print(f"  {e.message}")
    except PyMongoError as e:
        print(f"\n  Error de base de datos MongoDB: {e}")


# ---------------------------------------------------------------
# 3. Total comprado por cliente
# ---------------------------------------------------------------
def total_por_cliente(database):
    clientes = list(database.clientes.find().sort("_id", 1))

    print("\n  ID  CLIENTE                                   TIPO          TOTAL COMPRADO")
    print("  " + "-" * 74)

    for c in clientes:
        cid = int(c["_id"])
        nombre = c.get("nombre", "")[:38]
        tipo = c.get("tipo_cliente", "RESIDENCIAL")
        total = db.fn_total_cliente(database, cid)
        print(f"  {cid:<4}{nombre:<42}{tipo:<14}$ {total:>12,}")


# ---------------------------------------------------------------
# 4. Movimientos de stock
# ---------------------------------------------------------------
def ver_movimientos(database):
    filas = list(database.movimientos_stock.find().sort("_id", -1))

    if not filas:
        print("\n  Todavía no hay movimientos. Crea un pedido primero.")
        return

    print("\n   N°  PRODUCTO  TIPO      CANT   STOCK DESPUÉS  PEDIDO   FECHA")
    print("  " + "-" * 68)
    for m in filas:
        mov = m["_id"]
        prod = m.get("cod_producto", "")
        tipo = m.get("tipo_mov", "EGRESO")
        cant = m.get("cantidad", 0)
        stock = m.get("stock_resultante", 0)
        pedido = m.get("id_pedido", "-")
        fecha = formatear_fecha(m.get("fecha_mov"))
        print(f"  {mov:>3}  {prod:<10}{tipo:<9}{cant:>5}{stock:>15}{pedido:>9}   {fecha}")


# ---------------------------------------------------------------
# 5. Vistas calculadas (volcan_mongodb_setup.js)
# ---------------------------------------------------------------
def ver_vistas(database):
    print("\n  [A] VISTA: v_alerta_stock_critico")
    print("  " + "-" * 60)
    alertas = list(database.v_alerta_stock_critico.find())
    if not alertas:
        print("  Sin productos en stock crítico.")
    else:
        for a in alertas:
            print(
                f"  {a.get('cod_producto', ''):<8} {a.get('nombre', ''):<34} "
                f"Stock: {a.get('stock_actual')} (Crítico: {a.get('stock_critico')})"
            )

    print("\n  [B] VISTA: v_resumen_despacho_zonas")
    print("  " + "-" * 60)
    for z in database.v_resumen_despacho_zonas.find():
        print(
            f"  Zona {z['_id']} ({z.get('nombre_zona', '')}): "
            f"Pedidos={z.get('total_pedidos', 0)} | "
            f"Entregados={z.get('pedidos_entregados', 0)} | "
            f"Pendientes={z.get('pedidos_pendientes', 0)} | "
            f"Recaudado=${int(z.get('monto_recaudado', 0)):,}"
        )

    print("\n  [C] VISTA: v_liquidacion_repartidores")
    print("  " + "-" * 60)
    for r in database.v_liquidacion_repartidores.find():
        print(
            f"  {r.get('nombre', ''):<30} Camión: {r.get('patente_camion', ''):<10} "
            f"Entregas: {r.get('entregas_realizadas', 0)} | "
            f"Comisión: ${int(r.get('comision_total_clp', 0)):,}"
        )


def menu():
    print("\n" + "=" * 54)
    print("  DISTRIBUIDORA DE GAS EL VOLCÁN (MongoDB)")
    print("=" * 54)
    print("  1. Ver productos y stock       (colección productos)")
    print("  2. Crear un pedido             (pedidos + stock)")
    print("  3. Total comprado por cliente  (agregación $group)")
    print("  4. Ver movimientos de stock    (movimientos_stock)")
    print("  5. Ver vistas de reportes      (v_alerta / zonas / repartidores)")
    print("  0. Salir")
    return input("\n  Opción: ").strip()


def main():
    try:
        database = db.conectar()
    except Exception as e:
        print("No se pudo conectar a MongoDB.")
        print(f"   {e}")
        print("\nRevisa la variable MONGO_URI en tu archivo .env")
        sys.exit(1)

    opciones = {
        "1": ver_productos,
        "2": crear_pedido,
        "3": total_por_cliente,
        "4": ver_movimientos,
        "5": ver_vistas,
    }

    while True:
        opcion = menu()
        if opcion == "0":
            break
        accion = opciones.get(opcion)
        if accion:
            accion(database)
        else:
            print("  Opción no válida.")

    print("\n  Hasta luego.\n")


if __name__ == "__main__":
    main()
