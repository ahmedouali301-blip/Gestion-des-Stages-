package com.clinisys.entity;

import com.clinisys.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "utilisateurs")
@Inheritance(strategy = InheritanceType.JOINED)
@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class Utilisateur {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(nullable = false)
    private String nom;
 
    @Column(nullable = false)
    private String prenom;
 
    @Column(nullable = false, unique = true)
    private String email;
 
    @Column(nullable = false)
    private String motDePasse;
 
    @Column(nullable = false, unique = true, length = 8)
    private String cin;

    @Column(nullable = false, unique = true, length = 8)
    private String telephone;
 
    @Column(nullable = false)
    private Boolean actif = true;
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
 
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    public void prePersist() {
        this.dateCreation = LocalDateTime.now();
    }
}