import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/common/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { getEvalsByStagiaire, getMoyenne } from "../../api/evaluationAPI";
import Topbar from "../../components/common/Topbar";
import { useTheme } from "../../context/ThemeContext";
import {
  CheckCircle, RefreshCw, BarChart3,
  LayoutDashboard, FileText, Star, Calendar, Cpu, Clock, Target, Users, MessageSquare
} from 'lucide-react';
import { useSession } from "../../context/SessionContext";

const NAV = [
  { path: "/stagiaire/dashboard", icon: <LayoutDashboard size={18} />, label: "Mon espace" },
  { path: "/stagiaire/sujets", icon: <FileText size={18} />, label: "Sujets" },
  { path: '/stagiaire/sprints',     icon: <RefreshCw size={18} />, label: 'Mes sprints'     },
  { path: "/stagiaire/taches", icon: <CheckCircle size={18} />, label: "Mes tâches" },
  { path: "/stagiaire/reunions", icon: <Calendar size={18} />, label: "Mes réunions" },
  { path: "/stagiaire/evaluations", icon: <Star size={18} />, label: "Mes évaluations" },
];

const CRITERES = [
  { key: "qualiteTechnique", label: "Qualité Technique", icon: Cpu, color: "#6366f1" },
  { key: "respectDelais", label: "Respect des Délais", icon: Clock, color: "#10b981" },
  { key: "autonomie", label: "Autonomie", icon: Target, color: "#f59e0b" },
  { key: "communication", label: "Communication", icon: Users, color: "#8b5cf6" },
];

function AnalyticsRing({ value, label, icon: Icon, color, delay = 0 }) {
  const percentage = (value / 20) * 100;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay }} className="analytics-ring-box">
       <div className="ring-container">
          <svg viewBox="0 0 100 100">
             <circle cx="50" cy="50" r={radius} className="ring-bg" />
             <motion.circle 
                cx="50" cy="50" r={radius} 
                className="ring-fill"
                stroke={color}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
             />
          </svg>
          <div className="ring-icon" style={{ color }}><Icon size={18} /></div>
       </div>
       <div className="ring-info">
          <span className="ring-val">{value}/20</span>
          <span className="ring-lbl">{label}</span>
       </div>
    </motion.div>
  );
}

const MesEvaluations = () => {
  const { user } = useAuth();
  const { sidebarMini } = useTheme();
  const { activeSession } = useSession();
  const [evals, setEvals] = useState([]);
  const [moyenne, setMoyenne] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([getEvalsByStagiaire(user.id), getMoyenne(user.id)])
      .then(([e, m]) => {
        const sessionStr = String(activeSession);
        const filteredEvals = (e.data || []).filter(ev => !ev.annee || String(ev.annee) === sessionStr);
        setEvals(filteredEvals);
        
        if (filteredEvals.length > 0) {
          const sum = filteredEvals.reduce((acc, curr) => acc + (curr.noteGlobale || 0), 0);
          setMoyenne(sum / filteredEvals.length);
          setSelected(filteredEvals[0]);
        } else {
          setMoyenne(null);
          setSelected(null);
        }
      })
      .finally(() => setLoading(false));
  }, [user, activeSession]);

  const getMention = (note) => {
    if (!note) return { label: "En attente", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
    if (note >= 16) return { label: "Excellent", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
    if (note >= 14) return { label: "Très Bien", color: "#6366f1", bg: "rgba(99,102,241,0.1)" };
    if (note >= 12) return { label: "Bien", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" };
    if (note >= 10) return { label: "Passable", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
    return { label: "Insuffisant", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  };

  const mention = getMention(moyenne);

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      
      <main className="main-content fade-in">
        <header className="elite-eval-header">
           <div className="title-stack">
              <h1 className="gradient-text">Performance Analytics</h1>
              <p>Évaluation holistique de vos compétences et progressions</p>
           </div>
           
           <div className="global-score-card">
              <div className="g-score-main">
                 <div className="g-val">{moyenne ? Number(moyenne).toFixed(1) : "—"}</div>
                 <div className="g-max">/20</div>
              </div>
              <div className="g-mention" style={{ background: mention.bg, color: mention.color }}>{mention.label}</div>
              <div className="g-label">RÉSULTAT CONSOLIDÉ</div>
           </div>
        </header>

        {loading ? (
          <div className="loader-eval"><RefreshCw className="spin" size={40} /> Analyse du bulletin...</div>
        ) : evals.length === 0 ? (
          <div className="empty-eval-state">
             <div style={{ marginBottom: 20, opacity: 0.1 }}><Star size={64} /></div>
             <h3>Bulletin non disponible</h3>
             <p>Votre encadrant publiera vos premières notes après la clôture du prochain sprint.</p>
          </div>
        ) : (
          <div className="evaluations-orchestrator">
             <div className="eval-history-panel">
                <div className="panel-head"><BarChart3 size={16} /> HISTORIQUE DES SPRINTS</div>
                <div className="eval-list-scroller">
                   {evals.map((e, idx) => {
                     const isSelected = selected?.id === e.id;
                     const m = getMention(e.noteGlobale);
                     return (
                       <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay: idx*0.05 }} key={e.id} className={`eval-mini-card ${isSelected ? 'active' : ''}`} onClick={() => setSelected(e)}>
                          <div className="e-card-main">
                             <h4>{e.sprintNom}</h4>
                             <span className="e-date">{new Date(e.dateEvaluation).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="e-card-score" style={{ color: m.color }}>{e.noteGlobale?.toFixed(1)}</div>
                          {isSelected && <div className="active-dot" />}
                       </motion.div>
                     );
                   })}
                </div>
             </div>

             <div className="eval-detail-pane">
                <AnimatePresence mode="wait">
                   {selected && (
                     <motion.div key={selected.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }} className="performance-detail-hub">
                        <div className="detail-hero">
                           <div className="hero-info">
                              <h3>{selected.sprintNom}</h3>
                              <p>Évalué par <strong>{selected.encadrantNom}</strong> le {new Date(selected.dateEvaluation).toLocaleDateString()}</p>
                           </div>
                           <div className="hero-status-box" style={{ background: getMention(selected.noteGlobale).bg, color: getMention(selected.noteGlobale).color }}>
                              {getMention(selected.noteGlobale).label}
                           </div>
                        </div>

                        <div className="criteria-analytics-grid">
                           {CRITERES.map((c, i) => (
                             <AnalyticsRing key={c.key} label={c.label} icon={c.icon} value={selected[c.key]} color={c.color} delay={0.1 + i*0.1} />
                           ))}
                        </div>

                        <div className="grading-consolidated">
                           <div className="c-label">SYNTHÈSE DE LA PERFORMANCE</div>
                           <div className="c-score-row">
                              <span className="c-score-val">{selected.noteGlobale?.toFixed(2)} <small>/20</small></span>
                              <div className="c-progress-track"><div className="c-f" style={{ width: `${(selected.noteGlobale/20)*100}%`, background: getMention(selected.noteGlobale).color }} /></div>
                           </div>
                        </div>

                        {selected.commentaire && (
                          <div className="feedback-section-elite">
                             <div className="f-label"><MessageSquare size={14} /> COMMENTAIRE PROFESSIONNEL</div>
                             <div className="f-bubble">
                                <p>{selected.commentaire}</p>
                                <div className="f-quote">"</div>
                             </div>
                          </div>
                        )}
                     </motion.div>
                   )}
                </AnimatePresence>
             </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .elite-eval-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .global-score-card { background: var(--surface); border: 2px solid var(--primary); border-radius: 28px; padding: 24px 40px; text-align: center; box-shadow: 0 20px 40px var(--primary-light-alpha); }
        .g-score-main { display: flex; align-items: baseline; justify-content: center; gap: 4px; }
        .g-val { font-size: 40px; font-weight: 900; color: var(--text); }
        .g-max { font-size: 16px; font-weight: 800; color: var(--text-3); }
        .g-mention { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 11px; font-weight: 900; text-transform: uppercase; margin: 8px 0; }
        .g-label { font-size: 10px; font-weight: 800; color: var(--text-3); letter-spacing: 1px; }

        .evaluations-orchestrator { display: grid; grid-template-columns: 320px 1fr; gap: 32px; height: calc(100vh - 280px); }
        
        .eval-history-panel { background: var(--surface); border: 1.5px solid var(--border); border-radius: 24px; display: flex; flex-direction: column; overflow: hidden; }
        .panel-head { padding: 20px 24px; font-size: 11px; font-weight: 900; color: var(--text-3); border-bottom: 1.5px solid var(--border); letter-spacing: 1px; }
        .eval-list-scroller { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .eval-mini-card { padding: 16px 20px; border-radius: 16px; border: 1.5px solid transparent; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s; position: relative; }
        .eval-mini-card:hover { background: var(--bg); }
        .eval-mini-card.active { border-color: var(--primary); background: var(--primary-light-alpha); }
        .e-card-main h4 { font-size: 14px; font-weight: 800; }
        .e-date { font-size: 11px; color: var(--text-3); font-weight: 700; margin-top: 2px; }
        .e-card-score { font-size: 18px; font-weight: 900; }
        .active-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--primary); position: absolute; left: 8px; top: 25px; }

        .eval-detail-pane { background: var(--surface); border: 1.5px solid var(--border); border-radius: 24px; overflow-y: auto; padding: 40px; }
        .detail-hero { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .hero-info h3 { font-size: 24px; font-weight: 900; }
        .hero-info p { font-size: 14px; color: var(--text-3); margin-top: 4px; font-weight: 600; }
        .hero-status-box { padding: 8px 24px; border-radius: 14px; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
        
        .criteria-analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 24px; margin-bottom: 48px; }
        .analytics-ring-box { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; }
        .ring-container { width: 90px; height: 90px; position: relative; }
        .ring-bg { fill: none; stroke: var(--bg); stroke-width: 8; }
        .ring-fill { fill: none; stroke-width: 8; stroke-linecap: round; }
        .ring-icon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .ring-val { display: block; font-size: 18px; font-weight: 900; color: var(--text); }
        .ring-lbl { font-size: 11px; font-weight: 800; color: var(--text-3); text-transform: uppercase; }

        .grading-consolidated { background: var(--bg-alpha); border-radius: 24px; padding: 32px; margin-bottom: 40px; }
        .c-label { font-size: 11px; font-weight: 900; color: var(--primary); letter-spacing: 1.5px; margin-bottom: 16px; }
        .c-score-row { display: flex; align-items: center; gap: 24px; }
        .c-score-val { font-size: 32px; font-weight: 900; color: var(--text); }
        .c-score-val small { font-size: 14px; font-weight: 700; color: var(--text-3); }
        .c-progress-track { flex: 1; height: 10px; background: var(--border); border-radius: 10px; overflow: hidden; }
        .c-f { height: 100%; border-radius: 10px; }

        .feedback-section-elite { }
        .f-label { font-size: 11px; font-weight: 900; color: var(--text-3); letter-spacing: 1.5px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .f-bubble { background: var(--surface); border: 1.5px solid var(--border); padding: 32px; border-radius: 24px; position: relative; }
        .f-bubble p { font-size: 15px; color: var(--text-2); line-height: 1.6; font-style: italic; font-weight: 600; position: relative; z-index: 1; }
        .f-quote { position: absolute; top: 10px; right: 24px; font-size: 80px; font-family: serif; color: var(--primary-light-alpha); line-height: 1; font-weight: 900; }

        .loader-eval { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 100px; color: var(--text-3); font-weight: 700; }
        .empty-eval-state { text-align: center; padding: 100px 0; color: var(--text-3); }
        .empty-eval-state h3 { color: var(--text); font-size: 20px; font-weight: 900; margin: 16px 0 8px; }
      ` }} />
    </div>
  );
};

export default MesEvaluations;
