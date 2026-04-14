package com.clinisys.service;

import com.clinisys.entity.PasswordResetToken;
import com.clinisys.entity.Utilisateur;
import com.clinisys.repository.PasswordResetTokenRepository;
import com.clinisys.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Transactional
    public void createPasswordResetToken(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec cet email"));

        // Re-use or create token
        PasswordResetToken myToken = tokenRepository.findByUser(user)
                .orElse(new PasswordResetToken());
        
        String token = UUID.randomUUID().toString();
        myToken.setToken(token);
        myToken.setUser(user);
        myToken.setExpiryDate(java.time.LocalDateTime.now().plusHours(24));
        
        tokenRepository.save(myToken);

        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        String message = "Bonjour " + user.getPrenom() + ",\n\n"
                + "Vous avez demandé à réinitialiser votre mot de passe. "
                + "Veuillez cliquer sur le lien ci-dessous pour changer votre mot de passe :\n"
                + resetUrl + "\n\n"
                + "Ce lien expirera dans 24 heures.\n"
                + "Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.\n\n"
                + "Cordialement,\n"
                + "L'équipe Clinisys";

        emailService.sendEmail(user.getEmail(), "Réinitialisation de votre mot de passe", message);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token invalide"));

        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            throw new RuntimeException("Le token a expiré");
        }

        Utilisateur user = resetToken.getUser();
        user.setMotDePasse(passwordEncoder.encode(newPassword));
        utilisateurRepository.save(user);

        tokenRepository.delete(resetToken);
    }
}
