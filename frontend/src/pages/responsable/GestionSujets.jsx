import React, { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar";
import Topbar from "../../components/common/Topbar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getSujetsByResponsable,
  creerSujet,
  modifierSujet,
  archiverSujet,
  validerSujet,
  deleteSujet,
} from "../../api/sujetAPI";
import ConfirmModal from "../../components/common/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Search, Filter, CheckCircle,
  Lock, Archive, Users, Trash2, Edit3,
  MoreVertical, ChevronRight, AlertCircle, RefreshCw,
  BookOpen, ShieldCheck, HelpCircle
} from "lucide-react";

const NAV = [
  { path: "/responsable/dashboard", icon: "⊞", label: "Tableau de bord" },
  { path: "/responsable/stages", icon: "📋", label: "Stages" },
  { path: "/responsable/sujets", icon: "📝", label: "Sujets" },
  { path: "/responsable/stagiaires", icon: "🎓", label: "Stagiaires" },
  { path: "/responsable/analytique", icon: "📊", label: "Analytique" },
];

const TYPE_LABELS = { PFE: "PFE", PFA: "PFA", STAGE_ETE: "Stage été" };
const TYPE_COLORS = { PFE: "#3b82f6", PFA: "#10b981", STAGE_ETE: "#f59e0b" };

const STATUT_STYLE = {
  DISPONIBLE: { color: "#10b981", label: "Disponible", icon: <CheckCircle size={14} /> },
  COMPLET: { color: "#f59e0b", label: "Complet", icon: <Lock size={14} /> },
  VALIDE: { color: "#3b82f6", label: "Validé", icon: <ShieldCheck size={14} /> },
  ARCHIVE: { color: "#64748b", label: "Archivé", icon: <Archive size={14} /> },
};

const EMPTY = {
  titre: "",
  description: "",
  type: "PFE",
  nbMaxStagiaires: 1,
};

export default function GestionSujets() {
  const { user } = useAuth();
  const { sidebarMini } = useTheme();
  const [sujets, setSujets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState("TOUS");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
    if (user?.id) load();
  }, [user]);
  useEffect(() => {
    let list = sujets;
    if (filtre !== "TOUS") list = list.filter((s) => s.statut === filtre);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.titre.toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q),
      );
    }
    setFiltered(list);
  }, [sujets, search, filtre]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getSujetsByResponsable(user.id);
      setSujets(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        nbMaxStagiaires: Number(form.nbMaxStagiaires),
        responsableId: user.id,
      };
      if (editMode) await modifierSujet(editId, payload);
      else await creerSujet(payload);
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const stats = {
    total: sujets.length,
    disponible: sujets.filter((s) => s.statut === "DISPONIBLE").length,
    complet: sujets.filter((s) => s.statut === "COMPLET").length,
    archive: sujets.filter((s) => s.statut === "ARCHIVE").length,
  };

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      <main className="main-content fade-in">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-header-card"
        >
          <div>
            <h1 className="gradient-text" style={{ fontSize: 32, marginBottom: 8 }}>Gestion des Sujets</h1>
            <div className="page-subtitle" style={{ fontSize: 16 }}>Pilotez les offres de stages et validez les meilleures propositions</div>
          </div>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 32px', borderRadius: 18, fontWeight: 800, fontSize: 15 }}
            onClick={() => {
              setForm(EMPTY);
              setEditMode(false);
              setEditId(null);
              setError("");
              setShowModal(true);
            }}
          >
            <Plus size={20} />
            Nouveau Sujet
          </button>
        </motion.div>

        {/* ── KPI Grid ── */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          {[
            { icon: <BookOpen />, label: "Sujets Totaux", value: stats.total, color: "var(--primary)" },
            { icon: <CheckCircle />, label: "Disponibles", value: stats.disponible, color: "#10b981" },
            { icon: <Lock />, label: "Complets", value: stats.complet, color: "#f59e0b" },
            { icon: <Archive />, label: "Archivés", value: stats.archive, color: "#64748b" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="stat-card-v2"
            >
              <div className="stat-icon-v2" style={{ background: `${s.color}15`, color: s.color }}>
                {s.icon}
              </div>
              <div className="stat-body-v2">
                <div className="stat-value-v2">{s.value}</div>
                <div className="stat-label-v2">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div className="premium-card" style={{ padding: '16px 24px', marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <div className="search-group" style={{ flex: 1, minWidth: 300 }}>
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Rechercher par titre, description, mot-clé..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, background: 'var(--bg)', padding: 6, borderRadius: 16, border: '1px solid var(--border)' }}>
              {["TOUS", "DISPONIBLE", "COMPLET", "ARCHIVE"].map((ft) => (
                <button
                  key={ft}
                  onClick={() => setFiltre(ft)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.3s",
                    border: "none",
                    background: filtre === ft ? "var(--primary)" : "transparent",
                    color: filtre === ft ? "#fff" : "var(--text-3)",
                  }}
                >
                  {ft === "TOUS" ? "Tous les sujets" : STATUT_STYLE[ft]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 100 }}>
            <RefreshCw size={48} className="spin text-primary opacity-20" />
            <p className="mt-4 text-muted fw-bold">Synchronisation des sujets...</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", gap: 24 }}>
            {/* ── Subject List ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filtered.length === 0 ? (
                <div className="premium-card" style={{ textAlign: "center", padding: 80 }}>
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--text-3)' }}>
                    <HelpCircle size={48} />
                  </div>
                  <h3 style={{ margin: 0, fontWeight: 800 }}>Aucun sujet existant</h3>
                  <p className="text-muted" style={{ maxWidth: 300, margin: '12px auto' }}>Créez votre première offre de stage maintenant pour attirer les meilleurs profils.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filtered.map((s, idx) => {
                    const st = STATUT_STYLE[s.statut] || STATUT_STYLE.DISPONIBLE;
                    const isSelected = selected?.id === s.id;
                    const pct = (s.nbChoixActuels / s.nbMaxStagiaires) * 100;

                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                        whileHover={{ scale: 1.01, x: 5 }}
                        onClick={() => setSelected(isSelected ? null : s)}
                        className={`premium-card ${isSelected ? 'selected-item' : ''}`}
                        style={{
                          cursor: "pointer",
                          padding: "24px 30px",
                          border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                          background: isSelected ? "var(--primary-light-alpha)" : "var(--surface)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          boxShadow: isSelected ? '0 10px 40px -10px var(--primary-light)' : 'var(--shadow-sm)'
                        }}
                      >
                        <div style={{ display: "flex", gap: 24 }}>
                          <div style={{ width: 56, height: 56, borderRadius: 16, background: `${TYPE_COLORS[s.type]}15`, color: TYPE_COLORS[s.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={28} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{s.titre}</h3>
                                  <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                                    borderRadius: 8, background: 'var(--bg)', color: st.color, border: '1px solid var(--border)',
                                    fontSize: 11, fontWeight: 800, textTransform: 'uppercase'
                                  }}>
                                    {st.icon} {st.label}
                                  </div>
                                </div>
                                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
                                  {s.description || "Aucune description fournie pour ce sujet de stage."}
                                </p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>
                                  {s.nbChoixActuels}<span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}> / {s.nbMaxStagiaires}</span>
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase' }}>Stagiaires</div>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: 'center', gap: 24, marginTop: 16 }}>
                              <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  style={{ height: '100%', background: s.estComplet ? '#10b981' : 'var(--primary)', borderRadius: 10 }}
                                />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                {s.statut !== "ARCHIVE" && (
                                  <button className="icon-btn-v2" title="Modifier" onClick={(e) => { e.stopPropagation(); setForm({ ...s, description: s.description || "" }); setEditMode(true); setEditId(s.id); setShowModal(true); }}>
                                    <Edit3 size={18} />
                                  </button>
                                )}
                                {s.statut === "COMPLET" && (
                                  <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 11, fontWeight: 800 }} onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirm({
                                      isOpen: true, title: "Validation du sujet", message: "Une fois validé, les stagiaires ne pourront plus modifier leur choix. Confirmer ?",
                                      confirmText: "Valider maintenant", type: "primary", onConfirm: () => validerSujet(s.id).then(load).then(closeConfirm).catch(() => closeConfirm()),
                                    });
                                  }}>
                                    Valider
                                  </button>
                                )}
                                {s.nbChoixActuels === 0 && (
                                  <button className="icon-btn-v2 delete" title="Supprimer" onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirm({
                                      isOpen: true, title: "Supprimer le sujet", message: "Cette action est irréversible. Voulez-vous continuer ?",
                                      confirmText: "Oui, supprimer", type: "danger", onConfirm: () => deleteSujet(s.id).then(() => { if (selected?.id === s.id) setSelected(null); load(); }).then(closeConfirm).catch(() => closeConfirm()),
                                    });
                                  }}>
                                    <Trash2 size={18} />
                                  </button>
                                )}
                                <ChevronRight size={20} style={{ color: 'var(--text-3)', opacity: isSelected ? 1 : 0.3 }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* ── Detail Panel ── */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="premium-card detail-panel"
                  style={{ position: "sticky", top: 20, padding: 0, height: "calc(100vh - 180px)", display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ padding: 32, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>Détails du Sujet</h3>
                    <button onClick={() => setSelected(null)} className="icon-btn-v2"><Plus style={{ transform: 'rotate(45deg)' }} /></button>
                  </div>

                  <div style={{ padding: 32, flex: 1, overflowY: 'auto' }}>
                    <div style={{ marginBottom: 32 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Titre & Type</div>
                      <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>{selected.titre}</h2>
                      <div style={{ display: 'inline-flex', padding: '6px 16px', background: `${TYPE_COLORS[selected.type]}15`, color: TYPE_COLORS[selected.type], borderRadius: 10, fontWeight: 800, fontSize: 13 }}>
                        {TYPE_LABELS[selected.type]} Promotion
                      </div>
                    </div>

                    <div style={{ marginBottom: 32 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Description</div>
                      <div style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.8 }}>{selected.description}</div>
                    </div>

                    <div className="grid-2" style={{ gap: 16, marginBottom: 32 }}>
                      <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>Capacité</div>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{selected.nbMaxStagiaires} places</div>
                      </div>
                      <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>Statut</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: STATUT_STYLE[selected.statut].color }}>{STATUT_STYLE[selected.statut].label}</div>
                      </div>
                    </div>

                    {selected.stagiairesPrenomNom?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Stagiaires Assignés</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {selected.stagiairesPrenomNom.map((nom, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg)' }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{nom[0]}</div>
                              <span style={{ fontWeight: 700 }}>{nom}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 32, background: 'var(--bg-soft)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button className="btn btn-outline" style={{ borderRadius: 14 }} onClick={() => { setForm(selected); setEditMode(true); setEditId(selected.id); setShowModal(true); }}>Modifier</button>
                    {selected.statut === "DISPONIBLE" && (
                      <button className="btn btn-primary" style={{ borderRadius: 14, background: '#64748b' }} onClick={() => archiverSujet(selected.id).then(load)}>Archiver</button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Modal Creation ── */}
        <AnimatePresence>
          {showModal && (
            <div className="modal-overlay">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="premium-card modal-content-v2"
                style={{ width: 560, padding: 0 }}
              >
                <div style={{ padding: 40, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 24, fontWeight: 900 }}>{editMode ? "Modifier le sujet" : "Concevoir un sujet"}</h2>
                  <button onClick={() => setShowModal(false)} className="icon-btn-v2"><Plus style={{ transform: 'rotate(45deg)' }} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: 40 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="form-group-v2">
                      <label>Titre de l'étude / Projet</label>
                      <input value={form.titre} onChange={f("titre")} required placeholder="Ex: Développement d'une plateforme d'IA distribuée..." />
                    </div>

                    <div className="form-group-v2">
                      <label>Description & Objectifs pédagogiques</label>
                      <textarea value={form.description} onChange={f("description")} rows={4} placeholder="Détaillez le périmètre technique et les attendus..." />
                    </div>

                    <div className="grid-2" style={{ gap: 24 }}>
                      <div className="form-group-v2">
                        <label>Catégorie de stage</label>
                        <select value={form.type} onChange={f("type")}>
                          <option value="PFE">PFE (Fin d'études)</option>
                          <option value="PFA">PFA (Apprentissage)</option>
                          <option value="STAGE_ETE">Stage d'été / Observation</option>
                        </select>
                      </div>
                      <div className="form-group-v2">
                        <label>Capacité d'accueil</label>
                        <select value={form.nbMaxStagiaires} onChange={f("nbMaxStagiaires")}>
                          <option value={1}>Individuel (1)</option>
                          <option value={2}>Binôme (2)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler et quitter</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <RefreshCw className="spin" size={18} /> : (editMode ? "Enregistrer les modifications" : "Publier le sujet")}
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
        .icon-btn-v2.delete:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }
        
        .selected-item { border-width: 2px !important; }
      ` }} />
    </div>
  );
}
