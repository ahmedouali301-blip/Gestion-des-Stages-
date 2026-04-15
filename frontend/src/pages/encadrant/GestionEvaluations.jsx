import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/common/Sidebar";
import Topbar from "../../components/common/Topbar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  creerEvaluation,
  modifierEvaluation,
  getEvalBySprint,
} from "../../api/evaluationAPI";
import { getStagesByEncadrant } from "../../api/stageAPI";
import { getSprintsByStage } from "../../api/sprintAPI";
import { 
  Star, Target, Award, Laptop, 
  Clock, Brain, MessageSquare, Save,
  CheckCircle, AlertCircle, RefreshCw, ChevronLeft
} from 'lucide-react';

const NAV = [
  { path: "/encadrant/dashboard", icon: "⊞", label: "Tableau de bord" },
  { path: "/encadrant/stages", icon: "📋", label: "Mes stages" },
  { path: "/encadrant/reunions", icon: "📅", label: "Réunions" },
  { path: "/encadrant/evaluations", icon: "⭐", label: "Évaluations" },
];

const CRITERES = [
  { key: "qualiteTechnique", label: "Qualité Technique", icon: Laptop, desc: "Rigueur du code et maîtrise des outils." },
  { key: "respectDelais", label: "Respect des Délais", icon: Clock, desc: "Capacité à livrer les tâches à temps." },
  { key: "autonomie", label: "Autonomie", icon: Brain, desc: "Capacité d'apprentissage et prise d'initiative." },
  { key: "communication", label: "Communication", icon: MessageSquare, desc: "Aisances dans les échanges et reportings." },
];

const EMPTY_EVAL = { qualiteTechnique: 10, respectDelais: 10, autonomie: 10, communication: 10, commentaire: "" };

function EliteSlider({ label, icon: Icon, value, onChange, desc }) {
  const getColor = (v) => v >= 16 ? "#10b981" : v >= 12 ? "#6366f1" : v >= 8 ? "#f59e0b" : "#ef4444";
  
  return (
    <div className="elite-slider-group">
      <div className="slider-header-box">
        <div className="label-col">
           <div className="label-row">
              <Icon size={16} style={{ color: getColor(value) }} />
              <span className="slider-label">{label}</span>
           </div>
           <p className="slider-desc">{desc}</p>
        </div>
        <div className="score-badge" style={{ color: getColor(value), border: `2px solid ${getColor(value)}` }}>
           {value}<span>/20</span>
        </div>
      </div>
      <div className="slider-track-container">
         <input 
           type="range" min="0" max="20" step="0.5" 
           value={value} onChange={onChange} 
           className="elite-input-range"
           style={{ '--accent': getColor(value) }}
         />
      </div>
    </div>
  );
}

const GestionEvaluations = () => {
  const { user } = useAuth();
  const { sidebarMini } = useTheme();

  const [stages, setStages] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [existingEval, setExistingEval] = useState(null);
  const [form, setForm] = useState(EMPTY_EVAL);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user?.id) {
      getStagesByEncadrant(user.id).then((r) => setStages(r.data)).catch(() => {});
    }
  }, [user]);

  const handleStageChange = async (stageId) => {
    setSelectedStage(stageId);
    setSelectedSprint(null);
    setSprints([]);
    setExistingEval(null);
    if (!stageId) return;
    try {
      const { data } = await getSprintsByStage(stageId);
      setSprints(data.filter(s => s.statut === "TERMINE" || s.statut === "TERMINE_INCOMPLET"));
    } catch {}
  };

  const handleSprintChange = async (sprint) => {
    setSelectedSprint(sprint);
    setExistingEval(null);
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const { data } = await getEvalBySprint(sprint.id);
      setExistingEval(data);
      setForm({ ...data, commentaire: data.commentaire || "" });
    } catch {
      setForm(EMPTY_EVAL);
    } finally {
      setLoading(false);
    }
  };

  const noteGlobale = ((
    Number(form.qualiteTechnique) + Number(form.respectDelais) + 
    Number(form.autonomie) + Number(form.communication)
  ) / 4).toFixed(1);

  const getMention = (note) => {
    if (note >= 16) return { label: "EXCELLENT", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
    if (note >= 14) return { label: "TRÈS BIEN", color: "#6366f1", bg: "rgba(99,102,241,0.1)" };
    if (note >= 12) return { label: "BIEN", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" };
    if (note >= 10) return { label: "PASSABLE", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
    return { label: "INSUFFISANT", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  };

  const mention = getMention(Number(noteGlobale));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSprint) return;
    setSaving(true); setError(""); setSuccess("");

    const stage = stages.find((s) => s.id === Number(selectedStage));
    const payload = {
      ...form,
      qualiteTechnique: Number(form.qualiteTechnique),
      respectDelais: Number(form.respectDelais),
      autonomie: Number(form.autonomie),
      communication: Number(form.communication),
      stagiaireId: stage?.stagiaireId,
      encadrantId: user.id,
      sprintId: selectedSprint.id,
    };

    try {
      if (existingEval) {
        await modifierEvaluation(existingEval.id, payload);
        setSuccess("Score de performance mis à jour.");
      } else {
        await creerEvaluation(payload);
        setSuccess("L'évaluation du sprint a été finalisée.");
      }
      const { data } = await getEvalBySprint(selectedSprint.id);
      setExistingEval(data);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      
      <main className="main-content fade-in">
        <header className="elite-eval-header">
           <div className="header-meta">
              <div className="eval-badge"><Target size={14} /> PERFORMANCE HUB</div>
              <h1 className="gradient-text">Évaluation de Talent</h1>
              <p>Évaluez les compétences acquises lors de ce cycle de sprint.</p>
           </div>
        </header>

        <div className="eval-dual-layout">
           {/* LEFT: SELECTION PANELS */}
           <div className="selector-panel">
              <div className="premium-card sidebar-card">
                 <h3 className="card-title">Dossier de Stage</h3>
                 <div className="form-group-v2">
                    <label>Stagiaire Principal</label>
                    <select value={selectedStage} onChange={(e) => handleStageChange(e.target.value)}>
                       <option value="">Sélectionner un projet...</option>
                       {stages.map((s) => (
                         <option key={s.id} value={s.id}>{s.sujet} ({s.stagiaireNom})</option>
                       ))}
                    </select>
                 </div>

                 <AnimatePresence>
                   {sprints.length > 0 && (
                     <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="sprint-list-box">
                        <label className="sub-label">Cycles Terminé(s)</label>
                        {sprints.map((s) => (
                          <button 
                            key={s.id} 
                            onClick={() => handleSprintChange(s)}
                            className={`sprint-btn-item ${selectedSprint?.id === s.id ? 'active' : ''}`}
                          >
                             <div className="check-dot" />
                             <div className="s-info">
                                <span className="s-name">Sprint {s.numero} : {s.nom}</span>
                                <span className="s-date">{s.dateFin}</span>
                             </div>
                             <ChevronLeft size={16} />
                          </button>
                        ))}
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
           </div>

           {/* RIGHT: FORM PANELS */}
           <div className="form-panel">
              {!selectedSprint ? (
                <div className="empty-selection-placeholder">
                   <div className="placeholder-icon"><Star size={64} opacity={0.1} /></div>
                   <h3>Prêt à évaluer ?</h3>
                   <p>Veuillez sélectionner un projet et un sprint terminé sur la gauche pour commencer la notation.</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="premium-card evaluation-form-card">
                   <div className="form-header-premium">
                      <div className="p-title">
                         <h2>Performance Review</h2>
                         <p>{selectedSprint.nom} — Stage {selectedStage}</p>
                      </div>
                      <div className="global-score-container" style={{ background: mention.bg, color: mention.color }}>
                         <div className="score-val">{noteGlobale}<span>/20</span></div>
                         <div className="mention-lbl">{mention.label}</div>
                      </div>
                   </div>

                   {loading ? (
                     <div className="loader-box"><RefreshCw className="spin" /> Synchronisation...</div>
                   ) : (
                     <form onSubmit={handleSubmit} className="elite-eval-form">
                        <AnimatePresence>
                          {success && (
                            <motion.div initial={{ h:0, opacity:0 }} animate={{ h:'auto', opacity:1 }} className="status-toast success">
                               <CheckCircle size={18} /> {success}
                            </motion.div>
                          )}
                          {error && (
                            <motion.div initial={{ h:0, opacity:0 }} animate={{ h:'auto', opacity:1 }} className="status-toast error">
                               <AlertCircle size={18} /> {error}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="criteria-grid">
                           {CRITERES.map(c => (
                             <EliteSlider 
                               key={c.key} 
                               label={c.label} 
                               icon={c.icon} 
                               desc={c.desc}
                               value={form[c.key]} 
                               onChange={(e) => setForm(p => ({ ...p, [c.key]: e.target.value }))} 
                             />
                           ))}
                        </div>

                        <div className="form-group-v2 full-width">
                           <label>Observations & Recommendations Qualitative</label>
                           <textarea 
                             value={form.commentaire} 
                             onChange={(e) => setForm(p => ({ ...p, commentaire: e.target.value }))}
                             placeholder="Détaillez les points forts et les axes d'amélioration..."
                             rows={4}
                           />
                        </div>

                        <div className="form-footer">
                           <button type="submit" className="btn btn-primary elite-save-btn" disabled={saving}>
                              {saving ? <RefreshCw className="spin" size={18} /> : <Save size={18} />}
                              <span>{existingEval ? "Mettre à jour l'évaluation" : "Finaliser l'évaluation"}</span>
                           </button>
                        </div>
                     </form>
                   )}
                </motion.div>
              )}
           </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .elite-eval-header { margin-bottom: 40px; }
        .eval-badge { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 900; color: var(--primary); letter-spacing: 2px; margin-bottom: 12px; }
        .eval-dual-layout { display: grid; grid-template-columns: 360px 1fr; gap: 32px; align-items: flex-start; }

        .sidebar-card { padding: 24px; }
        .card-title { font-size: 18px; font-weight: 900; margin-bottom: 24px; color: var(--text); }
        .sub-label { display: block; font-size: 11px; font-weight: 900; color: var(--text-3); text-transform: uppercase; margin: 24px 0 12px; }

        .sprint-list-box { display: flex; flex-direction: column; gap: 8px; }
        .sprint-btn-item {
          display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-radius: 16px;
          border: 1.5px solid var(--border); background: var(--bg); cursor: pointer; transition: all 0.2s;
          text-align: left; width: 100%; color: var(--text-3);
        }
        .sprint-btn-item:hover { transform: translateX(8px); border-color: var(--primary); }
        .sprint-btn-item.active { background: var(--surface); border-color: var(--primary); color: var(--primary); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .check-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); transition: 0.2s; }
        .sprint-btn-item.active .check-dot { background: var(--primary); box-shadow: 0 0 10px var(--primary); }
        .s-info { flex: 1; display: flex; flex-direction: column; }
        .s-name { font-weight: 800; font-size: 14px; }
        .s-date { font-size: 11px; font-weight: 600; opacity: 0.7; }

        .evaluation-form-card { padding: 40px; }
        .form-header-premium { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1.5px dashed var(--border); }
        .p-title h2 { font-size: 24px; font-weight: 900; }
        .p-title p { color: var(--text-3); font-weight: 600; margin-top: 4px; }

        .global-score-container { padding: 16px 32px; border-radius: 20px; text-align: right; }
        .score-val { font-size: 36px; font-weight: 900; line-height: 1; }
        .score-val span { font-size: 16px; opacity: 0.6; }
        .mention-lbl { font-size: 12px; font-weight: 900; margin-top: 4px; letter-spacing: 1px; }

        .criteria-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
        .elite-slider-group { background: var(--bg); padding: 20px; border-radius: 20px; border: 1.5px solid transparent; transition: 0.2s; }
        .elite-slider-group:hover { border-color: var(--border); background: var(--surface); }

        .slider-header-box { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .label-row { display: flex; align-items: center; gap: 10px; }
        .slider-label { font-weight: 900; font-size: 15px; color: var(--text); }
        .slider-desc { font-size: 11px; color: var(--text-3); font-weight: 600; margin-top: 4px; }
        .score-badge { font-size: 20px; font-weight: 900; width: 60px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #fff; }
        .score-badge span { font-size: 11px; opacity: 0.5; }

        .elite-input-range {
          width: 100%; -webkit-appearance: none; background: var(--border); height: 6px; border-radius: 10px; outline: none;
        }
        .elite-input-range::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: #fff; border: 4px solid var(--accent); cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }

        .form-group-v2.full-width { margin-top: 32px; padding-top: 32px; border-top: 1.5px solid var(--border); }
        .elite-save-btn { width: 100%; padding: 20px; border-radius: 20px; display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 16px; font-weight: 900; }

        .status-toast { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-radius: 14px; font-weight: 700; margin-bottom: 24px; font-size: 14px; }
        .status-toast.success { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
        .status-toast.error { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

        .empty-selection-placeholder { height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: var(--text-3); }
        .placeholder-icon { margin-bottom: 24px; }
        .empty-selection-placeholder h3 { font-size: 22px; font-weight: 900; color: var(--text); margin-bottom: 12px; }
        .empty-selection-placeholder p { max-width: 400px; font-weight: 600; line-height: 1.5; }
        .loader-box { padding: 60px; text-align: center; color: var(--text-3); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 12px; }
      ` }} />
    </div>
  );
};

export default GestionEvaluations;
