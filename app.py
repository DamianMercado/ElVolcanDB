"""
Aplicacion de consola que usa los objetos PL/SQL de Oracle:

  - FUNCION  fn_stock_disponible       -> opcion 1
  - PACKAGE  pkg_pedidos.sp_crear_pedido -> opcion 2
  - PACKAGE  pkg_pedidos.fn_total_cliente -> opcion 3
  - TRIGGER  trg_descuenta_stock       -> se ve en la opcion 4

Uso:  python app.py
"""

import sys
import oracledb
import db


# ---------------------------------------------------------------
# 1. Usa la FUNCION fn_stock_disponible
# ---------------------------------------------------------------
def ver_productos(conexion):
    cursor = conexion.cursor()
    cursor.execute("SELECT cod_producto, nombre, precio FROM PRODUCTO ORDER BY cod_producto")
    productos = cursor.fetchall()

    print("\n  CODIGO  PRODUCTO                        PRECIO     STOCK")
    print("  " + "-" * 56)

    for codigo, nombre, precio in productos:
        # Llamada a la funcion almacenada
        stock = cursor.callfunc("fn_stock_disponible", int, [codigo])
        print(f"  {codigo:<8}{nombre:<32}{precio:>7,}{stock:>10}")

    cursor.close()


# ---------------------------------------------------------------
# 2. Usa el PACKAGE (procedimiento) y dispara el TRIGGER
# ---------------------------------------------------------------
def crear_pedido(conexion):
    try:
        id_cliente = int(input("\n  ID del cliente (1, 2 o 3): "))
        codigo = input("  Codigo del producto (ej. CL002): ").strip().upper()
        cantidad = int(input("  Cantidad: "))
    except ValueError:
        print("  Debes escribir un numero valido.")
        return

    cursor = conexion.cursor()
    id_pedido = cursor.var(int)

    try:
        cursor.callproc("pkg_pedidos.sp_crear_pedido",
                        [id_cliente, codigo, cantidad, id_pedido])
        conexion.commit()
        print(f"\n  Pedido N° {id_pedido.getvalue()} creado correctamente.")
        print("  El trigger ya descontó el stock automáticamente.")

    except oracledb.DatabaseError as e:
        conexion.rollback()
        error, = e.args
        # Los ORA-20001 a ORA-20999 son los errores que definimos nosotros
        if 20001 <= error.code <= 20999:
            print("\n  No se pudo crear el pedido:")
            print(f"  {limpiar_mensaje(error.message)}")
        else:
            print(f"\n  Error de base de datos: {error.message}")

    cursor.close()


# ---------------------------------------------------------------
# 3. Usa la funcion del PACKAGE
# ---------------------------------------------------------------
def total_por_cliente(conexion):
    cursor = conexion.cursor()
    cursor.execute("SELECT id_cliente, nombre FROM CLIENTE ORDER BY id_cliente")

    print("\n  CLIENTE                          TOTAL COMPRADO")
    print("  " + "-" * 48)

    for id_cliente, nombre in cursor.fetchall():
        total = cursor.callfunc("pkg_pedidos.fn_total_cliente", int, [id_cliente])
        print(f"  {nombre:<32} $ {total:>12,}")

    cursor.close()


# ---------------------------------------------------------------
# 4. Muestra lo que dejo el TRIGGER
# ---------------------------------------------------------------
def ver_movimientos(conexion):
    cursor = conexion.cursor()
    cursor.execute("""
        SELECT m.id_movimiento, m.cod_producto, m.cantidad,
               m.stock_resultante, m.id_pedido,
               TO_CHAR(m.fecha_mov, 'DD/MM/YYYY HH24:MI')
          FROM MOVIMIENTO_STOCK m
         ORDER BY m.id_movimiento DESC
    """)
    filas = cursor.fetchall()

    if not filas:
        print("\n  Todavia no hay movimientos. Crea un pedido primero.")
        cursor.close()
        return

    print("\n  Estos registros los creó el trigger, nadie los insertó a mano:\n")
    print("   N°  PRODUCTO  CANT   STOCK DESPUES  PEDIDO   FECHA")
    print("  " + "-" * 56)
    for mov, producto, cant, stock, pedido, fecha in filas:
        print(f"  {mov:>3}  {producto:<9}{cant:>4}{stock:>14}{pedido:>9}   {fecha}")

    cursor.close()


# ---------------------------------------------------------------
def limpiar_mensaje(mensaje):
    """Deja solo el texto del error, sin el codigo ORA ni el rastro."""
    texto = mensaje.split("\n")[0]
    if ":" in texto:
        texto = texto.split(":", 1)[1].strip()
    return texto


def menu():
    print("\n" + "=" * 48)
    print("  DISTRIBUIDORA DE GAS EL VOLCAN")
    print("=" * 48)
    print("  1. Ver productos y stock      (funcion)")
    print("  2. Crear un pedido            (package + trigger)")
    print("  3. Total comprado por cliente (package)")
    print("  4. Ver movimientos de stock   (los creo el trigger)")
    print("  0. Salir")
    return input("\n  Opcion: ").strip()


def main():
    try:
        conexion = db.conectar()
    except oracledb.DatabaseError as e:
        print("No se pudo conectar a Oracle.")
        print(f"   {e}")
        print("\nRevisa los datos de conexion en db.py y que el wallet")
        print("este descomprimido en la carpeta 'wallet'.")
        sys.exit(1)

    opciones = {
        "1": ver_productos,
        "2": crear_pedido,
        "3": total_por_cliente,
        "4": ver_movimientos,
    }

    while True:
        opcion = menu()
        if opcion == "0":
            break
        accion = opciones.get(opcion)
        if accion:
            accion(conexion)
        else:
            print("  Opcion no valida.")

    conexion.close()
    print("\n  Hasta luego.\n")


if __name__ == "__main__":
    main()
