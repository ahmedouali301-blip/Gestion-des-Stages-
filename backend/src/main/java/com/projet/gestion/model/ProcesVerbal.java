package com.projet.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
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
    private LocalDateTime dateRedaction = LocalDateTime.now();
    @Column(columnDefinition = "TEXT")
    private String observations;
    @Column(columnDefinition = "TEXT")
    private String decisions;
    @Column(columnDefinition = "TEXT")
    private String actionsCorrectives;
    @Column(columnDefinition = "TEXT")
    private String contenu;
    
    @OneToOne
    @JoinColumn(name = "reunion_id", unique = true)
    private Reunion reunion;
}