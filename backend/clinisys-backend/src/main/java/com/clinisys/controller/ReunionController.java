package com.clinisys.controller;

import com.clinisys.dto.request.PvRequest;
import com.clinisys.dto.request.ReunionRequest;
import com.clinisys.dto.response.PvResponse;
import com.clinisys.dto.response.ReunionResponse;
import com.clinisys.service.ReunionService;
import java.time.LocalDateTime;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reunions")
@RequiredArgsConstructor
public class ReunionController {

    private final ReunionService reunionService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ENCADRANT','ROLE_STAGIAIRE')")
    public ResponseEntity<ReunionResponse> planifier(@Valid @RequestBody ReunionRequest req) {
        String role = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities()
                .stream().map(a -> a.getAuthority())
                .filter(a -> a.equals("ROLE_STAGIAIRE") || a.equals("ROLE_ENCADRANT"))
                .findFirst().orElse("ROLE_STAGIAIRE");

        System.out.println("DEBUG: Planification réunion par rôle détecté = " + role);
        return ResponseEntity.status(HttpStatus.CREATED).body(reunionService.planifier(req, role));
    }

    @GetMapping("/encadrant/{id}")
    public ResponseEntity<List<ReunionResponse>> getByEncadrant(@PathVariable Long id) {
        return ResponseEntity.ok(reunionService.getByEncadrant(id));
    }

    @GetMapping("/stagiaire/{id}")
    public ResponseEntity<List<ReunionResponse>> getByStagiaire(@PathVariable Long id) {
        return ResponseEntity.ok(reunionService.getByStagiaire(id));
    }

    @GetMapping("/sprint/{id}")
    public ResponseEntity<List<ReunionResponse>> getBySprint(@PathVariable Long id) {
        return ResponseEntity.ok(reunionService.getBySprint(id));
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAuthority('ROLE_ENCADRANT')")
    public ResponseEntity<ReunionResponse> changerStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(reunionService.changerStatut(id, body.get("statut")));
    }

    @PatchMapping("/{id}/notes")
    @PreAuthorize("hasAuthority('ROLE_ENCADRANT')")
    public ResponseEntity<ReunionResponse> ajouterNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(reunionService.ajouterNotes(id, body));
    }

    @PostMapping("/pv")
    @PreAuthorize("hasAuthority('ROLE_ENCADRANT')")
    public ResponseEntity<PvResponse> redigerPv(@Valid @RequestBody PvRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reunionService.redigerPv(req));
    }

    // Workflow Validation
    @PatchMapping("/{id}/accepter")
    @PreAuthorize("hasAuthority('ROLE_STAGIAIRE')")
    public ResponseEntity<ReunionResponse> accepter(@PathVariable Long id, @RequestParam Long stagiaireId) {
        return ResponseEntity.ok(reunionService.accepterReunion(id, stagiaireId));
    }

    @PatchMapping("/{id}/reporter")
    @PreAuthorize("hasAuthority('ROLE_STAGIAIRE')")
    public ResponseEntity<ReunionResponse> reporter(@PathVariable Long id, @RequestParam Long stagiaireId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(reunionService.reporterReunion(id, stagiaireId, body));
    }

    @PatchMapping("/{id}/decider-reportage")
    @PreAuthorize("hasAuthority('ROLE_ENCADRANT')")
    public ResponseEntity<ReunionResponse> deciderReportage(@PathVariable Long id, @RequestParam Boolean accepte) {
        return ResponseEntity.ok(reunionService.deciderReportage(id, accepte));
    }

    @PatchMapping("/{id}/accepter-encadrant")
    @PreAuthorize("hasAuthority('ROLE_ENCADRANT')")
    public ResponseEntity<ReunionResponse> accepterEncadrant(@PathVariable Long id) {
        return ResponseEntity.ok(reunionService.accepterParEncadrant(id));
    }

    @PatchMapping("/{id}/reporter-encadrant")
    @PreAuthorize("hasAuthority('ROLE_ENCADRANT')")
    public ResponseEntity<ReunionResponse> reporterEncadrant(@PathVariable Long id, @RequestParam String motif,
            @RequestParam String nouvelleDate) {
        LocalDateTime date = LocalDateTime.parse(nouvelleDate);
        return ResponseEntity.ok(reunionService.reporterReunionParEncadrant(id, motif, date));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ENCADRANT')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        reunionService.delete(id);
        return ResponseEntity.ok("Réunion supprimée");
    }
}
