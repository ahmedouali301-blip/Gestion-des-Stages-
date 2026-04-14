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
    private final ChoixSujetRepository choixRepo;
    private final StagiaireRepository stagiaireRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final MouvementService mouvementService;
    private final NotificationService notificationService;

    public SujetResponse creer(SujetRequest req) {
        ResponsableStage resp = (ResponsableStage) utilisateurRepo.findById(req.getResponsableId())
                .orElseThrow(() -> new RuntimeException("Responsable non trouvé"));
        Sujet s = new Sujet();
        s.setTitre(req.getTitre());
        s.setDescription(req.getDescription());
        s.setType(req.getType());
        s.setNbMaxStagiaires(req.getNbMaxStagiaires());
        s.setStatut("DISPONIBLE");
        s.setResponsable(resp);
        return toResponse(sujetRepo.save(s));
    }

    public SujetResponse modifier(Long id, SujetRequest req) {
        Sujet s = getSujet(id);
        s.setTitre(req.getTitre());
        s.setDescription(req.getDescription());
        s.setType(req.getType());
        s.setNbMaxStagiaires(req.getNbMaxStagiaires());
        return toResponse(sujetRepo.save(s));
    }

    public SujetResponse valider(Long id) {
        Sujet s = getSujet(id);
        if (!"COMPLET".equals(s.getStatut()))
            throw new RuntimeException("Seuls les sujets complets peuvent être validés");
        s.setStatut("VALIDE");
        Sujet saved = sujetRepo.save(s);
        mouvementService.enregistrer("Validation du sujet : " + s.getTitre(), "SUJET_VALIDE", null);
        return toResponse(saved);
    }

    public SujetResponse archiver(Long id) {
        Sujet s = getSujet(id);
        s.setStatut("ARCHIVE");
        Sujet saved = sujetRepo.save(s);
        mouvementService.enregistrer("Archivage du sujet : " + s.getTitre(), "SUJET_ARCHIVE", null);
        return toResponse(saved);
    }

    public void delete(Long id) {
        if (choixRepo.countBySujetId(id) > 0)
            throw new RuntimeException("Des stagiaires ont déjà choisi ce sujet");
        sujetRepo.deleteById(id);
    }

    public List<SujetResponse> getByResponsable(Long responsableId) {
        return sujetRepo.findByResponsableId(responsableId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<SujetResponse> getDisponibles() {
        return sujetRepo.findAllDisponibles().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public ChoixSujetResponse choisirSujet(Long stagiaireId, Long sujetId) {
        if (choixRepo.existsByStagiaireId(stagiaireId))
            throw new RuntimeException("Vous avez déjà choisi un sujet");
        Sujet sujet = getSujet(sujetId);
        long nbChoix = choixRepo.countBySujetId(sujetId);
        if (nbChoix >= sujet.getNbMaxStagiaires())
            throw new RuntimeException("Ce sujet a atteint le nombre maximum de stagiaires");
        Stagiaire stagiaire = stagiaireRepo.findById(stagiaireId)
                .orElseThrow(() -> new RuntimeException("Stagiaire non trouvé"));
        ChoixSujet choix = new ChoixSujet();
        choix.setStagiaire(stagiaire);
        choix.setSujet(sujet);
        ChoixSujet saved = choixRepo.save(choix);
        if (choixRepo.countBySujetId(sujetId) >= sujet.getNbMaxStagiaires()) {
            sujet.setStatut("COMPLET");
            sujetRepo.save(sujet);
        }

        // --- Log & Notifs ---
        mouvementService.enregistrer("Le stagiaire " + stagiaire.getPrenom() + " " + stagiaire.getNom() + " a choisi le sujet : " + sujet.getTitre(), "SUJET_CHOISI", stagiaire);
        
        List<Utilisateur> responsables = utilisateurRepo.findByRole(com.clinisys.enums.Role.ROLE_RESPONSABLE_STAGE);
        for(Utilisateur resp : responsables) {
            notificationService.envoyerNotification(resp, "Nouveau choix de sujet", 
                "Le stagiaire " + stagiaire.getPrenom() + " " + stagiaire.getNom() + " a choisi le sujet : " + sujet.getTitre(), "SUJET_CHOISI", null);
        }

        return toChoixResponse(saved);
    }

    @Transactional
    public void annulerChoix(Long stagiaireId) {
        ChoixSujet choix = choixRepo.findByStagiaireId(stagiaireId)
                .orElseThrow(() -> new RuntimeException("Aucun choix trouvé"));
        Sujet sujet = choix.getSujet();
        if ("VALIDE".equals(sujet.getStatut()))
            throw new RuntimeException("Impossible d'annuler : le sujet est déjà validé par le responsable");
        choixRepo.delete(choix);
        sujet.setStatut("DISPONIBLE");
        sujetRepo.save(sujet);

        // --- Log & Notifs ---
        Stagiaire stagiaire = choix.getStagiaire();
        mouvementService.enregistrer("Le stagiaire " + stagiaire.getPrenom() + " " + stagiaire.getNom() + " a annulé son choix pour le sujet : " + sujet.getTitre(), "SUJET_ANNULE", stagiaire);
        
        List<Utilisateur> responsables = utilisateurRepo.findByRole(com.clinisys.enums.Role.ROLE_RESPONSABLE_STAGE);
        for(Utilisateur resp : responsables) {
            notificationService.envoyerNotification(resp, "Annulation de choix de sujet", 
                "Le stagiaire " + stagiaire.getPrenom() + " " + stagiaire.getNom() + " a annulé son choix : " + sujet.getTitre(), "SUJET_ANNULE", null);
        }
    }

    public ChoixSujetResponse getChoixByStagiaire(Long stagiaireId) {
        return choixRepo.findByStagiaireId(stagiaireId).map(this::toChoixResponse).orElse(null);
    }

    public SujetResponse getSujetDuStagiaire(Long stagiaireId) {
        ChoixSujet choix = choixRepo.findByStagiaireId(stagiaireId)
                .orElseThrow(() -> new RuntimeException("Ce stagiaire n'a pas encore choisi de sujet"));
        return toResponse(choix.getSujet());
    }

    public List<ChoixSujetResponse> getAllChoix() {
        return choixRepo.findAll().stream()
                .map(this::toChoixResponse)
                .collect(Collectors.toList());
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
        r.setStatut(s.getStatut());
        r.setDateCreation(s.getDateCreation());
        long nb = choixRepo.countBySujetId(s.getId());
        r.setNbChoixActuels((int) nb);
        r.setEstComplet(nb >= s.getNbMaxStagiaires());
        if (s.getResponsable() != null) {
            r.setResponsableId(s.getResponsable().getId());
            r.setResponsableNom(s.getResponsable().getNom());
        }
        if (s.getChoix() != null)
            r.setStagiairesPrenomNom(
                    s.getChoix().stream().map(c -> c.getStagiaire().getPrenom() + " " + c.getStagiaire().getNom())
                            .collect(Collectors.toList()));
        return r;
    }

    private ChoixSujetResponse toChoixResponse(ChoixSujet c) {
        ChoixSujetResponse r = new ChoixSujetResponse();
        r.setId(c.getId());
        r.setDateChoix(c.getDateChoix());
        if (c.getSujet() != null) {
            r.setSujetId(c.getSujet().getId());
            r.setSujetTitre(c.getSujet().getTitre());
            r.setSujetDescription(c.getSujet().getDescription());
            r.setSujetType(c.getSujet().getType().name());
            r.setSujetStatut(c.getSujet().getStatut());
        }
        if (c.getStagiaire() != null) {
            r.setStagiaireId(c.getStagiaire().getId());
            r.setStagiaireNom(c.getStagiaire().getNom());
            r.setStagiairePrenom(c.getStagiaire().getPrenom());
        }
        return r;
    }
}