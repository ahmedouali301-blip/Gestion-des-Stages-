package com.clinisys.controller;
 
import com.clinisys.dto.request.*;
import com.clinisys.dto.response.JwtResponse;
import com.clinisys.service.AuthService;
import com.clinisys.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
 
    private final AuthService authService;
    private final PasswordResetService passwordResetService;
 
    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
 
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok("Utilisateur créé avec succès");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        System.out.println("DEBUG: Requesting password reset for: " + request.getEmail());
        passwordResetService.createPasswordResetToken(request.getEmail());
        return ResponseEntity.ok("Email de réinitialisation envoyé avec succès");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        System.out.println("DEBUG: Resetting password with token: " + request.getToken());
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok("Mot de passe réinitialisé avec succès");
    }
}
