package com.elvolcan.ms_usuario.config;

import com.elvolcan.ms_usuario.enums.RolUsuario;
import com.elvolcan.ms_usuario.model.Usuario;
import com.elvolcan.ms_usuario.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class OracleUsuarioInitializer {

    private static final Logger log = LoggerFactory.getLogger(OracleUsuarioInitializer.class);

    @Bean
    public CommandLineRunner inicializarOracleUsuarios(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            try {
                if (usuarioRepository.count() == 0) {
                    log.info("Inicializando usuarios base (ADMIN, OPERADOR, REPARTIDOR, CLIENTE) en Oracle SQL (ELVOLCAN_USUARIO)...");
                    // Se insertan en orden determinista para alinear los IDs 1..6 con las referencias base de ms-auth y ms-venta.
                    List<Usuario> usuarios = List.of(
                            crearUsuario("Andrea", "Muñoz", passwordEncoder.encode("admin123"), "admin@el-volcan.com", "11111111-1",
                                    "+56 9 1111 1111", "Av. Vicuña Mackenna 450", "Puente Alto", RolUsuario.ADMIN,
                                    null, 1, null, new BigDecimal("-33.598500"), new BigDecimal("-70.578000")),
                            crearUsuario("Operador", "Empleado", passwordEncoder.encode("operador123"), "operador@el-volcan.com", "22222222-2",
                                    "+56 9 2222 2222", "Av. Concha y Toro 500", "Puente Alto", RolUsuario.OPERADOR,
                                    null, 1, null, new BigDecimal("-33.601200"), new BigDecimal("-70.577200")),
                            crearUsuario("Carlos", "Ruiz", passwordEncoder.encode("repartidor123"), "repartidor@el-volcan.com", "33333333-3",
                                    "+56 9 3333 3333", "Ruta Norte 120", "Puente Alto", RolUsuario.REPARTIDOR,
                                    null, 1, "KJ-WP-42", new BigDecimal("-33.598500"), new BigDecimal("-70.578000")),
                            crearUsuario("Cliente", "Usuario", passwordEncoder.encode("cliente123"), "cliente@el-volcan.com", "44444444-4",
                                    "+56 9 4444 4444", "Av. Concha y Toro 1420", "Puente Alto", RolUsuario.CLIENTE,
                                    "RESIDENCIAL", 1, null, new BigDecimal("-33.614500"), new BigDecimal("-70.576500")),
                            crearUsuario("Diego", "Fuentes", passwordEncoder.encode("repartidor123"), "diego.fuentes@el-volcan.com", "55555555-5",
                                    "+56 9 5555 5555", "Ruta Sur 240", "La Florida", RolUsuario.REPARTIDOR,
                                    null, 2, "LP-RT-88", new BigDecimal("-33.542000"), new BigDecimal("-70.588000")),
                            crearUsuario("Valentina", "Soto", passwordEncoder.encode("repartidor123"), "valentina.soto@el-volcan.com", "66666666-6",
                                    "+56 9 6666 6666", "Ruta Centro 310", "Puente Alto", RolUsuario.REPARTIDOR,
                                    null, 1, "BV-9281", new BigDecimal("-33.608000"), new BigDecimal("-70.575000"))
                    );
                    usuarioRepository.saveAll(usuarios);
                }
            } catch (Exception e) {
                log.warn("No se pudo ejecutar la semilla inicial de ms-usuario en Oracle SQL: {}", e.getMessage());
            }
        };
    }

    private Usuario crearUsuario(
            String nombre, String apellido, String password,
            String email, String rut, String telefono, String direccion,
            String comuna, RolUsuario rol, String tipoCliente,
            Integer idZona, String patenteCamion, BigDecimal latActual, BigDecimal lngActual
    ) {
        return Usuario.builder()
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
                .latActual(latActual)
                .lngActual(lngActual)
                .activo(true)
                .build();
    }
}
