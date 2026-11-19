package com.elvolcan.ms_auth.exception;

public class SesionNoEncontradaException extends RuntimeException {

    public SesionNoEncontradaException(String mensaje) {
        super(mensaje);
    }

    public SesionNoEncontradaException(Long id) {
        super("Sesión de autenticación no encontrada con ID: " + id);
    }
}
