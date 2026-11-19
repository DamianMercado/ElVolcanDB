package com.elvolcan.ms_venta.client;

import com.elvolcan.ms_venta.dto.response.ProductoCatalogoExternoResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "ms-catalogo")
public interface CatalogoClient {

    @GetMapping("/api/v1/catalogo/codigo/{codigo}")
    ProductoCatalogoExternoResponse obtenerProductoPorCodigo(@PathVariable("codigo") String codigo);
}
