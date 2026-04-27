package com.clinisys.controller;

import com.clinisys.dto.request.DossierStageRequest;
import com.clinisys.dto.response.DossierStageResponse;
import com.clinisys.service.DossierStageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import java.nio.file.*;
import java.util.List;

@RestController
@RequestMapping("/api/folders-stage")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class DossierStageController {

    private final DossierStageService service;

    @GetMapping("/responsable/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_STAGE','ADMINISTRATEUR')")
    public ResponseEntity<List<DossierStageResponse>> getByResponsable(
            @PathVariable Long id,
            @RequestParam(required = false) String annee) {
        if (annee != null && !annee.isBlank())
            return ResponseEntity.ok(service.getByResponsableEtAnnee(id, annee));
        return ResponseEntity.ok(service.getByResponsable(id));
    }

    @GetMapping("/stagiaire/{id}")
    public ResponseEntity<List<DossierStageResponse>> getByStagiaire(@PathVariable Long id) {
        return ResponseEntity.ok(service.getByStagiaire(id));
    }

    @GetMapping("/responsable/{id}/annees")
    @PreAuthorize("hasRole('RESPONSABLE_STAGE')")
    public ResponseEntity<List<String>> getAnnees(@PathVariable Long id) {
        return ResponseEntity.ok(service.getAnnees(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DossierStageResponse> creer(
            @RequestParam("stagiaireId") Long stagiaireId,
            @RequestParam("responsableId") Long responsableId,
            @RequestParam("universite") String universite,
            @RequestParam("specialite") String specialite,
            @RequestParam("niveauEtude") String niveauEtude,
            @RequestParam("anneeStage") String anneeStage,
            @RequestParam(value = "cv", required = false) MultipartFile cv,
            @RequestParam(value = "portfolio", required = false) MultipartFile portfolio) {
        
        DossierStageRequest req = new DossierStageRequest();
        req.setStagiaireId(stagiaireId);
        req.setResponsableId(responsableId);
        req.setUniversite(universite);
        req.setSpecialite(specialite);
        req.setNiveauEtude(niveauEtude);
        req.setAnneeStage(anneeStage);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(service.creer(req, cv, portfolio));
    }

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            Path file = Paths.get("uploads/dossiers").resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RESPONSABLE_STAGE')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Dossier supprimé");
    }
}
