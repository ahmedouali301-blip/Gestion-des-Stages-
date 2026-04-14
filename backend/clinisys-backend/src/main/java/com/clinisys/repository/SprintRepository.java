package com.clinisys.repository;

import com.clinisys.entity.Sprint;
import com.clinisys.enums.StatutSprint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
 
public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findByStageIdOrderByNumero(Long stageId);
    List<Sprint> findByStatut(StatutSprint statut);
}