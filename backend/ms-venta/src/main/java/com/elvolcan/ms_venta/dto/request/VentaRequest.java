package com.elvolcan.ms_venta.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para generar una nueva venta de cliente")
public class VentaRequest {

    @Schema(example = "4")
    private Long idUsuario;

    @NotBlank(message = "El nombre del cliente es obligatorio")
    @Schema(example = "Juan Pérez")
    private String cliente;

    @Schema(example = "44444444-4")
    private String rut;

    @Schema(example = "cliente@el-volcan.com")
    private String email;

    @NotBlank(message = "El teléfono es obligatorio")
    @Schema(example = "+56 9 4444 4444")
    private String telefono;

    @NotBlank(message = "La dirección de entrega es obligatoria")
    @Schema(example = "Av. Concha y Toro 1420")
    private String direccion;

    @Schema(example = "Puente Alto")
    private String comuna;

    @Schema(example = "Portón negro, tocar timbre")
    private String observacion;

    @NotBlank(message = "El método de pago es obligatorio")
    @Schema(example = "pagar_ahora")
    private String metodoPago;

    @NotEmpty(message = "La venta debe incluir al menos un producto")
    @Valid
    private List<ItemVentaRequest> items;
}
