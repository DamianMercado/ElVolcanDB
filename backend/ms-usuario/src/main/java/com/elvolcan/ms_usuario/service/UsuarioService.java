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

    public void verificarTokenSiPresente(String authHeader) {
        if (authHeader != null && !authHeader.isBlank()) {
            String token = authHeader.replace("Bearer ", "").trim();
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

    @Transactional(readOnly = true)
    public List<UsuarioResponse> obtenerTodos() {
        log.info("Obteniendo todos los usuarios");
        return usuarioMapper.toResponseList(usuarioRepository.findAll());
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPorId(Long id) {
        log.info("Buscando usuario con ID: {}", id);
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado con ID: " + id));
        return usuarioMapper.toResponse(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPorEmail(String email) {
        log.info("Buscando usuario con email: {}", email);
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado con email: " + email));
        return usuarioMapper.toResponse(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPorRut(String rut) {
        log.info("Buscando usuario con RUT: {}", rut);
        Usuario usuario = usuarioRepository.findByRut(rut)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado con RUT: " + rut));
        return usuarioMapper.toResponse(usuario);
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> obtenerPorRol(RolUsuario rol) {
        log.info("Buscando usuarios por rol: {}", rol);
        return usuarioMapper.toResponseList(usuarioRepository.findByRol(rol));
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        log.info("Creando usuario con email: {} - Rol: {}",
                request.getEmail(),
                request.getRol() != null ? request.getRol().getValor() : "null");

        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El email '" + request.getEmail() + "' ya está registrado");
        }

        if (usuarioRepository.existsByRut(request.getRut())) {
            throw new IllegalArgumentException("El RUT '" + request.getRut() + "' ya está registrado");
        }

        Usuario usuario = usuarioMapper.toEntity(request);
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));

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
        usuario.setEmail(request.getEmail());
        usuario.setRut(request.getRut());
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

    @Transactional(readOnly = true)
    public UsuarioResponse validarCredenciales(CredencialesRequest request) {
        log.info("Validando credenciales para email: {}", request.getEmail());
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Correo o contraseña incorrectos"));

        boolean coincide = passwordEncoder.matches(request.getPassword(), usuario.getPassword())
                || usuario.getPassword().equals(request.getPassword());

        if (!coincide) {
            throw new IllegalArgumentException("Correo o contraseña incorrectos");
        }

        return usuarioMapper.toResponse(usuario);
    }

    @Transactional
    public UsuarioResponse actualizarPasswordPorEmail(CredencialesRequest request) {
        log.info("Restableciendo contraseña para email: {}", request.getEmail());
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new UsuarioNoEncontradoException("No existe una cuenta registrada con el correo: " + request.getEmail()));

        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        Usuario actualizado = usuarioRepository.save(usuario);
        return usuarioMapper.toResponse(actualizado);
    }

    @Transactional(readOnly = true)
    public boolean validarCliente(Long id) {
        try {
            return obtenerPorId(id).getRol() == RolUsuario.CLIENTE;
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    public boolean validarOperador(Long id) {
        try {
            return obtenerPorId(id).getRol() == RolUsuario.OPERADOR;
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    public boolean validarAdministrador(Long id) {
        try {
            return obtenerPorId(id).getRol() == RolUsuario.ADMIN;
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    public boolean validarRepartidor(Long id) {
        try {
            return obtenerPorId(id).getRol() == RolUsuario.REPARTIDOR;
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    public String obtenerRolPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado con ID: " + id));
        return usuario.getRol() != null ? usuario.getRol().getValor() : "null";
    }
}
