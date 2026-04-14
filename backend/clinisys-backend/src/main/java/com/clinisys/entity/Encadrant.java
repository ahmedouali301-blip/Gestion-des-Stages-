package com.clinisys.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
 
@Entity
@Table(name = "encadrants")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Encadrant extends Utilisateur {
    private String specialite;
    @Column(name = "nb_stagiaires_max")
    private Integer nbStagiairesMax = 5;
    @OneToMany(mappedBy = "encadrant", fetch = FetchType.LAZY)
    private List<Stage> stages;
}