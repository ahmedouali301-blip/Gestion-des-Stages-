package com.clinisys.dto.request;
 
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
 
@Data
public class EvaluationRequest {
    @NotNull @Min(0) @Max(20)
    private Double qualiteTechnique;
    @NotNull @Min(0) @Max(20)
    private Double respectDelais;
    @NotNull @Min(0) @Max(20)
    private Double autonomie;
    @NotNull @Min(0) @Max(20)
    private Double communication;
    private String commentaire;
    @NotNull
    private Long stagiaireId;
    @NotNull
    private Long encadrantId;
    @NotNull
    private Long sprintId;
}