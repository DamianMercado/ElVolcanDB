package com.elvolcan.ms_pago.config;

import com.elvolcan.ms_pago.enums.EstadoPago;
import com.elvolcan.ms_pago.model.Pago;
import com.elvolcan.ms_pago.repository.PagoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertCallback;
import org.springframework.data.mongodb.core.query.Query;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;

@Configuration
public class MongoPagoConfig {

    private static final Logger log = LoggerFactory.getLogger(MongoPagoConfig.class);
    private static final ZoneId ZONA_CHILE = ZoneId.of("America/Santiago");

    @WritingConverter
    public static class LocalDateTimeToDateChileConverter implements Converter<LocalDateTime, Date> {
        @Override
        public Date convert(LocalDateTime source) {
            return Date.from(source.atZone(ZONA_CHILE).toInstant());
        }
    }

    @ReadingConverter
    public static class DateToLocalDateTimeChileConverter implements Converter<Date, LocalDateTime> {
        @Override
        public LocalDateTime convert(Date source) {
            return LocalDateTime.ofInstant(source.toInstant(), ZONA_CHILE);
        }
    }

    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(List.of(
                new LocalDateTimeToDateChileConverter(),
                new DateToLocalDateTimeChileConverter()
        ));
    }

    @Bean
    public BeforeConvertCallback<Pago> asignarIdSecuencialPago(ObjectProvider<MongoTemplate> mongoTemplateProvider) {
        return (entidad, coleccion) -> {
            if (entidad.getId() == null) {
                Query query = new Query().with(Sort.by(Sort.Direction.DESC, "_id")).limit(1);
                Pago ultimo = mongoTemplateProvider.getObject().findOne(query, Pago.class, coleccion);
                long siguienteId = (ultimo != null && ultimo.getId() != null) ? ultimo.getId() + 1L : 1L;
                entidad.setId(siguienteId);
            }
            return entidad;
        };
    }

    @Bean
    public CommandLineRunner inicializarMongoPagos(PagoRepository pagoRepository) {
        return args -> {
            try {
                if (pagoRepository.count() == 0) {
                    log.info("Inicializando transacciones de pago en MongoDB Atlas (el_volcan_db, TZ America/Santiago)...");
                    List<Pago> pagos = List.of(
                            crearPago(1L, 1L, 36980.0, "webpay_debito", "TRX-582910", "AUT-194022", "0001", "maria.gomez@gmail.com", "MARIA GOMEZ", LocalDateTime.of(2026, 10, 20, 10, 16)),
                            crearPago(2L, 3L, 49970.0, "webpay_credito", "TRX-748201", "AUT-839201", "0001", "ana.torres@gmail.com", "ANA TORRES", LocalDateTime.of(2026, 10, 19, 16, 32)),
                            crearPago(3L, 4L, 135000.0, "webpay_debito", "TRX-639104", "AUT-512098", "0001", "contacto@panaderiaelsol.cl", "PANADERIA EL SOL", LocalDateTime.of(2026, 10, 19, 14, 22)),
                            crearPago(4L, 8L, 23990.0, "webpay_debito", "TRX-918273", "AUT-384756", "0001", "pedro.salinas@gmail.com", "PEDRO SALINAS", LocalDateTime.of(2026, 10, 19, 17, 46))
                    );
                    pagoRepository.saveAll(pagos);
                }
            } catch (Exception e) {
                log.warn("No se pudo ejecutar la semilla inicial de ms-pago en MongoDB: {}", e.getMessage());
            }
        };
    }

    private Pago crearPago(
            Long id, Long idVenta, Double monto, String metodo, String trx,
            String aut, String terminacion, String email, String titular, LocalDateTime fecha
    ) {
        return Pago.builder()
                .id(id)
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
