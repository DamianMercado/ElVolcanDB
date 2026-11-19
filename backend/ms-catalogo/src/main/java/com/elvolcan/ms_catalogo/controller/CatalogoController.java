package com.elvolcan.ms_catalogo.controller;

import com.elvolcan.ms_catalogo.dto.request.ProductoCatalogoRequest;
import com.elvolcan.ms_catalogo.dto.response.ProductoCatalogoResponse;
import com.elvolcan.ms_catalogo.security.JwtAuthValidator;
import com.elvolcan.ms_catalogo.service.CatalogoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/catalogo", "/api/v1/productos"})
@RequiredArgsConstructor
@Tag(name = "Catálogo", description = "Catálogo de productos con stock obtenido de ms-inventario y gestión de imágenes para el frontend")
public class CatalogoController {

    private final CatalogoService catalogoService;
    private final JwtAuthValidator jwtAuthValidator;

    @GetMapping
    @Operation(summary = "Obtener todos los productos del catálogo con su stock e imagen para el frontend")
    public ResponseEntity<List<ProductoCatalogoResponse>> obtenerTodos(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        catalogoService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(catalogoService.obtenerTodos());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener producto del catálogo por ID")
    public ResponseEntity<ProductoCatalogoResponse> obtenerPorId(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        catalogoService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(catalogoService.obtenerPorId(id));
    }

    @GetMapping("/codigo/{codigo}")
    @Operation(summary = "Obtener producto del catálogo por código (incluyendo stock de ms-inventario)")
    public ResponseEntity<ProductoCatalogoResponse> obtenerPorCodigo(
            @PathVariable String codigo,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        catalogoService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(catalogoService.obtenerPorCodigo(codigo));
    }

    @GetMapping("/categoria/{categoria}")
    @Operation(summary = "Obtener productos por categoría")
    public ResponseEntity<List<ProductoCatalogoResponse>> obtenerPorCategoria(
            @PathVariable String categoria,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        catalogoService.autenticarConMsAuth(authHeader);
        return ResponseEntity.ok(catalogoService.obtenerPorCategoria(categoria));
    }

    @GetMapping("/imagenes/{nombreArchivo}")
    @Operation(summary = "Obtener el archivo de imagen de un producto para su consumo en el frontend")
    public ResponseEntity<Resource> obtenerImagen(@PathVariable String nombreArchivo) {
        Resource imagen = catalogoService.obtenerArchivoImagen(nombreArchivo);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("image/webp"))
                .body(imagen);
    }

    @PostMapping
    @Operation(summary = "Crear un nuevo producto en el catálogo (Requiere JWT Admin)")
    public ResponseEntity<ProductoCatalogoResponse> crear(
            @Valid @RequestBody ProductoCatalogoRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        jwtAuthValidator.exigirTokenAdmin(authHeader);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catalogoService.crear(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un producto del catálogo (Requiere JWT Admin)")
    public ResponseEntity<ProductoCatalogoResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ProductoCatalogoRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        jwtAuthValidator.exigirTokenAdmin(authHeader);
        return ResponseEntity.ok(catalogoService.actualizar(id, request));
    }

    @PatchMapping("/{id}/imagen")
    @Operation(summary = "Actualizar la imagen de un producto del catálogo (Requiere JWT Admin)")
    public ResponseEntity<ProductoCatalogoResponse> actualizarImagen(
            @PathVariable Long id,
            @RequestParam("imagen") String imagen,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        jwtAuthValidator.exigirTokenAdmin(authHeader);
        return ResponseEntity.ok(catalogoService.actualizarImagen(id, imagen));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar lógicamente un producto del catálogo (Requiere JWT Admin)")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        jwtAuthValidator.exigirTokenAdmin(authHeader);
        catalogoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
