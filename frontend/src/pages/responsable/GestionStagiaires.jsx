import React, { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar";
import { useAuth } from "../../context/AuthContext";
import {
  getIdentitesByResponsable,
  creerIdentite,
  modifierIdentite,
  deleteIdentite,
} from "../../api/stagiaireIdentiteAPI";
import {
  getDossiersByResponsable,
  getAnneesByResponsable,
  creerDossier,
  deleteDossier,
} from "../../api/dossierStageAPI";
import { getByRole } from "../../api/utilisateurAPI";
import Topbar from "../../components/common/Topbar";
import { useTheme } from "../../context/ThemeContext";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  Plus, UserPlus, FolderPlus, Users, GraduationCap,
  Calendar, Search, Filter, Clock, CheckCircle,
  AlertCircle, Trash2, Edit, Mail, Smartphone,
  CreditCard, School as University, Book, ChevronRight, RefreshCw,
  MoreVertical, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/axiosConfig";

const NAV = [
  { path: "/responsable/dashboard", icon: "⊞", label: "Tableau de bord" },
  { path: "/responsable/stages", icon: "📋", label: "Stages" },
  { path: "/responsable/sujets", icon: "📝", label: "Sujets" },
  { path: "/responsable/stagiaires", icon: "🎓", label: "Stagiaires" },
  { path: "/responsable/analytique", icon: "📊", label: "Analytique" },
];

const NIVEAU_BG = {
  "Licence 1": "#e8f2fb",
  "Licence 2": "#e8f2fb",
  "Licence 3": "#e8f2fb",
  "Master 1": "#e0f7f4",
  "Master 2": "#e0f7f4",
  Ingénieur: "#f0fdf4",
};

const EMPTY_ID = { nom: "", prenom: "", email: "", telephone: "", cin: "" };
const EMPTY_DOS = {
  stagiaireId: "",
  universite: "",
  specialite: "",
  niveauEtude: "",
  anneeStage: "",
};

export default function GestionStagiaires() {
  const { user } = useAuth();

  const [onglet, setOnglet] = useState("dossiers");
  const [dossiers, setDossiers] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [anneeFilter, setAnneeFilter] = useState("TOUTES");
  const [searchDos, setSearchDos] = useState("");
  const [selectedDos, setSelectedDos] = useState(null);
  const [identites, setIdentites] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [comptesStagiaires, setComptesStagiaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModalId, setShowModalId] = useState(false);
  const [editModeId, setEditModeId] = useState(false);
  const [selectedIdId, setSelectedIdId] = useState(null);
  const [showModalDos, setShowModalDos] = useState(false);
  const [formId, setFormId] = useState(EMPTY_ID);
  const [formDos, setFormDos] = useState(EMPTY_DOS);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { sidebarMini } = useTheme();

  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirmer",
    type: "primary",
    onConfirm: () => { },
  });

  const closeConfirm = () => setConfirm((p) => ({ ...p, isOpen: false }));

  useEffect(() => {
    if (user?.id) loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [idRes, dosRes, annRes, compRes] = await Promise.all([
        getIdentitesByResponsable(user.id),
        getDossiersByResponsable(user.id),
        getAnneesByResponsable(user.id),
        getByRole("ROLE_STAGIAIRE"),
      ]);
      setIdentites(idRes.data);
      setDossiers(dosRes.data);
      setAnnees(annRes.data);
      setComptesStagiaires(compRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const reloadDossiers = async (annee) => {
    const [dosRes, annRes] = await Promise.all([
      getDossiersByResponsable(user.id, annee),
      getAnneesByResponsable(user.id),
    ]);
    setDossiers(dosRes.data);
    setAnnees(annRes.data);
  };

  // Filtre dossiers
  const dossiersFiltres = dossiers.filter((d) => {
    const q = searchDos.toLowerCase();
    return (
      !searchDos ||
      d.stagiaireNom?.toLowerCase().includes(q) ||
      d.stagiairePrenom?.toLowerCase().includes(q) ||
      d.stagiaireEmail?.toLowerCase().includes(q) ||
      d.universite?.toLowerCase().includes(q) ||
      d.specialite?.toLowerCase().includes(q)
    );
  });

  // Filtre identités
  const identitesFiltrees = identites.filter((i) => {
    if (!searchId) return true;
    const q = searchId.toLowerCase();
    return (
      i.nom.toLowerCase().includes(q) ||
      i.prenom.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      (i.cin || "").toLowerCase().includes(q)
    );
  });

  const handleCreateIdentite = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editModeId) {
        await modifierIdentite(selectedIdId, formId);
      } else {
        await creerIdentite({ ...formId, responsableId: user.id });
      }
      setShowModalId(false);
      setFormId(EMPTY_ID);
      loadAll();
    } catch (err) {
      let msg = "Erreur sauvegarde";
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.response?.data?.errors) {
        // Cas des erreurs de validation Spring (@Valid)
        msg = Object.values(err.response.data.errors).join(", ");
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const openEditIdentite = (i) => {
    setFormId({
      nom: i.nom,
      prenom: i.prenom,
      email: i.email,
      telephone: i.telephone || "",
      cin: i.cin || "",
      responsableId: user.id
    });
    setEditModeId(true);
    setSelectedIdId(i.id);
    setError("");
    setShowModalId(true);
  };

  const handleCreateDossier = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await creerDossier({
        ...formDos,
        stagiaireId: Number(formDos.stagiaireId),
        responsableId: user.id,
      });
      setShowModalDos(false);
      setFormDos(EMPTY_DOS);
      reloadDossiers(anneeFilter);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur création dossier");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIdentite = (id) => {
    setConfirm({
      isOpen: true,
      title: "Supprimer l'identité",
      message: "Voulez-vous vraiment supprimer cette identité de stagiaire ?",
      confirmText: "Supprimer",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteIdentite(id);
          loadAll();
          closeConfirm();
        } catch {
          alert("Erreur suppression");
          closeConfirm();
        }
      }
    });
  };

  const handleDeleteDossier = (id) => {
    setConfirm({
      isOpen: true,
      title: "Supprimer le dossier",
      message: "Voulez-vous vraiment supprimer ce dossier de stage ? Cette action est définitive.",
      confirmText: "Supprimer",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDossier(id);
          setSelectedDos(null);
          reloadDossiers(anneeFilter);
          closeConfirm();
        } catch {
          alert("Erreur suppression");
          closeConfirm();
        }
      }
    });
  };

  const fi = (k) => (e) => setFormId((p) => ({ ...p, [k]: e.target.value }));
  const fd = (k) => (e) => setFormDos((p) => ({ ...p, [k]: e.target.value }));

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
            <h1 className="gradient-text" style={{ fontSize: 32, marginBottom: 8 }}>Gestion des Stagiaires</h1>
            <div className="page-subtitle" style={{ fontSize: 16 }}>Pilotez les identités et archivez les dossiers de stage</div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <button
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 16, fontWeight: 800, fontSize: 14 }}
              onClick={() => {
                setEditModeId(false);
                setSelectedIdId(null);
                setShowModalId(true);
                setError("");
                setFormId(EMPTY_ID);
              }}
            >
              <UserPlus size={18} />
              Nouveau Stagiaire
            </button>
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 16, fontWeight: 800, fontSize: 14 }}
              onClick={() => {
                setShowModalDos(true);
                setError("");
                setFormDos(EMPTY_DOS);
              }}
              disabled={comptesStagiaires.length === 0}
            >
              <FolderPlus size={18} />
              Nouveau Dossier
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          {[
            {
              icon: <GraduationCap size={24} />,
              label: "Identités enregistrées",
              value: identites.length,
              color: "#3b82f6",
              bg: "rgba(59, 130, 246, 0.1)",
            },
            {
              icon: <CheckCircle size={24} />,
              label: "Comptes créés",
              value: identites.filter((i) => i.compteCreer).length,
              color: "#10b981",
              bg: "rgba(16, 185, 129, 0.1)",
            },
            {
              icon: <FolderPlus size={24} />,
              label: "Dossiers de stage",
              value: dossiers.length,
              color: "#f59e0b",
              bg: "rgba(245, 158, 11, 0.1)",
            },
            {
              icon: <Calendar size={24} />,
              label: "Années de stage",
              value: annees.length,
              color: "#8b5cf6",
              bg: "rgba(139, 92, 246, 0.1)",
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="stat-card-v2"
            >
              <div className="stat-icon-v2" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div className="stat-body-v2">
                <div className="stat-value-v2">{s.value}</div>
                <div className="stat-label-v2">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Onglets */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32, padding: 6, background: 'var(--bg)', borderRadius: 20, width: 'fit-content', border: '1px solid var(--border)' }}>
          {[
            { key: "dossiers", label: "Dossiers de stage", icon: <FolderPlus size={16} /> },
            { key: "identites", label: "Identités stagiaires", icon: <Users size={16} /> },
          ].map((o) => (
            <button
              key={o.key}
              onClick={() => setOnglet(o.key)}
              style={{
                fontSize: 14,
                padding: "12px 30px",
                borderRadius: 16,
                background: onglet === o.key ? "var(--primary)" : "transparent",
                color: onglet === o.key ? "#fff" : "var(--text-2)",
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: onglet === o.key ? '0 8px 20px -6px var(--primary)' : 'none'
              }}
            >
              {o.icon}
              {o.label}
            </button>
          ))}
        </div>

        {/* ══ ONGLET DOSSIERS ══ */}
        {onglet === "dossiers" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Filtres */}
            <div
              className="premium-card"
              style={{ marginBottom: 24, padding: "16px 24px" }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                  <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                  <input
                    placeholder="Rechercher (nom, université…)"
                    value={searchDos}
                    onChange={(e) => setSearchDos(e.target.value)}
                    style={{ paddingLeft: 44, borderRadius: 12, background: 'var(--bg)', border: 'none', marginBottom: 0 }}
                  />
                </div>

                {/* Filtre par année */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  {["TOUTES", ...annees].map((a) => (
                    <button
                      key={a}
                      onClick={() => {
                        setAnneeFilter(a);
                        reloadDossiers(a);
                        setSelectedDos(null);
                      }}
                      className="btn"
                      style={{
                        fontSize: 12,
                        padding: "8px 16px",
                        borderRadius: 20,
                        background: anneeFilter === a ? "var(--primary-lt)" : "transparent",
                        color: anneeFilter === a ? "var(--primary)" : "var(--text-3)",
                        border: `1.5px solid ${anneeFilter === a ? "var(--primary)" : "transparent"}`,
                        fontWeight: 700,
                        transition: 'all 0.2s'
                      }}
                    >
                      {a === "TOUTES" ? "Toutes les années" : a}
                    </button>
                  ))}
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 13, fontWeight: 600 }}>
                  <RefreshCw size={14} className={loading ? "spin" : ""} onClick={() => reloadDossiers(anneeFilter)} style={{ cursor: 'pointer' }} />
                  {dossiersFiltres.length} dossiers
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <RefreshCw size={40} className="spin" style={{ color: 'var(--primary)', opacity: 0.5 }} />
              </div>
            ) : dossiersFiltres.length === 0 ? (
              <div className="premium-card" style={{ textAlign: "center", padding: 80 }}>
                <div style={{ fontSize: 60, marginBottom: 20 }}>📁</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Aucun dossier trouvé</h3>
                <p style={{ color: "var(--text-3)", fontSize: 15 }}>
                  {dossiers.length === 0
                    ? "Aucun dossier n'a encore été créé."
                    : `Aucun dossier ne correspond à vos critères pour ${anneeFilter}.`}
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, alignItems: "flex-start" }}>
                {/* Liste dossiers */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {dossiersFiltres.map((d, idx) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="premium-card"
                      onClick={() => setSelectedDos(d)}
                      style={{
                        cursor: "pointer",
                        padding: "20px",
                        border: `2px solid ${selectedDos?.id === d.id ? "var(--primary)" : "transparent"}`,
                        background: selectedDos?.id === d.id ? "white" : "rgba(255,255,255,0.6)",
                        transform: selectedDos?.id === d.id ? 'scale(1.02)' : 'scale(1)',
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: selectedDos?.id === d.id ? '0 10px 25px rgba(31, 169, 205, 0.15)' : 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: '#fff', display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, boxShadow: '0 8px 16px rgba(31, 169, 205, 0.2)' }}>
                          {d.stagiairePrenom?.[0]}{d.stagiaireNom?.[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
                              {d.stagiairePrenom} {d.stagiaireNom}
                            </span>
                            <span style={{ background: "var(--primary-lt)", color: "var(--primary)", padding: "4px 12px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                              {d.anneeStage}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: "var(--text-3)", display: "flex", gap: 16, alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><University size={14} /> {d.universite || "N/A"}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Book size={14} /> {d.specialite || "N/A"}</span>
                          </div>
                        </div>
                        <ChevronRight size={20} style={{ color: selectedDos?.id === d.id ? 'var(--primary)' : 'var(--text-3)', opacity: 0.5 }} />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Détail dossier */}
                <AnimatePresence mode="wait">
                  {selectedDos ? (
                    <motion.div
                      key={selectedDos.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="premium-card"
                      style={{ position: "sticky", top: 24, padding: 32 }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                          <div style={{ width: 72, height: 72, borderRadius: 24, background: 'var(--primary-lt)', color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 24 }}>
                            {selectedDos.stagiairePrenom?.[0]}{selectedDos.stagiaireNom?.[0]}
                          </div>
                          <div>
                            <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                              {selectedDos.stagiairePrenom} {selectedDos.stagiaireNom}
                            </h3>
                            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                              <span style={{ background: "var(--primary)", color: "#fff", padding: "4px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>DOSSIER {selectedDos.anneeStage}</span>
                              <span style={{ background: NIVEAU_BG[selectedDos.niveauEtude] || "#f3f4f6", color: "var(--primary)", padding: "4px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{selectedDos.niveauEtude}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-outline"
                            style={{ width: 40, height: 40, borderRadius: 12, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}
                            onClick={() => handleDeleteDossier(selectedDos.id)}
                            title="Supprimer le dossier"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
                        <div style={{ background: 'var(--bg)', borderRadius: 20, padding: 24 }}>
                          <h4 style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 20, letterSpacing: '1px', fontWeight: 700 }}>Informations Académiques</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            {[
                              { label: "Université", value: selectedDos.universite, icon: <University size={16} /> },
                              { label: "Spécialité", value: selectedDos.specialite, icon: <Book size={16} /> },
                              { label: "Niveau", value: selectedDos.niveauEtude, icon: <GraduationCap size={16} /> },
                              { label: "Année Stage", value: selectedDos.anneeStage, icon: <Calendar size={16} /> },
                            ].map((item, i) => (
                              <div key={i}>
                                <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {item.icon} {item.label.toUpperCase()}
                                </div>
                                <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 600 }}>{item.value || "—"}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ background: 'var(--bg)', borderRadius: 20, padding: 24 }}>
                          <h4 style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 20, letterSpacing: '1px', fontWeight: 700 }}>Contact & Identité</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                            {[
                              { label: "Email Professionnel", value: selectedDos.stagiaireEmail, icon: <Mail size={16} /> },
                              { label: "Téléphone", value: selectedDos.stagiaireTelephone, icon: <Smartphone size={16} /> },
                              { label: "Carte d'identité (CIN)", value: selectedDos.stagiaireCin, icon: <CreditCard size={16} /> },
                            ].map((item, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                                  {item.icon}
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>{item.label}</div>
                                  <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 600 }}>{item.value || "Non renseigné"}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="premium-card" style={{ textAlign: "center", padding: 60, border: '2px dashed var(--border)', background: 'transparent' }}>
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--text-3)' }}>
                        <ArrowUpRight size={32} style={{ transform: 'rotate(-45deg)' }} />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-2)' }}>Détails du dossier</h3>
                      <p style={{ color: "var(--text-3)", fontSize: 14 }}>Sélectionnez un stagiaire dans la liste pour afficher son dossier complet.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ ONGLET IDENTITÉS ══ */}
        {onglet === "identites" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div
              className="premium-card"
              style={{ marginBottom: 24, padding: "16px 24px" }}
            >
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  placeholder="Rechercher par nom, email, CIN..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  style={{ paddingLeft: 44, borderRadius: 12, background: 'var(--bg)', border: 'none', marginBottom: 0, width: '100%' }}
                />
              </div>
            </div>

            {identitesFiltrees.length === 0 ? (
              <div
                className="premium-card"
                style={{ textAlign: "center", padding: 80 }}
              >
                <div style={{ fontSize: 60, marginBottom: 24 }}>👤</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Aucun stagiaire enregistré</h3>
                <p style={{ color: "var(--text-3)", fontSize: 15 }}>
                  Commencez par ajouter l'identité des stagiaires pour pouvoir créer leurs dossiers.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 24, borderRadius: 12 }}
                  onClick={() => { setEditModeId(false); setShowModalId(true); }}
                >
                  <Plus size={18} style={{ marginRight: 8 }} /> Ajouter mon premier stagiaire
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 20 }}>
                {identitesFiltrees.map((i, idx) => (
                  <motion.div
                    key={i.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="premium-card"
                    style={{ padding: "24px", position: 'relative', overflow: 'hidden' }}
                  >
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 4, height: '100%', background: i.compteCreer ? '#10b981' : '#f59e0b', opacity: 0.6 }} />

                    <div style={{ display: "flex", gap: 20 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: i.compteCreer ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: i.compteCreer ? '#10b981' : '#f59e0b', display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>
                        {i.prenom?.[0]}{i.nom?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{i.prenom} {i.nom}</h4>
                            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: i.compteCreer ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {i.compteCreer ? <CheckCircle size={12} /> : <Clock size={12} />}
                                {i.compteCreer ? 'COMPTE CRÉÉ' : 'EN ATTENTE'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 4 }}>
                            {!i.compteCreer && (
                              <button
                                className="btn btn-outline"
                                style={{ width: 32, height: 32, padding: 0, borderRadius: 8, color: 'var(--text-3)' }}
                                onClick={() => openEditIdentite(i)}
                              >
                                <Edit size={14} />
                              </button>
                            )}
                            <button
                              className="btn btn-outline"
                              style={{ width: 32, height: 32, padding: 0, borderRadius: 8, color: 'var(--danger)' }}
                              onClick={() => handleDeleteIdentite(i.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                            <Mail size={14} style={{ color: 'var(--text-3)' }} /> {i.email}
                          </div>
                          {i.telephone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                              <Smartphone size={14} style={{ color: 'var(--text-3)' }} /> {i.telephone}
                            </div>
                          )}
                          {i.cin && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                              <CreditCard size={14} style={{ color: 'var(--text-3)' }} /> {i.cin}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ MODAL Ajouter identité stagiaire ══ */}
        <AnimatePresence>
          {showModalId && (
            <div className="modal-overlay">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="premium-card modal-content-v2"
                style={{ width: 560, padding: 0 }}
              >
                <div style={{ padding: 40, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 24, fontWeight: 900 }}>
                    {editModeId ? "Modifier le stagiaire" : "Nouveau stagiaire"}
                  </h2>
                  <button onClick={() => setShowModalId(false)} className="icon-btn-v2"><Plus style={{ transform: 'rotate(45deg)' }} /></button>
                </div>

                <div style={{ padding: "20px 40px", background: 'var(--primary-light-alpha)', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--primary)', fontWeight: 600, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <AlertCircle size={18} />
                  L'administrateur validera ensuite la création du compte de connexion.
                </div>

                <form onSubmit={handleCreateIdentite} style={{ padding: 40 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="grid-2" style={{ gap: 24 }}>
                      <div className="form-group-v2">
                        <label>Prénom</label>
                        <input value={formId.prenom} onChange={fi("prenom")} required placeholder="Ex: Ahmed" />
                      </div>
                      <div className="form-group-v2">
                        <label>Nom</label>
                        <input value={formId.nom} onChange={fi("nom")} required placeholder="Ex: Ouali" />
                      </div>
                    </div>
                    <div className="form-group-v2">
                      <label>Adresse e-mail professionnelle</label>
                      <input type="email" value={formId.email} onChange={fi("email")} required placeholder="ahmedouali@gmail.com" />
                    </div>
                    <div className="grid-2" style={{ gap: 24 }}>
                      <div className="form-group-v2">
                        <label>Téléphone</label>
                        <input value={formId.telephone} onChange={fi("telephone")} required placeholder="8 chiffres" pattern="\d{8}" title="8 chiffres requis" maxLength={8} />
                      </div>
                      <div className="form-group-v2">
                        <label>CIN (Carte d'identité)</label>
                        <input value={formId.cin} onChange={fi("cin")} required placeholder="8 chiffres" pattern="\d{8}" title="8 chiffres requis" maxLength={8} />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowModalId(false)}>Annuler</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <RefreshCw className="spin" size={18} /> : (editModeId ? "Mettre à jour" : "Enregistrer le stagiaire")}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── MODAL Créer dossier de stage ── */}
        <AnimatePresence>
          {showModalDos && (
            <div className="modal-overlay">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="premium-card modal-content-v2"
                style={{ width: 580, padding: 0 }}
              >
                <div style={{ padding: 40, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 24, fontWeight: 900 }}>Dossier de stage</h2>
                  <button onClick={() => setShowModalDos(false)} className="icon-btn-v2"><Plus style={{ transform: 'rotate(45deg)' }} /></button>
                </div>

                <div style={{ padding: "20px 40px", background: 'var(--primary-light-alpha)', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--primary)', fontWeight: 600, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <HelpCircle size={18} />
                  Chaque stagiaire peut avoir plusieurs dossiers selon les sessions annuelles.
                </div>

                <form onSubmit={handleCreateDossier} style={{ padding: 40 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="form-group-v2">
                      <label>Stagiaire</label>
                      <select value={formDos.stagiaireId} onChange={fd("stagiaireId")} required>
                        <option value="">Sélectionner un compte stagiaire</option>
                        {comptesStagiaires.map((s) => (
                          <option key={s.id} value={s.id}>{s.prenom} {s.nom} ({s.email})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid-2" style={{ gap: 24 }}>
                      <div className="form-group-v2">
                        <label>Session (Année)</label>
                        <input value={formDos.anneeStage} onChange={fd("anneeStage")} required placeholder="Ex: 2024-2025" />
                      </div>
                      <div className="form-group-v2">
                        <label>Niveau d'étude</label>
                        <select value={formDos.niveauEtude} onChange={fd("niveauEtude")}>
                          <option value="">Choisir...</option>
                          {["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2", "Ingénieur"].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid-2" style={{ gap: 24 }}>
                      <div className="form-group-v2">
                        <label>Université / École</label>
                        <input value={formDos.universite} onChange={fd("universite")} placeholder="Ex: ESPRIT" />
                      </div>
                      <div className="form-group-v2">
                        <label>Spécialité / Branche</label>
                        <input value={formDos.specialite} onChange={fd("specialite")} placeholder="Ex: Génie Logiciel" />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowModalDos(false)}>Annuler</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <RefreshCw className="spin" size={18} /> : "Générer le dossier"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <ConfirmModal
          isOpen={confirm.isOpen}
          title={confirm.title}
          message={confirm.message}
          confirmText={confirm.confirmText}
          type={confirm.type}
          onClose={closeConfirm}
          onConfirm={confirm.onConfirm}
        />
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .modal-overlay {
           position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
           display: flex; align-items: center; justify-content: center; z-index: 2000;
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
           width: 40px; height: 40px; border-radius: 12px; border: 1.5px solid var(--border);
           background: var(--surface); color: var(--text-3); display: flex; align-items: center;
           justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .icon-btn-v2:hover { background: var(--bg); color: var(--primary); border-color: var(--primary); }
      ` }} />
    </div>
  );
}
