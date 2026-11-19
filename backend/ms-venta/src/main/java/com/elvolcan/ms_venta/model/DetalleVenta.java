package com.elvolcan.ms_venta.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetalleVenta {

    @Field("id_detalle")
    private Long id;

    @Transient
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Venta venta;

    @Field("codigo_producto")
    private String codigoProducto;

    @Field("nombre_producto")
    private String nombreProducto;

    @Field("precio_unitario")
    private Double precioUnitario;

    @Field("cantidad")
    private Integer cantidad;

    @Field("subtotal")
    private Double subtotal;
}
