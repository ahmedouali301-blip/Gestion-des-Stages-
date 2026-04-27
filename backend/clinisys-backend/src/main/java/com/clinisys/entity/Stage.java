package com.clinisys.entity;

import com.clinisys.enums.StatutStage;
import com.clinisys.enums.TypeStage;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

import java.util.List;

@Entity
@Table(name = "stages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Stage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sujet;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate dateDebut;
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    private TypeStage type;

    @Enumerated(EnumType.STRING)
    private StatutStage statut = StatutStage.EN_COURS;

    // ── Stagiaire principal ───────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stagiaire_id", nullable = false)
    private Stagiaire stagiaire;

    // ── Stagiaire secondaire (nullable — stage binôme) ────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stagiaire2_id")
    private Stagiaire stagiaire2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id")
    private DossierStage dossier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier2_id")
    private DossierStage dossier2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "encadrant_id")
    private Encadrant encadrant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id")
    private ResponsableStage responsable;

    // Lien vers le sujet source (pour traçabilité)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sujet_session_id")
    private SujetSession sujetSession;

    // Indique si ce stage est un binôme
    private Boolean estBinome = false;

    @OneToMany(mappedBy = "stage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Sprint> sprints;

    private java.time.LocalDateTime dateCreation;

    @PrePersist
    public void prePersist() {
        if (this.dateCreation == null)
            this.dateCreation = java.time.LocalDateTime.now();
    }
}