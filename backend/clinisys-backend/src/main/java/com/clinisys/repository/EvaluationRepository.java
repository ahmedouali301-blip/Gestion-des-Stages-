package com.clinisys.repository;

import com.clinisys.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
 
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    List<Evaluation> findByStagiaireId(Long stagiaireId);
    Optional<Evaluation> findBySprintId(Long sprintId);
 
    @Query("SELECT AVG(e.noteGlobale) FROM Evaluation e WHERE e.stagiaire.id = :stagiaireId")
    Double getMoyenneByStagiaireId(Long stagiaireId);
 
    @Query("SELECT AVG(e.noteGlobale) FROM Evaluation e")
    Double getMoyenneGenerale();
}
