package com.clinisys.dto.response;
 
import com.clinisys.enums.Role;
import lombok.Data;
import java.time.LocalDateTime;
 
@Data
public class UtilisateurResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String cin;
    private Boolean actif;
    private Role role;
    private LocalDateTime dateCreation;
    // Champs spécifiques selon le rôle
    private String departement;
    private String specialite;
    private String universite;
    private String niveauEtude;
    private Integer nbStagiairesMax;
}