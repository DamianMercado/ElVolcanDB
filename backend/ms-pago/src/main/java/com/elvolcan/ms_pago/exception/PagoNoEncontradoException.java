package com.elvolcan.ms_pago.exception;

public class PagoNoEncontradoException extends RuntimeException {

    public PagoNoEncontradoException(String mensaje) {
        super(mensaje);
    }

    public PagoNoEncontradoException(Long id) {
        super("Pago no encontrado con ID: " + id);
    }
}
