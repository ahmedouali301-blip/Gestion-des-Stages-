package com.clinisys.controller;
 
import com.clinisys.dto.request.ChangerMotDePasseRequest;
import com.clinisys.dto.request.ProfilRequest;
import com.clinisys.dto.response.UtilisateurResponse;
import com.clinisys.service.UtilisateurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
//import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
 
@RestController
@RequestMapping("/api/profil")
@RequiredArgsConstructor
public class ProfilController {
 
    private final UtilisateurService utilisateurService;
 
    // ── Modifier son profil ───────────────────────────────────
    // Accessible à tous les utilisateurs connectés (pas de @PreAuthorize)
    @PutMapping("/{id}")
    public ResponseEntity<UtilisateurResponse> modifierMonProfil(
            @PathVariable Long id,
            @RequestBody ProfilRequest req,
            Authentication authentication) {
 
        // Sécurité : vérifier que l'utilisateur modifie BIEN son propre profil
        String emailConnecte = authentication.getName();
        UtilisateurResponse utilisateur = utilisateurService.getById(id);
 
        if (!utilisateur.getEmail().equals(emailConnecte))
            return ResponseEntity.status(403).build();
 
        return ResponseEntity.ok(utilisateurService.modifierMonProfil(id, req));
    }
 
    // ── Changer son mot de passe ──────────────────────────────
    @PatchMapping("/{id}/changer-mot-de-passe")
    public ResponseEntity<String> changerMotDePasse(
            @PathVariable Long id,
            @Valid @RequestBody ChangerMotDePasseRequest req,
            Authentication authentication) {
 
        // Sécurité : vérifier que l'utilisateur change BIEN son propre mot de passe
        String emailConnecte = authentication.getName();
        UtilisateurResponse utilisateur = utilisateurService.getById(id);
 
        if (!utilisateur.getEmail().equals(emailConnecte))
            return ResponseEntity.status(403).body("Accès refusé");
 
        try {
            utilisateurService.changerMotDePasse(id, req);
            return ResponseEntity.ok("Mot de passe modifié avec succès");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}