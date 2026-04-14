package com.clinisys.service;

import com.clinisys.dto.request.PvRequest;
import com.clinisys.dto.request.ReunionRequest;
import com.clinisys.dto.response.PvResponse;
import com.clinisys.dto.response.ReunionResponse;
import com.clinisys.entity.*;
import com.clinisys.repository.*;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReunionService {

    private final ReunionRepository reunionRepository;
    private final SprintRepository sprintRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final StagiaireRepository stagiaireRepository;
    private final StageRepository stageRepository;
    private final NotificationService notificationService;
    private final MouvementService mouvementService;

    // ── Planifier une réunion ─────────────────────────────────
    @Transactional
    public ReunionResponse planifier(ReunionRequest req, String roleCreateur) {

        Reunion reunion = new Reunion();
        reunion.setTitre(req.getTitre());
        reunion.setDateHeure(req.getDateHeure());
        reunion.setLieu(req.getLieu());
        reunion.setStatut("PROPOSEE");

        // ✅ Sauvegarder la description
        reunion.setDescription(req.getDescription());

        // Lier l'encadrant
        if (req.getEncadrantId() != null) {
            utilisateurRepository.findById(req.getEncadrantId())
                    .ifPresent(u -> reunion.setEncadrant((Encadrant) u));
        }

        // Lier le stagiaire
        if (req.getStagiaireId() != null) {
            stagiaireRepository.findById(req.getStagiaireId())
                    .ifPresent(reunion::setStagiaire);
        }

        // Lier le sprint (optionnel)
        if (req.getSprintId() != null) {
            sprintRepository.findById(req.getSprintId())
                    .ifPresent(reunion::setSprint);
        }

        // ✅ Récupération automatique des infos depuis le stage si stageId est présent
        if (req.getStageId() != null) {
            stageRepository.findById(req.getStageId()).ifPresent(stage -> {
                if (reunion.getEncadrant() == null && stage.getEncadrant() != null) {
                    reunion.setEncadrant(stage.getEncadrant());
                }
                if (reunion.getStagiaire() == null && stage.getStagiaire() != null) {
                    reunion.setStagiaire(stage.getStagiaire());
                }
                if (reunion.getStagiaire2() == null && stage.getStagiaire2() != null) {
                    reunion.setStagiaire2(stage.getStagiaire2());
                }
            });
        }

        // --- Logique d'acceptation initiale ---
        if (roleCreateur == null || roleCreateur.isEmpty()) {
            roleCreateur = "ROLE_STAGIAIRE"; // Fallback par défaut
        }

        if ("ROLE_STAGIAIRE".equals(roleCreateur)) {
            reunion.setAcceptationStagiaire1(true);
            reunion.setAcceptationStagiaire2(true);
            reunion.setAcceptationEncadrant(false);
        } else {
            reunion.setAcceptationEncadrant(true);
            reunion.setAcceptationStagiaire1(false);
            reunion.setAcceptationStagiaire2(reunion.getStagiaire2() == null);
        }

        Reunion saved = reunionRepository.save(reunion);

        // --- Notifications ---
        if (reunion.getStagiaire() != null) {
            notificationService.envoyerNotification(reunion.getStagiaire(), "TEST",
                    "Ceci est un test de notification créateur", "DEBUG", null);
        }

        if ("ROLE_STAGIAIRE".equals(roleCreateur)) {
            System.out.println("DEBUG: Envoi notif à l'encadrant ID="
                    + (reunion.getEncadrant() != null ? reunion.getEncadrant().getId() : "NULL"));
            notificationService.envoyerNotification(reunion.getEncadrant(), "Nouvelle proposition de réunion",
                    "Le stagiaire " + (reunion.getStagiaire() != null ? reunion.getStagiaire().getPrenom() : "")
                            + " a proposé une réunion : " + reunion.getTitre(),
                    "REUNION_PROPOSEE", saved);
        } else {
            System.out.println("DEBUG: Envoi notif aux stagiaires...");
            if (reunion.getStagiaire() != null) {
                notificationService.envoyerNotification(reunion.getStagiaire(), "Nouvelle réunion proposée",
                        "L'encadrant a proposé une réunion : " + reunion.getTitre(), "REUNION_PROPOSEE", saved);
            }
            if (reunion.getStagiaire2() != null) {
                notificationService.envoyerNotification(reunion.getStagiaire2(), "Nouvelle réunion proposée",
                        "L'encadrant a proposé une réunion : " + reunion.getTitre(), "REUNION_PROPOSEE", saved);
            }
        }

        mouvementService.enregistrer("Plannification d'une réunion : " + reunion.getTitre(), "REUNION_PLANIFIEE", null);
        return toResponse(saved);
    }

    // ── Accepter par Encadrant (pour proposition stagiaire) ────
    @Transactional
    public ReunionResponse accepterParEncadrant(Long id) {
        Reunion reunion = getReunion(id);
        reunion.setAcceptationEncadrant(true);

        if (reunion.getAcceptationStagiaire1() && reunion.getAcceptationStagiaire2()) {
            reunion.setStatut("PLANIFIEE");
            notificationService.envoyerNotification(reunion.getStagiaire(), "Réunion validée",
                    "L'encadrant a validé votre proposition de réunion : " + reunion.getTitre(), "REUNION_ACCEPTEE",
                    reunion);
            if (reunion.getStagiaire2() != null) {
                notificationService.envoyerNotification(reunion.getStagiaire2(), "Réunion validée",
                        "L'encadrant a validé votre proposition de réunion : " + reunion.getTitre(), "REUNION_ACCEPTEE",
                        reunion);
            }
        }
        Reunion saved = reunionRepository.save(reunion);
        mouvementService.enregistrer("L'encadrant a accepté la réunion : " + reunion.getTitre(), "REUNION_VALIDEE", reunion.getEncadrant());
        return toResponse(saved);
    }

    @Transactional
    public ReunionResponse reporterReunionParEncadrant(Long id, String motif, LocalDateTime nouvelleDate) {
        Reunion reunion = getReunion(id);
        reunion.setStatut("PROPOSEE");
        reunion.setObservations("Report demandé par l'encadrant. Motif : " + motif);
        reunion.setDateHeure(nouvelleDate);

        reunion.setAcceptationEncadrant(true);
        reunion.setAcceptationStagiaire1(false);
        reunion.setAcceptationStagiaire2(reunion.getStagiaire2() == null);

        Reunion saved = reunionRepository.save(reunion);

        if (reunion.getStagiaire() != null) {
            notificationService.envoyerNotification(reunion.getStagiaire(), "Report de réunion (Encadrant)",
                    "L'encadrant a reporté la réunion : " + reunion.getTitre() + ". Nouveau créneau proposé.",
                    "REUNION_REPORTEE", saved);
        }
        if (reunion.getStagiaire2() != null) {
            notificationService.envoyerNotification(reunion.getStagiaire2(), "Report de réunion (Encadrant)",
                    "L'encadrant a reporté la réunion : " + reunion.getTitre() + ". Nouveau créneau proposé.",
                    "REUNION_REPORTEE", saved);
        }

        return toResponse(saved);
    }

    // ── Accepter une réunion ──────────────────────────────────
    @Transactional
    public ReunionResponse accepterReunion(Long id, Long stagiaireId) {
        Reunion reunion = getReunion(id);

        if (reunion.getStagiaire() != null && reunion.getStagiaire().getId().equals(stagiaireId)) {
            reunion.setAcceptationStagiaire1(true);
        } else if (reunion.getStagiaire2() != null && reunion.getStagiaire2().getId().equals(stagiaireId)) {
            reunion.setAcceptationStagiaire2(true);
        }

        // Si tout le monde a accepté (y compris l'encadrant qui l'a créée)
        if (reunion.getAcceptationStagiaire1() && reunion.getAcceptationStagiaire2()
                && reunion.getAcceptationEncadrant()) {
            reunion.setStatut("PLANIFIEE");
            notificationService.envoyerNotification(reunion.getEncadrant(), "Réunion acceptée",
                    "Tous les stagiaires ont accepté la réunion : " + reunion.getTitre(), "REUNION_ACCEPTEE", reunion);
        }

        return toResponse(reunionRepository.save(reunion));
    }

    // ── Reporter une réunion (Stagiaire) ──────────────────────
    @Transactional
    public ReunionResponse reporterReunion(Long id, Long stagiaireId, Map<String, String> data) {
        Reunion reunion = getReunion(id);
        String motif = data.get("motif");
        LocalDateTime nouvelleDate = LocalDateTime.parse(data.get("nouvelleDate"));

        reunion.setStatut("REPORTEE_PAR_STAGIAIRE");
        reunion.setObservations(
                "Report demandé par le stagiaire. Motif : " + motif + ". Nouvelle date proposée : " + nouvelleDate);
        reunion.setDateHeure(nouvelleDate); // On met à jour la date proposée

        // Reset des acceptations
        reunion.setAcceptationStagiaire1(false);
        reunion.setAcceptationStagiaire2(reunion.getStagiaire2() == null);

        // Notification à l'encadrant
        notificationService.envoyerNotification(reunion.getEncadrant(), "Demande de report de réunion",
                "Un stagiaire demande le report de la réunion : " + reunion.getTitre() + ". Motif: " + motif,
                "REUNION_REPORTEE", reunion);

        Reunion saved = reunionRepository.save(reunion);
        mouvementService.enregistrer("Demande de report de réunion : " + reunion.getTitre() + " par le stagiaire", "REUNION_REPORTEE", null);
        return toResponse(saved);
    }

    // ── Décider sur le report (Encadrant) ─────────────────────
    @Transactional
    public ReunionResponse deciderReportage(Long id, Boolean accepte) {
        Reunion reunion = getReunion(id);
        if (accepte) {
            reunion.setStatut("PLANIFIEE");
            reunion.setAcceptationStagiaire1(true);
            reunion.setAcceptationStagiaire2(true);
            // Notifications aux stagiaires
            notificationService.envoyerNotification(reunion.getStagiaire(), "Report de réunion accepté",
                    "L'encadrant a accepté le report de la réunion : " + reunion.getTitre(), "REUNION_ACCEPTEE",
                    reunion);
            if (reunion.getStagiaire2() != null) {
                notificationService.envoyerNotification(reunion.getStagiaire2(), "Report de réunion accepté",
                        "L'encadrant a accepté le report de la réunion : " + reunion.getTitre(), "REUNION_ACCEPTEE",
                        reunion);
            }
        } else {
            reunion.setStatut("ANNULEE");
            reunion.setObservations(reunion.getObservations() + " | Report refusé par l'encadrant.");
            // Notifications aux stagiaires
            notificationService.envoyerNotification(reunion.getStagiaire(), "Réunion annulée",
                    "L'encadrant a refusé le report et annulé la réunion : " + reunion.getTitre(), "REUNION_REFUSEE",
                    reunion);
        }
        return toResponse(reunionRepository.save(reunion));
    }

    // ── Changer le statut ─────────────────────────────────────
    public ReunionResponse changerStatut(Long id, String statut) {
        Reunion reunion = getReunion(id);
        reunion.setStatut(statut);
        return toResponse(reunionRepository.save(reunion));
    }

    // ── Ajouter observations et recommandations ───────────────
    public ReunionResponse ajouterNotes(Long id, Map<String, String> notes) {
        Reunion reunion = getReunion(id);
        if (notes.containsKey("observations"))
            reunion.setObservations(notes.get("observations"));
        if (notes.containsKey("recommandations"))
            reunion.setRecommandations(notes.get("recommandations"));
        return toResponse(reunionRepository.save(reunion));
    }

    // ── Rédiger le PV ─────────────────────────────────────────
    public PvResponse redigerPv(PvRequest req) {
        Reunion reunion = getReunion(req.getReunionId());

        if (reunion.getPv() != null)
            throw new RuntimeException("Un PV existe déjà pour cette réunion");

        Utilisateur redacteur = utilisateurRepository.findById(req.getRedacteurId())
                .orElseThrow(() -> new RuntimeException("Rédacteur non trouvé"));

        ProcesVerbal pv = new ProcesVerbal();
        pv.setContenu(req.getContenu());
        pv.setActionsCorrectives(req.getActionsCorrectives());
        pv.setDateRedaction(LocalDateTime.now());
        pv.setReunion(reunion);
        pv.setRedacteur(redacteur);

        reunion.setPv(pv);
        reunion.setStatut("TERMINEE");
        reunionRepository.save(reunion);
        mouvementService.enregistrer("Rédaction du PV pour la réunion : " + reunion.getTitre(), "PV_REDIGE", redacteur);
        return toPvResponse(pv, reunion);
    }

    // ── Lister par encadrant ──────────────────────────────────
    public List<ReunionResponse> getByEncadrant(Long encadrantId) {
        return reunionRepository.findByEncadrantId(encadrantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Lister par stagiaire ──────────────────────────────────
    public List<ReunionResponse> getByStagiaire(Long stagiaireId) {
        return reunionRepository.findByStagiaireIdOuBinome(stagiaireId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Lister par sprint ─────────────────────────────────────
    public List<ReunionResponse> getBySprint(Long sprintId) {
        return reunionRepository.findBySprintId(sprintId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Supprimer ─────────────────────────────────────────────
    public void delete(Long id) {
        if (!reunionRepository.existsById(id))
            throw new RuntimeException("Réunion non trouvée");
        reunionRepository.deleteById(id);
    }

    private Reunion getReunion(Long id) {
        return reunionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réunion non trouvée"));
    }

    private ReunionResponse toResponse(Reunion r) {
        ReunionResponse res = new ReunionResponse();
        res.setId(r.getId());
        res.setTitre(r.getTitre());
        res.setDateHeure(r.getDateHeure());
        res.setLieu(r.getLieu());
        res.setStatut(r.getStatut());
        res.setObservations(r.getObservations());
        res.setRecommandations(r.getRecommandations());
        res.setAcceptationStagiaire1(r.getAcceptationStagiaire1());
        res.setAcceptationStagiaire2(r.getAcceptationStagiaire2());
        res.setAcceptationEncadrant(r.getAcceptationEncadrant());
        res.setDescription(r.getDescription());
        res.setHasPv(r.getPv() != null);
        if (r.getPv() != null)
            res.setPvId(r.getPv().getId());

        if (r.getSprint() != null) {
            res.setSprintId(r.getSprint().getId());
            res.setSprintNom(r.getSprint().getNom());
        }
        if (r.getEncadrant() != null) {
            res.setEncadrantId(r.getEncadrant().getId());
            res.setEncadrantNom(r.getEncadrant().getNom());
            res.setEncadrantPrenom(r.getEncadrant().getPrenom());
        }
        if (r.getStagiaire() != null) {
            res.setStagiaireId(r.getStagiaire().getId());
            res.setStagiaireNom(r.getStagiaire().getNom());
            res.setStagiairePrenom(r.getStagiaire().getPrenom());
        }
        if (r.getStagiaire2() != null) {
            res.setStagiaire2Id(r.getStagiaire2().getId());
            res.setStagiaire2Nom(r.getStagiaire2().getNom());
            res.setStagiaire2Prenom(r.getStagiaire2().getPrenom());
        }
        return res;
    }

    private PvResponse toPvResponse(ProcesVerbal pv, Reunion reunion) {
        PvResponse r = new PvResponse();
        r.setId(pv.getId());
        r.setContenu(pv.getContenu());
        r.setActionsCorrectives(pv.getActionsCorrectives());
        r.setDateRedaction(pv.getDateRedaction());
        r.setReunionId(reunion.getId());
        r.setReunionTitre(reunion.getTitre());
        if (pv.getRedacteur() != null) {
            r.setRedacteurId(pv.getRedacteur().getId());
            r.setRedacteurNom(pv.getRedacteur().getNom());
            r.setRedacteurPrenom(pv.getRedacteur().getPrenom());
        }
        return r;
    }
}