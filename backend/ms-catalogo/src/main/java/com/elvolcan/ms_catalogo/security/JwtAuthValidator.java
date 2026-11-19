package com.elvolcan.ms_catalogo.security;

import com.elvolcan.ms_catalogo.client.AuthClient;
import feign.RequestInterceptor;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtAuthValidator {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthValidator.class);

    @Value("${jwt.secret:ElVolcanSecretKeyParaAutenticacionMicroserviciosJWT2026Segura123456}")
    private String secret;

    private final AuthClient authClient;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public Claims extraerClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validarFirmaJwt(String token) {
        try {
            Claims claims = extraerClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public void validarToken(String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            return;
        }
        validarTokenInterno(authHeader, false);
    }

    public void exigirTokenAdmin(String authHeader) {
        if (authHeader == null || authHeader.isBlank() || !authHeader.startsWith("Bearer ")) {
            throw new SecurityException("No autorizado: se requiere token JWT Bearer de administrador");
        }
        validarTokenInterno(authHeader, true);
    }

    private void validarTokenInterno(String authHeader, boolean requiereAdmin) {
        String token = authHeader.replace("Bearer ", "").trim();
        if (token.isBlank()) {
            throw new SecurityException("Token JWT vacío");
        }

        if (token.chars().filter(ch -> ch == '.').count() == 2) {
            if (!validarFirmaJwt(token)) {
                throw new SecurityException("Firma JWT inválida o token expirado");
            }
            if (requiereAdmin) {
                Claims claims = extraerClaims(token);
                String rol = claims.get("rol", String.class);
                if (rol == null) {
                    rol = claims.get("perfil", String.class);
                }
                if (rol == null || !rol.equalsIgnoreCase("ADMIN")) {
                    throw new SecurityException("Acceso denegado: se requiere rol ADMIN");
                }
            }
        }

        try {
            Map<String, Object> validacion = authClient.validarToken(token);
            if (validacion == null || !Boolean.TRUE.equals(validacion.get("valido"))) {
                throw new SecurityException("Token JWT no autorizado por ms-auth");
            }
        } catch (SecurityException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Verificación criptográfica local JWT aplicada (ms-auth no disponible): {}", e.getMessage());
        }
    }

    @Bean
    public RequestInterceptor feignJwtRelayInterceptor() {
        return requestTemplate -> {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && !authHeader.isBlank()) {
                    requestTemplate.header("Authorization", authHeader);
                }
            }
        };
    }
}
