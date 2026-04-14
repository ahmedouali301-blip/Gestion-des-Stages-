package com.clinisys.controller;

import com.clinisys.dto.request.StagiaireIdentiteRequest;
import com.clinisys.dto.response.StagiaireIdentiteResponse;
import com.clinisys.service.StagiaireIdentiteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/stagiaires-identites")
@RequiredArgsConstructor
public class StagiaireIdentiteController {

    private final StagiaireIdentiteService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR','RESPONSABLE_STAGE')")
    public ResponseEntity<List<StagiaireIdentiteResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/sans-compte")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<List<StagiaireIdentiteResponse>> getSansCompte() {
        return ResponseEntity.ok(service.getSansCompte());
    }

    @GetMapping("/responsable/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_STAGE','ADMINISTRATEUR')")
    public ResponseEntity<List<StagiaireIdentiteResponse>> getByResponsable(@PathVariable Long id) {
        return ResponseEntity.ok(service.getByResponsable(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('RESPONSABLE_STAGE')")
    public ResponseEntity<StagiaireIdentiteResponse> creer(@Valid @RequestBody StagiaireIdentiteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.creer(req));
    }

    @PatchMapping("/{id}/compte-creer")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Void> marquerCompteCreer(@PathVariable Long id) {
        service.marquerCompteCreer(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RESPONSABLE_STAGE')")
    public ResponseEntity<StagiaireIdentiteResponse> modifier(
            @PathVariable Long id,
            @Valid @RequestBody StagiaireIdentiteRequest req) {
        return ResponseEntity.ok(service.modifier(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR','RESPONSABLE_STAGE')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Identité supprimée");
    }
}