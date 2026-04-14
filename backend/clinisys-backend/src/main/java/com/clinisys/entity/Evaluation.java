package com.clinisys.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "evaluations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Evaluation {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    // Critères d'évaluation (note sur 20)
    private Double qualiteTechnique;
    private Double respectDelais;
    private Double autonomie;
    private Double communication;
    private Double noteGlobale; // calculée automatiquement
 
    @Column(columnDefinition = "TEXT")
    private String commentaire;
 
    private LocalDateTime dateEvaluation = LocalDateTime.now();
 
    @ManyToOne
    @JoinColumn(name = "stagiaire_id", nullable = false)
    private Stagiaire stagiaire;
 
    @ManyToOne
    @JoinColumn(name = "encadrant_id", nullable = false)
    private Encadrant encadrant;
 
    @ManyToOne
    @JoinColumn(name = "sprint_id")
    private Sprint sprint;
 
    @PrePersist
    @PreUpdate
    public void calculerNoteGlobale() {
        if (qualiteTechnique != null && respectDelais != null
            && autonomie != null && communication != null) {
            this.noteGlobale = (qualiteTechnique + respectDelais + autonomie + communication) / 4.0;
        }
    }
}
