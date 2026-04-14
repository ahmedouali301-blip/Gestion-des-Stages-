package com.clinisys.repository;

import com.clinisys.entity.ChoixSujet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ChoixSujetRepository extends JpaRepository<ChoixSujet, Long> {
    Optional<ChoixSujet> findByStagiaireId(Long stagiaireId);

    long countBySujetId(Long sujetId);

    boolean existsByStagiaireId(Long stagiaireId);
    boolean existsBySujetIdAndStagiaireId(Long sujetId, Long stagiaireId);
}