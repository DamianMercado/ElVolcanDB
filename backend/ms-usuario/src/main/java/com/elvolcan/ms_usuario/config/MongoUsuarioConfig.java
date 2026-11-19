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
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertCallback;
import org.springframework.data.mongodb.core.query.Query;

import java.util.List;
import java.util.Map;

@Configuration
public class MongoUsuarioConfig {

    private static final Logger log = LoggerFactory.getLogger(MongoUsuarioConfig.class);

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
            MongoTemplate mongoTemplate
    ) {
        return args -> {
            try {
                if (usuarioRepository.count() == 0) {
                    log.info("Inicializando usuarios, clientes, repartidores y zonas_despacho en MongoDB Atlas (el_volcan_db)...");
                    List<Usuario> usuarios = List.of(
                            crearUsuario(1L, "Andrea", "Muñoz", "admin123", "admin@el-volcan.com", "11111111-1",
                                    "+56 9 1111 1111", "Casa Matriz El Volcán 100", "Puente Alto", RolUsuario.ADMIN,
                                    null, 1, null, List.of(-70.5758, -33.6117)),
                            crearUsuario(2L, "Operador", "Empleado", "operador123", "operador@el-volcan.com", "22222222-2",
                                    "+56 9 2222 2222", "Av. Concha y Toro 500", "Puente Alto", RolUsuario.OPERADOR,
                                    null, 1, null, List.of(-70.5750, -33.6100)),
                            crearUsuario(3L, "Carlos", "Ruiz", "repartidor123", "repartidor@el-volcan.com", "33333333-3",
                                    "+56 9 3333 3333", "Ruta Norte 120", "Puente Alto", RolUsuario.REPARTIDOR,
                                    null, 1, "KJ-WP-42", List.of(-72.1045, -36.6078)),
                            crearUsuario(4L, "Cliente", "Usuario", "cliente123", "cliente@el-volcan.com", "44444444-4",
                                    "+56 9 4444 4444", "Av. Concha y Toro 1420", "Puente Alto", RolUsuario.CLIENTE,
                                    "RESIDENCIAL", 1, null, List.of(-72.1023, -36.6067)),
                            crearUsuario(5L, "Diego", "Fuentes", "repartidor123", "diego.fuentes@el-volcan.com", "55555555-5",
                                    "+56 9 5555 5555", "Ruta Sur 240", "La Florida", RolUsuario.REPARTIDOR,
                                    null, 2, "LP-RT-88", List.of(-72.0812, -36.6104)),
                            crearUsuario(6L, "Valentina", "Soto", "repartidor123", "valentina.soto@el-volcan.com", "66666666-6",
                                    "+56 9 6666 6666", "Ruta Centro 310", "Puente Alto", RolUsuario.REPARTIDOR,
                                    null, 3, "KJ-WP-42", List.of(-71.9120, -36.6850))
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
                            .append("nombre_zona", "Zona Centro")
                            .append("comunas_descripcion", "Chillán (sectores centro, norte y sur)")
                            .append("comunas", List.of("Chillán Centro", "Chillán Norte", "Chillán Sur", "Puente Alto"))
                            .append("dias_despacho", List.of("LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"))
                            .append("horario", new Document("hora_inicio", 8).append("hora_fin", 20).append("etiqueta", "08:00 – 20:00"))
                            .append("comision_extra_clp", 0),
                    new Document("_id", 2)
                            .append("nombre_zona", "Zona Oriente")
                            .append("comunas_descripcion", "Chillán (sector oriente), Chillán Viejo")
                            .append("comunas", List.of("Chillán Oriente", "Chillán Viejo", "La Florida"))
                            .append("dias_despacho", List.of("LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"))
                            .append("horario", new Document("hora_inicio", 8).append("hora_fin", 18).append("etiqueta", "08:00 – 18:00"))
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
                            .append("rut", "15.678.234-1")
                            .append("nombre", "Carlos Alberto Muñoz")
                            .append("patente_camion", "KJ-WP-42")
                            .append("id_zona_base", 1)
                            .append("activo", true)
                            .append("ubicacion_actual", new Document("type", "Point").append("coordinates", List.of(-72.1045, -36.6078))),
                    new Document("_id", 2)
                            .append("rut", "17.982.410-6")
                            .append("nombre", "Héctor Patricio Sandoval")
                            .append("patente_camion", "LP-RT-88")
                            .append("id_zona_base", 2)
                            .append("activo", true)
                            .append("ubicacion_actual", new Document("type", "Point").append("coordinates", List.of(-72.0812, -36.6104))),
                    new Document("_id", 3)
                            .append("rut", "18.450.119-3")
                            .append("nombre", "Rodrigo Andrés Garrido")
                            .append("patente_camion", "KJ-WP-42")
                            .append("id_zona_base", 3)
                            .append("activo", true)
                            .append("ubicacion_actual", new Document("type", "Point").append("coordinates", List.of(-71.9120, -36.6850)))
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
