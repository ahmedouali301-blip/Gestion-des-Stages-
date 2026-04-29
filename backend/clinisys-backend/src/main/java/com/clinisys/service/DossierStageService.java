package com.clinisys.service;

import com.clinisys.dto.request.DossierStageRequest;
import com.clinisys.dto.response.DossierStageResponse;
import com.clinisys.entity.*;
import com.clinisys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DossierStageService {

    private final DossierStageRepository dossierRepo;
    private final StagiaireRepository stagiaireRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final StageRepository stageRepo;

    private final Path root = Paths.get("uploads/dossiers");

    public DossierStageResponse creer(DossierStageRequest req, MultipartFile cv, MultipartFile portfolio) {
        Stagiaire stagiaire = stagiaireRepo.findById(req.getStagiaireId())
                .orElseThrow(() -> new RuntimeException("Stagiaire non trouvé"));
        ResponsableStage responsable = (ResponsableStage) utilisateurRepo
                .findById(req.getResponsableId())
                .orElseThrow(() -> new RuntimeException("Responsable non trouvé"));

        // Empêcher deux dossiers pour le même stagiaire dans la même année
        if (dossierRepo.existsByStagiaireIdAndAnneeStage(req.getStagiaireId(), req.getAnneeStage())) {
            throw new RuntimeException("Ce stagiaire possède déjà un dossier pour l'année " + req.getAnneeStage());
        }

        // Vérifier si le stagiaire a des dossiers précédents non clôturés par un stage VALIDE
        List<DossierStage> dossiersExistants = dossierRepo.findByStagiaireId(stagiaire.getId());
        for (DossierStage dexist : dossiersExistants) {
            // Chercher le stage lié à ce dossier
            boolean hasValidatedStage = stageRepo.findAll().stream()
                .anyMatch(s -> s.getStatut() == com.clinisys.enums.StatutStage.VALIDE &&
                               ((s.getDossier() != null && s.getDossier().getId().equals(dexist.getId())) ||
                                ( (s.getStagiaire() != null && s.getStagiaire().getId().equals(stagiaire.getId())) || 
                                  (s.getStagiaire2() != null && s.getStagiaire2().getId().equals(stagiaire.getId())) ) && 
                                ( (s.getDossier() != null && s.getDossier().getAnneeStage().equals(dexist.getAnneeStage())) || 
                                  (s.getSujetSession() != null && s.getSujetSession().getAnnee().equals(dexist.getAnneeStage())) )));
            
            if (!hasValidatedStage) {
                throw new RuntimeException("Le stagiaire possède déjà un dossier (" + dexist.getAnneeStage() + ") sans stage validé. Un stage doit être effectué et validé pour ce dossier avant d'en créer un nouveau.");
            }
        }

        DossierStage d = new DossierStage();
        d.setStagiaire(stagiaire);
        d.setResponsable(responsable);
        d.setUniversite(req.getUniversite());
        d.setSpecialite(req.getSpecialite());
        d.setNiveauEtude(req.getNiveauEtude());
        d.setAnneeStage(req.getAnneeStage());

        // --- GESTION DES FICHIERS ---
        try {
            if (!Files.exists(root)) Files.createDirectories(root);
            
            if (cv != null && !cv.isEmpty()) {
                String cvName = "cv_" + stagiaire.getId() + "_" + System.currentTimeMillis() + "_" + cv.getOriginalFilename();
                Files.copy(cv.getInputStream(), this.root.resolve(cvName));
                d.setCvPath(cvName);
            }
            if (portfolio != null && !portfolio.isEmpty()) {
                String portName = "portfolio_" + stagiaire.getId() + "_" + System.currentTimeMillis() + "_" + portfolio.getOriginalFilename();
                Files.copy(portfolio.getInputStream(), this.root.resolve(portName));
                d.setPortfolioPath(portName);
            }
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement des fichiers : " + e.getMessage());
        }

        return toResponse(dossierRepo.save(d));
    }

    public List<DossierStageResponse> getByResponsable(Long id) {
        return dossierRepo.findByResponsableId(id).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DossierStageResponse> getByStagiaire(Long stagiaireId) {
        return dossierRepo.findByStagiaireId(stagiaireId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DossierStageResponse> getByResponsableEtAnnee(Long id, String annee) {
        return dossierRepo.findByResponsableIdAndAnneeStage(id, annee).stream().map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<String> getAnnees(Long id) {
        return dossierRepo.findAnneesByResponsable(id);
    }

    public void delete(Long id) {
        dossierRepo.deleteById(id);
    }

    private DossierStageResponse toResponse(DossierStage d) {
        DossierStageResponse r = new DossierStageResponse();
        r.setId(d.getId());
        r.setAnneeStage(d.getAnneeStage());
        r.setUniversite(d.getUniversite());
        r.setSpecialite(d.getSpecialite());
        r.setNiveauEtude(d.getNiveauEtude());
        r.setCvPath(d.getCvPath());
        r.setPortfolioPath(d.getPortfolioPath());
        r.setDateCreation(d.getDateCreation());
        if (d.getStagiaire() != null) {
            r.setStagiaireId(d.getStagiaire().getId());
            r.setStagiaireNom(d.getStagiaire().getNom());
            r.setStagiairePrenom(d.getStagiaire().getPrenom());
            r.setStagiaireEmail(d.getStagiaire().getEmail());
            r.setStagiaireCin(d.getStagiaire().getCin());
            r.setStagiaireTelephone(d.getStagiaire().getTelephone());
        }
        if (d.getResponsable() != null) {
            r.setResponsableId(d.getResponsable().getId());
            r.setResponsableNom(d.getResponsable().getNom());
        }
        return r;
    }
}