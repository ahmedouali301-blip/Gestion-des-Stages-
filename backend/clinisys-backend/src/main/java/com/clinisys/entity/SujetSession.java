package com.clinisys.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "sujet_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SujetSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sujet_id", nullable = false)
    private Sujet sujet;

    @Column(nullable = false)
    private String annee;

    @Column(nullable = false)
    private String statut = "DISPONIBLE"; // DISPONIBLE, VALIDE, ARCHIVE

    @Column(nullable = false)
    private Integer nbMaxStagiaires;

    private LocalDateTime datePublication;

    @OneToMany(mappedBy = "sujetSession", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ChoixSujet> choix;

    @PrePersist
    public void prePersist() {
        if (datePublication == null)
            datePublication = LocalDateTime.now();
    }
}
