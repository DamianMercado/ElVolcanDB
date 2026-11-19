package com.elvolcan.ms_usuario.dto.request;

import com.elvolcan.ms_usuario.enums.RolUsuario;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para crear o actualizar un usuario")
public class UsuarioRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Schema(example = "Juan")
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    @Schema(example = "Pérez")
    private String apellido;

    @NotBlank(message = "La contraseña es obligatoria")
    @Schema(example = "cliente123")
    private String password;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    @Schema(example = "juan@el-volcan.com")
    private String email;

    @NotBlank(message = "El RUT es obligatorio")
    @Schema(example = "12345678-9")
    private String rut;

    @Schema(example = "+56 9 8765 4321")
    private String telefono;

    @Schema(example = "Av. Concha y Toro 1420")
    private String direccion;

    @Schema(example = "Puente Alto")
    private String comuna;

    @NotNull(message = "El rol es obligatorio")
    @Schema(example = "CLIENTE")
    private RolUsuario rol;
}
