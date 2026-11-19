package com.elvolcan.ms_inventario.enums;

public enum EstadoStock {
    OK("OK"),
    BAJO("BAJO"),
    CRITICO("CRITICO"),
    SIN_STOCK("SIN_STOCK");

    private final String valor;

    EstadoStock(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }

    public static EstadoStock calcularEstado(int stockActual, int stockMinimo) {
        if (stockActual <= 0) {
            return SIN_STOCK;
        }
        if (stockActual <= stockMinimo / 2) {
            return CRITICO;
        }
        if (stockActual < stockMinimo) {
            return BAJO;
        }
        return OK;
    }
}
