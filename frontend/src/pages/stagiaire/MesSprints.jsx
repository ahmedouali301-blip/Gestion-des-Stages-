import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/common/Sidebar';
import Topbar  from '../../components/common/Topbar';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getSprintsByStage }      from '../../api/sprintAPI';
import { getStagesByStagiaire }   from '../../api/stageAPI';
import {
  getTachesBySprint,
  getTachesDisponibles,
  affecterTacheASprint,
  retirerTacheDuSprint,
} from '../../api/tacheAPI';
import { 
  RefreshCw, Layers, Target, CheckSquare, 
  Clock, AlertCircle, ChevronDown, ChevronUp, 
  CheckCircle, Plus, Trash2, Calendar, Users,
  Info, Sparkles, TrendingUp, Play, StopCircle
} from 'lucide-react';

const NAV = [
  { path: '/stagiaire/dashboard',   icon: '⊞', label: 'Mon espace'      },
  { path: '/stagiaire/sujets',      icon: '📝', label: 'Sujets'          },
  { path: '/stagiaire/sprints',     icon: '🔄', label: 'Mes sprints'     },
  { path: '/stagiaire/taches',      icon: '✅', label: 'Mes tâches'      },
  { path: '/stagiaire/reunions',    icon: '📅', label: 'Mes réunions'    },
  { path: '/stagiaire/evaluations', icon: '⭐', label: 'Mes évaluations' },
];

const STATUT_SPRINT = {
  PLANIFIE:          { label:'Planifié',  bg:'rgba(107,114,128,0.1)', color:'#6b7280', icon: Calendar },
  EN_COURS:          { label:'En cours',  bg:'rgba(99,102,241,0.1)', color:'#6366f1', icon: Play },
  TERMINE:           { label:'Terminé',   bg:'rgba(16,185,129,0.1)', color:'#10b981', icon: CheckCircle },
  TERMINE_INCOMPLET: { label:'Incomplet', bg:'rgba(245,158,11,0.1)', color:'#f59e0b', icon: AlertCircle },
};

const STATUT_TACHE = {
  EN_ATTENTE_VALIDATION: { label:'À Valider', color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
  A_FAIRE:               { label:'À Faire',   color:'#6b7280', bg:'rgba(107,114,128,0.1)' },
  EN_COURS:              { label:'En Cours',  color:'#6366f1', bg:'rgba(99,102,241,0.1)' },
  TERMINE:               { label:'Terminé',   color:'#10b981', bg:'rgba(16,185,129,0.1)' },
  REFUSE:                { label:'Refusé',    color:'#ef4444', bg:'rgba(239,68,68,0.1)' },
  REPORTEE:              { label:'REPORTER',  color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
};

const PRIORITE_COLORS = { BASSE:'#3b82f6', MOYENNE:'#10b981', HAUTE:'#f59e0b', CRITIQUE:'#ef4444' };

const deduplicateTaches = (taches) => {
  const map = new Map();
  taches.forEach(t => {
    const key = `${t.titre}__${t.sprintId}`;
    if (!map.has(key)) map.set(key, { ...t });
  });
  return Array.from(map.values());
};

export default function MesSprints() {
  const { user }        = useAuth();
  const { sidebarMini } = useTheme();

  const [stage,        setStage]        = useState(null);
  const [sprints,      setSprints]      = useState([]);
  const [openSprint,   setOpenSprint]   = useState(null);
  const [taches,       setTaches]       = useState({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const [showAffecter,        setShowAffecter]        = useState(false);
  const [activeSprint,        setActiveSprint]        = useState(null);
  const [tachesDisponibles,   setTachesDisponibles]   = useState([]);
  const [tachesSelectionnees, setTachesSelectionnees] = useState([]);
  const [savingAff,           setSavingAff]           = useState(false);
  const [errorAff,            setErrorAff]            = useState('');

  useEffect(() => { if (user?.id) loadAll(); }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const stagesRes = await getStagesByStagiaire(user.id);
      const stageActif = (stagesRes.data || []).find(s => s.statut === 'EN_COURS' || s.statut === 'EN_ATTENTE') || stagesRes.data?.[0];
      if (!stageActif) { setLoading(false); return; }
      setStage(stageActif);
      const sprintsRes = await getSprintsByStage(stageActif.id);
      setSprints(sprintsRes.data || []);
    } catch { setError('Erreur synchronisation roadmap'); }
    finally { setLoading(false); }
  };

  const loadTaches = async (sprintId) => {
    try {
      const { data } = await getTachesBySprint(sprintId);
      setTaches(prev => ({ ...prev, [sprintId]: deduplicateTaches(data) }));
    } catch {}
  };

  const toggleSprint = (sprintId) => {
    if (openSprint === sprintId) { setOpenSprint(null); return; }
    setOpenSprint(sprintId);
    if (!taches[sprintId]) loadTaches(sprintId);
  };

  const handleAffecter = async () => {
    if (tachesSelectionnees.length === 0) return;
    setSavingAff(true);
    try {
      await Promise.all(tachesSelectionnees.map(tId => affecterTacheASprint(tId, activeSprint.id)));
      setShowAffecter(false); loadTaches(activeSprint.id); loadAll();
    } catch (err) { setErrorAff('Échec de l\'affectation.'); }
    finally { setSavingAff(false); }
  };

  return (
    <div className={`app-layout ${sidebarMini ? 'sidebar-mini' : ''}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      
      <main className="main-content fade-in">
        <header className="elite-roadmap-header">
           <div className="title-stack">
              <h1 className="gradient-text">Roadmap de Projet</h1>
              <p>{stage ? `${stage.sujet} — Vision Stratégique` : 'Suivi de votre trajectoire agile'}</p>
           </div>
           
           <div className="roadmap-stats">
              <div className="r-stat">
                 <span className="lbl">Sprints Lab</span>
                 <span className="val">{sprints.length} Cycles</span>
              </div>
              <div className="r-stat">
                 <span className="lbl">Completion</span>
                 <span className="val">{stage ? Math.round(stage.tauxAvancement || 0) : 0}%</span>
              </div>
           </div>
        </header>

        {stage?.stagiaire2Id && (
          <div className="binome-sync-badge">
             <div className="b-icon"><Users size={16} /></div>
             <p>Mode <strong>Binôme Collaboratif</strong> actif. Vos sprints et vos tâches sont synchronisés avec <strong>{user.id === stage.stagiaireId ? stage.stagiaire2Prenom : stage.stagiairePrenom}</strong>.</p>
          </div>
        )}

        {loading ? (
          <div className="loader-center"><RefreshCw className="spin" size={40} /> Orchestration du cycle de vie...</div>
        ) : !stage ? (
          <div className="empty-roadmap-state">
             <div className="icon-box"><Target size={64} /></div>
             <h3>Aucun projet détecté</h3>
             <p>Les itérations apparaîtront ici une fois votre stage officiellement lancé par le responsable.</p>
          </div>
        ) : (
          <div className="sprint-pipeline-elite">
             {sprints.map((sprint, idx) => {
               const config = STATUT_SPRINT[sprint.statut] || STATUT_SPRINT.PLANIFIE;
               const isOpen = openSprint === sprint.id;
               const SIcon = config.icon;
               const sprintTaches = taches[sprint.id] || [];

               return (
                 <motion.div 
                   key={sprint.id} 
                   initial={{ opacity: 0, x: -20 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   transition={{ delay: idx * 0.1 }}
                   className={`sprint-tile-premium ${isOpen ? 'active' : ''}`}
                 >
                    <div className="tile-header" onClick={() => toggleSprint(sprint.id)}>
                       <div className="sprint-id-box">S{sprint.numero}</div>
                       <div className="sprint-main-text">
                          <h3>{sprint.nom}</h3>
                          <div className="sub-meta">
                             <Calendar size={12} /> {sprint.dateDebut} → {sprint.dateFin}
                             <span className="sep">•</span>
                             <Layers size={12} /> {stage?.stagiaire2Id ? Math.ceil(sprint.nbTaches/2) : sprint.nbTaches} Tâches
                          </div>
                       </div>
                       
                       <div className="tile-progress">
                          <div className="p-bar"><div className="p-f" style={{ width: `${sprint.tauxAvancement || 0}%` }} /></div>
                          <span className="p-v">{Math.round(sprint.tauxAvancement || 0)}%</span>
                       </div>

                       <div className="tile-status" style={{ background: config.bg, color: config.color }}>
                          <SIcon size={14} /> <span>{config.label}</span>
                       </div>
                       
                       <div className="tile-chevron">{isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                    </div>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="tile-body-elite">
                           <div className="sprint-mission-banner">
                              <Target size={18} className="text-primary" />
                              <div className="mission-content">
                                 <label>Mission du Sprint</label>
                                 <p>{sprint.objectifs || "L'encadrant n'a pas encore spécifié d'objectifs pour ce cycle."}</p>
                              </div>
                           </div>

                           <div className="sprint-ops-hub">
                              {(sprint.statut === 'PLANIFIE' || sprint.statut === 'EN_COURS') && (
                                <button className="btn-add-t-hub" onClick={() => {
                                  setActiveSprint(sprint); setTachesSelectionnees([]);
                                  getTachesDisponibles(stage.id).then(res => { setTachesDisponibles(res.data); setShowAffecter(true); });
                                }}>
                                   <Plus size={16} /> Affecter des Tâches
                                </button>
                              )}
                              <p className="ops-disclaimer"><Info size={14} /> Seul votre encadrant technique peut modifier l'état du sprint.</p>
                           </div>

                           <div className="sprint-tasks-scroller">
                              {sprintTaches.length === 0 ? (
                                <div className="empty-tasks-sprint"><CheckSquare size={32} opacity={0.1} /><p>Aucune tâche affectée.</p></div>
                              ) : (
                                <div className="tasks-flow-grid">
                                   {sprintTaches.map(t => {
                                     const tc = STATUT_TACHE[t.statut] || STATUT_TACHE.A_FAIRE;
                                     return (
                                       <div key={t.id} className="task-sub-tile">
                                          <div className="prio-dot" style={{ background: PRIORITE_COLORS[t.priorite] }} />
                                          <div className="t-text">
                                             <span className="t-name">{t.titre}</span>
                                             <div className="t-meta">
                                                <div className="t-stat" style={{ color: tc.color, background: tc.bg }}>{tc.label}</div>
                                                {t.estimation && <span className="t-est"><Clock size={10} /> {t.estimation}j</span>}
                                             </div>
                                          </div>
                                          {(sprint.statut === 'PLANIFIE' || sprint.statut === 'EN_COURS') && (
                                            <button className="btn-remove-t" onClick={() => retirerTacheDuSprint(t.id).then(() => loadTaches(sprint.id))}><Trash2 size={14} /></button>
                                          )}
                                       </div>
                                     );
                                   })}
                                </div>
                              )}
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </motion.div>
               );
             })}
          </div>
        )}

        {/* TASK ALLOCATION MODAL */}
        <AnimatePresence>
          {showAffecter && activeSprint && (
            <div className="elite-modal-overlay">
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="elite-modal-card">
                  <div className="modal-header">
                     <h2>Sélection du Backlog</h2>
                     <p>Affectation pour le Sprint {activeSprint.numero}</p>
                  </div>
                  
                  <div className="taches-picker-list">
                     {tachesDisponibles.length === 0 ? (
                       <div className="empty-picker"><CheckSquare size={48} opacity={0.1} /><p>Votre backlog est vide.</p></div>
                     ) : (
                       tachesDisponibles.map(t => (
                         <div key={t.id} className={`picker-item ${tachesSelectionnees.includes(t.id) ? 'selected' : ''}`}
                              onClick={() => setTachesSelectionnees(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}>
                            <div className="check-box-elite"></div>
                            <div className="p-info">
                               <span className="p-title">{t.titre}</span>
                               <span className="p-prio" style={{ color: PRIORITE_COLORS[t.priorite] }}>{t.priorite}</span>
                            </div>
                         </div>
                       ))
                     )}
                  </div>

                  <div className="modal-actions-v3">
                     <button className="btn btn-ghost" onClick={() => setShowAffecter(false)}>Annuler</button>
                     <button className="btn btn-primary elite-btn" disabled={tachesSelectionnees.length === 0 || savingAff} onClick={handleAffecter}>
                        {savingAff ? 'Synchronisation...' : `Confirmer (${tachesSelectionnees.length})`}
                     </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .elite-roadmap-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
        .roadmap-stats { display: flex; gap: 32px; }
        .r-stat { display: flex; flex-direction: column; text-align: right; }
        .r-stat .lbl { font-size: 11px; font-weight: 800; color: var(--text-3); text-transform: uppercase; letter-spacing: 1px; }
        .r-stat .val { font-size: 20px; font-weight: 900; color: var(--primary); }

        .binome-sync-badge { 
          display: flex; align-items: center; gap: 16px; padding: 20px 32px; 
          background: rgba(139,92,246,0.08); border: 1.5px solid rgba(139,92,246,0.15); 
          border-radius: 20px; margin-bottom: 40px; color: #7c3aed; font-size: 14px;
        }
        .b-icon { width: 36px; height: 36px; border-radius: 10px; background: #fff; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(139,92,246,0.2); }

        .sprint-pipeline-elite { display: flex; flex-direction: column; gap: 16px; }
        .sprint-tile-premium { background: var(--surface); border: 1.5px solid var(--border); border-radius: 24px; transition: 0.3s; overflow: hidden; }
        .sprint-tile-premium.active { border-color: var(--primary); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        
        .tile-header { padding: 24px 32px; display: flex; align-items: center; cursor: pointer; gap: 24px; }
        .sprint-id-box { width: 44px; height: 44px; border-radius: 14px; background: var(--bg); font-weight: 900; display: flex; align-items: center; justify-content: center; color: var(--text-2); font-size: 16px; }
        .active .sprint-id-box { background: var(--primary-light-alpha); color: var(--primary); }
        .sprint-main-text h3 { font-size: 17px; font-weight: 900; }
        .sub-meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-3); font-weight: 700; margin-top: 4px; }
        .sep { color: var(--border); }

        .tile-progress { width: 140px; display: flex; flex-direction: column; gap: 8px; }
        .p-bar { width: 100%; height: 6px; background: var(--bg); border-radius: 10px; overflow: hidden; }
        .p-f { height: 100%; background: var(--primary); border-radius: 10px; }
        .p-v { font-size: 11px; font-weight: 900; color: var(--text-2); text-align: right; }

        .tile-status { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 10px; font-size: 12px; font-weight: 800; min-width: 140px; justify-content: center; }
        .tile-chevron { color: var(--text-3); }
        
        .tile-body-elite { background: var(--bg-alpha); padding: 32px; border-top: 1.5px solid var(--border); }
        
        .sprint-mission-banner { 
          display: flex; gap: 20px; background: var(--surface); padding: 20px; 
          border-radius: 20px; border: 1.5px solid var(--border); margin-bottom: 32px;
        }
        .mission-content label { font-size: 11px; font-weight: 900; color: var(--primary); text-transform: uppercase; margin-bottom: 4px; display: block; }
        .mission-content p { font-size: 14px; color: var(--text-2); font-weight: 600; line-height: 1.5; }

        .sprint-ops-hub { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .btn-add-t-hub { background: var(--surface); border: 1.5px solid var(--border); padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s; }
        .btn-add-t-hub:hover { border-color: var(--primary); color: var(--primary); }
        .ops-disclaimer { font-size: 11px; color: var(--text-3); display: flex; align-items: center; gap: 8px; font-weight: 600; font-style: italic; }

        .tasks-flow-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
        .task-sub-tile { display: flex; align-items: center; gap: 16px; background: var(--surface); padding: 16px; border-radius: 16px; border: 1.5px solid var(--border); }
        .prio-dot { width: 4px; height: 32px; border-radius: 2px; flex-shrink: 0; }
        .t-text { flex: 1; display: flex; flex-direction: column; }
        .t-name { font-weight: 800; font-size: 14px; color: var(--text); }
        .t-meta { display: flex; gap: 12px; margin-top: 2px; }
        .t-stat { font-size: 10px; font-weight: 900; padding: 1px 8px; border-radius: 6px; }
        .t-est { font-size: 10px; font-weight: 800; color: var(--text-3); display: flex; align-items: center; gap: 4px; }
        .btn-remove-t { background: none; border: none; color: var(--text-3); cursor: pointer; transition: 0.2s; }
        .btn-remove-t:hover { color: #ef4444; }

        .elite-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .elite-modal-card { background: var(--surface); width: 100%; max-width: 520px; border-radius: 28px; padding: 40px; box-shadow: 0 40px 100px rgba(0,0,0,0.2); }
        .modal-header h2 { font-size: 20px; font-weight: 900; }
        .modal-header p { color: var(--text-3); font-size: 14px; margin-top: 4px; }
        .taches-picker-list { display: flex; flex-direction: column; gap: 10px; margin: 32px 0; max-height: 400px; overflow-y: auto; padding: 4px; }
        .picker-item { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 16px; background: var(--bg); border: 1.5px solid transparent; cursor: pointer; transition: 0.2s; }
        .picker-item.selected { border-color: var(--primary); background: var(--surface); }
        .check-box-elite { width: 22px; height: 22px; border: 2px solid var(--border); border-radius: 6px; transition: 0.2s; }
        .selected .check-box-elite { background: var(--primary); border-color: var(--primary); position: relative; }
        .selected .check-box-elite::after { content: '✓'; color: #fff; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; }
        .p-info { display: flex; flex-direction: column; }
        .p-title { font-weight: 800; font-size: 14px; }
        .p-prio { font-size: 11px; font-weight: 900; }
        .modal-actions-v3 { display: flex; justify-content: flex-end; gap: 16px; }

        .loader-center { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px; color: var(--text-3); font-weight: 700; }
        .empty-roadmap-state { padding: 80px 0; text-align: center; color: var(--text-3); }
        .empty-roadmap-state h3 { color: var(--text); font-size: 20px; font-weight: 900; margin: 16px 0 8px; }
      ` }} />
    </div>
  );
}