# ElVolcanDB
## Archivos

```
volcan_web/
├── sql/
│   ├── 01_esquema.sql           Tablas, secuencias y datos de prueba
│   └── 02_objetos.sql           Función, package y trigger
├── wallet/                      Aquí va el contenido de tu Wallet_xxxx.zip
├── templates/  static/          Página web
├── db.py                        Datos de conexión  <-- EDITAR
├── web.py                       Versión navegador (localhost:5000)
├── app.py                       Versión terminal (menú)
├── iniciar.bat                  Doble clic: abre la versión navegador
├── instalar_dependencias.bat    Doble clic: instala oracledb y flask (una vez)
└── requirements.txt
```

## Paso a paso

1. **Copiar el wallet**: descomprime `Wallet_xxxx.zip` dentro de la carpeta `wallet`.
2. **Agregar variables de entorno**: en `.env.example` y camiar el nombre del archivo a `.env`. si no tienes wallet de oracle crear instancia de base de datos autonoma y crear wallet y usarla.
3. **Instalar dependencias** (una sola vez): doble clic en `instalar_dependencias.bat`.
4. **Abrir la página**: doble clic en `iniciar.bat`. Se abre `http://localhost:5000`.
   La ventana negra que aparece es el servidor: déjala abierta mientras usas la página.

Versión terminal (opcional): `python app.py`.

## Qué objeto PL/SQL usa cada parte de la página

| Sección | Objeto |
|---|---|
| Productos y stock | Función `fn_stock_disponible` |
| Crear pedido | `pkg_pedidos.sp_crear_pedido` (+ trigger) |
| Total por cliente | `pkg_pedidos.fn_total_cliente` |
| Movimientos de stock | Filas creadas por el trigger `trg_descuenta_stock` |
