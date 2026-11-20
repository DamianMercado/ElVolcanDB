package com.elvolcan.ms_auth.service;

import com.elvolcan.ms_auth.client.UsuarioClient;
import com.elvolcan.ms_auth.dto.request.LoginRequest;
import com.elvolcan.ms_auth.dto.response.AuthResponse;
import com.elvolcan.ms_auth.dto.response.UsuarioExternoResponse;
import com.elvolcan.ms_auth.dto.response.ValidacionAuthResponse;
import com.elvolcan.ms_auth.enums.EstadoSesion;
import com.elvolcan.ms_auth.mapper.AuthMapper;
import com.elvolcan.ms_auth.model.SesionAuth;
import com.elvolcan.ms_auth.repository.SesionAuthRepository;
import com.elvolcan.ms_auth.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private SesionAuthRepository sesionAuthRepository;

    @Mock
    private AuthMapper authMapper;

    @Mock
    private UsuarioClient usuarioClient;

    @InjectMocks
    private AuthService authService;

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "ElVolcanSecretKeyParaAutenticacionMicroserviciosJWT2026Segura123456");
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 86400000L);
        ReflectionTestUtils.setField(authService, "jwtUtil", jwtUtil);
    }

    @Test
    void validarToken_debeValidarJwtRealCriptograficamente() {
        String jwt = jwtUtil.generarToken(1L, "Andrea Muñoz", "admin@el-volcan.com", "ADMIN");
        LocalDateTime ahoraChile = LocalDateTime.now(AuthService.ZONA_CHILE);

        SesionAuth sesion = SesionAuth.builder()
                .id(1L)
                .idUsuario(1L)
                .nombreUsuario("Andrea Muñoz")
                .email("admin@el-volcan.com")
                .rol("ADMIN")
                .token(jwt)
                .fechaInicio(ahoraChile.minusMinutes(5))
                .fechaExpiracion(ahoraChile.plusHours(10))
                .estado(EstadoSesion.ACTIVA)
                .build();

        when(sesionAuthRepository.findByToken(jwt)).thenReturn(Optional.of(sesion));

        ValidacionAuthResponse res = authService.validarToken("Bearer " + jwt);
        assertTrue(res.isValido());
        assertEquals("ADMIN", res.getRol());
        assertEquals("admin@el-volcan.com", res.getEmail());
    }

    @Test
    void validarToken_debeRechazarSesionCerrada() {
        String jwt = jwtUtil.generarToken(4L, "Cliente Usuario", "cliente@el-volcan.com", "CLIENTE");

        SesionAuth sesionCerrada = SesionAuth.builder()
                .id(2L)
                .idUsuario(4L)
                .email("cliente@el-volcan.com")
                .rol("CLIENTE")
                .token(jwt)
                .estado(EstadoSesion.CERRADA)
                .build();

        when(sesionAuthRepository.findByToken(jwt)).thenReturn(Optional.of(sesionCerrada));

        ValidacionAuthResponse res = authService.validarToken("Bearer " + jwt);
        assertFalse(res.isValido());
        assertTrue(res.getMensaje().toLowerCase().contains("cerrada"));
    }

    @Test
    void cerrarSesion_debeMarcarSesionComoCerrada() {
        String jwt = jwtUtil.generarToken(4L, "Cliente Usuario", "cliente@el-volcan.com", "CLIENTE");
        SesionAuth sesion = SesionAuth.builder()
                .id(10L)
                .idUsuario(4L)
                .token(jwt)
                .estado(EstadoSesion.ACTIVA)
                .build();

        when(sesionAuthRepository.findByToken(jwt)).thenReturn(Optional.of(sesion));
        when(sesionAuthRepository.save(any(SesionAuth.class))).thenAnswer(inv -> inv.getArgument(0));
        when(authMapper.toResponse(any(SesionAuth.class))).thenAnswer(inv -> {
            SesionAuth s = inv.getArgument(0);
            return AuthResponse.builder().id(s.getId()).idUsuario(s.getIdUsuario()).estado(s.getEstado()).build();
        });

        AuthResponse res = authService.cerrarSesion("Bearer " + jwt);
        assertEquals(EstadoSesion.CERRADA, res.getEstado());
    }

    @Test
    void recuperarClave_debeRevocarSesionesActivasPreviasYRegistrarHoraChile() {
        LoginRequest req = new LoginRequest("cliente@el-volcan.com", "nuevaClave123");
        UsuarioExternoResponse usr = UsuarioExternoResponse.builder()
                .id(4L)
                .nombre("Cliente")
                .apellido("Usuario")
                .email("cliente@el-volcan.com")
                .rol("CLIENTE")
                .direccion("Av. Concha y Toro 1420")
                .comuna("Puente Alto")
                .build();

        SesionAuth previa = SesionAuth.builder().id(4L).idUsuario(4L).estado(EstadoSesion.ACTIVA).build();

        when(usuarioClient.recuperarClave(any(LoginRequest.class))).thenReturn(usr);
        when(sesionAuthRepository.findByIdUsuarioAndEstado(4L, EstadoSesion.ACTIVA)).thenReturn(List.of(previa));
        when(sesionAuthRepository.save(any(SesionAuth.class))).thenAnswer(inv -> inv.getArgument(0));
        when(authMapper.toResponse(any(SesionAuth.class))).thenAnswer(inv -> {
            SesionAuth s = inv.getArgument(0);
            return AuthResponse.builder()
                    .id(s.getId())
                    .idUsuario(s.getIdUsuario())
                    .fechaInicioChile(s.getFechaInicioChile())
                    .zonaHoraria(s.getZonaHoraria())
                    .estado(s.getEstado())
                    .build();
        });

        AuthResponse res = authService.recuperarClave(req);
        assertEquals(EstadoSesion.CERRADA, previa.getEstado());
        assertEquals("America/Santiago", res.getZonaHoraria());
        assertNotNull(res.getFechaInicioChile());
        verify(sesionAuthRepository).saveAll(List.of(previa));
    }
}
