package com.elvolcan.ms_venta.exception;

public class VentaNoEncontradaException extends RuntimeException {

    public VentaNoEncontradaException(String mensaje) {
        super(mensaje);
    }

    public VentaNoEncontradaException(Long id) {
        super("Venta no encontrada con ID: " + id);
    }
}
