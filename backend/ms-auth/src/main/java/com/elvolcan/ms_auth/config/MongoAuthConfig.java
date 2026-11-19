package com.elvolcan.ms_auth.config;

import com.elvolcan.ms_auth.enums.EstadoSesion;
import com.elvolcan.ms_auth.model.SesionAuth;
import com.elvolcan.ms_auth.repository.SesionAuthRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertCallback;
import org.springframework.data.mongodb.core.query.Query;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class MongoAuthConfig {

    private static final Logger log = LoggerFactory.getLogger(MongoAuthConfig.class);

    @Bean
    public BeforeConvertCallback<SesionAuth> asignarIdSecuencialSesion(MongoTemplate mongoTemplate) {
        return (entidad, coleccion) -> {
            if (entidad.getId() == null) {
                Query query = new Query().with(Sort.by(Sort.Direction.DESC, "_id")).limit(1);
                SesionAuth ultimo = mongoTemplate.findOne(query, SesionAuth.class, coleccion);
                long siguienteId = (ultimo != null && ultimo.getId() != null) ? ultimo.getId() + 1L : 1L;
                entidad.setId(siguienteId);
            }
            return entidad;
        };
    }

    @Bean
    public CommandLineRunner inicializarMongoSesiones(SesionAuthRepository repository) {
        return args -> {
            try {
                if (repository.count() == 0) {
                    log.info("Inicializando sesiones JWT en MongoDB Atlas (el_volcan_db)...");
                    LocalDateTime inicio = LocalDateTime.of(2026, 1, 1, 8, 0);
                    LocalDateTime expiracion = LocalDateTime.of(2027, 12, 31, 23, 59, 59);
                    List<SesionAuth> sesiones = List.of(
                            crearSesion(1L, 1L, "Andrea Muñoz", "admin@el-volcan.com", "ADMIN", "EV-TOKEN-ADMIN-001", inicio, expiracion),
                            crearSesion(2L, 2L, "Operador Empleado", "operador@el-volcan.com", "OPERADOR", "EV-TOKEN-OPERADOR-002", inicio, expiracion),
                            crearSesion(3L, 3L, "Carlos Ruiz", "repartidor@el-volcan.com", "REPARTIDOR", "EV-TOKEN-REPARTIDOR-003", inicio, expiracion),
                            crearSesion(4L, 4L, "Cliente Usuario", "cliente@el-volcan.com", "CLIENTE", "EV-TOKEN-CLIENTE-004", inicio, expiracion),
                            crearSesion(5L, 5L, "Diego Fuentes", "diego.fuentes@el-volcan.com", "REPARTIDOR", "EV-TOKEN-REPARTIDOR-005", inicio, expiracion),
                            crearSesion(6L, 6L, "Valentina Soto", "valentina.soto@el-volcan.com", "REPARTIDOR", "EV-TOKEN-REPARTIDOR-006", inicio, expiracion)
                    );
                    repository.saveAll(sesiones);
                }
            } catch (Exception e) {
                log.warn("No se pudo ejecutar la semilla inicial de ms-auth en MongoDB: {}", e.getMessage());
            }
        };
    }

    private SesionAuth crearSesion(
            Long id, Long idUsuario, String nombreUsuario, String email,
            String rol, String token, LocalDateTime inicio, LocalDateTime expiracion
    ) {
        return SesionAuth.builder()
                .id(id)
                .idUsuario(idUsuario)
                .nombreUsuario(nombreUsuario)
                .email(email)
                .rol(rol)
                .token(token)
                .fechaInicio(inicio)
                .fechaExpiracion(expiracion)
                .estado(EstadoSesion.ACTIVA)
                .build();
    }
}
