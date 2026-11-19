package com.elvolcan.ms_inventario.enums;

public enum EstadoMovimiento {
    PENDIENTE("PENDIENTE"),
    COMPLETADO("COMPLETADO"),
    CANCELADO("CANCELADO");

    private final String valor;

    EstadoMovimiento(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }
}
