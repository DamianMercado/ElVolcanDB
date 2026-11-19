package com.elvolcan.ms_venta.enums;

public enum EstadoVenta {
    PENDIENTE("Pendiente"),
    EN_RUTA("En ruta"),
    ENTREGADO("Entregado"),
    CANCELADA("Cancelada");

    private final String valor;

    EstadoVenta(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }
}
