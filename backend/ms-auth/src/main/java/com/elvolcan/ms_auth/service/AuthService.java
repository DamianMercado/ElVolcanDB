package com.elvolcan.ms_auth.service;

import com.elvolcan.ms_auth.client.UsuarioClient;
import com.elvolcan.ms_auth.dto.request.LoginRequest;
import com.elvolcan.ms_auth.dto.request.RegistroAuthRequest;
import com.elvolcan.ms_auth.dto.response.AuthResponse;
import com.elvolcan.ms_auth.dto.response.UsuarioExternoResponse;
import com.elvolcan.ms_auth.dto.response.ValidacionAuthResponse;
import com.elvolcan.ms_auth.enums.EstadoSesion;
import com.elvolcan.ms_auth.exception.SesionNoEncontradaException;
import com.elvolcan.ms_auth.mapper.AuthMapper;
import com.elvolcan.ms_auth.model.SesionAuth;
import com.elvolcan.ms_auth.repository.SesionAuthRepository;
import com.elvolcan.ms_auth.security.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final SesionAuthRepository sesionAuthRepository;
    private final AuthMapper authMapper;
    private final UsuarioClient usuarioClient;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Iniciando sesión con JWT en ms-auth para el correo: {}", request.getEmail());

        UsuarioExternoResponse usuario;
        try {
            usuario = usuarioClient.validarCredenciales(request);
        } catch (Exception e) {
            log.error("Error al validar credenciales contra ms-usuario: {}", e.getMessage());
            throw new IllegalArgumentException("Credenciales inválidas o usuario no encontrado");
        }

        return generarSesionJwtParaUsuario(usuario);
    }

    @Transactional
    public AuthResponse recuperarClave(LoginRequest request) {
        log.info("Recuperando/actualizando contraseña en ms-auth para: {}", request.getEmail());
        UsuarioExternoResponse usuario;
        try {
            usuario = usuarioClient.recuperarClave(request);
        } catch (Exception e) {
            log.error("Error al restablecer contraseña en ms-usuario: {}", e.getMessage());
            throw new IllegalArgumentException("No se encontró una cuenta con el correo indicado o no se pudo actualizar la clave");
        }
        return generarSesionJwtParaUsuario(usuario);
    }

    @Transactional
    public AuthResponse registrarYAutenticar(RegistroAuthRequest request) {
        log.info("Registrando nuevo usuario desde ms-auth: {}", request.getEmail());

        if (request.getRol() == null || request.getRol().isBlank()) {
            request.setRol("CLIENTE");
        }

        UsuarioExternoResponse usuarioCreado;
        try {
            usuarioCreado = usuarioClient.registrarUsuario(request);
        } catch (Exception e) {
            log.error("Error al registrar usuario en ms-usuario: {}", e.getMessage());
            throw new IllegalArgumentException("No se pudo registrar el usuario: " + e.getMessage());
        }

        return generarSesionJwtParaUsuario(usuarioCreado);
    }

    private AuthResponse generarSesionJwtParaUsuario(UsuarioExternoResponse usuario) {
        LocalDateTime ahora = LocalDateTime.now();
        String nombreCompleto = (usuario.getNombre() + " " + usuario.getApellido()).trim();
        String jwtToken = jwtUtil.generarToken(
                usuario.getId(),
                nombreCompleto,
                usuario.getEmail(),
                usuario.getRol()
        );

        SesionAuth sesion = SesionAuth.builder()
                .idUsuario(usuario.getId())
                .nombreUsuario(nombreCompleto)
                .email(usuario.getEmail())
                .rol(usuario.getRol())
                .token(jwtToken)
                .fechaInicio(ahora)
                .fechaExpiracion(ahora.plusHours(24))
                .estado(EstadoSesion.ACTIVA)
                .build();

        SesionAuth guardada = sesionAuthRepository.save(sesion);
        log.info("Sesión JWT creada exitosamente en ms-auth con ID: {}", guardada.getId());
        return authMapper.toResponse(guardada);
    }

    @Transactional
    public ValidacionAuthResponse validarToken(String token) {
        log.info("Validando token JWT en ms-auth");

        if (token == null || token.isBlank()) {
            return ValidacionAuthResponse.builder()
                    .valido(false)
                    .mensaje("Token JWT vacío o no proporcionado")
                    .build();
        }

        String tokenLimpio = token.replace("Bearer ", "").trim();

        // 1. Verificar firma criptográfica JWT si es un JWT estándar (contiene 2 puntos)
        if (tokenLimpio.chars().filter(ch -> ch == '.').count() == 2) {
            if (!jwtUtil.validarTokenCriptografico(tokenLimpio)) {
                return ValidacionAuthResponse.builder()
                        .valido(false)
                        .token(tokenLimpio)
                        .mensaje("Firma JWT inválida o token expirado")
                        .build();
            }

            Optional<SesionAuth> sesionOpt = sesionAuthRepository.findByToken(tokenLimpio);
            if (sesionOpt.isPresent()) {
                SesionAuth sesion = sesionOpt.get();
                if (sesion.getEstado() != EstadoSesion.ACTIVA) {
                    return ValidacionAuthResponse.builder()
                            .valido(false)
                            .idUsuario(sesion.getIdUsuario())
                            .email(sesion.getEmail())
                            .rol(sesion.getRol())
                            .token(tokenLimpio)
                            .mensaje("La sesión JWT fue cerrada o revocada")
                            .build();
                }
            }

            Claims claims = jwtUtil.extraerClaims(tokenLimpio);
            Number idUsuarioNum = claims.get("idUsuario", Number.class);
            return ValidacionAuthResponse.builder()
                    .valido(true)
                    .idUsuario(idUsuarioNum != null ? idUsuarioNum.longValue() : null)
                    .nombreUsuario(claims.get("nombreUsuario", String.class))
                    .email(claims.getSubject())
                    .rol(claims.get("rol", String.class))
                    .token(tokenLimpio)
                    .mensaje("Token JWT válido y autenticado por ms-auth")
                    .build();
        }

        // 2. Respaldo para sesiones registradas en tabla sesion_auth
        Optional<SesionAuth> sesionOpt = sesionAuthRepository.findByToken(tokenLimpio);
        if (sesionOpt.isEmpty()) {
            return ValidacionAuthResponse.builder()
                    .valido(false)
                    .token(tokenLimpio)
                    .mensaje("Token no encontrado ni es un JWT válido")
                    .build();
        }

        SesionAuth sesion = sesionOpt.get();
        if (sesion.getEstado() != EstadoSesion.ACTIVA) {
            return ValidacionAuthResponse.builder()
                    .valido(false)
                    .idUsuario(sesion.getIdUsuario())
                    .email(sesion.getEmail())
                    .rol(sesion.getRol())
                    .token(sesion.getToken())
                    .mensaje("La sesión no está activa (estado: " + sesion.getEstado().getValor() + ")")
                    .build();
        }

        if (sesion.getFechaExpiracion().isBefore(LocalDateTime.now())) {
            sesion.setEstado(EstadoSesion.EXPIRADA);
            sesionAuthRepository.save(sesion);
            return ValidacionAuthResponse.builder()
                    .valido(false)
                    .idUsuario(sesion.getIdUsuario())
                    .email(sesion.getEmail())
                    .rol(sesion.getRol())
                    .token(sesion.getToken())
                    .mensaje("El token ha expirado")
                    .build();
        }

        return ValidacionAuthResponse.builder()
                .valido(true)
                .idUsuario(sesion.getIdUsuario())
                .nombreUsuario(sesion.getNombreUsuario())
                .email(sesion.getEmail())
                .rol(sesion.getRol())
                .token(sesion.getToken())
                .mensaje("Token válido y autenticado por ms-auth")
                .build();
    }

    @Transactional(readOnly = true)
    public ValidacionAuthResponse validarUsuarioAutenticado(Long idUsuario) {
        log.info("Validando usuario ID {} en ms-auth", idUsuario);

        List<SesionAuth> sesionesActivas = sesionAuthRepository.findByIdUsuarioAndEstado(idUsuario, EstadoSesion.ACTIVA);
        if (!sesionesActivas.isEmpty()) {
            SesionAuth sesion = sesionesActivas.get(0);
            return ValidacionAuthResponse.builder()
                    .valido(true)
                    .idUsuario(sesion.getIdUsuario())
                    .nombreUsuario(sesion.getNombreUsuario())
                    .email(sesion.getEmail())
                    .rol(sesion.getRol())
                    .token(sesion.getToken())
                    .mensaje("Usuario autenticado con sesión JWT activa en ms-auth")
                    .build();
        }

        try {
            UsuarioExternoResponse usuario = usuarioClient.obtenerUsuarioPorId(idUsuario);
            return ValidacionAuthResponse.builder()
                    .valido(true)
                    .idUsuario(usuario.getId())
                    .nombreUsuario((usuario.getNombre() + " " + usuario.getApellido()).trim())
                    .email(usuario.getEmail())
                    .rol(usuario.getRol())
                    .mensaje("Usuario verificado por ms-auth mediante ms-usuario")
                    .build();
        } catch (Exception e) {
            return ValidacionAuthResponse.builder()
                    .valido(false)
                    .idUsuario(idUsuario)
                    .mensaje("Usuario no encontrado o no autenticado: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public AuthResponse cerrarSesion(String token) {
        String tokenLimpio = token.replace("Bearer ", "").trim();
        SesionAuth sesion = sesionAuthRepository.findByToken(tokenLimpio)
                .orElseThrow(() -> new SesionNoEncontradaException("No se encontró sesión con el token JWT indicado"));

        sesion.setEstado(EstadoSesion.CERRADA);
        SesionAuth actualizada = sesionAuthRepository.save(sesion);
        return authMapper.toResponse(actualizada);
    }

    @Transactional(readOnly = true)
    public List<AuthResponse> obtenerTodasLasSesiones() {
        return authMapper.toResponseList(sesionAuthRepository.findAll());
    }

    @Transactional(readOnly = true)
    public AuthResponse obtenerSesionPorId(Long id) {
        SesionAuth sesion = sesionAuthRepository.findById(id)
                .orElseThrow(() -> new SesionNoEncontradaException(id));
        return authMapper.toResponse(sesion);
    }
}
