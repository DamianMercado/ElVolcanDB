package com.elvolcan.ms_venta.security;

import com.elvolcan.ms_venta.client.AuthClient;
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

    public boolean validarFirmaJwt(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public void validarToken(String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            return;
        }
        String token = authHeader.replace("Bearer ", "").trim();
        if (token.chars().filter(ch -> ch == '.').count() == 2 && !validarFirmaJwt(token)) {
            throw new SecurityException("Firma JWT inválida o token expirado");
        }
        try {
            Map<String, Object> validacion = authClient.validarToken(token);
            if (validacion == null || !Boolean.TRUE.equals(validacion.get("valido"))) {
                throw new SecurityException("Token JWT no autorizado por ms-auth");
            }
        } catch (SecurityException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Verificación local JWT aplicada (ms-auth no disponible): {}", e.getMessage());
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
