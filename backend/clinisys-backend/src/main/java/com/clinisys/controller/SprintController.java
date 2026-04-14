package com.clinisys.controller;
 
import com.clinisys.dto.request.SprintRequest;
import com.clinisys.dto.response.SprintResponse;
import com.clinisys.service.SprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
 
@RestController
@RequestMapping("/api/sprints")
@RequiredArgsConstructor
public class SprintController {
 
    private final SprintService sprintService;
 
    @PostMapping
    @PreAuthorize("hasRole('ENCADRANT')")
    public ResponseEntity<SprintResponse> creer(@Valid @RequestBody SprintRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sprintService.creerSprint(req));
    }
 
    @GetMapping("/stage/{stageId}")
    public ResponseEntity<List<SprintResponse>> getByStage(@PathVariable Long stageId) {
        return ResponseEntity.ok(sprintService.getSprintsByStage(stageId));
    }
 
    @GetMapping("/{id}")
    public ResponseEntity<SprintResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(sprintService.getById(id));
    }
 
    @PatchMapping("/{id}/demarrer")
    @PreAuthorize("hasRole('ENCADRANT')")
    public ResponseEntity<SprintResponse> demarrer(@PathVariable Long id) {
        return ResponseEntity.ok(sprintService.demarrerSprint(id));
    }
 
    @PatchMapping("/{id}/cloturer")
    @PreAuthorize("hasRole('ENCADRANT')")
    public ResponseEntity<SprintResponse> cloturer(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean force) {
        return ResponseEntity.ok(sprintService.cloturerSprint(id, force));
    }
 
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ENCADRANT')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        sprintService.delete(id);
        return ResponseEntity.ok("Sprint supprimé");
    }
}
 
