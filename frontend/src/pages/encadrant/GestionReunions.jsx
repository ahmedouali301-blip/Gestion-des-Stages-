import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/common/Sidebar";
import Topbar from "../../components/common/Topbar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getReunionsByEncadrant,
  planifierReunion,
  changerStatutReunion,
  ajouterNotes,
  redigerPv,
  deleteReunion,
  deciderReportage,
  accepterReunionEncadrant,
  reporterReunionEncadrant,
} from "../../api/reunionAPI";
import { getStagesByEncadrant } from "../../api/stageAPI";
import {
  Trash2, Edit3, MessageSquare,
  LayoutDashboard, ClipboardList, FileText, Star, Send, AlertCircle, CheckCircle, Activity, XCircle, Clock, User, Sparkles, Info, Plus, Calendar, RefreshCw
} from 'lucide-react';
import { useSession } from "../../context/SessionContext";

const NAV = [
  { path: "/encadrant/dashboard", icon: <LayoutDashboard size={18} />, label: "Tableau de bord" },
  { path: "/encadrant/stages", icon: <ClipboardList size={18} />, label: "Mes stages" },
  { path: "/encadrant/sujets", icon: <FileText size={18} />, label: "Sujets" },
  { path: "/encadrant/reunions", icon: <Calendar size={18} />, label: "Réunions" },
  { path: "/encadrant/evaluations", icon: <Star size={18} />, label: "Évaluations" },
];

const STATUT_CONFIG = {
  PROPOSEE: { bg: "rgba(124,58,237,0.1)", color: "#7c3aed", label: "Proposée", icon: Send },
  REPORTEE_PAR_STAGIAIRE: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Report Demandé", icon: AlertCircle },
  PLANIFIEE: { bg: "rgba(99,102,241,0.1)", color: "#6366f1", label: "Confirmée", icon: CheckCircle },
  EN_COURS: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", label: "Session Live", icon: Activity },
  TERMINEE: { bg: "rgba(100,116,139,0.1)", color: "#64748b", label: "Archivée", icon: FileText },
  ANNULEE: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Annulée", icon: XCircle },
};

export default function GestionReunions() {
  const { user } = useAuth();
  const { sidebarMini } = useTheme();
  const { activeSession } = useSession();

  const [reunions, setReunions] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("TOUS");

  const [showModal, setShowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showPvModal, setShowPvModal] = useState(false);

  const [form, setForm] = useState({ titre: "", dateHeure: "", lieu: "", description: "", stageId: "" });
  const [reportForm, setReportForm] = useState({ motif: "", nouvelleDate: "" });
  const [noteForm, setNoteForm] = useState({ observations: "", recommandations: "" });
  const [pvForm, setPvForm] = useState({ contenu: "", actionsCorrectives: "" });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user?.id) loadAll(); }, [user, activeSession]);
  useEffect(() => { setSelected(null); }, [activeSession]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        getReunionsByEncadrant(user.id),
        getStagesByEncadrant(user.id),
      ]);
      setReunions(Array.isArray(r.data) ? r.data : []);
      setStages(Array.isArray(s.data) ? s.data : []);
      if (selected) {
        const updated = r.data.find(it => it.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch {} finally { setLoading(false); }
  };

  const handleProposer = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const stage = stages.find(s => String(s.id) === String(form.stageId));
      await planifierReunion({
        ...form,
        encadrantId: user.id,
        stagiaireId: stage?.stagiaireId || null,
        stageId: Number(form.stageId),
      });
      setShowModal(false); setForm({ titre: "", dateHeure: "", lieu: "", description: "", stageId: "" }); loadAll();
    } catch {} finally { setSaving(false); }
  };

  const handleReport = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await reporterReunionEncadrant(selected.id, reportForm.motif, reportForm.nouvelleDate);
      setShowReportModal(false); loadAll();
    } catch {} finally { setSaving(false); }
  };

  const handleAccepter = async (id) => {
    setSaving(true);
    try { await accepterReunionEncadrant(id); loadAll(); } catch {} finally { setSaving(false); }
  };

  const handleDeciderReport = async (id, decision) => {
    setSaving(true);
    try { await deciderReportage(id, decision); loadAll(); } catch {} finally { setSaving(false); }
  };

  const handleStatut = async (id, statut) => {
    try { await changerStatutReunion(id, statut); loadAll(); } catch {}
  };

  const handleNotesSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await ajouterNotes(selected.id, noteForm);
      setShowNoteModal(false); loadAll();
    } catch {} finally { setSaving(false); }
  };

  const handlePvSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await redigerPv({ ...pvForm, reunionId: selected.id, redacteurId: user.id });
      setShowPvModal(false); loadAll();
    } catch {} finally { setSaving(false); }
  };

  const filtered = (reunions || []).filter(r => {
    if (filter !== "TOUS" && r.statut !== filter) return false;
    if (!activeSession) return true;

    const sessionStr = String(activeSession);

    // 1. Vérification par l'année de la réunion elle-même
    if (r.annee) {
      return String(r.annee) === sessionStr;
    }

    // 2. Vérification par le stage parent
    if (r.stageId) {
      const parentStage = stages.find(s => Number(s.id) === Number(r.stageId));
      if (parentStage && parentStage.annee) {
        return String(parentStage.annee) === sessionStr;
      }
    }

    // 3. Fallback par la date de la réunion
    if (r.dateHeure) {
       const meetingYear = new Date(r.dateHeure).getFullYear();
       return String(meetingYear) === sessionStr;
    }

    return false;
  });

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      
      <main className="main-content fade-in">
        <header className="elite-agenda-header">
           <div className="title-stack">
              <h1 className="gradient-text">Agenda Management</h1>
              <p>Pilotez vos sessions d'encadrement en temps réel</p>
           </div>
           {stages.some(s => s.statut !== 'VALIDE') && (
             <button className="btn btn-primary elite-btn" onClick={() => setShowModal(true)}>
                <Plus size={18} /> <span>Planifier une Session</span>
             </button>
           )}
        </header>

        <div className="agenda-orchestration-v3">
           <div className="orchestrator-sidebar">
              <div className="agenda-filters-elite">
                 {["TOUS", "PROPOSEE", "REPORTEE_PAR_STAGIAIRE", "PLANIFIEE", "EN_COURS", "TERMINEE"].map(s => (
                   <button key={s} onClick={() => setFilter(s)} className={`agenda-pill ${filter === s ? 'active' : ''}`}>
                      {s === "TOUS" ? "Toutes" : STATUT_CONFIG[s].label}
                   </button>
                 ))}
              </div>

              <div className="meeting-pipeline">
                 {loading ? (
                   <div className="loader-inline"><RefreshCw className="spin" size={24} /></div>
                 ) : filtered.length === 0 ? (
                   <div className="empty-agenda-small"><Calendar size={32} opacity={0.1} /><p>Aucune réunion</p></div>
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
                                <User size={10} /> {r.stagiairePrenom} {r.stagiaireNom} {r.stagiaire2Id && "+ 1"}
                             </div>
                             <div className="tile-meta mt-1">
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
                               {selected.hasPv && <span className="s-badge pv"><FileText size={12} /> PV Validé</span>}
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
                            <User size={18} />
                            <div className="m-c-text">
                               <label>STAGIAIRE(S)</label>
                               <span>{selected.stagiairePrenom} {selected.stagiaireNom} {selected.stagiaire2Id && `& ${selected.stagiaire2Prenom}`}</span>
                            </div>
                         </div>
                      </div>

                      <div className="session-body-content">
                         <div className="s-b-section">
                            <div className="section-label"><Info size={14} /> ORDRE DU JOUR</div>
                            <p className="s-b-desc">{selected.description || "Aucun ordre du jour spécifié."}</p>
                         </div>

                         {(selected.observations || selected.recommandations) && (
                            <div className="s-b-section highlights">
                               <div className="section-label"><Sparkles size={14} /> SYNTHÈSE DU SUPERVISEUR</div>
                               <div className="highlights-box">
                                  <p><strong>Observations :</strong> {selected.observations || "N/A"}</p>
                                  {selected.recommandations && <p className="mt-2"><strong>Recommandations :</strong> {selected.recommandations}</p>}
                               </div>
                            </div>
                         )}

                         {selected.statut === "PROPOSEE" && (
                            <div className="binome-vote-panel">
                               <div className="v-label">VOTES D'APPROBATION STAGIAIRES</div>
                               <div className="v-grid">
                                  <div className={`v-item ${selected.acceptationStagiaire1 ? 'voted' : ''}`}>
                                     <div className="v-avatar"><User size={14} /></div>
                                     <span>{selected.stagiairePrenom} : {selected.acceptationStagiaire1 ? "Approuvé" : "En attente"}</span>
                                  </div>
                                  {selected.stagiaire2Id && (
                                    <div className={`v-item ${selected.acceptationStagiaire2 ? 'voted' : ''}`}>
                                       <div className="v-avatar"><User size={14} /></div>
                                       <span>{selected.stagiaire2Prenom} : {selected.acceptationStagiaire2 ? "Approuvé" : "En attente"}</span>
                                    </div>
                                  )}
                               </div>
                            </div>
                         )}
                      </div>

                      <div className="session-actions-v3">
                          {(() => {
                              const cStage = stages.find(s => Number(s.id) === Number(selected.stageId));
                              const isLocked = cStage?.statut === 'VALIDE';

                             if (isLocked) {
                                return <div className="locked-badge-v3"><CheckCircle size={14} /> SESSION SCELLÉE (STAGE VALIDÉ)</div>;
                             }

                             return (
                                <>
                                   {selected.statut === "REPORTEE_PAR_STAGIAIRE" && (
                                      <div className="primary-actions">
                                         <button className="btn btn-success elite-btn-full" onClick={() => handleDeciderReport(selected.id, true)}>Accepter Report</button>
                                         <button className="btn btn-outline" onClick={() => { setReportForm({ motif: selected.motifReport, nouvelleDate: selected.dateHeure }); setShowReportModal(true); }}>Reporter</button>
                                      </div>
                                   )}

                                   {selected.statut === "PROPOSEE" && !selected.acceptationEncadrant && (
                                     <button className="btn btn-success elite-btn-full" onClick={() => handleAccepter(selected.id)}>Accepter Session</button>
                                   )}

                                   {selected.statut === "PLANIFIEE" && (
                                     <button className="btn btn-primary elite-btn-full" onClick={() => handleStatut(selected.id, "EN_COURS")}>Démarrer Session Live</button>
                                   )}

                                    {selected.statut === "EN_COURS" && (
                                      <button className="btn btn-primary elite-btn-full" onClick={() => { 
                                        setNoteForm({ 
                                          observations: selected.observations || "", 
                                          recommandations: selected.recommandations || "" 
                                        }); 
                                        setShowNoteModal(true); 
                                      }}>Rédiger Notes & PV</button>
                                    )}

                                   {(selected.statut === "PROPOSEE" || selected.statut === "PLANIFIEE") && (
                                     <button className="btn btn-outline full-width mt-2" onClick={() => { setReportForm({ motif:"", nouvelleDate: selected.dateHeure }); setShowReportModal(true); }}>
                                        Reprogrammer Session
                                     </button>
                                   )}

                                </>
                             );
                          })()}
                       </div>
                   </motion.div>
                 ) : (
                   <div className="session-placeholder-v3">
                      <div className="pulse-icon"><Calendar size={64} /></div>
                      <h3>Superviseur Intelligence</h3>
                      <p>Sélectionnez une réunion pour piloter les objectifs techniques et valider les PV de session.</p>
                   </div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        {/* MODALS */}
        <AnimatePresence>
           {showModal && (
             <div className="elite-modal-overlay">
                <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} className="elite-modal-card">
                   <div className="modal-header">
                      <h2>Planification Encadrant</h2>
                   </div>
                   <form onSubmit={handleProposer} className="elite-manager-form">
                      <div className="form-group-v3">
                         <label>Sujet de la Session</label>
                         <input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} required placeholder="Ex: Revue de sprint 1..." />
                      </div>
                      <div className="form-group-v3">
                         <label>Dossier de Stage</label>
                         <select value={form.stageId} onChange={e => setForm({...form, stageId: e.target.value})} required>
                            <option value="">Sélectionner le stagiaire...</option>
                            {stages
                               .filter(s => s.statut !== 'VALIDE' && (!s.annee || s.annee === activeSession))
                               .map(s => <option key={s.id} value={s.id}>{s.sujet} ({s.stagiaireNom})</option>)}
                         </select>
                      </div>
                      <div className="grid-2">
                         <div className="form-group-v3">
                            <label>Date & Heure</label>
                            <input type="datetime-local" value={form.dateHeure} onChange={e => setForm({...form, dateHeure: e.target.value})} required />
                         </div>
                         <div className="form-group-v3">
                            <label>Lieu / URL</label>
                            <input value={form.lieu} onChange={e => setForm({...form, lieu: e.target.value})} placeholder="Teams, Bureau..." />
                         </div>
                      </div>
                      <div className="form-group-v3">
                         <label>Consignes / Ordre du Jour</label>
                         <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
                      </div>
                      <div className="modal-actions-v3">
                         <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                         <button type="submit" className="btn btn-primary elite-btn" disabled={saving}>Planifier</button>
                      </div>
                   </form>
                </motion.div>
             </div>
           )}

           {showReportModal && (
             <div className="elite-modal-overlay">
                <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} className="elite-modal-card mini">
                   <div className="modal-header"><h2>Reprogrammation</h2></div>
                   <form onSubmit={handleReport} className="elite-manager-form">
                      <div className="form-group-v3">
                         <label>Nouvel Horaire</label>
                         <input type="datetime-local" required value={reportForm.nouvelleDate} onChange={e => setReportForm({...reportForm, nouvelleDate: e.target.value})} />
                      </div>
                      <div className="form-group-v3">
                         <label>Motif du Décalage</label>
                         <textarea required value={reportForm.motif} onChange={e => setReportForm({...reportForm, motif: e.target.value})} />
                      </div>
                      <div className="modal-actions-v3">
                         <button type="button" className="btn btn-ghost" onClick={() => setShowReportModal(false)}>Annuler</button>
                         <button type="submit" className="btn btn-primary elite-btn" disabled={saving}>Confirmer</button>
                      </div>
                   </form>
                </motion.div>
             </div>
           )}

           {showNoteModal && (
             <div className="elite-modal-overlay">
                <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} className="elite-modal-card">
                   <div className="modal-header"><h2>Synthèse de Séance</h2></div>
                   <form onSubmit={handleNotesSubmit} className="elite-form-v3">
                      <div className="form-group-v3">
                         <label>Observations</label>
                         <textarea value={noteForm.observations} onChange={e => setNoteForm({...noteForm, observations: e.target.value})} rows={4} />
                      </div>
                      <div className="form-group-v3">
                         <label>Recommandations</label>
                         <textarea value={noteForm.recommandations} onChange={e => setNoteForm({...noteForm, recommandations: e.target.value})} rows={4} />
                      </div>
                      <div className="modal-actions-v3">
                         <button type="button" className="btn btn-ghost" onClick={() => { 
                           setShowNoteModal(false); 
                           setPvForm({ 
                             contenu: noteForm.observations || "", 
                             actionsCorrectives: noteForm.recommandations || "" 
                           }); 
                           setShowPvModal(true); 
                         }}>Rédiger le PV</button>
                         <button type="submit" className="btn btn-primary elite-btn" disabled={saving}>Sauvegarder</button>
                      </div>
                   </form>
                </motion.div>
             </div>
           )}

           {showPvModal && (
             <div className="elite-modal-overlay">
                <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="elite-modal-card-lg">
                   <div className="modal-header"><h2>Validation du PV Officiel</h2></div>
                   <form onSubmit={handlePvSubmit} className="elite-form-v3">
                      <div className="form-group-v3">
                         <label>Contenu Intégral</label>
                         <textarea value={pvForm.contenu} onChange={e => setPvForm({...pvForm, contenu: e.target.value})} rows={10} required />
                      </div>
                      <div className="form-group-v3">
                         <label>Actions Correctives Validées</label>
                         <textarea value={pvForm.actionsCorrectives} onChange={e => setPvForm({...pvForm, actionsCorrectives: e.target.value})} rows={3} required />
                      </div>
                      <div className="modal-actions-v3">
                         <button type="button" className="btn btn-ghost" onClick={() => setShowPvModal(false)}>Fermer</button>
                         <button type="submit" className="btn btn-primary elite-btn" disabled={saving}>Publier le PV</button>
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
        .tile-meta { font-size: 11px; font-weight: 700; color: var(--text-3); display: flex; align-items: center; gap: 6px; }
        
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
        .elite-btn-full { flex: 1.5; padding: 14px; font-size: 14px; border:none; border-radius:12px; font-weight:800; cursor:pointer; }
        .btn-success { background: #10b981; color: #fff; }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-outline { background: none; border: 1.5px solid var(--border); color: var(--text-2); font-weight:800; border-radius:12px; cursor:pointer; }
        .full-width { width: 100%; padding: 14px; }
        .btn-cancel-link { background: none; border: none; color: #ef4444; font-size: 12px; font-weight: 800; cursor: pointer; padding: 10px; width: fit-content; text-decoration: underline; }

        .session-placeholder-v3 { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px; color: var(--text-3); }
        .pulse-icon { margin-bottom: 24px; transform: scale(1.2); opacity: 0.1; }
        .session-placeholder-v3 h3 { color: var(--text); font-size: 20px; font-weight: 900; margin-bottom: 12px; }

        .elite-manager-form, .elite-form-v3 { display: flex; flex-direction: column; gap: 20px; }
        .form-group-v3 label { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-3); margin-bottom: 8px; }
        .form-group-v3 input, .form-group-v3 select, .form-group-v3 textarea {
          width: 100%; padding: 12px 16px; border-radius: 12px; border: 1.5px solid var(--border);
          background: var(--bg); font-weight: 600; font-size: 14px;
        }
        .modal-actions-v3 { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
        .btn-ghost { background: none; border: none; color: var(--text-3); font-weight: 700; cursor: pointer; }
        .locked-badge-v3 { display: flex; align-items: center; gap: 8px; padding: 14px; background: var(--bg-alpha); color: var(--text-3); border-radius: 12px; font-size: 11px; font-weight: 900; letter-spacing: 0.5px; border: 1.5px solid var(--border); justify-content: center; }
      ` }} />
    </div>
  );
}