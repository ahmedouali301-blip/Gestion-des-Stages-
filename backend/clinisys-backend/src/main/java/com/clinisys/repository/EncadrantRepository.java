package com.clinisys.repository;

import com.clinisys.entity.Encadrant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
 
public interface EncadrantRepository extends JpaRepository<Encadrant, Long> {
    @Query("SELECT e FROM Encadrant e WHERE SIZE(e.stages) < e.nbStagiairesMax")
    List<Encadrant> findEncadrantsDisponibles();
}
