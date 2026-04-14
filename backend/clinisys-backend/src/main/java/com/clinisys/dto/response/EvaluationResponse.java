package com.clinisys.dto.response;
 
import lombok.Data;
import java.time.LocalDateTime;
 
@Data
public class EvaluationResponse {
    private Long          id;
    private Double        qualiteTechnique;
    private Double        respectDelais;
    private Double        autonomie;
    private Double        communication;
    private Double        noteGlobale;
    private String        commentaire;
    private LocalDateTime dateEvaluation;
    // Stagiaire
    private Long   stagiaireId;
    private String stagiaireNom;
    private String stagiairePrenom;
    // Encadrant
    private Long   encadrantId;
    private String encadrantNom;
    // Sprint
    private Long   sprintId;
    private String sprintNom;
}