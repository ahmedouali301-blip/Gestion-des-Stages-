package com.clinisys.dto.request;

import lombok.Data;
 
@Data
public class UtilisateurUpdateRequest {
    private String nom;
    private String prenom;
    private String telephone;
    private String cin;
    private String departement;  // ResponsableStage
    private String specialite;   // Encadrant / Stagiaire
    private Integer nbStagiairesMax; // Encadrant
    private String universite;   // Stagiaire
    private String niveauEtude;  // Stagiaire
}
