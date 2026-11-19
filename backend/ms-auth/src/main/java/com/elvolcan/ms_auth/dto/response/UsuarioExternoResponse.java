package com.elvolcan.ms_auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioExternoResponse {

    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String rut;
    private String telefono;
    private String direccion;
    private String comuna;
    private String rol;
}
