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

    // ── Dashboard complet ─────────────────────────────────────
    public DashboardCompletResponse getDashboardComplet() {
        DashboardCompletResponse r = new DashboardCompletResponse();

        // Stats de base
        r.setNbUtilisateurs(utilisateurRepository.count());
        r.setNbStagiaires(utilisateurRepository.findByRole(Role.ROLE_STAGIAIRE).size());
        r.setNbEncadrants(utilisateurRepository.findByRole(Role.ROLE_ENCADRANT).size());

        List<Stage> stages = stageRepository.findAll();
        long enCours = stages.stream().filter(s -> s.getStatut() == StatutStage.EN_COURS).count();
        long valides = stages.stream().filter(s -> s.getStatut() == StatutStage.VALIDE).count();
        long interrompus = stages.stream().filter(s -> s.getStatut() == StatutStage.INTERROMPU).count();

        r.setNbStagesEnCours(enCours);
        r.setNbStagesValides(valides);
        r.setNbStagesInterrompus(interrompus);
        r.setNbSujets(sujetRepository.findAllDisponibles().size());
        r.setNbReunionsTerminees(reunionRepository.countByStatut("TERMINEE"));
        r.setMoyenneEvaluations(evaluationRepository.getMoyenneGenerale());

        // Taux avancement global
        List<Sprint> sprints = sprintRepository.findAll();
        r.setTauxAvancementGlobal(sprints.stream()
                .mapToDouble(s -> s.getTauxAvancement() != null ? s.getTauxAvancement() : 0)
                .average().orElse(0));

        // Taux réussite
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

        // Charge par encadrant
        List<ChargeEncadrant> charges = encadrantRepository.findAll().stream().map(e -> {
            ChargeEncadrant c = new ChargeEncadrant();
            c.setEncadrantId(e.getId());
            c.setEncadrantNom(e.getNom());
            c.setEncadrantPrenom(e.getPrenom());
            List<Stage> stagesEnc = stageRepository.findByEncadrantId(e.getId());
            c.setNbStagiaires(stagesEnc.size());
            Double moy = evaluationRepository.getMoyenneGenerale();
            c.setMoyenneEvals(moy != null ? moy : 0.0);
            return c;
        }).collect(Collectors.toList());
        r.setChargeEncadrants(charges);

        // Top stagiaires
        List<StagiaireStats> topStagiaires = stagiaireRepository.findAll().stream().map(s -> {
            StagiaireStats ss = new StagiaireStats();
            ss.setStagiaireId(s.getId());
            ss.setStagiaireNom(s.getNom());
            ss.setStagiairePrenom(s.getPrenom());
            Double moy = evaluationRepository.getMoyenneByStagiaireId(s.getId());
            ss.setMoyenne(moy != null ? moy : 0.0);
            ss.setNbTachesTerminees(tacheRepository.countTermineesBySprintId(s.getId()));

            List<Stage> stagesStagiaire = stageRepository.findByStagiaireId(s.getId());
            double taux = stagesStagiaire.stream()
                    .flatMap(st -> sprintRepository.findByStageIdOrderByNumero(st.getId()).stream())
                    .mapToDouble(sp -> sp.getTauxAvancement() != null ? sp.getTauxAvancement() : 0)
                    .average().orElse(0);
            ss.setTauxAvancement(taux);
            return ss;
        })
                .filter(ss -> ss.getMoyenne() > 0)
                .sorted(Comparator.comparingDouble(StagiaireStats::getMoyenne).reversed())
                .limit(5)
                .collect(Collectors.toList());
        r.setTopStagiaires(topStagiaires);

        return r;
    }

    // ── Stats simples (rétrocompatibilité Sprint 2) ───────────
    public DashboardStats getStatsGlobales() {
        DashboardStats stats = new DashboardStats();
        stats.setNbUtilisateurs(utilisateurRepository.count());
        stats.setNbStagiaires(utilisateurRepository.findByRole(Role.ROLE_STAGIAIRE).size());
        stats.setNbEncadrants(utilisateurRepository.findByRole(Role.ROLE_ENCADRANT).size());
        stats.setNbStagesEnCours(stageRepository.findByStatut(StatutStage.EN_COURS).size());
        stats.setNbStagesValides(stageRepository.findByStatut(StatutStage.VALIDE).size());
        stats.setNbSujets(sujetRepository.findAllDisponibles().size());
        stats.setNbReunions(reunionRepository.countByStatut("TERMINEE"));
        stats.setMoyenneEvaluations(evaluationRepository.getMoyenneGenerale());
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