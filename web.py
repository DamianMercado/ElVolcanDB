import threading
import webbrowser

import oracledb
from flask import Flask, flash, redirect, render_template, request, url_for

import db

PUERTO = 5000

app = Flask(__name__)
app.secret_key = "el-volcan-local"  # necesario para los mensajes (flash)


@app.template_filter("clp")
def formato_clp(valor):
    """12990 -> 12.990"""
    return f"{int(valor):,}".replace(",", ".")


def leer_datos(conexion):
    cursor = conexion.cursor()
    # 1. Consulta todos los productos y calcula el stock con la FUNCION en un solo viaje
    cursor.execute("""
        SELECT cod_producto, nombre, precio, fn_stock_disponible(cod_producto) AS stock
          FROM PRODUCTO
         ORDER BY cod_producto
    """)
    productos = [
        {"codigo": c, "nombre": n, "precio": p, "stock": s}
        for c, n, p, s in cursor.fetchall()
    ]
    # 2. Consulta los clientes y el total con la función del PACKAGE en un solo viaje
    cursor.execute("""
        SELECT id_cliente, nombre, pkg_pedidos.fn_total_cliente(id_cliente) AS total
          FROM CLIENTE
         ORDER BY id_cliente
    """)
    clientes = [
        {"id": i, "nombre": n, "total": t}
        for i, n, t in cursor.fetchall()
    ]
    # 3. Movimientos de stock
    cursor.execute("""
        SELECT id_movimiento, cod_producto, cantidad, stock_resultante,
               id_pedido, TO_CHAR(fecha_mov, 'DD/MM/YYYY HH24:MI')
          FROM MOVIMIENTO_STOCK
         ORDER BY id_movimiento DESC
    """)
    movimientos = [
        {"id": m, "codigo": c, "cantidad": q, "stock": s, "pedido": p, "fecha": f}
        for m, c, q, s, p, f in cursor.fetchall()
    ]
    cursor.close()
    return {"productos": productos, "clientes": clientes, "movimientos": movimientos}

@app.get("/")
def inicio():
    try:
        with db.conectar() as conexion:
            datos = leer_datos(conexion)
    except oracledb.Error as e:
        error, = e.args
        return render_template(
            "error.html",
            mensaje=getattr(error, "message", str(error)),
            usuario=db.USUARIO,
            dsn=db.DSN,
            usa_wallet=db.usa_wallet(),
            wallet_dir=db.WALLET_DIR,
        ), 500

    return render_template(
        "index.html",
        **datos,
        usuario=db.USUARIO,
        dsn=db.DSN,
        usa_wallet=db.usa_wallet(),
        resaltar=request.args.get("resaltar", ""),
    )


@app.post("/pedido")
def crear_pedido():
    try:
        id_cliente = int(request.form["id_cliente"])
        codigo = request.form["codigo"].strip().upper()
        cantidad = int(request.form["cantidad"])
    except (KeyError, ValueError):
        flash("Debes escribir un número válido.", "error")
        return redirect(url_for("inicio") + "#pedido")

    resaltar = ""
    try:
        with db.conectar() as conexion:
            cursor = conexion.cursor()
            id_pedido = cursor.var(int)
            try:
                cursor.callproc("pkg_pedidos.sp_crear_pedido",
                                [id_cliente, codigo, cantidad, id_pedido])
                conexion.commit()
                flash(f"Pedido N° {id_pedido.getvalue()} creado. "
                      f"El trigger descontó {cantidad} unidad(es) de {codigo} y registró el movimiento.", "ok")
                resaltar = codigo
            except oracledb.DatabaseError as e:
                conexion.rollback()
                error, = e.args
                # ORA-20001 a ORA-20999: errores de negocio que lanza el package
                if 20001 <= error.code <= 20999:
                    flash(f"No se pudo crear el pedido (ORA-{error.code}): "
                          f"{db.limpiar_mensaje(error.message)}", "error")
                else:
                    flash(f"Error de base de datos: {error.message}", "error")
    except oracledb.Error as e:
        error, = e.args
        flash(f"No se pudo conectar a Oracle: {getattr(error, 'message', error)}", "error")

    destino = url_for("inicio", resaltar=resaltar) if resaltar else url_for("inicio")
    return redirect(destino + "#pedido")


if __name__ == "__main__":
    url = f"http://localhost:{PUERTO}"
    print("=" * 52)
    print("  EL VOLCAN - version web")
    print(f"  Abre {url} en tu navegador")
    print("  Para detenerlo cierra esta ventana o presiona Ctrl+C")
    print("=" * 52)
    # Abre el navegador solo, un segundo después de arrancar
    threading.Timer(1.2, lambda: webbrowser.open(url)).start()
    app.run(host="127.0.0.1", port=PUERTO, debug=False)
