package com.clinisys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "mouvements")
@Data
public class Mouvement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false)
    private String typeAction; // SUJET_CREE, STAGE_VALIDÉ, TACHE_TERMINEE, etc.

    private LocalDateTime dateAction = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
}
