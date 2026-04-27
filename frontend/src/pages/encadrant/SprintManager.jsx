import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/common/Sidebar';
import Topbar  from '../../components/common/Topbar';
import { useTheme } from '../../context/ThemeContext';
import {
  getSprintsByStage, creerSprint, demarrerSprint,
  cloturerSprint, deleteSprint,
} from '../../api/sprintAPI';
import {
  getTachesBySprint, getTachesDisponibles,
  affecterTacheASprint, retirerTacheDuSprint,
} from '../../api/tacheAPI';
import { getStageById } from '../../api/stageAPI';
import ClinisysAlert from '../../utils/SwalUtils';
import {
  Target, Info, AlertCircle, Clock, RefreshCw,
  LayoutDashboard, ClipboardList, FileText, Star, Calendar, ChevronLeft, ChevronUp, ChevronDown, CheckSquare, Layers, Play, StopCircle, Rocket, Users, Plus, Trash2
} from 'lucide-react';

const NAV = [
  { path: '/encadrant/dashboard',   icon: <LayoutDashboard size={18} />, label: 'Tableau de bord' },
  { path: '/encadrant/stages',      icon: <ClipboardList size={18} />, label: 'Mes stages'      },
  { path: '/encadrant/sujets',      icon: <FileText size={18} />, label: 'Sujets'          },
  { path: '/encadrant/reunions',    icon: <Calendar size={18} />, label: 'Réunions'        },
  { path: '/encadrant/evaluations', icon: <Star size={18} />, label: 'Évaluations'     },
];

const STATUT_SPRINT = {
  PLANIFIE:          { label:'Planifié',  bg:'rgba(107,114,128,0.1)', color:'#6b7280', icon: Calendar },
  EN_COURS:          { label:'En cours',  bg:'rgba(99,102,241,0.1)', color:'#6366f1', icon: Play },
  TERMINE:           { label:'Terminé',   bg:'rgba(16,185,129,0.1)', color:'#10b981', icon: CheckSquare },
  TERMINE_INCOMPLET: { label:'Incomplet', bg:'rgba(245,158,11,0.1)', color:'#f59e0b', icon: AlertCircle },
};

const STATUT_TACHE = {
  EN_ATTENTE_VALIDATION: { label:'Attente', color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
  A_FAIRE:               { label:'À faire',  color:'#6b7280', bg:'rgba(107,114,128,0.1)' },
  EN_COURS:              { label:'En cours', color:'#6366f1', bg:'rgba(99,102,241,0.1)' },
  TERMINE:               { label:'Terminé',  color:'#10b981', bg:'rgba(16,185,129,0.1)' },
  REFUSE:                { label:'Refusé',   color:'#ef4444', bg:'rgba(239,68,68,0.1)' },
  REPORTEE:              { label:'Reporter',  color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
};

const PRIORITE_COLORS = { BASSE:'#3b82f6', MOYENNE:'#10b981', HAUTE:'#f59e0b', CRITIQUE:'#ef4444' };

const EMPTY_SPRINT = { nom: '', numero: '', objectifs: '', dateDebut: '', nbJours: '', dateFin: '', livrables: '' };

const deduplicateTaches = (taches) => {
  const map = new Map();
  taches.forEach(t => {
    const key = t.tacheId || t.titre;
    if (map.has(key)) {
      const existing = map.get(key);
      if (t.stagiairePrenom) {
        const nomComplet = `${t.stagiairePrenom} ${t.stagiaireNom}`;
        if (!existing.stagiairesNoms.includes(nomComplet)) existing.stagiairesNoms.push(nomComplet);
      }
    } else {
      map.set(key, { ...t, stagiairesNoms: t.stagiairePrenom ? [`${t.stagiairePrenom} ${t.stagiaireNom}`] : [] });
    }
  });
  return Array.from(map.values());
};

export default function SprintManager() {
  const { stageId } = useParams();
  const navigate    = useNavigate();
  const { sidebarMini } = useTheme();

  const [stage,        setStage]        = useState(null);
  const [sprints,      setSprints]      = useState([]);
  const [openSprint,   setOpenSprint]   = useState(null);
  const [taches,       setTaches]       = useState({});
  const [loading,      setLoading]      = useState(true);

  const [showModal,    setShowModal]    = useState(false);
  const [sprintForm,   setSprintForm]   = useState(EMPTY_SPRINT);
  const [datesMots,    setDatesMots]    = useState([]);
  const [errorModal,   setErrorModal]   = useState('');
  const [saving,       setSaving]       = useState(false);

  const [showAffecter, setShowAffecter] = useState(false);
  const [activeSprint, setActiveSprint] = useState(null);
  const [tachesDisponibles, setTachesDisponibles] = useState([]);
  const [tachesSelectionnees, setTachesSelectionnees] = useState([]);
  const [savingAff,    setSavingAff]    = useState(false);
  const [errorAff,     setErrorAff]     = useState('');



  useEffect(() => { loadAll(); }, [stageId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stageRes, sprintsRes] = await Promise.all([ getStageById(stageId), getSprintsByStage(stageId) ]);
      setStage(stageRes.data);
      setSprints(sprintsRes.data);
    } catch {}
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

  const handleCreateSprint = async (e) => {
    e.preventDefault(); setSaving(true); setErrorModal('');
    try {
      const datesValides = datesMots.filter(d => d && d.trim() !== '').map(d => d.length === 16 ? d + ':00' : d);
      if (datesValides.length === 0) throw new Error("Planifiez au moins une réunion.");

      const lastSprint = sprints.length > 0 ? sprints[sprints.length - 1] : null;

      // Validation : date début sprint >= date début stage
      if (stage?.dateDebut && sprintForm.dateDebut && sprintForm.dateDebut < stage.dateDebut) {
        throw new Error(`La date de début du sprint doit être après le début du stage (${stage.dateDebut}).`);
      }

      // Validation : date début sprint >= date fin sprint précédent
      if (lastSprint && sprintForm.dateDebut && sprintForm.dateDebut < lastSprint.dateFin) {
        throw new Error(`La date de début du sprint doit être après la fin du sprint précédent (${lastSprint.dateFin}).`);
      }

      // Validation : date fin sprint <= date fin stage
      if (stage?.dateFin && sprintForm.dateFin && sprintForm.dateFin > stage.dateFin) {
        throw new Error(`La date de fin du sprint (${sprintForm.dateFin}) ne peut pas dépasser la date de fin du stage (${stage.dateFin}).`);
      }

      await creerSprint({ ...sprintForm, stageId: Number(stageId), numero: Number(sprintForm.numero), datesMots: datesValides });
      setShowModal(false); setSprintForm(EMPTY_SPRINT); setDatesMots([]); loadAll();
      ClinisysAlert.success("Sprint créé avec succès");
    } catch (err) {
      let msg = err.response?.data?.message || err.message || 'Erreur création sprint';
      
      // Personnalisation du message spécifique au sprint non clôturé
      if (msg.includes('clôturé') || msg.includes('cloturee')) {
        msg = "Calcul impossible : Vous devez clôturer le sprint précédent avant d'en initialiser un nouveau pour garantir l'intégrité du pipeline agile.";
      } else if (msg.includes('400')) {
        msg = "Action refusée : Vérifiez la cohérence des dates ou si un cycle est déjà actif.";
      }
      
      ClinisysAlert.error("Erreur Sprint", msg);
    } finally { setSaving(false); }
  };

  const calculateDateFin = (start, days) => {
    if (!start || !days) return "";
    const date = new Date(start);
    date.setDate(date.getDate() + parseInt(days));
    return date.toISOString().split('T')[0];
  };

  const sf = (k) => (e) => {
    const val = e.target.value;
    setSprintForm(p => {
      const updated = { ...p, [k]: val };
      if (k === 'dateDebut' || k === 'nbJours') {
        const oldDateFin = updated.dateFin;
        updated.dateFin = calculateDateFin(updated.dateDebut, updated.nbJours);
        
        // Sync first meeting date if it was still on the previous end date
        setDatesMots(prev => {
          if (prev.length > 0 && (prev[0].startsWith(oldDateFin) || prev[0] === "")) {
            const nextDates = [...prev];
            const timePart = prev[0].includes('T') ? prev[0].split('T')[1] : "09:00";
            nextDates[0] = `${updated.dateFin}T${timePart}`;
            return nextDates;
          }
          return prev;
        });
      }
      return updated;
    });
  };

  const handleCloturerSprint = async (sprintId) => {
    try {
      await cloturerSprint(sprintId, false);
      loadAll();
      ClinisysAlert.success("Sprint clôturé");
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (err.test) { // Not used, just to align
      } else if (err.response?.status === 409 && msg.startsWith('SPRINT_INCOMPLET:')) {
        const parts = msg.replace('SPRINT_INCOMPLET:', '').split('/');
        const done = parts[0], total = parts[1];
        ClinisysAlert.confirm({
          title: 'Sprint incomplet',
          text: `Seulement ${done}/${total} tâches sont terminées. Voulez-vous forcer la clôture malgré les tâches en cours ?`,
          confirmText: 'Forcer la clôture',
          danger: true
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await cloturerSprint(sprintId, true);
              loadAll();
              ClinisysAlert.success("Sprint clôturé avec succès");
            } catch {
              ClinisysAlert.error("Erreur", "Impossible de clôturer le sprint");
            }
          }
        });
      } else {
        ClinisysAlert.error("Erreur", err.response?.data?.message || 'Erreur lors de la clôture du sprint');
      }
    }
  };

  const openAddSprintModal = () => {
    const nextIdx = sprints.length + 1;
    let nextStart = new Date().toISOString().split('T')[0];
    
    // Si un sprint existe déjà, on commence le lendemain de sa fin théorique
    if (sprints.length > 0) {
      const lastSprint = sprints[sprints.length - 1];
      const d = new Date(lastSprint.dateFin);
      d.setDate(d.getDate() + 1);
      nextStart = d.toISOString().split('T')[0];
    }

    const nextDateFin = calculateDateFin(nextStart, 15);
    setSprintForm({
      ...EMPTY_SPRINT,
      numero: nextIdx,
      nom: `Sprint ${nextIdx}`,
      dateDebut: nextStart,
      nbJours: 15, // Valeur par défaut standard
      dateFin: nextDateFin
    });
    // Par défaut, la session de suivi est à la date de sortie (dateFin) à 09:00
    setDatesMots([`${nextDateFin}T09:00`]);
    setShowModal(true);
  };

  const openAffecter = async (sprint) => {
    setActiveSprint(sprint);
    setTachesSelectionnees([]);
    try {
      const { data } = await getTachesDisponibles(stageId);
      setTachesDisponibles(data);
      setShowAffecter(true);
    } catch (err) {
      ClinisysAlert.error("Erreur", "Impossible de charger les tâches");
    }
  };

  return (
    <div className={`app-layout ${sidebarMini ? 'sidebar-mini' : ''}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      
      <main className="main-content fade-in">
        <header className="elite-manager-header">
           <div className="header-nav-box">
              <button className="back-btn-elite" onClick={() => navigate('/encadrant/stages')}>
                 <ChevronLeft size={18} /> <span>Explorer les Hubs</span>
              </button>
              <div className="title-stack">
                 <h1 className="gradient-text">Ingénierie Agile</h1>
                 <p className="subtitle-elite">
                   {stage?.sujet} — <span className="highlight">{stage?.stagiairePrenom} {stage?.stagiaireNom}</span> 
                   {stage?.stagiaire2Id && <span className="binome-tag"> & {stage.stagiaire2Prenom}</span>}
                 </p>
              </div>
           </div>
           <div className="manager-actions">
              <button className="btn btn-outline elite-btn-ghost" onClick={() => navigate(`/encadrant/taches/${stageId}`)}>
                 <CheckSquare size={18} /> <span>Backlog Projet</span>
              </button>
              {stage?.statut !== 'VALIDE' && (
                 <button className="btn btn-primary elite-btn" onClick={openAddSprintModal}>
                    <Plus size={18} /> <span>New Sprint</span>
                 </button>
              )}
           </div>
        </header>

        {stage?.stagiaire2Id && (
          <div className="binome-intelligence-alert">
             <Info size={20} />
             <p>Mode <strong>Binôme Collaboratif</strong> actif. Toutes les métriques sont automatiquement synchronisées entre les co-stagiaires.</p>
          </div>
        )}

        {loading ? (
          <div className="center-loader">
             <RefreshCw className="spin" size={40} />
             <p>Initialisation du pipeline agile...</p>
          </div>
        ) : sprints.length === 0 ? (
          <div className="empty-manager-state">
             <div className="icon-pulse" style={{ color: 'var(--primary)', marginBottom: 24, opacity: 0.2 }}><Rocket size={64} /></div>
             <h3>Aucun pipeline détecté</h3>
             <p>Initialisez votre premier cycle de sprint pour commencer le suivi technique.</p>
             {stage?.statut !== 'VALIDE' && (
                <button className="btn btn-primary elite-btn" style={{marginTop:24}} onClick={openAddSprintModal}>Développer Sprint 1</button>
             )}
          </div>
        ) : (
          <div className="sprint-pipeline">
             {sprints.map((sprint, idx) => {
               const config = STATUT_SPRINT[sprint.statut] || STATUT_SPRINT.PLANIFIE;
               const isOpen = openSprint === sprint.id;
               const StatusIcon = config.icon;
               const sprintTaches = taches[sprint.id] || [];

               return (
                 <motion.div 
                   key={sprint.id} 
                   initial={{ opacity:0, y:20 }} 
                   animate={{ opacity:1, y:0 }} 
                   transition={{ delay: idx * 0.1 }}
                   className={`sprint-card-elite ${isOpen ? 'is-open' : ''}`}
                 >
                   <div className="sprint-card-header" onClick={() => toggleSprint(sprint.id)}>
                      <div className="sprint-num-badge">#{sprint.numero}</div>
                      <div className="sprint-main-info">
                         <h3 className="sprint-name">{sprint.nom}</h3>
                         <div className="sprint-sub-meta">
                            <span className="meta-item"><Calendar size={12} /> {sprint.dateDebut} — {sprint.dateFin}</span>
                            <span className="meta-item"><Layers size={12} /> {stage?.stagiaire2Id ? Math.ceil(sprint.nbTaches/2) : sprint.nbTaches} Tâches uniques</span>
                         </div>
                      </div>
                      
                      <div className="sprint-progress-zone">
                         <div className="progress-mini-bar">
                            <div className="p-fill" style={{ width: `${sprint.tauxAvancement || 0}%` }} />
                         </div>
                         <span className="p-text">{Math.round(sprint.tauxAvancement || 0)}%</span>
                      </div>

                      <div className="sprint-status-zone">
                         <div className="status-pill-v2" style={{ color: config.color, background: config.bg }}>
                            <StatusIcon size={14} />
                            <span>{config.label}</span>
                         </div>
                         {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                   </div>

                   <AnimatePresence>
                     {isOpen && (
                       <motion.div 
                         initial={{ height: 0, opacity: 0 }} 
                         animate={{ height: 'auto', opacity: 1 }} 
                         exit={{ height: 0, opacity: 0 }}
                         className="sprint-expanded-content"
                       >
                          <div className="sprint-details-grid">
                             <div className="detail-box">
                                <label><Target size={14} /> Objectifs Stratégiques</label>
                                <p>{sprint.objectifs || "Aucun objectif spécifié."}</p>
                             </div>
                             <div className="sprint-actions-hub">
                                 {stage?.statut !== 'VALIDE' && (
                                   <>
                                      {sprint.statut === 'PLANIFIE' && (
                                        <button className="hub-btn primary" onClick={() => ClinisysAlert.confirm({
                                          title: "Démarrer le sprint",
                                          text: "Confirmez-vous le lancement de ce cycle ?",
                                          confirmText: "Démarrer",
                                          icon: 'info'
                                        }).then(res => res.isConfirmed && demarrerSprint(sprint.id).then(() => {
                                          loadAll();
                                          ClinisysAlert.success("Sprint démarré");
                                        }))}><Play size={14} /> Lancer</button>
                                      )}
                                      {sprint.statut === 'EN_COURS' && <button className="hub-btn success" onClick={() => handleCloturerSprint(sprint.id)}><StopCircle size={14} /> Clôturer</button>}
                                      <button className="hub-btn ghost" onClick={() => openAffecter(sprint)}><Plus size={14} /> Affecter Tâches</button>
                                      {sprint.statut === 'PLANIFIE' && sprint.nbTaches === 0 && (
                                        <button className="hub-btn danger-ghost" onClick={() => ClinisysAlert.confirm({
                                        title: "Supprimer le sprint vide",
                                        text: "Voulez-vous supprimer ce sprint vide ? Cette action supprimera également les séances de suivi associées.",
                                        confirmText: "Supprimer",
                                        danger: true
                                      }).then(res => res.isConfirmed && deleteSprint(sprint.id).then(() => {
                                        loadAll();
                                        ClinisysAlert.success("Sprint supprimé");
                                      }))}><Trash2 size={14} /></button>
                                      )}
                                   </>
                                 )}
                                 {stage?.statut === 'VALIDE' && (
                                   <div className="locked-badge"><Rocket size={14} /> ARCHIVES SCELLÉES</div>
                                 )}
                             </div>
                          </div>

                          <div className="sprint-taches-section">
                             <h4 className="section-title">Workflow des Tâches</h4>
                             {sprintTaches.length === 0 ? (
                               <div className="empty-taches-box">
                                  <CheckSquare size={32} opacity={0.2} />
                                  <p>Aucune tâche assignée à ce pipeline.</p>
                               </div>
                             ) : (
                               <div className="taches-pipeline-grid">
                                  {sprintTaches.map(t => {
                                    const ts = STATUT_TACHE[t.statut] || STATUT_TACHE.A_FAIRE;
                                    return (
                                      <div key={t.id} className="tache-item-premium">
                                         <div className="prio-marker" style={{ background: PRIORITE_COLORS[t.priorite] }} />
                                         <div className="t-content">
                                            <div className="t-top">
                                               <span className="t-title">{t.titre}</span>
                                               <div className="t-status" style={{ color: ts.color, background: ts.bg }}>{ts.label}</div>
                                            </div>
                                            <div className="t-meta">
                                               <div className="t-assignees">
                                                  {t.stagiairesNoms?.map((n, i) => <span key={i} className="a-badge"><Users size={10} /> {n}</span>)}
                                               </div>
                                                {stage?.statut !== 'VALIDE' && t.statut === 'A_FAIRE' && (
                                                  <button className="remove-t-btn" onClick={() => ClinisysAlert.confirm({
                                                    title: "Retirer la tâche",
                                                    text: "Voulez-vous dissocier cette tâche du sprint ?",
                                                    confirmText: "Retirer",
                                                    danger: true
                                                  }).then(res => res.isConfirmed && retirerTacheDuSprint(t.id).then(() => {
                                                    loadTaches(sprint.id);
                                                    ClinisysAlert.success("Tâche retirée");
                                                  }))}><Trash2 size={12} /></button>
                                                )}
                                            </div>
                                         </div>
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

        {/* MODERN MODALS */}
        <AnimatePresence>
          {showModal && (
            <div className="elite-modal-overlay">
               <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} className="elite-modal-card-lg">
                  <div className="modal-header">
                     <h2>Sprint Intelligence</h2>
                     <p>Paramétrez votre prochain cycle agile</p>
                  </div>
                  <form onSubmit={handleCreateSprint} className="elite-manager-form">
                     <div className="form-row">
                        <div className="form-group-v3">
                           <label>Nom du cycle</label>
                           <input value={sprintForm.nom} onChange={sf('nom')} required placeholder="Ex: Sprint 1 — Design & UI" />
                        </div>
                        <div className="form-group-v3 sm">
                           <label>Index</label>
                            <input type="number" value={sprintForm.numero} readOnly disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                        </div>
                     </div>
                     <div className="form-group-v3">
                        <label>Vision & Objectifs</label>
                        <textarea value={sprintForm.objectifs} onChange={sf('objectifs')} rows={2} placeholder="Précisez la valeur ajoutée du sprint..." />
                     </div>
                     <div className="form-row dates-row">
                        <div className="form-group-v3">
                           <label>Échéance Début</label>
                           <input type="date" value={sprintForm.dateDebut} onChange={sf('dateDebut')} min={sprints.length > 0 ? sprints[sprints.length - 1].dateFin : (stage?.dateDebut || '')} required />
                        </div>
                        <div className="form-group-v3">
                           <label>Durée (jours)</label>
                           <input 
                             type="number" 
                             step="1" 
                             min="1"
                             value={sprintForm.nbJours} 
                             onChange={sf('nbJours')} 
                             onKeyPress={(e) => { if(!/[0-9]/.test(e.key)) e.preventDefault(); }}
                             required 
                           />
                        </div>
                        <div className="form-group-v3">
                           <label>Sortie Prévue</label>
                           <input type="date" value={sprintForm.dateFin} readOnly disabled />
                           {stage?.dateFin && (
                             <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, display: 'block', fontWeight: 600 }}>
                               Max: {stage.dateFin}
                             </span>
                           )}
                        </div>
                     </div>

                     <div className="dates-mots-section">
                        <div className="section-head">
                           <label><Clock size={16} /> Sessions de Suivi Automatisées</label>
                           <button type="button" className="add-date-btn" onClick={() => setDatesMots([...datesMots, ''])}>+ Slot</button>
                        </div>
                        <div className="dates-grid">
                           {datesMots.map((d, i) => (
                             <div key={i} className="date-slot">
                                <input type="datetime-local" value={d} onChange={e => {
                                  let copy = [...datesMots]; copy[i] = e.target.value; setDatesMots(copy);
                                }} />
                                <button type="button" className="del-btn" onClick={() => setDatesMots(datesMots.filter((_, idx) => idx !== i))}>×</button>
                             </div>
                           ))}
                        </div>
                     </div>

                     {errorModal && <div className="error-banner">{errorModal}</div>}
                     <div className="modal-actions-v3">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary elite-btn" disabled={saving}>Générer le Sprint</button>
                     </div>
                  </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL AFFECTER TÂCHES */}
        <AnimatePresence>
          {showAffecter && activeSprint && (
            <div className="elite-modal-overlay">
               <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} className="elite-modal-card-md">
                  <div className="modal-header">
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                           <h2>Backlog Orchestration</h2>
                           <p>Affectation pour {activeSprint.nom}</p>
                        </div>
                        <button 
                          className="btn btn-ghost" 
                          style={{ fontSize: 12, padding: '8px 12px', border: '1px solid var(--border)' }}
                          onClick={() => {
                            if (tachesSelectionnees.length === tachesDisponibles.length) setTachesSelectionnees([]);
                            else setTachesSelectionnees(tachesDisponibles.map(t => t.id));
                          }}
                        >
                          {tachesSelectionnees.length === tachesDisponibles.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </button>
                     </div>
                  </div>
                  <div className="taches-selectable-list">
                    {tachesDisponibles.map(t => (
                      <div key={t.id} className={`t-select-item ${tachesSelectionnees.includes(t.id) ? 'selected' : ''}`}
                           onClick={() => setTachesSelectionnees(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}>
                          <div className="checkbox-elite" />
                          <div className="t-info">
                             <span className="name">{t.titre}</span>
                             <span className="prio" style={{ color: PRIORITE_COLORS[t.priorite] }}>{t.priorite}</span>
                          </div>
                      </div>
                    ))}
                  </div>
                  <div className="modal-actions-v3">
                     <button type="button" className="btn btn-ghost" onClick={() => setShowAffecter(false)}>Annuler</button>
                     <button type="button" className="btn btn-primary elite-btn" disabled={savingAff || tachesSelectionnees.length === 0} onClick={async () => {
                          setSavingAff(true);
                          try {
                            for (const id of tachesSelectionnees) {
                              await affecterTacheASprint(id, activeSprint.id);
                            }
                            setShowAffecter(false);
                            loadTaches(activeSprint.id);
                            loadAll();
                            ClinisysAlert.success(`${tachesSelectionnees.length} tâches affectées avec succès.`);
                          } catch (err) {
                            ClinisysAlert.error("Erreur", "Une ou plusieurs tâches n'ont pas pu être affectées.");
                          } finally {
                            setSavingAff(false);
                          }
                       }}>
                         {savingAff ? 'Affectation...' : 'Confirmer Affectation'}
                       </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <div style={{ visibility: 'hidden', height: 0 }}></div>

      <style dangerouslySetInnerHTML={{ __html: `
        .elite-manager-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
        .back-btn-elite { display: flex; align-items: center; gap: 8px; background: none; border: none; color: var(--primary); font-weight: 800; font-size: 13px; cursor: pointer; margin-bottom: 12px; }
        .subtitle-elite { font-size: 16px; color: var(--text-3); margin-top: 4px; }
        .highlight { color: var(--text); font-weight: 800; }
        .binome-tag { color: #8b5cf6; font-weight: 800; }
        .manager-actions { display: flex; gap: 16px; }

        .binome-intelligence-alert {
          display: flex; align-items: center; gap: 12px; background: rgba(139,92,246,0.1);
          color: #8b5cf6; padding: 16px 24px; border-radius: 20px; border: 1.5px solid rgba(139,92,246,0.2);
          margin-bottom: 32px; font-size: 14px;
        }

        .sprint-pipeline { display: flex; flex-direction: column; gap: 16px; }
        .sprint-card-elite {
          background: var(--surface); border: 1.5px solid var(--border); border-radius: 24px;
          transition: all 0.3s; overflow: hidden;
        }
        .sprint-card-elite:hover { border-color: var(--primary); transform: translateX(8px); }
        .sprint-card-elite.is-open { border-color: var(--primary); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }

        .sprint-card-header { padding: 24px 32px; display: flex; align-items: center; cursor: pointer; gap: 24px; }
        .sprint-num-badge {
          width: 50px; height: 50px; border-radius: 16px; background: var(--primary-light-alpha);
          color: var(--primary); display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 18px; line-height: 1;
        }
        .sprint-main-info { flex: 1; }
        .sprint-name { font-size: 17px; font-weight: 900; color: var(--text); }
        .sprint-sub-meta { display: flex; gap: 20px; margin-top: 6px; }
        .meta-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-3); font-weight: 700; }

        .sprint-progress-zone { width: 140px; display: flex; flex-direction: column; gap: 8px; }
        .progress-mini-bar { width: 100%; height: 6px; background: var(--border); border-radius: 10px; overflow: hidden; }
        .p-fill { height: 100%; background: var(--primary); border-radius: 10px; }
        .p-text { font-size: 11px; font-weight: 900; color: var(--text-2); text-align: right; }

        .sprint-status-zone { display: flex; align-items: center; gap: 20px; min-width: 180px; justify-content: flex-end; }
        .status-pill-v2 { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 12px; font-size: 12px; font-weight: 800; }

        .sprint-expanded-content { border-top: 1.5px solid var(--border); padding: 32px; background: var(--bg-alpha); }
        .sprint-details-grid { display: grid; grid-template-columns: 1fr 340px; gap: 32px; margin-bottom: 32px; }
        .detail-box label { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 900; color: var(--primary); text-transform: uppercase; margin-bottom: 12px; }
        .detail-box p { font-size: 14px; color: var(--text-2); line-height: 1.6; font-weight: 600; }
        .sprint-actions-hub { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; height: fit-content; }
        .hub-btn { padding: 10px 18px; border-radius: 12px; border: none; font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s; }
        .hub-btn.primary { background: var(--primary); color: #fff; }
        .hub-btn.success { background: #10b981; color: #fff; }
        .hub-btn.ghost { background: var(--surface); border: 1.5px solid var(--border); color: var(--text-2); }
        .hub-btn.danger-ghost { background: rgba(239,68,68,0.05); color: #ef4444; }
        .locked-badge { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--bg-alpha); color: var(--text-3); border-radius: 12px; font-size: 11px; font-weight: 900; letter-spacing: 1px; border: 1.5px solid var(--border); }

        .sprint-taches-section { margin-top: 32px; padding-top: 32px; border-top: 1.5px dashed var(--border); }
        .section-title { font-size: 16px; font-weight: 900; margin-bottom: 24px; color: var(--text); }
        .taches-pipeline-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .tache-item-premium {
          display: flex; background: var(--surface); border: 1.5px solid var(--border); border-radius: 16px;
          overflow: hidden; height: 74px; transition: 0.2s;
        }
        .tache-item-premium:hover { border-color: var(--primary); }
        .prio-marker { width: 5px; height: 100%; }
        .t-content { flex: 1; padding: 14px 18px; display: flex; flex-direction: column; justify-content: space-between; }
        .t-top { display: flex; justify-content: space-between; align-items: center; }
        .t-title { font-weight: 700; font-size: 14px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
        .t-status { font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 6px; }
        .t-meta { display: flex; justify-content: space-between; align-items: center; }
        .t-assignees { display: flex; gap: 6px; }
        .a-badge { display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 800; color: var(--text-3); }
        .remove-t-btn { background: none; border: none; color: var(--text-3); cursor: pointer; }
        .remove-t-btn:hover { color: #ef4444; }

        .elite-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .elite-modal-card-lg { background: var(--surface); width: 100%; max-width: 640px; border-radius: 28px; padding: 32px 40px; box-shadow: 0 30px 80px rgba(0,0,0,0.2); }
        .elite-modal-card-md { background: var(--surface); width: 100%; max-width: 480px; border-radius: 24px; padding: 32px; }
        
        .elite-manager-form { display: flex; flex-direction: column; gap: 16px; }
        .form-row { display: flex; gap: 16px; }
        .sm { width: 100px; }
        .form-group-v3 label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--primary); margin-bottom: 6px; letter-spacing: 0.8px; }
        .form-group-v3 input, .form-group-v3 textarea {
          width: 100%; padding: 12px 16px; border: 1.5px solid var(--border); border-radius: 12px; 
          background: var(--bg); font-weight: 700; font-size: 14px; outline: none; transition: 0.3s;
        }
        .form-group-v3 input:focus { border-color: var(--primary); background: #fff; }
        .dates-row { background: var(--bg-alpha); padding: 16px; border-radius: 16px; gap: 12px; }
        .dates-row .form-group-v3 { flex: 1; }

        .dates-mots-section { background: var(--bg-alpha); border: 1.5px dashed var(--border); border-radius: 16px; padding: 16px; }
        .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .section-head label { font-weight: 800; display: flex; align-items: center; gap: 8px; color: var(--text-2); font-size: 12px; margin-bottom: 0; }
        .add-date-btn { background: var(--primary); color: #fff; border: none; padding: 5px 12px; border-radius: 8px; font-weight: 800; font-size: 11px; cursor: pointer; }
        .dates-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .date-slot { display: flex; gap: 8px; }
        .date-slot input { flex: 1; padding: 8px 12px; border-radius: 8px; border: 1.5px solid var(--border); font-size: 12px; font-weight: 700; }
        .del-btn { width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(239,68,68,0.1); color: #ef4444; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        .modal-actions-v3 { display: flex; justify-content: flex-end; gap: 16px; margin-top: 24px; }
        .taches-selectable-list { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding: 10px; margin: 20px 0; }
        .t-select-item { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 14px; background: var(--bg); border: 1.5px solid var(--border); cursor: pointer; transition: 0.2s; }
        .t-select-item:hover { border-color: var(--primary); }
        .t-select-item.selected { background: var(--primary-light-alpha); border-color: var(--primary); }
        .checkbox-elite { width: 20px; height: 20px; border: 2px solid var(--border); border-radius: 6px; }
        .selected .checkbox-elite { background: var(--primary); border-color: var(--primary); }

        .icon-pulse { animation: iconPulse 2s infinite; color: var(--primary); margin-bottom: 24px; opacity: 0.2; }
        @keyframes iconPulse { 0% { opacity:0.1; transform:scale(0.9); } 50% { opacity:0.3; transform:scale(1.1); } 100% { opacity:0.1; transform:scale(0.9); } }
      ` }} />
    </div>
  );
}
