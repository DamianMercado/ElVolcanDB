package com.elvolcan.ms_auth.client;

import com.elvolcan.ms_auth.dto.request.LoginRequest;
import com.elvolcan.ms_auth.dto.request.RegistroAuthRequest;
import com.elvolcan.ms_auth.dto.response.UsuarioExternoResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "ms-usuario")
public interface UsuarioClient {

    @PostMapping("/api/v1/usuarios/validar-credenciales")
    UsuarioExternoResponse validarCredenciales(@RequestBody LoginRequest request);

    @org.springframework.web.bind.annotation.PutMapping("/api/v1/usuarios/recuperar-clave")
    UsuarioExternoResponse recuperarClave(@RequestBody LoginRequest request);

    @PostMapping("/api/v1/usuarios")
    UsuarioExternoResponse registrarUsuario(@RequestBody RegistroAuthRequest request);

    @GetMapping("/api/v1/usuarios/{id}")
    UsuarioExternoResponse obtenerUsuarioPorId(@PathVariable("id") Long id);
}
