package com.projet.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "stages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Stage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String sujet;
    @Column(columnDefinition = "TEXT")
    private String description;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    @Enumerated(EnumType.STRING)
    private TypeStage type;
    @Enumerated(EnumType.STRING)
    private StatutStage statut = StatutStage.EN_ATTENTE;
    
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "projet_id")
    private Projet projet;
    
    @ManyToOne
    @JoinColumn(name = "responsable_id")
    private ResponsableStage responsable;
    
    @ManyToOne
    @JoinColumn(name = "encadrant_id")
    private Encadrant encadrant;
    
    @OneToOne
    @JoinColumn(name = "stagiaire_id", unique = true)
    private Stagiaire stagiaire;
}