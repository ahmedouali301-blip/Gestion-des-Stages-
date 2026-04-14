package com.projet.gestion.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "administrateurs")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Administrateur extends Utilisateur {
}