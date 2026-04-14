package com.clinisys.controller;

import com.clinisys.dto.request.RegisterRequest;
import com.clinisys.dto.request.UtilisateurUpdateRequest;
import com.clinisys.dto.response.UtilisateurResponse;
import com.clinisys.enums.Role;
import com.clinisys.service.AuthService;
import com.clinisys.service.UtilisateurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurService utilisateurService;
    private final AuthService authService;

    // GET /api/utilisateurs → tous (Admin)
    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<List<UtilisateurResponse>> getAll() {
        return ResponseEntity.ok(utilisateurService.getAll());
    }

    // GET /api/utilisateurs/role/{role} → par rôle (Admin + Responsable)
    @GetMapping("/role/{role}")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR','RESPONSABLE_STAGE')")
    public ResponseEntity<List<UtilisateurResponse>> getByRole(@PathVariable Role role) {
        return ResponseEntity.ok(utilisateurService.getByRole(role));
    }

    // GET /api/utilisateurs/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UtilisateurResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(utilisateurService.getById(id));
    }

    // POST /api/utilisateurs → créer (Admin)
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<String> create(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body("Utilisateur créé avec succès");
    }

    // PUT /api/utilisateurs/{id} → modifier
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<UtilisateurResponse> update(
            @PathVariable Long id,
            @RequestBody UtilisateurUpdateRequest req) {
        return ResponseEntity.ok(utilisateurService.update(id, req));
    }

    // PATCH /api/utilisateurs/{id}/toggle-actif → activer/désactiver
    @PatchMapping("/{id}/toggle-actif")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<UtilisateurResponse> toggleActif(@PathVariable Long id) {
        return ResponseEntity.ok(utilisateurService.toggleActif(id));
    }

    // PATCH /api/utilisateurs/{id}/reset-password
    @PatchMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<String> resetPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        utilisateurService.resetPassword(id, body.get("motDePasse"));
        return ResponseEntity.ok("Mot de passe réinitialisé");
    }

    // DELETE /api/utilisateurs/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        utilisateurService.delete(id);
        return ResponseEntity.ok("Utilisateur supprimé");
    }
}