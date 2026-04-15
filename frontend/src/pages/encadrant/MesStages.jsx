import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/common/Sidebar";
import Topbar from "../../components/common/Topbar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getStagesByEncadrant } from "../../api/stageAPI";
import { 
  Briefcase, Users, Calendar, Search, 
  Filter, ArrowRight, CheckCircle, Clock, 
  AlertCircle, ChevronRight, Layers, Target
} from 'lucide-react';

const NAV = [
  { path: "/encadrant/dashboard", icon: "⊞", label: "Tableau de bord" },
  { path: "/encadrant/stages", icon: "📋", label: "Mes stages" },
  { path: "/encadrant/reunions", icon: "📅", label: "Réunions" },
  { path: "/encadrant/evaluations", icon: "⭐", label: "Évaluations" },
];

const STATUT_CONFIG = {
  EN_COURS: { label: "En cours", color: "#6366f1", bg: "rgba(99,102,241,0.1)", icon: Clock },
  VALIDE: { label: "Validé", color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: CheckCircle },
  INTERROMPU: { label: "Interrompu", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: AlertCircle },
  EN_ATTENTE: { label: "En attente", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: Clock },
};

const MesStages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sidebarMini } = useTheme();

  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (user?.id) loadStages();
  }, [user]);

  const loadStages = async () => {
    setLoading(true);
    try {
      const { data } = await getStagesByEncadrant(user.id);
      setStages(data);
    } catch (err) {
      console.error("Failed to load stages", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStages = stages.filter(s => {
    const matchesSearch = s.sujet?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.stagiaireNom?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "ALL" || s.statut === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      
      <main className="main-content fade-in">
        {/* ELITE HEADER */}
        <header className="elite-hub-header">
           <div className="header-info">
              <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}>
                 <div className="hub-badge"><Briefcase size={14} /> CATALOGUE DE PROJETS</div>
                 <h1 className="gradient-text">Mes Hubs de Stages</h1>
                 <p>Gérez et suivez l'évolution des {stages.length} projets sous votre supervision.</p>
              </motion.div>
           </div>
           
           <div className="header-controls">
              <div className="search-pill">
                 <Search size={18} />
                 <input 
                   placeholder="Rechercher un stagiaire ou sujet..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="filter-pill">
                 <Filter size={18} />
                 <select value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="ALL">Tous les statuts</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="VALIDE">Validés</option>
                    <option value="EN_ATTENTE">En attente</option>
                 </select>
              </div>
           </div>
        </header>

        {loading ? (
          <div className="loading-grid">
             {[1,2,3].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        ) : filteredStages.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state-elite">
             <div className="empty-icon-box">
                <Layers size={64} />
             </div>
             <h3>Aucun dossier trouvé</h3>
             <p>Ajustez vos filtres ou contactez le responsable pour plus d'informations.</p>
          </motion.div>
        ) : (
          <div className="stages-grid-hub">
            <AnimatePresence>
              {filteredStages.map((s, idx) => {
                const config = STATUT_CONFIG[s.statut] || STATUT_CONFIG.EN_ATTENTE;
                const StatusIcon = config.icon;
                
                return (
                  <motion.div 
                    layout
                    key={s.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    className="stage-card-elite"
                  >
                    <div className="card-top">
                       <span className="type-badge">{s.type}</span>
                       <div className="status-pill" style={{ '--st-color': config.color, background: config.bg }}>
                          <StatusIcon size={14} />
                          <span>{config.label}</span>
                       </div>
                    </div>

                    <div className="card-body">
                       <h3 className="sujet-name">{s.sujet}</h3>
                       
                       <div className="profiles-box">
                          <div className="profile-item">
                             <div className="avatar-mini">{s.stagiairePrenom[0]}</div>
                             <div className="p-info">
                                <span className="p-name">{s.stagiairePrenom} {s.stagiaireNom}</span>
                                <span className="p-label">Principal</span>
                             </div>
                          </div>
                          {s.stagiaire2Id && (
                            <div className="profile-item binome">
                               <div className="avatar-mini purple">{s.stagiaire2Prenom[0]}</div>
                               <div className="p-info">
                                  <span className="p-name">{s.stagiaire2Prenom} {s.stagiaire2Nom}</span>
                                  <span className="p-label">Binôme</span>
                               </div>
                            </div>
                          )}
                       </div>

                       <div className="meta-lines">
                          <div className="meta-item">
                             <Calendar size={14} />
                             <span>{s.dateDebut} — {s.dateFin}</span>
                          </div>
                          <div className="meta-item">
                             <Layers size={14} />
                             <span>{s.nbSprints} cycles sprint planifiés</span>
                          </div>
                       </div>

                       <div className="progress-section">
                          <div className="prog-header">
                             <span>Progression du Stage</span>
                             <span>{Math.round(s.tauxAvancement || 0)}%</span>
                          </div>
                          <div className="prog-bar-bg">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${s.tauxAvancement || 0}%` }}
                               transition={{ duration: 1.5, ease: "easeOut" }}
                               className="prog-bar-fill" 
                             />
                          </div>
                       </div>
                    </div>

                    <div className="card-actions">
                       <button 
                         className="action-btn primary-ghost"
                         onClick={() => navigate(`/encadrant/sprints/${s.id}`)}
                       >
                          <Target size={16} />
                          <span>Gérer Sprints</span>
                       </button>
                       <button 
                         className="action-btn secondary-ghost"
                         onClick={() => navigate(`/encadrant/taches/${s.id}`)}
                       >
                          <CheckCircle size={16} />
                          <span>Tâches</span>
                       </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .elite-hub-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1.5px solid var(--border);
        }
        .hub-badge {
          display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 900;
          color: var(--primary); letter-spacing: 1.5px; margin-bottom: 12px;
        }
        .header-info p { color: var(--text-3); font-size: 16px; margin-top: 4px; }

        .header-controls { display: flex; gap: 16px; }
        .search-pill {
          display: flex; align-items: center; gap: 12px; background: var(--surface);
          border: 1.5px solid var(--border); padding: 12px 20px; border-radius: 16px;
          min-width: 320px; transition: all 0.3s;
        }
        .search-pill:focus-within { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-light-alpha); }
        .search-pill input { border: none; background: none; font-weight: 600; font-size: 14px; width: 100%; color: var(--text); outline: none; }
        
        .filter-pill {
          display: flex; align-items: center; gap: 10px; background: var(--surface);
          border: 1.5px solid var(--border); padding: 12px 18px; border-radius: 16px;
        }
        .filter-pill select { border: none; background: none; font-weight: 700; color: var(--text-2); outline: none; cursor: pointer; }

        .stages-grid-hub { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 32px; }
        
        .stage-card-elite {
          background: var(--surface); border: 1.5px solid var(--border); border-radius: 28px;
          padding: 28px; transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1); position: relative;
        }
        .stage-card-elite:hover { transform: translateY(-8px); border-color: var(--primary); box-shadow: 0 20px 40px rgba(0,0,0,0.06); }

        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .type-badge { font-size: 11px; font-weight: 900; color: var(--primary); background: var(--primary-light-alpha); padding: 4px 12px; border-radius: 8px; text-transform: uppercase; }
        .status-pill { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 12px; font-size: 12px; font-weight: 800; color: var(--st-color); }

        .sujet-name { font-size: 18px; font-weight: 900; color: var(--text); line-height: 1.4; margin-bottom: 24px; min-height: 50px; }

        .profiles-box { display: flex; gap: 16px; padding: 16px; background: var(--bg); border-radius: 20px; margin-bottom: 24px; }
        .profile-item { display: flex; align-items: center; gap: 10px; }
        .avatar-mini { width: 32px; height: 32px; border-radius: 10px; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; }
        .avatar-mini.purple { background: #8b5cf6; }
        .p-info { display: flex; flex-direction: column; }
        .p-name { font-size: 13px; font-weight: 800; color: var(--text); }
        .p-label { font-size: 10px; font-weight: 700; color: var(--text-3); text-transform: uppercase; }

        .meta-lines { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
        .meta-item { display: flex; align-items: center; gap: 10px; color: var(--text-3); font-size: 13px; font-weight: 600; }

        .progress-section { margin-bottom: 32px; }
        .prog-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: var(--text-2); margin-bottom: 8px; }
        .prog-bar-bg { width: 100%; height: 8px; background: var(--border); border-radius: 10px; overflow: hidden; }
        .prog-bar-fill { height: 100%; background: var(--primary); border-radius: 10px; }

        .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border-top: 1.5px solid var(--border); padding-top: 24px; }
        .action-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 12px; border-radius: 14px; font-weight: 800; font-size: 14px;
          cursor: pointer; transition: all 0.2s;
        }
        .action-btn.primary-ghost { background: var(--primary-light-alpha); color: var(--primary); border: 1.5px solid transparent; }
        .action-btn.primary-ghost:hover { background: var(--primary); color: #fff; }
        .action-btn.secondary-ghost { background: rgba(16,185,129,0.08); color: #059669; border: 1.5px solid transparent; }
        .action-btn.secondary-ghost:hover { background: #059669; color: #fff; }

        .empty-state-elite { padding: 80px; text-align: center; background: var(--surface); border-radius: 32px; border: 2px dashed var(--border); }
        .empty-icon-box { color: var(--text-3); opacity: 0.2; margin-bottom: 24px; }
        .empty-state-elite h3 { font-size: 22px; font-weight: 900; color: var(--text); margin-bottom: 8px; }
        .empty-state-elite p { color: var(--text-3); font-weight: 600; }
        
        .loading-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        .skeleton-card { height: 350px; background: var(--surface); border-radius: 28px; border: 1.5px solid var(--border); opacity: 0.5; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 0.7; } 100% { opacity: 0.4; } }
      ` }} />
    </div>
  );
};

export default MesStages;
