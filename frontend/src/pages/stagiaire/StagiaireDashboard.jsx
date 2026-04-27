import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/common/Sidebar';
import Topbar  from '../../components/common/Topbar';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getTachesByStagiaire }   from '../../api/tacheAPI';
import { getMoyenne, getEvalsByStagiaire } from '../../api/evaluationAPI';
import { getStagesByStagiaire }   from '../../api/stageAPI';
import { getMonChoix }            from '../../api/sujetAPI';
import { useSession }             from '../../context/SessionContext';
import {
  LayoutDashboard, FileText, RefreshCw, CheckSquare, Star,
  Calendar, Zap, AlertTriangle, ChevronRight, Activity, Clock, Briefcase, Award, User, Sparkles, ArrowRight, Rocket, Layers, BookOpen
} from 'lucide-react';

const NAV = [
  { path: '/stagiaire/dashboard',   icon: <LayoutDashboard size={18} />, label: 'Mon espace'      },
  { path: '/stagiaire/sujets',      icon: <FileText size={18} />, label: 'Sujets'          },
  { path: '/stagiaire/sprints',     icon: <RefreshCw size={18} />, label: 'Mes sprints'     },
  { path: '/stagiaire/taches',      icon: <CheckSquare size={18} />, label: 'Mes tâches'      },
  { path: '/stagiaire/reunions',    icon: <Calendar size={18} />, label: 'Mes réunions'    },
  { path: '/stagiaire/evaluations', icon: <Star size={18} />, label: 'Mes évaluations' },
];

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="elite-stat-card-stagiaire"
      style={{ '--stat-color': color }}
    >
      <div className="stat-icon-box">
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
      <div className="stat-glow"></div>
    </motion.div>
  );
}

export default function StagiaireDashboard() {
  const { user }        = useAuth();
  const { sidebarMini } = useTheme();
  const { activeSession } = useSession();
  const navigate        = useNavigate();

  const [taches,   setTaches]   = useState([]);
  const [stage,    setStage]    = useState(null);
  const [moyenne,  setMoyenne]  = useState(null);
  const [monChoix, setMonChoix] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (user?.id) load();
  }, [user, activeSession]);

  const load = async () => {
    setLoading(true);
    try {
      const [tachesRes, stagesRes, evalsRes, choixRes] = await Promise.all([
        getTachesByStagiaire(user.id).catch(() => ({ data: [] })),
        getStagesByStagiaire(user.id).catch(() => ({ data: [] })),
        getEvalsByStagiaire(user.id).catch(() => ({ data: [] })),
        getMonChoix(user.id).catch(() => ({ data: null })),
      ]);
      const sessionStr = String(activeSession);
      const filteredTaches = (tachesRes.data || []).filter(t => !t.annee || String(t.annee) === sessionStr);
      setTaches(filteredTaches);

      const stages = (stagesRes.data || []).filter(s => !s.annee || String(s.annee) === sessionStr);
      setStage(stages[0] || null);

      const filteredEvals = (evalsRes.data || []).filter(e => !e.annee || String(e.annee) === sessionStr);
      if (filteredEvals.length > 0) {
        const sum = filteredEvals.reduce((acc, curr) => acc + (curr.noteGlobale || 0), 0);
        setMoyenne(sum / filteredEvals.length);
      } else {
        setMoyenne(null);
      }
      setMonChoix(choixRes.data || null);
    } catch (err) {
      console.error("Erreur de chargement du dashboard:", err);
    }
    finally { setLoading(false); }
  };

  const tasksOverview = {
    termine:  taches.filter(t => t.statut === 'TERMINE').length,
    enCours:  taches.filter(t => t.statut === 'EN_COURS').length,
    aFaire:   taches.filter(t => t.statut === 'A_FAIRE').length,
    attente:  taches.filter(t => t.statut === 'EN_ATTENTE_VALIDATION').length,
  };

  const getMention = (note) => {
    if (!note) return { label: 'En attente', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
    if (note >= 16) return { label: 'Excellent',  color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    if (note >= 14) return { label: 'Très Bien',   color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
    if (note >= 12) return { label: 'Bien',        color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' };
    if (note >= 10) return { label: 'Passable',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    return { label: 'Insuffisant', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
  };

  const mention = getMention(moyenne);

  return (
    <div className={`app-layout ${sidebarMini ? 'sidebar-mini' : ''}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      
      <main className="main-content fade-in">
        <header className="elite-stagiaire-hero">
           <div className="hero-left">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                 <div className="hero-badge"><Zap size={14} /> PERSPECTIVE CARRIÈRE</div>
                 <h1 className="gradient-text">Bienvenue, {user?.prenom} <Rocket size={28} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 8 }} /></h1>
                 <p>Votre tableau de bord centralisé pour piloter vos projets et vos performances.</p>
              </motion.div>
           </div>
           
           {!loading && !monChoix && !stage && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} 
               animate={{ opacity: 1, scale: 1 }}
               className="onboarding-callout"
             >
                <div className="callout-icon"><AlertTriangle size={24} /></div>
                <div className="callout-body">
                   <h4>Sujet non sélectionné</h4>
                   <p>Consultez les offres de stage disponibles pour démarrer votre parcours.</p>
                </div>
                <button className="btn-callout" onClick={() => navigate('/stagiaire/sujets')}>
                  Choisir <ChevronRight size={16} />
                </button>
             </motion.div>
           )}

           {!loading && monChoix && !stage && (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="onboarding-callout info">
                <div className="callout-icon"><Clock size={24} /></div>
                <div className="callout-body">
                   <h4>En attente d'affectation</h4>
                   <p>Sujet choisi : <strong>{monChoix.sujetTitre}</strong>. Le responsable valide votre dossier.</p>
                </div>
                <button className="btn-callout" onClick={() => navigate('/stagiaire/sujets')}>Détails</button>
             </motion.div>
           )}
        </header>

        {/* TASK KPIs */}
        <div className="grid-4 mb-5">
           <StatCard icon={CheckSquare} label="Tâches Finies" value={loading ? '...' : tasksOverview.termine} color="#10b981" delay={0.1} />
           <StatCard icon={Activity} label="En Cours" value={loading ? '...' : tasksOverview.enCours} color="#6366f1" delay={0.2} />
           <StatCard icon={Layers} label="À Faire" value={loading ? '...' : tasksOverview.aFaire} color="#94a3b8" delay={0.3} />
           <StatCard icon={Clock} label="En Validation" value={loading ? '...' : tasksOverview.attente} color="#f59e0b" delay={0.4} />
        </div>

        <div className="stagiaire-main-grid">
           {/* MY INTERNSHIP */}
            <div className="premium-card internship-details-card">
              <div className="card-header-v2">
                 <div className="title-box">
                    <Briefcase size={20} className="text-primary" />
                    <h3>{stage?.statut === 'VALIDE' ? 'Stage Terminé' : 'Mon Stage Actif'}</h3>
                 </div>
                 {stage?.statut !== 'VALIDE' && (
                   <button className="text-link-btn" onClick={() => navigate('/stagiaire/sprints')}>
                     Voir Roadmap <ChevronRight size={16} />
                   </button>
                 )}
              </div>

              {loading ? (
                <div className="skeleton-loader h-150"></div>
              ) : stage ? (
                <div className="stage-info-content">
                   <div className="stage-header-flex">
                      <h4 className="stage-sujet-title">{stage.sujet}</h4>
                      {stage.statut === 'VALIDE' && (
                        <div className="completion-badge-v2">
                           <Award size={16} /> VALIDÉ
                        </div>
                      )}
                   </div>
                   
                   <div className="stage-meta-hub">
                      <div className="meta-item-elite">
                         <div className="m-icon"><User size={16} /></div>
                         <div className="m-body">
                            <span className="m-label">Encadrant</span>
                            <span className="m-val">{stage.encadrantPrenom} {stage.encadrantNom}</span>
                         </div>
                      </div>
                      <div className="meta-item-elite">
                         <div className="m-icon"><Calendar size={16} /></div>
                         <div className="m-body">
                            <span className="m-label">Période du Stage</span>
                            <span className="m-val">{stage.dateDebut} → {stage.dateFin}</span>
                         </div>
                      </div>
                   </div>

                   {stage.statut === 'VALIDE' ? (
                     <div className="congrats-banner-elite">
                        <div className="c-icon"><Sparkles size={24} /></div>
                        <div className="c-text">
                           <strong>Félicitations !</strong>
                           <p>Votre stage a été validé avec succès. Vous pouvez désormais consulter votre bulletin final.</p>
                        </div>
                        <button className="btn-mini-view" onClick={() => navigate('/stagiaire/evaluations')}>Voir Notes</button>
                     </div>
                   ) : (
                     <div className="stage-progress-hub">
                        <div className="p-head">
                           <span>Avancement Global</span>
                           <span className="p-val">{Math.round(stage.tauxAvancement || 0)}%</span>
                        </div>
                        <div className="p-track">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${stage.tauxAvancement || 0}%` }}
                             transition={{ duration: 1.5, ease: 'easeOut' }}
                             className="p-fill" 
                           />
                        </div>
                     </div>
                   )}
                </div>
              ) : (
                <div className="empty-stage-placeholder">
                   <div className="p-icon"><BookOpen size={48} opacity={0.1} /></div>
                   <p>Aucun stage actif détecté pour votre profil.</p>
                </div>
              )}
            </div>

           {/* MY PERFORMANCE */}
           <div className="premium-card performance-card">
              <div className="card-header-v2">
                 <div className="title-box">
                    <Award size={20} className="text-primary" />
                    <h3>Ma Performance</h3>
                 </div>
              </div>

              {loading ? (
                <div className="skeleton-loader circle"></div>
              ) : (
                <div className="perf-content">
                   <div className="grade-ring-container">
                      <svg className="grade-svg" viewBox="0 0 100 100">
                         <circle className="circle-bg" cx="50" cy="50" r="45" />
                         <motion.circle 
                           className="circle-fill" 
                           cx="50" cy="50" r="45" 
                           strokeDasharray="283"
                           initial={{ strokeDashoffset: 283 }}
                           animate={{ strokeDashoffset: 283 - (283 * (moyenne || 0)) / 20 }}
                           transition={{ duration: 2, ease: "easeOut" }}
                           style={{ stroke: mention.color }}
                         />
                      </svg>
                      <div className="score-abs">
                         <span className="val">{moyenne ? Number(moyenne).toFixed(1) : '—'}</span>
                         <span className="base">/20</span>
                      </div>
                   </div>

                   <div className="mention-badge-elite" style={{ background: mention.bg, color: mention.color }}>
                      {mention.label}
                   </div>

                   <p className="perf-status-desc">
                      {taches.length > 0 
                        ? `Basé sur ${taches.length} indicateurs de performance.` 
                        : "Aucune évaluation n'a encore été soumise."}
                   </p>

                   <button className="btn btn-outline full-width mt-4" onClick={() => navigate('/stagiaire/evaluations')}>
                      Voir mon bulletin <ArrowRight size={16} />
                   </button>
                </div>
              )}
           </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .elite-stagiaire-hero { 
          display: flex; justify-content: space-between; align-items: center; 
          margin-bottom: 40px; background: var(--surface); padding: 40px; 
          border-radius: 32px; border: 1.5px solid var(--border); 
        }
        .hero-badge { 
          display: flex; align-items: center; gap: 8px; font-size: 11px; 
          font-weight: 900; color: var(--primary); letter-spacing: 2px; 
          background: var(--primary-light-alpha); padding: 6px 14px; 
          border-radius: 8px; margin-bottom: 16px; width: fit-content;
        }
        .elite-stagiaire-hero p { color: var(--text-3); font-size: 16px; margin-top: 8px; }

        .onboarding-callout {
          display: flex; align-items: center; gap: 20px; padding: 24px;
          background: rgba(245,158,11,0.08); border: 1.5px solid rgba(245,158,11,0.2);
          border-radius: 20px; max-width: 450px;
        }
        .onboarding-callout.info { background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.2); }
        .callout-icon { width: 48px; height: 48px; border-radius: 14px; background: #fff; display: flex; align-items: center; justify-content: center; color: #f59e0b; }
        .info .callout-icon { color: #6366f1; }
        .callout-body h4 { font-size: 15px; font-weight: 900; color: var(--text); }
        .callout-body p { font-size: 13px; color: var(--text-3); font-weight: 600; margin-top: 3px; }
        .btn-callout { background: #fff; border: 1.5px solid var(--border); padding: 8px 16px; border-radius: 10px; font-weight: 900; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .btn-callout:hover { background: var(--bg); border-color: var(--primary); color: var(--primary); }

        .elite-stat-card-stagiaire {
          background: var(--surface); border: 1.5px solid var(--border); padding: 24px;
          border-radius: 24px; position: relative; overflow: hidden; display: flex; align-items: center; gap: 20px;
        }
        .stat-icon-box { width: 50px; height: 50px; border-radius: 14px; background: color-mix(in srgb, var(--stat-color) 12%, transparent); color: var(--stat-color); display: flex; align-items: center; justify-content: center; }
        .stat-content { display: flex; flex-direction: column; }
        .stat-label { font-size: 12px; font-weight: 800; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 24px; font-weight: 900; color: var(--text); }

        .stagiaire-main-grid { display: grid; grid-template-columns: 1fr 380px; gap: 32px; }
        .card-header-v2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .title-box { display: flex; align-items: center; gap: 12px; }
        .title-box h3 { font-size: 18px; font-weight: 900; color: var(--text); }
        .text-link-btn { background: none; border: none; font-size: 13px; font-weight: 800; color: var(--primary); cursor: pointer; display: flex; align-items: center; gap: 6px; }

        .internship-details-card { padding: 32px; }
        .stage-sujet-title { font-size: 20px; font-weight: 900; color: var(--text); margin-bottom: 24px; line-height: 1.4; }
        .stage-meta-hub { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px; }
        .meta-item-elite { display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg); border-radius: 16px; }
        .m-icon { width: 36px; height: 36px; border-radius: 10px; background: #fff; display: flex; align-items: center; justify-content: center; color: var(--primary); border: 1px solid var(--border); }
        .m-body { display: flex; flex-direction: column; }
        .m-label { font-size: 10px; font-weight: 800; color: var(--text-3); text-transform: uppercase; }
        .m-val { font-size: 14px; font-weight: 800; color: var(--text-2); }

        .stage-progress-hub { padding-top: 32px; border-top: 1.5px dashed var(--border); }
        .p-head { display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; color: var(--text-2); margin-bottom: 12px; }
        .p-track { height: 10px; background: var(--border); border-radius: 10px; overflow: hidden; }
        .p-fill { height: 100%; background: linear-gradient(90deg, var(--primary) 0%, #8b5cf6 100%); border-radius: 10px; }

        .performance-card { padding: 32px; text-align: center; }
        .grade-ring-container { position: relative; width: 180px; height: 180px; margin: 0 auto 24px; }
        .grade-svg { transform: rotate(-90deg); }
        .circle-bg { fill: none; stroke: var(--bg); stroke-width: 8; }
        .circle-fill { fill: none; stroke-width: 8; stroke-linecap: round; }
        .score-abs { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .score-abs .val { font-size: 40px; font-weight: 900; color: var(--text); line-height: 1; }
        .score-abs .base { font-size: 16px; color: var(--text-3); font-weight: 800; margin-top: 4px; }

        .mention-badge-elite { display: inline-block; padding: 6px 20px; border-radius: 20px; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
        .perf-status-desc { font-size: 13px; color: var(--text-3); font-weight: 600; line-height: 1.5; }

        .full-width { width: 100%; justify-content: center; gap: 10px; padding: 14px; border-radius: 14px; }
        .empty-stage-placeholder { padding: 60px 0; text-align: center; color: var(--text-3); }
        .empty-stage-placeholder .p-icon { margin-bottom: 16px; }

        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); } 70% { box-shadow: 0 0 0 8px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }

        .stage-header-flex { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
        .completion-badge-v2 { display: flex; align-items: center; gap: 8px; padding: 6px 16px; background: #10b981; color: #fff; border-radius: 12px; font-size: 12px; font-weight: 900; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
        .congrats-banner-elite { display: flex; align-items: center; gap: 24px; padding: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1.5px solid #10b981; border-radius: 20px; margin-top: 10px; }
        .c-icon { width: 56px; height: 56px; border-radius: 16px; background: #fff; display: flex; align-items: center; justify-content: center; color: #10b981; box-shadow: 0 8px 20px rgba(16,185,129,0.2); }
        .c-text strong { display: block; font-size: 18px; color: #065f46; margin-bottom: 4px; }
        .c-text p { font-size: 14px; color: #065f46; opacity: 0.8; line-height: 1.5; margin: 0; }
        .btn-mini-view { margin-left: auto; background: #fff; border: 1.5px solid #10b981; padding: 10px 20px; border-radius: 12px; font-weight: 900; color: #10b981; cursor: pointer; transition: 0.2s; white-space: nowrap; }
        .btn-mini-view:hover { background: #10b981; color: #fff; }
      ` }} />
    </div>
  );
}