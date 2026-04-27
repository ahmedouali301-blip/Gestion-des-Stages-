package com.clinisys.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void envoyerEmailBienvenue(String to, String nom, String prenom, String email, String password) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Bienvenue chez Clinisys - Vos accès à la plateforme");

            String htmlContent = """
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(135deg, #0a5c9e 0%%, #1e3a8a 100%%); padding: 40px 20px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px;">Bienvenue chez Clinisys</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Votre parcours commence ici</p>
                    </div>
                    
                    <div style="padding: 40px 30px; background-color: #ffffff;">
                        <p style="font-size: 16px; color: #333; margin-top: 0;">Bonjour <strong>%s %s</strong>,</p>
                        <p style="font-size: 15px; color: #555; line-height: 1.6;">
                            Nous avons le plaisir de vous informer que votre compte sur la plateforme de gestion des stages <strong>Clinisys</strong> a été créé avec succès par l'administrateur.
                        </p>
                        
                        <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0;">
                            <h3 style="margin-top: 0; font-size: 14px; color: #0a5c9e; text-transform: uppercase; letter-spacing: 1px;">Vos identifiants de connexion</h3>
                            <div style="margin-bottom: 12px;">
                                <span style="color: #64748b; font-size: 13px;">Email :</span><br/>
                                <strong style="color: #1e293b; font-size: 15px;">%s</strong>
                            </div>
                            <div>
                                <span style="color: #64748b; font-size: 13px;">Mot de passe temporaire :</span><br/>
                                <strong style="color: #1e293b; font-size: 15px;">%s</strong>
                            </div>
                        </div>
                        
                        <div style="background-color: #fff9eb; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 30px;">
                            <p style="margin: 0; font-size: 13px; color: #92400e;">
                                <strong>⚠️ Important :</strong> Pour des raisons de sécurité, nous vous recommandons vivement de changer ce mot de passe dès votre première connexion via votre profil.
                            </p>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="http://localhost:3000" style="background-color: #0a5c9e; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Accéder à la plateforme</a>
                        </div>
                    </div>
                    
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                        Ceci est un message automatique, merci de ne pas y répondre.<br/>
                        &copy; 2024 Clinisys - Solution de Gestion des Stages d'Excellence.
                    </div>
                </div>
                """;

            helper.setText(String.format(htmlContent, prenom, nom, email, password), true);

            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Erreur lors de l'envoi de l'email : " + e.getMessage());
        }
    }

    public void sendEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Erreur lors de l'envoi de l'email : " + e.getMessage());
        }
    }
}
