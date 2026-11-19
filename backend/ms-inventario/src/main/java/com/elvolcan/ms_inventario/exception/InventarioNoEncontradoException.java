package com.elvolcan.ms_inventario.exception;

public class InventarioNoEncontradoException extends RuntimeException {

    public InventarioNoEncontradoException(String mensaje) {
        super(mensaje);
    }

    public InventarioNoEncontradoException(Long id) {
        super("Registro de inventario no encontrado con ID: " + id);
    }
}
