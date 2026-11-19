package com.elvolcan.ms_inventario.service;

import com.elvolcan.ms_inventario.client.AuthClient;
import com.elvolcan.ms_inventario.dto.response.InventarioResponse;
import com.elvolcan.ms_inventario.enums.EstadoStock;
import com.elvolcan.ms_inventario.mapper.InventarioMapper;
import com.elvolcan.ms_inventario.model.Inventario;
import com.elvolcan.ms_inventario.repository.InventarioRepository;
import com.elvolcan.ms_inventario.repository.MovimientoInventarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

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
}
