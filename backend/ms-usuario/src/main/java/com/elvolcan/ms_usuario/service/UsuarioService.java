package com.elvolcan.ms_usuario.service;

import com.elvolcan.ms_usuario.client.AuthClient;
import com.elvolcan.ms_usuario.dto.request.CredencialesRequest;
import com.elvolcan.ms_usuario.dto.request.UsuarioRequest;
import com.elvolcan.ms_usuario.dto.response.UsuarioResponse;
import com.elvolcan.ms_usuario.enums.RolUsuario;
import com.elvolcan.ms_usuario.exception.UsuarioNoEncontradoException;
import com.elvolcan.ms_usuario.mapper.UsuarioMapper;
import com.elvolcan.ms_usuario.model.Usuario;
import com.elvolcan.ms_usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private static final Logger log = LoggerFactory.getLogger(UsuarioService.class);

    private final UsuarioRepository usuarioRepository;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthClient authClient;

    private String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    public void verificarTokenSiPresente(String authHeader) {
        if (authHeader != null && !authHeader.isBlank()) {
            String token = authHeader.replace("Bearer ", "").trim();
            if (token.isBlank() || "null".equalsIgnoreCase(token) || "undefined".equalsIgnoreCase(token)) {
                throw new SecurityException("Token inválido o vacío");
            }
            try {
                Map<String, Object> resultado = authClient.validarToken(token);
                if (resultado == null || !Boolean.TRUE.equals(resultado.get("valido"))) {
                    throw new SecurityException("Token inválido o expirado según ms-auth");
                }
            } catch (SecurityException e) {
                throw e;
            } catch (Exception e) {
                log.warn("No se pudo verificar token contra ms-auth: {}", e.getMessage());
            }
        }
    }

    public List<UsuarioResponse> obtenerTodos() {
        log.info("Obteniendo todos los usuarios");
        return usuarioMapper.toResponseList(usuarioRepository.findAll());
    }

    public UsuarioResponse obtenerPorId(Long id) {
        log.info("Buscando usuario con ID: {}", id);
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado con ID: " + id));
        return usuarioMapper.toResponse(usuario);
    }

    public UsuarioResponse obtenerPorEmail(String email) {
        String emailNormalizado = normalizarEmail(email);
        log.info("Buscando usuario con email: {}", emailNormalizado);
        Usuario usuario = usuarioRepository.findByEmail(emailNormalizado)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado con email: " + emailNormalizado));
        return usuarioMapper.toResponse(usuario);
    }

    public UsuarioResponse obtenerPorRut(String rut) {
        String rutLimpio = rut != null ? rut.trim() : "";
        log.info("Buscando usuario con RUT: {}", rutLimpio);
        Usuario usuario = usuarioRepository.findByRut(rutLimpio)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado con RUT: " + rutLimpio));
        return usuarioMapper.toResponse(usuario);
    }

    public List<UsuarioResponse> obtenerPorRol(RolUsuario rol) {
        log.info("Buscando usuarios por rol: {}", rol);
        return usuarioMapper.toResponseList(usuarioRepository.findByRol(rol));
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        String emailNormalizado = normalizarEmail(request.getEmail());
        String rutLimpio = request.getRut() != null ? request.getRut().trim() : "";

        log.info("Creando usuario con email: {} - Rol: {}",
                emailNormalizado,
                request.getRol() != null ? request.getRol().getValor() : "null");

        if (usuarioRepository.existsByEmail(emailNormalizado)) {
            throw new IllegalArgumentException("El email '" + emailNormalizado + "' ya está registrado");
        }

        if (!rutLimpio.isBlank() && usuarioRepository.existsByRut(rutLimpio)) {
            throw new IllegalArgumentException("El RUT '" + rutLimpio + "' ya está registrado");
        }

        Usuario usuario = usuarioMapper.toEntity(request);
        usuario.setEmail(emailNormalizado);
        usuario.setRut(rutLimpio.isBlank() ? null : rutLimpio);
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        if (usuario.getActivo() == null) {
            usuario.setActivo(true);
        }

        Usuario guardado = usuarioRepository.save(usuario);
        log.info("Usuario creado correctamente con ID: {} - Rol: {}",
                guardado.getId(),
                guardado.getRol() != null ? guardado.getRol().getValor() : "null");

        return usuarioMapper.toResponse(guardado);
    }

    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioRequest request) {
        log.info("Actualizando usuario con ID: {}", id);

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado con ID: " + id));

        usuario.setNombre(request.getNombre());
        usuario.setApellido(request.getApellido());
        usuario.setEmail(normalizarEmail(request.getEmail()));
        usuario.setRut(request.getRut() != null ? request.getRut().trim() : usuario.getRut());
        usuario.setTelefono(request.getTelefono());
        usuario.setDireccion(request.getDireccion());
        usuario.setComuna(request.getComuna());
        usuario.setRol(request.getRol());

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        Usuario actualizado = usuarioRepository.save(usuario);
        return usuarioMapper.toResponse(actualizado);
    }

    @Transactional
    public void eliminar(Long id) {
        log.info("Eliminando usuario con ID: {}", id);
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado con ID: " + id));
        usuarioRepository.delete(usuario);
    }

    @Transactional
    public UsuarioResponse validarCredenciales(CredencialesRequest request) {
        String emailNormalizado = normalizarEmail(request.getEmail());
        log.info("Validando credenciales para email: {}", emailNormalizado);
        Usuario usuario = usuarioRepository.findByEmail(emailNormalizado)
                .orElseThrow(() -> new IllegalArgumentException("Correo o contraseña incorrectos"));

        boolean esBcrypt = usuario.getPassword() != null && usuario.getPassword().startsWith("$2");
        boolean coincide = esBcrypt
                ? passwordEncoder.matches(request.getPassword(), usuario.getPassword())
                : request.getPassword() != null && request.getPassword().equals(usuario.getPassword());

        if (!coincide) {
            throw new IllegalArgumentException("Correo o contraseña incorrectos");
        }

        // Migración transparente: si la contraseña legacy estaba en texto plano, cifrarla con BCrypt
        if (!esBcrypt) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
            usuarioRepository.save(usuario);
            log.info("Contraseña legacy del usuario ID {} migrada automáticamente a BCrypt", usuario.getId());
        }

        return usuarioMapper.toResponse(usuario);
    }

    @Transactional
    public UsuarioResponse actualizarPasswordPorEmail(CredencialesRequest request) {
        String emailNormalizado = normalizarEmail(request.getEmail());
        log.info("Restableciendo contraseña para email: {}", emailNormalizado);
        Usuario usuario = usuarioRepository.findByEmail(emailNormalizado)
                .orElseThrow(() -> new UsuarioNoEncontradoException("No existe una cuenta registrada con el correo: " + emailNormalizado));

        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        Usuario actualizado = usuarioRepository.save(usuario);
        return usuarioMapper.toResponse(actualizado);
    }

    public boolean validarCliente(Long id) {
        try {
            return obtenerPorId(id).getRol() == RolUsuario.CLIENTE;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean validarOperador(Long id) {
        try {
            return obtenerPorId(id).getRol() == RolUsuario.OPERADOR;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean validarAdministrador(Long id) {
        try {
            return obtenerPorId(id).getRol() == RolUsuario.ADMIN;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean validarRepartidor(Long id) {
        try {
            return obtenerPorId(id).getRol() == RolUsuario.REPARTIDOR;
        } catch (Exception e) {
            return false;
        }
    }

    public String obtenerRolPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado con ID: " + id));
        return usuario.getRol() != null ? usuario.getRol().getValor() : "null";
    }
}
