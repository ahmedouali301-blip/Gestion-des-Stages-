import React, { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar";
import Topbar from "../../components/common/Topbar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getAllStages,
  createStage,
  changerStatutStage,
  deleteStage,
} from "../../api/stageAPI";
import { getByRole } from "../../api/utilisateurAPI";
import { getMonChoix, getChoixBySession } from "../../api/sujetAPI";
import { getDossiersByResponsable } from "../../api/dossierStageAPI";
import { 
  Trash2, ChevronRight, Info, Clock, GraduationCap, RefreshCw,
  LayoutDashboard, ClipboardList, FileText, BarChart, Plus, Search, Filter, Calendar, CheckCircle, XCircle, PlayCircle, TrendingUp, Briefcase, Users
} from 'lucide-react';
import api from "../../api/axiosConfig";
import { motion, AnimatePresence } from "framer-motion";
import ClinisysAlert from "../../utils/SwalUtils";
import { useSession } from "../../context/SessionContext";

const NAV = [
  { path: "/responsable/dashboard", icon: <LayoutDashboard size={18} />, label: "Tableau de bord" },
  { path: "/responsable/stages", icon: <ClipboardList size={18} />, label: "Stages" },
  { path: "/responsable/sujets", icon: <FileText size={18} />, label: "Sujets" },
  { path: "/responsable/stagiaires", icon: <GraduationCap size={18} />, label: "Stagiaires" },
  { path: "/responsable/analytique", icon: <BarChart size={18} />, label: "Analytique" },
];

const STATUT_COLORS = {
  EN_COURS: { bg: "#e8f2fb", color: "#0a5c9e", label: "En cours" },
  VALIDE: { bg: "#f0fdf4", color: "#16a34a", label: "Validé" },
  INTERROMPU: { bg: "#fdf0f0", color: "#e03c3c", label: "Interrompu" },
  EN_ATTENTE: { bg: "#fef9ee", color: "#f59e0b", label: "En attente" },
};

const TYPE_LABELS = { PFE: "PFE", PFA: "PFA", STAGE_ETE: "Stage été" };
const EMPTY_FORM = {
  sujet: "",
  description: "",
  dateDebut: new Date().toISOString().split("T")[0],
  dateFin: "",
  nbMois: "",
  type: "PFE",
  stagiaireId: "",
  stagiaire2Id: null,
  encadrantId: "",
  sujetRefId: null,
};

export default function GestionStages() {
  const { user } = useAuth();
  const { sidebarMini } = useTheme();
  const { activeSession } = useSession();

  const [stages, setStages] = useState([]);
  const [dossiersList, setDossiersList] = useState([]);
  const [encadrants, setEncadrants] = useState([]);
  
  const formatYear = (annee) => {
    if (!annee) return "";
    return annee.includes("-") ? annee.split("-")[1] : annee;
  };
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("TOUS");
  const [anneeFilter, setAnneeFilter] = useState(activeSession);
  const [dossiers, setDossiers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);

  // État binôme
  const [loadingFill, setLoadingFill] = useState(false);
  const [sujetInfo, setSujetInfo] = useState(null);
  const [binomeInfo, setBinomeInfo] = useState(null);
  const [stagiairesAyantChoisi, setStagiairesAyantChoisi] = useState([]);

  useEffect(() => {
    load();
  }, [activeSession]);

  useEffect(() => {
    setAnneeFilter(activeSession);
  }, [activeSession]);

  useEffect(() => {
    if (form.dateDebut && form.nbMois) {
      const d = new Date(form.dateDebut);
      d.setMonth(d.getMonth() + parseInt(form.nbMois));
      const endStr = d.toISOString().split("T")[0];
      if (form.dateFin !== endStr) {
        setForm((p) => ({ ...p, dateFin: endStr }));
      }
    }
    if (form.dateDebut && form.dossierId) {
      const selectedYear = form.dateDebut.split('-')[0];
      const currentDossier = dossiers.find(d => String(d.id) === String(form.dossierId));
      if (currentDossier && formatYear(currentDossier.anneeStage) !== selectedYear) {
        setForm(p => ({ ...p, dossierId: "", stagiaireId: null }));
        setSujetInfo(null);
        setBinomeInfo(null);
      }
    }
  }, [form.dateDebut, form.nbMois, form.dossierId]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, doss, enc] = await Promise.all([
        getAllStages(),
        getDossiersByResponsable(user.id, activeSession),
        getByRole("ROLE_ENCADRANT")
      ]);
      setStages(s.data);
      setDossiersList(doss.data);
      setEncadrants(enc.data);

      const idsDossiersUtilises = new Set();
      const idsStagiairesActifs = new Set(); // Stagiaires avec un stage EN_COURS ou EN_ATTENTE

      s.data.forEach(item => {
        if (item.dossierId) idsDossiersUtilises.add(Number(item.dossierId));
        if (item.dossier2Id) idsDossiersUtilises.add(Number(item.dossier2Id));
        
        if (item.statut === "EN_COURS" || item.statut === "EN_ATTENTE") {
          if (item.stagiaireId) idsStagiairesActifs.add(Number(item.stagiaireId));
          if (item.stagiaire2Id) idsStagiairesActifs.add(Number(item.stagiaire2Id));
        }
      });

      // On affiche tous les dossiers qui n'ont pas encore de stage ET dont le stagiaire n'a pas de stage actif ailleurs
      setDossiers(
        doss.data.filter(d => 
          !idsDossiersUtilises.has(Number(d.id)) && 
          !idsStagiairesActifs.has(Number(d.stagiaireId))
        )
      );
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDossierChange = async (dossierId) => {
    const dossier = dossiers.find(d => String(d.id) === String(dossierId));
    const stagiaireId = dossier?.stagiaireId;

    setForm((p) => ({
      ...p,
      dossierId,
      stagiaireId,
      sujet: "",
      description: "",
      type: "PFE",
      stagiaire2Id: null,
      dossier2Id: null,
      sujetRefId: null,
    }));
    setSujetInfo(null);
    setBinomeInfo(null);

    if (!dossierId || !stagiaireId) return;

    setLoadingFill(true);
    try {
      const { data: choix } = await getMonChoix(stagiaireId);
      
      setForm((p) => {
        const defaultStart = p.dateDebut || new Date().toISOString().split("T")[0];
        const defaultEnd = p.dateFin || "";
        let months = p.nbMois;

        return {
          ...p,
          sujet: choix.sujetTitre,
          description: choix.sujetDescription || "",
          dateDebut: defaultStart,
          dateFin: defaultEnd,
          nbMois: months,
          type: choix.sujetType || "PFE",
          sujetRefId: choix.sujetId, // ID de la session occurrence
        };
      });
      setSujetInfo({ titre: choix.sujetTitre, statut: choix.sujetStatut, id: choix.sujetId });

      // --- BINOME DETECTION ---
      const { data: allChoix } = await getChoixBySession(choix.sujetId);
      const binomeChoix = allChoix.find(c => Number(c.stagiaireId) !== Number(stagiaireId));

      if (binomeChoix) {
        // Find matching dossier for binome
        const binomeDossier = dossiersList.find(d => 
          Number(d.stagiaireId) === Number(binomeChoix.stagiaireId) && 
          formatYear(d.anneeStage) === formatYear(dossier.anneeStage)
        );

        if (binomeDossier) {
          setForm(p => ({
            ...p,
            stagiaire2Id: binomeChoix.stagiaireId,
            dossier2Id: binomeDossier.id
          }));
          setBinomeInfo({
            prenom: binomeChoix.stagiairePrenom,
            nom: binomeChoix.stagiaireNom,
            email: binomeChoix.stagiaireEmail || "Étudiant partenaire"
          });
        }
      }
    } catch {
      setSujetInfo(null);
      setBinomeInfo(null);
    } finally {
      setLoadingFill(false);
    }
  };

  const filtered = stages.filter((s) => {
    const matchStatut = statutFilter === "TOUS" || s.statut === statutFilter;
    const yearOfStage = s.dateCreation 
      ? (Array.isArray(s.dateCreation) ? s.dateCreation[0].toString() : new Date(s.dateCreation).getFullYear().toString())
      : (s.dateDebut ? s.dateDebut.split('-')[0] : "");
    const matchAnnee = anneeFilter === "TOUTES" || yearOfStage === anneeFilter;
    
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      s.sujet.toLowerCase().includes(q) ||
      s.stagiaireNom?.toLowerCase().includes(q) ||
      s.stagiairePrenom?.toLowerCase().includes(q) ||
      s.encadrantNom?.toLowerCase().includes(q);
      
    return matchStatut && matchAnnee && matchSearch;
  });

  const availableYears = [...new Set(stages.map(s => 
    s.dateCreation 
      ? new Date(s.dateCreation).getFullYear().toString() 
      : (s.dateDebut ? s.dateDebut.split('-')[0] : "")
  ))].filter(Boolean).sort((a, b) => b - a);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createStage({
        sujet: form.sujet,
        description: form.description,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin,
        type: form.type,
        stagiaireId: Number(form.stagiaireId),
        stagiaire2Id: form.stagiaire2Id ? Number(form.stagiaire2Id) : null,
        dossierId: form.dossierId ? Number(form.dossierId) : null,
        dossier2Id: form.dossier2Id ? Number(form.dossier2Id) : null,
        encadrantId: Number(form.encadrantId),
        responsableId: user?.id,
        sujetRefId: form.sujetRefId,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setSujetInfo(null);
      setBinomeInfo(null);
      load();
      ClinisysAlert.success("Stage lancé avec succès");
    } catch (err) {
      ClinisysAlert.error("Erreur", err.response?.data?.message || "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    
    // Force the year to match activeSession
    const parts = val.split('-');
    const fixedDate = `${activeSession}-${parts[1]}-${parts[2]}`;
    setForm(p => ({ ...p, dateDebut: fixedDate }));
  };

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      <main className="main-content fade-in">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-header-card"
        >
          <div>
            <h1 className="gradient-text" style={{ fontSize: 32, marginBottom: 8 }}>Gestion des Stages</h1>
            <div className="page-subtitle" style={{ fontSize: 16 }}>
              Supervisez le cycle de vie des stages et pilotez les binômes d'excellence.
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '16px 32px', borderRadius: 16, fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 25px -6px var(--primary)' }}
            onClick={() => {
              setShowModal(true);
              setError("");
              setForm({
                ...EMPTY_FORM,
                dateDebut: `${activeSession}-01-01`
              });
              setSujetInfo(null);
              setBinomeInfo(null);
            }}
          >
            <Plus size={20} />
            Lancer un Stage
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card" 
          style={{ marginBottom: 32, padding: '16px 24px' }}
        >
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input 
                placeholder="Rechercher par sujet, stagiaire ou encadrant..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 44, borderRadius: 12, background: 'var(--bg)', border: 'none', marginBottom: 0 }} 
              />
            </div>
            <div style={{ position: 'relative', width: 220 }}>
              <Filter size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <select 
                value={statutFilter} 
                onChange={e => setStatutFilter(e.target.value)}
                style={{ paddingLeft: 44, borderRadius: 12, background: 'var(--bg)', border: 'none', marginBottom: 0 }}
              >
                <option value="TOUS">Tous les statuts</option>
                {Object.entries(STATUT_COLORS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div style={{ position: 'relative', width: 180 }}>
              <Calendar size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <select 
                value={anneeFilter} 
                onChange={e => setAnneeFilter(e.target.value)}
                style={{ paddingLeft: 44, borderRadius: 12, background: 'var(--bg)', border: 'none', marginBottom: 0 }}
              >
                <option value="TOUTES">Toutes les années</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-outline" onClick={load} style={{ borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={16} />
              <span>Actualiser</span>
            </button>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-3)" }}>
            Chargement…
          </div>
        ) : (
          <motion.div
            layout
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
              gap: 24,
            }}
          >
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="premium-card"
                style={{ gridColumn: "1/-1", textAlign: "center", padding: 60 }}
              >
                <div style={{ marginBottom: 16, color: 'var(--text-3)' }}><ClipboardList size={48} /></div>
                <p style={{ color: "var(--text-3)", fontSize: 16 }}>Aucun stage ne correspond à vos critères.</p>
              </motion.div>
            ) : (
              filtered.map((s, i) => {
                const st = STATUT_COLORS[s.statut] || STATUT_COLORS.EN_ATTENTE;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="premium-card"
                    style={{ cursor: "pointer", display: 'flex', flexDirection: 'column' }}
                    onClick={() => setDetail(s)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ background: "var(--primary-lt)", color: "var(--primary)", padding: "4px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                          {TYPE_LABELS[s.type] || s.type}
                        </span>
                        {s.estBinome && (
                          <span style={{ background: "#f3e8ff", color: "#7c3aed", padding: "4px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={12} /> BINÔME
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        background: st.bg, color: st.color, padding: "4px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, 
                        display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${st.color}22`
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.color }} />
                        {st.label.toUpperCase()}
                      </div>
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, lineHeight: 1.4, color: 'var(--text)' }}>
                      {s.sujet}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <GraduationCap size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{s.stagiairePrenom} {s.stagiaireNom}</div>
                          {s.stagiaire2Id && (
                            <div style={{ fontSize: 12, color: "#7c3aed", fontWeight: 500 }}>& {s.stagiaire2Prenom} {s.stagiaire2Nom}</div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                          <Briefcase size={16} />
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-2)' }}>{s.encadrantPrenom} {s.encadrantNom}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                          <Calendar size={16} />
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{s.dateDebut} — {s.dateFin}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-3)' }}>Avancement</span>
                        <span style={{ color: 'var(--primary)' }}>{(s.tauxAvancement || 0).toFixed(0)}%</span>
                      </div>
                      <div style={{ background: "var(--bg)", borderRadius: 10, height: 8, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.tauxAvancement || 0}%` }}
                          style={{ height: "100%", background: "linear-gradient(90deg, var(--primary), var(--accent))", borderRadius: 10 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
                      {s.statut === "EN_COURS" && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="btn btn-success"
                          style={{ flex: 1, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10 }}
                          onClick={() => ClinisysAlert.confirm({
                            title: "Valider le stage",
                            text: "Confirmez-vous la validation de ce stage ?",
                            confirmText: "Valider",
                            icon: 'success'
                          }).then(res => res.isConfirmed && changerStatutStage(s.id, "VALIDE").then(() => {
                            load();
                            ClinisysAlert.success("Stage validé avec succès");
                          }).catch(err => {
                            ClinisysAlert.error("Validation Impossible", err.response?.data?.message || "Le dernier sprint doit être clôturé avant de valider le stage.");
                          }))}
                        >
                          <CheckCircle size={14} /> Valider
                        </motion.button>
                      )}
                      {s.statut === "EN_COURS" && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="btn btn-danger"
                          style={{ flex: 1, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10 }}
                          onClick={() => ClinisysAlert.confirm({
                            title: "Interrompre le stage",
                            text: "Êtes-vous sûr de vouloir interrompre ce stage ?",
                            confirmText: "Interrompre",
                            danger: true
                          }).then(res => res.isConfirmed && changerStatutStage(s.id, "INTERROMPU").then(() => {
                            load();
                            ClinisysAlert.success("Stage interrompu");
                          }))}
                        >
                          <XCircle size={14} /> Arrêter
                        </motion.button>
                      )}
                      {s.statut === "INTERROMPU" && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="btn btn-primary"
                          style={{ flex: 1, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10 }}
                          onClick={() => ClinisysAlert.confirm({
                            title: "Reprendre le stage",
                            text: "Voulez-vous redémarrer ce stage ?",
                            confirmText: "Reprendre",
                            icon: 'info'
                          }).then(res => res.isConfirmed && changerStatutStage(s.id, "EN_COURS").then(() => {
                            load();
                            ClinisysAlert.success("Stage repris");
                          }))}
                        >
                          <PlayCircle size={14} /> Reprendre
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1, color: 'var(--danger)' }}
                        whileTap={{ scale: 0.9 }}
                        style={{ background: 'var(--bg)', border: 'none', padding: 10, borderRadius: 10, color: 'var(--text-3)', cursor: 'pointer', transition: 'all 0.2s' }}
                        onClick={() => ClinisysAlert.confirm({
                          title: "Supprimer le stage",
                          text: "Cette action est irréversible. Supprimer ce stage ?",
                          confirmText: "Supprimer",
                          danger: true
                        }).then(res => res.isConfirmed && deleteStage(s.id).then(() => {
                          load();
                          ClinisysAlert.success("Stage supprimé");
                        }).catch(() => ClinisysAlert.error("Erreur", "Impossible de supprimer ce stage")))}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ══════ MODAL CRÉER STAGE ══════ */}
        <AnimatePresence>
          {showModal && (
            <div className="modal-overlay">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="premium-card modal-content-v2"
                style={{ width: 620, padding: 0 }}
              >
                <div style={{ padding: 40, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 24, fontWeight: 900 }}>Initialiser un Stage</h2>
                  <button onClick={() => setShowModal(false)} className="icon-btn-v2"><Plus style={{ transform: 'rotate(45deg)' }} /></button>
                </div>

                <div style={{ padding: "20px 40px", background: 'var(--primary-light-alpha)', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--primary)', fontWeight: 600, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Info size={18} />
                  Sélectionnez un stagiaire qualifié pour auto-charger les métadonnées du sujet choisi.
                </div>

                <form onSubmit={handleCreate} style={{ padding: 40 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div className="form-group-v2">
                         <label>Dossier Stagiaire</label>
                         <select value={form.dossierId} onChange={(e) => handleDossierChange(e.target.value)} required>
                            <option value="">— Sélectionner un dossier —</option>
                            {dossiers
                              .filter(d => !form.dateDebut || formatYear(d.anneeStage) === form.dateDebut.split('-')[0])
                              .map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.stagiairePrenom} {d.stagiaireNom} ({formatYear(d.anneeStage)} - {d.universite})
                                </option>
                            ))}
                         </select>
                      </div>

                      <div className="form-group-v2">
                         <label>Titre de la mission Stage</label>
                         <input value={form.sujet} onChange={f("sujet")} required readOnly={sujetInfo?.statut === "VALIDE"} style={sujetInfo?.statut === "VALIDE" ? { background: 'var(--bg)', cursor: 'not-allowed', color: 'var(--text-3)' } : {}} />
                      </div>
                      
                      <div className="grid-2" style={{ gap: 24 }}>
                         <div className="form-group-v2">
                            <label>Date de démarrage ({activeSession})</label>
                            <input 
                              type="date" 
                              value={form.dateDebut} 
                              onChange={handleDateChange} 
                              min={`${activeSession}-01-01`}
                              max={`${activeSession}-12-31`}
                              required 
                            />
                         </div>
                         <div className="form-group-v2">
                            <label>Durée (Mois)</label>
                            <input type="number" min="1" value={form.nbMois} onChange={f("nbMois")} required />
                         </div>
                      </div>

                      {loadingFill && (
                        <div style={{ textAlign: "center", padding: "10px", color: "var(--primary)", fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                          <RefreshCw className="spin" size={16} /> synchronisation des données...
                        </div>
                      )}

                      {sujetInfo && (
                        <div style={{ background: sujetInfo.statut === "VALIDE" ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)", border: "1px solid " + (sujetInfo.statut === "VALIDE" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"), borderRadius: 14, padding: "16px 20px", fontSize: 13, color: sujetInfo.statut === "VALIDE" ? "#059669" : "#d97706", display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                           <Briefcase size={18} style={{ marginTop: 2, flexShrink: 0 }} />
                           <div>
                              <strong>{sujetInfo.titre}</strong>
                              <p style={{ margin: '4px 0 0', opacity: 0.8 }}>{sujetInfo.statut === "VALIDE" ? "Ce sujet a été officiellement validé et ses paramètres sont verrouillés." : "Ce sujet est encore en attente, vous pouvez ajuster les champs ci-dessous."}</p>
                           </div>
                        </div>
                      )}

                      {binomeInfo && (
                        <div style={{ background: "rgba(139, 92, 246, 0.08)", border: "1.5px dashed rgba(139, 92, 246, 0.4)", borderRadius: 16, padding: "20px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#8b5cf6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={18} /></div>
                            <span style={{ fontWeight: 800, fontSize: 15, color: "#7c3aed" }}>Binôme Détecté</span>
                          </div>
                          <p style={{ fontSize: 13, color: "#6b21a8", marginBottom: 16, lineHeight: 1.5 }}>Un stage collaboratif sera instauré pour ce binôme d'excellence.</p>
                          <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                             <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{binomeInfo.prenom[0]}</div>
                             <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#4c1d95' }}>{binomeInfo.prenom} {binomeInfo.nom}</div>
                                <div style={{ fontSize: 11, color: '#6b21a8', opacity: 0.7 }}>{binomeInfo.email}</div>
                             </div>
                          </div>
                        </div>
                      )}

                      <div style={{ opacity: form.stagiaireId ? 1 : 0.4, pointerEvents: form.stagiaireId ? "all" : "none", transition: 'all 0.3s' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div className="grid-2" style={{ gap: 24 }}>
                               <div className="form-group-v2">
                                  <label>Type de Stage</label>
                                  <select value={form.type} onChange={f("type")} required disabled={!!form.stagiaireId} style={form.stagiaireId ? { background: 'var(--bg)', cursor: 'not-allowed', color: 'var(--text-3)' } : {}}>
                                     {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                                  </select>
                               </div>
                               <div className="form-group-v2">
                                  <label>Encadrant Clinisys</label>
                                  <select value={form.encadrantId} onChange={f("encadrantId")} required>
                                     <option value="">— Sélectionner —</option>
                                     {encadrants.map(en => <option key={en.id} value={en.id}>{en.prenom} {en.nom}</option>)}
                                  </select>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                      <button type="submit" disabled={saving || !form.stagiaireId} className="btn btn-primary">
                         {saving ? <RefreshCw className="spin" size={18} /> : "Finaliser & Créer"}
                      </button>
                   </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ══ DETAILS MODAL ══ */}
        <AnimatePresence>
          {detail && (
            <div className="modal-overlay">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="premium-card modal-content-v2"
                style={{ width: "100%", maxWidth: 680, padding: 0 }}
              >
                <div style={{ padding: 40, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 28, fontWeight: 900, flex: 1, lineHeight: 1.2 }}>{detail.sujet}</h2>
                  <button onClick={() => setDetail(null)} className="icon-btn-v2"><Plus style={{ transform: 'rotate(45deg)' }} /></button>
                </div>

                <div style={{ padding: 40 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
                    <span style={{ background: "var(--primary-lt)", color: "var(--primary)", padding: "6px 16px", borderRadius: 12, fontSize: 12, fontWeight: 800 }}>{TYPE_LABELS[detail.type] || detail.type}</span>
                    {detail.estBinome && (
                      <span style={{ background: "rgba(139, 92, 246, 0.1)", color: "#7c3aed", padding: "6px 16px", borderRadius: 12, fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: 'center', gap: 8 }}>
                        <Users size={14} /> COLLABORATION BINÔME
                      </span>
                    )}
                  </div>

                  <div style={{ padding: '28px', background: 'var(--bg)', borderRadius: 24, marginBottom: 32, border: '1.5px solid var(--border)' }}>
                    <h4 style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '1.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}><Info size={16} /> Objectifs du Projet</h4>
                    <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.8, margin: 0, fontWeight: 500 }}>{detail.description || "Project summary not specified."}</p>
                  </div>

                  {detail.estBinome && (
                    <div style={{ marginBottom: 32 }}>
                      <div style={{ fontWeight: 800, color: "#7c3aed", marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}><Users size={20} /> Équipe Assignée</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: '#fff', borderRadius: 20, border: '1.5px solid var(--border)' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #7c3aed, #9333ea)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900 }}>{detail.stagiairePrenom[0]}</div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{detail.stagiairePrenom} {detail.stagiaireNom}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Pilote Technique</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: '#fff', borderRadius: 20, border: '1.5px solid var(--border)' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #a855f7, #c084fc)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900 }}>{detail.stagiaire2Prenom[0]}</div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{detail.stagiaire2Prenom} {detail.stagiaire2Nom}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Co-Pilote</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24, marginBottom: 40 }}>
                    {[
                      { label: "Date de début", value: detail.dateDebut, icon: <Calendar size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                      { label: "Date de fin", value: detail.dateFin, icon: <Clock size={20} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                      { label: "Encadrant", value: `${detail.encadrantPrenom} ${detail.encadrantNom}`, icon: <Briefcase size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                      { label: "Progression", value: `${(detail.tauxAvancement || 0).toFixed(0)}%`, icon: <TrendingUp size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 20, background: 'var(--bg)', borderRadius: 20, border: '1px solid var(--border)' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, border: '1px solid var(--border)' }}>{item.icon}</div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
                    <button onClick={() => setDetail(null)} className="btn btn-primary" style={{ padding: '16px 48px', borderRadius: 16, fontSize: 16, fontWeight: 800, boxShadow: '0 10px 25px -6px var(--primary)' }}>Fermer</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-overlay {
           position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
           display: flex; align-items: center; justify-content: center; z-index: 2000;
           padding: 20px;
        }
        .modal-content-v2 {
           max-height: 90vh; overflow-y: auto; overflow-x: hidden;
        }
        .form-group-v2 label {
           display: block; font-size: 11px; font-weight: 800; text-transform: uppercase;
           color: var(--text-3); margin-bottom: 10px; letter-spacing: 0.5px;
        }
        .form-group-v2 input, .form-group-v2 select, .form-group-v2 textarea {
           width: 100%; padding: 14px 18px; border-radius: 14px; border: 1.5px solid var(--border);
           background: var(--bg); font-size: 15px; font-weight: 600; transition: all 0.3s;
        }
        .form-group-v2 input:focus, .form-group-v2 select:focus, .form-group-v2 textarea:focus {
           border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-light-alpha);
           outline: none; background: #fff;
        }
        .icon-btn-v2 {
           width: 44px; height: 44px; border-radius: 14px; border: 1.5px solid var(--border);
           background: var(--surface); color: var(--text-3); display: flex; align-items: center;
           justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .icon-btn-v2:hover { background: var(--bg); color: var(--primary); border-color: var(--primary); }
      ` }} />
    </div>
  );
}
