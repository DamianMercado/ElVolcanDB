package com.elvolcan.ms_pago.controller;

import com.elvolcan.ms_pago.dto.request.PagoRequest;
import com.elvolcan.ms_pago.dto.response.PagoResponse;
import com.elvolcan.ms_pago.service.PagoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pagos")
@RequiredArgsConstructor
@Tag(name = "Pagos", description = "Procesamiento y gestión de pagos de ventas de El Volcán")
public class PagoController {

    private final PagoService pagoService;

    @GetMapping
    @Operation(summary = "Listar todos los pagos")
    public ResponseEntity<List<PagoResponse>> listarPagos(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        pagoService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(pagoService.listarPagos());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener pago por ID")
    public ResponseEntity<PagoResponse> obtenerPorId(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        pagoService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(pagoService.obtenerPorId(id));
    }

    @GetMapping("/venta/{idVenta}")
    @Operation(summary = "Obtener pagos asociados a una venta")
    public ResponseEntity<List<PagoResponse>> obtenerPorVenta(
            @PathVariable Long idVenta,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        pagoService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(pagoService.obtenerPorVenta(idVenta));
    }

    @PostMapping
    @Operation(summary = "Procesar un nuevo pago para una venta y confirmar el pago en ms-venta")
    public ResponseEntity<PagoResponse> procesarPago(
            @Valid @RequestBody PagoRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        pagoService.autenticarConMsAuth(authHeader);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pagoService.procesarPago(request));
    }

    @PutMapping("/{id}/validar")
    @Operation(summary = "Validar/confirmar un pago pendiente y notificar a ms-venta")
    public ResponseEntity<PagoResponse> validarPago(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        pagoService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(pagoService.validarPago(id));
    }

    @PutMapping("/{id}/reembolsar")
    @Operation(summary = "Reembolsar un pago en estado PAGADO")
    public ResponseEntity<PagoResponse> reembolsarPago(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        pagoService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(pagoService.reembolsarPago(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un pago pendiente")
    public ResponseEntity<Void> eliminarPago(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        pagoService.autenticarConMsAuth(authHeader);
        pagoService.eliminarPago(id);
        return ResponseEntity.noContent().build();
    }
}
