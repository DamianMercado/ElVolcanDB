package com.elvolcan.ms_inventario.dto.request;

import com.elvolcan.ms_inventario.enums.TipoMovimiento;
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
@Schema(description = "Datos para registrar un movimiento de stock en inventario")
public class MovimientoInventarioRequest {

    @NotBlank(message = "El código de producto es obligatorio")
    @Schema(example = "CL001")
    private String codigoProducto;

    @NotNull(message = "El tipo de movimiento es obligatorio")
    @Schema(example = "ENTRADA")
    private TipoMovimiento tipoMovimiento;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    @Schema(example = "20")
    private Integer cantidad;

    @Schema(example = "Reposición de cilindros de proveedor habitual")
    private String observacion;
}
