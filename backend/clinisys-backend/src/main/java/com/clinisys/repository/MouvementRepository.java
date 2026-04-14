package com.clinisys.repository;

import com.clinisys.entity.Mouvement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MouvementRepository extends JpaRepository<Mouvement, Long> {
    List<Mouvement> findAllByOrderByDateActionDesc();
}
