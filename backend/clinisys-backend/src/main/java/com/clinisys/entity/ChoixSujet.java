package com.clinisys.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "choix_sujets", uniqueConstraints = @UniqueConstraint(columnNames = "stagiaire_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChoixSujet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stagiaire_id", nullable = false)
    private Stagiaire stagiaire;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sujet_id", nullable = false)
    private Sujet sujet;
    private LocalDateTime dateChoix;

    @PrePersist
    public void prePersist() {
        if (dateChoix == null)
            dateChoix = LocalDateTime.now();
    }
}