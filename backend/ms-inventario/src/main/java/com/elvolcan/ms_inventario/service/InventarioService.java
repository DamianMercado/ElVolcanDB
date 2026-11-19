package com.elvolcan.ms_inventario.service;

import com.elvolcan.ms_inventario.client.AuthClient;
import com.elvolcan.ms_inventario.dto.request.InventarioRequest;
import com.elvolcan.ms_inventario.dto.request.MovimientoInventarioRequest;
import com.elvolcan.ms_inventario.dto.response.InventarioResponse;
import com.elvolcan.ms_inventario.dto.response.MovimientoInventarioResponse;
import com.elvolcan.ms_inventario.enums.EstadoMovimiento;
import com.elvolcan.ms_inventario.enums.EstadoStock;
import com.elvolcan.ms_inventario.enums.TipoMovimiento;
import com.elvolcan.ms_inventario.exception.InventarioNoEncontradoException;
import com.elvolcan.ms_inventario.mapper.InventarioMapper;
import com.elvolcan.ms_inventario.model.Inventario;
import com.elvolcan.ms_inventario.model.MovimientoInventario;
import com.elvolcan.ms_inventario.repository.InventarioRepository;
import com.elvolcan.ms_inventario.repository.MovimientoInventarioRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InventarioService {

    private static final Logger log = LoggerFactory.getLogger(InventarioService.class);

    private final InventarioRepository inventarioRepository;
    private final MovimientoInventarioRepository movimientoRepository;
    private final InventarioMapper inventarioMapper;
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
                log.warn("No se pudo contactar a ms-auth para validar token: {}", e.getMessage());
            }
        }
    }

    @Transactional(readOnly = true)
    public List<InventarioResponse> obtenerTodo() {
        log.info("Obteniendo todo el inventario");
        return inventarioMapper.toResponseList(inventarioRepository.findAll());
    }

    @Transactional(readOnly = true)
    public InventarioResponse obtenerPorId(Long id) {
        log.info("Buscando inventario con ID: {}", id);
        Inventario inventario = inventarioRepository.findById(id)
                .orElseThrow(() -> new InventarioNoEncontradoException(id));
        return inventarioMapper.toResponse(inventario);
    }

    @Transactional(readOnly = true)
    public InventarioResponse obtenerPorCodigoProducto(String codigoProducto) {
        log.info("Buscando stock en inventario para código: {}", codigoProducto);
        Inventario inventario = inventarioRepository.findByCodigoProductoIgnoreCase(codigoProducto.trim())
                .orElseThrow(() -> new InventarioNoEncontradoException(
                        "No existe inventario para el producto con código: " + codigoProducto));
        return inventarioMapper.toResponse(inventario);
    }

    @Transactional
    public InventarioResponse crear(InventarioRequest request) {
        log.info("Creando inventario para producto: {}", request.getCodigoProducto());
        if (inventarioRepository.existsByCodigoProductoIgnoreCase(request.getCodigoProducto())) {
            throw new IllegalArgumentException(
                    "Ya existe un registro de inventario para el código: " + request.getCodigoProducto());
        }

        Inventario inventario = inventarioMapper.toEntity(request);
        inventario.setCodigoProducto(request.getCodigoProducto().toUpperCase().trim());
        inventario.setEstadoStock(EstadoStock.calcularEstado(request.getStockActual(), request.getStockMinimo()));
        inventario.setFechaActualizacion(LocalDateTime.now());

        Inventario guardado = inventarioRepository.save(inventario);
        return inventarioMapper.toResponse(guardado);
    }

    @Transactional
    public InventarioResponse actualizar(Long id, InventarioRequest request) {
        log.info("Actualizando inventario ID: {}", id);
        Inventario inventario = inventarioRepository.findById(id)
                .orElseThrow(() -> new InventarioNoEncontradoException(id));

        inventario.setCodigoProducto(request.getCodigoProducto().toUpperCase().trim());
        inventario.setNombreProducto(request.getNombreProducto());
        inventario.setStockActual(request.getStockActual());
        inventario.setStockMinimo(request.getStockMinimo());
        inventario.setUbicacionBodega(request.getUbicacionBodega());
        inventario.setEstadoStock(EstadoStock.calcularEstado(request.getStockActual(), request.getStockMinimo()));
        inventario.setFechaActualizacion(LocalDateTime.now());

        return inventarioMapper.toResponse(inventarioRepository.save(inventario));
    }

    @Transactional
    public void eliminar(Long id) {
        Inventario inventario = inventarioRepository.findById(id)
                .orElseThrow(() -> new InventarioNoEncontradoException(id));
        inventarioRepository.delete(inventario);
    }

    @Transactional
    public InventarioResponse sincronizarStockProducto(String codigoProducto, String nombreProducto, Integer stockActual, Integer stockMinimo) {
        String codigoNormalizado = codigoProducto.toUpperCase().trim();
        int stockFinal = stockActual != null ? Math.max(0, stockActual) : 0;
        int minimoFinal = stockMinimo != null ? Math.max(0, stockMinimo) : Math.max(10, stockFinal / 3);

        Inventario inventario = inventarioRepository.findByCodigoProductoIgnoreCase(codigoNormalizado)
                .orElseGet(() -> Inventario.builder()
                        .codigoProducto(codigoNormalizado)
                        .ubicacionBodega("Bodega Central")
                        .build());

        inventario.setNombreProducto(nombreProducto != null && !nombreProducto.isBlank() ? nombreProducto : codigoNormalizado);
        inventario.setStockActual(stockFinal);
        inventario.setStockMinimo(minimoFinal);
        inventario.setEstadoStock(EstadoStock.calcularEstado(stockFinal, minimoFinal));
        inventario.setFechaActualizacion(LocalDateTime.now());

        return inventarioMapper.toResponse(inventarioRepository.save(inventario));
    }

    @Transactional
    public MovimientoInventarioResponse registrarMovimiento(MovimientoInventarioRequest request) {
        log.info("Registrando movimiento {} de {} unidades para producto {}",
                request.getTipoMovimiento(), request.getCantidad(), request.getCodigoProducto());

        Inventario inventario = inventarioRepository.findByCodigoProductoIgnoreCase(request.getCodigoProducto().trim())
                .orElseThrow(() -> new InventarioNoEncontradoException(
                        "No existe inventario para el código: " + request.getCodigoProducto()));

        int stockAnterior = inventario.getStockActual();
        int stockNuevo = stockAnterior;
        EstadoMovimiento estadoMovimiento = EstadoMovimiento.COMPLETADO;

        if (request.getTipoMovimiento() == TipoMovimiento.ENTRADA) {
            stockNuevo = stockAnterior + request.getCantidad();
        } else if (request.getTipoMovimiento() == TipoMovimiento.SALIDA) {
            if (stockAnterior < request.getCantidad()) {
                throw new IllegalArgumentException(
                        "Stock insuficiente para el producto " + inventario.getCodigoProducto()
                                + ". Stock disponible: " + stockAnterior + ", solicitado: " + request.getCantidad());
            }
            stockNuevo = stockAnterior - request.getCantidad();
        } else if (request.getTipoMovimiento() == TipoMovimiento.AJUSTE) {
            stockNuevo = request.getCantidad();
        } else if (request.getTipoMovimiento() == TipoMovimiento.SOLICITUD_REPOSICION) {
            // Una solicitud queda PENDIENTE hasta que se marque como recibida
            estadoMovimiento = EstadoMovimiento.PENDIENTE;
            stockNuevo = stockAnterior;
        }

        if (estadoMovimiento == EstadoMovimiento.COMPLETADO) {
            inventario.setStockActual(stockNuevo);
            inventario.setEstadoStock(EstadoStock.calcularEstado(stockNuevo, inventario.getStockMinimo()));
            inventario.setFechaActualizacion(LocalDateTime.now());
            inventarioRepository.save(inventario);
        }

        MovimientoInventario movimiento = MovimientoInventario.builder()
                .idInventario(inventario.getId())
                .codigoProducto(inventario.getCodigoProducto())
                .tipoMovimiento(request.getTipoMovimiento())
                .cantidad(request.getCantidad())
                .stockAnterior(stockAnterior)
                .stockNuevo(stockNuevo)
                .observacion(request.getObservacion())
                .estadoMovimiento(estadoMovimiento)
                .fechaMovimiento(LocalDateTime.now())
                .build();

        return inventarioMapper.toMovimientoResponse(movimientoRepository.save(movimiento));
    }

    @Transactional
    public InventarioResponse descontarStock(String codigoProducto, Integer cantidad, String motivo) {
        MovimientoInventarioRequest movRequest = MovimientoInventarioRequest.builder()
                .codigoProducto(codigoProducto)
                .tipoMovimiento(TipoMovimiento.SALIDA)
                .cantidad(cantidad)
                .observacion(motivo != null ? motivo : "Salida por venta de cliente")
                .build();
        registrarMovimiento(movRequest);
        return obtenerPorCodigoProducto(codigoProducto);
    }

    @Transactional
    public InventarioResponse reponerStock(String codigoProducto, Integer cantidad, String motivo) {
        MovimientoInventarioRequest movRequest = MovimientoInventarioRequest.builder()
                .codigoProducto(codigoProducto)
                .tipoMovimiento(TipoMovimiento.ENTRADA)
                .cantidad(cantidad)
                .observacion(motivo != null ? motivo : "Entrada / reposición de stock")
                .build();
        registrarMovimiento(movRequest);
        return obtenerPorCodigoProducto(codigoProducto);
    }

    @Transactional
    public MovimientoInventarioResponse confirmarRecepcionSolicitud(Long idMovimiento) {
        MovimientoInventario mov = movimientoRepository.findById(idMovimiento)
                .orElseThrow(() -> new InventarioNoEncontradoException(
                        "Movimiento de inventario no encontrado con ID: " + idMovimiento));

        if (mov.getEstadoMovimiento() != EstadoMovimiento.PENDIENTE) {
            throw new IllegalArgumentException("El movimiento ya fue procesado anteriormente");
        }

        Inventario inventario = inventarioRepository.findById(mov.getIdInventario())
                .orElseThrow(() -> new InventarioNoEncontradoException(mov.getIdInventario()));

        int stockAnterior = inventario.getStockActual();
        int stockNuevo = stockAnterior + mov.getCantidad();

        inventario.setStockActual(stockNuevo);
        inventario.setEstadoStock(EstadoStock.calcularEstado(stockNuevo, inventario.getStockMinimo()));
        inventario.setFechaActualizacion(LocalDateTime.now());
        inventarioRepository.save(inventario);

        mov.setStockAnterior(stockAnterior);
        mov.setStockNuevo(stockNuevo);
        mov.setEstadoMovimiento(EstadoMovimiento.COMPLETADO);
        mov.setFechaMovimiento(LocalDateTime.now());

        return inventarioMapper.toMovimientoResponse(movimientoRepository.save(mov));
    }

    @Transactional(readOnly = true)
    public List<MovimientoInventarioResponse> listarMovimientos() {
        return inventarioMapper.toMovimientoResponseList(movimientoRepository.findAll());
    }

    @Transactional(readOnly = true)
    public List<MovimientoInventarioResponse> listarMovimientosPorProducto(String codigoProducto) {
        return inventarioMapper.toMovimientoResponseList(
                movimientoRepository.findByCodigoProductoIgnoreCaseOrderByFechaMovimientoDesc(codigoProducto.trim()));
    }
}
