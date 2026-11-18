# ElVolcanDB — MongoDB (Atlas Cloud Gratis + MongoDB Compass)

Aplicación web (Flask) y de consola (Python) conectada a **MongoDB (`el_volcan_db`)**, compatible tanto con **MongoDB Atlas Cloud (100% gratis, Tier M0)** para despliegue en la nube (Render/Railway) como con **MongoDB Compass** (conectado a Atlas o a un servidor local).

## Estructura del Proyecto

```
ElVolcanDB/
├── 1_zonas_despacho.json        Datos de zonas de despacho
├── 2_productos.json             Catálogo de cilindros, reguladores, mangueras y accesorios
├── 3_clientes.json              Clientes residenciales y comerciales (con GeoJSON 2dsphere)
├── 4_repartidores.json          Repartidores y ubicación GPS (GeoJSON 2dsphere)
├── 5_pedidos.json               Pedidos con líneas embebidas, pago y auditoría
├── 6_movimientos_stock.json     Historial de movimientos de stock
├── volcan_mongodb_setup.js      Script original para mongosh en MongoDB Compass
├── setup_mongodb.py             Script automático en Python (crea esquema, vistas e importa los 6 JSON)
├── db.py                        Conexión PyMongo y lógica de negocio NoSQL
├── web.py                       Servidor web Flask (http://localhost:5000)
├── app.py                       Aplicación de consola interactiva
├── templates/  static/          Interfaz web
├── .env.example.env             Plantilla de variables de entorno (renombrar a .env)
└── requirements.txt             Dependencias Python (pymongo, dnspython, flask, gunicorn)
```

## Cómo conectar MongoDB Atlas (Cloud 100% Gratis)

1. Crea una cuenta gratuita en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) (no pide tarjeta de crédito).
2. Crea un cluster seleccionando la opción **M0 Free (512 MB, Gratis para siempre)**.
3. En **Database Access**, crea un usuario y contraseña (ej. `volcan_user` / `TuClave123`).
4. En **Network Access**, haz clic en **Add IP Address** y selecciona **Allow Access from Anywhere (`0.0.0.0/0`)** (necesario para que Render y tu PC puedan conectarse).
5. Haz clic en **Connect** → **Drivers** (o **Compass**) y copia tu cadena de conexión:
   ```
   mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
6. Crea un archivo llamado `.env` en la raíz del proyecto con:
   ```env
   MONGO_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   MONGO_DB=el_volcan_db
   AUTO_SEED_MONGODB=true
   ```

## Cómo importar los datos y estructura (2 opciones)

### Opción A: Automática desde Python (Recomendada)
Con `AUTO_SEED_MONGODB=true`, la primera vez que inicies `web.py`, `app.py` o ejecutes:
```bash
python setup_mongodb.py
```
El proyecto creará automáticamente en tu MongoDB Atlas (o local) las **6 colecciones con validación `$jsonSchema`**, los **índices `2dsphere` y `unique`**, las **3 vistas calculadas** (`v_alerta_stock_critico`, `v_resumen_despacho_zonas`, `v_liquidacion_repartidores`) e **importará los 6 archivos `.json`**.

Para reiniciar la base de datos a su estado original en cualquier momento:
```bash
python setup_mongodb.py --reset
```

### Opción B: Manual desde MongoDB Compass
También puedes pegar tu misma URL `mongodb+srv://...` de Atlas en **MongoDB Compass**:
1. Abre la consola **`>_ MONGOSH`** abajo en Compass y pega el contenido de `volcan_mongodb_setup.js`.
2. Entra a cada una de las 6 colecciones creadas y usa **ADD DATA → Import JSON or CSV file** para cargar del `1_zonas_despacho.json` al `6_movimientos_stock.json`.

## Despliegue gratuito en Render

1. Sube este repositorio a GitHub.
2. En **Render**, crea un **Web Service** conectado a tu repositorio:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn web:app`
3. En la pestaña **Environment** de Render, agrega la variable:
   - `MONGO_URI`: tu cadena `mongodb+srv://...` de MongoDB Atlas.
   - `MONGO_DB`: `el_volcan_db`
   - `AUTO_SEED_MONGODB`: `true`
