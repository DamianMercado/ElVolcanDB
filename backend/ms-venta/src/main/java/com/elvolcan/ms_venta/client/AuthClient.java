package com.elvolcan.ms_venta.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;

@FeignClient(name = "ms-auth")
public interface AuthClient {

    @GetMapping("/api/v1/auth/validar")
    Map<String, Object> validarToken(@RequestParam("token") String token);

    @GetMapping("/api/v1/auth/validar-usuario/{idUsuario}")
    Map<String, Object> validarUsuario(@PathVariable("idUsuario") Long idUsuario);
}
