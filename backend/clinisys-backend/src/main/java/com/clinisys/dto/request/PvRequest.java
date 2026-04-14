package com.clinisys.dto.request;
 
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
 
@Data
public class PvRequest {
    @NotBlank
    private String contenu;
    private String actionsCorrectives;
    @NotNull
    private Long reunionId;
    @NotNull
    private Long redacteurId;
}
