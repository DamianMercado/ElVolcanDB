package com.elvolcan.ms_pago.service;

import com.elvolcan.ms_pago.client.AuthClient;
import com.elvolcan.ms_pago.client.VentaClient;
import com.elvolcan.ms_pago.dto.response.PagoResponse;
import com.elvolcan.ms_pago.enums.EstadoPago;
import com.elvolcan.ms_pago.mapper.PagoMapper;
import com.elvolcan.ms_pago.model.Pago;
import com.elvolcan.ms_pago.repository.PagoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PagoServiceTest {

    @Mock
    private PagoRepository pagoRepository;

    @Mock
    private PagoMapper pagoMapper;

    @Mock
    private VentaClient ventaClient;

    @Mock
    private AuthClient authClient;

    @InjectMocks
    private PagoService pagoService;

    @Test
    void obtenerPorId_debeRetornarPago() {
        Pago p = Pago.builder().id(1L).idVenta(1L).montoPago(36980.0).estadoPago(EstadoPago.PAGADO).build();
        PagoResponse r = PagoResponse.builder().id(1L).idVenta(1L).montoPago(36980.0).estadoPago(EstadoPago.PAGADO).build();

        when(pagoRepository.findById(1L)).thenReturn(Optional.of(p));
        when(pagoMapper.toResponse(p)).thenReturn(r);

        PagoResponse res = pagoService.obtenerPorId(1L);
        assertEquals(EstadoPago.PAGADO, res.getEstadoPago());
    }
}
