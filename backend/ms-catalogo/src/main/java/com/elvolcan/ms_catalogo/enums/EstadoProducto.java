package com.elvolcan.ms_catalogo.enums;

public enum EstadoProducto {
    ACTIVO("ACTIVO"),
    INACTIVO("INACTIVO"),
    ELIMINADO("ELIMINADO");

    private final String valor;

    EstadoProducto(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }
}
