package com.clinisys.entity;

import com.clinisys.enums.StatutTache;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "taches_sprint")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TacheSprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sprint_id", nullable = false)
    private Sprint sprint;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "tache_id", nullable = false)
    private Tache tache;

    @ManyToOne
    @JoinColumn(name = "stagiaire_id")
    private Stagiaire stagiaire;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", length = 50)
    private StatutTache statut = StatutTache.A_FAIRE;

    private Integer duree;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Integer estimation;

    @Column(columnDefinition = "TEXT")
    private String commentaire;
}