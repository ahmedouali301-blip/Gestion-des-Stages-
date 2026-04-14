package com.clinisys.dto.response;


import lombok.*;
 
@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String cin;
    private String role;
}
