package com.clinisys.repository;

import com.clinisys.entity.Reunion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReunionRepository extends JpaRepository<Reunion, Long> {
    List<Reunion> findBySprintId(Long sprintId);

    List<Reunion> findByEncadrantId(Long encadrantId);

    List<Reunion> findByStagiaireId(Long stagiaireId);

    long countByStatut(String statut);

    List<Reunion> findBySprintStageId(Long stageId);

    @Query("SELECT r FROM Reunion r WHERE r.stagiaire.id = :stagiaireId OR r.stagiaire2.id = :stagiaireId")
    List<Reunion> findByStagiaireIdOuBinome(@Param("stagiaireId") Long stagiaireId);
}
