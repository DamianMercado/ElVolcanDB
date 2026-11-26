package com.elvolcan.ms_pago.repository;

import com.elvolcan.ms_pago.enums.EstadoPago;
import com.elvolcan.ms_pago.model.Pago;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:pagodb;MODE=Oracle;DEFAULT_NULL_ORDERING=HIGH",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.flyway.enabled=true",
        "spring.flyway.locations=classpath:db/migration",
        "eureka.client.enabled=false"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PagoRepositoryTest {

    @Autowired
    private PagoRepository pagoRepository;

    @Test
    void guardarYBuscarPorIdVenta_debePersistirConPrecisionBigDecimal() {
        Pago pago = Pago.builder()
                .idVenta(99L)
                .montoPago(new BigDecimal("36980.00"))
                .metodoPago("webpay_debito")
                .estadoPago(EstadoPago.PAGADO)
                .codigoTransaccion("TRX-900001")
                .codigoAutorizacion("AUT-900001")
                .tarjetaTerminacion("0001")
                .emailComprobante("cliente@el-volcan.com")
                .nombreTitular("CLIENTE TEST")
                .fechaPago(LocalDateTime.of(2026, 11, 26, 10, 0))
                .fechaPagoChile("2026-11-26T10:00:00-03:00")
                .zonaHoraria("America/Santiago")
                .build();

        Pago guardado = pagoRepository.saveAndFlush(pago);
        assertNotNull(guardado.getId());
        assertEquals(0, new BigDecimal("36980.00").compareTo(guardado.getMontoPago()));

        List<Pago> encontrados = pagoRepository.findByIdVenta(99L);
        assertEquals(1, encontrados.size());
        assertEquals("TRX-900001", encontrados.get(0).getCodigoTransaccion());
    }
}
