package com.projet.gestion.repository;

import com.projet.gestion.model.Tache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TacheRepository extends JpaRepository<Tache, Long> {
    List<Tache> findByStagiaireId(Long stagiaireId);
    List<Tache> findByStageId(Long stageId);
}