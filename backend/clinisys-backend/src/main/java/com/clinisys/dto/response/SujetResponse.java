package com.clinisys.dto.response;
import com.clinisys.enums.TypeStage;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
 
@Data
public class SujetResponse {
    private Long id;
    private String titre;
    private String description;
    private TypeStage type;
    private Integer nbMaxStagiaires;
    private int nbChoixActuels;
    private boolean estComplet;
    private String statut;
    private LocalDateTime dateCreation;
    private Long responsableId;
    private String responsableNom;
    private List<String> stagiairesPrenomNom;
}