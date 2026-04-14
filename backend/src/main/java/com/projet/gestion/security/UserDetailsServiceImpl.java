package com.projet.gestion.security;

import com.projet.gestion.model.Utilisateur;
import com.projet.gestion.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with email: " + email));

        String role = "ROLE_" + utilisateur.getClass().getSimpleName().toUpperCase();
        
        return new User(
                utilisateur.getEmail(),
                utilisateur.getMotDePasse(),
                Collections.singletonList(new SimpleGrantedAuthority(role))
        );
    }
}