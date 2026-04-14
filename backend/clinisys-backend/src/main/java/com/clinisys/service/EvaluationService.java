package com.clinisys.service;
 
import com.clinisys.dto.request.EvaluationRequest;
import com.clinisys.dto.response.EvaluationResponse;
import com.clinisys.entity.*;
import com.clinisys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
 
@Service
@RequiredArgsConstructor
public class EvaluationService {
 
    private final EvaluationRepository  evaluationRepository;
    private final StagiaireRepository   stagiaireRepository;
    private final SprintRepository      sprintRepository;
    private final UtilisateurRepository utilisateurRepository;
 
    // ── Créer une évaluation ──────────────────────────────────
    public EvaluationResponse creer(EvaluationRequest req) {
        if (evaluationRepository.findBySprintId(req.getSprintId()).isPresent())
            throw new RuntimeException("Une évaluation existe déjà pour ce sprint");
 
        Stagiaire stagiaire = stagiaireRepository.findById(req.getStagiaireId())
                .orElseThrow(() -> new RuntimeException("Stagiaire non trouvé"));
        Sprint sprint = sprintRepository.findById(req.getSprintId())
                .orElseThrow(() -> new RuntimeException("Sprint non trouvé"));
        Encadrant encadrant = (Encadrant) utilisateurRepository.findById(req.getEncadrantId())
                .orElseThrow(() -> new RuntimeException("Encadrant non trouvé"));
 
        Evaluation eval = new Evaluation();
        eval.setQualiteTechnique(req.getQualiteTechnique());
        eval.setRespectDelais(req.getRespectDelais());
        eval.setAutonomie(req.getAutonomie());
        eval.setCommunication(req.getCommunication());
        eval.setCommentaire(req.getCommentaire());
        eval.setStagiaire(stagiaire);
        eval.setSprint(sprint);
        eval.setEncadrant(encadrant);
 
        return toResponse(evaluationRepository.save(eval));
    }
 
    // ── Modifier une évaluation ───────────────────────────────
    public EvaluationResponse modifier(Long id, EvaluationRequest req) {
        Evaluation eval = evaluationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Évaluation non trouvée"));
 
        eval.setQualiteTechnique(req.getQualiteTechnique());
        eval.setRespectDelais(req.getRespectDelais());
        eval.setAutonomie(req.getAutonomie());
        eval.setCommunication(req.getCommunication());
        eval.setCommentaire(req.getCommentaire());
 
        return toResponse(evaluationRepository.save(eval));
    }
 
    // ── Lister par stagiaire ──────────────────────────────────
    public List<EvaluationResponse> getByStagiaire(Long stagiaireId) {
        return evaluationRepository.findByStagiaireId(stagiaireId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }
 
    // ── Moyenne par stagiaire ─────────────────────────────────
    public Double getMoyenne(Long stagiaireId) {
        return evaluationRepository.getMoyenneByStagiaireId(stagiaireId);
    }
 
    // ── Éval par sprint ───────────────────────────────────────
    public EvaluationResponse getBySprint(Long sprintId) {
        return evaluationRepository.findBySprintId(sprintId)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Aucune évaluation pour ce sprint"));
    }
 
    private EvaluationResponse toResponse(Evaluation e) {
        EvaluationResponse r = new EvaluationResponse();
        r.setId(e.getId());
        r.setQualiteTechnique(e.getQualiteTechnique());
        r.setRespectDelais(e.getRespectDelais());
        r.setAutonomie(e.getAutonomie());
        r.setCommunication(e.getCommunication());
        r.setNoteGlobale(e.getNoteGlobale());
        r.setCommentaire(e.getCommentaire());
        r.setDateEvaluation(e.getDateEvaluation());
 
        if (e.getStagiaire() != null) {
            r.setStagiaireId(e.getStagiaire().getId());
            r.setStagiaireNom(e.getStagiaire().getNom());
            r.setStagiairePrenom(e.getStagiaire().getPrenom());
        }
        if (e.getEncadrant() != null) {
            r.setEncadrantId(e.getEncadrant().getId());
            r.setEncadrantNom(e.getEncadrant().getNom());
        }
        if (e.getSprint() != null) {
            r.setSprintId(e.getSprint().getId());
            r.setSprintNom(e.getSprint().getNom());
        }
        return r;
    }
}