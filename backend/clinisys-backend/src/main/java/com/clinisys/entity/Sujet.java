package com.clinisys.entity;

import com.clinisys.enums.TypeStage;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "sujets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Sujet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String titre;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeStage type;
    @Column(nullable = false)
    private Integer nbMaxStagiaires = 1; // 1 ou 2
    private String statut = "DISPONIBLE"; // DISPONIBLE, COMPLET, ARCHIVE
    private LocalDateTime dateCreation;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id")
    private ResponsableStage responsable;
    @OneToMany(mappedBy = "sujet", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ChoixSujet> choix;

    @PrePersist
    public void prePersist() {
        if (dateCreation == null)
            dateCreation = LocalDateTime.now();
    }
}