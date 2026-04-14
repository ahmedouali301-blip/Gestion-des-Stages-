package com.clinisys.service;

import com.clinisys.dto.request.StageRequest;
import com.clinisys.dto.response.StageResponse;
import com.clinisys.entity.*;
import com.clinisys.enums.StatutStage;
import com.clinisys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
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
    private final ChoixSujetRepository choixSujetRepository;
    private final MouvementService mouvementService;
    private final NotificationService notificationService;

    // ── Créer un stage ────────────────────────────────────────
    public StageResponse creer(StageRequest req) {
        Stagiaire stagiaire = stagiaireRepository.findById(req.getStagiaireId())
                .orElseThrow(() -> new RuntimeException("Stagiaire principal non trouvé"));

        // Vérifier si le stagiaire principal a déjà un stage en cours
        if (hasActiveStage(req.getStagiaireId())) {
            throw new RuntimeException("Le stagiaire principal a déjà un stage en cours");
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

        // Gestion du binôme
        if (req.getStagiaire2Id() != null) {
            if (hasActiveStage(req.getStagiaire2Id())) {
                throw new RuntimeException("Le second stagiaire a déjà un stage en cours");
            }
            Stagiaire stagiaire2 = stagiaireRepository.findById(req.getStagiaire2Id())
                    .orElseThrow(() -> new RuntimeException("Second stagiaire non trouvé"));
            stage.setStagiaire2(stagiaire2);
            stage.setEstBinome(true);
        } else {
            stage.setEstBinome(false);
        }

        if (req.getResponsableId() != null) {
            utilisateurRepository.findById(req.getResponsableId())
                    .ifPresent(r -> stage.setResponsable((ResponsableStage) r));
        }

        // Logic : Automatic subject creation or validation forcing
        if (req.getSujetRefId() == null) {
            // No subject selected -> Create one automatically
            Sujet s = new Sujet();
            s.setTitre(req.getSujet());
            s.setDescription(req.getDescription());
            s.setType(req.getType());
            s.setNbMaxStagiaires(req.getStagiaire2Id() != null ? 2 : 1);
            s.setStatut("VALIDE");
            if (stage.getResponsable() != null)
                s.setResponsable(stage.getResponsable());
            sujetRepository.save(s);

            // Link stage to created subject
            stage.setSujet_ref(s);

            // Create choices
            createAutomaticChoice(s, stagiaire);
            if (stage.getStagiaire2() != null) {
                createAutomaticChoice(s, stage.getStagiaire2());
            }
        } else {
            // Existing subject -> Force validation and link
            sujetRepository.findById(req.getSujetRefId()).ifPresent(s -> {
                s.setStatut("VALIDE");
                sujetRepository.save(s);
                stage.setSujet_ref(s);
                // Ensure stage string fields match subject if they were empty
                if (stage.getSujet() == null || stage.getSujet().isEmpty()) {
                    stage.setSujet(s.getTitre());
                }
                if (stage.getDescription() == null || stage.getDescription().isEmpty()) {
                    stage.setDescription(s.getDescription());
                }
            });
        }

        Stage savedStage = stageRepository.save(stage);
        mouvementService.enregistrer("Création d'un nouveau stage pour : " + stage.getSujet(), "STAGE_CREE", null);
        
        // --- Notification Stagiaire ---
        String msg = "Un nouveau stage a été créé pour vous sur le sujet : " + stage.getSujet();
        if (stage.getStagiaire() != null) {
            notificationService.envoyerNotification(stage.getStagiaire(), "Nouveau Stage", msg, "STAGE_CREE", null);
        }
        if (stage.getStagiaire2() != null) {
            notificationService.envoyerNotification(stage.getStagiaire2(), "Nouveau Stage", msg, "STAGE_CREE", null);
        }

        return toResponse(savedStage);
    }

    private void createAutomaticChoice(Sujet s, Stagiaire st) {
        if (!choixSujetRepository.existsBySujetIdAndStagiaireId(s.getId(), st.getId())) {
            ChoixSujet c = new ChoixSujet();
            c.setSujet(s);
            c.setStagiaire(st);
            c.setDateChoix(LocalDateTime.now());
            choixSujetRepository.save(c);
        }
    }

    private boolean hasActiveStage(Long stagiaireId) {
        return stageRepository.findByStagiaireIdOrStagiaire2Id(stagiaireId, stagiaireId)
                .stream()
                .anyMatch(s -> s.getStatut() == StatutStage.EN_COURS);
    }

    // ── Lister tous les stages ────────────────────────────────
    public List<StageResponse> getAll() {
        return stageRepository.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Stages par encadrant ──────────────────────────────────
    public List<StageResponse> getByEncadrant(Long encadrantId) {
        return stageRepository.findByEncadrantId(encadrantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Stages par stagiaire ──────────────────────────────────
    public List<StageResponse> getByStagiaire(Long stagiaireId) {
        return stageRepository.findByStagiaireIdOrStagiaire2Id(stagiaireId, stagiaireId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Trouver par ID ────────────────────────────────────────
    public StageResponse getById(Long id) {
        return toResponse(stageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stage non trouvé")));
    }

    // ── Changer le statut ─────────────────────────────────────
    public StageResponse changerStatut(Long id, StatutStage nouveauStatut) {
        Stage stage = stageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stage non trouvé"));
        stage.setStatut(nouveauStatut);
        Stage saved = stageRepository.save(stage);
        mouvementService.enregistrer("Le statut du stage '" + stage.getSujet() + "' a été changé en : " + nouveauStatut, "STAGE_STATUT_CHANGE", null);
        
        // --- Notification Stagiaire si Validé ---
        if (nouveauStatut == StatutStage.VALIDE) {
            String msg = "Félicitations ! Votre stage sur le sujet '" + stage.getSujet() + "' a été officiellement validé.";
            if (stage.getStagiaire() != null) {
                notificationService.envoyerNotification(stage.getStagiaire(), "Stage Validé", msg, "STAGE_VALIDE", null);
            }
            if (stage.getStagiaire2() != null) {
                notificationService.envoyerNotification(stage.getStagiaire2(), "Stage Validé", msg, "STAGE_VALIDE", null);
            }
        }
        
        return toResponse(saved);
    }

    // ── Affecter un encadrant ─────────────────────────────────
    public StageResponse affecterEncadrant(Long stageId, Long encadrantId) {
        Stage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new RuntimeException("Stage non trouvé"));
        Encadrant encadrant = encadrantRepository.findById(encadrantId)
                .orElseThrow(() -> new RuntimeException("Encadrant non trouvé"));
        stage.setEncadrant(encadrant);
        Stage saved = stageRepository.save(stage);
        mouvementService.enregistrer("L'encadrant " + encadrant.getPrenom() + " " + encadrant.getNom() + " a été affecté au stage : " + stage.getSujet(), "STAGE_ENCADRANT_AFFECTE", null);
        return toResponse(saved);
    }

    // ── Supprimer ─────────────────────────────────────────────
    public void delete(Long id) {
        if (!stageRepository.existsById(id))
            throw new RuntimeException("Stage non trouvé");
        stageRepository.deleteById(id);
    }

    // ── Mapper entité → DTO ───────────────────────────────────
    private StageResponse toResponse(Stage s) {
        StageResponse r = new StageResponse();
        r.setId(s.getId());
        r.setSujet(s.getSujet());
        r.setDescription(s.getDescription());
        r.setDateDebut(s.getDateDebut());
        r.setDateFin(s.getDateFin());
        r.setType(s.getType());
        r.setStatut(s.getStatut());

        if (s.getStagiaire() != null) {
            r.setStagiaireId(s.getStagiaire().getId());
            r.setStagiaireNom(s.getStagiaire().getNom());
            r.setStagiairePrenom(s.getStagiaire().getPrenom());
            r.setStagiaireEmail(s.getStagiaire().getEmail());
        }
        if (s.getEncadrant() != null) {
            r.setEncadrantId(s.getEncadrant().getId());
            r.setEncadrantNom(s.getEncadrant().getNom());
            r.setEncadrantPrenom(s.getEncadrant().getPrenom());
            r.setEncadrantEmail(s.getEncadrant().getEmail());
        }
        // Ce bloc doit être présent dans toResponse()
        if (s.getStagiaire2() != null) {
            r.setStagiaire2Id(s.getStagiaire2().getId());
            r.setStagiaire2Nom(s.getStagiaire2().getNom());
            r.setStagiaire2Prenom(s.getStagiaire2().getPrenom());
        }
        r.setEstBinome(s.getEstBinome());

        List<Sprint> sprints = sprintRepository.findByStageIdOrderByNumero(s.getId());
        r.setNbSprints(sprints.size());
        r.setTauxAvancement(sprints.stream()
                .mapToDouble(sp -> sp.getTauxAvancement() != null ? sp.getTauxAvancement() : 0)
                .average().orElse(0));

        return r;
    }
}