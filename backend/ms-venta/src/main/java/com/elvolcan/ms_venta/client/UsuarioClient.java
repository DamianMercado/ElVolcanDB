package com.elvolcan.ms_venta.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "ms-usuario")
public interface UsuarioClient {

    @GetMapping("/api/v1/usuarios/{id}")
    Object obtenerUsuarioPorId(@PathVariable("id") Long id);
}
