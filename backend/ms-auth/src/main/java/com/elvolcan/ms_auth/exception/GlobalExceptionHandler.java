package com.elvolcan.ms_auth.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final ZoneId ZONA_CHILE = ZoneId.of("America/Santiago");

    private Map<String, Object> construirError(HttpStatus status, String errorTitulo, String mensaje) {
        ZonedDateTime ahoraChile = ZonedDateTime.now(ZONA_CHILE);
        Map<String, Object> error = new HashMap<>();
        error.put("timestamp", ahoraChile.toLocalDateTime());
        error.put("timestampChile", ahoraChile.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        error.put("zonaHoraria", ZONA_CHILE.getId());
        error.put("status", status.value());
        error.put("error", errorTitulo);
        error.put("message", mensaje);
        error.put("mensaje", mensaje);
        return error;
    }

    @ExceptionHandler(SesionNoEncontradaException.class)
    public ResponseEntity<Map<String, Object>> handleSesionNoEncontrada(SesionNoEncontradaException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(construirError(HttpStatus.NOT_FOUND, "Sesión no encontrada", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(construirError(HttpStatus.UNAUTHORIZED, "Error de autenticación", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult().getFieldError() != null
                ? ex.getBindingResult().getFieldError().getDefaultMessage()
                : "Error de validación";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(construirError(HttpStatus.BAD_REQUEST, "Datos inválidos", mensaje));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralError(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(construirError(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno del servidor", ex.getMessage()));
    }
}
