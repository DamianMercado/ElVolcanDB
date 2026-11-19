package com.elvolcan.ms_venta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoCatalogoExternoResponse {

    private Long id;
    private String codigo;
    private String nombre;
    private Double precio;
    private Integer stock;
    private String categoria;
    private String imagen;
}
