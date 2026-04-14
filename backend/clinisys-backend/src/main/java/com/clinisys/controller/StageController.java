package com.clinisys.controller;

import com.clinisys.dto.request.StageRequest;
import com.clinisys.dto.response.StageResponse;
import com.clinisys.enums.StatutStage;
import com.clinisys.service.StageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stages")
@RequiredArgsConstructor
public class StageController {

    private final StageService stageService;

    // GET /api/stages → tous (Admin + Responsable)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR','RESPONSABLE_STAGE')")
    public ResponseEntity<List<StageResponse>> getAll() {
        return ResponseEntity.ok(stageService.getAll());
    }

    // GET /api/stages/{id}
    @GetMapping("/{id}")
    public ResponseEntity<StageResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(stageService.getById(id));
    }

    // GET /api/stages/encadrant/{id}
    @GetMapping("/encadrant/{encadrantId}")
    @PreAuthorize("hasAnyRole('ENCADRANT','ADMINISTRATEUR','RESPONSABLE_STAGE')")
    public ResponseEntity<List<StageResponse>> getByEncadrant(@PathVariable Long encadrantId) {
        return ResponseEntity.ok(stageService.getByEncadrant(encadrantId));
    }

    // GET /api/stages/stagiaire/{id}
    @GetMapping("/stagiaire/{stagiaireId}")
    @PreAuthorize("hasAnyRole('STAGIAIRE','ENCADRANT','ADMINISTRATEUR','RESPONSABLE_STAGE')")
    public ResponseEntity<List<StageResponse>> getByStagiaire(@PathVariable Long stagiaireId) {
        return ResponseEntity.ok(stageService.getByStagiaire(stagiaireId));
    }

    // POST /api/stages → créer (Responsable)
    @PostMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE_STAGE','ADMINISTRATEUR')")
    public ResponseEntity<StageResponse> creer(@Valid @RequestBody StageRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stageService.creer(req));
    }

    // PATCH /api/stages/{id}/statut → changer statut
    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('RESPONSABLE_STAGE','ADMINISTRATEUR')")
    public ResponseEntity<StageResponse> changerStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        StatutStage statut = StatutStage.valueOf(body.get("statut"));
        return ResponseEntity.ok(stageService.changerStatut(id, statut));
    }

    // PATCH /api/stages/{id}/encadrant → affecter encadrant
    @PatchMapping("/{id}/encadrant")
    @PreAuthorize("hasAnyRole('RESPONSABLE_STAGE','ADMINISTRATEUR')")
    public ResponseEntity<StageResponse> affecterEncadrant(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(stageService.affecterEncadrant(id, body.get("encadrantId")));
    }

    // DELETE /api/stages/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE','ROLE_ADMINISTRATEUR')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        stageService.delete(id);
        return ResponseEntity.ok("Stage supprimé");
    }
}