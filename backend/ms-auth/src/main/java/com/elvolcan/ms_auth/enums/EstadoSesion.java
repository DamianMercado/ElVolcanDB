package com.elvolcan.ms_auth.enums;

public enum EstadoSesion {
    ACTIVA("ACTIVA"),
    EXPIRADA("EXPIRADA"),
    CERRADA("CERRADA");

    private final String valor;

    EstadoSesion(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }
}
