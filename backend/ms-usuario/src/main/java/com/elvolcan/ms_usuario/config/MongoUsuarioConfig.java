package com.elvolcan.ms_usuario.config;

import com.elvolcan.ms_usuario.enums.RolUsuario;
import com.elvolcan.ms_usuario.model.Usuario;
import com.elvolcan.ms_usuario.repository.UsuarioRepository;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import com.mongodb.client.model.ReplaceOptions;
import org.bson.Document;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Configuration
public class MongoUsuarioConfig {

    private static final Logger log = LoggerFactory.getLogger(MongoUsuarioConfig.class);
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
    public BeforeConvertCallback<Usuario> asignarIdSecuencialUsuario(MongoTemplate mongoTemplate) {
        return (entidad, coleccion) -> {
            if (entidad.getId() == null) {
                Query query = new Query().with(Sort.by(Sort.Direction.DESC, "_id")).limit(1);
                Usuario ultimo = mongoTemplate.findOne(query, Usuario.class, coleccion);
                long siguienteId = (ultimo != null && ultimo.getId() != null) ? ultimo.getId() + 1L : 1L;
                entidad.setId(siguienteId);
            }
            return entidad;
        };
    }

    @Bean
    public CommandLineRunner inicializarMongoUsuarios(
            UsuarioRepository usuarioRepository,
            MongoTemplate mongoTemplate,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            try {
                if (usuarioRepository.count() == 0) {
                    log.info("Inicializando usuarios, clientes, repartidores y zonas_despacho en MongoDB (Puente Alto / Santiago)...");
                    List<Usuario> usuarios = List.of(
                            crearUsuario(1L, "Andrea", "Muñoz", passwordEncoder.encode("admin123"), "admin@el-volcan.com", "11111111-1",
                                    "+56 9 1111 1111", "Av. Vicuña Mackenna 450", "Puente Alto", RolUsuario.ADMIN,
                                    null, 1, null, List.of(-70.5780, -33.5985)),
                            crearUsuario(2L, "Operador", "Empleado", passwordEncoder.encode("operador123"), "operador@el-volcan.com", "22222222-2",
                                    "+56 9 2222 2222", "Av. Concha y Toro 500", "Puente Alto", RolUsuario.OPERADOR,
                                    null, 1, null, List.of(-70.5772, -33.6012)),
                            crearUsuario(3L, "Carlos", "Ruiz", passwordEncoder.encode("repartidor123"), "repartidor@el-volcan.com", "33333333-3",
                                    "+56 9 3333 3333", "Ruta Norte 120", "Puente Alto", RolUsuario.REPARTIDOR,
                                    null, 1, "KJ-WP-42", List.of(-70.5780, -33.5985)),
                            crearUsuario(4L, "Cliente", "Usuario", passwordEncoder.encode("cliente123"), "cliente@el-volcan.com", "44444444-4",
                                    "+56 9 4444 4444", "Av. Concha y Toro 1420", "Puente Alto", RolUsuario.CLIENTE,
                                    "RESIDENCIAL", 1, null, List.of(-70.5765, -33.6145)),
                            crearUsuario(5L, "Diego", "Fuentes", passwordEncoder.encode("repartidor123"), "diego.fuentes@el-volcan.com", "55555555-5",
                                    "+56 9 5555 5555", "Ruta Sur 240", "La Florida", RolUsuario.REPARTIDOR,
                                    null, 2, "LP-RT-88", List.of(-70.5880, -33.5420)),
                            crearUsuario(6L, "Valentina", "Soto", passwordEncoder.encode("repartidor123"), "valentina.soto@el-volcan.com", "66666666-6",
                                    "+56 9 6666 6666", "Ruta Centro 310", "Puente Alto", RolUsuario.REPARTIDOR,
                                    null, 1, "BV-9281", List.of(-70.5750, -33.6080))
                    );
                    usuarioRepository.saveAll(usuarios);
                }

                inicializarColeccionesNoSqlGeo(mongoTemplate);
            } catch (Exception e) {
                log.warn("No se pudo ejecutar la semilla inicial de ms-usuario en MongoDB: {}", e.getMessage());
            }
        };
    }

    private void inicializarColeccionesNoSqlGeo(MongoTemplate mongoTemplate) {
        if (!mongoTemplate.collectionExists("zonas_despacho") || mongoTemplate.getCollection("zonas_despacho").countDocuments() == 0) {
            List<Document> zonas = List.of(
                    new Document("_id", 1)
                            .append("nombre_zona", "Zona Sur — Puente Alto")
                            .append("comunas_descripcion", "Puente Alto (sectores centro, norte y sur)")
                            .append("comunas", List.of("Puente Alto", "Pirque", "San José de Maipo"))
                            .append("dias_despacho", List.of("LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"))
                            .append("horario", new Document("hora_inicio", 8).append("hora_fin", 20).append("etiqueta", "08:00 – 20:00"))
                            .append("comision_extra_clp", 0),
                    new Document("_id", 2)
                            .append("nombre_zona", "Zona Oriente — La Florida")
                            .append("comunas_descripcion", "La Florida, Macul y Peñalolén")
                            .append("comunas", List.of("La Florida", "Macul", "Peñalolén"))
                            .append("dias_despacho", List.of("LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"))
                            .append("horario", new Document("hora_inicio", 8).append("hora_fin", 19).append("etiqueta", "08:00 – 19:00"))
                            .append("comision_extra_clp", 150)
            );
            for (Document z : zonas) {
                mongoTemplate.getCollection("zonas_despacho").replaceOne(
                        new Document("_id", z.get("_id")), z, new ReplaceOptions().upsert(true));
            }
        }

        if (!mongoTemplate.collectionExists("repartidores") || mongoTemplate.getCollection("repartidores").countDocuments() == 0) {
            List<Document> repartidores = List.of(
                    new Document("_id", 1)
                            .append("rut", "33333333-3")
                            .append("nombre", "Carlos Ruiz")
                            .append("patente_camion", "KJ-WP-42")
                            .append("id_zona_base", 1)
                            .append("activo", true)
                            .append("ubicacion_actual", new Document("type", "Point").append("coordinates", List.of(-70.5780, -33.5985))),
                    new Document("_id", 2)
                            .append("rut", "55555555-5")
                            .append("nombre", "Diego Fuentes")
                            .append("patente_camion", "LP-RT-88")
                            .append("id_zona_base", 2)
                            .append("activo", true)
                            .append("ubicacion_actual", new Document("type", "Point").append("coordinates", List.of(-70.5880, -33.5420))),
                    new Document("_id", 3)
                            .append("rut", "66666666-6")
                            .append("nombre", "Valentina Soto")
                            .append("patente_camion", "BV-9281")
                            .append("id_zona_base", 1)
                            .append("activo", true)
                            .append("ubicacion_actual", new Document("type", "Point").append("coordinates", List.of(-70.5750, -33.6080)))
            );
            for (Document r : repartidores) {
                mongoTemplate.getCollection("repartidores").replaceOne(
                        new Document("_id", r.get("_id")), r, new ReplaceOptions().upsert(true));
            }
            mongoTemplate.getCollection("repartidores").createIndex(
                    Indexes.geo2dsphere("ubicacion_actual"), new IndexOptions().name("idx_repartidor_geo"));
        }
    }

    private Usuario crearUsuario(
            Long id, String nombre, String apellido, String password,
            String email, String rut, String telefono, String direccion,
            String comuna, RolUsuario rol, String tipoCliente,
            Integer idZona, String patenteCamion, List<Double> coordenadas
    ) {
        return Usuario.builder()
                .id(id)
                .nombre(nombre)
                .apellido(apellido)
                .password(password)
                .email(email)
                .rut(rut)
                .telefono(telefono)
                .direccion(direccion)
                .comuna(comuna)
                .rol(rol)
                .tipoCliente(tipoCliente)
                .idZona(idZona)
                .patenteCamion(patenteCamion)
                .ubicacionActual(Map.of("type", "Point", "coordinates", coordenadas))
                .activo(true)
                .build();
    }
}
