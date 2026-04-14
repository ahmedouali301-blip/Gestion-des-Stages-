package com.clinisys.service;

import com.clinisys.entity.Notification;
import com.clinisys.entity.Reunion;
import com.clinisys.entity.Utilisateur;
import com.clinisys.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void envoyerNotification(Utilisateur destinataire, String titre, String message, String type, Reunion reunion) {
        System.out.println("DEBUG: Envoi notification à user ID=" + (destinataire != null ? destinataire.getId() : "null") + " | Titre: " + titre);
        Notification notification = new Notification();
        notification.setDestinataire(destinataire);
        notification.setTitre(titre);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReunionId(reunion != null ? reunion.getId() : null);
        Notification saved = notificationRepository.save(notification);
        System.out.println("DEBUG: Notification enregistrée avec ID=" + saved.getId());
    }

    public List<Notification> getNotificationsByUser(Long userId) {
        return notificationRepository.findByDestinataireIdOrderByDateCreationDesc(userId);
    }

    public List<Notification> getAll() {
        return notificationRepository.findAll();
    }

    public void marquerCommeLue(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setLue(true);
            notificationRepository.save(n);
        });
    }

    public void marquerToutCommeLues(Long userId) {
        List<Notification> list = notificationRepository.findByDestinataireIdOrderByDateCreationDesc(userId);
        list.forEach(n -> n.setLue(true));
        notificationRepository.saveAll(list);
    }

    public void supprimerNotification(Long id) {
        notificationRepository.deleteById(id);
    }

    public void supprimerTout(Long userId) {
        List<Notification> list = notificationRepository.findByDestinataireIdOrderByDateCreationDesc(userId);
        notificationRepository.deleteAll(list);
    }
}
