package com.elvolcan.ms_venta.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeguimientoVentaRequest {

    private Double lat;
    private Double lng;
    private Double rumbo;
    private Integer indicePunto;
    private Integer etaMinutos;
    private Double distanciaKm;
    private Integer velocidadKmH;
    private String estadoDespacho;
    private String repartidor;
    private String repartidorTelefono;
    private String repartidorPatente;
    private String repartidorVehiculo;
}
