package com.elvolcan.ms_pago.model;

import com.elvolcan.ms_pago.enums.EstadoPago;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "pago",
        indexes = {
                @Index(name = "idx_pago_id_venta", columnList = "id_venta"),
                @Index(name = "idx_pago_codigo_trx", columnList = "codigo_transaccion", unique = true)
        }
)
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_venta", nullable = false)
    private Long idVenta;

    @Column(name = "monto_pago", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoPago;

    @Column(name = "metodo_pago", nullable = false, length = 60)
    private String metodoPago;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_pago", nullable = false, length = 30)
    private EstadoPago estadoPago;

    @Column(name = "codigo_transaccion", length = 60)
    private String codigoTransaccion;

    @Column(name = "codigo_autorizacion", length = 60)
    private String codigoAutorizacion;

    @Column(name = "tarjeta_terminacion", length = 10)
    private String tarjetaTerminacion;

    @Column(name = "email_comprobante", length = 150)
    private String emailComprobante;

    @Column(name = "nombre_titular", length = 150)
    private String nombreTitular;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDateTime fechaPago;

    @Column(name = "fecha_pago_chile", length = 50)
    private String fechaPagoChile;

    @Column(name = "zona_horaria", nullable = false, length = 50)
    @Builder.Default
    private String zonaHoraria = "America/Santiago";
}
