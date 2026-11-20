package com.elvolcan.ms_inventario.model;

import com.elvolcan.ms_inventario.enums.EstadoStock;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "inventario")
public class Inventario {

    @Id
    private Long id;

    @Indexed(unique = true)
    @Field("codigo_producto")
    private String codigoProducto;

    @Field("nombre_producto")
    private String nombreProducto;

    @Field("stock_actual")
    private Integer stockActual;

    @Field("stock_minimo")
    private Integer stockMinimo;

    @Field("ubicacion_bodega")
    private String ubicacionBodega;

    @Field("estado_stock")
    private EstadoStock estadoStock;

    @Field("fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Field("fecha_actualizacion_chile")
    private String fechaActualizacionChile;

    @Field("zona_horaria")
    @Builder.Default
    private String zonaHoraria = "America/Santiago";
}
