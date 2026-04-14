package com.projet.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "reunions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reunion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String titre;
    private LocalDateTime dateProposee;
    private LocalDateTime dateFinale;
    private String lieu;
    @Enumerated(EnumType.STRING)
    private StatutReunion statut = StatutReunion.EN_ATTENTE;
    @Column(columnDefinition = "TEXT")
    private String ordreJour;
    
    @ManyToOne
    @JoinColumn(name = "encadrant_id")
    private Encadrant encadrant;
    
    @ManyToOne
    @JoinColumn(name = "stagiaire_id")
    private Stagiaire stagiaire;
}