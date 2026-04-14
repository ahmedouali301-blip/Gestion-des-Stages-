package com.clinisys.controller;
 
import com.clinisys.dto.request.EvaluationRequest;
import com.clinisys.dto.response.EvaluationResponse;
import com.clinisys.service.EvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
 
@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {
 
    private final EvaluationService evaluationService;
 
    @PostMapping
    @PreAuthorize("hasRole('ENCADRANT')")
    public ResponseEntity<EvaluationResponse> creer(@Valid @RequestBody EvaluationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(evaluationService.creer(req));
    }
 
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ENCADRANT')")
    public ResponseEntity<EvaluationResponse> modifier(
            @PathVariable Long id,
            @Valid @RequestBody EvaluationRequest req) {
        return ResponseEntity.ok(evaluationService.modifier(id, req));
    }
 
    @GetMapping("/stagiaire/{id}")
    public ResponseEntity<List<EvaluationResponse>> getByStagiaire(@PathVariable Long id) {
        return ResponseEntity.ok(evaluationService.getByStagiaire(id));
    }
 
    @GetMapping("/stagiaire/{id}/moyenne")
    public ResponseEntity<Map<String, Double>> getMoyenne(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("moyenne", evaluationService.getMoyenne(id) != null
                ? evaluationService.getMoyenne(id) : 0.0));
    }
 
    @GetMapping("/sprint/{id}")
    public ResponseEntity<EvaluationResponse> getBySprint(@PathVariable Long id) {
        return ResponseEntity.ok(evaluationService.getBySprint(id));
    }
}
 

