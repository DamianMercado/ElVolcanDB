package com.elvolcan.ms_venta.service;

import com.elvolcan.ms_venta.client.*;
import com.elvolcan.ms_venta.dto.request.SeguimientoVentaRequest;
import com.elvolcan.ms_venta.dto.response.VentaResponse;
import com.elvolcan.ms_venta.enums.EstadoVenta;
import com.elvolcan.ms_venta.mapper.VentaMapper;
import com.elvolcan.ms_venta.model.Venta;
import com.elvolcan.ms_venta.repository.VentaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VentaServiceTest {

    @Mock
    private VentaRepository ventaRepository;

    @Mock
    private VentaMapper ventaMapper;

    @Mock
    private AuthClient authClient;

    @Mock
    private UsuarioClient usuarioClient;

    @Mock
    private CatalogoClient catalogoClient;

    @Mock
    private InventarioClient inventarioClient;

    @Mock
    private PagoClient pagoClient;

    @InjectMocks
    private VentaService ventaService;

    @Test
    void obtenerPorId_debeRetornarVenta() {
        Venta v = Venta.builder().id(1L).codigoVenta("EV-101").estadoVenta(EstadoVenta.EN_RUTA).build();
        VentaResponse r = VentaResponse.builder().id(1L).codigoVenta("EV-101").estadoVenta(EstadoVenta.EN_RUTA).build();

        when(ventaRepository.findById(1L)).thenReturn(Optional.of(v));
        when(ventaMapper.toResponse(v)).thenReturn(r);

        VentaResponse res = ventaService.obtenerPorId(1L);
        assertEquals("EV-101", res.getCodigoVenta());
    }

    @Test
    void obtenerPorCodigo_debeBuscarSinImportarPrefijoNumeral() {
        Venta v = Venta.builder().id(1L).codigoVenta("EV-101").estadoVenta(EstadoVenta.EN_RUTA).build();
        VentaResponse r = VentaResponse.builder().id(1L).codigoVenta("EV-101").estadoVenta(EstadoVenta.EN_RUTA).build();

        when(ventaRepository.findByCodigoVentaIgnoreCase("EV-101")).thenReturn(Optional.of(v));
        when(ventaMapper.toResponse(v)).thenReturn(r);

        VentaResponse res = ventaService.obtenerPorCodigo("#EV-101");
        assertEquals("EV-101", res.getCodigoVenta());
    }

    @Test
    void actualizarSeguimiento_debeActualizarPosicionYEstadoConHoraChile() {
        Venta v = Venta.builder()
                .id(2L)
                .codigoVenta("EV-102")
                .direccion("Av. Concha y Toro 1340")
                .comuna("Puente Alto")
                .estadoVenta(EstadoVenta.PENDIENTE)
                .estadoPago("PENDIENTE")
                .build();

        SeguimientoVentaRequest req = SeguimientoVentaRequest.builder()
                .lat(-33.6050)
                .lng(-70.5770)
                .rumbo(180.0)
                .indicePunto(5)
                .etaMinutos(4)
                .distanciaKm(1.1)
                .velocidadKmH(38)
                .estadoDespacho("en_camino")
                .repartidor("Carlos Ruiz")
                .build();

        when(ventaRepository.findById(2L)).thenReturn(Optional.of(v));
        when(ventaRepository.save(any(Venta.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ventaMapper.toResponse(any(Venta.class))).thenAnswer(inv -> {
            Venta guardada = inv.getArgument(0);
            return VentaResponse.builder()
                    .id(guardada.getId())
                    .codigoVenta(guardada.getCodigoVenta())
                    .estadoVenta(guardada.getEstadoVenta())
                    .repartidor(guardada.getRepartidor())
                    .entrega(guardada.getEntrega())
                    .auditoria(guardada.getAuditoria())
                    .build();
        });

        VentaResponse res = ventaService.actualizarSeguimiento(2L, req);
        assertEquals(EstadoVenta.EN_RUTA, res.getEstadoVenta());
        assertEquals("Carlos Ruiz", res.getRepartidor());
        assertNotNull(res.getEntrega());
        assertEquals("en_camino", res.getEntrega().get("estado_despacho"));
        assertNotNull(res.getEntrega().get("ultima_actualizacion_chile"));
        assertFalse(res.getAuditoria().isEmpty());
    }
}
