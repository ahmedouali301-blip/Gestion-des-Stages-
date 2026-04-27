import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/common/Sidebar";
import Topbar from "../../components/common/Topbar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getReunionsByStagiaire,
  planifierReunion,
  deleteReunion,
  accepterReunion,
  reporterReunion,
} from "../../api/reunionAPI";
import { getStagesByStagiaire } from "../../api/stageAPI";
import {
  Send, User, AlertCircle, Sparkles,
  LayoutDashboard, FileText, RefreshCw, CheckCircle, Calendar, Star, Plus, MapPin, XCircle, Clock, Activity, Info
} from 'lucide-react';
import { useSession } from "../../context/SessionContext";

const NAV = [
  { path: "/stagiaire/dashboard", icon: <LayoutDashboard size={18} />, label: "Mon espace" },
  { path: "/stagiaire/sujets", icon: <FileText size={18} />, label: "Sujets" },
  { path: "/stagiaire/sprints", icon: <RefreshCw size={18} />, label: "Mes sprints" },
  { path: "/stagiaire/taches", icon: <CheckCircle size={18} />, label: "Mes tâches" },
  { path: "/stagiaire/reunions", icon: <Calendar size={18} />, label: "Mes réunions" },
  { path: "/stagiaire/evaluations", icon: <Star size={18} />, label: "Mes évaluations" },
];

const STATUT_CONFIG = {
  PROPOSEE: { bg: "rgba(124,58,237,0.1)", color: "#7c3aed", label: "Proposée", icon: Send },
  REPORTEE_PAR_STAGIAIRE: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Report Demandé", icon: Clock },
  PLANIFIEE: { bg: "rgba(99,102,241,0.1)", color: "#6366f1", label: "Planifiée", icon: Calendar },
  EN_COURS: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Session Live", icon: Activity },
  TERMINEE: { bg: "rgba(16,185,129,0.1)", color: "#10b981", label: "Terminée", icon: CheckCircle },
  ANNULEE: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Annulée", icon: XCircle },
};

export default function MesReunions() {
  const { user } = useAuth();
  const { sidebarMini } = useTheme();
  const { activeSession } = useSession();

  const [reunions, setReunions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("TOUS");
  const [stageActif, setStageActif] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titre: "", dateHeure: "", lieu: "", description: "" });
  const [saving, setSaving] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ motif: "", nouvelleDate: "" });

  useEffect(() => { if (user?.id) loadAll(); }, [user, activeSession]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [reunionsRes, stagesRes] = await Promise.all([ getReunionsByStagiaire(user.id), getStagesByStagiaire(user.id) ]);
      setReunions(Array.isArray(reunionsRes.data) ? reunionsRes.data : []);
      const stages = (stagesRes.data || []).filter(s => !s.annee || String(s.annee) === String(activeSession));
      const actif = stages.find(s => s.statut === "EN_COURS" || s.statut === "EN_ATTENTE") || stages[0];
      setStageActif(actif || null);
    } catch {} finally { setLoading(false); }
  };

  const handleAccepter = async (id) => {
    setSaving(true);
    try { await accepterReunion(id, user.id); loadAll(); setSelected(null); } catch {} finally { setSaving(false); }
  };

  const handleReport = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await reporterReunion(selected.id, user.id, reportForm); setShowReportModal(false); loadAll(); setSelected(null); } catch {} finally { setSaving(false); }
  };

  const handleProposer = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await planifierReunion({ ...form, stagiaireId: user.id, encadrantId: stageActif?.encadrantId || null, stageId: stageActif?.id || null });
      setShowModal(false); setForm({ titre: "", dateHeure: "", lieu: "", description: "" }); loadAll();
    } catch {} finally { setSaving(false); }
  };

  const filtered = reunions.filter((r) => {
    if (filter !== "TOUS" && r.statut !== filter) return false;
    if (!activeSession) return true;
    const sessionStr = String(activeSession);
    if (r.annee) return String(r.annee) === sessionStr;
    if (r.stageId === stageActif?.id) return true; // Si c'est le stage actif de la session, on affiche
    return false;
  });
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      
      <main className="main-content fade-in">
        <header className="elite-agenda-header">
           <div className="title-stack">
              <h1 className="gradient-text">Agenda Management</h1>
              <p>Sincronisez vos sessions de travail technique</p>
           </div>
           {stageActif?.statut !== 'VALIDE' && (
             <button className="btn btn-primary elite-btn" onClick={() => setShowModal(true)}>
                <Plus size={18} /> <span>Proposer une Session</span>
             </button>
           )}
           {stageActif?.statut === 'VALIDE' && (
             <div className="locked-badge-st-v3"><CheckCircle size={14} /> ARCHIVES SCELLÉES</div>
           )}
        </header>

        <div className="agenda-orchestration-v3">
           <div className="orchestrator-sidebar">
              <div className="agenda-filters-elite">
                 {["TOUS", "PROPOSEE", "PLANIFIEE", "EN_COURS", "TERMINEE"].map(s => (
                   <button key={s} onClick={() => setFilter(s)} className={`agenda-pill ${filter === s ? 'active' : ''}`}>
                      {s === "TOUS" ? "Toutes" : STATUT_CONFIG[s].label}
                   </button>
                 ))}
              </div>

              <div className="meeting-pipeline">
                 {loading ? (
                   <div className="loader-inline"><RefreshCw className="spin" size={24} /></div>
                 ) : filtered.length === 0 ? (
                   <div className="empty-agenda-small"><Calendar size={32} opacity={0.1} /><p>Calendrier vide</p></div>
                 ) : (
                   filtered.map(r => {
                     const config = STATUT_CONFIG[r.statut] || STATUT_CONFIG.PLANIFIEE;
                     const isSelected = selected?.id === r.id;
                     return (
                       <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} key={r.id} className={`meeting-simple-tile ${isSelected ? 'active' : ''}`} onClick={() => setSelected(r)}>
                          <div className="tile-marker" style={{ background: config.color }} />
                          <div className="tile-main">
                             <h4>{r.titre}</h4>
                             <div className="tile-meta">
                                <Clock size={10} /> {new Date(r.dateHeure).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                             </div>
                          </div>
                          <div className="tile-status-icon" style={{ color: config.color }}><config.icon size={14} /></div>
                       </motion.div>
                     );
                   })
                 )}
              </div>
           </div>

           <div className="orchestrator-detail-pane">
              <AnimatePresence mode="wait">
                 {selected ? (
                   <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }} className="session-intelligence-card" key={selected.id}>
                      <div className="session-header-elite">
                         <div className="s-h-left">
                            <h2 className="gradient-text">{selected.titre}</h2>
                            <div className="s-h-badges">
                               <span className="s-badge" style={{ color: STATUT_CONFIG[selected.statut].color, background: STATUT_CONFIG[selected.statut].bg }}>{STATUT_CONFIG[selected.statut].label}</span>
                               {selected.hasPv && <span className="s-badge pv"><FileText size={12} /> Compte-rendu disponible</span>}
                            </div>
                         </div>
                         <button className="btn-close-detail" onClick={() => setSelected(null)}>✕</button>
                      </div>

                      <div className="session-meta-grid-elite">
                         <div className="meta-c">
                            <Calendar size={18} />
                            <div className="m-c-text">
                               <label>TEMPÉRATURE TEMPORELLE</label>
                               <span>{new Date(selected.dateHeure).toLocaleString('fr-FR')}</span>
                            </div>
                         </div>
                         <div className="meta-c">
                            <MapPin size={18} />
                            <div className="m-c-text">
                               <label>LOCALISATION</label>
                               <span>{selected.lieu || "Non spécifié"}</span>
                            </div>
                         </div>
                         {selected.sprintNom && (
                           <div className="meta-c">
                              <RefreshCw size={18} />
                              <div className="m-c-text">
                                 <label>ORCHESTRATION</label>
                                 <span>{selected.sprintNom}</span>
                              </div>
                           </div>
                         )}
                      </div>

                      <div className="session-body-content">
                         <div className="s-b-section">
                            <div className="section-label"><Info size={14} /> ORDRE DU JOUR</div>
                            <p className="s-b-desc">{selected.description || "Aucun ordre du jour n'a été pré-configuré pour cette session."}</p>
                         </div>

                         {selected.observations && (
                           <div className="s-b-section highlights">
                              <div className="section-label"><Sparkles size={14} /> SYNTHÈSE & RECOMMANDATIONS</div>
                              <div className="highlights-box">
                                 <p><strong>Observations :</strong> {selected.observations}</p>
                                 {selected.recommandations && <p className="mt-2"><strong>Recommandations :</strong> {selected.recommandations}</p>}
                              </div>
                           </div>
                         )}

                         {selected.statut === "PROPOSEE" && (
                           <div className="binome-vote-panel">
                              <div className="v-label">VOTES D'APPROBATION</div>
                              <div className="v-grid">
                                 <div className={`v-item ${selected.acceptationStagiaire1 ? 'voted' : ''}`}>
                                    <div className="v-avatar"><User size={14} /></div>
                                    <span>Stagiaire 1 : {selected.acceptationStagiaire1 ? "Approuvé" : "En attente"}</span>
                                 </div>
                                 {selected.stagiaire2Id && (
                                   <div className={`v-item ${selected.acceptationStagiaire2 ? 'voted' : ''}`}>
                                      <div className="v-avatar"><User size={14} /></div>
                                      <span>Stagiaire 2 : {selected.acceptationStagiaire2 ? "Approuvé" : "En attente"}</span>
                                   </div>
                                 )}
                              </div>
                           </div>
                         )}
                      </div>

                      <div className="session-actions-v3">
                        {stageActif?.statut === 'VALIDE' ? (
                           <div className="locked-badge-v3-st"><Sparkles size={14} /> SESSION TERMINÉE</div>
                        ) : (
                           <>
                              {(selected.statut === "PROPOSEE" || selected.statut === "PLANIFIEE") && (
                                <div className="primary-actions">
                                   {((selected.stagiaireId === user.id && !selected.acceptationStagiaire1) || 
                                    (selected.stagiaire2Id === user.id && !selected.acceptationStagiaire2)) && (
                                     <button className="btn btn-success elite-btn-full" onClick={() => handleAccepter(selected.id)} disabled={saving}>
                                        {saving ? "Synchronisation..." : "Confirmer Session"}
                                     </button>
                                   )}
                                   <button className="btn btn-outline full-width" onClick={() => { setReportForm({ motif:"", nouvelleDate: selected.dateHeure }); setShowReportModal(true); }}>
                                      Demander Report
                                   </button>
                                </div>
                              )}
                           </>
                        )}
                      </div>
                   </motion.div>
                 ) : (
                   <div className="session-placeholder-v3">
                      <div className="pulse-icon"><Calendar size={64} /></div>
                      <h3>Sélecteur de Session</h3>
                      <p>Veuillez choisir une réunion dans le pipeline pour accéder aux notes stratégiques et aux contrôles opérationnels.</p>
                   </div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        {/* PROPOSE MODAL */}
        <AnimatePresence>
          {showModal && (
            <div className="elite-modal-overlay">
               <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} className="elite-modal-card">
                  <div className="modal-header">
                     <h2>Planification Stratégique</h2>
                     <p>Stage : {stageActif?.sujet}</p>
                  </div>
                  <form onSubmit={handleProposer} className="elite-manager-form">
                     <div className="form-group-v3">
                        <label>Engagement</label>
                        <input value={form.titre} onChange={f("titre")} required placeholder="Ex: Revue technique hebdomadaire..." />
                     </div>
                     <div className="grid-2">
                        <div className="form-group-v3">
                           <label>Vecteur Temporel</label>
                           <input type="datetime-local" value={form.dateHeure} onChange={f("dateHeure")} required />
                        </div>
                        <div className="form-group-v3">
                           <label>Vecteur Spatial</label>
                           <input value={form.lieu} onChange={f("lieu")} placeholder="Salle, URL Remote..." />
                        </div>
                     </div>
                     <div className="form-group-v3">
                        <label>Objectifs Opérationnels</label>
                        <textarea value={form.description} onChange={f("description")} rows={3} placeholder="Détaillez les points à adresser..." />
                     </div>
                     <div className="modal-actions-v3">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                        <button type="submit" className="btn btn-primary elite-btn" disabled={saving}>Proposer Session</button>
                     </div>
                  </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* REPORT MODAL */}
        <AnimatePresence>
          {showReportModal && (
            <div className="elite-modal-overlay">
               <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} className="elite-modal-card mini">
                  <div className="modal-header">
                     <h2>Demander un Report</h2>
                  </div>
                  <form onSubmit={handleReport} className="elite-manager-form">
                     <div className="form-group-v3">
                        <label>Nouvelle Échéance Proposée</label>
                        <input type="datetime-local" required value={reportForm.nouvelleDate} onChange={e => setReportForm(p => ({ ...p, nouvelleDate: e.target.value }))} />
                     </div>
                     <div className="form-group-v3">
                        <label>Justification Stratégique</label>
                        <textarea required value={reportForm.motif} onChange={e => setReportForm(p => ({ ...p, motif: e.target.value }))} placeholder="Expliquez la nécessité du décalage..." />
                     </div>
                     <div className="modal-actions-v3">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowReportModal(false)}>Abandonner</button>
                        <button type="submit" className="btn btn-primary elite-btn" disabled={saving}>Envoyer Demande</button>
                     </div>
                  </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .elite-agenda-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
        .agenda-orchestration-v3 { display: grid; grid-template-columns: 350px 1fr; gap: 32px; height: calc(100vh - 250px); }
        
        .orchestrator-sidebar { background: var(--surface); border: 1.5px solid var(--border); border-radius: 24px; display: flex; flex-direction: column; overflow: hidden; }
        .agenda-filters-elite { padding: 24px; display: flex; gap: 8px; overflow-x: auto; border-bottom: 1.5px solid var(--border); }
        .agenda-pill { padding: 6px 14px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--bg); color: var(--text-3); font-weight: 800; font-size: 11px; cursor: pointer; white-space: nowrap; transition: 0.2s; }
        .agenda-pill.active { background: var(--primary); color: #fff; border-color: var(--primary); }
        
        .meeting-pipeline { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .meeting-simple-tile { padding: 16px; border-radius: 16px; border: 1.5px solid transparent; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: 0.2s; }
        .meeting-simple-tile:hover { background: var(--bg); }
        .meeting-simple-tile.active { background: var(--primary-light-alpha); border-color: var(--primary); }
        .tile-marker { width: 4px; height: 30px; border-radius: 2px; flex-shrink: 0; }
        .tile-main { flex: 1; }
        .tile-main h4 { font-size: 14px; font-weight: 800; color: var(--text); }
        .tile-meta { font-size: 11px; font-weight: 700; color: var(--text-3); display: flex; align-items: center; gap: 6px; margin-top: 2px; }
        
        .orchestrator-detail-pane { background: var(--surface); border: 1.5px solid var(--border); border-radius: 24px; overflow-y: auto; position: relative; }
        .session-intelligence-card { padding: 40px; }
        .session-header-elite { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .s-h-left h2 { font-size: 24px; font-weight: 900; }
        .s-h-badges { display: flex; gap: 12px; margin-top: 12px; }
        .s-badge { padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; }
        .s-badge.pv { background: #f0fdf4; color: #16a34a; border: 1px solid #16a34a22; display: flex; align-items: center; gap: 6px; }
        .btn-close-detail { background: none; border: none; color: var(--text-3); cursor: pointer; font-size: 20px; }
        
        .session-meta-grid-elite { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 40px; }
        .meta-c { display: flex; align-items: center; gap: 16px; padding: 20px; background: var(--bg); border-radius: 20px; }
        .m-c-text label { display: block; font-size: 10px; font-weight: 800; color: var(--text-3); letter-spacing: 1px; }
        .m-c-text span { font-size: 14px; font-weight: 800; color: var(--text-2); }
        
        .session-body-content { display: flex; flex-direction: column; gap: 32px; }
        .section-label { font-size: 11px; font-weight: 900; color: var(--primary); letter-spacing: 1.5px; display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .s-b-desc { font-size: 15px; color: var(--text-2); line-height: 1.6; font-weight: 600; }
        .highlights-box { background: rgba(16,185,129,0.05); border: 1.5px solid rgba(16,185,129,0.1); border-radius: 16px; padding: 20px; font-size: 14px; line-height: 1.6; color: #065f46; }
        
        .binome-vote-panel { padding: 24px; background: var(--bg-alpha); border-radius: 20px; border: 1.5px dashed var(--border); }
        .v-label { font-size: 11px; font-weight: 900; color: var(--text-3); margin-bottom: 16px; }
        .v-grid { display: flex; gap: 24px; }
        .v-item { display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 700; color: var(--text-3); }
        .v-item.voted { color: #10b981; }
        .v-avatar { width: 32px; height: 32px; border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--border); }
        .voted .v-avatar { background: #10b981; color: #fff; border-color: #10b981; }
        
        .session-actions-v3 { border-top: 1.5px solid var(--border); padding-top: 40px; margin-top: 40px; display: flex; flex-direction: column; gap: 16px; }
        .primary-actions { display: flex; gap: 16px; }
        .elite-btn-full { flex: 1.5; padding: 14px; font-size: 14px; }
        .btn-cancel-link { background: none; border: none; color: #ef4444; font-size: 12px; font-weight: 800; cursor: pointer; padding: 10px; width: fit-content; }

        .session-placeholder-v3 { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px; color: var(--text-3); }
        .pulse-icon { margin-bottom: 24px; transform: scale(1.2); opacity: 0.1; }
        .session-placeholder-v3 h3 { color: var(--text); font-size: 20px; font-weight: 900; margin-bottom: 12px; }
        .locked-badge-st-v3 { display: flex; align-items: center; gap: 8px; padding: 10px 24px; background: var(--bg-alpha); color: var(--text-3); border-radius: 14px; font-size: 11px; font-weight: 900; letter-spacing: 1px; border: 1.5px solid var(--border); }
        .locked-badge-v3-st { display: flex; align-items: center; gap: 8px; padding: 14px; background: var(--primary-light-alpha); color: var(--primary); border-radius: 12px; font-size: 11px; font-weight: 900; border: 1.5px solid var(--primary-light-alpha); justify-content: center; }
      ` }} />
    </div>
  );
}
