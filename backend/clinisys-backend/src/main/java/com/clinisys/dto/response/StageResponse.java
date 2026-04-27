package com.clinisys.dto.response;

import com.clinisys.enums.StatutStage;
import com.clinisys.enums.TypeStage;
import lombok.Data;
import java.time.LocalDate;

@Data
public class StageResponse {
    private Long id;
    private String sujet;
    private String description;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private TypeStage type;
    private StatutStage statut;

    // Infos stagiaire
    private Long stagiaireId;
    private String stagiaireNom;
    private String stagiairePrenom;
    private String stagiaireEmail;

    // Infos encadrant
    private Long encadrantId;
    private String encadrantNom;
    private String encadrantPrenom;
    private String encadrantEmail;

    // Stats
    private int nbSprints;
    private Double tauxAvancement;
    // Ces 4 champs doivent être présents
    private Long stagiaire2Id;
    private String stagiaire2Nom;
    private String stagiaire2Prenom;
    private Boolean estBinome;
    private java.time.LocalDateTime dateCreation;
    private Long dossierId;
    private Long dossier2Id;
    private String annee;
}