package com.elvolcan.ms_catalogo.client;

import com.elvolcan.ms_catalogo.dto.response.InventarioExternoResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "ms-inventario")
public interface InventarioClient {

    @GetMapping("/api/v1/inventario/codigo/{codigoProducto}")
    InventarioExternoResponse obtenerStockPorCodigo(@PathVariable("codigoProducto") String codigoProducto);

    @PutMapping("/api/v1/inventario/sincronizar/{codigoProducto}")
    InventarioExternoResponse sincronizarStockProducto(
            @PathVariable("codigoProducto") String codigoProducto,
            @RequestParam("nombreProducto") String nombreProducto,
            @RequestParam("stockActual") Integer stockActual,
            @RequestParam(value = "stockMinimo", required = false) Integer stockMinimo);
}
