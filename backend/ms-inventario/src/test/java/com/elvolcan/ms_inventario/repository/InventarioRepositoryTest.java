package com.elvolcan.ms_inventario.repository;

import com.elvolcan.ms_inventario.enums.EstadoMovimiento;
import com.elvolcan.ms_inventario.enums.EstadoStock;
import com.elvolcan.ms_inventario.enums.TipoMovimiento;
import com.elvolcan.ms_inventario.model.Inventario;
import com.elvolcan.ms_inventario.model.MovimientoInventario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:inventariodb;MODE=Oracle;DEFAULT_NULL_ORDERING=HIGH",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.flyway.enabled=true",
        "spring.flyway.locations=classpath:db/migration",
        "eureka.client.enabled=false"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class InventarioRepositoryTest {

    @Autowired
    private InventarioRepository inventarioRepository;

    @Autowired
    private MovimientoInventarioRepository movimientoRepository;

    @Test
    void guardarInventarioYMovimientoConFk_debeValidarEsquemaYVersion() {
        Inventario inv = inventarioRepository.saveAndFlush(Inventario.builder()
                .codigoProducto("CL999")
                .nombreProducto("Cilindro prueba")
                .stockActual(50)
                .stockMinimo(10)
                .ubicacionBodega("Bodega Central")
                .estadoStock(EstadoStock.OK)
                .fechaActualizacion(LocalDateTime.of(2026, 11, 26, 10, 0))
                .fechaActualizacionChile("2026-11-26T10:00:00-03:00")
                .zonaHoraria("America/Santiago")
                .build());

        assertNotNull(inv.getId());
        assertNotNull(inv.getVersion());

        MovimientoInventario mov = movimientoRepository.saveAndFlush(MovimientoInventario.builder()
                .idInventario(inv.getId())
                .codigoProducto(inv.getCodigoProducto())
                .tipoMovimiento(TipoMovimiento.SALIDA)
                .cantidad(5)
                .stockAnterior(50)
                .stockNuevo(45)
                .observacion("Venta prueba")
                .estadoMovimiento(EstadoMovimiento.COMPLETADO)
                .fechaMovimiento(LocalDateTime.of(2026, 11, 26, 10, 5))
                .fechaMovimientoChile("2026-11-26T10:05:00-03:00")
                .zonaHoraria("America/Santiago")
                .build());

        assertNotNull(mov.getId());
        List<MovimientoInventario> historial = movimientoRepository
                .findByCodigoProductoIgnoreCaseOrderByFechaMovimientoDesc("cl999");
        assertEquals(1, historial.size());
        assertEquals(inv.getId(), historial.get(0).getIdInventario());

        assertTrue(inventarioRepository.findForUpdateByCodigoProducto("cl999").isPresent());
    }
}
