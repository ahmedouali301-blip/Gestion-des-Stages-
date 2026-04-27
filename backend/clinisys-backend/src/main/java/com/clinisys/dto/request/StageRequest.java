package com.clinisys.dto.request;

import com.clinisys.enums.TypeStage;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class StageRequest {
    @NotBlank
    private String sujet;
    private String description;
    @NotNull
    private LocalDate dateDebut;
    @NotNull
    private LocalDate dateFin;
    @NotNull
    private TypeStage type;
    @NotNull
    private Long stagiaireId;
    private Long stagiaire2Id; // nullable — pour binôme
    @NotNull
    private Long encadrantId;
    private Long responsableId;
    private Long sujetRefId; // ID du sujet source
    private Long dossierId;
    private Long dossier2Id;
}