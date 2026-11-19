package com.elvolcan.ms_catalogo.exception;

public class ProductoCatalogoNoEncontradoException extends RuntimeException {

    public ProductoCatalogoNoEncontradoException(String mensaje) {
        super(mensaje);
    }

    public ProductoCatalogoNoEncontradoException(Long id) {
        super("Producto de catálogo no encontrado con ID: " + id);
    }
}
