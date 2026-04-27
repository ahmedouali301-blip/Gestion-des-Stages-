package com.clinisys.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseMigrationConfig implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Tenter de supprimer l'index unique qui bloque les choix multiples
            jdbcTemplate.execute("ALTER TABLE choix_sujets DROP INDEX UKaibpkjg7dejwf5835o760knll");
            System.out.println(">>> Migration : Index unique sur choix_sujets supprimé avec succès.");
        } catch (Exception e) {
            // L'index n'existe peut-être plus ou a un nom différent
            System.out.println(">>> Migration : L'index unique n'a pas pu être supprimé (déjà fait ou nom différent).");
        }
    }
}
