package com.clinisys.entity;

import com.clinisys.enums.StatutSprint;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;
 
@Entity
@Table(name = "sprints")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Sprint {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    private Integer numero;
    private String nom;
 
    @Column(columnDefinition = "TEXT")
    private String objectifs;
 
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private LocalDate dateCloture;
 
    private Double tauxAvancement = 0.0;
    private String livrables;
 
    @Enumerated(EnumType.STRING)
    private StatutSprint statut = StatutSprint.PLANIFIE;
 
    @ManyToOne
    @JoinColumn(name = "stage_id", nullable = false)
    private Stage stage;
 
    @OneToMany(mappedBy = "sprint", cascade = CascadeType.ALL)
    private List<TacheSprint> tachesSprint;
 
    @OneToMany(mappedBy = "sprint", cascade = CascadeType.ALL)
    private List<Reunion> reunions;
}