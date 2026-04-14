package com.clinisys.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stagiaires_identites")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StagiaireIdentite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;
    @Column(nullable = false)
    private String prenom;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false, unique = true, length = 8)
    private String telephone;
    @Column(nullable = false, unique = true, length = 8)
    private String cin;

    // true = l'admin a créé le compte utilisateur pour cette identité
    private Boolean compteCreer = false;

    private LocalDateTime dateCreation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id")
    private ResponsableStage responsable;

    @PrePersist
    public void prePersist() {
        if (this.dateCreation == null)
            this.dateCreation = LocalDateTime.now();
    }
}