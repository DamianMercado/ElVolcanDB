package com.elvolcan.ms_inventario.enums;

public enum TipoMovimiento {
    ENTRADA("ENTRADA"),
    SALIDA("SALIDA"),
    AJUSTE("AJUSTE"),
    SOLICITUD_REPOSICION("SOLICITUD_REPOSICION");

    private final String valor;

    TipoMovimiento(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }
}
