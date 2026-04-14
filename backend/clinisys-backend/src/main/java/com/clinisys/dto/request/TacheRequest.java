package com.clinisys.dto.request;

import com.clinisys.enums.Priorite;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class TacheRequest {
    @NotBlank
    private String titre;
    private String description;
    private Priorite priorite = Priorite.MOYENNE;
    private LocalDate dateEcheance;
    private Integer estimation;

    // ✅ stageId obligatoire pour créer une tâche
    @NotNull
    private Long stageId;

    // sprintId optionnel (null = tâche non encore dans un sprint)
    private Long sprintId;

    private Long stagiaireId;
}