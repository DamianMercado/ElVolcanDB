package com.elvolcan.ms_inventario.dto.request;

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
@Schema(description = "Datos para crear o actualizar un registro de inventario")
public class InventarioRequest {

    @NotBlank(message = "El código de producto es obligatorio")
    @Schema(example = "CL001")
    private String codigoProducto;

    @NotBlank(message = "El nombre del producto es obligatorio")
    @Schema(example = "Cilindro gas licuado 5 kg")
    private String nombreProducto;

    @NotNull(message = "El stock actual es obligatorio")
    @Min(value = 0, message = "El stock actual no puede ser negativo")
    @Schema(example = "80")
    private Integer stockActual;

    @NotNull(message = "El stock mínimo es obligatorio")
    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    @Schema(example = "40")
    private Integer stockMinimo;

    @Schema(example = "Bodega Central - Sector A")
    private String ubicacionBodega;
}
