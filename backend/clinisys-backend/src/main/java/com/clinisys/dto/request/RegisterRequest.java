package com.clinisys.dto.request;

import com.clinisys.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;
 
@Data
public class RegisterRequest {
    @NotBlank private String nom;
    @NotBlank private String prenom;
    @NotBlank @Email private String email;
    @NotBlank @Size(min = 6) private String motDePasse;
    @NotBlank @Pattern(regexp = "\\d{8}", message = "Le téléphone doit contenir exactement 8 chiffres") 
    private String telephone;
    @NotNull private Role role;
    private String departement;  // pour ResponsableStage
    private String specialite;   // pour Encadrant/Stagiaire
    @NotBlank @Pattern(regexp = "\\d{8}", message = "Le CIN doit contenir exactement 8 chiffres") 
    private String cin; 
    private String universite;   // pour Stagiaire
    private String niveauEtude;  // pour Stagiaire
}
