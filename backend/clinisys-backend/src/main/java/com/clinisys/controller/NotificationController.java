package com.clinisys.controller;

import com.clinisys.entity.Notification;
import com.clinisys.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getNotificationsByUser(userId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Notification>> getAll() {
        return ResponseEntity.ok(notificationService.getAll());
    }

    @PatchMapping("/{id}/lire")
    public ResponseEntity<Void> marquerCommeLue(@PathVariable Long id) {
        notificationService.marquerCommeLue(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/user/{userId}/lire-tout")
    public ResponseEntity<Void> marquerToutCommeLues(@PathVariable Long userId) {
        notificationService.marquerToutCommeLues(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        notificationService.supprimerNotification(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> supprimerTout(@PathVariable Long userId) {
        notificationService.supprimerTout(userId);
        return ResponseEntity.ok().build();
    }
}
