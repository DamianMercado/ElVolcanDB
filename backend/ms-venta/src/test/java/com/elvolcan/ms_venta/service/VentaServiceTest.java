package com.elvolcan.ms_venta.service;

import com.elvolcan.ms_venta.client.*;
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
}
