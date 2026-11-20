package com.elvolcan.ms_venta.service;

import com.elvolcan.ms_venta.client.*;
import com.elvolcan.ms_venta.dto.request.ItemVentaRequest;
import com.elvolcan.ms_venta.dto.request.SeguimientoVentaRequest;
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

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VentaService {

    private static final Logger log = LoggerFactory.getLogger(VentaService.class);
    public static final ZoneId ZONA_CHILE = ZoneId.of("America/Santiago");

    private static final double PLANTA_LAT = -33.5985;
    private static final double PLANTA_LNG = -70.5780;

    private final VentaRepository ventaRepository;
    private final VentaMapper ventaMapper;

    private final AuthClient authClient;
    private final UsuarioClient usuarioClient;
    private final CatalogoClient catalogoClient;
    private final InventarioClient inventarioClient;
    private final PagoClient pagoClient;

    private ZonedDateTime ahoraChile() {
        return ZonedDateTime.now(ZONA_CHILE);
    }

    private String formatearChile(ZonedDateTime fecha) {
        return fecha.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }

    private Map<String, Object> crearEventoAuditoria(String evento, String descripcion, ZonedDateTime fecha) {
        Map<String, Object> registro = new LinkedHashMap<>();
        registro.put("evento", evento);
        registro.put("descripcion", descripcion);
        registro.put("fecha_chile", formatearChile(fecha));
        registro.put("zona_horaria", ZONA_CHILE.getId());
        return registro;
    }

    private double[] resolverCoordenadasDestino(String comuna) {
        String norm = comuna == null ? "" : comuna.trim().toLowerCase();
        if (norm.contains("florida")) {
            return new double[]{-33.5425, -70.5882};
        }
        if (norm.contains("pirque")) {
            return new double[]{-33.6345, -70.5712};
        }
        if (norm.contains("santiago") || norm.contains("centro")) {
            return new double[]{-33.4489, -70.6693};
        }
        if (norm.contains("macul")) {
            return new double[]{-33.4910, -70.5990};
        }
        // Puente Alto por defecto (zona principal de operación)
        return new double[]{-33.6145, -70.5765};
    }

    private Map<String, Object> inicializarEntrega(String direccion, String comuna, String estadoDespacho, ZonedDateTime ahora) {
        double[] destinoCoords = resolverCoordenadasDestino(comuna);
        String direccionCompleta = (direccion != null ? direccion : "Dirección no informada")
                + (comuna != null && !comuna.isBlank() && (direccion == null || !direccion.toLowerCase().contains(comuna.toLowerCase()))
                ? ", " + comuna : "");

        Map<String, Object> origen = new LinkedHashMap<>();
        origen.put("lat", PLANTA_LAT);
        origen.put("lng", PLANTA_LNG);
        origen.put("nombre", "Planta El Volcán - Distribuidora Central");
        origen.put("direccion", "Av. Vicuña Mackenna 450, Puente Alto, Santiago");

        Map<String, Object> destino = new LinkedHashMap<>();
        destino.put("lat", destinoCoords[0]);
        destino.put("lng", destinoCoords[1]);
        destino.put("direccion", direccionCompleta);

        Map<String, Object> posicionActual = new LinkedHashMap<>();
        posicionActual.put("lat", PLANTA_LAT);
        posicionActual.put("lng", PLANTA_LNG);
        posicionActual.put("rumbo", 180.0);
        posicionActual.put("indice_punto", 0);

        Map<String, Object> ubicacionGeo = new LinkedHashMap<>();
        ubicacionGeo.put("type", "Point");
        ubicacionGeo.put("coordinates", List.of(destinoCoords[1], destinoCoords[0]));

        Map<String, Object> entrega = new LinkedHashMap<>();
        entrega.put("estado_despacho", estadoDespacho);
        entrega.put("direccion_entrega", direccionCompleta);
        entrega.put("ubicacion", ubicacionGeo);
        entrega.put("origen", origen);
        entrega.put("destino", destino);
        entrega.put("posicion_actual", posicionActual);
        entrega.put("eta_minutos", 12);
        entrega.put("distancia_km", 2.4);
        entrega.put("velocidad_kmh", 0);
        entrega.put("ultima_actualizacion_chile", formatearChile(ahora));
        return entrega;
    }

    private String generarCodigoVentaUnico() {
        long base = ventaRepository.findTopByOrderByIdDesc()
                .map(Venta::getId)
                .orElseGet(ventaRepository::count);
        long correlativo = 100 + base + 1;
        String candidato = "EV-" + correlativo;
        while (ventaRepository.findByCodigoVentaIgnoreCase(candidato).isPresent()) {
            correlativo++;
            candidato = "EV-" + correlativo;
        }
        return candidato;
    }

    public void autenticarConMsAuth(String authHeader) {
        if (authHeader != null && !authHeader.isBlank()) {
            String token = authHeader.replace("Bearer ", "").trim();
            if (token.isBlank() || "null".equalsIgnoreCase(token) || "undefined".equalsIgnoreCase(token)) {
                throw new SecurityException("Token inválido o vacío");
            }
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

    public List<VentaResponse> obtenerTodas() {
        log.info("Obteniendo todas las ventas");
        return ventaMapper.toResponseList(ventaRepository.findAll());
    }

    public VentaResponse obtenerPorId(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));
        return ventaMapper.toResponse(venta);
    }

    public VentaResponse obtenerPorCodigo(String codigoVenta) {
        String limpio = codigoVenta == null ? "" : codigoVenta.replace("#", "").trim();
        Venta venta = ventaRepository.findByCodigoVentaIgnoreCase(limpio)
                .orElseThrow(() -> new VentaNoEncontradaException("Venta no encontrada con código: " + limpio));
        return ventaMapper.toResponse(venta);
    }

    public List<VentaResponse> obtenerPorUsuario(Long idUsuario) {
        return ventaMapper.toResponseList(ventaRepository.findByIdUsuario(idUsuario));
    }

    public List<VentaResponse> obtenerPorEstado(EstadoVenta estado) {
        return ventaMapper.toResponseList(ventaRepository.findByEstadoVenta(estado));
    }

    public List<VentaResponse> obtenerPorRepartidor(String nombreRepartidor) {
        String limpio = nombreRepartidor == null ? "" : nombreRepartidor.trim();
        return ventaMapper.toResponseList(ventaRepository.findByRepartidorIgnoreCase(limpio));
    }

    public VentaResponse crearVenta(VentaRequest request) {
        log.info("Generando nueva venta para cliente: {}", request.getCliente());

        if (request.getIdUsuario() != null) {
            try {
                authClient.validarUsuario(request.getIdUsuario());
            } catch (Exception e) {
                log.warn("Aviso al verificar usuario {} en ms-auth: {}", request.getIdUsuario(), e.getMessage());
            }
        }

        ZonedDateTime ahora = ahoraChile();
        String codigoGenerado = generarCodigoVentaUnico();

        List<Map<String, Object>> auditoriaInicial = new ArrayList<>();
        auditoriaInicial.add(crearEventoAuditoria(
                "CREACION",
                "Pedido " + codigoGenerado + " registrado por " + request.getCliente(),
                ahora));

        Venta venta = Venta.builder()
                .codigoVenta(codigoGenerado)
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
                .fechaVenta(ahora.toLocalDateTime())
                .fechaVentaChile(formatearChile(ahora))
                .zonaHoraria(ZONA_CHILE.getId())
                .idZona(1)
                .entrega(inicializarEntrega(request.getDireccion(), request.getComuna(), "pendiente", ahora))
                .auditoria(auditoriaInicial)
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
        log.info("Venta creada exitosamente con ID: {}, código: {}, hora Chile: {}",
                guardada.getId(), guardada.getCodigoVenta(), guardada.getFechaVentaChile());
        return ventaMapper.toResponse(guardada);
    }

    public VentaResponse confirmarPago(Long id, VentaPagoRequest request) {
        log.info("Confirmando pago ID {} para venta ID {}", request.getIdPago(), id);
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));

        ZonedDateTime ahora = ahoraChile();
        venta.setIdPago(request.getIdPago());
        venta.setEstadoPago("PAGADO");
        agregarAuditoria(venta, "PAGO_CONFIRMADO", "Pago ID " + request.getIdPago() + " confirmado", ahora);

        return ventaMapper.toResponse(ventaRepository.save(venta));
    }

    public VentaResponse asignarRepartidor(Long id, String nombreRepartidor) {
        log.info("Asignando repartidor '{}' a la venta ID {}", nombreRepartidor, id);
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));

        if (venta.getEstadoVenta() == EstadoVenta.CANCELADA) {
            throw new IllegalStateException("No se puede asignar repartidor a una venta cancelada");
        }
        if (venta.getEstadoVenta() == EstadoVenta.ENTREGADO) {
            throw new IllegalStateException("No se puede reasignar una venta ya entregada");
        }

        ZonedDateTime ahora = ahoraChile();
        venta.setRepartidor(nombreRepartidor);
        venta.setEstadoVenta(EstadoVenta.EN_RUTA);

        Map<String, Object> entrega = obtenerOCrearEntrega(venta, ahora);
        entrega.put("estado_despacho", "en_camino");
        entrega.put("repartidor_nombre", nombreRepartidor);
        entrega.put("ultima_actualizacion_chile", formatearChile(ahora));
        venta.setEntrega(entrega);

        agregarAuditoria(venta, "REPARTIDOR_ASIGNADO", "Repartidor asignado: " + nombreRepartidor + " (En ruta)", ahora);
        return ventaMapper.toResponse(ventaRepository.save(venta));
    }

    public VentaResponse actualizarSeguimiento(Long id, SeguimientoVentaRequest request) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));

        if (venta.getEstadoVenta() == EstadoVenta.CANCELADA) {
            throw new IllegalStateException("No se puede actualizar seguimiento de una venta cancelada");
        }

        ZonedDateTime ahora = ahoraChile();
        Map<String, Object> entrega = obtenerOCrearEntrega(venta, ahora);

        if (request.getRepartidor() != null && !request.getRepartidor().isBlank()) {
            venta.setRepartidor(request.getRepartidor().trim());
            entrega.put("repartidor_nombre", request.getRepartidor().trim());
        }
        if (request.getRepartidorTelefono() != null && !request.getRepartidorTelefono().isBlank()) {
            entrega.put("repartidor_telefono", request.getRepartidorTelefono().trim());
        }
        if (request.getRepartidorPatente() != null && !request.getRepartidorPatente().isBlank()) {
            entrega.put("repartidor_patente", request.getRepartidorPatente().trim());
        }
        if (request.getRepartidorVehiculo() != null && !request.getRepartidorVehiculo().isBlank()) {
            entrega.put("repartidor_vehiculo", request.getRepartidorVehiculo().trim());
        }

        if (request.getLat() != null && request.getLng() != null) {
            Map<String, Object> pos = new LinkedHashMap<>();
            pos.put("lat", request.getLat());
            pos.put("lng", request.getLng());
            pos.put("rumbo", request.getRumbo() != null ? request.getRumbo() : 180.0);
            pos.put("indice_punto", request.getIndicePunto() != null ? request.getIndicePunto() : 0);
            entrega.put("posicion_actual", pos);
        }

        if (request.getEtaMinutos() != null) {
            entrega.put("eta_minutos", request.getEtaMinutos());
        }
        if (request.getDistanciaKm() != null) {
            entrega.put("distancia_km", request.getDistanciaKm());
        }
        if (request.getVelocidadKmH() != null) {
            entrega.put("velocidad_kmh", request.getVelocidadKmH());
        }

        String estadoAnterior = String.valueOf(entrega.getOrDefault("estado_despacho", "pendiente"));
        if (request.getEstadoDespacho() != null && !request.getEstadoDespacho().isBlank()) {
            String nuevoEstadoDespacho = request.getEstadoDespacho().trim().toLowerCase();
            entrega.put("estado_despacho", nuevoEstadoDespacho);

            if ("entregado".equals(nuevoEstadoDespacho)) {
                venta.setEstadoVenta(EstadoVenta.ENTREGADO);
                venta.setEstadoPago("PAGADO");
                entrega.put("eta_minutos", 0);
                entrega.put("distancia_km", 0.0);
                entrega.put("velocidad_kmh", 0);
            } else if (("en_camino".equals(nuevoEstadoDespacho) || "llegando".equals(nuevoEstadoDespacho))
                    && venta.getEstadoVenta() != EstadoVenta.ENTREGADO) {
                venta.setEstadoVenta(EstadoVenta.EN_RUTA);
            }

            if (!nuevoEstadoDespacho.equalsIgnoreCase(estadoAnterior)) {
                agregarAuditoria(
                        venta,
                        "DESPACHO_" + nuevoEstadoDespacho.toUpperCase(),
                        "Estado de despacho actualizado a: " + nuevoEstadoDespacho,
                        ahora);
            }
        }

        entrega.put("ultima_actualizacion_chile", formatearChile(ahora));
        venta.setEntrega(entrega);

        return ventaMapper.toResponse(ventaRepository.save(venta));
    }

    public VentaResponse marcarEntregada(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));

        if (venta.getEstadoVenta() == EstadoVenta.CANCELADA) {
            throw new IllegalStateException("No se puede marcar como entregada una venta cancelada");
        }

        ZonedDateTime ahora = ahoraChile();
        venta.setEstadoVenta(EstadoVenta.ENTREGADO);
        venta.setEstadoPago("PAGADO");

        Map<String, Object> entrega = obtenerOCrearEntrega(venta, ahora);
        entrega.put("estado_despacho", "entregado");
        entrega.put("eta_minutos", 0);
        entrega.put("distancia_km", 0.0);
        entrega.put("velocidad_kmh", 0);
        entrega.put("ultima_actualizacion_chile", formatearChile(ahora));
        venta.setEntrega(entrega);

        agregarAuditoria(venta, "ENTREGADO", "Pedido entregado conforme y pago completado", ahora);
        return ventaMapper.toResponse(ventaRepository.save(venta));
    }

    public VentaResponse cancelarVenta(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));

        if (venta.getEstadoVenta() == EstadoVenta.ENTREGADO) {
            throw new IllegalStateException("No se puede cancelar una venta ya entregada");
        }
        if (venta.getEstadoVenta() == EstadoVenta.CANCELADA) {
            return ventaMapper.toResponse(venta);
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

        ZonedDateTime ahora = ahoraChile();
        venta.setEstadoVenta(EstadoVenta.CANCELADA);
        Map<String, Object> entrega = obtenerOCrearEntrega(venta, ahora);
        entrega.put("estado_despacho", "cancelado");
        entrega.put("ultima_actualizacion_chile", formatearChile(ahora));
        venta.setEntrega(entrega);

        agregarAuditoria(venta, "CANCELADA", "Pedido cancelado y stock reintegrado", ahora);
        return ventaMapper.toResponse(ventaRepository.save(venta));
    }

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

    public void eliminar(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNoEncontradaException(id));
        ventaRepository.delete(venta);
    }

    private Map<String, Object> obtenerOCrearEntrega(Venta venta, ZonedDateTime ahora) {
        if (venta.getEntrega() != null) {
            return new LinkedHashMap<>(venta.getEntrega());
        }
        String estadoInicial = switch (venta.getEstadoVenta() != null ? venta.getEstadoVenta() : EstadoVenta.PENDIENTE) {
            case EN_RUTA -> "en_camino";
            case ENTREGADO -> "entregado";
            case CANCELADA -> "cancelado";
            default -> "pendiente";
        };
        return inicializarEntrega(venta.getDireccion(), venta.getComuna(), estadoInicial, ahora);
    }

    private void agregarAuditoria(Venta venta, String evento, String descripcion, ZonedDateTime ahora) {
        List<Map<String, Object>> historial = venta.getAuditoria() != null
                ? new ArrayList<>(venta.getAuditoria())
                : new ArrayList<>();
        historial.add(crearEventoAuditoria(evento, descripcion, ahora));
        venta.setAuditoria(historial);
    }
}
