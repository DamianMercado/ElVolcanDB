package com.elvolcan.ms_venta.config;

import com.elvolcan.ms_venta.enums.EstadoVenta;
import com.elvolcan.ms_venta.model.DetalleVenta;
import com.elvolcan.ms_venta.model.Venta;
import com.elvolcan.ms_venta.repository.VentaRepository;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Configuration
public class MongoVentaConfig {

    private static final Logger log = LoggerFactory.getLogger(MongoVentaConfig.class);
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
    public BeforeConvertCallback<Venta> asignarIdSecuencialVenta(MongoTemplate mongoTemplate) {
        return (entidad, coleccion) -> {
            if (entidad.getId() == null) {
                Query query = new Query().with(Sort.by(Sort.Direction.DESC, "_id")).limit(1);
                Venta ultima = mongoTemplate.findOne(query, Venta.class, coleccion);
                long siguienteId = (ultima != null && ultima.getId() != null) ? ultima.getId() + 1L : 1L;
                entidad.setId(siguienteId);
            }
            if (entidad.getItems() != null) {
                long idx = 1L;
                for (DetalleVenta item : entidad.getItems()) {
                    if (item.getId() == null) {
                        item.setId(idx);
                    }
                    idx++;
                }
            }
            return entidad;
        };
    }

    @Bean
    public CommandLineRunner inicializarMongoVentas(
            VentaRepository ventaRepository,
            MongoTemplate mongoTemplate
    ) {
        return args -> {
            try {
                if (ventaRepository.count() == 0) {
                    log.info("Inicializando ventas/pedidos con líneas embebidas y GeoJSON Santiago en MongoDB Atlas (el_volcan_db)...");
                    List<Venta> ventas = List.of(
                            crearVenta(1L, "EV-101", 4L, "Maria Gomez", "12345678-1", "maria.gomez@gmail.com", "+56 9 9111 2222",
                                    "Calle Las Flores #23", "Puente Alto", "Casa esquina", "2 (5kg x1, 11kg x1)",
                                    36980.0, "pagar_ahora", EstadoVenta.EN_RUTA, "PAGADO", 1L, "Carlos Ruiz",
                                    LocalDateTime.of(2026, 10, 20, 10, 15), List.of(-70.5765, -33.6145),
                                    List.of(
                                            crearDetalle(1L, "CL001", "Cilindro gas licuado 5 kg", 12990.0, 1, 12990.0),
                                            crearDetalle(2L, "CL002", "Cilindro gas licuado 11 kg", 23990.0, 1, 23990.0)
                                    )),
                            crearVenta(2L, "EV-102", 4L, "Juan Perez", "13456789-2", "juan.perez@gmail.com", "+56 9 9222 3333",
                                    "Av. Concha y Toro #1340", "Puente Alto", "Tocar timbre 2", "1 (15kg x1)",
                                    31990.0, "repartidor", EstadoVenta.EN_RUTA, "PENDIENTE", null, "Carlos Ruiz",
                                    LocalDateTime.of(2026, 10, 20, 11, 0), List.of(-70.5758, -33.6117),
                                    List.of(crearDetalle(3L, "CL003", "Cilindro gas licuado 15 kg", 31990.0, 1, 31990.0))),
                            crearVenta(3L, "EV-103", 4L, "Ana Torres", "14567890-3", "ana.torres@gmail.com", "+56 9 9333 4444",
                                    "Barrio San Jose #10", "La Florida", "", "3 (5kg x2, 11kg x1)",
                                    49970.0, "pagar_ahora", EstadoVenta.ENTREGADO, "PAGADO", 2L, "Carlos Ruiz",
                                    LocalDateTime.of(2026, 10, 19, 16, 30), List.of(-70.5882, -33.5425),
                                    List.of(
                                            crearDetalle(4L, "CL001", "Cilindro gas licuado 5 kg", 12990.0, 2, 25980.0),
                                            crearDetalle(5L, "CL002", "Cilindro gas licuado 11 kg", 23990.0, 1, 23990.0)
                                    )),
                            crearVenta(4L, "EV-104", 4L, "Panadería El Sol", "76123456-7", "contacto@panaderiaelsol.cl", "+56 9 9444 1111",
                                    "Calle Walker Martínez 980", "La Florida", "Entregar por acceso lateral", "3 (45kg x3)",
                                    135000.0, "pagar_ahora", EstadoVenta.ENTREGADO, "PAGADO", 3L, "Diego Fuentes",
                                    LocalDateTime.of(2026, 10, 19, 14, 20), List.of(-70.5840, -33.5290),
                                    List.of(crearDetalle(6L, "CL004", "Cilindro gas licuado 45 kg", 45000.0, 3, 135000.0))),
                            crearVenta(5L, "EV-105", 4L, "Restaurante La Picada", "77654321-8", "administracion@lapicada.cl", "+56 9 9555 2222",
                                    "Av. La Florida 8520", "La Florida", "Cocina principal", "2 (45kg x1, regulador alta presión x1)",
                                    63990.0, "repartidor", EstadoVenta.EN_RUTA, "PENDIENTE", null, "Diego Fuentes",
                                    LocalDateTime.of(2026, 10, 20, 11, 45), List.of(-70.5730, -33.5560),
                                    List.of(
                                            crearDetalle(7L, "CL004", "Cilindro gas licuado 45 kg", 45000.0, 1, 45000.0),
                                            crearDetalle(8L, "RG002", "Regulador de alta presión", 18990.0, 1, 18990.0)
                                    )),
                            crearVenta(6L, "EV-106", 4L, "Jorge Soto", "15678901-4", "jorge.soto@gmail.com", "+56 9 9444 5555",
                                    "Pasaje Los Robles 45", "Puente Alto", "Reja blanca", "2 (11kg x2)",
                                    47980.0, "repartidor", EstadoVenta.PENDIENTE, "PENDIENTE", null, null,
                                    LocalDateTime.of(2026, 10, 20, 12, 30), List.of(-70.5720, -33.6190),
                                    List.of(crearDetalle(9L, "CL002", "Cilindro gas licuado 11 kg", 23990.0, 2, 47980.0))),
                            crearVenta(7L, "EV-107", 4L, "Camila Reyes", "16789012-5", "camila.reyes@gmail.com", "+56 9 9666 7777",
                                    "Av. Camilo Henríquez #120", "Puente Alto", "Depto 204", "1 (detector de gas x1)",
                                    19990.0, "repartidor", EstadoVenta.PENDIENTE, "PENDIENTE", null, null,
                                    LocalDateTime.of(2026, 10, 20, 13, 10), List.of(-70.5680, -33.6050),
                                    List.of(crearDetalle(10L, "AC003", "Detector de gas a batería", 19990.0, 1, 19990.0))),
                            crearVenta(8L, "EV-108", 4L, "Pedro Salinas", "17890123-6", "pedro.salinas@gmail.com", "+56 9 9777 8888",
                                    "Pasaje Los Aromos #5", "Puente Alto", "Portón de madera", "1 (11kg x1)",
                                    23990.0, "pagar_ahora", EstadoVenta.ENTREGADO, "PAGADO", 4L, "Valentina Soto",
                                    LocalDateTime.of(2026, 10, 19, 17, 45), List.of(-70.5810, -33.6170),
                                    List.of(crearDetalle(11L, "CL002", "Cilindro gas licuado 11 kg", 23990.0, 1, 23990.0))),
                            crearVenta(9L, "EV-109", 4L, "Almacén Don Luis", "78901234-9", "donluis.almacen@gmail.com", "+56 9 9888 9999",
                                    "Av. México 340", "Puente Alto", "Local comercial esquina", "4 (15kg x4)",
                                    127960.0, "repartidor", EstadoVenta.EN_RUTA, "PENDIENTE", null, "Valentina Soto",
                                    LocalDateTime.of(2026, 10, 20, 12, 5), List.of(-70.5795, -33.6075),
                                    List.of(crearDetalle(12L, "CL003", "Cilindro gas licuado 15 kg", 31990.0, 4, 127960.0)))
                    );
                    ventaRepository.saveAll(ventas);
                    mongoTemplate.getCollection("venta").createIndex(
                            Indexes.geo2dsphere("entrega.ubicacion"), new IndexOptions().name("idx_venta_geo"));
                }
            } catch (Exception e) {
                log.warn("No se pudo ejecutar la semilla inicial de ms-venta en MongoDB: {}", e.getMessage());
            }
        };
    }

    private Venta crearVenta(
            Long id, String codigoVenta, Long idUsuario, String cliente, String rut,
            String email, String telefono, String direccion, String comuna, String observacion,
            String detalle, Double total, String metodoPago, EstadoVenta estadoVenta,
            String estadoPago, Long idPago, String repartidor, LocalDateTime fechaVenta,
            List<Double> coordenadas, List<DetalleVenta> items
    ) {
        String fechaChileIso = fechaVenta.atZone(ZONA_CHILE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        String estadoDespacho = switch (estadoVenta) {
            case EN_RUTA -> "en_camino";
            case ENTREGADO -> "entregado";
            case CANCELADA -> "cancelado";
            default -> "pendiente";
        };

        Map<String, Object> entrega = new LinkedHashMap<>();
        entrega.put("estado_despacho", estadoDespacho);
        entrega.put("direccion_entrega", direccion + ", " + comuna);
        entrega.put("ubicacion", Map.of("type", "Point", "coordinates", coordenadas));
        entrega.put("origen", Map.of(
                "lat", -33.5985,
                "lng", -70.5780,
                "nombre", "Planta El Volcán - Distribuidora Central",
                "direccion", "Av. Vicuña Mackenna 450, Puente Alto, Santiago"
        ));
        entrega.put("destino", Map.of(
                "lat", coordenadas.get(1),
                "lng", coordenadas.get(0),
                "direccion", direccion + ", " + comuna
        ));
        entrega.put("posicion_actual", Map.of(
                "lat", estadoVenta == EstadoVenta.ENTREGADO ? coordenadas.get(1) : -33.5985,
                "lng", estadoVenta == EstadoVenta.ENTREGADO ? coordenadas.get(0) : -70.5780,
                "rumbo", 180.0,
                "indice_punto", 0
        ));
        entrega.put("eta_minutos", estadoVenta == EstadoVenta.ENTREGADO ? 0 : 9);
        entrega.put("distancia_km", estadoVenta == EstadoVenta.ENTREGADO ? 0.0 : 2.4);
        entrega.put("velocidad_kmh", estadoVenta == EstadoVenta.EN_RUTA ? 38 : 0);
        if (repartidor != null) {
            entrega.put("repartidor_nombre", repartidor);
        }
        entrega.put("ultima_actualizacion_chile", fechaChileIso);

        return Venta.builder()
                .id(id)
                .codigoVenta(codigoVenta)
                .idUsuario(idUsuario)
                .cliente(cliente)
                .rut(rut)
                .email(email)
                .telefono(telefono)
                .direccion(direccion)
                .comuna(comuna)
                .observacion(observacion)
                .detalle(detalle)
                .total(total)
                .metodoPago(metodoPago)
                .estadoVenta(estadoVenta)
                .estadoPago(estadoPago)
                .idPago(idPago)
                .repartidor(repartidor)
                .fechaVenta(fechaVenta)
                .fechaVentaChile(fechaChileIso)
                .zonaHoraria(ZONA_CHILE.getId())
                .idZona(1)
                .entrega(entrega)
                .auditoria(List.of(Map.of(
                        "evento", "CREACION",
                        "descripcion", "Pedido " + codigoVenta + " registrado",
                        "fecha_chile", fechaChileIso,
                        "zona_horaria", ZONA_CHILE.getId()
                )))
                .items(items)
                .build();
    }

    private DetalleVenta crearDetalle(Long id, String codigo, String nombre, Double precio, int cantidad, Double subtotal) {
        return DetalleVenta.builder()
                .id(id)
                .codigoProducto(codigo)
                .nombreProducto(nombre)
                .precioUnitario(precio)
                .cantidad(cantidad)
                .subtotal(subtotal)
                .build();
    }
}
