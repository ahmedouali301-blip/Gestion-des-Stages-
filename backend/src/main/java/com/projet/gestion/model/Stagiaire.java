package com.projet.gestion.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "stagiaires")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Stagiaire extends Utilisateur {
    @Column(unique = true)
    private String cin;
    private String universite;
    private String specialite;
    private String niveauEtude;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    @Enumerated(EnumType.STRING)
    private StatutStage statut = StatutStage.EN_ATTENTE;
}