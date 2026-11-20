package com.elvolcan.ms_inventario.model;

import com.elvolcan.ms_inventario.enums.EstadoMovimiento;
import com.elvolcan.ms_inventario.enums.TipoMovimiento;
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
@Document(collection = "movimiento_inventario")
public class MovimientoInventario {

    @Id
    private Long id;

    @Field("id_inventario")
    private Long idInventario;

    @Indexed
    @Field("codigo_producto")
    private String codigoProducto;

    @Field("tipo_movimiento")
    private TipoMovimiento tipoMovimiento;

    @Field("cantidad")
    private Integer cantidad;

    @Field("stock_anterior")
    private Integer stockAnterior;

    @Field("stock_nuevo")
    private Integer stockNuevo;

    @Field("observacion")
    private String observacion;

    @Field("estado_movimiento")
    private EstadoMovimiento estadoMovimiento;

    @Field("fecha_movimiento")
    private LocalDateTime fechaMovimiento;

    @Field("fecha_movimiento_chile")
    private String fechaMovimientoChile;

    @Field("zona_horaria")
    @Builder.Default
    private String zonaHoraria = "America/Santiago";
}
