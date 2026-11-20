package com.elvolcan.ms_pago.model;

import com.elvolcan.ms_pago.enums.EstadoPago;
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
@Document(collection = "pago")
public class Pago {

    @Id
    private Long id;

    @Indexed
    @Field("id_venta")
    private Long idVenta;

    @Field("monto_pago")
    private Double montoPago;

    @Field("metodo_pago")
    private String metodoPago;

    @Field("estado_pago")
    private EstadoPago estadoPago;

    @Field("codigo_transaccion")
    private String codigoTransaccion;

    @Field("codigo_autorizacion")
    private String codigoAutorizacion;

    @Field("tarjeta_terminacion")
    private String tarjetaTerminacion;

    @Field("email_comprobante")
    private String emailComprobante;

    @Field("nombre_titular")
    private String nombreTitular;

    @Field("fecha_pago")
    private LocalDateTime fechaPago;

    @Field("fecha_pago_chile")
    private String fechaPagoChile;

    @Field("zona_horaria")
    @Builder.Default
    private String zonaHoraria = "America/Santiago";
}
