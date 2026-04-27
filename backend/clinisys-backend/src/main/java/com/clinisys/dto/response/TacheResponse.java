package com.clinisys.dto.response;
 
import com.clinisys.enums.Priorite;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
 
@Data
public class TacheResponse {
    private Long id;
    private String titre;
    private String description;
    private Priorite priorite;
    private LocalDate dateEcheance;
    private LocalDateTime dateCreation;
    private Long stageId;
    private String stageSujet;
    // null si pas encore dans un sprint
    private Long sprintId;
    private String sprintNom;
    // statut dans le sprint (null si pas affectée)
    private String statut;
    private String annee;
}