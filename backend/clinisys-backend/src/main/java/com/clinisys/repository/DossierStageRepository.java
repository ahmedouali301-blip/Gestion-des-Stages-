package com.clinisys.repository;

import com.clinisys.entity.DossierStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface DossierStageRepository extends JpaRepository<DossierStage, Long> {
    List<DossierStage> findByResponsableId(Long responsableId);

    List<DossierStage> findByResponsableIdAndAnneeStage(Long responsableId, String annee);

    boolean existsByStagiaireIdAndAnneeStage(Long stagiaireId, String annee);

    @Query("SELECT DISTINCT d.anneeStage FROM DossierStage d WHERE d.responsable.id = :id ORDER BY d.anneeStage DESC")
    List<String> findAnneesByResponsable(@Param("id") Long responsableId);

    List<DossierStage> findByStagiaireId(Long stagiaireId);
}