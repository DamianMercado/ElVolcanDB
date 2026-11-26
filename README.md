# 🌋 El Volcán — Sistema de Venta y Distribución de Gas Licuado

Plataforma integral de comercio electrónico, gestión de inventario y logística de distribución con seguimiento GPS en vivo para **El Volcán**. Construida bajo una **arquitectura distribuida de microservicios con persistencia políglota** combinando **Oracle Cloud Autonomous Database (SQL / JPA / Flyway)** y **MongoDB Atlas (NoSQL / GeoJSON / TTL)** sobre **Java 17 / Spring Boot 3.4**, **Spring Cloud 2024**, **Docker Compose** y un **Frontend SPA en React 19**, con zona horaria oficial unificada en **`America/Santiago`**.

---

## 🏗️ Arquitectura del Sistema

```mermaid
flowchart TB
    subgraph Frontend_Layer ["Frontend (React 19 + Vite 8 + Tailwind CSS 4)"]
        SPA["Cliente Web SPA (Render Static Site / Nginx)<br/>• Catálogo & Carrito<br/>• Seguimiento Cliente (Leaflet) y Consola Repartidor 3D (MapLibre GL)<br/>• Planificador de Rutas Óptimas & Panel Admin"]
    end

    subgraph Gateway_Discovery ["Enrutamiento y Descubrimiento (AWS EC2 / Local)"]
        GW["Spring Cloud Gateway MVC<br/>:8080"]
        EUR["Eureka Service Registry<br/>:8761"]
    end

    subgraph SQL_Services ["Microservicios Transaccionales (Oracle SQL + Flyway)"]
        USU["ms-usuario :8081<br/>Usuarios, BCrypt & Roles"]
        INV["ms-inventario :8083<br/>Stock ACID & Movimientos"]
        PAG["ms-pago :8086<br/>Pasarela Webpay (BigDecimal)"]
    end

    subgraph NoSQL_Services ["Microservicios Documentales (MongoDB Atlas)"]
        AUTH["ms-auth :8082<br/>Sesiones JWT (TTL)"]
        CAT["ms-catalogo :8084<br/>Catálogo de Productos"]
        VEN["ms-venta :8085<br/>Pedidos, Alertas & GPS 2dsphere"]
    end

    subgraph Data_Layer ["Capa de Persistencia Políglota"]
        ORACLE[("Oracle Cloud Autonomous DB 26ai<br/>mTLS Wallet · 3 Esquemas Dedicados")]
        MONGO[("MongoDB Atlas<br/>el_volcan_db · TZ America/Santiago")]
    end

    SPA -->|REST / HTTP| GW
    GW <-->|Registro / Heartbeat| EUR
    GW --> USU & INV & PAG & AUTH & CAT & VEN

    AUTH -. OpenFeign .-> USU
    CAT -. OpenFeign .-> INV
    VEN -. OpenFeign .-> INV & CAT
    PAG -. OpenFeign .-> VEN

    USU & INV & PAG --> ORACLE
    AUTH & CAT & VEN --> MONGO
```

---

## 🛠️ Tecnologías Utilizadas

### 🔹 Backend & Persistencia Políglota
- **Java 17 & Spring Boot 3.4.0** con **Spring Boot Actuator** (`/actuator/health`) en los 8 servicios.
- **Spring Cloud 2024.0.0**: **Netflix Eureka Server**, **Spring Cloud Gateway MVC**, **OpenFeign** y **Spring Cloud LoadBalancer**.
- **Persistencia Relacional (Oracle Cloud ADB 26ai)**: **Spring Data JPA**, **ojdbc11 + oraclepki (mTLS Wallet)** y **Flyway** en `ms-usuario` (`ELVOLCAN_USUARIO`), `ms-inventario` (`ELVOLCAN_INVENTARIO` con `@Version`, bloqueo pesimista `FOR UPDATE` y FK real) y `ms-pago` (`ELVOLCAN_PAGO` con `NUMBER(12,2)` / `BigDecimal`).
- **Persistencia Documental (MongoDB Atlas)**: **Spring Data MongoDB** en `ms-catalogo`, `ms-venta` (pedidos embebidos, alertas en ruta e índices `2dsphere`) y `ms-auth` (sesiones JWT con índice TTL automático).
- **Seguridad**: **JJWT 0.12.6** (tokens firmados y revocación en logout/cambio de clave), **BCrypt** (`Spring Security Crypto`) y Wallet OCI excluida de Git vía `.gitignore`.
- **Herramientas**: **MapStruct 1.5.5**, **Lombok 1.18.34**, **Springdoc OpenAPI 2.8.0 (Swagger UI)** y **Maven Wrapper (`mvnw`)**.

### 🔹 Frontend Moderno (SPA)
- **React 19 (`19.2.8`)**, **Vite 8 (`8.3.0`)**, **React Router DOM 7 (`7.18.4`)** y **Tailwind CSS 4 (`4.1.14`)**.
- **Leaflet (`1.9.4`) + CartoDB + OSRM**: Mapas interactivos y seguimiento sincronizado en vivo con `ms-venta`.
- **Calidad y Testing**: **Vitest 5.0**, **Testing Library** y **ESLint 10** (0 errores).

### 🔹 DevOps, AWS EC2 & Render
- **Docker & Docker Compose** con contenedores Alpine configurados con `tzdata` y `TZ=America/Santiago`.
- **Automatización en AWS EC2**: Scripts `backend/scripts/ec2-userdata-setup.sh` y `backend/scripts/ec2-autodeploy.sh` con servicio `systemd` para arranque automático al iniciar la instancia y tarea `cron` diaria a las **03:00 AM hora de Santiago de Chile** que detecta cambios en GitHub y actualiza contenedores automáticamente.
- **Render Static Site** + **Nginx Multi-Stage Build** para el frontend.

---

## 📂 Estructura del Repositorio

```text
ElVolcanDB/
├── backend/
│   ├── eureka-server/           # Registro de servicios Eureka (:8761)
│   ├── gateway-service/         # Spring Cloud Gateway MVC (:8080)
│   ├── ms-auth/                 # Autenticación, sesiones y JWT (:8082)
│   ├── ms-usuario/              # Usuarios, roles y BCrypt (:8081)
│   ├── ms-catalogo/             # Catálogo de cilindros y accesorios (:8084)
│   ├── ms-inventario/           # Stock y movimientos de bodega (:8083)
│   ├── ms-venta/                # Pedidos, seguimiento GPS en vivo y auditoría (:8085)
│   ├── ms-pago/                 # Pagos Webpay y reembolsos (:8086)
│   ├── mongodb/                 # Datos semilla JSON y script Atlas
│   ├── scripts/                 # Auto-arranque EC2 (systemd) y auto-update 03:00 AM Chile (cron)
│   ├── docker-compose.yml       # Orquestador Docker completo (TZ America/Santiago)
│   └── .env.example             # Plantilla de variables de entorno backend
├── frontend/
│   ├── src/                     # SPA React 19 (components, context, pages, service, __tests__)
│   ├── Dockerfile               # Build multi-stage Nginx
│   ├── nginx.conf               # Reverse proxy y soporte SPA
│   └── .env.example             # Plantilla VITE_API_URL y VITE_CARTO_API_KEY
├── .gitattributes               # Normalización de saltos de línea LF para scripts Linux/EC2
├── .gitignore                   # Protección de credenciales y exclusiones
└── README.md                    # Documentación general del proyecto
```

---

## 🚀 Puesta en Marcha Rápida

### Backend (Local o AWS EC2)
```bash
cd backend
cp .env.example .env
docker compose up --build -d
```

### Auto-arranque y Auto-actualización en AWS EC2 (03:00 AM Chile)
```bash
# En una instancia Ubuntu EC2 (o pegar en User Data al crearla):
sudo bash backend/scripts/ec2-userdata-setup.sh
```

### Frontend (Desarrollo y Pruebas)
```bash
cd frontend
npm install
npm run lint
npm test
npm run dev
```
