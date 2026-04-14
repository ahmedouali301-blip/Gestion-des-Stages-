package com.clinisys.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangerMotDePasseRequest {
    @NotBlank private String motDePasseActuel;
    @NotBlank @Size(min=6) private String nouveauMotDePasse;
}