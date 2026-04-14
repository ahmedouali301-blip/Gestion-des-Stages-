package com.clinisys.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "proces_verbaux")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcesVerbal {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(columnDefinition = "TEXT")
    private String contenu;
 
    @Column(columnDefinition = "TEXT")
    private String actionsCorrectives;
 
    private LocalDateTime dateRedaction = LocalDateTime.now();
 
    @OneToOne
    @JoinColumn(name = "reunion_id", nullable = false)
    private Reunion reunion;
 
    @ManyToOne
    @JoinColumn(name = "redacteur_id")
    private Utilisateur redacteur;
}
