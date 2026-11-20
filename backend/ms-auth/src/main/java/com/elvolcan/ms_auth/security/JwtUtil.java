package com.elvolcan.ms_auth.security;

import com.elvolcan.ms_auth.dto.response.UsuarioExternoResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    @Value("${jwt.secret:ElVolcanSecretKeyParaAutenticacionMicroserviciosJWT2026Segura123456}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public long getExpirationMs() {
        return expirationMs > 0 ? expirationMs : 86400000L;
    }

    public String generarToken(Long idUsuario, String nombreUsuario, String email, String rol) {
        return generarTokenConPerfil(idUsuario, nombreUsuario, null, null, email, rol, null, null, null, null);
    }

    public String generarToken(UsuarioExternoResponse usuario) {
        String nombre = usuario.getNombre() != null ? usuario.getNombre().trim() : "";
        String apellido = usuario.getApellido() != null ? usuario.getApellido().trim() : "";
        String nombreCompleto = (nombre + " " + apellido).trim();
        return generarTokenConPerfil(
                usuario.getId(),
                nombreCompleto,
                nombre,
                apellido,
                usuario.getEmail(),
                usuario.getRol(),
                usuario.getRut(),
                usuario.getTelefono(),
                usuario.getDireccion(),
                usuario.getComuna()
        );
    }

    private String generarTokenConPerfil(
            Long idUsuario, String nombreUsuario, String nombres, String apellidos,
            String email, String rol, String rut, String telefono, String direccion, String comuna
    ) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("idUsuario", idUsuario);
        claims.put("nombreUsuario", nombreUsuario);
        claims.put("email", email);
        claims.put("rol", rol);
        // Alias compatibles con UsuarioDesdeToken en frontend
        claims.put("nombre", nombreUsuario);
        claims.put("perfil", rol);
        claims.put("correo", email);
        if (nombres != null && !nombres.isBlank()) claims.put("nombres", nombres);
        if (apellidos != null && !apellidos.isBlank()) claims.put("apellidos", apellidos);
        if (rut != null && !rut.isBlank()) claims.put("rut", rut);
        if (telefono != null && !telefono.isBlank()) claims.put("telefono", telefono);
        if (direccion != null && !direccion.isBlank()) claims.put("direccion", direccion);
        if (comuna != null && !comuna.isBlank()) claims.put("comuna", comuna);

        Date ahora = new Date();
        Date expiracion = new Date(ahora.getTime() + getExpirationMs());

        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(ahora)
                .expiration(expiracion)
                .signWith(getSigningKey())
                .compact();
    }

    public Claims extraerClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validarTokenCriptografico(String token) {
        try {
            Claims claims = extraerClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
