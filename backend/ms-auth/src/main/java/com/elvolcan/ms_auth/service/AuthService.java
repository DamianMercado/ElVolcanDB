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

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    public static final ZoneId ZONA_CHILE = ZoneId.of("America/Santiago");

    private final SesionAuthRepository sesionAuthRepository;
    private final AuthMapper authMapper;
    private final UsuarioClient usuarioClient;
    private final JwtUtil jwtUtil;

    public AuthResponse login(LoginRequest request) {
        if (request.getEmail() != null) {
            request.setEmail(request.getEmail().trim().toLowerCase());
        }
        log.info("Iniciando sesión con JWT en ms-auth para el correo: {}", request.getEmail());

        UsuarioExternoResponse usuario;
        try {
            usuario = usuarioClient.validarCredenciales(request);
        } catch (Exception e) {
            log.error("Error al validar credenciales contra ms-usuario: {}", e.getMessage());
            throw new IllegalArgumentException("Correo o contraseña incorrectos");
        }

        return generarSesionJwtParaUsuario(usuario);
    }

    public AuthResponse recuperarClave(LoginRequest request) {
        if (request.getEmail() != null) {
            request.setEmail(request.getEmail().trim().toLowerCase());
        }
        log.info("Recuperando/actualizando contraseña en ms-auth para: {}", request.getEmail());
        UsuarioExternoResponse usuario;
        try {
            usuario = usuarioClient.recuperarClave(request);
        } catch (Exception e) {
            log.error("Error al restablecer contraseña en ms-usuario: {}", e.getMessage());
            throw new IllegalArgumentException("No se encontró una cuenta con el correo indicado o no se pudo actualizar la clave");
        }

        // Revocar sesiones activas previas tras cambio de contraseña por seguridad
        revocarSesionesActivasUsuario(usuario.getId());
        return generarSesionJwtParaUsuario(usuario);
    }

    public AuthResponse registrarYAutenticar(RegistroAuthRequest request) {
        if (request.getEmail() != null) {
            request.setEmail(request.getEmail().trim().toLowerCase());
        }
        log.info("Registrando nuevo usuario desde ms-auth: {}", request.getEmail());

        if (request.getRol() == null || request.getRol().isBlank()) {
            request.setRol("CLIENTE");
        }

        UsuarioExternoResponse usuarioCreado;
        try {
            usuarioCreado = usuarioClient.registrarUsuario(request);
        } catch (Exception e) {
            log.error("Error al registrar usuario en ms-usuario: {}", e.getMessage());
            throw new IllegalArgumentException("No se pudo registrar el usuario: " + extraerMensajeLimpio(e.getMessage()));
        }

        return generarSesionJwtParaUsuario(usuarioCreado);
    }

    private void revocarSesionesActivasUsuario(Long idUsuario) {
        if (idUsuario == null) {
            return;
        }
        List<SesionAuth> activas = sesionAuthRepository.findByIdUsuarioAndEstado(idUsuario, EstadoSesion.ACTIVA);
        if (!activas.isEmpty()) {
            for (SesionAuth sesion : activas) {
                sesion.setEstado(EstadoSesion.CERRADA);
            }
            sesionAuthRepository.saveAll(activas);
            log.info("Revocadas {} sesiones activas previas del usuario ID {}", activas.size(), idUsuario);
        }
    }

    private String extraerMensajeLimpio(String raw) {
        if (raw == null || raw.isBlank()) {
            return "Verifica que el correo y RUT no estén registrados.";
        }
        if (raw.contains("ya está registrado")) {
            int idx = raw.indexOf("El ");
            if (idx >= 0) {
                String recorte = raw.substring(idx);
                int fin = recorte.indexOf("\"");
                return fin > 0 ? recorte.substring(0, fin) : recorte;
            }
        }
        return raw;
    }

    private AuthResponse generarSesionJwtParaUsuario(UsuarioExternoResponse usuario) {
        ZonedDateTime ahoraChile = ZonedDateTime.now(ZONA_CHILE);
        ZonedDateTime expiracionChile = ahoraChile.plus(Duration.ofMillis(jwtUtil.getExpirationMs()));
        LocalDateTime ahora = ahoraChile.toLocalDateTime();
        LocalDateTime expiracion = expiracionChile.toLocalDateTime();

        String nombre = usuario.getNombre() != null ? usuario.getNombre().trim() : "";
        String apellido = usuario.getApellido() != null ? usuario.getApellido().trim() : "";
        String nombreCompleto = (nombre + " " + apellido).trim();
        String jwtToken = jwtUtil.generarToken(usuario);

        SesionAuth sesion = SesionAuth.builder()
                .idUsuario(usuario.getId())
                .nombre(nombre)
                .apellido(apellido)
                .nombreUsuario(nombreCompleto)
                .email(usuario.getEmail())
                .rut(usuario.getRut())
                .telefono(usuario.getTelefono())
                .direccion(usuario.getDireccion())
                .comuna(usuario.getComuna())
                .rol(usuario.getRol())
                .token(jwtToken)
                .fechaInicio(ahora)
                .fechaExpiracion(expiracion)
                .fechaInicioChile(ahoraChile.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
                .fechaExpiracionChile(expiracionChile.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
                .zonaHoraria(ZONA_CHILE.getId())
                .estado(EstadoSesion.ACTIVA)
                .build();

        SesionAuth guardada = sesionAuthRepository.save(sesion);
        log.info("Sesión JWT creada en ms-auth (ID sesión: {}, ID usuario: {}, hora Chile: {})",
                guardada.getId(), guardada.getIdUsuario(), guardada.getFechaInicioChile());
        return authMapper.toResponse(guardada);
    }

    public ValidacionAuthResponse validarToken(String token) {
        log.info("Validando token JWT en ms-auth");

        if (token == null || token.isBlank()) {
            return ValidacionAuthResponse.builder()
                    .valido(false)
                    .mensaje("Token JWT vacío o no proporcionado")
                    .build();
        }

        String tokenLimpio = token.replace("Bearer ", "").trim();
        LocalDateTime ahoraChile = LocalDateTime.now(ZONA_CHILE);

        // 1. Verificar firma criptográfica JWT si es un JWT estándar (contiene 2 puntos)
        if (tokenLimpio.chars().filter(ch -> ch == '.').count() == 2) {
            if (!jwtUtil.validarTokenCriptografico(tokenLimpio)) {
                sesionAuthRepository.findByToken(tokenLimpio).ifPresent(s -> {
                    if (s.getEstado() == EstadoSesion.ACTIVA) {
                        s.setEstado(EstadoSesion.EXPIRADA);
                        sesionAuthRepository.save(s);
                    }
                });
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
                if (sesion.getFechaExpiracion() != null && sesion.getFechaExpiracion().isBefore(ahoraChile)) {
                    sesion.setEstado(EstadoSesion.EXPIRADA);
                    sesionAuthRepository.save(sesion);
                    return ValidacionAuthResponse.builder()
                            .valido(false)
                            .idUsuario(sesion.getIdUsuario())
                            .email(sesion.getEmail())
                            .rol(sesion.getRol())
                            .token(tokenLimpio)
                            .mensaje("La sesión JWT ha expirado")
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

        // 2. Respaldo para sesiones registradas en colección sesion_auth
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

        if (sesion.getFechaExpiracion() != null && sesion.getFechaExpiracion().isBefore(ahoraChile)) {
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

    public ValidacionAuthResponse validarUsuarioAutenticado(Long idUsuario) {
        log.info("Validando usuario ID {} en ms-auth", idUsuario);

        LocalDateTime ahoraChile = LocalDateTime.now(ZONA_CHILE);
        List<SesionAuth> sesionesActivas = sesionAuthRepository.findByIdUsuarioAndEstado(idUsuario, EstadoSesion.ACTIVA);
        for (SesionAuth sesion : sesionesActivas) {
            if (sesion.getFechaExpiracion() == null || !sesion.getFechaExpiracion().isBefore(ahoraChile)) {
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

    public AuthResponse cerrarSesion(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Debe proporcionar un token para cerrar sesión");
        }
        String tokenLimpio = token.replace("Bearer ", "").trim();
        Optional<SesionAuth> sesionOpt = sesionAuthRepository.findByToken(tokenLimpio);

        if (sesionOpt.isEmpty()) {
            log.info("Logout solicitado para token sin sesión activa en BD; se responde cierre idempotente.");
            return AuthResponse.builder()
                    .token(tokenLimpio)
                    .estado(EstadoSesion.CERRADA)
                    .zonaHoraria(ZONA_CHILE.getId())
                    .build();
        }

        SesionAuth sesion = sesionOpt.get();
        sesion.setEstado(EstadoSesion.CERRADA);
        SesionAuth actualizada = sesionAuthRepository.save(sesion);
        log.info("Sesión ID {} (usuario {}) marcada como CERRADA", actualizada.getId(), actualizada.getIdUsuario());
        return authMapper.toResponse(actualizada);
    }

    public List<AuthResponse> obtenerTodasLasSesiones() {
        return authMapper.toResponseList(sesionAuthRepository.findAll());
    }

    public AuthResponse obtenerSesionPorId(Long id) {
        SesionAuth sesion = sesionAuthRepository.findById(id)
                .orElseThrow(() -> new SesionNoEncontradaException(id));
        return authMapper.toResponse(sesion);
    }
}
