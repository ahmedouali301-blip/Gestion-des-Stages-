package com.clinisys.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MigrationService {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void migrate() {
        try {
            System.out.println(">>> Migration : Réalignement dynamique des contraintes...");
            
            // 1. Colonne 'annee'
            try { jdbcTemplate.execute("ALTER TABLE sujets DROP COLUMN annee"); } catch (Exception e) {}

            // 2. Trouver le nom de la contrainte pointant vers responsables_stage
            String findFkSql = "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE " +
                               "WHERE TABLE_SCHEMA = 'pfedb' AND TABLE_NAME = 'sujets' " +
                               "AND COLUMN_NAME = 'responsable_id' AND REFERENCED_TABLE_NAME = 'responsables_stage' LIMIT 1";
            
            List<String> constraints = jdbcTemplate.queryForList(findFkSql, String.class);
            
            for (String fkName : constraints) {
                System.out.println(">>> Migration : Suppression de la contrainte détectée : " + fkName);
                jdbcTemplate.execute("ALTER TABLE sujets DROP FOREIGN KEY " + fkName);
            }

            // 3. Assurer la nouvelle contrainte vers 'utilisateurs'
            try {
                jdbcTemplate.execute("ALTER TABLE sujets ADD CONSTRAINT FK_sujets_utilisateur_base FOREIGN KEY (responsable_id) REFERENCES utilisateurs(id)");
                System.out.println(">>> Migration : Nouvelle contrainte vers 'utilisateurs' créée.");
            } catch (Exception e) {
                // Peut-être déjà là sous un autre nom
                System.out.println(">>> Migration : Note sur FK utilisateurs : " + e.getMessage());
            }

            System.out.println(">>> Migration : Succès !");
        } catch (Exception e) {
            System.err.println(">>> Migration : Erreur critique : " + e.getMessage());
        }
    }
}
