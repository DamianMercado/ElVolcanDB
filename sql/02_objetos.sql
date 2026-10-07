-- ============================================================
--  EL VOLCAN - Objetos PL/SQL
--  1 FUNCION  +  1 PACKAGE  +  1 TRIGGER
-- ============================================================


-- ============================================================
-- 1) FUNCION ALMACENADA
--    Devuelve el stock disponible de un producto.
--    Si el producto no existe devuelve -1 (no revienta el programa).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_stock_disponible (
    p_cod_producto IN VARCHAR2
) RETURN NUMBER
IS
    v_stock NUMBER;
BEGIN
    SELECT stock_actual
      INTO v_stock
      FROM PRODUCTO
     WHERE cod_producto = p_cod_producto;

    RETURN v_stock;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN -1;
END fn_stock_disponible;
/


-- ============================================================
-- 2) PACKAGE
--    Agrupa lo relacionado con pedidos: crear uno y sumar
--    cuanto ha comprado un cliente.
-- ============================================================

-- ---------- Especificacion (lo que se ve desde afuera) ----------
CREATE OR REPLACE PACKAGE pkg_pedidos IS

    PROCEDURE sp_crear_pedido (
        p_id_cliente   IN  NUMBER,
        p_cod_producto IN  VARCHAR2,
        p_cantidad     IN  NUMBER,
        p_id_pedido    OUT NUMBER
    );

    FUNCTION fn_total_cliente (p_id_cliente IN NUMBER) RETURN NUMBER;

END pkg_pedidos;
/

-- ---------- Cuerpo (la implementacion) ----------
CREATE OR REPLACE PACKAGE BODY pkg_pedidos IS

    PROCEDURE sp_crear_pedido (
        p_id_cliente   IN  NUMBER,
        p_cod_producto IN  VARCHAR2,
        p_cantidad     IN  NUMBER,
        p_id_pedido    OUT NUMBER
    ) IS
        v_precio NUMBER;
        v_stock  NUMBER;
        v_existe NUMBER;
    BEGIN
        -- Validacion 1: la cantidad debe ser positiva
        IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
            RAISE_APPLICATION_ERROR(-20003, 'La cantidad debe ser mayor que cero.');
        END IF;

        -- Validacion 2: el cliente debe existir
        SELECT COUNT(*) INTO v_existe
          FROM CLIENTE
         WHERE id_cliente = p_id_cliente;

        IF v_existe = 0 THEN
            RAISE_APPLICATION_ERROR(-20004,
                'No existe el cliente ' || p_id_cliente);
        END IF;

        -- Validacion 3: el producto debe existir
        v_stock := fn_stock_disponible(p_cod_producto);
        IF v_stock = -1 THEN
            RAISE_APPLICATION_ERROR(-20002,
                'El producto ' || p_cod_producto || ' no existe.');
        END IF;

        -- Validacion 4: debe haber stock suficiente
        IF v_stock < p_cantidad THEN
            RAISE_APPLICATION_ERROR(-20001,
                'Stock insuficiente de ' || p_cod_producto ||
                '. Disponible: ' || v_stock || ', pedido: ' || p_cantidad);
        END IF;

        SELECT precio INTO v_precio
          FROM PRODUCTO
         WHERE cod_producto = p_cod_producto;

        p_id_pedido := seq_pedido.NEXTVAL;

        INSERT INTO PEDIDO (id_pedido, id_cliente, cod_producto,
                            cantidad, total, estado)
        VALUES (p_id_pedido, p_id_cliente, p_cod_producto,
                p_cantidad, v_precio * p_cantidad, 'PENDIENTE');
        -- Al insertar aqui se dispara solo el trigger trg_descuenta_stock
    END sp_crear_pedido;


    FUNCTION fn_total_cliente (p_id_cliente IN NUMBER) RETURN NUMBER IS
        v_total NUMBER;
    BEGIN
        SELECT NVL(SUM(total), 0)
          INTO v_total
          FROM PEDIDO
         WHERE id_cliente = p_id_cliente
           AND estado <> 'ANULADO';

        RETURN v_total;
    END fn_total_cliente;

END pkg_pedidos;
/


-- ============================================================
-- 3) TRIGGER
--    Cada vez que se inserta un pedido descuenta el stock
--    y deja registrado el movimiento. Nadie lo llama: se
--    ejecuta solo.
-- ============================================================
CREATE OR REPLACE TRIGGER trg_descuenta_stock
AFTER INSERT ON PEDIDO
FOR EACH ROW
DECLARE
    v_stock NUMBER;
BEGIN
    UPDATE PRODUCTO
       SET stock_actual = stock_actual - :NEW.cantidad
     WHERE cod_producto = :NEW.cod_producto
    RETURNING stock_actual INTO v_stock;

    INSERT INTO MOVIMIENTO_STOCK
        (id_movimiento, cod_producto, cantidad, stock_resultante, id_pedido)
    VALUES
        (seq_movimiento.NEXTVAL, :NEW.cod_producto, :NEW.cantidad,
         v_stock, :NEW.id_pedido);
END trg_descuenta_stock;
/
