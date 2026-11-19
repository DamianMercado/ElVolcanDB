package com.elvolcan.ms_venta.dto.response;

import com.elvolcan.ms_venta.enums.EstadoVenta;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VentaResponse {

    private Long id;
    private String codigoVenta;
    private Long idUsuario;
    private String cliente;
    private String rut;
    private String email;
    private String telefono;
    private String direccion;
    private String comuna;
    private String observacion;
    private String detalle;
    private Double total;
    private String metodoPago;
    private EstadoVenta estadoVenta;
    private String estadoPago;
    private Long idPago;
    private String repartidor;
    private LocalDateTime fechaVenta;
    private List<DetalleVentaResponse> items;
}
