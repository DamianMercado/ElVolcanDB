package com.elvolcan.ms_inventario.model;

import com.elvolcan.ms_inventario.enums.EstadoStock;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "inventario",
        uniqueConstraints = @UniqueConstraint(name = "uk_inventario_codigo", columnNames = "codigo_producto")
)
public class Inventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_producto", nullable = false, length = 40, unique = true)
    private String codigoProducto;

    @Column(name = "nombre_producto", nullable = false, length = 200)
    private String nombreProducto;

    @Column(name = "stock_actual", nullable = false)
    private Integer stockActual;

    @Column(name = "stock_minimo", nullable = false)
    private Integer stockMinimo;

    @Column(name = "ubicacion_bodega", length = 150)
    private String ubicacionBodega;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_stock", nullable = false, length = 30)
    private EstadoStock estadoStock;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @Column(name = "fecha_actualizacion_chile", length = 50)
    private String fechaActualizacionChile;

    @Column(name = "zona_horaria", nullable = false, length = 50)
    @Builder.Default
    private String zonaHoraria = "America/Santiago";

    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
