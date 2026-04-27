package com.clinisys.service;

import com.clinisys.dto.request.*;
import com.clinisys.dto.response.JwtResponse;
import com.clinisys.entity.*;
//import com.clinisys.enums.Role;
import com.clinisys.repository.UtilisateurRepository;
import com.clinisys.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
 
@Service
@RequiredArgsConstructor
public class AuthService {
 
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final com.clinisys.repository.StagiaireIdentiteRepository identiteRepository;
    private final EmailService emailService;
 
    public JwtResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse()));
 
        String token = tokenProvider.generateToken(authentication);
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow();
 
        return new JwtResponse(token, "Bearer",
                utilisateur.getId(),
                utilisateur.getNom(),
                utilisateur.getPrenom(),
                utilisateur.getEmail(),
                utilisateur.getTelephone(),
                utilisateur.getCin(),
                utilisateur.getRole().name());
    }
 
    public void register(RegisterRequest request) {
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email déjà utilisé");
        }
        if (utilisateurRepository.existsByCin(request.getCin())) {
            throw new RuntimeException("CIN déjà utilisé par un autre utilisateur");
        }
        if (utilisateurRepository.existsByTelephone(request.getTelephone())) {
            throw new RuntimeException("Numéro de téléphone déjà utilisé");
        }

        if (request.getRole() == com.clinisys.enums.Role.ROLE_ADMINISTRATEUR && 
            utilisateurRepository.existsByRole(com.clinisys.enums.Role.ROLE_ADMINISTRATEUR)) {
            throw new RuntimeException("Un administrateur existe déjà. Il ne peut y en avoir qu'un seul.");
        }
 
        Utilisateur utilisateur = createUtilisateurByRole(request);
        // Le mot de passe par défaut est le CIN de l'utilisateur
        utilisateur.setMotDePasse(passwordEncoder.encode(request.getCin()));
        Utilisateur saved = utilisateurRepository.save(utilisateur);

        // --- ENVOI EMAIL DE BIENVENUE ---
        emailService.envoyerEmailBienvenue(
            saved.getEmail(), 
            saved.getNom(), 
            saved.getPrenom(), 
            saved.getEmail(), 
            request.getCin()
        );

        // --- NOTIFICATION AU RESPONSABLE SI C'EST UN STAGIAIRE ---
        if (request.getRole() == com.clinisys.enums.Role.ROLE_STAGIAIRE) {
            identiteRepository.findByEmail(request.getEmail()).ifPresent(identite -> {
                if (identite.getResponsable() != null) {
                    notificationService.envoyerNotification(
                        identite.getResponsable(),
                        "Compte Stagiaire Activé",
                        "L'administrateur a généré le compte pour " + identite.getPrenom() + " " + identite.getNom() + ". Il peut maintenant accéder à son espace.",
                        "STAGE_COMPTE_OK",
                        null
                    );
                }
            });
        }
    }
 
    private Utilisateur createUtilisateurByRole(RegisterRequest req) {
        return switch (req.getRole()) {
            case ROLE_ADMINISTRATEUR -> {
                Administrateur a = new Administrateur();
                setBaseFields(a, req);
                yield a;
            }
            case ROLE_RESPONSABLE_STAGE -> {
                ResponsableStage r = new ResponsableStage();
                setBaseFields(r, req);
                r.setDepartement(req.getDepartement());
                yield r;
            }
            case ROLE_ENCADRANT -> {
                Encadrant e = new Encadrant();
                setBaseFields(e, req);
                e.setSpecialite(req.getSpecialite());
                yield e;
            }
            case ROLE_STAGIAIRE -> {
                Stagiaire s = new Stagiaire();
                setBaseFields(s, req);
                s.setUniversite(req.getUniversite());
                s.setSpecialite(req.getSpecialite());
                s.setNiveauEtude(req.getNiveauEtude());
                yield s;
            }
        };
    }
 
    private void setBaseFields(Utilisateur u, RegisterRequest req) {
        u.setNom(req.getNom());
        u.setPrenom(req.getPrenom());
        u.setEmail(req.getEmail());
        u.setCin(req.getCin());
        u.setTelephone(req.getTelephone());
        u.setRole(req.getRole());
        u.setActif(true);
    }
}
