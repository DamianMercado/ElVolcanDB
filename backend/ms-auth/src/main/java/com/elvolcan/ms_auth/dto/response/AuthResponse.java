package com.elvolcan.ms_auth.dto.response;

import com.elvolcan.ms_auth.enums.EstadoSesion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private Long id;
    private Long idUsuario;
    private String nombre;
    private String apellido;
    private String nombreUsuario;
    private String email;
    private String rut;
    private String telefono;
    private String direccion;
    private String comuna;
    private String rol;
    private String token;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaExpiracion;
    private String fechaInicioChile;
    private String fechaExpiracionChile;
    private String zonaHoraria;
    private EstadoSesion estado;
}
