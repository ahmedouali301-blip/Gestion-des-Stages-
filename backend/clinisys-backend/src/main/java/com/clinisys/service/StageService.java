package com.clinisys.service;

import com.clinisys.dto.request.StageRequest;
import com.clinisys.dto.response.StageResponse;
import com.clinisys.entity.*;
import com.clinisys.enums.StatutStage;
import com.clinisys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StageService {

    private final StageRepository stageRepository;
    private final StagiaireRepository stagiaireRepository;
    private final EncadrantRepository encadrantRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final SprintRepository sprintRepository;
    private final SujetRepository sujetRepository;
    private final SujetSessionRepository sujetSessionRepository;
    private final ChoixSujetRepository choixSujetRepository;
    private final MouvementService mouvementService;
    private final NotificationService notificationService;
    private final DossierStageRepository dossierStageRepository;

    // ── Créer un stage ────────────────────────────────────────
    public StageResponse creer(StageRequest req) {
        Stagiaire stagiaire = stagiaireRepository.findById(req.getStagiaireId())
                .orElseThrow(() -> new RuntimeException("Stagiaire principal non trouvé"));

        boolean hasActiveOrPending = stageRepository.findByStagiaireIdOrStagiaire2Id(stagiaire.getId(), stagiaire.getId())
            .stream()
            .anyMatch(s -> s.getStatut() == StatutStage.EN_COURS || s.getStatut() == StatutStage.EN_ATTENTE);
        
        if (hasActiveOrPending) {
            throw new RuntimeException("Le stagiaire principal a déjà un stage en cours.");
        }

        Encadrant encadrant = encadrantRepository.findById(req.getEncadrantId())
                .orElseThrow(() -> new RuntimeException("Encadrant non trouvé"));

        Stage stage = new Stage();
        stage.setSujet(req.getSujet());
        stage.setDescription(req.getDescription());
        stage.setDateDebut(req.getDateDebut());
        stage.setDateFin(req.getDateFin());
        stage.setType(req.getType());
        stage.setStatut(StatutStage.EN_COURS);
        stage.setStagiaire(stagiaire);
        stage.setEncadrant(encadrant);

        if (req.getDossierId() != null) {
            dossierStageRepository.findById(req.getDossierId()).ifPresent(stage::setDossier);
        }

        if (req.getStagiaire2Id() != null) {
            Stagiaire stagiaire2 = stagiaireRepository.findById(req.getStagiaire2Id()).orElseThrow();
            stage.setStagiaire2(stagiaire2);
            stage.setEstBinome(true);
            if (req.getDossier2Id() != null) dossierStageRepository.findById(req.getDossier2Id()).ifPresent(stage::setDossier2);
        }

        if (req.getResponsableId() != null) {
            utilisateurRepository.findById(req.getResponsableId()).ifPresent(r -> stage.setResponsable((ResponsableStage) r));
        }

        // Logic : Linking to SujetSession
        if (req.getSujetRefId() == null) {
            // Un-tracked subject -> Create master and session
            Sujet master = new Sujet();
            master.setTitre(req.getSujet());
            master.setDescription(req.getDescription());
            master.setType(req.getType());
            master.setResponsable(stage.getResponsable());
            sujetRepository.save(master);

            SujetSession session = new SujetSession();
            session.setSujet(master);
            session.setAnnee(stage.getDossier() != null ? stage.getDossier().getAnneeStage() : String.valueOf(req.getDateDebut().getYear()));
            session.setNbMaxStagiaires(stage.getEstBinome() ? 2 : 1);
            session.setStatut("VALIDE");
            sujetSessionRepository.save(session);
            stage.setSujetSession(session);
        } else {
            // Existing subject occurrence
            sujetSessionRepository.findById(req.getSujetRefId()).ifPresent(ss -> {
                ss.setStatut("VALIDE");
                sujetSessionRepository.save(ss);
                stage.setSujetSession(ss);
                if (stage.getSujet() == null || stage.getSujet().isEmpty()) stage.setSujet(ss.getSujet().getTitre());
            });
        }

        Stage savedStage = stageRepository.save(stage);
        mouvementService.enregistrer("Création stage : " + stage.getSujet(), "STAGE_CREE", null);
        return toResponse(savedStage);
    }

    public List<StageResponse> getAll() {
        return stageRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<StageResponse> getByEncadrant(Long encadrantId) {
        return stageRepository.findByEncadrantId(encadrantId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<StageResponse> getByStagiaire(Long stagiaireId) {
        return stageRepository.findByStagiaireIdOrStagiaire2Id(stagiaireId, stagiaireId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public StageResponse getById(Long id) {
        return toResponse(stageRepository.findById(id).orElseThrow());
    }

    @Transactional
    public StageResponse changerStatut(Long id, StatutStage nouveauStatut) {
        Stage stage = stageRepository.findById(id).orElseThrow();

        // RÈGLE : Validation finale possible seulement si le dernier sprint est clôturé
        if (nouveauStatut == StatutStage.VALIDE) {
            List<Sprint> sprints = sprintRepository.findByStageIdOrderByNumero(id);
            if (sprints.isEmpty()) {
                throw new RuntimeException("Impossible de valider le stage : aucun sprint n'a été créé.");
            }
            
            Sprint dernierSprint = sprints.get(sprints.size() - 1);
            boolean estCloture = dernierSprint.getStatut() == com.clinisys.enums.StatutSprint.TERMINE 
                              || dernierSprint.getStatut() == com.clinisys.enums.StatutSprint.TERMINE_INCOMPLET;
            
            if (!estCloture) {
                throw new RuntimeException("Validation impossible : le dernier sprint (" + dernierSprint.getNom() + ") doit être clôturé d'abord.");
            }
        }

        stage.setStatut(nouveauStatut);
        
        if (nouveauStatut == StatutStage.VALIDE) {
            if (stage.getSujetSession() != null) {
                SujetSession ss = stage.getSujetSession();
                ss.setStatut("DISPONIBLE"); // Prêt pour une autre session
                sujetSessionRepository.save(ss);

                // ✅ Libération automatique : supprimer les choix (réservations) liés à ce sujet pour cette session
                List<ChoixSujet> choixLies = choixSujetRepository.findBySujetSessionId(ss.getId());
                if (!choixLies.isEmpty()) {
                    choixSujetRepository.deleteAll(choixLies);
                }
            }
        }
        
        return toResponse(stageRepository.save(stage));
    }

    public StageResponse affecterEncadrant(Long stageId, Long encadrantId) {
        Stage stage = stageRepository.findById(stageId).orElseThrow();
        Encadrant encadrant = encadrantRepository.findById(encadrantId).orElseThrow();
        stage.setEncadrant(encadrant);
        return toResponse(stageRepository.save(stage));
    }

    public void delete(Long id) {
        stageRepository.deleteById(id);
    }

    private StageResponse toResponse(Stage s) {
        StageResponse r = new StageResponse();
        r.setId(s.getId());
        r.setSujet(s.getSujet());
        r.setDescription(s.getDescription());
        r.setDateDebut(s.getDateDebut());
        r.setDateFin(s.getDateFin());
        r.setType(s.getType());
        r.setStatut(s.getStatut());
        r.setEstBinome(s.getEstBinome());

        if (s.getStagiaire() != null) {
            r.setStagiaireId(s.getStagiaire().getId());
            r.setStagiaireNom(s.getStagiaire().getNom());
            r.setStagiairePrenom(s.getStagiaire().getPrenom());
            r.setStagiaireEmail(s.getStagiaire().getEmail());
        }
        if (s.getStagiaire2() != null) {
            r.setStagiaire2Id(s.getStagiaire2().getId());
            r.setStagiaire2Nom(s.getStagiaire2().getNom());
            r.setStagiaire2Prenom(s.getStagiaire2().getPrenom());
        }
        if (s.getEncadrant() != null) {
            r.setEncadrantId(s.getEncadrant().getId());
            r.setEncadrantNom(s.getEncadrant().getNom());
            r.setEncadrantPrenom(s.getEncadrant().getPrenom());
        }

        List<Sprint> sprints = sprintRepository.findByStageIdOrderByNumero(s.getId());
        r.setNbSprints(sprints.size());
        r.setTauxAvancement(sprints.stream()
                .mapToDouble(sp -> sp.getTauxAvancement() != null ? sp.getTauxAvancement() : 0)
                .average().orElse(0));

        if (s.getDossier() != null) {
            r.setDossierId(s.getDossier().getId());
            r.setAnnee(s.getDossier().getAnneeStage());
        } else if (s.getSujetSession() != null) {
            r.setAnnee(s.getSujetSession().getAnnee());
        }

        if (s.getDossier2() != null) {
            r.setDossier2Id(s.getDossier2().getId());
        }
        
        if (r.getAnnee() == null && s.getDateDebut() != null) {
            r.setAnnee(String.valueOf(s.getDateDebut().getYear()));
        }

        return r;
    }
}