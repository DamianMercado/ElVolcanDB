# El Volcán — Frontend Web SPA (React 19 + Vite + Tailwind CSS 4)

Interfaz web de comercio electrónico, administración de catálogo/inventario, consola de repartidor GPS y seguimiento en vivo para **Distribuidora de Gas El Volcán**.

---

## Stack Tecnológico

* **React 19 (`19.2.8`) & React Router DOM 7**: Vistas públicas, protegidas por rol (`ADMIN`, `REPARTIDOR`, `CLIENTE`) y navegación SPA.
* **Vite 8 (`8.3.0`)**: Bundler y servidor de desarrollo con HMR.
* **Tailwind CSS 4 (`4.1.14`)**: Sistema de estilos responsivo con paleta de marca El Volcán y modo mapa estilo Uber.
* **Leaflet (`1.9.4`) + CartoDB + OSRM**: Mapas interactivos en vivo (Positron Día / Dark Matter Noche), trazado real de calles y seguimiento de repartidor sincronizado con `ms-venta`.
* **Vitest 5 + Testing Library + jsdom**: Suite de pruebas unitarias y de componentes.
* **ESLint 10**: Análisis estático con cero errores y advertencias.
* **Docker Multi-Stage + Nginx Alpine**: Empaquetado optimizado con proxy inverso `/api/v1/` y soporte SPA.

---

## Variables de Entorno

Crea un archivo `.env` en `frontend/` (o configúralas en **Render -> Environment**):

| Variable | Obligatoria | Descripción | Ejemplo |
|---|---|---|---|
| `VITE_API_URL` | Sí | URL base del API Gateway sin barra final | `http://<IP_EC2>:8080/api/v1` |
| `VITE_CARTO_API_KEY` | Recomendada | Clave de CARTO Basemaps para mostrar el mapa sin marca de agua | `cb1_...` |

---

## Comandos Principales

```bash
# Instalar dependencias
npm install

# Desarrollo local (http://localhost:5173)
npm run dev

# Análisis de código (ESLint)
npm run lint

# Pruebas unitarias y de integración (Vitest)
npm test

# Compilación de producción (genera carpeta dist/)
npm run build
```

---

## Flujos Principales

1. **Sesiones y Autenticación (`SesionContext` + `ms-auth`)**:
   * Inicio de sesión, registro con auto-autenticación, recuperación de clave, validación de expiración de JWT, cierre automático ante respuestas `401` y revocación en backend al hacer logout.
2. **Compra y Pago (`CreacionPedido` -> `Pago` -> `PedidoCreado`)**:
   * Carrito persistente, selección de dirección guardada del usuario, pago en línea (Webpay simulado vía `ms-pago`) o contra entrega, comprobante imprimible y acceso directo al seguimiento del pedido creado.
3. **Seguimiento en Vivo y Consola Repartidor (`SeguimientoPedido` <-> `Repartidor`)**:
   * Sincronización directa contra `ms-venta` (MongoDB), búsqueda por código de pedido (`EV-101`, etc.), historial de eventos en hora de **Santiago de Chile**, selector de cola real de pedidos para el repartidor y actualización de GPS/estado (`en_camino` -> `llegando` -> `entregado`).
4. **Panel de Administración (`/administradora`)**:
   * CRUD completo de productos, control y reposición de stock, asignación de repartidores, cancelación de pedidos y acceso directo al mapa de seguimiento.
