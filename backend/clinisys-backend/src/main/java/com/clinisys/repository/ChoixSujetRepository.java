package com.clinisys.repository;

import com.clinisys.entity.ChoixSujet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ChoixSujetRepository extends JpaRepository<ChoixSujet, Long> {
    java.util.List<ChoixSujet> findByStagiaireId(Long stagiaireId);
    java.util.List<ChoixSujet> findByStagiaireIdOrderByDateChoixDesc(Long stagiaireId);

    long countBySujetSessionId(Long sujetSessionId);

    boolean existsByStagiaireId(Long stagiaireId);
    boolean existsBySujetSessionIdAndStagiaireId(Long sujetSessionId, Long stagiaireId);
    java.util.List<ChoixSujet> findBySujetSessionId(Long sujetSessionId);
}