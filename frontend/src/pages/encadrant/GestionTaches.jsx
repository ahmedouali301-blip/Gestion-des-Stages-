import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/common/Sidebar";
import Topbar from "../../components/common/Topbar";
import { useTheme } from "../../context/ThemeContext";
import {
  getTachesByStage,
  creerTachePourStage,
  deleteTacheSimple,
  getTachesBySprint,
  validerTache,
  refuserTache,
  mettreAJourTache,
  deleteTache,
} from "../../api/tacheAPI";
import { getStageById } from "../../api/stageAPI";
import { getSprintsByStage } from "../../api/sprintAPI";
import ConfirmModal from "../../components/common/ConfirmModal";
import { 
  CheckSquare, Plus, Layers, Target, 
  Trash2, ChevronLeft, Search, Filter, 
  Clock, AlertCircle, CheckCircle, ArrowRight,
  TrendingUp, Activity, Briefcase, RefreshCw
} from 'lucide-react';

const NAV = [
  { path: "/encadrant/dashboard", icon: "⊞", label: "Tableau de bord" },
  { path: "/encadrant/stages", icon: "📋", label: "Mes stages" },
  { path: "/encadrant/reunions", icon: "📅", label: "Réunions" },
  { path: "/encadrant/evaluations", icon: "⭐", label: "Évaluations" },
];

const PRIORITE_CONFIG = {
  BASSE: { label: "Basse", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  MOYENNE: { label: "Moyenne", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  HAUTE: { label: "Haute", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  CRITIQUE: { label: "Critique", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

const STATUT_CONFIG = {
  EN_ATTENTE_VALIDATION: { label: "À Valider", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: Clock },
  A_FAIRE: { label: "À Faire", color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: Target },
  EN_COURS: { label: "En Cours", color: "#6366f1", bg: "rgba(99,102,241,0.1)", icon: Activity },
  TERMINE: { label: "Terminé", color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: CheckCircle },
  REFUSE: { label: "Refusé", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: AlertCircle },
};

const EMPTY = { titre: "", description: "", priorite: "MOYENNE", dateEcheance: "", estimation: "" };

export default function GestionTaches() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const { sidebarMini } = useTheme();

  const [stage, setStage] = useState(null);
  const [taches, setTaches] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [tachesSprint, setTachesSprint] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [onglet, setOnglet] = useState("toutes");
  const [sprintSelec, setSprintSelec] = useState(null);

  const [confirm, setConfirm] = useState({ isOpen: false, title: "", message: "", confirmText: "Confirmer", type: "primary", onConfirm: () => {} });

  const closeConfirm = () => setConfirm((p) => ({ ...p, isOpen: false }));

  useEffect(() => { loadAll(); }, [stageId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stageRes, tachesRes, sprintsRes] = await Promise.all([ getStageById(stageId), getTachesByStage(stageId), getSprintsByStage(stageId) ]);
      setStage(stageRes.data);
      setTaches(tachesRes.data);
      setSprints(sprintsRes.data);
    } catch { setError("Erreur synchronisation"); }
    finally { setLoading(false); }
  };

  const loadTachesSprint = async (sprint) => {
    setSprintSelec(sprint);
    try {
      const { data } = await getTachesBySprint(sprint.id);
      setTachesSprint(data);
    } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await creerTachePourStage({ ...form, estimation: form.estimation ? Number(form.estimation) : null, stageId: Number(stageId) });
      setShowModal(false); setForm(EMPTY); loadAll();
    } catch (err) { setError(err.response?.data?.message || "Erreur création."); }
    finally { setSaving(false); }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      
      <main className="main-content fade-in">
        <header className="elite-backlog-header">
           <div className="header-nav">
              <button className="back-btn-elite" onClick={() => navigate('/encadrant/stages')}><ChevronLeft size={18} /> Hubs</button>
              <div className="title-stack">
                 <h1 className="gradient-text">Project Backlog</h1>
                 <p>{stage?.sujet} — {stage?.stagiaireNom} {stage?.stagiairePrenom}</p>
              </div>
           </div>
           
           <div className="header-actions">
              <button className="btn btn-outline elite-btn-ghost" onClick={() => navigate(`/encadrant/sprints/${stageId}`)}>
                 <RefreshCw size={18} /> <span>Sprint Orbit</span>
              </button>
              <button className="btn btn-primary elite-btn" onClick={() => { setShowModal(true); setForm(EMPTY); }}>
                 <Plus size={18} /> <span>New Task</span>
              </button>
           </div>
        </header>

        {/* TOP LEVEL KPIs */}
        <div className="grid-4 mb-5">
           {[
             { label: "Total Backlog", value: taches.length, color: "#6366f1", icon: Briefcase },
             { label: "Non Assignées", value: taches.filter(t => !t.sprintId).length, color: "#f59e0b", icon: Target },
             { label: "Active Pipeline", value: taches.filter(t => t.sprintId).length, color: "#10b981", icon: Activity },
             { label: "Sprints Lab", value: sprints.length, color: "#8b5cf6", icon: Layers },
           ].map((s, i) => (
             <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.1 }} className="elite-mini-stat">
                <div className="stat-i" style={{ background: s.color }}><s.icon size={18} /></div>
                <div className="stat-v">
                   <div className="val">{s.value}</div>
                   <div className="lbl">{s.label}</div>
                </div>
             </motion.div>
           ))}
        </div>

        {/* WORKSPACE TOGGLE */}
        <div className="workspace-tabs-elite">
           <button onClick={() => setOnglet("toutes")} className={`tab-btn ${onglet === 'toutes' ? 'active' : ''}`}>
              <Briefcase size={16} /> Global Backlog
           </button>
           <button onClick={() => setOnglet("sprints")} className={`tab-btn ${onglet === 'sprints' ? 'active' : ''}`}>
              <RefreshCw size={16} /> Sprint Orchestration
           </button>
        </div>

        {loading ? (
          <div className="loader-center"><RefreshCw className="spin" size={40} /> Orchestration du backlog...</div>
        ) : onglet === "toutes" ? (
          <div className="backlog-items-grid">
            {taches.length === 0 ? (
              <div className="empty-backlog"><div className="icon-box"><Target size={48} /></div><h3>Backlog vierge</h3><p>Assignez des tâches techniques pour démarrer le projet.</p></div>
            ) : (
              taches.map((t, idx) => {
                const prio = PRIORITE_CONFIG[t.priorite] || PRIORITE_CONFIG.MOYENNE;
                return (
                  <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay: idx*0.05 }} key={t.id} className="tache-card-elite">
                     <div className="prio-strip" style={{ background: prio.color }} />
                     <div className="card-top">
                        <div className="title-group">
                           <h3>{t.titre}</h3>
                           <div className="prio-badge" style={{ color: prio.color, background: prio.bg }}>{prio.label}</div>
                        </div>
                        <button className="card-delete-btn" onClick={() => deleteTacheSimple(t.id).then(loadAll)}><Trash2 size={16} /></button>
                     </div>
                     <p className="card-desc">{t.description || "Aucune spécification technique fournie."}</p>
                     <div className="card-footer-elite">
                        <div className="footer-meta">
                           {t.estimation && <span className="meta-tag"><Clock size={12} /> {t.estimation}j</span>}
                           {t.sprintNom ? <span className="meta-tag active"><RefreshCw size={12} /> {t.sprintNom}</span> : <span className="meta-tag idle"><Target size={12} /> Backlog</span>}
                        </div>
                        {t.statut && (
                          <div className="statut-pill-elite" style={{ color: STATUT_CONFIG[t.statut]?.color, background: STATUT_CONFIG[t.statut]?.bg }}>
                             {STATUT_CONFIG[t.statut]?.label}
                          </div>
                        )}
                     </div>
                  </motion.div>
                );
              })
            )}
          </div>
        ) : (
          <div className="sprint-orchestration-layout">
             <div className="sprints-column">
                <h4 className="col-title">Filtre par Sprint</h4>
                <div className="sprint-selectors-stack">
                   {sprints.map(s => (
                     <button key={s.id} onClick={() => loadTachesSprint(s)} className={`sprint-select-btn ${sprintSelec?.id === s.id ? 'active' : ''}`}>
                        <div className="s-icon">#{s.numero}</div>
                        <div className="s-info">
                           <span className="name">{s.nom}</span>
                           <span className="meta">{s.dateFin} • {s.nbTaches} tasks</span>
                        </div>
                        <ChevronLeft size={16} className="chevron" />
                     </button>
                   ))}
                </div>
             </div>

             <div className="tasks-workflow-column">
                {!sprintSelec ? (
                  <div className="select-sprint-prompt">
                     <Activity size={48} opacity={0.1} />
                     <p>Sélectionnez un sprint à gauche pour piloter son workflow.</p>
                  </div>
                ) : (
                  <div className="workflow-board">
                     <div className="board-header">
                        <h4>Workflow : {sprintSelec.nom}</h4>
                        <div className="board-stats">{tachesSprint.length} tâches actives</div>
                     </div>
                     <div className="workflow-list">
                        {tachesSprint.map(t => {
                          const conf = STATUT_CONFIG[t.statut] || STATUT_CONFIG.A_FAIRE;
                          const SIcon = conf.icon;
                          return (
                            <div key={t.id} className="workflow-item-elite">
                               <div className="item-prio" style={{ background: PRIORITE_CONFIG[t.priorite]?.color }} />
                               <div className="item-main">
                                  <div className="item-row">
                                     <span className="item-title">{t.titre}</span>
                                     <div className="item-status" style={{ color: conf.color, background: conf.bg }}>
                                        <SIcon size={12} /> {conf.label}
                                     </div>
                                  </div>
                                  <div className="item-meta">
                                     <span>⏱ Estimation: {t.estimation}j</span>
                                  </div>
                               </div>
                               <div className="item-ops">
                                  {t.statut === 'EN_ATTENTE_VALIDATION' && (
                                    <>
                                       <button className="op-btn check" onClick={() => validerTache(t.id).then(() => loadTachesSprint(sprintSelec))}><CheckCircle size={14} /></button>
                                       <button className="op-btn refuse" onClick={() => { const r = prompt("Motif ?"); if(r) refuserTache(t.id, r).then(() => loadTachesSprint(sprintSelec)); }}><AlertCircle size={14} /></button>
                                    </>
                                  )}
                                  {t.statut === 'A_FAIRE' && <button className="op-btn go" onClick={() => mettreAJourTache(t.id, {statut:'EN_COURS'}).then(() => loadTachesSprint(sprintSelec))}><Play size={14} /></button>}
                                  <button className="op-btn del" onClick={() => deleteTache(t.id).then(() => loadTachesSprint(sprintSelec))}><Trash2 size={14} /></button>
                               </div>
                            </div>
                          );
                        })}
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        <AnimatePresence>
          {showModal && (
            <div className="elite-modal-overlay">
               <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="elite-modal-card">
                  <div className="modal-header">
                     <h2>Task Formulation</h2>
                     <button onClick={() => setShowModal(false)} className="close-btn">✕</button>
                  </div>
                  <form onSubmit={handleCreate} className="elite-manager-form">
                     <div className="form-group-v3">
                        <label>Désignation Technique</label>
                        <input value={form.titre} onChange={f("titre")} required placeholder="Ex: Intégration de l'API GraphQL..." />
                     </div>
                     <div className="form-group-v3">
                        <label>Spécifications</label>
                        <textarea value={form.description} onChange={f("description")} rows={3} placeholder="Détaillez les contraintes ou livrables..." />
                     </div>
                     <div className="grid-2">
                        <div className="form-group-v3">
                           <label>Priorité</label>
                           <select value={form.priorite} onChange={f("priorite")}>
                              {Object.keys(PRIORITE_CONFIG).map(k => <option key={k} value={k}>{PRIORITE_CONFIG[k].label}</option>)}
                           </select>
                        </div>
                        <div className="form-group-v3">
                           <label>Estimation (Jours)</label>
                           <input type="number" step="0.5" value={form.estimation} onChange={f("estimation")} placeholder="Ex: 2.5" />
                        </div>
                     </div>
                     <div className="modal-footer-v3">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                        <button type="submit" className="btn btn-primary elite-btn" disabled={saving}>Injecter au Backlog</button>
                     </div>
                  </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        <style dangerouslySetInnerHTML={{ __html: `
          .elite-backlog-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
          .back-btn-elite { display: flex; align-items: center; gap: 8px; background: none; border: none; font-weight: 800; color: var(--primary); cursor: pointer; margin-bottom: 8px; }
          .title-stack p { color: var(--text-3); font-size: 16px; margin-top: 4px; }
          .header-actions { display: flex; gap: 16px; }

          .elite-mini-stat { background: var(--surface); border: 1.5px solid var(--border); border-radius: 20px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; }
          .stat-i { width: 36px; height: 36px; border-radius: 10px; color: #fff; display: flex; align-items: center; justify-content: center; }
          .stat-v .val { font-size: 20px; font-weight: 900; line-height: 1; }
          .stat-v .lbl { font-size: 11px; font-weight: 800; color: var(--text-3); margin-top: 2px; text-transform: uppercase; }

          .workspace-tabs-elite { display: flex; gap: 12px; margin-bottom: 32px; background: var(--bg); padding: 6px; border-radius: 16px; width: fit-content; }
          .tab-btn { display: flex; align-items: center; gap: 10px; padding: 10px 24px; border-radius: 12px; border: none; background: none; font-weight: 700; color: var(--text-3); cursor: pointer; }
          .tab-btn.active { background: var(--surface); color: var(--primary); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

          .backlog-items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 24px; }
          .tache-card-elite { background: var(--surface); border: 1.5px solid var(--border); border-radius: 20px; padding: 24px; position: relative; overflow: hidden; }
          .prio-strip { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
          .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
          .title-group h3 { font-size: 16px; font-weight: 800; margin-bottom: 6px; }
          .prio-badge { display: inline-block; font-size: 10px; font-weight: 900; padding: 2px 10px; border-radius: 8px; text-transform: uppercase; }
          .card-delete-btn { background: none; border: none; color: var(--text-3); cursor: pointer; }
          .card-delete-btn:hover { color: #ef4444; }
          .card-desc { font-size: 13px; color: var(--text-3); line-height: 1.5; margin-bottom: 20px; height: 40px; overflow: hidden; text-overflow: ellipsis; }
          .card-footer-elite { display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border); pt: 16px; margin-top: 16px; }
          .footer-meta { display: flex; gap: 12px; }
          .meta-tag { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: var(--text-3); }
          .meta-tag.active { color: var(--primary); }
          .statut-pill-elite { font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 10px; }

          .sprint-orchestration-layout { display: grid; grid-template-columns: 320px 1fr; gap: 32px; }
          .col-title { font-size: 12px; font-weight: 900; color: var(--text-3); text-transform: uppercase; margin-bottom: 20px; }
          .sprint-selectors-stack { display: flex; flex-direction: column; gap: 10px; }
          .sprint-select-btn { display: flex; align-items: center; gap: 16px; padding: 14px; border-radius: 16px; border: 1.5px solid var(--border); background: var(--surface); cursor: pointer; text-align: left; transition: 0.2s; }
          .sprint-select-btn.active { border-color: var(--primary); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .sprint-select-btn .s-icon { width: 40px; height: 40px; border-radius: 12px; background: var(--bg); font-weight: 900; display: flex; align-items: center; justify-content: center; }
          .active .s-icon { background: var(--primary-light-alpha); color: var(--primary); }
          .sprint-select-btn .s-info { flex: 1; display: flex; flex-direction: column; }
          .s-info .name { font-weight: 800; font-size: 14px; }
          .s-info .meta { font-size: 11px; color: var(--text-3); font-weight: 600; }
          .sprint-select-btn .chevron { transform: rotate(180deg); opacity: 0; transition: 0.2s; }
          .active .chevron { opacity: 1; }

          .workflow-board { background: var(--surface); border: 1.5px solid var(--border); border-radius: 20px; padding: 24px; }
          .board-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1.5px solid var(--bg); }
          .board-header h4 { font-size: 18px; font-weight: 900; }
          .board-stats { font-size: 12px; color: var(--text-3); font-weight: 700; }
          .workflow-list { display: flex; flex-direction: column; gap: 12px; }
          .workflow-item-elite { display: flex; align-items: center; gap: 16px; background: var(--bg); padding: 16px; border-radius: 16px; border: 1.5px solid transparent; transition: 0.2s; }
          .workflow-item-elite:hover { border-color: var(--border); background: #fff; }
          .item-prio { width: 4px; height: 32px; border-radius: 2px; }
          .item-main { flex: 1; }
          .item-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
          .item-title { font-weight: 800; font-size: 14px; }
          .item-status { font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; }
          .item-meta { font-size: 11px; color: var(--text-3); font-weight: 700; }
          .item-ops { display: flex; gap: 8px; }
          .op-btn { width: 32px; height: 32px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
          .op-btn.check { background: rgba(16,185,129,0.1); color: #10b981; }
          .op-btn.refuse { background: rgba(239,68,68,0.1); color: #ef4444; }
          .op-btn.go { background: var(--primary-light-alpha); color: var(--primary); }
          .op-btn.del { background: var(--bg); color: var(--text-3); }
          .op-btn:hover { transform: scale(1.1); }

          .elite-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
          .elite-modal-card { background: var(--surface); width: 100%; max-width: 520px; border-radius: 28px; padding: 40px; box-shadow: 0 40px 100px rgba(0,0,0,0.2); }
          .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
          .modal-header h2 { font-size: 20px; font-weight: 900; }
          .close-btn { background: none; border: none; font-size: 20px; color: var(--text-3); cursor: pointer; }
          .elite-manager-form { display: flex; flex-direction: column; gap: 20px; }
          .form-group-v3 label { display: block; font-size: 11px; font-weight: 900; color: var(--primary); text-transform: uppercase; margin-bottom: 10px; }
          .form-group-v3 input, .form-group-v3 select, .form-group-v3 textarea { width: 100%; padding: 14px 18px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--bg); font-size: 14px; font-weight: 700; outline: none; transition: 0.2s; }
          .form-group-v3 input:focus { border-color: var(--primary); background: #fff; }
          .modal-footer-v3 { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
        ` }} />
      </main>
    </div>
  );
}

import { Play } from 'lucide-react';
