package com.clinisys.repository;
 
import com.clinisys.entity.TacheSprint;
import com.clinisys.enums.StatutTache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
 
public interface TacheRepository extends JpaRepository<TacheSprint, Long> {
 
    // Tâches d'un sprint
    List<TacheSprint> findBySprintId(Long sprintId);
 
    // Tâches directement assignées à un stagiaire
    List<TacheSprint> findByStagiaireId(Long stagiaireId);
 
    // ✅ NOUVEAU : toutes les tâches des sprints d'un stage donné
    @Query("SELECT ts FROM TacheSprint ts WHERE ts.sprint.stage.id = :stageId")
    List<TacheSprint> findByStageId(@Param("stageId") Long stageId);
 
    // ✅ NOUVEAU : toutes les tâches pour un stagiaire via ses stages
    @Query("""
        SELECT ts FROM TacheSprint ts
        WHERE ts.sprint.stage.stagiaire.id = :stagiaireId
        OR ts.sprint.stage.stagiaire2.id = :stagiaireId
    """)
    List<TacheSprint> findAllByStagiaireViaStage(@Param("stagiaireId") Long stagiaireId);
 
    // Tâches d'un sprint par statut
    List<TacheSprint> findBySprintIdAndStatut(Long sprintId, StatutTache statut);
 
    // Compteurs pour calcul avancement
    @Query("SELECT COUNT(t) FROM TacheSprint t WHERE t.sprint.id = :sprintId")
    long countBySprintId(@Param("sprintId") Long sprintId);
 
    @Query("SELECT COUNT(t) FROM TacheSprint t WHERE t.sprint.id = :sprintId AND t.statut = 'TERMINE'")
    long countTermineesBySprintId(@Param("sprintId") Long sprintId);

    @Query("SELECT COUNT(t) FROM TacheSprint t WHERE t.stagiaire.id = :stagiaireId AND t.statut = 'TERMINE'")
    long countTermineesByStagiaireId(@Param("stagiaireId") Long stagiaireId);
}