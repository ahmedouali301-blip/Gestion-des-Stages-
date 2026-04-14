package com.clinisys.service;
 
import com.clinisys.dto.response.DashboardCompletResponse;
import com.clinisys.entity.*;
import com.clinisys.repository.*;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
 
@Service
@RequiredArgsConstructor
public class PdfExportService {
 
    private final DashboardService   dashboardService;
    private final StageRepository    stageRepository;
    private final EvaluationRepository evaluationRepository;
    private final SprintRepository   sprintRepository;
 
    private static final DeviceRgb PRIMARY    = new DeviceRgb(10,  92,  158);
    private static final DeviceRgb PRIMARY_LT = new DeviceRgb(232, 242, 251);
    private static final DeviceRgb SUCCESS    = new DeviceRgb(22,  163, 74);
    private static final DeviceRgb LIGHT_GRAY = new DeviceRgb(244, 246, 251);
    private static final DeviceRgb DARK       = new DeviceRgb(26,  32,  53);
 
    // ── Rapport global ────────────────────────────────────────
    public byte[] genererRapportGlobal() throws Exception {
        DashboardCompletResponse stats = dashboardService.getDashboardComplet();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf  = new PdfDocument(writer);
        Document doc     = new Document(pdf, PageSize.A4);
        doc.setMargins(40, 40, 40, 40);
 
        // En-tête
        ajouterEnTete(doc, "Rapport Global — Clinisys",
                "Généré le " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
 
        // Section 1 — KPIs
        ajouterSectionTitre(doc, "1. Indicateurs Clés");
 
        Table kpiTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1}))
                .useAllAvailableWidth();
 
        ajouterKPI(kpiTable, "Stagiaires",     String.valueOf(stats.getNbStagiaires()));
        ajouterKPI(kpiTable, "Encadrants",     String.valueOf(stats.getNbEncadrants()));
        ajouterKPI(kpiTable, "Stages en cours",String.valueOf(stats.getNbStagesEnCours()));
        ajouterKPI(kpiTable, "Stages validés", String.valueOf(stats.getNbStagesValides()));
        ajouterKPI(kpiTable, "Réunions tenues",String.valueOf(stats.getNbReunionsTerminees()));
        ajouterKPI(kpiTable, "Moy. évals",
                stats.getMoyenneEvaluations() != null
                        ? String.format("%.1f/20", stats.getMoyenneEvaluations()) : "—");
        ajouterKPI(kpiTable, "Taux avancement",
                String.format("%.0f%%", stats.getTauxAvancementGlobal()));
        ajouterKPI(kpiTable, "Taux réussite",
                String.format("%.0f%%", stats.getTauxReussitePromotion()));
 
        doc.add(kpiTable);
        doc.add(new Paragraph("\n"));
 
        // Section 2 — Répartition stages
        ajouterSectionTitre(doc, "2. Répartition des Stages");
        if (stats.getRepartitionStatutStages() != null) {
            Table t = new Table(UnitValue.createPercentArray(new float[]{2, 1})).useAllAvailableWidth();
            ajouterEnteteTableau(t, new String[]{"Statut", "Nombre"});
            stats.getRepartitionStatutStages().forEach((k, v) ->
                    ajouterLigneTableau(t, new String[]{formatStatut(k), String.valueOf(v)}, false));
            doc.add(t);
            doc.add(new Paragraph("\n"));
        }
 
        // Section 3 — Charge encadrants
        ajouterSectionTitre(doc, "3. Charge par Encadrant");
        if (stats.getChargeEncadrants() != null && !stats.getChargeEncadrants().isEmpty()) {
            Table t = new Table(UnitValue.createPercentArray(new float[]{3, 1, 1})).useAllAvailableWidth();
            ajouterEnteteTableau(t, new String[]{"Encadrant", "Nb stagiaires", "Moyenne évals"});
            for (int i = 0; i < stats.getChargeEncadrants().size(); i++) {
                var c = stats.getChargeEncadrants().get(i);
                ajouterLigneTableau(t, new String[]{
                        c.getEncadrantPrenom() + " " + c.getEncadrantNom(),
                        String.valueOf(c.getNbStagiaires()),
                        c.getMoyenneEvals() != null ? String.format("%.1f/20", c.getMoyenneEvals()) : "—"
                }, i % 2 == 1);
            }
            doc.add(t);
            doc.add(new Paragraph("\n"));
        }
 
        // Section 4 — Top Stagiaires
        if (stats.getTopStagiaires() != null && !stats.getTopStagiaires().isEmpty()) {
            ajouterSectionTitre(doc, "4. Top Stagiaires");
            Table t = new Table(UnitValue.createPercentArray(new float[]{3, 1, 1})).useAllAvailableWidth();
            ajouterEnteteTableau(t, new String[]{"Stagiaire", "Moyenne", "Avancement"});
            for (int i = 0; i < stats.getTopStagiaires().size(); i++) {
                var s = stats.getTopStagiaires().get(i);
                ajouterLigneTableau(t, new String[]{
                        s.getStagiairePrenom() + " " + s.getStagiaireNom(),
                        s.getMoyenne() != null ? String.format("%.1f/20", s.getMoyenne()) : "—",
                        String.format("%.0f%%", s.getTauxAvancement())
                }, i % 2 == 1);
            }
            doc.add(t);
        }
 
        // Pied de page
        ajouterPiedDePage(doc);
 
        doc.close();
        return baos.toByteArray();
    }
 
    // ── Rapport par stagiaire ─────────────────────────────────
    public byte[] genererRapportStagiaire(Long stagiaireId) throws Exception {
        List<Stage> stages = stageRepository.findByStagiaireId(stagiaireId);
        if (stages.isEmpty()) throw new RuntimeException("Aucun stage trouvé");
 
        Stage stage = stages.get(0);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf  = new PdfDocument(writer);
        Document doc     = new Document(pdf, PageSize.A4);
        doc.setMargins(40, 40, 40, 40);
 
        // En-tête
        ajouterEnTete(doc,
                "Rapport de Stage — " + stage.getStagiaire().getPrenom() + " " + stage.getStagiaire().getNom(),
                stage.getSujet());
 
        // Infos stage
        ajouterSectionTitre(doc, "Informations du Stage");
        Table info = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth();
        String[][] infos = {
                {"Sujet",     stage.getSujet()},
                {"Type",      stage.getType().name()},
                {"Statut",    formatStatut(stage.getStatut().name())},
                {"Début",     stage.getDateDebut() != null ? stage.getDateDebut().toString() : "—"},
                {"Fin",       stage.getDateFin()   != null ? stage.getDateFin().toString()   : "—"},
                {"Encadrant", stage.getEncadrant() != null
                        ? stage.getEncadrant().getPrenom() + " " + stage.getEncadrant().getNom() : "—"},
                {"Université",stage.getStagiaire().getUniversite() != null ? stage.getStagiaire().getUniversite() : "—"},
                {"Niveau",    stage.getStagiaire().getNiveauEtude() != null ? stage.getStagiaire().getNiveauEtude() : "—"},
        };
        for (int i = 0; i < infos.length; i++) {
            Cell label = new Cell().add(new Paragraph(infos[i][0])
                    .setFontSize(10).setBold().setFontColor(new DeviceRgb(90, 100, 128)));
            Cell value = new Cell().add(new Paragraph(infos[i][1]).setFontSize(10));
            if (i % 2 == 0) { label.setBackgroundColor(LIGHT_GRAY); value.setBackgroundColor(LIGHT_GRAY); }
            info.addCell(label); info.addCell(value);
        }
        doc.add(info);
        doc.add(new Paragraph("\n"));
 
        // Sprints
        List<Sprint> sprints = sprintRepository.findByStageIdOrderByNumero(stage.getId());
        if (!sprints.isEmpty()) {
            ajouterSectionTitre(doc, "Sprints");
            Table t = new Table(UnitValue.createPercentArray(new float[]{3, 2, 2, 1})).useAllAvailableWidth();
            ajouterEnteteTableau(t, new String[]{"Sprint", "Période", "Statut", "Avancement"});
            for (int i = 0; i < sprints.size(); i++) {
                Sprint s = sprints.get(i);
                ajouterLigneTableau(t, new String[]{
                        s.getNom(),
                        s.getDateDebut() + " → " + s.getDateFin(),
                        formatStatut(s.getStatut().name()),
                        String.format("%.0f%%", s.getTauxAvancement() != null ? s.getTauxAvancement() : 0)
                }, i % 2 == 1);
            }
            doc.add(t);
            doc.add(new Paragraph("\n"));
        }
 
        // Évaluations
        var evals = evaluationRepository.findByStagiaireId(stagiaireId);
        if (!evals.isEmpty()) {
            ajouterSectionTitre(doc, "Évaluations");
            Table t = new Table(UnitValue.createPercentArray(new float[]{2, 1, 1, 1, 1, 1})).useAllAvailableWidth();
            ajouterEnteteTableau(t, new String[]{"Sprint", "Technique", "Délais", "Autonomie", "Communication", "Globale"});
            Double total = 0.0;
            for (int i = 0; i < evals.size(); i++) {
                var e = evals.get(i);
                total += e.getNoteGlobale() != null ? e.getNoteGlobale() : 0;
                ajouterLigneTableau(t, new String[]{
                        e.getSprint() != null ? e.getSprint().getNom() : "—",
                        String.format("%.1f", e.getQualiteTechnique()),
                        String.format("%.1f", e.getRespectDelais()),
                        String.format("%.1f", e.getAutonomie()),
                        String.format("%.1f", e.getCommunication()),
                        String.format("%.1f", e.getNoteGlobale() != null ? e.getNoteGlobale() : 0)
                }, i % 2 == 1);
            }
 
            // Ligne total
            Cell avgLabel = new Cell(1, 5).add(new Paragraph("Moyenne finale")
                    .setBold().setFontSize(10));
            avgLabel.setBackgroundColor(PRIMARY_LT);
            Cell avgVal = new Cell().add(new Paragraph(String.format("%.2f/20", total / evals.size()))
                    .setBold().setFontSize(11).setFontColor(PRIMARY));
            avgVal.setBackgroundColor(PRIMARY_LT);
            t.addCell(avgLabel); t.addCell(avgVal);
            doc.add(t);
        }
 
        ajouterPiedDePage(doc);
        doc.close();
        return baos.toByteArray();
    }
 
    // ── Helpers PDF ───────────────────────────────────────────
    private void ajouterEnTete(Document doc, String titre, String sousTitre) {
        Table header = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        Cell cell = new Cell()
                .add(new Paragraph("CLINISYS").setFontSize(10).setFontColor(ColorConstants.WHITE).setBold())
                .add(new Paragraph(titre).setFontSize(18).setFontColor(ColorConstants.WHITE).setBold())
                .add(new Paragraph(sousTitre).setFontSize(11).setFontColor(new DeviceRgb(180, 210, 240)))
                .setBackgroundColor(PRIMARY)
                .setPadding(20);
        header.addCell(cell);
        doc.add(header);
        doc.add(new Paragraph("\n"));
    }
 
    private void ajouterSectionTitre(Document doc, String titre) {
        doc.add(new Paragraph(titre)
                .setFontSize(13).setBold().setFontColor(PRIMARY)
                .setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(PRIMARY, 1))
                .setMarginBottom(8));
    }
 
    private void ajouterKPI(Table table, String label, String value) {
        Cell cell = new Cell()
                .add(new Paragraph(label).setFontSize(9).setFontColor(new DeviceRgb(90, 100, 128)))
                .add(new Paragraph(value).setFontSize(18).setBold().setFontColor(DARK))
                .setBackgroundColor(PRIMARY_LT)
                .setPadding(12).setTextAlignment(TextAlignment.CENTER)
                .setBorder(new com.itextpdf.layout.borders.SolidBorder(new DeviceRgb(220, 230, 240), 1))
                .setMargin(4);
        table.addCell(cell);
    }
 
    private void ajouterEnteteTableau(Table table, String[] colonnes) {
        for (String col : colonnes) {
            table.addHeaderCell(new Cell()
                    .add(new Paragraph(col).setFontSize(10).setBold().setFontColor(ColorConstants.WHITE))
                    .setBackgroundColor(PRIMARY).setPadding(8));
        }
    }
 
    private void ajouterLigneTableau(Table table, String[] valeurs, boolean altRow) {
        for (String v : valeurs) {
            Cell cell = new Cell()
                    .add(new Paragraph(v != null ? v : "—").setFontSize(10))
                    .setPadding(7);
            if (altRow) cell.setBackgroundColor(LIGHT_GRAY);
            table.addCell(cell);
        }
    }
 
    private void ajouterPiedDePage(Document doc) {
        doc.add(new Paragraph("\n"));
        doc.add(new Paragraph("Clinisys — Rapport généré automatiquement le "
                + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .setFontSize(8).setFontColor(new DeviceRgb(150, 160, 180))
                .setTextAlignment(TextAlignment.CENTER));
    }
 
    private String formatStatut(String statut) {
        return switch (statut) {
            case "EN_COURS"          -> "En cours";
            case "VALIDE"            -> "Validé";
            case "INTERROMPU"        -> "Interrompu";
            case "EN_ATTENTE"        -> "En attente";
            case "PLANIFIE"          -> "Planifié";
            case "TERMINE"           -> "Terminé";
            case "TERMINE_INCOMPLET" -> "Terminé (incomplet)";
            default -> statut;
        };
    }
}
