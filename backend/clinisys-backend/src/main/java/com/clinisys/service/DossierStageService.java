package com.clinisys.service;

import com.clinisys.dto.request.DossierStageRequest;
import com.clinisys.dto.response.DossierStageResponse;
import com.clinisys.entity.*;
import com.clinisys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DossierStageService {

    private final DossierStageRepository dossierRepo;
    private final StagiaireRepository stagiaireRepo;
    private final UtilisateurRepository utilisateurRepo;

    public DossierStageResponse creer(DossierStageRequest req) {
        Stagiaire stagiaire = stagiaireRepo.findById(req.getStagiaireId())
                .orElseThrow(() -> new RuntimeException("Stagiaire non trouvé"));
        ResponsableStage responsable = (ResponsableStage) utilisateurRepo
                .findById(req.getResponsableId())
                .orElseThrow(() -> new RuntimeException("Responsable non trouvé"));

        DossierStage d = new DossierStage();
        d.setStagiaire(stagiaire);
        d.setResponsable(responsable);
        d.setUniversite(req.getUniversite());
        d.setSpecialite(req.getSpecialite());
        d.setNiveauEtude(req.getNiveauEtude());
        d.setAnneeStage(req.getAnneeStage());
        return toResponse(dossierRepo.save(d));
    }

    public List<DossierStageResponse> getByResponsable(Long id) {
        return dossierRepo.findByResponsableId(id).stream().map(this::toResponse).collect(Collectors.toList());
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