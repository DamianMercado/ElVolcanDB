package com.elvolcan.ms_catalogo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventarioExternoResponse {

    private Long id;
    private String codigoProducto;
    private String nombreProducto;
    private Integer stockActual;
    private Integer stockMinimo;
    private String ubicacionBodega;
    private String estadoStock;
}
