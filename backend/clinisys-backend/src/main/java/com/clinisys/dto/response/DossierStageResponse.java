package com.clinisys.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DossierStageResponse {
    private Long id;
    private String anneeStage;
    private String universite;
    private String specialite;
    private String niveauEtude;
    private String cvPath;
    private String portfolioPath;
    private LocalDateTime dateCreation;
    // Stagiaire
    private Long stagiaireId;
    private String stagiaireNom;
    private String stagiairePrenom;
    private String stagiaireEmail;
    private String stagiaireCin;
    private String stagiaireTelephone;
    // Responsable
    private Long responsableId;
    private String responsableNom;
}