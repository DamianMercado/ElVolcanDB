package com.elvolcan.ms_usuario.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RolUsuario {
    ADMIN("ADMIN"),
    CLIENTE("CLIENTE"),
    REPARTIDOR("REPARTIDOR"),
    OPERADOR("OPERADOR");

    private final String valor;

    RolUsuario(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static RolUsuario fromValor(String valor) {
        if (valor == null) return CLIENTE;
        for (RolUsuario r : values()) {
            if (r.valor.equalsIgnoreCase(valor) || r.name().equalsIgnoreCase(valor)) {
                return r;
            }
        }
        if ("ADMINISTRADOR".equalsIgnoreCase(valor)) {
            return ADMIN;
        }
        throw new IllegalArgumentException("Rol de usuario desconocido: " + valor);
    }
}
