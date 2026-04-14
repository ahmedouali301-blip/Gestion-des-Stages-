package com.clinisys.dto.response;
 
import lombok.Data;
import java.time.LocalDateTime;
 
@Data
public class PvResponse {
    private Long          id;
    private String        contenu;
    private String        actionsCorrectives;
    private LocalDateTime dateRedaction;
    private Long          reunionId;
    private String        reunionTitre;
    private Long          redacteurId;
    private String        redacteurNom;
    private String        redacteurPrenom;
}
