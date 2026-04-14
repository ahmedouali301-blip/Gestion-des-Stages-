package com.clinisys.config;

import com.clinisys.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(request -> {
                    var corsConfiguration = new org.springframework.web.cors.CorsConfiguration();
                    corsConfiguration.setAllowedOrigins(java.util.List.of("http://localhost:3000"));
                    corsConfiguration
                            .setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                    corsConfiguration.setAllowedHeaders(java.util.List.of("*"));
                    corsConfiguration.setAllowCredentials(true);
                    return corsConfiguration;
                }))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/reunions", "/api/reunions/**")
                        .hasAnyAuthority("ROLE_ENCADRANT", "ROLE_STAGIAIRE")
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMINISTRATEUR")
                        .requestMatchers("/api/responsable/**").hasAuthority("ROLE_RESPONSABLE_STAGE")
                        .requestMatchers("/api/stages", "/api/stages/**")
                        .hasAnyAuthority("ROLE_RESPONSABLE_STAGE", "ROLE_ADMINISTRATEUR", "ROLE_ENCADRANT", "ROLE_STAGIAIRE")
                        .requestMatchers("/api/encadrant/**").hasAuthority("ROLE_ENCADRANT")
                        .requestMatchers("/api/notifications/all").permitAll()
                        .requestMatchers("/api/notifications/**")
                        .hasAnyAuthority("ROLE_ENCADRANT", "ROLE_STAGIAIRE", "ROLE_ADMINISTRATEUR",
                                "ROLE_RESPONSABLE_STAGE")
                        .requestMatchers("/api/stagiaire/**").hasAuthority("ROLE_STAGIAIRE")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
