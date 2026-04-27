import React, { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar";
import Topbar from "../../components/common/Topbar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getMastersByResponsable,
  getSessionsByResponsable,
  creerSujet,
  modifierSujet,
  deleteSujet,
  publierSujet,
  depublierSujet,
  validerSessionSujet,
} from "../../api/sujetAPI";
import ClinisysAlert from "../../utils/SwalUtils";
import { useSession } from "../../context/SessionContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, CheckCircle,
  Archive, Users, Trash2, Edit3,
  RefreshCw, BookOpen, ShieldCheck, HelpCircle, Send, Library,
  LayoutDashboard, ClipboardList, FileText, GraduationCap, BarChart, Calendar, Star
} from "lucide-react";
import { ROLES } from "../../utils/roleHelpers";

const NAV_RESPONSABLE = [
  { path: "/responsable/dashboard", icon: <LayoutDashboard size={18} />, label: "Tableau de bord" },
  { path: "/responsable/stages", icon: <ClipboardList size={18} />, label: "Stages" },
  { path: "/responsable/sujets", icon: <FileText size={18} />, label: "Sujets" },
  { path: "/responsable/stagiaires", icon: <GraduationCap size={18} />, label: "Stagiaires" },
  { path: "/responsable/analytique", icon: <BarChart size={18} />, label: "Analytique" },
];

const NAV_ENCADRANT = [
  { path: "/encadrant/dashboard", icon: <LayoutDashboard size={18} />, label: "Tableau de bord" },
  { path: "/encadrant/stages", icon: <ClipboardList size={18} />, label: "Mes stages" },
  { path: "/encadrant/sujets", icon: <FileText size={18} />, label: "Sujets" },
  { path: "/encadrant/reunions", icon: <Calendar size={18} />, label: "Réunions" },
  { path: "/encadrant/evaluations", icon: <Star size={18} />, label: "Évaluations" },
];

const TYPE_COLORS = { PFE: "#3b82f6", PFA: "#10b981", STAGE_ETE: "#f59e0b" };

const STATUT_STYLE = {
  DISPONIBLE: { color: "#10b981", label: "Disponible", icon: <CheckCircle size={14} /> },
  COMPLET: { color: "#f59e0b", label: "Complet", icon: <ShieldCheck size={14} /> },
  VALIDE: { color: "#3b82f6", label: "Validé", icon: <ShieldCheck size={14} /> },
  ARCHIVE: { color: "#64748b", label: "Archivé", icon: <Archive size={14} /> },
};

const EMPTY_MASTER = { titre: "", description: "", type: "PFE", nbMaxStagiaires: 1 };

export default function GestionSujets() {
  const { user } = useAuth();
  const { sidebarMini } = useTheme();
  const { activeSession } = useSession();

  const [activeTab, setActiveTab] = useState("SESSION"); 
  const [masters, setMasters] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formMaster, setFormMaster] = useState(EMPTY_MASTER);
  const [formPublish, setFormPublish] = useState({ sujetId: null, titre: '', annee: '', nbMaxStagiaires: 1 });
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkYear, setBulkYear] = useState(activeSession || new Date().getFullYear().toString());

  useEffect(() => {
    if (activeSession) setBulkYear(activeSession);
  }, [activeSession]);

  useEffect(() => {
    if (user?.id) loadAll();
  }, [user, activeSession]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        getMastersByResponsable(),
        getSessionsByResponsable(activeSession)
      ]);
      setMasters(mRes.data);
      setSessions(sRes.data);
    } catch (err) {
      console.error("Load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMaster = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formMaster, responsableId: user.id };
      if (editMode) await modifierSujet(formMaster.id, payload);
      else await creerSujet(payload);
      setShowMasterModal(false);
      loadAll();
      ClinisysAlert.success(editMode ? "Modèle mis à jour" : "Nouveau modèle créé");
    } catch (err) {
      ClinisysAlert.error("Erreur", "Échec de l'opération");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await publierSujet({ sujetId: formPublish.sujetId, annee: formPublish.annee, nbMaxStagiaires: formPublish.nbMaxStagiaires });
      setShowPublishModal(false);
      loadAll();
      ClinisysAlert.success(`Sujet publié pour la session ${formPublish.annee}`);
      setActiveTab("SESSION");
    } catch (err) {
      ClinisysAlert.error("Déjà publié", "Ce sujet est déjà publié pour cette session.");
    } finally {
      setSaving(false);
    }
  };

  const handleValiderSession = async (id) => {
    const res = await ClinisysAlert.confirm({
      title: "Valider le stage",
      text: "Marquer comme validé pour cette session ?",
      confirmText: "Confirmer"
    });
    if (res.isConfirmed) {
      try {
        await validerSessionSujet(id);
        loadAll();
        ClinisysAlert.success("Sujet validé");
      } catch { ClinisysAlert.error("Erreur", "Action impossible"); }
    }
  };

  const handleDepublier = async (id) => {
    const res = await ClinisysAlert.confirm({
      title: "Annuler la publication",
      text: "Le sujet ne sera plus visible par les stagiaires pour cette session.",
      danger: true,
      confirmText: "Annuler la publication"
    });
    if (res.isConfirmed) {
      try {
        await depublierSujet(id);
        loadAll();
        ClinisysAlert.success("Publication annulée");
      } catch (err) {
        ClinisysAlert.error("Erreur", err.response?.data || "Action impossible");
      }
    }
  };

  const filteredMasters = masters.filter(m => m.titre.toLowerCase().includes(search.toLowerCase()));
  const filteredSessions = sessions.filter(s => s.titre.toLowerCase().includes(search.toLowerCase()));
  const isAllSelected = filteredMasters.length > 0 && selectedIds.length === filteredMasters.length;

  const handleBulkPublish = async () => {
    const res = await ClinisysAlert.confirm({
      title: "Publication groupée",
      text: `Voulez-vous publier les ${selectedIds.length} sujets sélectionnés pour la session ${activeSession} ?`,
      confirmText: "Confirmer la publication"
    });
    if (res.isConfirmed) {
      setSaving(true);
      try {
        await Promise.all(selectedIds.map(id => {
          const m = masters.find(x => x.id === id);
          return publierSujet({ sujetId: id, annee: activeSession, nbMaxStagiaires: m.nbMaxStagiaires });
        }));
        setSelectedIds([]);
        loadAll();
        ClinisysAlert.success("Sujets publiés");
        setActiveTab("SESSION");
      } catch (err) {
        ClinisysAlert.error("Erreur", "Certains sujets sont déjà publiés.");
      } finally {
        setSaving(false);
      }
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(filteredMasters.map(m => m.id));
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={user?.role === ROLES.ENCADRANT ? NAV_ENCADRANT : NAV_RESPONSABLE} />
      <Topbar />
      
      <main className="main-content fade-in">
        <div className="premium-header-card">
          <div>
            <h1 className="gradient-text">Gestion des Sujets</h1>
            <p className="page-subtitle text-muted">Gérez votre bibliothèque et publiez par session</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <button className="btn btn-outline" style={{ borderRadius: 14 }} onClick={() => { setActiveTab("LIBRARY"); loadAll(); }}>
                <Library size={18} style={{ marginRight: 8 }} /> Bibliothèque
             </button>
             <button className="btn btn-primary" style={{ borderRadius: 14 }} onClick={() => { setFormMaster(EMPTY_MASTER); setEditMode(false); setShowMasterModal(true); }}>
                <Plus size={18} style={{ marginRight: 8 }} /> Nouveau Modèle
             </button>
          </div>
        </div>

        <div className="tabs-chic-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div className="tabs-chic-pill" style={{ 
            background: 'var(--surface)', 
            padding: '6px', 
            borderRadius: '100px', 
            border: '1px solid var(--border)',
            display: 'flex',
            gap: '4px',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative'
          }}>
             <button 
               className={`tab-chic-btn ${activeTab === "SESSION" ? "active" : ""}`} 
               onClick={() => setActiveTab("SESSION")}
               style={{
                 padding: '12px 28px',
                 borderRadius: '100px',
                 border: 'none',
                 fontSize: '14px',
                 fontWeight: 800,
                 display: 'flex',
                 alignItems: 'center',
                 gap: 10,
                 cursor: 'pointer',
                 transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                 background: activeTab === "SESSION" ? 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' : 'transparent',
                 color: activeTab === "SESSION" ? '#fff' : 'var(--text-3)',
                 boxShadow: activeTab === "SESSION" ? '0 8px 15px var(--primary-lt)' : 'none'
               }}
             >
                <Send size={16} /> 
                <span>Session Active</span>
                <span style={{ 
                  fontSize: '10px', 
                  opacity: 0.8, 
                  background: activeTab === "SESSION" ? 'rgba(255,255,255,0.2)' : 'var(--bg)', 
                  padding: '2px 8px', 
                  borderRadius: '6px',
                  marginLeft: 4
                }}>
                  {activeSession}
                </span>
             </button>

             <button 
               className={`tab-chic-btn ${activeTab === "LIBRARY" ? "active" : ""}`} 
               onClick={() => setActiveTab("LIBRARY")}
               style={{
                 padding: '12px 28px',
                 borderRadius: '100px',
                 border: 'none',
                 fontSize: '14px',
                 fontWeight: 800,
                 display: 'flex',
                 alignItems: 'center',
                 gap: 10,
                 cursor: 'pointer',
                 transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                 background: activeTab === "LIBRARY" ? 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' : 'transparent',
                 color: activeTab === "LIBRARY" ? '#fff' : 'var(--text-3)',
                 boxShadow: activeTab === "LIBRARY" ? '0 8px 15px var(--primary-lt)' : 'none'
               }}
             >
                <BookOpen size={16} /> 
                <span>Bibliothèque de Sujets</span>
             </button>
          </div>
        </div>

         <div className="filter-bar-chic" style={{ 
           background: 'var(--surface)', 
           borderRadius: '24px', 
           border: '1px solid var(--border)', 
           marginBottom: '32px',
           padding: '20px 30px',
           display: 'flex',
           justifyContent: 'space-between',
           alignItems: 'center',
           boxShadow: 'var(--shadow-sm)'
         }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
             {activeTab === "LIBRARY" && filteredMasters.length > 0 && (
               <button 
                 className={`btn-select-all ${selectedIds.length === filteredMasters.length ? 'active' : ''}`} 
                 onClick={toggleSelectAll}
                 style={{ 
                   display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', 
                   border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontWeight: 700, 
                   fontSize: '13px', padding: '10px 20px', borderRadius: '12px', transition: '0.2s' 
                 }}
               >
                 <div style={{ 
                   width: 18, height: 18, border: '2px solid var(--border)', borderRadius: '6px', 
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   background: selectedIds.length === filteredMasters.length ? 'var(--primary)' : 'transparent',
                   borderColor: selectedIds.length === filteredMasters.length ? 'var(--primary)' : 'var(--border)',
                   color: '#fff'
                 }}>
                   {selectedIds.length === filteredMasters.length && <CheckCircle size={14} />}
                 </div>
                 <span>Tout sélectionner</span>
               </button>
             )}
             
             <div style={{ position: 'relative', width: 320 }}>
               <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
               <input
                 placeholder={activeTab === "SESSION" ? "Filtrer les sessions..." : "Rechercher dans la bibliothèque..."}
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 style={{ 
                   width: '100%',
                   padding: '12px 20px 12px 48px', 
                   borderRadius: '14px', 
                   background: 'var(--bg)', 
                   border: '1.5px solid transparent',
                   fontSize: '14px',
                   fontWeight: 600,
                   transition: '0.2s',
                   outline: 'none',
                   color: 'var(--text)'
                 }}
               />
             </div>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {selectedIds.length > 0 && activeTab === "LIBRARY" && (
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-lt)', padding: '8px 16px', borderRadius: '10px' }}>
                   {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', background: 'var(--bg)', padding: '8px 16px', borderRadius: '10px' }}>
                 {activeTab === "SESSION" ? sessions.length : masters.length} Éléments
              </div>
           </div>
         </div>

        {loading ? (
          <div className="loader-box"><RefreshCw className="spin" /> Synchronisation...</div>
        ) : (
          <div className="sujet-grid">
             {activeTab === "LIBRARY" ? (
               filteredMasters.length === 0 ? <EmptyState /> : (
                 filteredMasters.map(m => {
                  const sessionObj = sessions.find(s => s.sujetId === m.id);
                  const isPublished = !!sessionObj;
                  const isSelected = selectedIds.includes(m.id);
                  return (
                    <motion.div 
                      key={m.id} 
                      layout 
                      whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
                      className={`premium-card master-card ${isSelected ? 'selected' : ''} ${isPublished ? 'published' : ''}`}
                      style={{ 
                        overflow: 'hidden', 
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: 'var(--surface)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                       <div className="selection-overlay" onClick={() => toggleSelectOne(m.id)}>
                          <div className={`checkbox-lite ${isSelected ? 'active' : ''}`} style={{ width: 22, height: 22, borderRadius: 8 }}>
                             {isSelected && <CheckCircle size={16} />}
                          </div>
                       </div>
                       
                       <div className="card-header" style={{ marginBottom: 20 }}>
                          <div className="type-badge-premium" style={{ 
                            background: TYPE_COLORS[m.type] + '15', 
                            color: TYPE_COLORS[m.type],
                            padding: '6px 14px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 900,
                            letterSpacing: '0.5px',
                            border: `1px solid ${TYPE_COLORS[m.type]}30`
                          }}>
                            {m.type}
                          </div>
                          <div className="actions">
                             {!m.published && (
                               <>
                                 <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setFormMaster(m); setEditMode(true); setShowMasterModal(true); }}><Edit3 size={16}/></button>
                                 <button className="icon-btn delete" onClick={(e) => {
                                    e.stopPropagation();
                                    ClinisysAlert.confirm({ title: "Supprimer?", text: "Seulement si jamais utilisé.", danger: true })
                                    .then(r => r.isConfirmed && deleteSujet(m.id).then(loadAll));
                                 }}><Trash2 size={16}/></button>
                               </>
                             )}
                          </div>
                       </div>

                       <div className="card-body-chic" style={{ padding: '0 4px' }}>
                          <h3 className="master-title" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 12, lineHeight: 1.4 }}>{m.titre}</h3>
                          <p className="master-desc" style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, minHeight: 60, margin: 0 }}>
                             {m.description || "Aucune description détaillée pour ce sujet."}
                          </p>
                       </div>
                       
                       {isPublished && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="publication-status-badge-premium" 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 12, 
                              background: 'var(--primary-lt)', 
                              padding: '10px 16px', 
                              borderRadius: 12, 
                              marginTop: 20,
                              border: '1px solid var(--primary-light-alpha)'
                            }}
                          >
                             <div className="pulse-dot-v2"></div>
                             <Send size={14} style={{ color: 'var(--primary)' }} />
                             <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>En ligne • {activeSession}</span>
                          </motion.div>
                       )}

                       <div className="master-footer" style={{ marginTop: 24, paddingTop: 18, borderTop: '1px dashed var(--border)' }}>
                          <div className="capacity-chic" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 13, fontWeight: 700 }}>
                             <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={14} />
                             </div>
                             {m.nbMaxStagiaires} places
                          </div>

                          {!isPublished ? (
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="btn-publish-chic" 
                              onClick={(e) => { 
                                e.stopPropagation();
                                setFormPublish({ sujetId: m.id, titre: m.titre, annee: activeSession, nbMaxStagiaires: m.nbMaxStagiaires });
                                setShowPublishModal(true);
                              }}
                              style={{
                                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 18px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px var(--primary-lt)'
                              }}
                            >
                               <Send size={14} /> Publier
                            </motion.button>
                          ) : (
                            <div className="published-action-chic" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 800, fontSize: 12 }}>
                                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                     <CheckCircle size={14} />
                                  </div>
                                  PUBLIÉ
                               </div>
                               {isPublished && sessionObj.nbChoixActuels === 0 && sessionObj.statut !== "VALIDE" && (
                                  <button 
                                    className="icon-btn delete" 
                                    style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--danger-lt)' }} 
                                    title="Annuler la publication"
                                    onClick={(e) => { e.stopPropagation(); handleDepublier(sessionObj.id); }}
                                  >
                                     <Trash2 size={14} />
                                  </button>
                               )}
                            </div>
                          )}
                       </div>
                    </motion.div>
                  );
                })
               )
             ) : (
               filteredSessions.length === 0 ? <EmptySessionState session={activeSession} /> : (
                 filteredSessions.map(s => {
                    const st = STATUT_STYLE[s.statut] || STATUT_STYLE.DISPONIBLE;
                    const progress = (s.nbChoixActuels / s.nbMaxStagiaires) * 100;
                    return (
                      <motion.div key={s.id} layout className="premium-card session-card">
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div className="session-status" style={{ color: st.color, margin: 0 }}>
                               {st.icon} {st.label}
                            </div>
                            {s.nbChoixActuels === 0 && s.statut !== "VALIDE" && (
                               <button className="icon-btn delete" style={{ width: 28, height: 28 }} title="Annuler la publication" onClick={() => handleDepublier(s.id)}>
                                  <Trash2 size={14} />
                               </button>
                            )}
                         </div>
                         <h3 className="session-title">{s.titre}</h3>
                         <div className="session-stats">
                            <div className="stat-row">
                               <span>Remplissage</span>
                               <span>{s.nbChoixActuels} / {s.nbMaxStagiaires}</span>
                            </div>
                            <div className="progress-bar">
                               <div className="progress-fill" style={{ width: `${progress}%`, background: st.color }}></div>
                            </div>
                         </div>
                         <div className="session-footer">
                            <div className="type-tag" style={{ borderLeft: `3px solid ${TYPE_COLORS[s.type]}` }}>{s.type}</div>
                             {s.statut !== "VALIDE" && s.nbChoixActuels > 0 && (
                                <button 
                                  className="btn btn-primary btn-sm" 
                                  onClick={() => handleValiderSession(s.id)}
                                  style={{ 
                                    padding: '8px 16px', 
                                    borderRadius: '10px', 
                                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    boxShadow: '0 4px 12px var(--primary-lt)'
                                  }}
                                >
                                   Valider le Stage
                                </button>
                             )}
                         </div>
                      </motion.div>
                    );
                 })
               )
             )}
          </div>
        )}

        <AnimatePresence>
           {showMasterModal && (
             <div className="modal-overlay">
                <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="premium-card modal-content-v2">
                   <div className="modal-header">
                      <h2>{editMode ? "Modifier le modèle" : "Nouveau modèle"}</h2>
                      <button className="icon-btn" onClick={() => setShowMasterModal(false)}><Plus style={{ transform: 'rotate(45deg)' }} /></button>
                   </div>
                   <form onSubmit={handleSaveMaster} className="modal-body">
                      <div className="form-group-v2">
                         <label>Titre fixe</label>
                         <input required value={formMaster.titre} onChange={e => setFormMaster({...formMaster, titre: e.target.value})} />
                      </div>
                      <div className="form-group-v2">
                         <label>Description</label>
                         <textarea rows={4} value={formMaster.description} onChange={e => setFormMaster({...formMaster, description: e.target.value})} />
                      </div>
                      <div className="grid-2">
                         <div className="form-group-v2">
                            <label>Catégorie</label>
                            <select value={formMaster.type} onChange={e => setFormMaster({...formMaster, type: e.target.value})}>
                               <option value="PFE">PFE</option>
                               <option value="PFA">PFA</option>
                               <option value="STAGE_ETE">Stage d'été</option>
                            </select>
                         </div>
                         <div className="form-group-v2">
                            <label>Places (Défaut)</label>
                            <input type="number" min="1" max="2" value={formMaster.nbMaxStagiaires} onChange={e => setFormMaster({...formMaster, nbMaxStagiaires: e.target.value})} />
                         </div>
                      </div>
                      <div className="modal-footer">
                         <button type="button" className="btn btn-outline" onClick={() => setShowMasterModal(false)}>Annuler</button>
                         <button type="submit" className="btn btn-primary" disabled={saving}>Enregistrer</button>
                      </div>
                   </form>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

        <AnimatePresence>
           {showPublishModal && (
             <div className="modal-overlay">
               <motion.div
                 initial={{ opacity: 0, scale: 0.88, y: 16 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.88, y: 16 }}
                 transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                 style={{
                   background: 'var(--surface)',
                   borderRadius: 24,
                   width: 440,
                   overflow: 'hidden',
                   boxShadow: '0 20px 50px -10px var(--primary-lt), 0 0 0 1px var(--border)',
                 }}
               >
                 {/* Header — soft indigo */}
                 <div style={{
                   background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                   padding: '26px 30px 22px',
                 }}>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                     <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Send size={18} color="rgba(255,255,255,0.92)" />
                     </div>
                     <button
                       onClick={() => setShowPublishModal(false)}
                       style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                     >
                       <Plus style={{ transform: 'rotate(45deg)' }} size={16} />
                     </button>
                   </div>
                   <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>Confirmer la publication</h2>
                   <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 13, marginTop: 6, fontWeight: 400 }}>Ce sujet sera mis en ligne pour la session active.</p>
                 </div>

                 {/* Body */}
                 <div style={{ padding: '22px 28px 26px' }}>
                   {/* Subject info card */}
                   <div style={{
                     background: 'var(--bg)',
                     borderRadius: 16,
                     padding: '16px 20px',
                     marginBottom: 18,
                     border: '1px solid var(--border)',
                     display: 'flex',
                     flexDirection: 'column',
                     gap: 10,
                   }}>
                     <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Sujet à publier</div>
                     <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>{formPublish.titre}</div>
                     <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                       <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--primary-lt)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                         <Calendar size={11} /> Session {formPublish.annee}
                       </span>
                       <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent-lt)', color: 'var(--accent)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                         <Users size={11} /> {formPublish.nbMaxStagiaires} place{formPublish.nbMaxStagiaires > 1 ? 's' : ''}
                       </span>
                     </div>
                   </div>

                   {/* Info notice — soft indigo tint */}
                   <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 15px', background: 'var(--primary-lt)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 22 }}>
                     <div style={{ color: 'var(--primary)', marginTop: 1, flexShrink: 0 }}><HelpCircle size={15} /></div>
                     <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, lineHeight: 1.55, margin: 0 }}>
                       Une fois publié, les stagiaires pourront consulter et choisir ce sujet pour la session <strong style={{ color: 'var(--primary)' }}>{formPublish.annee}</strong>.
                     </p>
                   </div>

                   {/* Actions */}
                   <div style={{ display: 'flex', gap: 10 }}>
                     <button
                       onClick={() => setShowPublishModal(false)}
                       style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', fontWeight: 600, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', transition: '0.2s' }}
                     >
                       Annuler
                     </button>
                     <button
                       onClick={handlePublish}
                       disabled={saving}
                       style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', fontWeight: 700, fontSize: 13, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px -4px var(--primary-lt)', transition: '0.2s', opacity: saving ? 0.75 : 1 }}
                     >
                       {saving ? <RefreshCw className="spin" size={15} /> : <Send size={15} />}
                       {saving ? 'Publication...' : `Publier pour ${formPublish.annee}`}
                     </button>
                   </div>
                 </div>
               </motion.div>
             </div>
           )}
        </AnimatePresence>

        <AnimatePresence>
           {selectedIds.length > 0 && activeTab === "LIBRARY" && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={{ y: 100, opacity: 0 }} 
                className="bulk-action-bar-v2"
              >
                <div className="bulk-glass-container">
                  <div className="bulk-left">
                    <div className="selection-badge">
                      <div className="badge-number">{selectedIds.length}</div>
                      <span className="badge-text">Sujets sélectionnés</span>
                    </div>
                    <div className="bulk-divider"></div>
                    <div className="target-session">
                      <Calendar size={14} />
                      <span>Publication session <strong>{activeSession}</strong></span>
                    </div>
                  </div>
                  
                  <div className="bulk-right">
                    <button className="btn-bulk-cancel" onClick={() => setSelectedIds([])}>
                      Annuler
                    </button>
                    <button className="btn-bulk-submit" onClick={handleBulkPublish} disabled={saving}>
                      {saving ? <RefreshCw className="spin" size={16} /> : <Send size={16} />}
                      <span>{saving ? 'Publication...' : `Publier pour ${activeSession}`}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .tab-chic-btn:hover:not(.active) { color: var(--primary); background: var(--bg); }
        .tab-chic-btn span { position: relative; z-index: 2; }
        
        .sujet-grid { display: grid; gridTemplateColumns: repeat(auto-fill, minmax(360px, 1fr)); gap: 24px; padding-bottom: 120px; }
        .master-card, .session-card { padding: 24px; transition: all 0.3s; border: 1px solid var(--border); borderRadius: 24px; background: var(--surface); position: relative; }
        .master-card.selected { border-color: var(--primary); background: var(--primary-light-alpha); }
        .selection-overlay { position: absolute; top: 12px; left: 12px; z-index: 5; cursor: pointer; }
        .checkbox-lite { width: 20px; height: 20px; border: 2px solid var(--border); borderRadius: 6px; background: var(--surface); display: flex; align-items: center; justify-content: center; }
        .checkbox-lite.active { background: var(--primary); border-color: var(--primary); color: #fff; }

        .card-header { display: flex; justify-content: space-between; margin-bottom: 16px; padding-left: 20px; }
        .type-badge { padding: 4px 10px; borderRadius: 6px; color: #fff; font-size: 10px; font-weight: 900; }
        .master-title { fontSize: 18px; fontWeight: 800; margin-bottom: 10px; color: var(--text); }
        .master-desc { fontSize: 14px; color: var(--text-2); height: 60px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; margin-bottom: 20px; }
        
        .publication-status-badge { display: flex; align-items: center; gap: 10px; background: rgba(16,185,129,0.05); padding: 8px 12px; borderRadius: 10px; margin-bottom: 20px; border: 1px solid rgba(16,185,129,0.1); }
        .publication-status-badge span { font-size: 11px; font-weight: 800; color: #10b981; }
        .pulse-dot-v2 { width: 8px; height: 8px; background: var(--primary); borderRadius: 50%; animation: pulse-chic 2s infinite; }
        
        @keyframes pulse-chic {
          0% { box-shadow: 0 0 0 0 var(--primary-light-alpha); }
          70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }

        .master-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 16px; }
        .capacity { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--text-3); }
        .published-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 900; color: #10b981; }
        
        .bulk-action-bar-v2 { position: fixed; bottom: 32px; left: 0; right: 0; display: flex; justify-content: center; z-index: 1000; pointer-events: none; }
        .bulk-glass-container { 
          pointer-events: auto;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(99, 102, 241, 0.2);
          padding: 10px 10px 10px 24px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 32px;
          box-shadow: 0 16px 40px -12px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5);
        }
        .bulk-left { display: flex; align-items: center; gap: 20px; }
        .selection-badge { display: flex; align-items: center; gap: 10px; }
        .badge-number { 
          background: var(--primary); 
          color: #fff; 
          min-width: 26px; 
          height: 26px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: 800; 
          font-size: 13px; 
          box-shadow: 0 4px 10px var(--primary-lt);
        }
        .badge-text { font-size: 14px; font-weight: 700; color: var(--text); }
        .bulk-divider { width: 1px; height: 24px; background: var(--primary-lt); }
        .target-session { display: flex; align-items: center; gap: 8px; color: var(--primary); font-size: 13px; font-weight: 600; }
        .target-session strong { font-weight: 800; }
        
        .bulk-right { display: flex; gap: 10px; }
        .btn-bulk-cancel { 
          background: transparent; 
          border: none; 
          color: var(--text-3); 
          font-weight: 700; 
          font-size: 13px; 
          padding: 10px 16px; 
          cursor: pointer; 
          border-radius: 12px;
          transition: 0.2s;
        }
        .btn-bulk-cancel:hover { background: var(--bg); color: var(--text-2); }
        .btn-bulk-submit { 
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%); 
          color: #fff; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 14px; 
          font-weight: 700; 
          font-size: 13px; 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          cursor: pointer; 
          transition: 0.2s;
          box-shadow: 0 8px 20px -6px var(--primary-lt);
        }
        .btn-bulk-submit:hover { transform: translateY(-1px); box-shadow: 0 10px 24px -6px rgba(99, 102, 241, 0.5); }
        .btn-bulk-submit:active { transform: translateY(0); }
        .btn-bulk-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        .session-status { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; }
        .session-title { fontSize: 17px; fontWeight: 800; margin-bottom: 10px; color: var(--text); }
        .stat-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: var(--text-3); margin-bottom: 8px; }
        .progress-bar { height: 8px; background: var(--bg); borderRadius: 10px; overflow: hidden; margin-bottom: 20px; }
        .progress-fill { height: 100%; transition: width 0.5s ease; }
        .session-footer { display: flex; justify-content: space-between; align-items: center; }
        .type-tag { padding-left: 10px; font-size: 12px; font-weight: 800; color: var(--text-2); }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; }
        .modal-content-v2 { background: var(--surface); border: 1px solid var(--border); borderRadius: 24px; width: 500px; padding: 32px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .modal-footer { margin-top: 32px; display: flex; justify-content: flex-end; gap: 12px; }
        .loader-box { padding: 100px; text-align: center; color: var(--text-3); }

        /* Icon Buttons Premium */
        .actions { display: flex; gap: 8px; }
        .icon-btn { 
          width: 34px; 
          height: 34px; 
          border-radius: 10px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          background: var(--surface); 
          border: 1px solid var(--border);
          color: var(--text-2);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .icon-btn:hover { 
          background: var(--primary-lt); 
          border-color: var(--primary); 
          color: var(--primary); 
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--primary-lt);
        }
        .icon-btn.delete:hover { 
          background: var(--danger-lt); 
          border-color: var(--danger); 
          color: var(--danger); 
          box-shadow: 0 4px 12px var(--danger-lt);
        }
      ` }} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="premium-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80 }}>
       <div style={{ marginBottom: 20, color: 'var(--text-3)' }}><Library size={48} /></div>
       <h3>Votre bibliothèque est vide</h3>
       <p className="text-muted">Créez des modèles de sujets pour les réutiliser.</p>
    </div>
  );
}

function EmptySessionState({ session }) {
  return (
    <div className="premium-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80 }}>
       <div style={{ marginBottom: 20, color: 'var(--text-3)' }}><Send size={48} /></div>
       <h3>Aucun sujet publié en {session}</h3>
       <p className="text-muted">Allez dans "Bibliothèque" pour publier.</p>
    </div>
  );
}
