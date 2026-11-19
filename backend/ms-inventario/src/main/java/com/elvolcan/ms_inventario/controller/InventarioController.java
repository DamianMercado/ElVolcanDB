package com.elvolcan.ms_inventario.controller;

import com.elvolcan.ms_inventario.dto.request.InventarioRequest;
import com.elvolcan.ms_inventario.dto.request.MovimientoInventarioRequest;
import com.elvolcan.ms_inventario.dto.response.InventarioResponse;
import com.elvolcan.ms_inventario.dto.response.MovimientoInventarioResponse;
import com.elvolcan.ms_inventario.service.InventarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventario")
@RequiredArgsConstructor
@Tag(name = "Inventario", description = "Gestión de stock y movimientos de inventario de El Volcán")
public class InventarioController {

    private final InventarioService inventarioService;

    @GetMapping
    @Operation(summary = "Obtener todo el inventario de productos")
    public ResponseEntity<List<InventarioResponse>> obtenerTodo(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        inventarioService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(inventarioService.obtenerTodo());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener registro de inventario por ID")
    public ResponseEntity<InventarioResponse> obtenerPorId(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        inventarioService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(inventarioService.obtenerPorId(id));
    }

    @GetMapping("/codigo/{codigoProducto}")
    @Operation(summary = "Obtener stock e inventario por código de producto (consumido por ms-catalogo y ms-venta)")
    public ResponseEntity<InventarioResponse> obtenerPorCodigo(
            @PathVariable String codigoProducto,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        inventarioService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(inventarioService.obtenerPorCodigoProducto(codigoProducto));
    }

    @PutMapping("/sincronizar/{codigoProducto}")
    @Operation(summary = "Crear o actualizar stock de un producto desde ms-catalogo")
    public ResponseEntity<InventarioResponse> sincronizarStockProducto(
            @PathVariable String codigoProducto,
            @RequestParam("nombreProducto") String nombreProducto,
            @RequestParam("stockActual") Integer stockActual,
            @RequestParam(value = "stockMinimo", required = false) Integer stockMinimo,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        inventarioService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(inventarioService.sincronizarStockProducto(codigoProducto, nombreProducto, stockActual, stockMinimo));
    }

    @PostMapping
    @Operation(summary = "Crear registro de inventario para un producto")
    public ResponseEntity<InventarioResponse> crear(
            @Valid @RequestBody InventarioRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        inventarioService.autenticarConMsAuth(authHeader);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventarioService.crear(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar registro de inventario")
    public ResponseEntity<InventarioResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody InventarioRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        inventarioService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(inventarioService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar registro de inventario")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        inventarioService.autenticarConMsAuth(authHeader);
        inventarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/movimientos")
    @Operation(summary = "Registrar un movimiento de stock (ENTRADA, SALIDA, AJUSTE, SOLICITUD_REPOSICION)")
    public ResponseEntity<MovimientoInventarioResponse> registrarMovimiento(
            @Valid @RequestBody MovimientoInventarioRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        inventarioService.autenticarConMsAuth(authHeader);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventarioService.registrarMovimiento(request));
    }

    @PutMapping("/codigo/{codigoProducto}/descontar")
    @Operation(summary = "Descontar stock de un producto por venta (consumido por ms-venta)")
    public ResponseEntity<InventarioResponse> descontarStock(
            @PathVariable String codigoProducto,
            @RequestParam("cantidad") Integer cantidad,
            @RequestParam(value = "motivo", required = false) String motivo,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        inventarioService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(inventarioService.descontarStock(codigoProducto, cantidad, motivo));
    }

    @PutMapping("/codigo/{codigoProducto}/reponer")
    @Operation(summary = "Reponer o sumar stock a un producto")
    public ResponseEntity<InventarioResponse> reponerStock(
            @PathVariable String codigoProducto,
            @RequestParam("cantidad") Integer cantidad,
            @RequestParam(value = "motivo", required = false) String motivo,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        inventarioService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(inventarioService.reponerStock(codigoProducto, cantidad, motivo));
    }

    @PutMapping("/movimientos/{idMovimiento}/confirmar")
    @Operation(summary = "Confirmar recepción de una solicitud de stock pendiente")
    public ResponseEntity<MovimientoInventarioResponse> confirmarRecepcionSolicitud(
            @PathVariable Long idMovimiento,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        inventarioService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(inventarioService.confirmarRecepcionSolicitud(idMovimiento));
    }

    @GetMapping("/movimientos")
    @Operation(summary = "Listar todos los movimientos de inventario")
    public ResponseEntity<List<MovimientoInventarioResponse>> listarMovimientos(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        inventarioService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(inventarioService.listarMovimientos());
    }

    @GetMapping("/movimientos/producto/{codigoProducto}")
    @Operation(summary = "Listar movimientos de inventario de un producto por código")
    public ResponseEntity<List<MovimientoInventarioResponse>> listarMovimientosPorProducto(
            @PathVariable String codigoProducto,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        inventarioService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(inventarioService.listarMovimientosPorProducto(codigoProducto));
    }
}
