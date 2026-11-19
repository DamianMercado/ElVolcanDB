package com.elvolcan.ms_venta.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "ms-pago")
public interface PagoClient {

    @GetMapping("/api/v1/pagos/{id}")
    Object obtenerPagoPorId(@PathVariable("id") Long id);
}
