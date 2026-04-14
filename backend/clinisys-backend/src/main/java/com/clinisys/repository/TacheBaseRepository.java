package com.clinisys.repository;

import com.clinisys.entity.Tache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TacheBaseRepository extends JpaRepository<Tache, Long> {

    // Toutes les tâches d'un stage
    List<Tache> findByStageId(Long stageId);

    // Tâches d'un stage non encore affectées à un sprint
    @Query("""
                SELECT t FROM Tache t
                WHERE t.stage.id = :stageId
                AND t.id NOT IN (
                    SELECT ts.tache.id FROM TacheSprint ts WHERE ts.sprint.stage.id = :stageId
                )
            """)
    List<Tache> findTachesNonAffectees(@Param("stageId") Long stageId);
}