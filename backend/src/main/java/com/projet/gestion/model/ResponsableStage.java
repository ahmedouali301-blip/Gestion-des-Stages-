package com.projet.gestion.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "responsables_stage")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class ResponsableStage extends Utilisateur {
    private String departement;
}