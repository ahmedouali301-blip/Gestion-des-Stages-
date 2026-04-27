package com.clinisys.dto.response;
 
import com.clinisys.enums.Priorite;
import com.clinisys.enums.StatutTache;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
 
@Data
public class TacheSprintResponse {
    private Long          id;
    private String        titre;
    private String        description;
    private Priorite      priorite;
    private StatutTache   statut;
    private LocalDate     dateEcheance;
    private LocalDate     dateDebut;
    private LocalDate     dateFin;
    private Integer       estimation;
    private Integer       duree;
    private String        commentaire;
    private LocalDateTime dateCreation;
    private Long          tacheId;
    // Stagiaire assigné
    private Long   stagiaireId;
    private String stagiaireNom;
    private String stagiairePrenom;
    // Sprint
    private Long   sprintId;
    private String sprintNom;
    private String sprintStatut;
    private String annee;
}