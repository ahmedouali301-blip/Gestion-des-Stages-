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

    @GetMapping("/responsable/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE','ROLE_ADMINISTRATEUR')")
    public ResponseEntity<List<SujetResponse>> getByResponsable(@PathVariable Long id) {
        return ResponseEntity.ok(sujetService.getByResponsable(id));
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasAuthority('ROLE_STAGIAIRE')")
    public ResponseEntity<List<SujetResponse>> getDisponibles() {
        return ResponseEntity.ok(sujetService.getDisponibles());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_RESPONSABLE_STAGE')")
    public ResponseEntity<SujetResponse> creer(@Valid @RequestBody SujetRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sujetService.creer(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_RESPONSABLE_STAGE')")
    public ResponseEntity<SujetResponse> modifier(@PathVariable Long id, @Valid @RequestBody SujetRequest req) {
        return ResponseEntity.ok(sujetService.modifier(id, req));
    }

    @PatchMapping("/{id}/archiver")
    @PreAuthorize("hasAuthority('ROLE_RESPONSABLE_STAGE')")
    public ResponseEntity<SujetResponse> archiver(@PathVariable Long id) {
        return ResponseEntity.ok(sujetService.archiver(id));
    }

    @PatchMapping("/{id}/valider")
    @PreAuthorize("hasAuthority('ROLE_RESPONSABLE_STAGE')")
    public ResponseEntity<SujetResponse> valider(@PathVariable Long id) {
        return ResponseEntity.ok(sujetService.valider(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_RESPONSABLE_STAGE')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        sujetService.delete(id);
        return ResponseEntity.ok("Sujet supprimé");
    }

    @PostMapping("/{sujetId}/choisir/{stagiaireId}")
    @PreAuthorize("hasAuthority('ROLE_STAGIAIRE')")
    public ResponseEntity<ChoixSujetResponse> choisir(@PathVariable Long sujetId, @PathVariable Long stagiaireId) {
        return ResponseEntity.ok(sujetService.choisirSujet(stagiaireId, sujetId));
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

    @GetMapping("/stagiaire/{stagiaireId}")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE','ROLE_ADMINISTRATEUR')")
    public ResponseEntity<SujetResponse> getSujetDuStagiaire(@PathVariable Long stagiaireId) {
        SujetResponse res = sujetService.getSujetDuStagiaire(stagiaireId);
        return res != null ? ResponseEntity.ok(res) : ResponseEntity.notFound().build();
    }

    @GetMapping("/tous-les-choix")
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE','ROLE_ADMINISTRATEUR')")
    public ResponseEntity<List<ChoixSujetResponse>> getAllChoix() {
        return ResponseEntity.ok(sujetService.getAllChoix());
    }
}