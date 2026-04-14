package com.projet.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "evaluations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Evaluation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private LocalDateTime dateEvaluation = LocalDateTime.now();
    @Column(columnDefinition = "TEXT")
    private String commentaireGlobal;
    private Double noteFinale;
    
    @ManyToOne
    @JoinColumn(name = "encadrant_id")
    private Encadrant encadrant;
    
    @ManyToOne
    @JoinColumn(name = "stagiaire_id")
    private Stagiaire stagiaire;
    
    @ManyToOne
    @JoinColumn(name = "sprint_id")
    private Sprint sprint;
    
    @OneToMany(mappedBy = "evaluation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CritereEvaluation> criteres = new ArrayList<>();
}