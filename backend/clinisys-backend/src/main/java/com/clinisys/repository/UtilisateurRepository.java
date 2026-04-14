package com.clinisys.repository;

import com.clinisys.entity.Utilisateur;
import com.clinisys.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
 
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByCin(String cin);
    boolean existsByTelephone(String telephone);
    boolean existsByRole(Role role);
    List<Utilisateur> findByRole(Role role);
}
 
