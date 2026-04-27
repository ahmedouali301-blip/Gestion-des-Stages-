package com.clinisys.service;

import com.clinisys.dto.request.SujetRequest;
import com.clinisys.dto.response.*;
import com.clinisys.entity.*;
import com.clinisys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SujetService {

    private final SujetRepository sujetRepo;
    private final SujetSessionRepository sessionRepo;
    private final ChoixSujetRepository choixRepo;
    private final StagiaireRepository stagiaireRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final MouvementService mouvementService;
    private final NotificationService notificationService;
    private final StageRepository stageRepo;
    private final DossierStageRepository dossierRepo;

    // --- Master Sujets (Library) ---

    public SujetResponse creer(SujetRequest req) {
        Utilisateur resp = utilisateurRepo.findById(req.getResponsableId())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        Sujet s = new Sujet();
        s.setTitre(req.getTitre());
        s.setDescription(req.getDescription());
        s.setType(req.getType());
        s.setNbMaxStagiaires(req.getNbMaxStagiaires());
        s.setResponsable(resp);
        return toResponse(sujetRepo.save(s));
    }

    public SujetResponse modifier(Long id, SujetRequest req) {
        Sujet s = getSujet(id);
        if (sessionRepo.existsBySujetId(id)) {
            throw new RuntimeException("Impossible de modifier ce sujet car il est déjà publié dans une ou plusieurs sessions.");
        }
        s.setTitre(req.getTitre());
        s.setDescription(req.getDescription());
        s.setType(req.getType());
        s.setNbMaxStagiaires(req.getNbMaxStagiaires());
        return toResponse(sujetRepo.save(s));
    }

    public List<SujetResponse> getAllMasters() {
        return sujetRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public void delete(Long id) {
        // Supprimer seulement si jamais publié ou lié à des choix
        if (sessionRepo.findAll().stream().anyMatch(sess -> sess.getSujet().getId().equals(id))) {
            throw new RuntimeException("Impossible de supprimer ce sujet car il a été publié dans au moins une session.");
        }
        sujetRepo.deleteById(id);
    }

    // --- Session Sujets (Occurrences) ---

    @Transactional
    public SujetSessionResponse publier(com.clinisys.dto.request.SujetSessionRequest req) {
        Sujet master = getSujet(req.getSujetId());
        
        // Vérifier si déjà publié pour cette année
        sessionRepo.findBySujetIdAndAnnee(master.getId(), req.getAnnee()).ifPresent(s -> {
            throw new RuntimeException("Ce sujet est déjà publié pour la session " + req.getAnnee());
        });

        SujetSession session = new SujetSession();
        session.setSujet(master);
        session.setAnnee(req.getAnnee());
        session.setNbMaxStagiaires(req.getNbMaxStagiaires() != null ? req.getNbMaxStagiaires() : master.getNbMaxStagiaires());
        session.setStatut("DISPONIBLE");
        
        SujetSession saved = sessionRepo.save(session);
        mouvementService.enregistrer("Publication du sujet '" + master.getTitre() + "' pour la session " + req.getAnnee(), "SUJET_PUBLIE", null);
        return toSessionResponse(saved);
    }

    @Transactional
    public void depublier(Long sessionId) {
        SujetSession s = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Sujet session non trouvé"));
        
        if ("VALIDE".equals(s.getStatut())) {
            throw new RuntimeException("Impossible d'annuler la publication d'un sujet déjà validé.");
        }

        long nbChoix = choixRepo.countBySujetSessionId(sessionId);
        if (nbChoix > 0) {
            throw new RuntimeException("Impossible d'annuler la publication : des stagiaires ont déjà choisi ce sujet.");
        }
        
        mouvementService.enregistrer("Annulation de la publication du sujet '" + s.getSujet().getTitre() + "' pour la session " + s.getAnnee(), "SUJET_DEPUBLIE", null);
        sessionRepo.delete(s);
    }

    public List<SujetSessionResponse> getSessionsByAnnee(String annee) {
        return sessionRepo.findByAnnee(annee).stream()
                .map(this::toSessionResponse).collect(Collectors.toList());
    }

    public List<SujetSessionResponse> getDisponiblesByAnnee(String annee) {
        return sessionRepo.findByAnnee(annee).stream()
                .filter(s -> "DISPONIBLE".equals(s.getStatut()))
                .map(this::toSessionResponse).collect(Collectors.toList());
    }

    @Transactional
    public ChoixSujetResponse choisirSujet(Long stagiaireId, Long sujetSessionId) {
        // Verrous habituels...
        boolean hasActiveStage = stageRepo.findByStagiaireIdOrStagiaire2Id(stagiaireId, stagiaireId)
            .stream()
            .anyMatch(s -> s.getStatut() == com.clinisys.enums.StatutStage.EN_COURS || s.getStatut() == com.clinisys.enums.StatutStage.EN_ATTENTE);

        if (hasActiveStage) {
            throw new RuntimeException("Vous avez déjà un stage en cours ou en attente.");
        }

        List<DossierStage> dossiers = dossierRepo.findByStagiaireId(stagiaireId);
        boolean hasFreeDossier = dossiers.stream()
            .anyMatch(d -> !stageRepo.existsByDossierId(d.getId()));

        if (!hasFreeDossier) {
            throw new RuntimeException("Votre dossier précédent est déjà clôturé. Créez un nouveau dossier pour cette session.");
        }

        SujetSession occurrence = sessionRepo.findById(sujetSessionId)
                .orElseThrow(() -> new RuntimeException("Sujet session non trouvé"));

        // Vérifier s'il a déjà un choix pour CETTE session
        boolean hasPendingChoice = choixRepo.findByStagiaireId(stagiaireId).stream()
            .anyMatch(c -> c.getSujetSession().getAnnee().equals(occurrence.getAnnee()) && !"VALIDE".equals(c.getSujetSession().getStatut()));
        
        if (hasPendingChoice) {
            throw new RuntimeException("Vous avez déjà une réservation pour cette session.");
        }

        long nbChoix = choixRepo.countBySujetSessionId(sujetSessionId);
        if (nbChoix >= occurrence.getNbMaxStagiaires())
            throw new RuntimeException("Ce sujet a atteint le nombre maximum de stagiaires pour cette session");

        Stagiaire stagiaire = stagiaireRepo.findById(stagiaireId)
                .orElseThrow(() -> new RuntimeException("Stagiaire non trouvé"));

        ChoixSujet choix = new ChoixSujet();
        choix.setStagiaire(stagiaire);
        choix.setSujetSession(occurrence);
        choix.setSujet(occurrence.getSujet());
        ChoixSujet saved = choixRepo.save(choix);

        if (choixRepo.countBySujetSessionId(sujetSessionId) >= occurrence.getNbMaxStagiaires()) {
            occurrence.setStatut("COMPLET");
            sessionRepo.save(occurrence);
        }

        mouvementService.enregistrer("Le stagiaire " + stagiaire.getPrenom() + " a choisi le sujet : " + occurrence.getSujet().getTitre(), "SUJET_CHOISI", stagiaire);
        return toChoixResponse(saved);
    }

    @Transactional
    public void annulerChoix(Long stagiaireId) {
        ChoixSujet choix = choixRepo.findByStagiaireIdOrderByDateChoixDesc(stagiaireId).stream()
            .filter(c -> !"VALIDE".equals(c.getSujetSession().getStatut()))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Aucun choix annulable trouvé"));
        
        SujetSession occurrence = choix.getSujetSession();
        choixRepo.delete(choix);
        occurrence.setStatut("DISPONIBLE");
        sessionRepo.save(occurrence);
    }

    @Transactional
    public SujetSessionResponse validerOccurrence(Long sessionId) {
        SujetSession s = sessionRepo.findById(sessionId).orElseThrow();
        s.setStatut("VALIDE");
        return toSessionResponse(sessionRepo.save(s));
    }

    public List<ChoixSujetResponse> getChoixBySession(Long sessionId) {
        return choixRepo.findBySujetSessionId(sessionId).stream()
                .map(this::toChoixResponse).collect(Collectors.toList());
    }

    public ChoixSujetResponse getChoixByStagiaire(Long stagiaireId) {
        return choixRepo.findByStagiaireIdOrderByDateChoixDesc(stagiaireId).stream()
            .findFirst()
            .map(this::toChoixResponse)
            .orElse(null);
    }

    private Sujet getSujet(Long id) {
        return sujetRepo.findById(id).orElseThrow(() -> new RuntimeException("Sujet non trouvé"));
    }

    private SujetResponse toResponse(Sujet s) {
        SujetResponse r = new SujetResponse();
        r.setId(s.getId());
        r.setTitre(s.getTitre());
        r.setDescription(s.getDescription());
        r.setType(s.getType());
        r.setNbMaxStagiaires(s.getNbMaxStagiaires());
        r.setDateCreation(s.getDateCreation());
        if (s.getResponsable() != null) {
            r.setResponsableId(s.getResponsable().getId());
            r.setResponsableNom(s.getResponsable().getNom());
        }
        r.setPublished(sessionRepo.existsBySujetId(s.getId()));
        return r;
    }

    private SujetSessionResponse toSessionResponse(SujetSession s) {
        SujetSessionResponse r = new SujetSessionResponse();
        r.setId(s.getId());
        r.setSujetId(s.getSujet().getId());
        r.setTitre(s.getSujet().getTitre());
        r.setDescription(s.getSujet().getDescription());
        r.setType(s.getSujet().getType());
        r.setAnnee(s.getAnnee());
        r.setStatut(s.getStatut());
        r.setNbMaxStagiaires(s.getNbMaxStagiaires());
        r.setResponsableId(s.getSujet().getResponsable().getId());
        r.setResponsableNom(s.getSujet().getResponsable().getNom());
        r.setDatePublication(s.getDatePublication());
        
        long nb = choixRepo.countBySujetSessionId(s.getId());
        r.setNbChoixActuels((int) nb);
        r.setEstComplet(nb >= s.getNbMaxStagiaires());
        return r;
    }

    private ChoixSujetResponse toChoixResponse(ChoixSujet c) {
        ChoixSujetResponse r = new ChoixSujetResponse();
        r.setId(c.getId());
        r.setDateChoix(c.getDateChoix());
        if (c.getSujetSession() != null) {
            Sujet s = c.getSujetSession().getSujet();
            r.setSujetId(c.getSujetSession().getId()); // ID de l'occurrence pour le frontend
            r.setSujetTitre(s.getTitre());
            r.setSujetDescription(s.getDescription());
            r.setSujetType(s.getType().name());
            r.setSujetStatut(c.getSujetSession().getStatut());
            r.setSujetAnnee(c.getSujetSession().getAnnee());
        }
        if (c.getStagiaire() != null) {
            r.setStagiaireId(c.getStagiaire().getId());
            r.setStagiaireNom(c.getStagiaire().getNom());
            r.setStagiairePrenom(c.getStagiaire().getPrenom());
            r.setStagiaireEmail(c.getStagiaire().getEmail());
        }
        return r;
    }
}