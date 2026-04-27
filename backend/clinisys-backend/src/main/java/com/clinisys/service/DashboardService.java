package com.clinisys.service;

import com.clinisys.dto.response.DashboardCompletResponse;
import com.clinisys.dto.response.DashboardCompletResponse.*;
import com.clinisys.entity.*;
import com.clinisys.enums.Role;
import com.clinisys.enums.StatutStage;
import com.clinisys.repository.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UtilisateurRepository utilisateurRepository;
    private final StageRepository stageRepository;
    private final SprintRepository sprintRepository;
    private final EvaluationRepository evaluationRepository;
    private final ReunionRepository reunionRepository;
    private final TacheRepository tacheRepository;
    private final StagiaireRepository stagiaireRepository;
    private final EncadrantRepository encadrantRepository;
    private final SujetRepository sujetRepository;
    private final SujetSessionRepository sujetSessionRepository;

    // ── Dashboard complet ─────────────────────────────────────
    public DashboardCompletResponse getDashboardComplet(String annee) {
        if (annee == null || annee.isEmpty()) {
            annee = String.valueOf(java.time.Year.now().getValue());
        }
        final String targetAnnee = annee;
        DashboardCompletResponse r = new DashboardCompletResponse();

        // Stats globales (indépendantes de l'année pour le total utilisateurs)
        r.setNbUtilisateurs(utilisateurRepository.count());
        r.setNbStagiaires(utilisateurRepository.findByRole(Role.ROLE_STAGIAIRE).size());
        r.setNbEncadrants(utilisateurRepository.findByRole(Role.ROLE_ENCADRANT).size());

        // Filtrage des stages par année via SujetSession
        List<Stage> allStages = stageRepository.findAll();
        List<Stage> stages = allStages.stream()
                .filter(s -> s.getSujetSession() != null && targetAnnee.equals(s.getSujetSession().getAnnee()))
                .collect(Collectors.toList());

        long enCours = stages.stream().filter(s -> s.getStatut() == StatutStage.EN_COURS).count();
        long valides = stages.stream().filter(s -> s.getStatut() == StatutStage.VALIDE).count();
        long interrompus = stages.stream().filter(s -> s.getStatut() == StatutStage.INTERROMPU).count();

        r.setNbStagesEnCours(enCours);
        r.setNbStagesValides(valides);
        r.setNbStagesInterrompus(interrompus);

        // On compte les sujets disponibles pour la session spécifiée
        long nbSujets = sujetSessionRepository.findByAnnee(targetAnnee).stream()
                .filter(s -> "DISPONIBLE".equals(s.getStatut()))
                .count();
        r.setNbSujets(nbSujets);

        // Réunions filtrées par stages de l'année
        List<Long> stageIds = stages.stream().map(Stage::getId).collect(Collectors.toList());
        long nbReunions = reunionRepository.findAll().stream()
                .filter(reu -> reu.getStage() != null && stageIds.contains(reu.getStage().getId()))
                .filter(reu -> "TERMINEE".equals(reu.getStatut()))
                .count();
        r.setNbReunionsTerminees(nbReunions);

        // Moyenne évaluations de l'année
        double moyAnnee = evaluationRepository.findAll().stream()
                .filter(ev -> ev.getSprint() != null && ev.getSprint().getStage() != null 
                        && stageIds.contains(ev.getSprint().getStage().getId()))
                .mapToDouble(ev -> ev.getNoteGlobale() != null ? ev.getNoteGlobale() : 0)
                .average().orElse(0);
        r.setMoyenneEvaluations(moyAnnee);

        // Taux avancement global de l'année
        List<Sprint> sprints = sprintRepository.findAll().stream()
                .filter(sp -> sp.getStage() != null && stageIds.contains(sp.getStage().getId()))
                .collect(Collectors.toList());
        r.setTauxAvancementGlobal(sprints.stream()
                .mapToDouble(s -> s.getTauxAvancement() != null ? s.getTauxAvancement() : 0)
                .average().orElse(0));

        // Taux réussite de l'année
        r.setTauxReussitePromotion(stages.isEmpty() ? 0 : (double) valides / stages.size() * 100);

        // Répartition statut
        Map<String, Long> repartStatut = new LinkedHashMap<>();
        repartStatut.put("EN_COURS", enCours);
        repartStatut.put("VALIDE", valides);
        repartStatut.put("INTERROMPU", interrompus);
        repartStatut.put("EN_ATTENTE", stages.stream().filter(s -> s.getStatut() == StatutStage.EN_ATTENTE).count());
        r.setRepartitionStatutStages(repartStatut);

        // Répartition type
        Map<String, Long> repartType = stages.stream()
                .collect(Collectors.groupingBy(s -> s.getType().name(), Collectors.counting()));
        r.setRepartitionTypeStages(repartType);

        // Charge par encadrant pour cette année
        List<ChargeEncadrant> charges = encadrantRepository.findAll().stream().map(e -> {
            ChargeEncadrant c = new ChargeEncadrant();
            c.setEncadrantId(e.getId());
            c.setEncadrantNom(e.getNom());
            c.setEncadrantPrenom(e.getPrenom());
            List<Stage> stagesEnc = stages.stream()
                    .filter(s -> s.getEncadrant() != null && s.getEncadrant().getId().equals(e.getId()))
                    .collect(Collectors.toList());
            c.setNbStagiaires(stagesEnc.size());
            
            double moyEnc = evaluationRepository.findAll().stream()
                    .filter(ev -> ev.getSprint() != null && ev.getSprint().getStage() != null 
                            && stagesEnc.stream().anyMatch(s -> s.getId().equals(ev.getSprint().getStage().getId())))
                    .mapToDouble(ev -> ev.getNoteGlobale() != null ? ev.getNoteGlobale() : 0)
                    .average().orElse(0);
            c.setMoyenneEvals(moyEnc);
            return c;
        }).filter(c -> c.getNbStagiaires() > 0).collect(Collectors.toList());
        r.setChargeEncadrants(charges);

        // Top stagiaires de l'année
        List<StagiaireStats> topStagiaires = stagiaireRepository.findAll().stream().map(s -> {
            StagiaireStats ss = new StagiaireStats();
            ss.setStagiaireId(s.getId());
            ss.setStagiaireNom(s.getNom());
            ss.setStagiairePrenom(s.getPrenom());
            
            List<Stage> stagesStagiaire = stages.stream()
                    .filter(st -> (st.getStagiaire() != null && st.getStagiaire().getId().equals(s.getId())) 
                            || (st.getStagiaire2() != null && st.getStagiaire2().getId().equals(s.getId())))
                    .collect(Collectors.toList());
            
            if (stagesStagiaire.isEmpty()) return null;

            double moy = evaluationRepository.findAll().stream()
                    .filter(ev -> ev.getSprint() != null && ev.getSprint().getStage() != null 
                            && stagesStagiaire.stream().anyMatch(st -> st.getId().equals(ev.getSprint().getStage().getId())))
                    .mapToDouble(ev -> ev.getNoteGlobale() != null ? ev.getNoteGlobale() : 0)
                    .average().orElse(0);
            ss.setMoyenne(moy);
            
            long taches = stagesStagiaire.stream()
                    .mapToLong(st -> tacheRepository.countTermineesByStagiaireId(s.getId()))
                    .sum();
            ss.setNbTachesTerminees(taches);

            double taux = stagesStagiaire.stream()
                    .flatMap(st -> sprintRepository.findByStageIdOrderByNumero(st.getId()).stream())
                    .mapToDouble(sp -> sp.getTauxAvancement() != null ? sp.getTauxAvancement() : 0)
                    .average().orElse(0);
            ss.setTauxAvancement(taux);
            return ss;
        })
                .filter(Objects::nonNull)
                .filter(ss -> ss.getMoyenne() > 0 || ss.getTauxAvancement() > 0)
                .sorted(Comparator.comparingDouble(StagiaireStats::getMoyenne).reversed())
                .limit(5)
                .collect(Collectors.toList());
        r.setTopStagiaires(topStagiaires);

        return r;
    }

    // ── Stats simples (rétrocompatibilité Sprint 2) ───────────
    public DashboardStats getStatsGlobales(String annee) {
        if (annee == null || annee.isEmpty()) {
            annee = String.valueOf(java.time.Year.now().getValue());
        }
        final String targetAnnee = annee;
        DashboardStats stats = new DashboardStats();
        stats.setNbUtilisateurs(utilisateurRepository.count());
        stats.setNbStagiaires(utilisateurRepository.findByRole(Role.ROLE_STAGIAIRE).size());
        stats.setNbEncadrants(utilisateurRepository.findByRole(Role.ROLE_ENCADRANT).size());
        
        List<Stage> stages = stageRepository.findAll().stream()
                .filter(s -> s.getSujetSession() != null && targetAnnee.equals(s.getSujetSession().getAnnee()))
                .collect(Collectors.toList());
        
        stats.setNbStagesEnCours(stages.stream().filter(s -> s.getStatut() == StatutStage.EN_COURS).count());
        stats.setNbStagesValides(stages.stream().filter(s -> s.getStatut() == StatutStage.VALIDE).count());

        long nbSujets = sujetSessionRepository.findByAnnee(targetAnnee).stream()
                .filter(s -> "DISPONIBLE".equals(s.getStatut()))
                .count();
        stats.setNbSujets(nbSujets);

        List<Long> stageIds = stages.stream().map(Stage::getId).collect(Collectors.toList());
        stats.setNbReunions(reunionRepository.findAll().stream()
                .filter(reu -> reu.getStage() != null && stageIds.contains(reu.getStage().getId()))
                .filter(reu -> "TERMINEE".equals(reu.getStatut()))
                .count());
        
        double moyAnnee = evaluationRepository.findAll().stream()
                .filter(ev -> ev.getSprint() != null && ev.getSprint().getStage() != null 
                        && stageIds.contains(ev.getSprint().getStage().getId()))
                .mapToDouble(ev -> ev.getNoteGlobale() != null ? ev.getNoteGlobale() : 0)
                .average().orElse(0);
        stats.setMoyenneEvaluations(moyAnnee);
        
        return stats;
    }

    public DashboardStats getStatsByEncadrant(Long encadrantId) {
        DashboardStats stats = new DashboardStats();
        stats.setNbStagiaires(stageRepository.findByEncadrantId(encadrantId).size());
        stats.setNbStagesEnCours(
                stageRepository.findByEncadrantId(encadrantId)
                        .stream().filter(s -> s.getStatut() == StatutStage.EN_COURS).count());
        stats.setMoyenneEvaluations(evaluationRepository.getMoyenneGenerale());
        return stats;
    }

    @Data
    public static class DashboardStats {
        private long nbUtilisateurs;
        private long nbStagiaires;
        private long nbEncadrants;
        private long nbStagesEnCours;
        private long nbStagesValides;
        private long nbSujets;
        private long nbReunions;
        private Double moyenneEvaluations;
    }
}