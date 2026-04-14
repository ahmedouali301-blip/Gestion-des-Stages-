package com.clinisys.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
 
@Data
public class LoginRequest {
    @NotBlank @Email
    private String email;
    @NotBlank @Size(min = 6)
    private String motDePasse;
}