package com.clinisys.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ChoixSujetResponse {
    private Long id;
    private LocalDateTime dateChoix;
    private Long sujetId;
    private String sujetTitre;
    private String sujetDescription;
    private String sujetType;
    private String sujetStatut;
    private String sujetAnnee;
    private Long stagiaireId;
    private String stagiaireNom;
    private String stagiairePrenom;
    private String stagiaireEmail;
}