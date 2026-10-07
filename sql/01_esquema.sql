-- ============================================================
--  EL VOLCAN - Esquema minimo
--  1 funcion + 1 package + 1 trigger
-- ============================================================

-- ---------- Limpieza (ignora errores la primera vez) ----------
BEGIN EXECUTE IMMEDIATE 'DROP TABLE PEDIDO CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE MOVIMIENTO_STOCK CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE CLIENTE CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE PRODUCTO CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE seq_pedido'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE seq_movimiento'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- ---------- Tablas ----------
CREATE TABLE CLIENTE (
    id_cliente   NUMBER(6)     PRIMARY KEY,
    nombre       VARCHAR2(80)  NOT NULL,
    direccion    VARCHAR2(120) NOT NULL,
    telefono     VARCHAR2(15)
);

CREATE TABLE PRODUCTO (
    cod_producto  VARCHAR2(6)   PRIMARY KEY,
    nombre        VARCHAR2(60)  NOT NULL,
    precio        NUMBER(8)     NOT NULL,
    stock_actual  NUMBER(5)     DEFAULT 0 NOT NULL,
    CONSTRAINT ck_precio CHECK (precio > 0),
    CONSTRAINT ck_stock  CHECK (stock_actual >= 0)
);

CREATE TABLE PEDIDO (
    id_pedido     NUMBER(8)     PRIMARY KEY,
    id_cliente    NUMBER(6)     NOT NULL,
    cod_producto  VARCHAR2(6)   NOT NULL,
    cantidad      NUMBER(4)     NOT NULL,
    total         NUMBER(10)    DEFAULT 0 NOT NULL,
    fecha_pedido  DATE          DEFAULT SYSDATE NOT NULL,
    estado        VARCHAR2(12)  DEFAULT 'PENDIENTE' NOT NULL,
    CONSTRAINT fk_ped_cli  FOREIGN KEY (id_cliente)   REFERENCES CLIENTE,
    CONSTRAINT fk_ped_prod FOREIGN KEY (cod_producto) REFERENCES PRODUCTO,
    CONSTRAINT ck_cantidad CHECK (cantidad > 0),
    CONSTRAINT ck_estado   CHECK (estado IN ('PENDIENTE','ENTREGADO','ANULADO'))
);

-- Tabla que llena el TRIGGER automaticamente
CREATE TABLE MOVIMIENTO_STOCK (
    id_movimiento     NUMBER(8)    PRIMARY KEY,
    cod_producto      VARCHAR2(6)  NOT NULL,
    cantidad          NUMBER(5)    NOT NULL,
    stock_resultante  NUMBER(5)    NOT NULL,
    id_pedido         NUMBER(8),
    fecha_mov         DATE         DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_mov_prod FOREIGN KEY (cod_producto) REFERENCES PRODUCTO
);

-- ---------- Secuencias ----------
CREATE SEQUENCE seq_pedido     START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_movimiento START WITH 1 INCREMENT BY 1 NOCACHE;

-- ---------- Datos de prueba ----------

//Usuarios
INSERT INTO CLIENTE VALUES (1, 'Damian',  'Av. Brasil 1234, Valparaiso', '912341234');
INSERT INTO CLIENTE VALUES (2, 'Isaac','Av. Brasil 1234, Valparaiso',   '912341234');

//Cilindros
INSERT INTO PRODUCTO VALUES ('CL001', 'Cilindro gas licuado 5 kg',  12990, 40);
INSERT INTO PRODUCTO VALUES ('CL002', 'Cilindro gas licuado 11 kg', 23990, 60);
INSERT INTO PRODUCTO VALUES ('CL003', 'Cilindro gas licuado 15 kg', 31990, 25);
INSERT INTO PRODUCTO VALUES ('CL004', 'Cilindro gas licuado 45 kg', 45000, 30);

//Reguladores
INSERT INTO PRODUCTO VALUES ('RG001', 'Regulador doméstico estándar',  8990, 45);
INSERT INTO PRODUCTO VALUES ('RG002', 'Regulador de alta presión',  18990, 12);
INSERT INTO PRODUCTO VALUES ('RG003', 'Regulador dual (2 salidas)', 14990, 18);

//Mangeras y conexiones
INSERT INTO PRODUCTO VALUES ('MG001', 'Manguera gas 1.5 m',          3990, 80);
INSERT INTO PRODUCTO VALUES ('MG002', 'Manguera gas 3 m', 6990, 50);
INSERT INTO PRODUCTO VALUES ('MG003', 'Abrazadera metálica', 990, 200);
INSERT INTO PRODUCTO VALUES ('KC004', 'Kit conexión completo', 12990, 25);


// Accesorios
INSERT INTO PRODUCTO VALUES ('AC001', 'Carro porta cilindro 11/15kg', 10990, 60);
INSERT INTO PRODUCTO VALUES ('AC002', 'Tapa protectora para válvula', 1490, 60);
INSERT INTO PRODUCTO VALUES ('AC003', 'Detector de gas a batería', 19990, 8);

COMMIT;
