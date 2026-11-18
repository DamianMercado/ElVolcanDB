import os
import threading
import webbrowser
from datetime import datetime

from flask import Flask, flash, redirect, render_template, request, url_for
from pymongo.errors import PyMongoError

import db

PUERTO = int(os.getenv("PORT", 5000))

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "el-volcan-mongodb")


@app.template_filter("clp")
def formato_clp(valor):
    """12990 -> 12.990"""
    return f"{int(valor):,}".replace(",", ".")


def formatear_fecha(valor):
    if isinstance(valor, datetime):
        return valor.strftime("%d/%m/%Y %H:%M")
    return str(valor or "")


def leer_datos(database):
    # 1. Productos y stock (colección `productos`)
    productos = []
    for p in database.productos.find().sort("_id", 1):
        precios = p.get("precios", {})
        stock = int(p.get("stock_actual", 0))
        critico = int(p.get("stock_critico", 10))
        productos.append(
            {
                "codigo": p["_id"],
                "nombre": p.get("nombre", ""),
                "categoria": p.get("categoria", ""),
                "precio": int(precios.get("RESIDENCIAL", 0)),
                "precio_comercial": int(precios.get("COMERCIAL", 0)),
                "stock": stock,
                "stock_critico": critico,
                "es_critico": stock <= critico,
            }
        )

    # 2. Clientes y total comprado (colección `clientes` + agregación en `pedidos`)
    clientes = []
    for c in database.clientes.find().sort("_id", 1):
        cid = int(c["_id"])
        clientes.append(
            {
                "id": cid,
                "rut": c.get("rut", ""),
                "nombre": c.get("nombre", ""),
                "tipo_cliente": c.get("tipo_cliente", "RESIDENCIAL"),
                "activo": c.get("activo", True),
                "total": db.fn_total_cliente(database, cid),
            }
        )

    # 3. Movimientos de stock (colección `movimientos_stock`)
    movimientos = [
        {
            "id": m["_id"],
            "codigo": m.get("cod_producto", ""),
            "tipo_mov": m.get("tipo_mov", "EGRESO"),
            "cantidad": m.get("cantidad", 0),
            "stock": m.get("stock_resultante", 0),
            "pedido": m.get("id_pedido", "-"),
            "fecha": formatear_fecha(m.get("fecha_mov")),
        }
        for m in database.movimientos_stock.find().sort("_id", -1)
    ]

    # 4. Vistas calculadas de volcan_mongodb_setup.js
    try:
        alertas_stock = list(database.v_alerta_stock_critico.find())
    except PyMongoError:
        alertas_stock = []

    try:
        resumen_zonas = list(database.v_resumen_despacho_zonas.find())
    except PyMongoError:
        resumen_zonas = []

    try:
        liquidacion_repartidores = list(database.v_liquidacion_repartidores.find())
    except PyMongoError:
        liquidacion_repartidores = []

    return {
        "productos": productos,
        "clientes": clientes,
        "movimientos": movimientos,
        "alertas_stock": alertas_stock,
        "resumen_zonas": resumen_zonas,
        "liquidacion_repartidores": liquidacion_repartidores,
    }


@app.get("/")
def inicio():
    try:
        database = db.conectar()
        datos = leer_datos(database)
    except Exception as e:
        usuario, _ = db.obtener_usuario_y_host()
        return (
            render_template(
                "error.html",
                mensaje=str(e),
                usuario=usuario,
                dsn=db.DSN,
                mongo_uri=db.uri_enmascarada(),
                mongo_db=db.MONGO_DB,
                es_cloud=db.es_cloud(),
            ),
            500,
        )

    usuario, _ = db.obtener_usuario_y_host()
    return render_template(
        "index.html",
        **datos,
        usuario=usuario,
        dsn=db.DSN,
        mongo_db=db.MONGO_DB,
        es_cloud=db.es_cloud(),
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
        database = db.conectar()
        try:
            id_pedido = db.sp_crear_pedido(database, id_cliente, codigo, cantidad)
            flash(
                f"Pedido N° {id_pedido} creado en MongoDB. "
                f"Se descontaron {cantidad} unidad(es) de {codigo} y se registró el movimiento de stock.",
                "ok",
            )
            resaltar = codigo
        except db.ErrorNegocio as e:
            flash(f"No se pudo crear el pedido (ERR-{e.code}): {e.message}", "error")
        except PyMongoError as e:
            flash(f"Error de validación o base de datos MongoDB: {e}", "error")
    except Exception as e:
        flash(f"No se pudo conectar a MongoDB: {e}", "error")

    destino = url_for("inicio", resaltar=resaltar) if resaltar else url_for("inicio")
    return redirect(destino + "#pedido")


if __name__ == "__main__":
    url = f"http://localhost:{PUERTO}"
    print("=" * 52)
    print("  EL VOLCÁN - versión web (MongoDB)")
    print(f"  Abre {url} en tu navegador")
    print("  Para detenerlo cierra esta ventana o presiona Ctrl+C")
    print("=" * 52)
    threading.Timer(1.2, lambda: webbrowser.open(url)).start()
    app.run(host="0.0.0.0", port=PUERTO, debug=False)
