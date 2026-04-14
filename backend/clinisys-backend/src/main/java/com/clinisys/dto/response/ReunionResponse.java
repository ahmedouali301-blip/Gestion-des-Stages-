package com.clinisys.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReunionResponse {
    private Long id;
    private String titre;
    private LocalDateTime dateHeure;
    private String lieu;
    private String statut;
    private String observations;
    private String recommandations;
    // Sprint
    private Long sprintId;
    private String sprintNom;
    // Encadrant
    private Long encadrantId;
    private String encadrantNom;
    private String encadrantPrenom;
    // Stagiaire
    private Long stagiaireId;
    private String stagiaireNom;
    private String stagiairePrenom;
    // PV
    private boolean hasPv;
    private Long pvId;
    private Long stagiaire2Id;
    private String stagiaire2Nom;
    private String stagiaire2Prenom;
    // Validation
    private Boolean acceptationStagiaire1;
    private Boolean acceptationStagiaire2;
    private Boolean acceptationEncadrant;
    private String description;
}