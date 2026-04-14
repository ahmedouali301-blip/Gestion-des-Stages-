package com.clinisys.entity;

import jakarta.persistence.*;
import lombok.*;
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

    @Column(nullable = false)
    private String titre;

    private LocalDateTime dateHeure;
    private String lieu;
    private String statut = "PROPOSEE"; // PROPOSEE, PLANIFIEE, EN_COURS, TERMINEE, ANNULEE

    private Boolean acceptationStagiaire1 = false;
    private Boolean acceptationStagiaire2 = false; // Sera mis à true si pas de binôme
    private Boolean acceptationEncadrant = false;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(columnDefinition = "TEXT")
    private String recommandations;

    @ManyToOne
    @JoinColumn(name = "sprint_id")
    private Sprint sprint;

    @ManyToOne
    @JoinColumn(name = "encadrant_id")
    private Encadrant encadrant;

    @ManyToOne
    @JoinColumn(name = "stagiaire_id")
    private Stagiaire stagiaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stagiaire2_id")
    private Stagiaire stagiaire2;

    @OneToOne(mappedBy = "reunion", cascade = CascadeType.ALL)
    private ProcesVerbal pv;
    @Column(columnDefinition = "TEXT")
    private String description;
}