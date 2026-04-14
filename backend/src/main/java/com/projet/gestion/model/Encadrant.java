package com.projet.gestion.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "encadrants")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Encadrant extends Utilisateur {
    private String specialite;
    private Integer nbStagiairesMax;
}