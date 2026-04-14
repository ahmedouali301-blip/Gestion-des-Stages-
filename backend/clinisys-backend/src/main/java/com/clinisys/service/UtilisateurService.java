package com.clinisys.service;

import com.clinisys.dto.request.ChangerMotDePasseRequest;
import com.clinisys.dto.request.ProfilRequest;
import com.clinisys.dto.request.UtilisateurUpdateRequest;
import com.clinisys.dto.response.UtilisateurResponse;
import com.clinisys.entity.*;
import com.clinisys.enums.Role;
import com.clinisys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Lister tous les utilisateurs ──────────────────────────
    public List<UtilisateurResponse> getAll() {
        return utilisateurRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Lister par rôle ───────────────────────────────────────
    public List<UtilisateurResponse> getByRole(Role role) {
        return utilisateurRepository.findByRole(role)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Trouver par ID ────────────────────────────────────────
    public UtilisateurResponse getById(Long id) {
        Utilisateur u = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + id));
        return toResponse(u);
    }

    // ── Mettre à jour ─────────────────────────────────────────
    public UtilisateurResponse update(Long id, UtilisateurUpdateRequest req) {
        Utilisateur u = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + id));

        if (req.getNom() != null)
            u.setNom(req.getNom());
        if (req.getPrenom() != null)
            u.setPrenom(req.getPrenom());
        if (req.getTelephone() != null)
            u.setTelephone(req.getTelephone());
        if (req.getCin() != null)
            u.setCin(req.getCin());
        // Champs spécifiques selon le type
        if (u instanceof ResponsableStage rs && req.getDepartement() != null)
            rs.setDepartement(req.getDepartement());

        if (u instanceof Encadrant e) {
            if (req.getSpecialite() != null)
                e.setSpecialite(req.getSpecialite());
            if (req.getNbStagiairesMax() != null)
                e.setNbStagiairesMax(req.getNbStagiairesMax());
        }

        if (u instanceof Stagiaire s) {
            if (req.getSpecialite() != null)
                s.setSpecialite(req.getSpecialite());
            if (req.getUniversite() != null)
                s.setUniversite(req.getUniversite());
            if (req.getNiveauEtude() != null)
                s.setNiveauEtude(req.getNiveauEtude());
        }

        return toResponse(utilisateurRepository.save(u));
    }

    // ── Activer / Désactiver ──────────────────────────────────
    public UtilisateurResponse toggleActif(Long id) {
        Utilisateur u = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + id));
        u.setActif(!u.getActif());
        return toResponse(utilisateurRepository.save(u));
    }

    // ── Réinitialiser le mot de passe ─────────────────────────
    public void resetPassword(Long id, String nouveauMotDePasse) {
        Utilisateur u = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + id));
        u.setMotDePasse(passwordEncoder.encode(nouveauMotDePasse));
        utilisateurRepository.save(u);
    }

    // ── Supprimer ─────────────────────────────────────────────
    public void delete(Long id) {
        if (!utilisateurRepository.existsById(id))
            throw new RuntimeException("Utilisateur non trouvé: " + id);
        utilisateurRepository.deleteById(id);
    }

    // ── Mapper entité → DTO ───────────────────────────────────
    public UtilisateurResponse toResponse(Utilisateur u) {
        UtilisateurResponse r = new UtilisateurResponse();
        r.setId(u.getId());
        r.setNom(u.getNom());
        r.setPrenom(u.getPrenom());
        r.setEmail(u.getEmail());
        r.setTelephone(u.getTelephone());
        r.setCin(u.getCin());
        r.setActif(u.getActif());
        r.setRole(u.getRole());
        r.setDateCreation(u.getDateCreation());

        if (u instanceof ResponsableStage rs)
            r.setDepartement(rs.getDepartement());
        if (u instanceof Encadrant e) {
            r.setSpecialite(e.getSpecialite());
            r.setNbStagiairesMax(e.getNbStagiairesMax());
        }
        if (u instanceof Stagiaire s) {
            r.setSpecialite(s.getSpecialite());
            r.setUniversite(s.getUniversite());
            r.setNiveauEtude(s.getNiveauEtude());
        }
        return r;
    }

    // ── Modifier son propre profil (tous les rôles) ───────────────
    public UtilisateurResponse modifierMonProfil(Long userId, ProfilRequest req) {
        Utilisateur utilisateur = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (req.getNom() != null && !req.getNom().isBlank())
            utilisateur.setNom(req.getNom());
        if (req.getPrenom() != null && !req.getPrenom().isBlank())
            utilisateur.setPrenom(req.getPrenom());
        if (req.getTelephone() != null)
            utilisateur.setTelephone(req.getTelephone());

        return toResponse(utilisateurRepository.save(utilisateur));
    }

    // ── Changer son propre mot de passe (tous les rôles) ─────────
    public void changerMotDePasse(Long userId, ChangerMotDePasseRequest req) {
        Utilisateur utilisateur = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Vérifier l'ancien mot de passe
        if (!passwordEncoder.matches(req.getMotDePasseActuel(), utilisateur.getMotDePasse()))
            throw new RuntimeException("Mot de passe actuel incorrect");

        utilisateur.setMotDePasse(passwordEncoder.encode(req.getNouveauMotDePasse()));
        utilisateurRepository.save(utilisateur);
    }
}