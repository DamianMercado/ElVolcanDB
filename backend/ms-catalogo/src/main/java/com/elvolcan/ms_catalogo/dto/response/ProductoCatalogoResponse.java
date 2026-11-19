package com.elvolcan.ms_catalogo.dto.response;

import com.elvolcan.ms_catalogo.enums.EstadoProducto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoCatalogoResponse {

    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private Double precio;
    private Integer stock;
    private Integer minimo;
    private String estadoStock;
    private String categoria;
    private String imagen;
    private String imagenEndpoint;
    private EstadoProducto estado;
}
