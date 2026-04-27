package com.clinisys.controller;

import com.clinisys.dto.request.SujetRequest;
import com.clinisys.dto.response.*;
import com.clinisys.service.SujetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sujets")
@RequiredArgsConstructor
public class SujetController {
    private final SujetService sujetService;

    // --- Master Sujets (Bibliothèque) ---

    @GetMapping("/masters")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE','ROLE_ADMINISTRATEUR','ROLE_ENCADRANT')")
    public ResponseEntity<List<SujetResponse>> getAllMasters() {
        return ResponseEntity.ok(sujetService.getAllMasters());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE','ROLE_ENCADRANT')")
    public ResponseEntity<SujetResponse> creer(@Valid @RequestBody SujetRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sujetService.creer(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE','ROLE_ENCADRANT')")
    public ResponseEntity<SujetResponse> modifier(@PathVariable Long id, @Valid @RequestBody SujetRequest req) {
        return ResponseEntity.ok(sujetService.modifier(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE','ROLE_ENCADRANT')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        sujetService.delete(id);
        return ResponseEntity.ok("Sujet Master supprimé");
    }

    // --- Sujet Sessions (Occurrences) ---

    @GetMapping("/session/all")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE','ROLE_ADMINISTRATEUR','ROLE_ENCADRANT')")
    public ResponseEntity<List<SujetSessionResponse>> getAllSessions(@RequestParam String annee) {
        return ResponseEntity.ok(sujetService.getSessionsByAnnee(annee));
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasAuthority('ROLE_STAGIAIRE')")
    public ResponseEntity<List<SujetSessionResponse>> getDisponiblesByAnnee(@RequestParam String annee) {
        return ResponseEntity.ok(sujetService.getDisponiblesByAnnee(annee));
    }

    @PostMapping("/publier")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE','ROLE_ENCADRANT')")
    public ResponseEntity<SujetSessionResponse> publier(@Valid @RequestBody com.clinisys.dto.request.SujetSessionRequest req) {
        return ResponseEntity.ok(sujetService.publier(req));
    }

    @DeleteMapping("/session/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE','ROLE_ENCADRANT')")
    public ResponseEntity<String> depublier(@PathVariable Long id) {
        sujetService.depublier(id);
        return ResponseEntity.ok("Publication annulée");
    }

    @PatchMapping("/session/{id}/valider")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE','ROLE_ENCADRANT')")
    public ResponseEntity<SujetSessionResponse> validerOccurrence(@PathVariable Long id) {
        return ResponseEntity.ok(sujetService.validerOccurrence(id));
    }

    @PostMapping("/session/{sessionId}/choisir/{stagiaireId}")
    @PreAuthorize("hasAuthority('ROLE_STAGIAIRE')")
    public ResponseEntity<ChoixSujetResponse> choisir(@PathVariable Long sessionId, @PathVariable Long stagiaireId) {
        return ResponseEntity.ok(sujetService.choisirSujet(stagiaireId, sessionId));
    }

    @GetMapping("/session/{sessionId}/choix")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE','ROLE_ADMINISTRATEUR','ROLE_ENCADRANT')")
    public ResponseEntity<List<ChoixSujetResponse>> getChoixBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(sujetService.getChoixBySession(sessionId));
    }

    @DeleteMapping("/choix/{stagiaireId}")
    @PreAuthorize("hasAuthority('ROLE_STAGIAIRE')")
    public ResponseEntity<String> annulerChoix(@PathVariable Long stagiaireId) {
        sujetService.annulerChoix(stagiaireId);
        return ResponseEntity.ok("Choix annulé");
    }

    @GetMapping("/choix/stagiaire/{stagiaireId}")
    public ResponseEntity<ChoixSujetResponse> getChoix(@PathVariable Long stagiaireId) {
        ChoixSujetResponse r = sujetService.getChoixByStagiaire(stagiaireId);
        return r == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(r);
    }
}