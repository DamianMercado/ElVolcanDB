package com.elvolcan.ms_auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidacionAuthResponse {

    private boolean valido;
    private Long idUsuario;
    private String nombreUsuario;
    private String email;
    private String rol;
    private String token;
    private String mensaje;
}
