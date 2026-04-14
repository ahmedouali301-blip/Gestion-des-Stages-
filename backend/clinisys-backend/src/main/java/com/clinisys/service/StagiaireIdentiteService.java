package com.clinisys.service;

import com.clinisys.dto.request.StagiaireIdentiteRequest;
import com.clinisys.dto.response.StagiaireIdentiteResponse;
import com.clinisys.entity.*;
import com.clinisys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StagiaireIdentiteService {

    private final StagiaireIdentiteRepository identiteRepo;
    private final UtilisateurRepository utilisateurRepo;

    public StagiaireIdentiteResponse creer(StagiaireIdentiteRequest req) {
        if (identiteRepo.existsByEmail(req.getEmail()))
            throw new RuntimeException("Un stagiaire avec cet email existe déjà");
        if (req.getCin() != null && !req.getCin().isBlank()
                && identiteRepo.existsByCin(req.getCin()))
            throw new RuntimeException("Un stagiaire avec ce CIN existe déjà");
        if (req.getTelephone() != null && !req.getTelephone().isBlank()
                && identiteRepo.existsByTelephone(req.getTelephone()))
            throw new RuntimeException("Un stagiaire avec ce numéro de téléphone existe déjà");

        ResponsableStage responsable = (ResponsableStage) utilisateurRepo
                .findById(req.getResponsableId())
                .orElseThrow(() -> new RuntimeException("Responsable non trouvé"));

        StagiaireIdentite s = new StagiaireIdentite();
        s.setNom(req.getNom());
        s.setPrenom(req.getPrenom());
        s.setEmail(req.getEmail());
        s.setTelephone(req.getTelephone());
        s.setCin(req.getCin());
        s.setCompteCreer(false);
        s.setResponsable(responsable);
        return toResponse(identiteRepo.save(s));
    }

    public List<StagiaireIdentiteResponse> getAll() {
        return identiteRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    // Pour l'Admin : identités sans compte créé
    public List<StagiaireIdentiteResponse> getSansCompte() {
        return identiteRepo.findByCompteCreerFalse().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<StagiaireIdentiteResponse> getByResponsable(Long id) {
        return identiteRepo.findByResponsableId(id).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public void marquerCompteCreer(Long id) {
        StagiaireIdentite s = identiteRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Identité non trouvée"));
        s.setCompteCreer(true);
        identiteRepo.save(s);
    }

    public StagiaireIdentiteResponse modifier(Long id, StagiaireIdentiteRequest req) {
        StagiaireIdentite s = identiteRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Identité non trouvée"));

        if (s.getCompteCreer())
            throw new RuntimeException("Impossible de modifier une identité dont le compte est déjà créé");

        // Vérifier l'email s'il change
        if (!java.util.Objects.equals(s.getEmail(), req.getEmail()) && identiteRepo.existsByEmail(req.getEmail()))
            throw new RuntimeException("Email déjà utilisé par un autre stagiaire");
        
        // Vérifier le CIN s'il change
        if (!java.util.Objects.equals(s.getCin(), req.getCin()) && identiteRepo.existsByCin(req.getCin()))
            throw new RuntimeException("CIN déjà utilisé");

        // Vérifier le téléphone s'il change
        if (!java.util.Objects.equals(s.getTelephone(), req.getTelephone()) && identiteRepo.existsByTelephone(req.getTelephone()))
            throw new RuntimeException("Téléphone déjà utilisé");

        s.setNom(req.getNom());
        s.setPrenom(req.getPrenom());
        s.setEmail(req.getEmail());
        s.setTelephone(req.getTelephone());
        s.setCin(req.getCin());

        return toResponse(identiteRepo.save(s));
    }

    public void delete(Long id) {
        identiteRepo.deleteById(id);
    }

    private StagiaireIdentiteResponse toResponse(StagiaireIdentite s) {
        StagiaireIdentiteResponse r = new StagiaireIdentiteResponse();
        r.setId(s.getId());
        r.setNom(s.getNom());
        r.setPrenom(s.getPrenom());
        r.setEmail(s.getEmail());
        r.setTelephone(s.getTelephone());
        r.setCin(s.getCin());
        r.setCompteCreer(s.getCompteCreer());
        r.setDateCreation(s.getDateCreation());
        if (s.getResponsable() != null) {
            r.setResponsableId(s.getResponsable().getId());
            r.setResponsableNom(s.getResponsable().getNom());
            r.setResponsablePrenom(s.getResponsable().getPrenom());
        }
        return r;
    }
}