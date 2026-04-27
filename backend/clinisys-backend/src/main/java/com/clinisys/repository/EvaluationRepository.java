package com.clinisys.repository;

import com.clinisys.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    @Query("""
                SELECT e FROM Evaluation e
                WHERE e.stagiaire.id = :stagiaireId
                OR e.sprint.stage.stagiaire.id = :stagiaireId
                OR e.sprint.stage.stagiaire2.id = :stagiaireId
            """)
    List<Evaluation> findByStagiaireId(@Param("stagiaireId") Long stagiaireId);

    Optional<Evaluation> findBySprintId(Long sprintId);

    @Query("""
                SELECT AVG(e.noteGlobale) FROM Evaluation e
                WHERE e.stagiaire.id = :stagiaireId
                OR e.sprint.stage.stagiaire.id = :stagiaireId
                OR e.sprint.stage.stagiaire2.id = :stagiaireId
            """)
    Double getMoyenneByStagiaireId(@Param("stagiaireId") Long stagiaireId);

    @Query("SELECT AVG(e.noteGlobale) FROM Evaluation e")
    Double getMoyenneGenerale();
}
