package com.clinisys.controller;

import com.clinisys.dto.request.TacheRequest;
import com.clinisys.dto.request.TacheUpdateRequest;
import com.clinisys.dto.response.TacheResponse;
import com.clinisys.dto.response.TacheSprintResponse;
import com.clinisys.service.TacheService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/taches")
@RequiredArgsConstructor
public class TacheController {

    private final TacheService tacheService;

    // ── Tâches d'un stage (toutes) ────────────────────────────
    @GetMapping("/stage/{stageId}")
    public ResponseEntity<List<TacheResponse>> getByStage(@PathVariable Long stageId) {
        return ResponseEntity.ok(tacheService.getTachesByStage(stageId));
    }

    // ── Tâches non affectées à un sprint ──────────────────────
    @GetMapping("/stage/{stageId}/disponibles")
    public ResponseEntity<List<TacheResponse>> getTachesDisponibles(@PathVariable Long stageId) {
        return ResponseEntity.ok(tacheService.getTachesNonAffectees(stageId));
    }

    // ── Créer une tâche pour un stage (sans sprint) ───────────
    @PostMapping("/stage")
    @PreAuthorize("hasAnyRole('ENCADRANT', 'STAGIAIRE')")
    public ResponseEntity<TacheResponse> creerPourStage(@Valid @RequestBody TacheRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tacheService.creerPourStage(req));
    }

    // ── Supprimer une tâche simple ────────────────────────────
    @DeleteMapping("/simple/{tacheId}")
    @PreAuthorize("hasRole('ENCADRANT')")
    public ResponseEntity<String> deleteTacheSimple(@PathVariable Long tacheId) {
        tacheService.deleteTacheSimple(tacheId);
        return ResponseEntity.ok("Tâche supprimée");
    }

    // ── Affecter une tâche à un sprint ────────────────────────
    @PostMapping("/{tacheId}/affecter/{sprintId}")
    @PreAuthorize("hasAnyRole('ENCADRANT', 'STAGIAIRE')")
    public ResponseEntity<TacheSprintResponse> affecter(
            @PathVariable Long tacheId,
            @PathVariable Long sprintId) {
        return ResponseEntity.ok(tacheService.affecterTacheASprint(tacheId, sprintId));
    }

    // ── Retirer une tâche d'un sprint ─────────────────────────
    @DeleteMapping("/sprint-affectation/{tacheSprintId}")
    @PreAuthorize("hasRole('ENCADRANT')")
    public ResponseEntity<String> retirer(@PathVariable Long tacheSprintId) {
        tacheService.retirerTacheDuSprint(tacheSprintId);
        return ResponseEntity.ok("Tâche retirée du sprint");
    }

    // ── Tâches d'un sprint ────────────────────────────────────
    @GetMapping("/sprint/{sprintId}")
    public ResponseEntity<List<TacheSprintResponse>> getBySprint(@PathVariable Long sprintId) {
        return ResponseEntity.ok(tacheService.getBySprintId(sprintId));
    }

    // ── Tâches du stagiaire ───────────────────────────────────
    @GetMapping("/stagiaire/{stagiaireId}")
    public ResponseEntity<List<TacheSprintResponse>> getByStagiaire(@PathVariable Long stagiaireId) {
        return ResponseEntity.ok(tacheService.getByStagiaireId(stagiaireId));
    }

    // ── Proposer (Stagiaire) ──────────────────────────────────
    @PostMapping("/proposition")
    @PreAuthorize("hasRole('STAGIAIRE')")
    public ResponseEntity<TacheSprintResponse> proposer(
            @Valid @RequestBody TacheRequest req,
            @RequestParam Long stagiaireId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tacheService.proposer(req, stagiaireId));
    }

    // ── Valider / Refuser ─────────────────────────────────────
    @PatchMapping("/{id}/valider")
    @PreAuthorize("hasRole('ENCADRANT')")
    public ResponseEntity<TacheSprintResponse> valider(@PathVariable Long id) {
        return ResponseEntity.ok(tacheService.valider(id));
    }

    @PatchMapping("/{id}/refuser")
    @PreAuthorize("hasRole('ENCADRANT')")
    public ResponseEntity<TacheSprintResponse> refuser(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(tacheService.refuser(id, body.get("commentaire")));
    }

    // ── Mise à jour statut ────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<TacheSprintResponse> mettreAJour(
            @PathVariable Long id,
            @RequestBody TacheUpdateRequest req) {
        return ResponseEntity.ok(tacheService.mettreAJour(id, req));
    }

    // ── Supprimer tâche d'un sprint ───────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ENCADRANT')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        tacheService.delete(id);
        return ResponseEntity.ok("Tâche supprimée du sprint");
    }
}

// ============================================================
// service/SprintService.java — creerSprint MODIFIÉ
// (ajouter ce bout dans la méthode creerSprint après la sauvegarde)
// ============================================================
/*
 * public SprintResponse creerSprint(SprintRequest req) {
 * // ... code existant ...
 * Sprint sprint = sprintRepository.save(sprintEntity);
 * 
 * // ✅ NOUVEAU : affecter les tâches sélectionnées au sprint
 * if (req.getTacheIds() != null && !req.getTacheIds().isEmpty()) {
 * for (Long tacheId : req.getTacheIds()) {
 * try {
 * tacheService.affecterTacheASprint(tacheId, sprint.getId());
 * } catch (Exception ignored) {} // ignorer si déjà affectée
 * }
 * }
 * 
 * return toResponse(sprint);
 * }
 */