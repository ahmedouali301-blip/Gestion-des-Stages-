package com.clinisys.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class StagiaireIdentiteResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String cin;
    private Boolean compteCreer;
    private LocalDateTime dateCreation;
    private Long responsableId;
    private String responsableNom;
    private String responsablePrenom;
}