package com.elvolcan.ms_inventario.dto.response;

import com.elvolcan.ms_inventario.enums.EstadoStock;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventarioResponse {

    private Long id;
    private String codigoProducto;
    private String nombreProducto;
    private Integer stockActual;
    private Integer stockMinimo;
    private String ubicacionBodega;
    private EstadoStock estadoStock;
    private LocalDateTime fechaActualizacion;
}
