package com.elvolcan.ms_pago.dto.response;

import com.elvolcan.ms_pago.enums.EstadoPago;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagoResponse {

    private Long id;
    private Long idVenta;
    private Double montoPago;
    private String metodoPago;
    private EstadoPago estadoPago;
    private String codigoTransaccion;
    private String codigoAutorizacion;
    private String tarjetaTerminacion;
    private String emailComprobante;
    private String nombreTitular;
    private LocalDateTime fechaPago;
}
