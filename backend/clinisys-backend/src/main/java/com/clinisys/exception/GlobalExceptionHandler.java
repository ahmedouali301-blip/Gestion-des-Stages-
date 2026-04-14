package com.clinisys.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(
            org.springframework.web.bind.MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        error.put("timestamp", new Date().toString());

        HttpStatus status = ex.getMessage().contains("non trouvé")
                ? HttpStatus.NOT_FOUND
                : ex.getMessage().startsWith("SPRINT_INCOMPLET")
                        ? HttpStatus.CONFLICT
                        : HttpStatus.BAD_REQUEST;

        return ResponseEntity.status(status).body(error);
    }
}