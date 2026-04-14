package com.clinisys.repository;

import com.clinisys.entity.StagiaireIdentite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface StagiaireIdentiteRepository extends JpaRepository<StagiaireIdentite, Long> {
    List<StagiaireIdentite> findByResponsableId(Long responsableId);

    List<StagiaireIdentite> findByCompteCreerFalse(); // sans compte → pour l'Admin

    Optional<StagiaireIdentite> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByCin(String cin);

    boolean existsByTelephone(String telephone);
}