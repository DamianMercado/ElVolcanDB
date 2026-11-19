package com.elvolcan.ms_pago.enums;

public enum EstadoPago {
    PENDIENTE("PENDIENTE"),
    PAGADO("PAGADO"),
    RECHAZADO("RECHAZADO"),
    REEMBOLSADO("REEMBOLSADO");

    private final String valor;

    EstadoPago(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }
}
