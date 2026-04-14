package com.projet.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "criteres_evaluation")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CritereEvaluation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
    private Double note;
    private Double ponderation;
    @Column(columnDefinition = "TEXT")
    private String commentaire;
    
    @ManyToOne
    @JoinColumn(name = "evaluation_id")
    private Evaluation evaluation;
}