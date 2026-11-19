package com.elvolcan.ms_usuario.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Credenciales de usuario para validar autenticación")
public class CredencialesRequest {

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    @Schema(example = "admin@el-volcan.com")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Schema(example = "admin123")
    private String password;
}
