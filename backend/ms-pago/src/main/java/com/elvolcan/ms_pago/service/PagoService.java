package com.elvolcan.ms_pago.service;

import com.elvolcan.ms_pago.client.AuthClient;
import com.elvolcan.ms_pago.client.VentaClient;
import com.elvolcan.ms_pago.dto.request.PagoRequest;
import com.elvolcan.ms_pago.dto.request.VentaPagoRequest;
import com.elvolcan.ms_pago.dto.response.PagoResponse;
import com.elvolcan.ms_pago.enums.EstadoPago;
import com.elvolcan.ms_pago.exception.PagoNoEncontradoException;
import com.elvolcan.ms_pago.mapper.PagoMapper;
import com.elvolcan.ms_pago.model.Pago;
import com.elvolcan.ms_pago.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class PagoService {

    private static final Logger log = LoggerFactory.getLogger(PagoService.class);
    public static final ZoneId ZONA_CHILE = ZoneId.of("America/Santiago");

    private final PagoRepository pagoRepository;
    private final PagoMapper pagoMapper;
    private final VentaClient ventaClient;
    private final AuthClient authClient;

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

    public List<PagoResponse> listarPagos() {
        log.info("Listando todos los pagos");
        return pagoMapper.toResponseList(pagoRepository.findAll());
    }

    public PagoResponse obtenerPorId(Long id) {
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new PagoNoEncontradoException(id));
        return pagoMapper.toResponse(pago);
    }

    public List<PagoResponse> obtenerPorVenta(Long idVenta) {
        return pagoMapper.toResponseList(pagoRepository.findByIdVenta(idVenta));
    }

    @Transactional
    public PagoResponse procesarPago(PagoRequest request) {
        log.info("Procesando pago para la venta ID: {}", request.getIdVenta());

        try {
            ventaClient.obtenerVentaPorId(request.getIdVenta());
        } catch (Exception e) {
            throw new IllegalArgumentException("No existe la venta con ID: " + request.getIdVenta());
        }

        ZonedDateTime ahoraChile = ZonedDateTime.now(ZONA_CHILE);
        Pago pago = pagoMapper.toEntity(request);
        pago.setCodigoTransaccion("TRX-" + ThreadLocalRandom.current().nextInt(100000, 999999));
        pago.setCodigoAutorizacion("AUT-" + ThreadLocalRandom.current().nextInt(100000, 999999));
        pago.setFechaPago(ahoraChile.toLocalDateTime());
        pago.setFechaPagoChile(ahoraChile.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        pago.setZonaHoraria(ZONA_CHILE.getId());

        boolean aprobar = request.getAprobarInmediatamente() == null || request.getAprobarInmediatamente();
        pago.setEstadoPago(aprobar ? EstadoPago.PAGADO : EstadoPago.PENDIENTE);

        Pago guardado = pagoRepository.save(pago);
        log.info("Pago registrado con ID: {}, estado: {}, hora Chile: {}",
                guardado.getId(), guardado.getEstadoPago().getValor(), guardado.getFechaPagoChile());

        if (guardado.getEstadoPago() == EstadoPago.PAGADO) {
            notificarVenta(guardado);
        }

        return pagoMapper.toResponse(guardado);
    }

    @Transactional
    public PagoResponse validarPago(Long id) {
        log.info("Validando pago ID: {}", id);
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new PagoNoEncontradoException(id));

        if (pago.getEstadoPago() == EstadoPago.PAGADO) {
            throw new IllegalStateException("El pago ya está en estado PAGADO");
        }
        if (pago.getEstadoPago() == EstadoPago.REEMBOLSADO) {
            throw new IllegalStateException("No se puede validar un pago reembolsado");
        }

        ZonedDateTime ahoraChile = ZonedDateTime.now(ZONA_CHILE);
        pago.setEstadoPago(EstadoPago.PAGADO);
        pago.setFechaPago(ahoraChile.toLocalDateTime());
        pago.setFechaPagoChile(ahoraChile.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        pago.setZonaHoraria(ZONA_CHILE.getId());
        Pago actualizado = pagoRepository.save(pago);

        notificarVenta(actualizado);
        return pagoMapper.toResponse(actualizado);
    }

    private void notificarVenta(Pago pago) {
        try {
            ventaClient.confirmarPagoVenta(pago.getIdVenta(), new VentaPagoRequest(pago.getId()));
            log.info("Venta ID {} notificada exitosamente del pago ID {}", pago.getIdVenta(), pago.getId());
        } catch (Exception e) {
            log.warn("No se pudo notificar a ms-venta para la venta ID {}: {}", pago.getIdVenta(), e.getMessage());
        }
    }

    @Transactional
    public PagoResponse reembolsarPago(Long id) {
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new PagoNoEncontradoException(id));

        if (pago.getEstadoPago() != EstadoPago.PAGADO) {
            throw new IllegalStateException("Solo se puede reembolsar un pago en estado PAGADO");
        }

        pago.setEstadoPago(EstadoPago.REEMBOLSADO);
        return pagoMapper.toResponse(pagoRepository.save(pago));
    }

    @Transactional
    public void eliminarPago(Long id) {
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new PagoNoEncontradoException(id));

        if (pago.getEstadoPago() == EstadoPago.PAGADO) {
            throw new IllegalStateException("No se puede eliminar un pago ya confirmado (PAGADO)");
        }
        pagoRepository.delete(pago);
    }
}
