package com.elvolcan.ms_usuario.repository;

import com.elvolcan.ms_usuario.enums.RolUsuario;
import com.elvolcan.ms_usuario.model.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:usuariodb;MODE=Oracle;DEFAULT_NULL_ORDERING=HIGH",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.flyway.enabled=true",
        "spring.flyway.locations=classpath:db/migration",
        "eureka.client.enabled=false"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UsuarioRepositoryTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void guardarYConsultarPorEmailYRut_debeValidarEsquemaOracle() {
        Usuario u = usuarioRepository.saveAndFlush(Usuario.builder()
                .nombre("Andrea")
                .apellido("Muñoz")
                .password("$2a$10$hashDePrueba123456789012345678901234567890123456789012")
                .email("andrea.test@el-volcan.com")
                .rut("12345678-9")
                .telefono("+56 9 1111 1111")
                .direccion("Av. Vicuña Mackenna 450")
                .comuna("Puente Alto")
                .rol(RolUsuario.ADMIN)
                .latActual(new BigDecimal("-33.598500"))
                .lngActual(new BigDecimal("-70.578000"))
                .activo(true)
                .build());

        assertNotNull(u.getId());
        assertTrue(usuarioRepository.existsByEmail("andrea.test@el-volcan.com"));
        assertTrue(usuarioRepository.findByRut("12345678-9").isPresent());
        assertEquals(1, usuarioRepository.findByRol(RolUsuario.ADMIN).size());
    }
}
