package com.clinisys.repository;

import com.clinisys.entity.Stagiaire;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
 
public interface StagiaireRepository extends JpaRepository<Stagiaire, Long> {
    Optional<Stagiaire> findByCin(String cin);
    boolean existsByCin(String cin);
}