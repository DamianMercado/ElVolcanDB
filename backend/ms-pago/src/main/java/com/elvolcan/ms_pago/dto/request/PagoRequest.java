package com.elvolcan.ms_pago.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para procesar un pago de una venta")
public class PagoRequest {

    @NotNull(message = "El ID de la venta es obligatorio")
    @Schema(example = "2")
    private Long idVenta;

    @NotNull(message = "El monto del pago es obligatorio")
    @Min(value = 1, message = "El monto debe ser mayor a 0")
    @Schema(example = "31990")
    private Double montoPago;

    @NotBlank(message = "El método de pago es obligatorio")
    @Schema(example = "webpay_debito")
    private String metodoPago;

    @Schema(example = "0001")
    private String tarjetaTerminacion;

    @Schema(example = "cliente@el-volcan.com")
    private String emailComprobante;

    @Schema(example = "JUAN PEREZ")
    private String nombreTitular;

    @Schema(description = "Indica si el pago se aprueba automáticamente al crearse", example = "true")
    private Boolean aprobarInmediatamente;
}
