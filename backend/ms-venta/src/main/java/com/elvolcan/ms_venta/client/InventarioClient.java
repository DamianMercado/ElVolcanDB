package com.elvolcan.ms_venta.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "ms-inventario")
public interface InventarioClient {

    @PutMapping("/api/v1/inventario/codigo/{codigoProducto}/descontar")
    Object descontarStock(
            @PathVariable("codigoProducto") String codigoProducto,
            @RequestParam("cantidad") Integer cantidad,
            @RequestParam("motivo") String motivo);

    @PutMapping("/api/v1/inventario/codigo/{codigoProducto}/reponer")
    Object reponerStock(
            @PathVariable("codigoProducto") String codigoProducto,
            @RequestParam("cantidad") Integer cantidad,
            @RequestParam("motivo") String motivo);
}
