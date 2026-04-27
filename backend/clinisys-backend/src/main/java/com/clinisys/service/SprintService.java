package com.clinisys.service;

import com.clinisys.dto.request.SprintRequest;
import com.clinisys.dto.response.SprintResponse;
import com.clinisys.entity.*;
import com.clinisys.enums.StatutSprint;
import com.clinisys.enums.StatutTache;
import com.clinisys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository     sprintRepository;
    private final StageRepository      stageRepository;
    private final TacheRepository      tacheRepository;
    private final TacheBaseRepository  tacheBaseRepository;
    private final EvaluationRepository evaluationRepository;
    private final ReunionRepository    reunionRepository;
    private final NotificationService  notificationService;
    private final MouvementService     mouvementService;

    @Transactional
    public SprintResponse creerSprint(SprintRequest req) {

        Stage stage = stageRepository.findById(req.getStageId())
                .orElseThrow(() -> new RuntimeException("Stage non trouvé"));

        if (stage.getStatut() == com.clinisys.enums.StatutStage.VALIDE)
            throw new RuntimeException("Impossible de modifier un stage déjà validé. Tout est bloqué.");

        if (req.getDateFin().isBefore(req.getDateDebut()))
            throw new RuntimeException("La date de fin doit être après la date de début");

        // ── RÈGLE 1 : Vérifier que le sprint précédent est clôturé ──
        List<Sprint> sprintsExistants = sprintRepository
                .findByStageIdOrderByNumero(req.getStageId());

        if (!sprintsExistants.isEmpty()) {
            // Prendre le dernier sprint créé
            Sprint dernierSprint = sprintsExistants.get(sprintsExistants.size() - 1);
            StatutSprint statutDernier = dernierSprint.getStatut();

            // Bloquer si le dernier sprint n'est pas clôturé
            boolean estCloture = statutDernier == StatutSprint.TERMINE
                    || statutDernier == StatutSprint.TERMINE_INCOMPLET;

            if (!estCloture) {
                throw new RuntimeException(
                    "Impossible de créer un nouveau sprint : le Sprint "
                    + dernierSprint.getNumero()
                    + " (" + dernierSprint.getNom() + ")"
                    + " doit être clôturé d'abord."
                );
            }
        }

        // ── Créer le nouveau sprint ───────────────────────────────
        Sprint sprint = new Sprint();
        sprint.setNom(req.getNom());
        sprint.setNumero(req.getNumero());
        sprint.setObjectifs(req.getObjectifs());
        sprint.setDateDebut(req.getDateDebut());
        sprint.setDateFin(req.getDateFin());
        sprint.setLivrables(req.getLivrables());
        sprint.setStatut(StatutSprint.PLANIFIE);
        sprint.setTauxAvancement(0.0);
        sprint.setStage(stage);

        Sprint saved = sprintRepository.save(sprint);

        // ── RÈGLE 2 : Déplacer les tâches non terminées du sprint précédent ──
        if (!sprintsExistants.isEmpty()) {
            Sprint dernierSprint = sprintsExistants.get(sprintsExistants.size() - 1);

            // Récupérer toutes les tâches du sprint précédent
            List<TacheSprint> tachesPrecedentes = tacheRepository
                    .findBySprintId(dernierSprint.getId());

            for (TacheSprint ancienneTache : tachesPrecedentes) {
                StatutTache statut = ancienneTache.getStatut();

                // Ignorer les tâches TERMINE et REFUSE → elles restent dans l'ancien sprint
                if (statut == StatutTache.TERMINE || statut == StatutTache.REFUSE) {
                    continue;
                }

                // A_FAIRE, EN_COURS, EN_ATTENTE_VALIDATION → déplacer vers le nouveau sprint
                // 1. Marquer la tâche actuelle comme REPORTEE dans l'ancien sprint
                ancienneTache.setStatut(StatutTache.REPORTEE);
                tacheRepository.save(ancienneTache);

                // 2. Créer la nouvelle occurrence dans le nouveau sprint
                TacheSprint nouvelleTache = new TacheSprint();
                nouvelleTache.setSprint(saved);
                nouvelleTache.setTache(ancienneTache.getTache());
                nouvelleTache.setStatut(StatutTache.REPORTEE); // On le met en REPORTER pour le nouveau cycle aussi
                nouvelleTache.setEstimation(ancienneTache.getEstimation());
                nouvelleTache.setStagiaire(ancienneTache.getStagiaire());

                tacheRepository.save(nouvelleTache);
            }

            // Recalculer l'avancement du sprint précédent après déplacement
            recalculerAvancement(dernierSprint.getId());
        }

        // ── RÈGLE 3 : Dates des réunions obligatoires ──
        if (req.getDatesMots() == null || req.getDatesMots().isEmpty()) {
            throw new RuntimeException("Vous devez planifier au moins une date de réunion pour ce sprint.");
        }

        // ── Créer les réunions automatiquement pour chaque date ──
        if (req.getDatesMots() != null && !req.getDatesMots().isEmpty()) {
            int index = 1;
            for (LocalDateTime dateHeure : req.getDatesMots()) {
                if (dateHeure == null) continue;

                Reunion reunion = new Reunion();
                reunion.setSprint(saved);
                reunion.setTitre("Réunion de suivi — Sprint "
                        + req.getNumero() + " · Séance " + index);
                reunion.setDateHeure(dateHeure);
                reunion.setLieu("À définir");
                reunion.setStatut("PROPOSEE");
                reunion.setAcceptationEncadrant(true);
                reunion.setAcceptationStagiaire1(false);
                reunion.setAcceptationStagiaire2(stage.getStagiaire2() == null);

                if (stage.getEncadrant() != null)
                    reunion.setEncadrant(stage.getEncadrant());
                if (stage.getStagiaire() != null)
                    reunion.setStagiaire(stage.getStagiaire());
                if (Boolean.TRUE.equals(stage.getEstBinome())
                        && stage.getStagiaire2() != null)
                    reunion.setStagiaire2(stage.getStagiaire2());

                reunionRepository.save(reunion);

                // Notification invitation réunion
                String notifInvit = "Une nouvelle réunion a été proposée pour le Sprint " + req.getNumero() + " : " + reunion.getTitre();
                if (stage.getStagiaire() != null) {
                    notificationService.envoyerNotification(stage.getStagiaire(), "Invitation Réunion", notifInvit, "REUNION_PROPOSEE", reunion);
                }
                if (stage.getStagiaire2() != null) {
                    notificationService.envoyerNotification(stage.getStagiaire2(), "Invitation Réunion", notifInvit, "REUNION_PROPOSEE", reunion);
                }

                index++;
            }
        }

        // --- Notification Stagiaire ---
        String msgNotif = "Un nouveau sprint a été planifié : Sprint " + saved.getNumero() + " (" + saved.getNom() + ")";
        if (stage.getStagiaire() != null) {
            notificationService.envoyerNotification(stage.getStagiaire(), "Nouveau Sprint", msgNotif, "SPRINT_CREE", null);
        }
        if (stage.getStagiaire2() != null) {
            notificationService.envoyerNotification(stage.getStagiaire2(), "Nouveau Sprint", msgNotif, "SPRINT_CREE", null);
        }

        mouvementService.enregistrer("Création du sprint " + saved.getNumero() + " pour le stage : " + stage.getSujet(), "SPRINT_CREE", null);

        return toResponse(saved);
    }

    // ── Le reste du code est INCHANGÉ ─────────────────────────

    public SprintResponse demarrerSprint(Long id) {
        Sprint sprint = getSprint(id);
        if (sprint.getStage().getStatut() == com.clinisys.enums.StatutStage.VALIDE)
            throw new RuntimeException("Le stage est déjà validé. Aucune modification possible.");
            
        if (sprint.getStatut() != StatutSprint.PLANIFIE)
            throw new RuntimeException("Seul un sprint PLANIFIÉ peut être démarré");
        sprint.setStatut(StatutSprint.EN_COURS);
        return toResponse(sprintRepository.save(sprint));
    }

    public SprintResponse cloturerSprint(Long id, boolean force) {
        Sprint sprint  = getSprint(id);
        if (sprint.getStage().getStatut() == com.clinisys.enums.StatutStage.VALIDE)
            throw new RuntimeException("Le stage est déjà validé. Aucune modification possible.");

        long total     = tacheRepository.countBySprintId(id);
        long terminees = tacheRepository.countTermineesBySprintId(id);

        if (total > terminees && !force)
            throw new RuntimeException("SPRINT_INCOMPLET:" + terminees + "/" + total);

        sprint.setStatut(total == terminees
                ? StatutSprint.TERMINE
                : StatutSprint.TERMINE_INCOMPLET);
        sprint.setDateCloture(LocalDate.now());

        Sprint saved = sprintRepository.save(sprint);

        // --- Notification Stagiaire ---
        Stage stage = saved.getStage();
        if (stage != null) {
            String msgNotif = "Le Sprint " + saved.getNumero() + " (" + saved.getNom() + ") a été clôturé.";
            if (stage.getStagiaire() != null) {
                notificationService.envoyerNotification(stage.getStagiaire(), "Sprint Clôturé", msgNotif, "SPRINT_CLOTURE", null);
            }
            if (stage.getStagiaire2() != null) {
                notificationService.envoyerNotification(stage.getStagiaire2(), "Sprint Clôturé", msgNotif, "SPRINT_CLOTURE", null);
            }
        }

        mouvementService.enregistrer("Clôture du sprint " + saved.getNumero() + " (" + saved.getNom() + ")", "SPRINT_CLOTURE", null);

        return toResponse(saved);
    }

    public Sprint recalculerAvancement(Long sprintId) {
        Sprint sprint  = getSprint(sprintId);
        long total     = tacheRepository.countBySprintId(sprintId);
        long terminees = tacheRepository.countTermineesBySprintId(sprintId);
        sprint.setTauxAvancement(
                total == 0 ? 0.0 : (double) terminees / total * 100);
        return sprintRepository.save(sprint);
    }

    public List<SprintResponse> getSprintsByStage(Long stageId) {
        return sprintRepository.findByStageIdOrderByNumero(stageId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public SprintResponse getById(Long id) {
        return toResponse(getSprint(id));
    }

    public void delete(Long id) {
        Sprint sprint = getSprint(id);
        if (sprint.getStage().getStatut() == com.clinisys.enums.StatutStage.VALIDE)
            throw new RuntimeException("Le stage est déjà validé. Suppression impossible.");

        // RÈGLE : Uniquement si PLANIFIE
        if (sprint.getStatut() != StatutSprint.PLANIFIE) {
            throw new RuntimeException("Impossible de supprimer un sprint qui n'est plus à l'état 'Planifié'.");
        }

        // RÈGLE : Uniquement si VIDE
        long nbTaches = tacheRepository.countBySprintId(id);
        if (nbTaches > 0) {
            throw new RuntimeException("Impossible de supprimer ce sprint car il contient encore des tâches affectées.");
        }

        // Nettoyage des réunions automatiques liées
        List<Reunion> reunions = reunionRepository.findBySprintId(id);
        if (!reunions.isEmpty()) {
            reunionRepository.deleteAll(reunions);
        }

        sprintRepository.deleteById(id);
        mouvementService.enregistrer("Suppression du sprint " + sprint.getNumero() + " (" + sprint.getNom() + ")", "SPRINT_SUPPRIME", null);
    }

    private Sprint getSprint(Long id) {
        return sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint non trouvé"));
    }

    private SprintResponse toResponse(Sprint s) {
        SprintResponse r = new SprintResponse();
        r.setId(s.getId());
        r.setNumero(s.getNumero());
        r.setNom(s.getNom());
        r.setObjectifs(s.getObjectifs());
        r.setDateDebut(s.getDateDebut());
        r.setDateFin(s.getDateFin());
        r.setDateCloture(s.getDateCloture());
        r.setTauxAvancement(s.getTauxAvancement());
        r.setLivrables(s.getLivrables());
        r.setStatut(s.getStatut());
        if (s.getStage() != null) {
            r.setStageId(s.getStage().getId());
            r.setStageSujet(s.getStage().getSujet());
        }
        long total     = tacheRepository.countBySprintId(s.getId());
        long terminees = tacheRepository.countTermineesBySprintId(s.getId());
        r.setNbTaches((int) total);
        r.setNbTachesTerminees((int) terminees);
        Double moy = evaluationRepository.getMoyenneGenerale();
        r.setMoyenneEvaluation(moy);
        return r;
    }
}