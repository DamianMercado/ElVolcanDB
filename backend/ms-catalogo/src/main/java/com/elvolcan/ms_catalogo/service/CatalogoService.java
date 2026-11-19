package com.elvolcan.ms_catalogo.service;

import com.elvolcan.ms_catalogo.client.AuthClient;
import com.elvolcan.ms_catalogo.client.InventarioClient;
import com.elvolcan.ms_catalogo.dto.request.ProductoCatalogoRequest;
import com.elvolcan.ms_catalogo.dto.response.InventarioExternoResponse;
import com.elvolcan.ms_catalogo.dto.response.ProductoCatalogoResponse;
import com.elvolcan.ms_catalogo.enums.EstadoProducto;
import com.elvolcan.ms_catalogo.exception.ProductoCatalogoNoEncontradoException;
import com.elvolcan.ms_catalogo.mapper.CatalogoMapper;
import com.elvolcan.ms_catalogo.model.ProductoCatalogo;
import com.elvolcan.ms_catalogo.repository.ProductoCatalogoRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CatalogoService {

    private static final Logger log = LoggerFactory.getLogger(CatalogoService.class);

    private final ProductoCatalogoRepository catalogoRepository;
    private final CatalogoMapper catalogoMapper;
    private final InventarioClient inventarioClient;
    private final AuthClient authClient;

    public void autenticarConMsAuth(String authHeader) {
        if (authHeader != null && !authHeader.isBlank()) {
            String token = authHeader.replace("Bearer ", "").trim();
            try {
                Map<String, Object> validacion = authClient.validarToken(token);
                if (validacion == null || !Boolean.TRUE.equals(validacion.get("valido"))) {
                    throw new SecurityException("Token inválido o no autorizado por ms-auth");
                }
            } catch (SecurityException e) {
                throw e;
            } catch (Exception e) {
                log.warn("No se pudo verificar token contra ms-auth: {}", e.getMessage());
            }
        }
    }

    public void exigirAutenticacionEscritura(String authHeader) {
        if (authHeader == null || authHeader.isBlank() || !authHeader.startsWith("Bearer ")) {
            throw new SecurityException("No autorizado: se requiere iniciar sesión con un token JWT válido");
        }
        autenticarConMsAuth(authHeader);
    }

    private ProductoCatalogoResponse enriquecerConInventarioEImagen(ProductoCatalogo producto) {
        ProductoCatalogoResponse response = catalogoMapper.toResponse(producto);
        response.setImagenEndpoint("/api/v1/catalogo/imagenes/" + producto.getCodigo() + ".webp");

        try {
            InventarioExternoResponse inv = inventarioClient.obtenerStockPorCodigo(producto.getCodigo());
            if (inv != null) {
                response.setStock(inv.getStockActual());
                response.setMinimo(inv.getStockMinimo());
                response.setEstadoStock(inv.getEstadoStock());
            } else {
                response.setStock(0);
                response.setMinimo(0);
                response.setEstadoStock("SIN_STOCK");
            }
        } catch (Exception e) {
            log.warn("No se pudo consultar ms-inventario para el producto {}: {}", producto.getCodigo(), e.getMessage());
            response.setStock(0);
            response.setMinimo(0);
            response.setEstadoStock("SIN_CONEXION_INVENTARIO");
        }

        return response;
    }

    private void sincronizarStockConInventario(ProductoCatalogo producto, Integer stock, Integer minimo) {
        if (stock == null && minimo == null) {
            return;
        }
        try {
            int stockFinal = stock != null ? stock : 0;
            int minimoFinal = minimo != null ? minimo : Math.max(10, stockFinal / 3);
            inventarioClient.sincronizarStockProducto(
                    producto.getCodigo(),
                    producto.getNombre(),
                    stockFinal,
                    minimoFinal
            );
        } catch (Exception e) {
            log.warn("No se pudo sincronizar stock en ms-inventario para {}: {}", producto.getCodigo(), e.getMessage());
        }
    }

    private String resolverCodigoProducto(ProductoCatalogoRequest request) {
        if (request.getCodigo() != null && !request.getCodigo().isBlank()) {
            return request.getCodigo().toUpperCase().trim();
        }
        String prefijo = "PR";
        if (request.getCategoria() != null && request.getCategoria().length() >= 2) {
            prefijo = request.getCategoria().substring(0, 2).toUpperCase();
        }
        long correlativo = catalogoRepository.count() + 1;
        String candidato = String.format("%s%03d", prefijo, correlativo);
        while (catalogoRepository.existsByCodigoIgnoreCase(candidato)) {
            correlativo++;
            candidato = String.format("%s%03d", prefijo, correlativo);
        }
        return candidato;
    }

    @Transactional(readOnly = true)
    public List<ProductoCatalogoResponse> obtenerTodos() {
        log.info("Obteniendo catálogo activo con stock desde ms-inventario");
        return catalogoRepository.findAll()
                .stream()
                .filter(p -> p.getEstado() != EstadoProducto.ELIMINADO)
                .map(this::enriquecerConInventarioEImagen)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductoCatalogoResponse obtenerPorId(Long id) {
        ProductoCatalogo producto = catalogoRepository.findById(id)
                .orElseThrow(() -> new ProductoCatalogoNoEncontradoException(id));
        return enriquecerConInventarioEImagen(producto);
    }

    @Transactional(readOnly = true)
    public ProductoCatalogoResponse obtenerPorCodigo(String codigo) {
        ProductoCatalogo producto = catalogoRepository.findByCodigoIgnoreCase(codigo.trim())
                .orElseThrow(() -> new ProductoCatalogoNoEncontradoException(
                        "Producto no encontrado con código: " + codigo));
        return enriquecerConInventarioEImagen(producto);
    }

    @Transactional(readOnly = true)
    public List<ProductoCatalogoResponse> obtenerPorCategoria(String categoria) {
        return catalogoRepository.findByCategoriaIgnoreCase(categoria.trim())
                .stream()
                .filter(p -> p.getEstado() != EstadoProducto.ELIMINADO)
                .map(this::enriquecerConInventarioEImagen)
                .toList();
    }

    @Transactional
    public ProductoCatalogoResponse crear(ProductoCatalogoRequest request) {
        String codigoFinal = resolverCodigoProducto(request);
        if (catalogoRepository.existsByCodigoIgnoreCase(codigoFinal)) {
            throw new IllegalArgumentException("Ya existe un producto con el código: " + codigoFinal);
        }

        ProductoCatalogo producto = catalogoMapper.toEntity(request);
        producto.setCodigo(codigoFinal);
        if (producto.getCategoria() == null || producto.getCategoria().isBlank()) {
            producto.setCategoria("Accesorios");
        }
        if (producto.getEstado() == null) {
            producto.setEstado(EstadoProducto.ACTIVO);
        }

        ProductoCatalogo guardado = catalogoRepository.save(producto);
        sincronizarStockConInventario(guardado, request.getStock() != null ? request.getStock() : 0, request.getMinimo());
        return enriquecerConInventarioEImagen(guardado);
    }

    @Transactional
    public ProductoCatalogoResponse actualizar(Long id, ProductoCatalogoRequest request) {
        ProductoCatalogo producto = catalogoRepository.findById(id)
                .orElseThrow(() -> new ProductoCatalogoNoEncontradoException(id));

        if (request.getCodigo() != null && !request.getCodigo().isBlank()) {
            producto.setCodigo(request.getCodigo().toUpperCase().trim());
        }
        producto.setNombre(request.getNombre());
        if (request.getDescripcion() != null) {
            producto.setDescripcion(request.getDescripcion());
        }
        producto.setPrecio(request.getPrecio());
        if (request.getCategoria() != null && !request.getCategoria().isBlank()) {
            producto.setCategoria(request.getCategoria());
        }
        producto.setImagen(request.getImagen());
        if (request.getEstado() != null) {
            producto.setEstado(request.getEstado());
        }

        ProductoCatalogo actualizado = catalogoRepository.save(producto);
        sincronizarStockConInventario(actualizado, request.getStock(), request.getMinimo());
        return enriquecerConInventarioEImagen(actualizado);
    }

    @Transactional
    public ProductoCatalogoResponse actualizarImagen(Long id, String nuevaRutaImagen) {
        ProductoCatalogo producto = catalogoRepository.findById(id)
                .orElseThrow(() -> new ProductoCatalogoNoEncontradoException(id));
        producto.setImagen(nuevaRutaImagen);
        return enriquecerConInventarioEImagen(catalogoRepository.save(producto));
    }

    @Transactional
    public void eliminar(Long id) {
        ProductoCatalogo producto = catalogoRepository.findById(id)
                .orElseThrow(() -> new ProductoCatalogoNoEncontradoException(id));
        producto.setEstado(EstadoProducto.ELIMINADO);
        catalogoRepository.save(producto);
    }

    public Resource obtenerArchivoImagen(String nombreArchivo) {
        String archivoNormalizado = nombreArchivo.endsWith(".webp")
                ? nombreArchivo
                : nombreArchivo + ".webp";
        Resource resource = new ClassPathResource("static/imagenes/productos/" + archivoNormalizado);
        if (!resource.exists()) {
            throw new ProductoCatalogoNoEncontradoException("Imagen no encontrada: " + nombreArchivo);
        }
        return resource;
    }
}
