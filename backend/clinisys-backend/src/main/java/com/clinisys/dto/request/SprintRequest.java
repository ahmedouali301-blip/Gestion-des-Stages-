package com.clinisys.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class SprintRequest {
    @NotBlank
    private String nom;
    @NotNull
    private Integer numero;
    private String objectifs;
    @NotNull
    private LocalDate dateDebut;
    @NotNull
    private LocalDate dateFin;
    private String livrables;
    @NotNull
    private Long stageId;

    // ✅ NOUVEAU : liste des IDs de tâches à affecter à ce sprint
    private List<Long> tacheIds;
    private List<LocalDateTime> datesMots;
}