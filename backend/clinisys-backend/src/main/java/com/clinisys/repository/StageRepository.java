package com.clinisys.repository;

import com.clinisys.entity.Stage;
import com.clinisys.enums.StatutStage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StageRepository extends JpaRepository<Stage, Long> {
    List<Stage> findByStagiaireId(Long stagiaireId);

    List<Stage> findByEncadrantId(Long encadrantId);

    List<Stage> findByStatut(StatutStage statut);

    List<Stage> findByStagiaireIdOrStagiaire2Id(Long stagiaireId, Long stagiaire2Id);

    
}
