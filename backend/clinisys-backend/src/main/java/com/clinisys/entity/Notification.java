package com.clinisys.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    private String type; // REUNION_PROPOSEE, REUNION_ACCEPTEE, REUNION_REFUSEE, REUNION_REPORTEE

    private LocalDateTime dateCreation;

    private Boolean lue = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinataire_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Utilisateur destinataire;

    @Column(name = "reunion_id")
    private Long reunionId;

    @PrePersist
    public void prePersist() {
        this.dateCreation = LocalDateTime.now();
    }
}
