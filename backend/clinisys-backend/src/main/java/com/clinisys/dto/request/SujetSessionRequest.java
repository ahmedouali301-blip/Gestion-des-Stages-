package com.clinisys.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SujetSessionRequest {
    @NotNull
    private Long sujetId;
    @NotBlank
    private String annee;
    @Min(1)
    @Max(2)
    private Integer nbMaxStagiaires;
}
