package com.elvolcan.ms_venta.model;

import com.elvolcan.ms_venta.enums.EstadoVenta;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "venta")
public class Venta {

    @Id
    private Long id;

    @Indexed(unique = true)
    @Field("codigo_venta")
    private String codigoVenta;

    @Field("id_usuario")
    private Long idUsuario;

    @Field("cliente")
    private String cliente;

    @Field("rut")
    private String rut;

    @Field("email")
    private String email;

    @Field("telefono")
    private String telefono;

    @Field("direccion")
    private String direccion;

    @Field("comuna")
    private String comuna;

    @Field("observacion")
    private String observacion;

    @Field("detalle")
    private String detalle;

    @Field("total")
    private Double total;

    @Field("metodo_pago")
    private String metodoPago;

    @Field("estado_venta")
    private EstadoVenta estadoVenta;

    @Field("estado_pago")
    private String estadoPago;

    @Field("id_pago")
    private Long idPago;

    @Field("repartidor")
    private String repartidor;

    @Field("fecha_venta")
    private LocalDateTime fechaVenta;

    @Field("id_zona")
    private Integer idZona;

    @Field("entrega")
    private Map<String, Object> entrega;

    @Field("auditoria")
    private List<Map<String, Object>> auditoria;

    @Field("items")
    @Builder.Default
    private List<DetalleVenta> items = new ArrayList<>();
}
