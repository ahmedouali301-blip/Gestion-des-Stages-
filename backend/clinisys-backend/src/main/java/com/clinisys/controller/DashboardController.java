package com.clinisys.controller;

import com.clinisys.dto.response.DashboardCompletResponse;
import com.clinisys.service.DashboardService;
import com.clinisys.service.DashboardService.DashboardStats;
import com.clinisys.service.PdfExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final PdfExportService pdfExportService;

    // GET /api/dashboard/stats
    @GetMapping("/stats")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRATEUR','ROLE_RESPONSABLE_STAGE')")
    public ResponseEntity<DashboardStats> getStatsSimples(@RequestParam(required = false) String annee) {
        return ResponseEntity.ok(dashboardService.getStatsGlobales(annee));
    }

    // GET /api/dashboard/complet
    @GetMapping("/complet")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRATEUR','ROLE_RESPONSABLE_STAGE')")
    public ResponseEntity<DashboardCompletResponse> getDashboardComplet(@RequestParam(required = false) String annee) {
        return ResponseEntity.ok(dashboardService.getDashboardComplet(annee));
    }

    // GET /api/dashboard/stats/encadrant/{id}
    @GetMapping("/stats/encadrant/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ENCADRANT','ROLE_ADMINISTRATEUR')")
    public ResponseEntity<DashboardStats> getStatsByEncadrant(@PathVariable Long id) {
        return ResponseEntity.ok(dashboardService.getStatsByEncadrant(id));
    }

    // GET /api/dashboard/export/global
    @GetMapping("/export/global")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRATEUR','ROLE_RESPONSABLE_STAGE')")
    public ResponseEntity<byte[]> exporterRapportGlobal() {
        try {
            byte[] pdf = pdfExportService.genererRapportGlobal();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"rapport_global_clinisys.pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // GET /api/dashboard/export/stagiaire/{id}
    @GetMapping("/export/stagiaire/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRATEUR','ROLE_RESPONSABLE_STAGE','ROLE_ENCADRANT')")
    public ResponseEntity<byte[]> exporterRapportStagiaire(@PathVariable Long id) {
        try {
            byte[] pdf = pdfExportService.genererRapportStagiaire(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"rapport_stagiaire_" + id + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
