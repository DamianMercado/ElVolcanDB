package com.elvolcan.ms_pago.config;

import com.elvolcan.ms_pago.enums.EstadoPago;
import com.elvolcan.ms_pago.model.Pago;
import com.elvolcan.ms_pago.repository.PagoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Configuration
public class OraclePagoInitializer {

    private static final Logger log = LoggerFactory.getLogger(OraclePagoInitializer.class);
    private static final ZoneId ZONA_CHILE = ZoneId.of("America/Santiago");

    @Bean
    public CommandLineRunner inicializarOraclePagos(PagoRepository pagoRepository) {
        return args -> {
            try {
                if (pagoRepository.count() == 0) {
                    log.info("Inicializando transacciones de pago base en Oracle SQL (ELVOLCAN_PAGO, TZ America/Santiago)...");
                    List<Pago> pagos = List.of(
                            crearPago(1L, new BigDecimal("36980.00"), "webpay_debito", "TRX-582910", "AUT-194022", "0001", "maria.gomez@gmail.com", "MARIA GOMEZ", LocalDateTime.of(2026, 10, 20, 10, 16)),
                            crearPago(3L, new BigDecimal("49970.00"), "webpay_credito", "TRX-748201", "AUT-839201", "0001", "ana.torres@gmail.com", "ANA TORRES", LocalDateTime.of(2026, 10, 19, 16, 32)),
                            crearPago(4L, new BigDecimal("135000.00"), "webpay_debito", "TRX-639104", "AUT-512098", "0001", "contacto@panaderiaelsol.cl", "PANADERIA EL SOL", LocalDateTime.of(2026, 10, 19, 14, 22)),
                            crearPago(8L, new BigDecimal("23990.00"), "webpay_debito", "TRX-918273", "AUT-384756", "0001", "pedro.salinas@gmail.com", "PEDRO SALINAS", LocalDateTime.of(2026, 10, 19, 17, 46))
                    );
                    pagoRepository.saveAll(pagos);
                }
            } catch (Exception e) {
                log.warn("No se pudo ejecutar la semilla inicial de ms-pago en Oracle SQL: {}", e.getMessage());
            }
        };
    }

    private Pago crearPago(
            Long idVenta, BigDecimal monto, String metodo, String trx,
            String aut, String terminacion, String email, String titular, LocalDateTime fecha
    ) {
        return Pago.builder()
                .idVenta(idVenta)
                .montoPago(monto)
                .metodoPago(metodo)
                .estadoPago(EstadoPago.PAGADO)
                .codigoTransaccion(trx)
                .codigoAutorizacion(aut)
                .tarjetaTerminacion(terminacion)
                .emailComprobante(email)
                .nombreTitular(titular)
                .fechaPago(fecha)
                .fechaPagoChile(fecha.atZone(ZONA_CHILE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
                .zonaHoraria(ZONA_CHILE.getId())
                .build();
    }
}
