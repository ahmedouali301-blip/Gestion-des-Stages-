package com.clinisys.entity;
 
import com.clinisys.enums.Priorite;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "taches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tache {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(nullable = false)
    private String titre;
 
    @Column(columnDefinition = "TEXT")
    private String description;
 
    @Enumerated(EnumType.STRING)
    private Priorite priorite = Priorite.MOYENNE;
 
    private LocalDateTime dateCreation = LocalDateTime.now();
    private LocalDate dateEcheance;
 
    // ✅ NOUVEAU : lien direct vers le stage (tâche non encore affectée à un sprint)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id")
    private Stage stage;
 
    @PrePersist
    public void prePersist() {
        if (this.dateCreation == null)
            this.dateCreation = LocalDateTime.now();
    }
}