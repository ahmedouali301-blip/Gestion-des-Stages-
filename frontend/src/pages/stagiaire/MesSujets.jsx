import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/common/Sidebar";
import Topbar from "../../components/common/Topbar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getSujetsDisponibles,
  getMonChoix,
  choisirSujet,
  annulerChoix,
} from "../../api/sujetAPI";
import ConfirmModal from "../../components/common/ConfirmModal";
import { 
  BookOpen, Search, Filter, CheckCircle, 
  Clock, XCircle, Info, Users, 
  Calendar, Layers, ArrowRight, Star,
  Check, Lock, Megaphone, Sparkles
} from 'lucide-react';

const NAV = [
  { path: "/stagiaire/dashboard", icon: "⊞", label: "Mon espace" },
  { path: "/stagiaire/sujets", icon: "📝", label: "Sujets" },
  { path: '/stagiaire/sprints',     icon: '🔄', label: 'Mes sprints'     },
  { path: "/stagiaire/taches", icon: "✅", label: "Mes tâches" },
  { path: "/stagiaire/reunions", icon: "📅", label: "Mes réunions" },
  { path: "/stagiaire/evaluations", icon: "⭐", label: "Mes évaluations" },
];

const TYPE_CONFIG = {
  PFE: { bg: "rgba(99,102,241,0.1)", color: "#6366f1", label: "PFE" },
  PFA: { bg: "rgba(16,185,129,0.1)", color: "#10b981", label: "PFA" },
  STAGE_ETE: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Stage Été" },
};

export default function MesSujets() {
  const { user } = useAuth();
  const { sidebarMini } = useTheme();

  const [sujets, setSujets] = useState([]);
  const [monChoix, setMonChoix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("TOUS");

  const [confirm, setConfirm] = useState({ isOpen: false, title: "", message: "", confirmText: "Confirmer", type: "primary", onConfirm: () => {} });

  const closeConfirm = () => setConfirm((p) => ({ ...p, isOpen: false }));

  useEffect(() => {
    if (user?.id) loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sujetsRes, choixRes] = await Promise.all([
        getSujetsDisponibles(),
        getMonChoix(user.id).catch(() => ({ data: null })),
      ]);
      setSujets(sujetsRes.data);
      setMonChoix(choixRes.data || null);
    } catch {
      setError("Erreur synchronisation catalogue");
    } finally {
      setLoading(false);
    }
  };

  const sujetsFiltres = sujets.filter((s) => {
    const matchType = typeFilter === "TOUS" || s.type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = !search || s.titre.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const handleChoisir = async (sujet) => {
    setActionId(sujet.id); setError(""); setSuccess("");
    try {
      await choisirSujet(sujet.id, user.id);
      setSuccess(`Optimisation réussie : Sujet "${sujet.titre}" réservé.`);
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Échec de la réservation.");
    } finally {
      setActionId(null); closeConfirm();
    }
  };

  const handleAnnuler = async () => {
    try {
      await annulerChoix(user.id);
      setSuccess("Réservation annulée. Le catalogue est de nouveau ouvert.");
      setMonChoix(null); await loadAll();
    } catch (err) {
      setError("Échec de l'annulation.");
    } finally { closeConfirm(); }
  };

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      
      <main className="main-content fade-in">
        <header className="elite-subjects-header">
           <div className="title-stack">
              <h1 className="gradient-text">Catalogue des Projets</h1>
              <p>Explorez et réservez votre sujet de stage pour la saison 2024</p>
           </div>
           
           <div className="catalog-filters-elite">
              <div className="search-box-v2">
                 <Search size={18} />
                 <input placeholder="Rechercher une expertise..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="type-filters">
                 {["TOUS", "PFE", "PFA", "STAGE_ETE"].map((t) => (
                   <button key={t} onClick={() => setTypeFilter(t)} className={`filter-chip ${typeFilter === t ? 'active' : ''}`}>
                      {t === "TOUS" ? "Tous les types" : TYPE_CONFIG[t]?.label || t}
                   </button>
                 ))}
              </div>
           </div>
        </header>

        <AnimatePresence>
          {(error || success) && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="status-banners-container">
               {error && <div className="elite-banner danger"><XCircle size={18} /> {error}</div>}
               {success && <div className="elite-banner success"><CheckCircle size={18} /> {success}</div>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CURRENT SELECTION HUB */}
        {monChoix && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="my-selection-hub">
             <div className="hub-glass-bg"></div>
             <div className="hub-indicator"><Sparkles size={16} /> RÉSERVATION ACTIVE</div>
             <div className="hub-content">
                <div className="hub-details">
                   <h3>{monChoix.sujetTitre}</h3>
                   <div className="hub-meta-grid">
                      <div className="h-m-item"><Layers size={14} /> <span>{TYPE_CONFIG[monChoix.sujetType]?.label || monChoix.sujetType}</span></div>
                      <div className="h-m-item"><Calendar size={14} /> <span>{monChoix.sujetDateDebut} → {monChoix.sujetDateFin}</span></div>
                      <div className="h-m-item"><Clock size={14} /> <span>Réservé le {new Date(monChoix.dateChoix).toLocaleDateString()}</span></div>
                   </div>
                </div>
                <div className="hub-actions">
                   {monChoix.sujetStatut === "VALIDE" ? (
                     <div className="validated-status"><Lock size={16} /> DOSSIER VALIDÉ</div>
                   ) : (
                     <button className="btn-cancel-reservation" onClick={() => setConfirm({
                        isOpen: true, title: "Libérer le sujet", 
                        message: "Votre réservation sera annulée et le sujet redeviendra disponible pour les autres candidats.",
                        confirmText: "Annuler Réservation", type: "danger", onConfirm: handleAnnuler
                     })}>LIBÉRER LE SUJET</button>
                   )}
                </div>
             </div>
          </motion.section>
        )}

        {!monChoix && !loading && (
          <div className="catalog-onboarding-alert">
             <Megaphone size={20} />
             <p>Le catalogue est ouvert. Sélectionnez un sujet pour initier votre processus d'affectation.</p>
          </div>
        )}

        {/* SUBJECTS GRID */}
        {loading ? (
          <div className="loader-full"><RefreshCw className="spin" size={40} /> Synchronisation du catalogue...</div>
        ) : sujetsFiltres.length === 0 ? (
          <div className="empty-catalog-state">
             <BookOpen size={64} opacity={0.1} />
             <h3>Catalogue vide ou filtré</h3>
             <p>Aucun sujet ne correspond à vos critères de recherche actuels.</p>
          </div>
        ) : (
          <div className="subject-marketplace-grid">
             {sujetsFiltres.map((s, idx) => {
               const config = TYPE_CONFIG[s.type] || { bg: "#f3f4f6", color: "#6b7280", label: s.type };
               const isSelected = monChoix?.sujetId === s.id;
               const isFull = s.estComplet;

               return (
                 <motion.div 
                   key={s.id} 
                   initial={{ opacity: 0, scale: 0.9 }} 
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: idx * 0.05 }}
                   className={`subject-premium-card ${isSelected ? 'selected' : ''} ${isFull && !isSelected ? 'is-full' : ''}`}
                 >
                    <div className="card-top-bar">
                       <span className="type-tag" style={{ background: config.bg, color: config.color }}>{config.label}</span>
                       <div className="capacity-badge">
                          <Users size={12} /> {s.nbChoixActuels}/{s.nbMaxStagiaires}
                       </div>
                    </div>
                    
                    <h3 className="s-card-title">{s.titre}</h3>
                    <p className="s-card-desc">{s.description || "Spécifications techniques en cours de déploiement."}</p>
                    
                    <div className="s-card-footer">
                       <div className="footer-meta">
                          <div className="f-m-item"><Calendar size={12} /> {s.dateDebut}</div>
                          <div className="f-m-item"><Users size={12} /> {s.nbMaxStagiaires === 2 ? 'Binôme' : 'Monôme'}</div>
                       </div>
                       
                       <div className="selection-zone">
                          {isSelected ? (
                            <div className="status-selected"><Check size={16} /> VOTRE CHOIX</div>
                          ) : isFull ? (
                            <div className="status-full"><Lock size={14} /> COMPLET</div>
                          ) : monChoix ? (
                            <div className="status-blocked">Indisponible</div>
                          ) : (
                            <button className="btn-select-subject" onClick={() => setConfirm({
                               isOpen: true, title: "Engagement de Sujet",
                               message: `Voulez-vous réserver le sujet "${s.titre}" ?`,
                               confirmText: "Confirmer Choix", type: "primary", onConfirm: () => handleChoisir(s)
                            })}>RÉSERVER <ArrowRight size={14} /></button>
                          )}
                       </div>
                    </div>
                    
                    {isSelected && <div className="selected-glow"></div>}
                 </motion.div>
               );
             })}
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={confirm.isOpen} title={confirm.title} message={confirm.message}
        confirmText={confirm.confirmText} type={confirm.type} onClose={closeConfirm} onConfirm={confirm.onConfirm}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .elite-subjects-header { display: flex; flex-direction: column; gap: 32px; margin-bottom: 40px; }
        .title-stack h1 { font-size: 32px; font-weight: 900; }
        .title-stack p { color: var(--text-3); font-size: 16px; margin-top: 4px; }
        
        .catalog-filters-elite { display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; }
        .search-box-v2 { 
          flex: 1; min-width: 300px; display: flex; align-items: center; gap: 12px; 
          background: var(--surface); border: 1.5px solid var(--border); 
          padding: 12px 20px; border-radius: 16px; transition: 0.3s;
        }
        .search-box-v2:focus-within { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-light-alpha); }
        .search-box-v2 input { border: none; background: none; outline: none; width: 100%; font-weight: 700; color: var(--text); }
        
        .type-filters { display: flex; gap: 12px; }
        .filter-chip { 
          padding: 10px 20px; border-radius: 12px; border: 1.5px solid var(--border); 
          background: var(--surface); color: var(--text-3); font-weight: 800; font-size: 13px; 
          cursor: pointer; transition: 0.2s; 
        }
        .filter-chip.active { background: var(--primary); color: #fff; border-color: var(--primary); }

        .my-selection-hub { 
          position: relative; padding: 40px; border-radius: 32px; border: 2px solid var(--primary); 
          margin-bottom: 40px; overflow: hidden; background: var(--surface);
        }
        .hub-glass-bg { position: absolute; inset: 0; background: linear-gradient(135deg, var(--primary-light-alpha) 0%, transparent 100%); pointer-events: none; }
        .hub-indicator { 
          display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 900; 
          color: var(--primary); letter-spacing: 2px; margin-bottom: 20px; 
        }
        .hub-content { display: flex; justify-content: space-between; align-items: center; gap: 40px; }
        .hub-details h3 { font-size: 24px; font-weight: 900; color: var(--text); margin-bottom: 16px; }
        .hub-meta-grid { display: flex; gap: 32px; }
        .h-m-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-2); font-weight: 700; }
        
        .validated-status { 
          display: flex; align-items: center; gap: 10px; padding: 12px 24px; 
          background: #10b981; color: #fff; border-radius: 14px; font-weight: 900; font-size: 14px;
        }
        .btn-cancel-reservation { 
          background: rgba(239,68,68,0.1); color: #ef4444; border: 1.5px solid rgba(239,68,68,0.2); 
          padding: 12px 24px; border-radius: 14px; font-weight: 900; font-size: 13px; 
          cursor: pointer; transition: 0.2s; 
        }
        .btn-cancel-reservation:hover { background: #ef4444; color: #fff; }

        .catalog-onboarding-alert { 
          display: flex; align-items: center; gap: 16px; padding: 20px 32px; 
          background: var(--bg-alpha); border-radius: 20px; border: 1.5px solid var(--border); 
          margin-bottom: 40px; color: var(--text-3); font-weight: 700; font-size: 14px;
        }

        .subject-marketplace-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 24px; }
        .subject-premium-card { 
          background: var(--surface); border: 1.5px solid var(--border); padding: 32px; 
          border-radius: 24px; display: flex; flex-direction: column; gap: 20px; 
          transition: 0.3s; position: relative;
        }
        .subject-premium-card:hover { border-color: var(--primary); transform: translateY(-8px); }
        .subject-premium-card.selected { border-color: var(--primary); box-shadow: 0 20px 40px var(--primary-light-alpha); }
        .subject-premium-card.is-full { opacity: 0.6; }
        
        .card-top-bar { display: flex; justify-content: space-between; align-items: center; }
        .type-tag { padding: 4px 14px; border-radius: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; }
        .capacity-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-3); font-weight: 800; }
        
        .s-card-title { font-size: 18px; font-weight: 900; color: var(--text); line-height: 1.4; height: 50px; overflow: hidden; }
        .s-card-desc { font-size: 13px; color: var(--text-3); line-height: 1.6; height: 60px; overflow: hidden; }
        
        .s-card-footer { border-top: 1.5px dashed var(--border); padding-top: 20px; display: flex; justify-content: space-between; align-items: center; }
        .footer-meta { display: flex; flex-direction: column; gap: 4px; }
        .f-m-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-3); font-weight: 700; }
        
        .status-selected { color: var(--primary); font-weight: 900; font-size: 13px; display: flex; align-items: center; gap: 8px; }
        .status-full { color: #f59e0b; font-weight: 900; font-size: 13px; display: flex; align-items: center; gap: 8px; }
        .status-blocked { color: var(--text-3); font-size: 12px; font-weight: 700; font-style: italic; }
        .btn-select-subject { 
          background: var(--primary); color: #fff; border: none; padding: 10px 20px; 
          border-radius: 12px; font-weight: 900; font-size: 13px; cursor: pointer; 
          display: flex; align-items: center; gap: 8px; transition: 0.2s;
        }
        .btn-select-subject:hover { transform: scale(1.05); }

        .selected-glow { position: absolute; inset: 0; pointer-events: none; border-radius: 24px; box-shadow: inset 0 0 0 2px var(--primary); }
      ` }} />
    </div>
  );
}

import { RefreshCw } from 'lucide-react';
