package com.clinisys.entity;

import jakarta.persistence.*;
import lombok.*;
 
@Entity
@Table(name = "administrateurs")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Administrateur extends Utilisateur {}
