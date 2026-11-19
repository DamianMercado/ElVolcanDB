package com.elvolcan.ms_auth.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
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
@Schema(description = "Datos para iniciar sesión en El Volcán (acepta email/password o correo/clave)")
public class LoginRequest {

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El formato del correo no es válido")
    @JsonAlias({"correo", "email"})
    @Schema(example = "admin@el-volcan.com")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @JsonAlias({"clave", "password"})
    @Schema(example = "admin123")
    private String password;
}
