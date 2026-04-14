package com.projet.gestion.repository;

import com.projet.gestion.model.Stagiaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StagiaireRepository extends JpaRepository<Stagiaire, Long> {
    Optional<Stagiaire> findByCin(String cin);
}