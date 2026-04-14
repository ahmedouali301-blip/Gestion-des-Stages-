package com.clinisys.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class DossierStageRequest {
    @NotNull
    private Long stagiaireId;
    @NotNull
    private Long responsableId;
    private String universite;
    private String specialite;
    private String niveauEtude;
    @NotBlank
    private String anneeStage;
}