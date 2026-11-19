package com.elvolcan.ms_catalogo.service;

import com.elvolcan.ms_catalogo.client.AuthClient;
import com.elvolcan.ms_catalogo.client.InventarioClient;
import com.elvolcan.ms_catalogo.dto.response.InventarioExternoResponse;
import com.elvolcan.ms_catalogo.dto.response.ProductoCatalogoResponse;
import com.elvolcan.ms_catalogo.enums.EstadoProducto;
import com.elvolcan.ms_catalogo.mapper.CatalogoMapper;
import com.elvolcan.ms_catalogo.model.ProductoCatalogo;
import com.elvolcan.ms_catalogo.repository.ProductoCatalogoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogoServiceTest {

    @Mock
    private ProductoCatalogoRepository catalogoRepository;

    @Mock
    private CatalogoMapper catalogoMapper;

    @Mock
    private InventarioClient inventarioClient;

    @Mock
    private AuthClient authClient;

    @InjectMocks
    private CatalogoService catalogoService;

    @Test
    void obtenerPorCodigo_debeEnriquecerConStockDeInventario() {
        ProductoCatalogo prod = ProductoCatalogo.builder()
                .id(1L)
                .codigo("CL002")
                .nombre("Cilindro gas licuado 11 kg")
                .precio(23990.0)
                .imagen("/src/assets/img/productos/CL002.webp")
                .estado(EstadoProducto.ACTIVO)
                .build();
        ProductoCatalogoResponse baseResp = ProductoCatalogoResponse.builder()
                .id(1L)
                .codigo("CL002")
                .nombre("Cilindro gas licuado 11 kg")
                .precio(23990.0)
                .imagen("/src/assets/img/productos/CL002.webp")
                .estado(EstadoProducto.ACTIVO)
                .build();
        InventarioExternoResponse invResp = InventarioExternoResponse.builder()
                .codigoProducto("CL002")
                .stockActual(60)
                .stockMinimo(50)
                .estadoStock("OK")
                .build();

        when(catalogoRepository.findByCodigoIgnoreCase("CL002")).thenReturn(Optional.of(prod));
        when(catalogoMapper.toResponse(prod)).thenReturn(baseResp);
        when(inventarioClient.obtenerStockPorCodigo("CL002")).thenReturn(invResp);

        ProductoCatalogoResponse resultado = catalogoService.obtenerPorCodigo("CL002");
        assertEquals(60, resultado.getStock());
        assertEquals("/api/v1/catalogo/imagenes/CL002.webp", resultado.getImagenEndpoint());
    }
}
