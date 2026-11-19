package com.elvolcan.ms_usuario.controller;

import com.elvolcan.ms_usuario.dto.request.CredencialesRequest;
import com.elvolcan.ms_usuario.dto.request.UsuarioRequest;
import com.elvolcan.ms_usuario.dto.response.UsuarioResponse;
import com.elvolcan.ms_usuario.enums.RolUsuario;
import com.elvolcan.ms_usuario.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "Operaciones relacionadas con los usuarios de El Volcán")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    @Operation(summary = "Obtener todos los usuarios")
    @ApiResponse(responseCode = "200", description = "Lista obtenida correctamente")
    public ResponseEntity<List<UsuarioResponse>> obtenerTodos(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        usuarioService.verificarTokenSiPresente(authHeader);
        return ResponseEntity.ok(usuarioService.obtenerTodos());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener usuario por ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuario encontrado"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    public ResponseEntity<UsuarioResponse> obtenerPorId(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        usuarioService.verificarTokenSiPresente(authHeader);
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    @GetMapping("/email/{email}")
    @Operation(summary = "Obtener usuario por email")
    public ResponseEntity<UsuarioResponse> obtenerPorEmail(
            @PathVariable String email,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        usuarioService.verificarTokenSiPresente(authHeader);
        return ResponseEntity.ok(usuarioService.obtenerPorEmail(email));
    }

    @GetMapping("/rut/{rut}")
    @Operation(summary = "Obtener usuario por RUT")
    public ResponseEntity<UsuarioResponse> obtenerPorRut(
            @PathVariable String rut,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        usuarioService.verificarTokenSiPresente(authHeader);
        return ResponseEntity.ok(usuarioService.obtenerPorRut(rut));
    }

    @GetMapping("/rol/{rol}")
    @Operation(summary = "Obtener usuarios por rol")
    public ResponseEntity<List<UsuarioResponse>> obtenerPorRol(
            @PathVariable RolUsuario rol,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        usuarioService.verificarTokenSiPresente(authHeader);
        return ResponseEntity.ok(usuarioService.obtenerPorRol(rol));
    }

    @GetMapping("/{id}/rol")
    @Operation(summary = "Obtener el rol del usuario")
    public ResponseEntity<String> obtenerRol(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerRolPorId(id));
    }

    @PostMapping
    @Operation(summary = "Crear usuario")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Usuario creado correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<UsuarioResponse> crear(
            @Valid @RequestBody UsuarioRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        usuarioService.verificarTokenSiPresente(authHeader);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(usuarioService.crear(request));
    }

    @PostMapping("/validar-credenciales")
    @Operation(summary = "Validar credenciales de usuario (consumido por ms-auth)")
    public ResponseEntity<UsuarioResponse> validarCredenciales(@Valid @RequestBody CredencialesRequest request) {
        return ResponseEntity.ok(usuarioService.validarCredenciales(request));
    }

    @PutMapping("/recuperar-clave")
    @Operation(summary = "Restablecer contraseña de un usuario por correo electrónico")
    public ResponseEntity<UsuarioResponse> recuperarClave(@Valid @RequestBody CredencialesRequest request) {
        return ResponseEntity.ok(usuarioService.actualizarPasswordPorEmail(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar usuario")
    public ResponseEntity<UsuarioResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        usuarioService.verificarTokenSiPresente(authHeader);
        return ResponseEntity.ok(usuarioService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar usuario")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        usuarioService.verificarTokenSiPresente(authHeader);
        usuarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/validar-cliente")
    @Operation(summary = "Validar si el usuario es CLIENTE")
    public ResponseEntity<Boolean> validarCliente(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.validarCliente(id));
    }

    @GetMapping("/{id}/validar-operador")
    @Operation(summary = "Validar si el usuario es OPERADOR")
    public ResponseEntity<Boolean> validarOperador(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.validarOperador(id));
    }

    @GetMapping("/{id}/validar-administrador")
    @Operation(summary = "Validar si el usuario es ADMIN")
    public ResponseEntity<Boolean> validarAdministrador(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.validarAdministrador(id));
    }

    @GetMapping("/{id}/validar-repartidor")
    @Operation(summary = "Validar si el usuario es REPARTIDOR")
    public ResponseEntity<Boolean> validarRepartidor(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.validarRepartidor(id));
    }
}
