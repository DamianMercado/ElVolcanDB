package com.elvolcan.ms_catalogo.dto.request;

import com.elvolcan.ms_catalogo.enums.EstadoProducto;
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
@Schema(description = "Datos para crear o actualizar un producto en el catálogo e inventario")
public class ProductoCatalogoRequest {

    @Schema(example = "CL001")
    private String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    @Schema(example = "Cilindro gas licuado 5 kg")
    private String nombre;

    @Schema(example = "Cilindro portátil de gas licuado ideal para estufas y cocinillas")
    private String descripcion;

    @NotNull(message = "El precio es obligatorio")
    @Min(value = 1, message = "El precio debe ser mayor a 0")
    @Schema(example = "12990")
    private Double precio;

    @Schema(example = "60")
    @Min(value = 0, message = "El stock no puede ser negativo")
    private Integer stock;

    @Schema(example = "20")
    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    private Integer minimo;

    @Schema(example = "Cilindros")
    private String categoria;

    @NotBlank(message = "La ruta o URL de la imagen es obligatoria")
    @Schema(example = "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/CL001.webp")
    private String imagen;

    @Schema(example = "ACTIVO")
    private EstadoProducto estado;
}
