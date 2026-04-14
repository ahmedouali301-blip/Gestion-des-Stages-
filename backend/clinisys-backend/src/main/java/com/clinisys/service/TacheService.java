package com.clinisys.service;

import com.clinisys.dto.request.TacheRequest;
import com.clinisys.dto.request.TacheUpdateRequest;
import com.clinisys.dto.response.TacheResponse;
import com.clinisys.dto.response.TacheSprintResponse;
import com.clinisys.entity.*;
import com.clinisys.enums.StatutSprint;
import com.clinisys.enums.StatutTache;
import com.clinisys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TacheService {

    private final TacheRepository tacheRepository;
    private final TacheBaseRepository tacheBaseRepository;
    private final SprintRepository sprintRepository;
    private final StageRepository stageRepository;
    private final StagiaireRepository stagiaireRepository;
    private final SprintService sprintService;
    private final MouvementService mouvementService;
    private final NotificationService notificationService;

    // ── Créer tâche pour un stage (sans sprint) ───────────────
    @Transactional
    public TacheResponse creerPourStage(TacheRequest req) {
        Stage stage = stageRepository.findById(req.getStageId())
                .orElseThrow(() -> new RuntimeException("Stage non trouvé"));

        Tache tache = new Tache();
        tache.setTitre(req.getTitre());
        tache.setDescription(req.getDescription());
        tache.setPriorite(req.getPriorite());
        tache.setDateEcheance(req.getDateEcheance());
        tache.setStage(stage);
        Tache saved = tacheBaseRepository.save(tache);
        
        // Notifications
        String msg = "Une nouvelle tâche a été créée pour votre stage : " + tache.getTitre();
        if (stage.getStagiaire() != null) notificationService.envoyerNotification(stage.getStagiaire(), "Nouvelle Tâche", msg, "TACHE_CREEE", null);
        if (stage.getStagiaire2() != null) notificationService.envoyerNotification(stage.getStagiaire2(), "Nouvelle Tâche", msg, "TACHE_CREEE", null);
        if (stage.getEncadrant() != null) notificationService.envoyerNotification(stage.getEncadrant(), "Nouvelle Tâche", msg, "TACHE_CREEE", null);

        return toTacheResponse(saved);
    }

    // ── Affecter tâche à un sprint (avec binôme) ──────────────
    @Transactional
    public TacheSprintResponse affecterTacheASprint(Long tacheId, Long sprintId) {
        Tache tache = tacheBaseRepository.findById(tacheId)
                .orElseThrow(() -> new RuntimeException("Tâche non trouvée"));
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint non trouvé"));

        boolean dejaAffectee = tacheRepository.findBySprintId(sprintId)
                .stream().anyMatch(ts -> ts.getTache() != null
                        && ts.getTache().getId().equals(tacheId));
        if (dejaAffectee)
            throw new RuntimeException("Tâche déjà dans ce sprint");

        Stage stage = sprint.getStage();

        // ── TacheSprint pour stagiaire 1 ───────────────────────
        TacheSprint ts1 = new TacheSprint();
        ts1.setTache(tache);
        ts1.setSprint(sprint);
        ts1.setStatut(StatutTache.A_FAIRE);
        if (stage.getStagiaire() != null)
            ts1.setStagiaire(stage.getStagiaire());
        TacheSprint saved = tacheRepository.save(ts1);

        // ── Si binôme → TacheSprint pour stagiaire 2 aussi ────
        if (Boolean.TRUE.equals(stage.getEstBinome()) && stage.getStagiaire2() != null) {
            TacheSprint ts2 = new TacheSprint();
            ts2.setTache(tache);
            ts2.setSprint(sprint);
            ts2.setStatut(StatutTache.A_FAIRE);
            ts2.setStagiaire(stage.getStagiaire2());
            tacheRepository.save(ts2);
        }

        sprintService.recalculerAvancement(sprintId);
        
        // Notifications
        String msgNotif = "La tâche '" + tache.getTitre() + "' a été affectée au sprint " + sprint.getNom();
        if (stage.getEncadrant() != null) notificationService.envoyerNotification(stage.getEncadrant(), "Tâche Affectée", msgNotif, "TACHE_AFFECTEE", null);
        if (stage.getStagiaire() != null) notificationService.envoyerNotification(stage.getStagiaire(), "Tâche Affectée", msgNotif, "TACHE_AFFECTEE", null);
        if (stage.getStagiaire2() != null) notificationService.envoyerNotification(stage.getStagiaire2(), "Tâche Affectée", msgNotif, "TACHE_AFFECTEE", null);

        return toSprintResponse(saved);
    }

    // ── Créer tâche dans un sprint directement (encadrant) ────
    @Transactional
    public TacheSprintResponse creer(TacheRequest req) {
        Sprint sprint = sprintRepository.findById(req.getSprintId())
                .orElseThrow(() -> new RuntimeException("Sprint non trouvé"));

        Tache tache = new Tache();
        tache.setTitre(req.getTitre());
        tache.setDescription(req.getDescription());
        tache.setPriorite(req.getPriorite());
        tache.setDateEcheance(req.getDateEcheance());
        tache.setStage(sprint.getStage());
        tache = tacheBaseRepository.save(tache);

        Stage stage = sprint.getStage();

        // ── TacheSprint pour stagiaire 1 ───────────────────────
        TacheSprint ts1 = new TacheSprint();
        ts1.setSprint(sprint);
        ts1.setTache(tache);
        ts1.setStatut(StatutTache.A_FAIRE);
        ts1.setEstimation(req.getEstimation());
        if (stage != null && stage.getStagiaire() != null)
            ts1.setStagiaire(stage.getStagiaire());
        TacheSprint saved = tacheRepository.save(ts1);

        // ── Si binôme → TacheSprint pour stagiaire 2 ──────────
        if (stage != null && Boolean.TRUE.equals(stage.getEstBinome())
                && stage.getStagiaire2() != null) {
            TacheSprint ts2 = new TacheSprint();
            ts2.setSprint(sprint);
            ts2.setTache(tache);
            ts2.setStatut(StatutTache.A_FAIRE);
            ts2.setEstimation(req.getEstimation());
            ts2.setStagiaire(stage.getStagiaire2());
            tacheRepository.save(ts2);
        }

        sprintService.recalculerAvancement(sprint.getId());
        mouvementService.enregistrer("Création d'une tâche : " + tache.getTitre() + " dans le sprint " + sprint.getNom(), "TACHE_CREEE", null);
        
        // Notif
        String msgNotif = "Nouvelle tâche dans le sprint " + sprint.getNom() + " : " + tache.getTitre();
        if (stage != null && stage.getStagiaire() != null) notificationService.envoyerNotification(stage.getStagiaire(), "Nouvelle Tâche", msgNotif, "TACHE_CREEE", null);
        if (stage != null && stage.getStagiaire2() != null) notificationService.envoyerNotification(stage.getStagiaire2(), "Nouvelle Tâche", msgNotif, "TACHE_CREEE", null);
        if (stage != null && stage.getEncadrant() != null) notificationService.envoyerNotification(stage.getEncadrant(), "Nouvelle Tâche", msgNotif, "TACHE_CREEE", null);

        return toSprintResponse(saved);
    }

    // ── Proposer une tâche (Stagiaire) ────────────────────────
    @Transactional
    public TacheSprintResponse proposer(TacheRequest req, Long stagiaireId) {
        Sprint sprint = sprintRepository.findById(req.getSprintId())
                .orElseThrow(() -> new RuntimeException("Sprint non trouvé"));
        Stagiaire stagiaire = stagiaireRepository.findById(stagiaireId)
                .orElseThrow(() -> new RuntimeException("Stagiaire non trouvé"));

        Tache tache = new Tache();
        tache.setTitre(req.getTitre());
        tache.setDescription(req.getDescription());
        tache.setPriorite(req.getPriorite());
        tache.setDateEcheance(req.getDateEcheance());
        tache.setStage(sprint.getStage());
        tache = tacheBaseRepository.save(tache);

        // Proposition créée uniquement pour le stagiaire qui propose
        // (l'encadrant valide → devient partagée si binôme)
        TacheSprint ts = new TacheSprint();
        ts.setSprint(sprint);
        ts.setTache(tache);
        ts.setStagiaire(stagiaire);
        ts.setStatut(StatutTache.EN_ATTENTE_VALIDATION);
        TacheSprint savedTs = tacheRepository.save(ts);
        mouvementService.enregistrer("Le stagiaire " + stagiaire.getNom() + " a proposé une tâche : " + tache.getTitre(), "TACHE_PROPOSEE", stagiaire);
        
        // Notif Encadrant
        Stage stage = sprint.getStage();
        if (stage != null && stage.getEncadrant() != null) {
            notificationService.envoyerNotification(stage.getEncadrant(), "Proposition de Tâche", 
                "Le stagiaire " + stagiaire.getNom() + " a proposé une nouvelle tâche : " + tache.getTitre(), "TACHE_PROPOSEE", null);
        }

        return toSprintResponse(savedTs);
    }

    // ── Valider une tâche proposée ────────────────────────────
    // Si binôme → crée aussi la TacheSprint pour le 2ème stagiaire
    @Transactional
    public TacheSprintResponse valider(Long id) {
        TacheSprint ts = getTS(id);
        if (ts.getStatut() != StatutTache.EN_ATTENTE_VALIDATION)
            throw new RuntimeException("La tâche n'est pas en attente de validation");
        ts.setStatut(StatutTache.A_FAIRE);
        TacheSprint saved = tacheRepository.save(ts);

        // Si stage binôme → créer aussi pour l'autre stagiaire
        Stage stage = ts.getSprint().getStage();
        if (Boolean.TRUE.equals(stage.getEstBinome()) && stage.getStagiaire2() != null) {
            Long autreId = ts.getStagiaire().getId().equals(stage.getStagiaire().getId())
                    ? stage.getStagiaire2().getId()
                    : stage.getStagiaire().getId();

            boolean dejaExiste = tacheRepository.findBySprintId(ts.getSprint().getId())
                    .stream().anyMatch(t -> t.getTache().getId().equals(ts.getTache().getId()) &&
                            t.getStagiaire() != null &&
                            t.getStagiaire().getId().equals(autreId));

            if (!dejaExiste) {
                Stagiaire autre = stagiaireRepository.findById(autreId).orElse(null);
                if (autre != null) {
                    TacheSprint ts2 = new TacheSprint();
                    ts2.setSprint(ts.getSprint());
                    ts2.setTache(ts.getTache());
                    ts2.setStagiaire(autre);
                    ts2.setStatut(StatutTache.A_FAIRE);
                    tacheRepository.save(ts2);
                }
            }
        }

        sprintService.recalculerAvancement(ts.getSprint().getId());
        mouvementService.enregistrer("Validation de la tâche : " + ts.getTache().getTitre(), "TACHE_VALIDEE", null);
        
        // Notif Stagiaires
        String msgValid = "Votre tâche '" + ts.getTache().getTitre() + "' a été validée par l'encadrant.";
        if (stage.getStagiaire() != null) notificationService.envoyerNotification(stage.getStagiaire(), "Tâche Validée", msgValid, "TACHE_VALIDEE", null);
        if (stage.getStagiaire2() != null) notificationService.envoyerNotification(stage.getStagiaire2(), "Tâche Validée", msgValid, "TACHE_VALIDEE", null);

        return toSprintResponse(saved);
    }

    // ── Refuser ───────────────────────────────────────────────
    public TacheSprintResponse refuser(Long id, String commentaire) {
        if (commentaire == null || commentaire.isBlank())
            throw new RuntimeException("Un commentaire est requis");
        TacheSprint ts = getTS(id);
        ts.setStatut(StatutTache.REFUSE);
        ts.setCommentaire(commentaire);
        return toSprintResponse(tacheRepository.save(ts));
    }

    // ── Mise à jour statut ────────────────────────────────────
    // Si binôme → synchroniser le statut sur la tâche de l'autre stagiaire
    @Transactional
    public TacheSprintResponse mettreAJour(Long id, TacheUpdateRequest req) {
        TacheSprint ts = getTS(id);
        if (req.getStatut() != null) {
            verifierTransition(ts.getStatut(), req.getStatut());
            
            // ✅ Nouvelle condition : le stagiaire ne peut commencer une tâche que si le sprint est en cours
            if (req.getStatut() == StatutTache.EN_COURS) {
                if (ts.getSprint() != null && ts.getSprint().getStatut() != StatutSprint.EN_COURS) {
                    throw new RuntimeException("Impossible de commencer la tâche : l'encadrant doit d'abord démarrer le sprint '" + ts.getSprint().getNom() + "'.");
                }
            }
            
            ts.setStatut(req.getStatut());
        }
        if (req.getCommentaire() != null)
            ts.setCommentaire(req.getCommentaire());
        if (req.getDateFin() != null)
            ts.setDateFin(req.getDateFin());
        if (req.getDuree() != null)
            ts.setDuree(req.getDuree());
        TacheSprint saved = tacheRepository.save(ts);
        if (req.getStatut() != null) {
            mouvementService.enregistrer("Mise à jour du statut de la tâche '" + ts.getTache().getTitre() + "' vers : " + req.getStatut(), "TACHE_STATUT_CHANGE", ts.getStagiaire());
            
            // --- Notification Encadrant ---
            Stage stage = ts.getSprint().getStage();
            if (stage != null && stage.getEncadrant() != null) {
                String stagiaireNom = (ts.getStagiaire() != null) ? ts.getStagiaire().getPrenom() + " " + ts.getStagiaire().getNom() : "Le stagiaire";
                notificationService.envoyerNotification(stage.getEncadrant(), "Mise à jour de tâche", 
                    stagiaireNom + " a changé le statut de la tâche '" + ts.getTache().getTitre() + "' en : " + req.getStatut(), "TACHE_STATUT_CHANGE", null);
            }
        }

        // ── Synchronisation binôme ─────────────────────────────
        if (req.getStatut() != null) {
            Stage stage = ts.getSprint().getStage();
            if (Boolean.TRUE.equals(stage.getEstBinome())) {
                // Trouver la TacheSprint de l'autre stagiaire pour la même tâche
                tacheRepository.findBySprintId(ts.getSprint().getId())
                        .stream()
                        .filter(other -> other.getTache().getId().equals(ts.getTache().getId()) &&
                                !other.getId().equals(ts.getId()) &&
                                other.getStagiaire() != null)
                        .findFirst()
                        .ifPresent(other -> {
                            try {
                                verifierTransition(other.getStatut(), req.getStatut());
                                other.setStatut(req.getStatut());
                                tacheRepository.save(other);
                            } catch (Exception ignored) {
                            }
                        });
            }
        }

        sprintService.recalculerAvancement(ts.getSprint().getId());
        return toSprintResponse(saved);
    }

    // ── Lister par sprint ─────────────────────────────────────
    public List<TacheSprintResponse> getBySprintId(Long sprintId) {
        return tacheRepository.findBySprintId(sprintId)
                .stream().map(this::toSprintResponse).collect(Collectors.toList());
    }

    // ── Lister par stagiaire (via stage principal OU binôme) ──
    public List<TacheSprintResponse> getByStagiaireId(Long stagiaireId) {
        return tacheRepository.findAllByStagiaireViaStage(stagiaireId)
                .stream().map(this::toSprintResponse).collect(Collectors.toList());
    }

    // ── Lister tâches d'un stage ──────────────────────────────
    public List<TacheResponse> getTachesByStage(Long stageId) {
        List<Tache> baseList = tacheBaseRepository.findByStageId(stageId);
        
        // Récupérer toutes les affectations de ce stage pour savoir lesquelles sont en sprint
        List<TacheSprint> sprintTasks = tacheRepository.findByStageId(stageId);
        java.util.Map<Long, TacheSprint> sprintMap = sprintTasks.stream()
                .collect(java.util.stream.Collectors.toMap(
                        ts -> ts.getTache().getId(),
                        ts -> ts,
                        (ts1, ts2) -> ts1 // En cas de binôme, on prend la première info
                ));

        return baseList.stream().map(t -> {
            TacheResponse r = toTacheResponse(t);
            TacheSprint ts = sprintMap.get(t.getId());
            if (ts != null) {
                r.setSprintId(ts.getSprint().getId());
                r.setSprintNom(ts.getSprint().getNom());
                r.setStatut(ts.getStatut().name());
            }
            return r;
        }).collect(java.util.stream.Collectors.toList());
    }

    public List<TacheResponse> getTachesNonAffectees(Long stageId) {
        return tacheBaseRepository.findTachesNonAffectees(stageId)
                .stream().map(this::toTacheResponse).collect(Collectors.toList());
    }

    @Transactional
    public void retirerTacheDuSprint(Long tacheSprintId) {
        TacheSprint ts = tacheRepository.findById(tacheSprintId)
                .orElseThrow(() -> new RuntimeException("Affectation non trouvée"));
        Long sprintId = ts.getSprint().getId();
        Long tacheId = ts.getTache().getId();

        // Si binôme → supprimer aussi l'entrée de l'autre stagiaire
        Stage stage = ts.getSprint().getStage();
        if (Boolean.TRUE.equals(stage.getEstBinome())) {
            tacheRepository.findBySprintId(sprintId)
                    .stream()
                    .filter(other -> other.getTache().getId().equals(tacheId)
                            && !other.getId().equals(tacheSprintId))
                    .forEach(other -> tacheRepository.deleteById(other.getId()));
        }

        tacheRepository.deleteById(tacheSprintId);
        sprintService.recalculerAvancement(sprintId);
    }

    @Transactional
    public void delete(Long id) {
        TacheSprint ts = getTS(id);
        Long sprintId = ts.getSprint().getId();
        Long tacheId = ts.getTache().getId();

        Stage stage = ts.getSprint().getStage();
        if (Boolean.TRUE.equals(stage.getEstBinome())) {
            tacheRepository.findBySprintId(sprintId)
                    .stream()
                    .filter(other -> other.getTache().getId().equals(tacheId)
                            && !other.getId().equals(id))
                    .forEach(other -> tacheRepository.deleteById(other.getId()));
        }

        tacheRepository.deleteById(id);
        sprintService.recalculerAvancement(sprintId);
    }

    @Transactional
    public void deleteTacheSimple(Long tacheId) {
        tacheBaseRepository.deleteById(tacheId);
    }

    // ── Helpers ───────────────────────────────────────────────
    private void verifierTransition(StatutTache actuel, StatutTache nouveau) {
        boolean valid = switch (actuel) {
            case A_FAIRE -> nouveau == StatutTache.EN_COURS;
            case EN_COURS -> nouveau == StatutTache.TERMINE || nouveau == StatutTache.A_FAIRE;
            case EN_ATTENTE_VALIDATION -> nouveau == StatutTache.A_FAIRE || nouveau == StatutTache.REFUSE;
            default -> false;
        };
        if (!valid)
            throw new RuntimeException("Transition interdite: " + actuel + " → " + nouveau);
    }

    private TacheSprint getTS(Long id) {
        return tacheRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tâche non trouvée"));
    }

    private TacheResponse toTacheResponse(Tache t) {
        TacheResponse r = new TacheResponse();
        r.setId(t.getId());
        r.setTitre(t.getTitre());
        r.setDescription(t.getDescription());
        r.setPriorite(t.getPriorite());
        r.setDateEcheance(t.getDateEcheance());
        r.setDateCreation(t.getDateCreation());
        if (t.getStage() != null) {
            r.setStageId(t.getStage().getId());
            r.setStageSujet(t.getStage().getSujet());
        }
        return r;
    }

    private TacheSprintResponse toSprintResponse(TacheSprint ts) {
        TacheSprintResponse r = new TacheSprintResponse();
        r.setId(ts.getId());
        r.setStatut(ts.getStatut());
        r.setEstimation(ts.getEstimation());
        r.setDuree(ts.getDuree());
        r.setCommentaire(ts.getCommentaire());
        r.setDateDebut(ts.getDateDebut());
        r.setDateFin(ts.getDateFin());
        if (ts.getTache() != null) {
            r.setTitre(ts.getTache().getTitre());
            r.setDescription(ts.getTache().getDescription());
            r.setPriorite(ts.getTache().getPriorite());
            r.setDateEcheance(ts.getTache().getDateEcheance());
            r.setDateCreation(ts.getTache().getDateCreation());
        }
        if (ts.getSprint() != null) {
            r.setSprintId(ts.getSprint().getId());
            r.setSprintNom(ts.getSprint().getNom());
            r.setSprintStatut(ts.getSprint().getStatut() != null ? ts.getSprint().getStatut().name() : null);
        }
        if (ts.getStagiaire() != null) {
            r.setStagiaireId(ts.getStagiaire().getId());
            r.setStagiaireNom(ts.getStagiaire().getNom());
            r.setStagiairePrenom(ts.getStagiaire().getPrenom());
        }
        return r;
    }
}