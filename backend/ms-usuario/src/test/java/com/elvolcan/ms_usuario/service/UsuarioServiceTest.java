package com.elvolcan.ms_usuario.service;

import com.elvolcan.ms_usuario.client.AuthClient;
import com.elvolcan.ms_usuario.dto.request.UsuarioRequest;
import com.elvolcan.ms_usuario.dto.response.UsuarioResponse;
import com.elvolcan.ms_usuario.enums.RolUsuario;
import com.elvolcan.ms_usuario.mapper.UsuarioMapper;
import com.elvolcan.ms_usuario.model.Usuario;
import com.elvolcan.ms_usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private UsuarioMapper usuarioMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthClient authClient;

    @InjectMocks
    private UsuarioService usuarioService;

    @Test
    void obtenerTodos_debeRetornarListaUsuarios() {
        Usuario u = Usuario.builder().id(1L).nombre("Andrea").rol(RolUsuario.ADMIN).build();
        UsuarioResponse r = UsuarioResponse.builder().id(1L).nombre("Andrea").rol(RolUsuario.ADMIN).build();

        when(usuarioRepository.findAll()).thenReturn(List.of(u));
        when(usuarioMapper.toResponseList(any())).thenReturn(List.of(r));

        List<UsuarioResponse> resultado = usuarioService.obtenerTodos();
        assertEquals(1, resultado.size());
        assertEquals("Andrea", resultado.get(0).getNombre());
    }

    @Test
    void obtenerPorId_debeRetornarUsuario() {
        Usuario u = Usuario.builder().id(1L).nombre("Andrea").rol(RolUsuario.ADMIN).build();
        UsuarioResponse r = UsuarioResponse.builder().id(1L).nombre("Andrea").rol(RolUsuario.ADMIN).build();

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        when(usuarioMapper.toResponse(u)).thenReturn(r);

        UsuarioResponse resultado = usuarioService.obtenerPorId(1L);
        assertNotNull(resultado);
        assertEquals(RolUsuario.ADMIN, resultado.getRol());
    }
}
