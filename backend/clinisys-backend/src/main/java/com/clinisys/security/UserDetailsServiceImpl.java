package com.clinisys.security;

import com.clinisys.entity.Utilisateur;
import com.clinisys.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
 
import java.util.Collections;
 
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
 
    private final UtilisateurRepository utilisateurRepository;
 
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé: " + email));
 
        return new org.springframework.security.core.userdetails.User(
                utilisateur.getEmail(),
                utilisateur.getMotDePasse(),
                utilisateur.getActif(),
                true, true, true,
                Collections.singletonList(new SimpleGrantedAuthority(utilisateur.getRole().name()))
        );
    }
}
