package com.clinisys.controller;

import com.clinisys.dto.request.DossierStageRequest;
import com.clinisys.dto.response.DossierStageResponse;
import com.clinisys.service.DossierStageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/dossiers-stage")
@RequiredArgsConstructor
public class DossierStageController {

    private final DossierStageService service;

    @GetMapping("/responsable/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_STAGE','ADMINISTRATEUR')")
    public ResponseEntity<List<DossierStageResponse>> getByResponsable(
            @PathVariable Long id,
            @RequestParam(required = false) String annee) {
        if (annee != null && !annee.isBlank())
            return ResponseEntity.ok(service.getByResponsableEtAnnee(id, annee));
        return ResponseEntity.ok(service.getByResponsable(id));
    }

    @GetMapping("/responsable/{id}/annees")
    @PreAuthorize("hasRole('RESPONSABLE_STAGE')")
    public ResponseEntity<List<String>> getAnnees(@PathVariable Long id) {
        return ResponseEntity.ok(service.getAnnees(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('RESPONSABLE_STAGE')")
    public ResponseEntity<DossierStageResponse> creer(@Valid @RequestBody DossierStageRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.creer(req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RESPONSABLE_STAGE')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Dossier supprimé");
    }
}
