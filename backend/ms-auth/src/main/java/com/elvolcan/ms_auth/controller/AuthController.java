package com.elvolcan.ms_auth.controller;

import com.elvolcan.ms_auth.dto.request.LoginRequest;
import com.elvolcan.ms_auth.dto.request.RegistroAuthRequest;
import com.elvolcan.ms_auth.dto.response.AuthResponse;
import com.elvolcan.ms_auth.dto.response.ValidacionAuthResponse;
import com.elvolcan.ms_auth.service.AuthService;
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
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación (ms-auth)", description = "Operaciones de login, registro y validación de autenticación para todos los microservicios")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión y obtener token de autenticación")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Inicio de sesión exitoso"),
            @ApiResponse(responseCode = "401", description = "Credenciales inválidas")
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/recuperar-clave")
    @Operation(summary = "Restablecer contraseña por correo electrónico")
    public ResponseEntity<AuthResponse> recuperarClave(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.recuperarClave(request));
    }

    @PostMapping("/registro")
    @Operation(summary = "Registrar un nuevo usuario y generar sesión autenticada")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Usuario registrado y autenticado"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<AuthResponse> registrar(@Valid @RequestBody RegistroAuthRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.registrarYAutenticar(request));
    }

    @GetMapping("/validar")
    @Operation(summary = "Validar un token de autenticación (acepta parámetro token o cabecera Authorization)")
    public ResponseEntity<ValidacionAuthResponse> validarToken(
            @RequestParam(value = "token", required = false) String token,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String tokenEfectivo = (token != null && !token.isBlank()) ? token : authHeader;
        return ResponseEntity.ok(authService.validarToken(tokenEfectivo));
    }

    @GetMapping("/validar-usuario/{idUsuario}")
    @Operation(summary = "Validar si un usuario está autenticado/activo ante ms-auth")
    public ResponseEntity<ValidacionAuthResponse> validarUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(authService.validarUsuarioAutenticado(idUsuario));
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesión invalidando el token (acepta parámetro token o cabecera Authorization)")
    public ResponseEntity<AuthResponse> logout(
            @RequestParam(value = "token", required = false) String token,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String tokenEfectivo = (token != null && !token.isBlank()) ? token : authHeader;
        return ResponseEntity.ok(authService.cerrarSesion(tokenEfectivo));
    }

    @GetMapping("/sesiones")
    @Operation(summary = "Listar todas las sesiones de autenticación")
    public ResponseEntity<List<AuthResponse>> listarSesiones() {
        return ResponseEntity.ok(authService.obtenerTodasLasSesiones());
    }

    @GetMapping("/sesiones/{id}")
    @Operation(summary = "Obtener sesión por ID")
    public ResponseEntity<AuthResponse> obtenerSesionPorId(@PathVariable Long id) {
        return ResponseEntity.ok(authService.obtenerSesionPorId(id));
    }
}
