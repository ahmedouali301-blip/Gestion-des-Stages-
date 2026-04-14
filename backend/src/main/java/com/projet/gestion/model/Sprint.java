package com.projet.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "sprints")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Sprint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Integer numero;
    private String nom;
    @Column(columnDefinition = "TEXT")
    private String objectifs;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private LocalDate dateCloture;
    private Double tauxAvancement = 0.0;
    @Column(columnDefinition = "TEXT")
    private String livrables;
    @Enumerated(EnumType.STRING)
    private StatutSprint statut = StatutSprint.PLANIFIE;
    
    @ManyToOne
    @JoinColumn(name = "projet_id")
    private Projet projet;
}