package com.elvolcan.ms_venta.service;

import com.elvolcan.ms_venta.client.*;
import com.elvolcan.ms_venta.dto.request.ItemVentaRequest;
import com.elvolcan.ms_venta.dto.request.VentaPagoRequest;
import com.elvolcan.ms_venta.dto.request.VentaRequest;
import com.elvolcan.ms_venta.dto.response.ProductoCatalogoExternoResponse;
import com.elvolcan.ms_venta.dto.response.VentaCompletaResponse;
import com.elvolcan.ms_venta.dto.response.VentaResponse;
import com.elvolcan.ms_venta.enums.EstadoVenta;
import com.elvolcan.ms_venta.exception.VentaNoEncontradaException;
import com.elvolcan.ms_venta.mapper.VentaMapper;
import com.elvolcan.ms_venta.model.DetalleVenta;
import com.elvolcan.ms_venta.model.Venta;
import com.elvolcan.ms_venta.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VentaService {

    private static final Logger log = LoggerFactory.getLogger(VentaService.class);

    private final VentaRepository ventaRepository;
    private final VentaMapper ventaMapper;

    private final AuthClient authClient;
    private final UsuarioClient usuarioClient;
    private final CatalogoClient catalogoClient;
    private final InventarioClient inventarioClient;
    private final PagoClient pagoClient;

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

    @Transactional(readOnly = true)
    public List<VentaResponse> obtenerTodas() {
        log.info("Obteniendo todas las ventas");
        return ventaMapper.toResponseList(ventaRepository.findAll());
    }

    @Transactional(readOnly = true)
    public VentaResponse obtenerPorId(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));
        return ventaMapper.toResponse(venta);
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> obtenerPorUsuario(Long idUsuario) {
        return ventaMapper.toResponseList(ventaRepository.findByIdUsuario(idUsuario));
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> obtenerPorEstado(EstadoVenta estado) {
        return ventaMapper.toResponseList(ventaRepository.findByEstadoVenta(estado));
    }

    @Transactional
    public VentaResponse crearVenta(VentaRequest request) {
        log.info("Generando nueva venta para cliente: {}", request.getCliente());

        if (request.getIdUsuario() != null) {
            try {
                authClient.validarUsuario(request.getIdUsuario());
            } catch (Exception e) {
                log.warn("Aviso al verificar usuario {} en ms-auth: {}", request.getIdUsuario(), e.getMessage());
            }
        }

        Venta venta = Venta.builder()
                .codigoVenta("EV-" + (100 + ventaRepository.count() + 1))
                .idUsuario(request.getIdUsuario())
                .cliente(request.getCliente())
                .rut(request.getRut())
                .email(request.getEmail())
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .comuna(request.getComuna())
                .observacion(request.getObservacion())
                .metodoPago(request.getMetodoPago())
                .estadoVenta(EstadoVenta.PENDIENTE)
                .estadoPago("PENDIENTE")
                .fechaVenta(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        double totalVenta = 0.0;
        int cantidadTotalUnidades = 0;
        List<String> resumenes = new ArrayList<>();

        for (ItemVentaRequest itemReq : request.getItems()) {
            ProductoCatalogoExternoResponse producto;
            try {
                producto = catalogoClient.obtenerProductoPorCodigo(itemReq.getCodigoProducto());
            } catch (Exception e) {
                throw new IllegalArgumentException(
                        "Producto no encontrado en ms-catalogo con código: " + itemReq.getCodigoProducto());
            }

            if (producto.getStock() != null && producto.getStock() < itemReq.getCantidad()) {
                throw new IllegalArgumentException(
                        "Stock insuficiente para " + producto.getNombre() + ". Disponible: " + producto.getStock());
            }

            // Descontar stock en ms-inventario
            inventarioClient.descontarStock(
                    producto.getCodigo(),
                    itemReq.getCantidad(),
                    "Venta " + venta.getCodigoVenta() + " - Cliente: " + request.getCliente());

            double subtotal = producto.getPrecio() * itemReq.getCantidad();
            totalVenta += subtotal;
            cantidadTotalUnidades += itemReq.getCantidad();
            resumenes.add(producto.getNombre() + " x" + itemReq.getCantidad());

            DetalleVenta detalle = DetalleVenta.builder()
                    .venta(venta)
                    .codigoProducto(producto.getCodigo())
                    .nombreProducto(producto.getNombre())
                    .precioUnitario(producto.getPrecio())
                    .cantidad(itemReq.getCantidad())
                    .subtotal(subtotal)
                    .build();
            venta.getItems().add(detalle);
        }

        venta.setTotal(totalVenta);
        venta.setDetalle(cantidadTotalUnidades + " (" + String.join(", ", resumenes) + ")");

        Venta guardada = ventaRepository.save(venta);
        log.info("Venta creada exitosamente con ID: {} y código: {}", guardada.getId(), guardada.getCodigoVenta());
        return ventaMapper.toResponse(guardada);
    }

    @Transactional
    public VentaResponse confirmarPago(Long id, VentaPagoRequest request) {
        log.info("Confirmando pago ID {} para venta ID {}", request.getIdPago(), id);
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));

        venta.setIdPago(request.getIdPago());
        venta.setEstadoPago("PAGADO");

        return ventaMapper.toResponse(ventaRepository.save(venta));
    }

    @Transactional
    public VentaResponse asignarRepartidor(Long id, String nombreRepartidor) {
        log.info("Asignando repartidor '{}' a la venta ID {}", nombreRepartidor, id);
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));

        if (venta.getEstadoVenta() == EstadoVenta.CANCELADA) {
            throw new IllegalStateException("No se puede asignar repartidor a una venta cancelada");
        }

        venta.setRepartidor(nombreRepartidor);
        venta.setEstadoVenta(EstadoVenta.EN_RUTA);
        return ventaMapper.toResponse(ventaRepository.save(venta));
    }

    @Transactional
    public VentaResponse marcarEntregada(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));

        venta.setEstadoVenta(EstadoVenta.ENTREGADO);
        venta.setEstadoPago("PAGADO");
        return ventaMapper.toResponse(ventaRepository.save(venta));
    }

    @Transactional
    public VentaResponse cancelarVenta(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));

        if (venta.getEstadoVenta() == EstadoVenta.ENTREGADO) {
            throw new IllegalStateException("No se puede cancelar una venta ya entregada");
        }

        for (DetalleVenta item : venta.getItems()) {
            try {
                inventarioClient.reponerStock(
                        item.getCodigoProducto(),
                        item.getCantidad(),
                        "Reintegro por cancelación de venta " + venta.getCodigoVenta());
            } catch (Exception e) {
                log.warn("No se pudo reponer stock de {} al cancelar venta: {}",
                        item.getCodigoProducto(), e.getMessage());
            }
        }

        venta.setEstadoVenta(EstadoVenta.CANCELADA);
        return ventaMapper.toResponse(ventaRepository.save(venta));
    }

    @Transactional(readOnly = true)
    public VentaCompletaResponse obtenerVentaCompleta(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));

        VentaCompletaResponse response = new VentaCompletaResponse();
        response.setVenta(ventaMapper.toResponse(venta));

        if (venta.getIdUsuario() != null) {
            try {
                response.setUsuario(usuarioClient.obtenerUsuarioPorId(venta.getIdUsuario()));
            } catch (Exception e) {
                log.warn("No se pudo obtener usuario para venta {}: {}", id, e.getMessage());
            }
        }

        if (venta.getIdPago() != null) {
            try {
                response.setPago(pagoClient.obtenerPagoPorId(venta.getIdPago()));
            } catch (Exception e) {
                log.warn("No se pudo obtener pago para venta {}: {}", id, e.getMessage());
            }
        }

        return response;
    }

    @Transactional
    public void eliminar(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));
        ventaRepository.delete(venta);
    }
}
