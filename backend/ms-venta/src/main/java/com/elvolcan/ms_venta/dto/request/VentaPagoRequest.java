package com.elvolcan.ms_venta.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Confirmación de pago desde ms-pago hacia ms-venta")
public class VentaPagoRequest {

    @NotNull(message = "El ID del pago es obligatorio")
    private Long idPago;
}
