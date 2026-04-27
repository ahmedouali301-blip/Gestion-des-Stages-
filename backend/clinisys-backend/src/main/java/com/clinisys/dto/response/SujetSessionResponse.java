package com.clinisys.dto.response;

import com.clinisys.enums.TypeStage;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SujetSessionResponse {
    private Long id;
    private Long sujetId;
    private String titre;
    private String description;
    private TypeStage type;
    private String annee;
    private String statut;
    private Integer nbMaxStagiaires;
    private int nbChoixActuels;
    private boolean estComplet;
    private Long responsableId;
    private String responsableNom;
    private LocalDateTime datePublication;
}
