package com.elvolcan.ms_pago.client;

import com.elvolcan.ms_pago.dto.request.VentaPagoRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "ms-venta")
public interface VentaClient {

    @GetMapping("/api/v1/ventas/{id}")
    Object obtenerVentaPorId(@PathVariable("id") Long id);

    @PutMapping("/api/v1/ventas/{id}/confirmar-pago")
    Object confirmarPagoVenta(@PathVariable("id") Long id, @RequestBody VentaPagoRequest request);
}
