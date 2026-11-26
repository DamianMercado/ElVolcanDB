-- ============================================================================
-- El Volcán — Inicialización de Esquemas en Oracle Cloud Autonomous Database
-- ============================================================================
-- Ejecutar conectado como ADMIN en OCI Database Actions (SQL Developer Web)
-- o SQL*Plus. Reemplaza los placeholders <PASSWORD_*> por contraseñas seguras
-- (mínimo 12 caracteres, mayúsculas, minúsculas y números, sin usar el nombre
-- de usuario dentro de la contraseña) y colócalas en backend/.env.
-- ============================================================================

CREATE USER ELVOLCAN_USUARIO IDENTIFIED BY "<PASSWORD_USUARIO>";
CREATE USER ELVOLCAN_INVENTARIO IDENTIFIED BY "<PASSWORD_INVENTARIO>";
CREATE USER ELVOLCAN_PAGO IDENTIFIED BY "<PASSWORD_PAGO>";

-- Privilegios mínimos necesarios para Spring Data JPA + Flyway
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW, CREATE TRIGGER TO ELVOLCAN_USUARIO;
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW, CREATE TRIGGER TO ELVOLCAN_INVENTARIO;
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW, CREATE TRIGGER TO ELVOLCAN_PAGO;

-- Cuota en el tablespace DATA de Oracle Autonomous Database
ALTER USER ELVOLCAN_USUARIO QUOTA UNLIMITED ON DATA;
ALTER USER ELVOLCAN_INVENTARIO QUOTA UNLIMITED ON DATA;
ALTER USER ELVOLCAN_PAGO QUOTA UNLIMITED ON DATA;

-- Verificación rápida
SELECT username, account_status, default_tablespace
FROM dba_users
WHERE username IN ('ELVOLCAN_USUARIO', 'ELVOLCAN_INVENTARIO', 'ELVOLCAN_PAGO')
ORDER BY username;
