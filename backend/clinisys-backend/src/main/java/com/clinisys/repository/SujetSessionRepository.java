package com.clinisys.repository;
 
import com.clinisys.entity.SujetSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
 
public interface SujetSessionRepository extends JpaRepository<SujetSession, Long> {
    List<SujetSession> findByAnnee(String annee);
    List<SujetSession> findBySujetResponsableIdAndAnnee(Long responsableId, String annee);
    Optional<SujetSession> findBySujetIdAndAnnee(Long sujetId, String annee);
    boolean existsBySujetId(Long sujetId);
}
