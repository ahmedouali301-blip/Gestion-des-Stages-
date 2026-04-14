package com.clinisys.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dossiers_stage")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DossierStage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stagiaire_id", nullable = false)
    private Stagiaire stagiaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id")
    private ResponsableStage responsable;

    private String universite;
    private String specialite;
    private String niveauEtude;

    @Column(nullable = false)
    private String anneeStage; // Ex: "2025-2026"

    private LocalDateTime dateCreation;

    @PrePersist
    public void prePersist() {
        if (this.dateCreation == null)
            this.dateCreation = LocalDateTime.now();
    }
}