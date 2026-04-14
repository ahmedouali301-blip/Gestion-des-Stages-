package com.clinisys.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReunionRequest {
    @NotBlank
    private String titre;
    @NotNull
    private LocalDateTime dateHeure;
    private String lieu;
    private Long sprintId;
    private Long encadrantId;
    private Long stagiaireId;
    private String description;
    private Long stageId;
}
