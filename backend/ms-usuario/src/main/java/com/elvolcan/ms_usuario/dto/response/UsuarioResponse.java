package com.elvolcan.ms_usuario.dto.response;

import com.elvolcan.ms_usuario.enums.RolUsuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioResponse {

    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String rut;
    private String telefono;
    private String direccion;
    private String comuna;
    private RolUsuario rol;
}
