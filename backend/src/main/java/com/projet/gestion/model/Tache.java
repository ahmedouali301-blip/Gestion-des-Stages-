package com.projet.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "taches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tache {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String titre;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Enumerated(EnumType.STRING)
    private Priorite priorite = Priorite.MOYENNE;
    private LocalDateTime dateCreation = LocalDateTime.now();
    private LocalDate dateEcheance;
    
    @ManyToOne
    @JoinColumn(name = "stage_id")
    private Stage stage;
    
    @ManyToOne
    @JoinColumn(name = "encadrant_id")
    private Encadrant encadrant;
    
    @ManyToOne
    @JoinColumn(name = "stagiaire_id")
    private Stagiaire stagiaire;
}