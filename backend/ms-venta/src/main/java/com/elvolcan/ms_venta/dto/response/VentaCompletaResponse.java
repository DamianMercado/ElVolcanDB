package com.elvolcan.ms_venta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VentaCompletaResponse {

    private VentaResponse venta;
    private Object usuario;
    private Object pago;
}
