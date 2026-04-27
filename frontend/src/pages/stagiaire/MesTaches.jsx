import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/common/Sidebar';
import Topbar  from '../../components/common/Topbar';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getTachesByStagiaire,
  getTachesByStage,
  mettreAJourTache,
  creerTachePourStage,
  deleteTacheSimple,
} from '../../api/tacheAPI';
import { getStagesByStagiaire } from '../../api/stageAPI';
import { useSession } from '../../context/SessionContext';
import { Target, ArrowRight, RefreshCw, CheckSquare, Plus, Search, Filter, Clock, Activity, CheckCircle, Play, RotateCcw, Trash2, Layers, AlertCircle, Briefcase, TrendingUp, Info, ChevronRight, LayoutDashboard, FileText, Star, Calendar } from 'lucide-react';
import ClinisysAlert from '../../utils/SwalUtils';

const NAV = [
  { path: '/stagiaire/dashboard',   icon: <LayoutDashboard size={18} />, label: 'Mon espace'      },
  { path: '/stagiaire/sujets',      icon: <FileText size={18} />, label: 'Sujets'          },
  { path: '/stagiaire/sprints',     icon: <RefreshCw size={18} />, label: 'Mes sprints'     },
  { path: '/stagiaire/taches',      icon: <CheckCircle size={18} />, label: 'Mes tâches'      },
  { path: '/stagiaire/reunions',    icon: <Calendar size={18} />, label: 'Mes réunions'    },
  { path: '/stagiaire/evaluations', icon: <Star size={18} />, label: 'Mes évaluations' },
];

const STATUT_CONFIG = {
  EN_ATTENTE_VALIDATION: { label:'À Valider', color:'#f59e0b', bg:'rgba(245,158,11,0.1)', icon: Clock },
  A_FAIRE:               { label:'À Faire',   color:'#6b7280', bg:'rgba(107,114,128,0.1)', icon: Target },
  EN_COURS:              { label:'En Cours',  color:'#6366f1', bg:'rgba(99,102,241,0.1)', icon: Activity },
  TERMINE:               { label:'Terminé',   color:'#10b981', bg:'rgba(16,185,129,0.1)', icon: CheckCircle },
  REFUSE:                { label:'Refusé',    color:'#ef4444', bg:'rgba(239,68,68,0.1)', icon: AlertCircle },
  REPORTEE:              { label:'REPORTER',  color:'#f59e0b', bg:'rgba(245,158,11,0.1)', icon: RotateCcw },
};

const PRIORITE_CONFIG = {
  BASSE: { label: 'Basse', color: '#3b82f6' },
  MOYENNE: { label: 'Moyenne', color: '#10b981' },
  HAUTE: { label: 'Haute', color: '#f59e0b' },
  CRITIQUE: { label: 'Critique', color: '#ef4444' },
};

const TRANSITIONS = {
  A_FAIRE:  [{ statut:'EN_COURS', label:'Commencer', icon: Play, cls:'btn-primary' }],
  EN_COURS: [
    { statut:'TERMINE', label:'Terminer', icon: CheckCircle, cls:'btn-success' },
    { statut:'A_FAIRE', label:'Suspendre', icon: RotateCcw, cls:'btn-outline' },
  ],
  REPORTEE: [
    { statut:'EN_COURS', label:'Commencer', icon: Play, cls:'btn-primary' },
    { statut:'TERMINE', label:'Terminer', icon: CheckCircle, cls:'btn-success' },
  ]
};

const EMPTY_FORM = { titre:'', description:'', priorite:'MOYENNE', dateEcheance:'', estimation:'' };

export default function MesTaches() {
  const { user }        = useAuth();
  const { sidebarMini } = useTheme();
  const { activeSession } = useSession();

  const [tachesAffectees,    setTachesAffectees]    = useState([]);
  const [tachesNonAffectees, setTachesNonAffectees] = useState([]);
  const [filtered,       setFiltered]       = useState([]);
  const [statutFilter,   setStatutFilter]   = useState('TOUS');
  const [affectFilter,   setAffectFilter]   = useState('TOUS');
  const [search,         setSearch]         = useState('');
  const [loading,        setLoading]        = useState(true);
  const [stageId,        setStageId]        = useState(null);
  const [stageSujet,     setStageSujet]     = useState('');
  const [stageStatus,    setStageStatus]    = useState('');

  const [showModal,      setShowModal]      = useState(false);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [saving,         setSaving]         = useState(false);



  const alertError = (msg) => ClinisysAlert.error("Action Interdite", msg);

  useEffect(() => { if (user?.id) loadAll(); }, [user, activeSession]);

  useEffect(() => {
    let liste = affectFilter === 'TOUS' ? [...tachesAffectees, ...tachesNonAffectees] : (affectFilter === 'AFFECTEE' ? [...tachesAffectees] : [...tachesNonAffectees]);
    if (statutFilter !== 'TOUS') liste = liste.filter(t => t.statut === statutFilter);
    if (search) {
      const q = search.toLowerCase();
      liste = liste.filter(t => t.titre.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    }
    setFiltered(liste);
  }, [tachesAffectees, tachesNonAffectees, statutFilter, affectFilter, search]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const stagesRes = await getStagesByStagiaire(user.id);
      const stages = (stagesRes.data || []).filter(s => !s.annee || String(s.annee) === String(activeSession));
      const stageActif = stages.find(s => s.statut === 'EN_COURS' || s.statut === 'EN_ATTENTE') || stages[0];
      if (stageActif) {
        setStageId(stageActif.id); setStageSujet(stageActif.sujet);
        setStageStatus(stageActif.statut);
        const [affecteesRes, toutesRes] = await Promise.all([ getTachesByStagiaire(user.id), getTachesByStage(stageActif.id) ]);
        
        let affectees = affecteesRes.data || [];
        
        // --- EVITER LES DOUBLONS ---
        // On regroupe par l'ID de la tâche de base (tache.id)
        // Si une tâche existe en plusieurs exemplaires (ex: S1: REPORTEE, S2: REPORTER)
        // On ne garde que la version la plus RÉCENTE (id le plus haut).
        const mapUnique = new Map();
        affectees.sort((a,b) => b.id - a.id).forEach(t => {
          const baseId = t.tacheId;
          if (!mapUnique.has(baseId)) {
            mapUnique.set(baseId, t);
          }
        });
        const uniqueAffectees = Array.from(mapUnique.values());
        
        setTachesAffectees(uniqueAffectees);
        
        const titresAffectes = new Set(uniqueAffectees.map(t => t.titre));
        setTachesNonAffectees((toutesRes.data || []).filter(t => !t.sprintId && !titresAffectes.has(t.titre)));
      }
    } catch {} finally { setLoading(false); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className={`app-layout ${sidebarMini ? 'sidebar-mini' : ''}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      
      <main className="main-content fade-in">
        <header className="elite-tasks-header">
           <div className="title-stack">
              <h1 className="gradient-text">Centre d'Activités</h1>
              <p>{stageSujet || 'Pilotez votre backlog quotidien'}</p>
           </div>
           {stageStatus !== 'VALIDE' && (
              <button className="btn btn-primary elite-btn" onClick={() => setShowModal(true)} disabled={!stageId}>
                 <Plus size={18} /> <span>Formuler une Tâche</span>
              </button>
           )}
           {stageStatus === 'VALIDE' && (
              <div className="locked-badge-st-v2"><RotateCcw size={14} /> ARCHIVES</div>
           )}
        </header>

        {/* WORK LOG KPIs */}
        <div className="grid-5 mb-5">
           {[
             { label: "Backlog Intégral", value: tachesAffectees.length + tachesNonAffectees.length, color: "#6366f1", icon: Briefcase },
             { label: "À Faire", value: tachesAffectees.filter(t => t.statut === 'A_FAIRE').length, color: "#6b7280", icon: Target },
             { label: "En Cours", value: tachesAffectees.filter(t => t.statut === 'EN_COURS').length, color: "#6366f1", icon: Activity },
             { label: "Reporter", value: tachesAffectees.filter(t => t.statut === 'REPORTEE').length, color: "#f59e0b", icon: RotateCcw },
             { label: "Succès", value: tachesAffectees.filter(t => t.statut === 'TERMINE').length, color: "#10b981", icon: CheckCircle },
           ].map((s, i) => (
             <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.1 }} className="elite-mini-stat-v2">
                <div className="stat-i" style={{ background: s.color }}><s.icon size={16} /></div>
                <div className="stat-v">
                   <div className="val">{s.value}</div>
                   <div className="lbl">{s.label}</div>
                </div>
             </motion.div>
           ))}
        </div>

        {/* SEARCH & FILTER ORCHESTRATOR */}
        <div className="orchestrator-panel-elite">
           <div className="search-wrap-elite">
              <Search size={18} />
              <input placeholder="Rechercher une spécification..." value={search} onChange={e => setSearch(e.target.value)} />
           </div>
           <div className="filter-group-v3">
              <div className="sub-group">
                 {[{k:'TOUS', l:'Tous Cycles'}, {k:'AFFECTEE', l:'En Sprint'}, {k:'NON_AFFECTEE', l:'Backlog'}].map(f => (
                   <button key={f.k} onClick={() => setAffectFilter(f.k)} className={`pilot-chip ${affectFilter === f.k ? 'active' : ''}`}>{f.l}</button>
                 ))}
              </div>
              <div className="v-sep" />
              <div className="sub-group scrollable">
                 {['TOUS', 'REPORTEE', 'A_FAIRE', 'EN_COURS', 'TERMINE'].map(s => (
                   <button key={s} onClick={() => setStatutFilter(s)} className={`pilot-chip ${statutFilter === s ? 'active' : ''}`}>
                      {s === 'TOUS' ? 'Tous les États' : STATUT_CONFIG[s].label}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {loading ? (
          <div className="loader-center"><RefreshCw className="spin" size={40} /> Synchronisation des flux...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-tasks-state">
             <div className="icon-pulse" style={{ color: 'var(--primary)', marginBottom: 24, opacity: 0.2 }}><CheckSquare size={64} /></div>
             <h3>Aucune activité détectée</h3>
             <p>Votre flux de travail est actuellement vide. Formulez une tâche ou attendez l'affectation de votre encadrant.</p>
          </div>
        ) : (
          <div className="tasks-dynamic-list">
             {filtered.map((t, idx) => {
               const isBacklog = !t.sprintId;
               const config = isBacklog ? { label: 'En Attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Layers } : (STATUT_CONFIG[t.statut] || STATUT_CONFIG.A_FAIRE);
               const trans = isBacklog ? [] : (TRANSITIONS[t.statut] || []);
               const prio = PRIORITE_CONFIG[t.priorite] || PRIORITE_CONFIG.MOYENNE;

               return (
                 <motion.div 
                   initial={{ opacity:0, x:-20 }} 
                   animate={{ opacity:1, x:0 }} 
                   transition={{ delay: idx*0.05 }} 
                   key={isBacklog ? `backlog-${t.id}` : `sprint-${t.id}`} 
                   className={`task-premium-row ${isBacklog ? 'is-backlog' : ''}`}
                 >
                    <div className="prio-marker" style={{ background: prio.color }} />
                    <div className="task-main-info">
                       <div className="task-row-top">
                          <h3>{t.titre}</h3>
                          <div className="statut-tag" style={{ color: config.color, background: config.bg }}>
                             <config.icon size={12} /> {config.label}
                          </div>
                       </div>
                       <p className="task-row-desc">{t.description || "Aucun détail technique fourni."}</p>
                       <div className="task-row-meta">
                          {t.sprintNom ? <span className="m-tag"><RefreshCw size={12} /> {t.sprintNom}</span> : <span className="m-tag warning"><Layers size={12} /> Hors Sprint</span>}
                          {t.estimation && <span className="m-tag"><Clock size={12} /> {t.estimation}j</span>}
                          {prio && <span className="m-tag" style={{ color: prio.color }}>● {prio.label}</span>}
                       </div>
                    </div>
                    
                    <div className="task-row-ops">
                       {stageStatus !== 'VALIDE' && trans.map(tr => (
                         <button key={tr.statut} className={`op-btn-v2 ${tr.cls}`} onClick={() => {
                            mettreAJourTache(t.id, {statut: tr.statut})
                              .then(() => {
                                loadAll();
                                ClinisysAlert.success("Tâche mise à jour");
                              })
                              .catch(err => {
                                alertError(err.response?.data?.message || err.response?.data || "Erreur lors de la mise à jour");
                              });
                         }}>
                            <tr.icon size={14} /> <span>{tr.label}</span>
                         </button>
                       ))}
                       {stageStatus === 'VALIDE' && !isBacklog && (
                          <div className="status-fixed"><CheckCircle size={14} /> Statut Scellé</div>
                       )}
                       {isBacklog && (
                          <div className="backlog-ops-wrapper">
                             <div className="backlog-hint">Affectez cette tâche dans "Mes Sprints" <ArrowRight size={14} /></div>
                             {stageStatus !== 'VALIDE' && (
                                <button className="btn-delete-backlog" onClick={() => ClinisysAlert.confirm({
                                   title: "Supprimer la tâche",
                                   text: "Voulez-vous supprimer définitivement cette tâche du backlog ?",
                                   confirmText: "Supprimer",
                                   danger: true
                                }).then(res => res.isConfirmed && deleteTacheSimple(t.id).then(() => {
                                   loadAll();
                                   ClinisysAlert.success("Tâche supprimée du backlog");
                                }))}>
                                   <Trash2 size={16} />
                                </button>
                             )}
                          </div>
                       )}
                    </div>
                 </motion.div>
               );
             })}
          </div>
        )}

        <div style={{ visibility: 'hidden', height: 0 }}></div>

        <AnimatePresence>
          {showModal && (
            <div className="elite-modal-overlay">
               <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} className="elite-modal-card">
                  <div className="modal-header">
                     <h2>Task Formulation</h2>
                     <p>Stage : {stageSujet}</p>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); setSaving(true); creerTachePourStage({...form, stageId: Number(stageId)}).then(() => { setShowModal(false); loadAll(); ClinisysAlert.success("Tâche injectée"); }).catch(() => alertError("Erreur lors de l'injection")).finally(() => setSaving(false)); }} className="elite-manager-form">
                     <div className="form-group-v3">
                        <label>Désignation</label>
                        <input value={form.titre} onChange={f('titre')} required placeholder="Ex: Intégration du moteur de recherche..." />
                     </div>
                     <div className="form-group-v3">
                        <label>Spécifications</label>
                        <textarea value={form.description} onChange={f('description')} rows={3} placeholder="Détaillez les contraintes ou livrables..." />
                     </div>
                     <div className="grid-2">
                        <div className="form-group-v3">
                           <label>Priorité</label>
                           <select value={form.priorite} onChange={f('priorite')}>
                              {Object.keys(PRIORITE_CONFIG).map(k => <option key={k} value={k}>{PRIORITE_CONFIG[k].label}</option>)}
                           </select>
                        </div>
                        <div className="form-group-v3">
                           <label>Estimation (Jours)</label>
                           <input 
                             type="number" 
                             step="1" 
                             min="1"
                             value={form.estimation} 
                             onChange={f('estimation')} 
                             onKeyPress={(e) => { if(!/[0-9]/.test(e.key)) e.preventDefault(); }}
                             placeholder="2" 
                           />
                        </div>
                     </div>
                     <div className="modal-actions-v3">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                        <button type="submit" className="btn btn-primary elite-btn" disabled={saving}>Injecter au Backlog</button>
                     </div>
                  </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .elite-tasks-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
        .title-stack p { color: var(--text-3); font-size: 16px; margin-top: 4px; }
        
        .elite-mini-stat-v2 { background: var(--surface); border: 1.5px solid var(--border); border-radius: 20px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; min-width: 180px; }
        .stat-i { width: 34px; height: 34px; border-radius: 10px; color: #fff; display: flex; align-items: center; justify-content: center; }
        .stat-v .val { font-size: 22px; font-weight: 900; line-height: 1; }
        .stat-v .lbl { font-size: 10px; font-weight: 800; color: var(--text-3); text-transform: uppercase; margin-top: 2px; }

        .orchestrator-panel-elite { background: var(--surface); border: 1.5px solid var(--border); border-radius: 24px; padding: 24px; margin-bottom: 32px; display: flex; flex-direction: column; gap: 20px; }
        .search-wrap-elite { display: flex; align-items: center; gap: 12px; border-bottom: 1.5px solid var(--border); padding-bottom: 16px; }
        .search-wrap-elite input { flex: 1; border: none; background: none; font-weight: 800; font-size: 15px; color: var(--text); outline: none; }
        .filter-group-v3 { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .sub-group { display: flex; gap: 8px; }
        .v-sep { width: 1.5px; height: 24px; background: var(--border); }
        .pilot-chip { padding: 8px 16px; border-radius: 10px; border: 1.5px solid var(--border); background: var(--bg); color: var(--text-3); font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; white-space: nowrap; }
        .pilot-chip.active { background: var(--primary); border-color: var(--primary); color: #fff; }
        
        .tasks-dynamic-list { display: flex; flex-direction: column; gap: 12px; }
        .task-premium-row { background: var(--surface); border: 1.5px solid var(--border); border-radius: 20px; display: flex; padding: 20px 24px; gap: 24px; transition: 0.3s; position: relative; overflow: hidden; }
        .task-premium-row:hover { border-color: var(--primary); box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
        .task-premium-row.is-backlog { opacity: 0.8; background: var(--bg-alpha); border-style: dashed; }
        .prio-marker { width: 4px; height: 40px; border-radius: 2px; flex-shrink: 0; }
        .task-main-info { flex: 1; min-width: 0; }
        .task-row-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .task-row-top h3 { font-size: 16px; font-weight: 800; }
        .statut-tag { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 900; }
        .task-row-desc { font-size: 13px; color: var(--text-3); margin-bottom: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .task-row-meta { display: flex; gap: 16px; }
        .m-tag { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: var(--text-3); }
        .m-tag.warning { color: #f59e0b; }
        
        .task-row-ops { display: flex; align-items: center; gap: 10px; }
        .op-btn-v2 { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px; border: none; font-weight: 900; font-size: 12px; cursor: pointer; transition: 0.2s; }
        .op-btn-v2.btn-primary { background: var(--primary); color: #fff; }
        .op-btn-v2.btn-success { background: #10b981; color: #fff; }
        .op-btn-v2.btn-outline { background: var(--surface); border: 1.5px solid var(--border); color: var(--text-2); }
        .op-btn-v2:hover { transform: scale(1.05); }
        .backlog-ops-wrapper { display: flex; align-items: center; gap: 16px; flex: 1; justify-content: flex-end; }
        .backlog-hint { font-size: 11px; color: var(--text-3); display: flex; align-items: center; gap: 8px; font-style: italic; font-weight: 700; }
        .btn-delete-backlog { width: 40px; height: 40px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--surface); color: var(--text-3); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .btn-delete-backlog:hover { background: rgba(239,68,68,0.1); color: #ef4444; border-color: #ef4444; transform: scale(1.1); }

        .elite-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .elite-modal-card { background: var(--surface); width: 100%; max-width: 520px; border-radius: 28px; padding: 40px; box-shadow: 0 40px 100px rgba(0,0,0,0.2); }
        .modal-header h2 { font-size: 20px; font-weight: 900; }
        .modal-header p { color: var(--text-3); font-size: 14px; margin-top: 4px; }
        .elite-manager-form { display: flex; flex-direction: column; gap: 20px; margin-top: 24px; }
        .form-group-v3 label { display: block; font-size: 11px; font-weight: 900; color: var(--primary); text-transform: uppercase; margin-bottom: 8px; }
        .form-group-v3 input, .form-group-v3 select, .form-group-v3 textarea { width: 100%; padding: 14px 18px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--bg); font-size: 14px; font-weight: 700; outline: none; transition: 0.2s; }
        .form-group-v3 input:focus { border-color: var(--primary); background: #fff; }
        .modal-actions-v3 { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }

        .loader-center { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px; color: var(--text-3); font-weight: 700; }
        .icon-pulse { animation: iconPulse 2s infinite; color: var(--primary); margin-bottom: 24px; opacity: 0.2; }
        @keyframes iconPulse { 0% { opacity:0.1; transform:scale(0.9); } 50% { opacity:0.3; transform:scale(1.1); } 100% { opacity:0.1; transform:scale(0.9); } }
        .locked-badge-st-v2 { display: flex; align-items: center; gap: 8px; padding: 10px 24px; background: var(--bg-alpha); color: var(--text-3); border-radius: 14px; font-size: 11px; font-weight: 900; letter-spacing: 1px; border: 1.5px solid var(--border); }
        .status-fixed { font-size: 11px; font-weight: 800; color: var(--text-3); display: flex; align-items: center; gap: 6px; }
      ` }} />
    </div>
  );
}
