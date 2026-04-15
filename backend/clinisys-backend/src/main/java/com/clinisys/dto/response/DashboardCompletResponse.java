package com.clinisys.dto.response;
 
import lombok.Data;
import java.util.List;
import java.util.Map;
 
@Data
public class DashboardCompletResponse {
 
    // ── Stats globales ──────────────────────────────────────
    private long   nbUtilisateurs;
    private long   nbStagiaires;
    private long   nbEncadrants;
    private long   nbStagesEnCours;
    private long   nbStagesValides;
    private long   nbStagesInterrompus;
    private long   nbSujets;
    private long   nbReunionsTerminees;
    private Double moyenneEvaluations;
    private Double tauxAvancementGlobal;
    private Double tauxReussitePromotion; // % stages validés
 
    // ── Répartition par statut stage ───────────────────────
    private Map<String, Long> repartitionStatutStages;
 
    // ── Répartition par type stage ─────────────────────────
    private Map<String, Long> repartitionTypeStages;
 
    // ── Charge par encadrant ───────────────────────────────
    private List<ChargeEncadrant> chargeEncadrants;
 
    // ── Évolution mensuelle des évaluations ───────────────
    private List<EvaluationMensuelle> evolutionEvaluations;
 
    // ── Top stagiaires ─────────────────────────────────────
    private List<StagiaireStats> topStagiaires;
 
    @Data
    public static class ChargeEncadrant {
        private Long   encadrantId;
        private String encadrantNom;
        private String encadrantPrenom;
        private long   nbStagiaires;
        private Double moyenneEvals;
    }
 
    @Data
    public static class EvaluationMensuelle {
        private String mois;
        private Double moyenne;
        private long   nbEvaluations;
    }
 
    @Data
    public static class StagiaireStats {
        private Long   stagiaireId;
        private String stagiaireNom;
        private String stagiairePrenom;
        private Double moyenne;
        private long   nbTachesTerminees;
        private Double tauxAvancement;
    }
}
