import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/common/Sidebar';
import Topbar  from '../../components/common/Topbar';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getStatsByEncadrant } from '../../api/dashboardAPI';
import { getStagesByEncadrant } from '../../api/stageAPI';
import { 
  Users, Briefcase, Star, LayoutGrid, 
  ArrowRight, Award, Clock, ChevronRight,
  TrendingUp, Calendar, RefreshCw, Mail
} from 'lucide-react';

const NAV = [
  { path: '/encadrant/dashboard',   icon: '⊞', label: 'Tableau de bord' },
  { path: '/encadrant/stages',      icon: '📋', label: 'Mes stages'      },
  { path: '/encadrant/reunions',    icon: '📅', label: 'Réunions'        },
  { path: '/encadrant/evaluations', icon: '⭐', label: 'Évaluations'     },
];

function PremiumStatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="elite-stat-card"
      style={{ '--stat-color': color }}
    >
      <div className="stat-icon-wrapper">
        <Icon size={24} />
      </div>
      <div className="stat-body">
        <label>{label}</label>
        <div className="val">{value ?? "—"}</div>
      </div>
      <div className="stat-bg-blob"></div>
    </motion.div>
  );
}

export default function EncadrantDashboard() {
  const { user }        = useAuth();
  const { sidebarMini } = useTheme();
  const navigate        = useNavigate();

  const [stats,   setStats]   = useState(null);
  const [stages,  setStages]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, stRes] = await Promise.all([
        getStatsByEncadrant(user.id),
        getStagesByEncadrant(user.id)
      ]);
      setStats(sRes.data);
      setStages(stRes.data);
    } catch (err) {
      console.error("Dashboard error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app-layout ${sidebarMini ? 'sidebar-mini' : ''}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      
      <main className="main-content fade-in">
        {/* HERO SECTION */}
        <header className="elite-hero-banner">
          <div className="hero-content">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
             >
               <span className="welcome-tag">ESPACE ENCADRANT ELITE</span>
               <h1 className="gradient-text">Bonjour, {user?.prenom} 👋</h1>
               <p>Pilotez vos stages avec précision et accompagnez vos talents vers l'excellence.</p>
             </motion.div>
             <div className="hero-actions">
                <button className="btn btn-primary elite-btn" onClick={() => navigate('/encadrant/stages')}>
                  <LayoutGrid size={18} />
                  <span>Mon Hub de Stages</span>
                </button>
             </div>
          </div>
        </header>

        {/* STATS GRID */}
        <div className="stats-grid" style={{ marginBottom: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
           <PremiumStatCard 
             icon={Users} 
             label="Mes Stagiaires" 
             value={loading ? '...' : stats?.nbStagiaires} 
             color="#6366f1" 
             delay={0.1} 
           />
           <PremiumStatCard 
             icon={Briefcase} 
             label="Stages Actifs" 
             value={loading ? '...' : stats?.nbStagesEnCours} 
             color="#10b981" 
             delay={0.2} 
           />
           <PremiumStatCard 
             icon={Star} 
             label="Satisfaction" 
             value={loading ? '...' : stats?.moyenneEvaluations ? `${Number(stats.moyenneEvaluations).toFixed(1)}/20` : '—'} 
             color="#8b5cf6" 
             delay={0.3} 
           />
           <PremiumStatCard 
             icon={TrendingUp} 
             label="Total Dossiers" 
             value={loading ? '...' : stages.length} 
             color="#f59e0b" 
             delay={0.4} 
           />
        </div>

        {/* FEED & ACTIVE TALENTS */}
        <div className="grid-analytics-layout">
           <div className="active-talents-section">
              <div className="section-header">
                 <div className="title-box">
                    <Award size={20} className="text-primary" />
                    <h3>Stages prioritaires</h3>
                 </div>
                 <button className="text-link-btn" onClick={() => navigate('/encadrant/stages')}>
                   Tout voir <ChevronRight size={16} />
                 </button>
              </div>

              <div className="talent-cards-grid">
                {loading ? (
                  <div className="loading-placeholder">Extraction des données...</div>
                ) : stages.length === 0 ? (
                  <div className="empty-talents">
                    <Clock size={48} opacity={0.2} />
                    <p>Aucun stage actif sous votre supervision.</p>
                  </div>
                ) : (
                  stages.slice(0, 4).map((s, idx) => (
                    <motion.div 
                      key={s.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * idx }}
                      className="talent-card-premium"
                      onClick={() => navigate(`/encadrant/sprints/${s.id}`)}
                    >
                      <div className="card-top">
                         <div className="stagiaire-profile">
                            <div className="avatar-med">{s.stagiairePrenom[0]}</div>
                            <div className="info">
                               <div className="name">{s.stagiairePrenom} {s.stagiaireNom}</div>
                               <div className="label">Principal</div>
                            </div>
                         </div>
                         <div className="progress-ring-box">
                            <svg className="p-ring" width="44" height="44">
                               <circle className="p-ring-bg" cx="22" cy="22" r="18" />
                               <circle 
                                 className="p-ring-fill" 
                                 cx="22" cy="22" r="18" 
                                 strokeDasharray={113}
                                 strokeDashoffset={113 - (113 * (s.tauxAvancement || 0)) / 100}
                               />
                            </svg>
                            <span className="p-val">{Math.round(s.tauxAvancement || 0)}%</span>
                         </div>
                      </div>

                      <div className="card-body">
                         <div className="sujet-title">{s.sujet}</div>
                         {s.stagiaire2Id && (
                           <div className="binome-tag">
                             <Users size={12} /> Binôme: {s.stagiaire2Prenom}
                           </div>
                         )}
                      </div>

                      <div className="card-footer">
                         <div className="kpi">
                            <Calendar size={14} />
                            <span>{s.nbSprints} Sprints</span>
                         </div>
                         <button className="mini-go-btn"><ArrowRight size={16} /></button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
           </div>

           <div className="right-panel">
              <div className="premium-card quick-links-card">
                 <h3 className="panel-title">Accès Rapides</h3>
                 <div className="quick-grid">
                    <button onClick={() => navigate('/encadrant/reunions')} className="q-link">
                       <div className="q-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}><Calendar size={20} /></div>
                       <span>Planifier réunion</span>
                    </button>
                    <button onClick={() => navigate('/encadrant/evaluations')} className="q-link">
                       <div className="q-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><Star size={20} /></div>
                       <span>Noter un stage</span>
                    </button>
                    <button onClick={() => navigate('/mon-profil')} className="q-link">
                       <div className="q-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Mail size={20} /></div>
                       <span>Contacter support</span>
                    </button>
                 </div>
              </div>

              <div className="premium-card system-status">
                 <div className="pulse-box">
                    <div className="pulse-dot"></div>
                    <span>Plateforme Opérationnelle</span>
                 </div>
                 <p>Monitoring temps réel des serveurs Clinisys activé.</p>
              </div>
           </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .elite-hero-banner {
          margin-bottom: 40px; padding: 40px; border-radius: 32px;
          background: var(--surface); border: 1.5px solid var(--border);
          position: relative; overflow: hidden;
        }
        .welcome-tag {
          font-size: 11px; font-weight: 900; color: var(--primary); letter-spacing: 2px;
          background: var(--primary-light-alpha); padding: 6px 14px; border-radius: 8px;
          margin-bottom: 16px; display: inline-block;
        }
        .elite-hero-banner p { color: var(--text-3); font-size: 16px; margin-top: 8px; }
        .hero-content { display: flex; justify-content: space-between; align-items: flex-end; }
        .elite-btn {
          display: flex; align-items: center; gap: 12px; padding: 18px 36px;
          border-radius: 18px; font-weight: 800; box-shadow: 0 10px 25px -5px var(--primary-light-alpha);
        }

        .elite-stat-card {
          background: var(--surface); border: 1.5px solid var(--border); padding: 24px;
          border-radius: 24px; display: flex; align-items: center; gap: 20px;
          position: relative; overflow: hidden; transition: all 0.3s;
        }
        .elite-stat-card:hover { transform: translateY(-5px); border-color: var(--stat-color); }
        .stat-icon-wrapper {
          width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center;
          justify-content: center; background: color-mix(in srgb, var(--stat-color) 10%, transparent);
          color: var(--stat-color); z-index: 1;
        }
        .stat-body { z-index: 1; }
        .stat-body label { font-size: 12px; font-weight: 800; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-body .val { font-size: 24px; font-weight: 900; color: var(--text); margin-top: 4px; }
        .stat-bg-blob {
          position: absolute; width: 80px; height: 80px; background: var(--stat-color);
          opacity: 0.03; border-radius: 50%; right: -20px; bottom: -20px; z-index: 0;
        }

        .grid-analytics-layout { display: grid; grid-template-columns: 1fr 380px; gap: 32px; margin-bottom: 60px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .title-box { display: flex; align-items: center; gap: 12px; }
        .title-box h3 { font-size: 20px; font-weight: 900; color: var(--text); }
        .text-link-btn { background: none; border: none; color: var(--primary); font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer; }

        .talent-cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .talent-card-premium {
          background: var(--surface); border: 1.5px solid var(--border); padding: 24px;
          border-radius: 24px; cursor: pointer; transition: all 0.3s;
        }
        .talent-card-premium:hover { border-color: var(--primary); transform: scale(1.02); box-shadow: 0 15px 35px rgba(0,0,0,0.05); }
        
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .stagiaire-profile { display: flex; align-items: center; gap: 12px; }
        .avatar-med { width: 44px; height: 44px; border-radius: 14px; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; }
        .stagiaire-profile .name { font-weight: 800; color: var(--text); font-size: 15px; }
        .stagiaire-profile .label { font-size: 11px; color: var(--text-3); font-weight: 700; text-transform: uppercase; }

        .progress-ring-box { position: relative; width: 44px; height: 44px; }
        .p-ring-bg { fill: none; stroke: var(--border); stroke-width: 4; }
        .p-ring-fill { fill: none; stroke: var(--primary); stroke-width: 4; stroke-linecap: round; transform: rotate(-90deg); transform-origin: center; transition: stroke-dashoffset 1s ease; }
        .p-val { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; }

        .sujet-title { font-weight: 700; color: var(--text-2); font-size: 14px; line-height: 1.4; margin-bottom: 12px; height: 40px; overflow: hidden; }
        .binome-tag { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #7c3aed; font-weight: 700; background: rgba(124,58,237,0.05); padding: 4px 10px; border-radius: 8px; width: fit-content; }

        .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 16px; border-top: 1px dashed var(--border); }
        .kpi { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-3); font-weight: 700; }
        .mini-go-btn { width: 32px; height: 32px; border-radius: 10px; border: none; background: var(--bg); color: var(--primary); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .talent-card-premium:hover .mini-go-btn { background: var(--primary); color: #fff; }

        .quick-links-card { padding: 32px; }
        .panel-title { font-size: 18px; font-weight: 900; margin-bottom: 24px; color: var(--text); }
        .quick-grid { display: flex; flex-direction: column; gap: 12px; }
        .q-link {
          display: flex; align-items: center; gap: 16px; padding: 12px; border-radius: 16px;
          border: 1.5px solid transparent; background: var(--bg); cursor: pointer; transition: all 0.2s;
          text-align: left; width: 100%;
        }
        .q-link:hover { background: var(--surface); border-color: var(--border); transform: translateX(8px); }
        .q-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .q-link span { font-weight: 800; font-size: 14px; color: var(--text-2); }

        .system-status { margin-top: 20px; padding: 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; border: none; }
        .pulse-box { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 13px; margin-bottom: 8px; }
        .pulse-dot { width: 10px; height: 10px; background: #fff; border-radius: 50%; box-shadow: 0 0 0 rgba(255,255,255,0.4); animation: pulse 1.5s infinite; }
        .system-status p { font-size: 12px; opacity: 0.8; font-weight: 600; line-height: 1.4; }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        
        .loading-placeholder, .empty-talents {
           grid-column: span 2; padding: 60px; text-align: center; color: var(--text-3); font-weight: 700;
        }
      ` }} />
    </div>
  );
}