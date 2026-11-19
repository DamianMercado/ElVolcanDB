package com.elvolcan.ms_auth.service;

import com.elvolcan.ms_auth.client.UsuarioClient;
import com.elvolcan.ms_auth.dto.response.ValidacionAuthResponse;
import com.elvolcan.ms_auth.enums.EstadoSesion;
import com.elvolcan.ms_auth.mapper.AuthMapper;
import com.elvolcan.ms_auth.model.SesionAuth;
import com.elvolcan.ms_auth.repository.SesionAuthRepository;
import com.elvolcan.ms_auth.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

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

    @Test
    void validarToken_debeValidarJwtRealCriptograficamente() {
        JwtUtil jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "ElVolcanSecretKeyParaAutenticacionMicroserviciosJWT2026Segura123456");
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 86400000L);
        ReflectionTestUtils.setField(authService, "jwtUtil", jwtUtil);

        String jwt = jwtUtil.generarToken(1L, "Andrea Muñoz", "admin@el-volcan.com", "ADMIN");

        SesionAuth sesion = SesionAuth.builder()
                .id(1L)
                .idUsuario(1L)
                .nombreUsuario("Andrea Muñoz")
                .email("admin@el-volcan.com")
                .rol("ADMIN")
                .token(jwt)
                .fechaInicio(LocalDateTime.now().minusMinutes(5))
                .fechaExpiracion(LocalDateTime.now().plusHours(10))
                .estado(EstadoSesion.ACTIVA)
                .build();

        when(sesionAuthRepository.findByToken(jwt)).thenReturn(Optional.of(sesion));

        ValidacionAuthResponse res = authService.validarToken("Bearer " + jwt);
        assertTrue(res.isValido());
        assertEquals("ADMIN", res.getRol());
        assertEquals("admin@el-volcan.com", res.getEmail());
    }
}
