package com.clinisys.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class StagiaireIdentiteRequest {
    @NotBlank
    private String nom;
    @NotBlank
    private String prenom;
    @NotBlank
    @Email
    private String email;
    @NotBlank @Pattern(regexp = "\\d{8}", message = "Le téléphone doit contenir 8 chiffres")
    private String telephone;
    @NotBlank @Pattern(regexp = "\\d{8}", message = "Le CIN doit contenir 8 chiffres")
    private String cin;
    @NotNull
    private Long responsableId;
}