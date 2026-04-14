package com.clinisys.dto.request;

import com.clinisys.enums.TypeStage;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class SujetRequest {
    @NotBlank
    private String titre;
    private String description;
    @NotNull
    private TypeStage type;
    @Min(1)
    @Max(2)
    private Integer nbMaxStagiaires = 1;
    @NotNull
    private Long responsableId;
}