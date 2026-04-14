package com.projet.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "tache_sprint")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TacheSprint {
    @EmbeddedId
    private TacheSprintId id = new TacheSprintId();
    
    @ManyToOne
    @MapsId("sprintId")
    @JoinColumn(name = "sprint_id")
    private Sprint sprint;
    
    @ManyToOne
    @MapsId("tacheId")
    @JoinColumn(name = "tache_id")
    private Tache tache;
    
    @Enumerated(EnumType.STRING)
    private StatutTache statut = StatutTache.A_FAIRE;
    
    private Integer duree;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Integer estimation;
    @Column(columnDefinition = "TEXT")
    private String commentaire;
}