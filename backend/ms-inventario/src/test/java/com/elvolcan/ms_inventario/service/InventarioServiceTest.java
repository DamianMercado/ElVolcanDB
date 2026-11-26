package com.elvolcan.ms_inventario.service;

import com.elvolcan.ms_inventario.client.AuthClient;
import com.elvolcan.ms_inventario.dto.request.MovimientoInventarioRequest;
import com.elvolcan.ms_inventario.dto.response.InventarioResponse;
import com.elvolcan.ms_inventario.dto.response.MovimientoInventarioResponse;
import com.elvolcan.ms_inventario.enums.EstadoStock;
import com.elvolcan.ms_inventario.enums.TipoMovimiento;
import com.elvolcan.ms_inventario.mapper.InventarioMapper;
import com.elvolcan.ms_inventario.model.Inventario;
import com.elvolcan.ms_inventario.model.MovimientoInventario;
import com.elvolcan.ms_inventario.repository.InventarioRepository;
import com.elvolcan.ms_inventario.repository.MovimientoInventarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventarioServiceTest {

    @Mock
    private InventarioRepository inventarioRepository;

    @Mock
    private MovimientoInventarioRepository movimientoRepository;

    @Mock
    private InventarioMapper inventarioMapper;

    @Mock
    private AuthClient authClient;

    @InjectMocks
    private InventarioService inventarioService;

    @Test
    void obtenerPorCodigoProducto_debeRetornarStock() {
        Inventario inv = Inventario.builder()
                .id(1L)
                .codigoProducto("CL002")
                .stockActual(60)
                .stockMinimo(50)
                .estadoStock(EstadoStock.OK)
                .build();
        InventarioResponse resp = InventarioResponse.builder()
                .id(1L)
                .codigoProducto("CL002")
                .stockActual(60)
                .stockMinimo(50)
                .estadoStock(EstadoStock.OK)
                .build();

        when(inventarioRepository.findByCodigoProductoIgnoreCase("CL002")).thenReturn(Optional.of(inv));
        when(inventarioMapper.toResponse(inv)).thenReturn(resp);

        InventarioResponse res = inventarioService.obtenerPorCodigoProducto("CL002");
        assertEquals(60, res.getStockActual());
        assertEquals(EstadoStock.OK, res.getEstadoStock());
    }

    @Test
    void registrarMovimientoSalida_debeDescontarStockUsandoBloqueoPesimista() {
        Inventario inv = Inventario.builder()
                .id(5L)
                .codigoProducto("CL002")
                .stockActual(20)
                .stockMinimo(10)
                .estadoStock(EstadoStock.OK)
                .build();

        MovimientoInventarioRequest req = MovimientoInventarioRequest.builder()
                .codigoProducto("CL002")
                .tipoMovimiento(TipoMovimiento.SALIDA)
                .cantidad(4)
                .observacion("Venta EV-200")
                .build();

        when(inventarioRepository.findForUpdateByCodigoProducto("CL002")).thenReturn(Optional.of(inv));
        when(inventarioRepository.save(any(Inventario.class))).thenAnswer(i -> i.getArgument(0));
        when(movimientoRepository.save(any(MovimientoInventario.class))).thenAnswer(i -> i.getArgument(0));
        when(inventarioMapper.toMovimientoResponse(any(MovimientoInventario.class)))
                .thenReturn(MovimientoInventarioResponse.builder().stockAnterior(20).stockNuevo(16).build());

        MovimientoInventarioResponse res = inventarioService.registrarMovimiento(req);
        assertEquals(16, inv.getStockActual());
        assertEquals(16, res.getStockNuevo());
        verify(inventarioRepository).findForUpdateByCodigoProducto("CL002");
        verify(movimientoRepository).save(any(MovimientoInventario.class));
    }

    @Test
    void registrarMovimientoSalida_sinStockSuficiente_debeRechazar() {
        Inventario inv = Inventario.builder()
                .id(5L)
                .codigoProducto("CL002")
                .stockActual(2)
                .stockMinimo(10)
                .estadoStock(EstadoStock.CRITICO)
                .build();

        MovimientoInventarioRequest req = MovimientoInventarioRequest.builder()
                .codigoProducto("CL002")
                .tipoMovimiento(TipoMovimiento.SALIDA)
                .cantidad(5)
                .build();

        when(inventarioRepository.findForUpdateByCodigoProducto("CL002")).thenReturn(Optional.of(inv));

        assertThrows(IllegalArgumentException.class, () -> inventarioService.registrarMovimiento(req));
        verify(movimientoRepository, never()).save(any());
    }
}
