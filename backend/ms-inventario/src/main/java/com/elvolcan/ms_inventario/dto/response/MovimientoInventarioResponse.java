package com.elvolcan.ms_inventario.dto.response;

import com.elvolcan.ms_inventario.enums.EstadoMovimiento;
import com.elvolcan.ms_inventario.enums.TipoMovimiento;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovimientoInventarioResponse {

    private Long id;
    private Long idInventario;
    private String codigoProducto;
    private TipoMovimiento tipoMovimiento;
    private Integer cantidad;
    private Integer stockAnterior;
    private Integer stockNuevo;
    private String observacion;
    private EstadoMovimiento estadoMovimiento;
    private LocalDateTime fechaMovimiento;
}
