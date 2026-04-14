package com.clinisys.entity;

import jakarta.persistence.*;
import lombok.*;
 
@Entity
@Table(name = "responsables_stage")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class ResponsableStage extends Utilisateur {
    private String departement;
}
