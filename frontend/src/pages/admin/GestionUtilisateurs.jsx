import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/common/Sidebar';
import {
  getAllUtilisateurs, createUtilisateur, updateUtilisateur,
  toggleActif, deleteUtilisateur, resetPassword,
} from '../../api/utilisateurAPI';
import { getIdentitesSansCompte, marquerCompteCreer } from '../../api/stagiaireIdentiteAPI';
import { getRoleLabel, getRoleBadgeClass } from '../../utils/roleHelpers';
import {
  ArrowRight, Shield, ShieldCheck, UserCheck, UserX, Power, UserPlus, Plus,
  LayoutDashboard, Users, Briefcase, GraduationCap, Lock, CheckCircle, RefreshCw, Search, Edit, Key, Trash2
} from 'lucide-react';
import ClinisysAlert from '../../utils/SwalUtils';
import Swal from 'sweetalert2';
import Topbar from '../../components/common/Topbar';
import { useTheme } from '../../context/ThemeContext';

// Custom Toggle Component
const Toggle = ({ active, onClick, loading }) => (
  <div 
    onClick={loading ? null : onClick}
    style={{
      width: 44,
      height: 22,
      borderRadius: 20,
      background: active ? 'var(--primary)' : 'var(--border)',
      padding: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: active ? 'flex-end' : 'flex-start',
      cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: active ? '0 0 10px rgba(31, 169, 205, 0.2)' : 'none',
      opacity: loading ? 0.6 : 1,
    }}
  >
    <div style={{
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }} />
  </div>
);

const NAV = [
  { path: '/admin/dashboard',    icon: <LayoutDashboard size={18} />, label: 'Tableau de bord' },
  { path: '/admin/utilisateurs', icon: <Users size={18} />, label: 'Utilisateurs' },
];

const ROLES_OPTIONS = [
  { value: 'ROLE_ADMINISTRATEUR',    label: 'Administrateur', icon: <Shield size={20} /> },
  { value: 'ROLE_RESPONSABLE_STAGE', label: 'Responsable de Stage', icon: <Briefcase size={20} /> },
  { value: 'ROLE_ENCADRANT',         label: 'Encadrant', icon: <Briefcase size={20} /> },
  { value: 'ROLE_STAGIAIRE',         label: 'Stagiaire', icon: <GraduationCap size={20} /> },
];

const EMPTY_FORM = {
  nom:'', prenom:'', email:'', motDePasse:'', telephone:'',
  role:'ROLE_STAGIAIRE',
  departement:'', specialite:'', cin:'',
  nbStagiairesMax: 5,
};

export default function GestionUtilisateurs() {
  const [utilisateurs,  setUtilisateurs]  = useState([]);
  const [filtered,      setFiltered]      = useState([]);
  const [search,        setSearch]        = useState('');
  const [roleFilter,    setRoleFilter]    = useState('TOUS');
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editMode,      setEditMode]      = useState(false);
  const [selectedId,    setSelectedId]    = useState(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [error,         setError]         = useState('');
  const [saving,        setSaving]        = useState(false);
  const { sidebarMini } = useTheme();

  const [identitesStagiaires, setIdentitesStagiaires] = useState([]);
  const [selectedIdentiteId,  setSelectedIdentiteId]  = useState('');



  useEffect(() => { load(); }, []);

  useEffect(() => {
    let list = utilisateurs;
    if (roleFilter !== 'TOUS') list = list.filter(u => u.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.nom.toLowerCase().includes(q) ||
        u.prenom.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [utilisateurs, search, roleFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, idRes] = await Promise.all([
        getAllUtilisateurs(),
        getIdentitesSansCompte(),
      ]);
      setUtilisateurs(uRes.data);
      setIdentitesStagiaires(idRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditMode(false); setSelectedId(null);
    setSelectedIdentiteId('');
    setError(''); setShowModal(true);
  };

  const openEdit = (u) => {
    setForm({
      nom: u.nom, prenom: u.prenom, email: u.email,
      motDePasse:'', telephone: u.telephone||'',
      role: u.role,
      departement: u.departement||'',
      specialite:  u.specialite||'',
      cin:         u.cin||'',
      nbStagiairesMax: u.nbStagiairesMax||5,
    });
    setEditMode(true); setSelectedId(u.id);
    setSelectedIdentiteId('');
    setError(''); setShowModal(true);
  };

  const handleSelectIdentite = (identiteId) => {
    setSelectedIdentiteId(identiteId);
    if (!identiteId) {
      setForm(p => ({ ...p, nom:'', prenom:'', email:'', telephone:'', cin:'' }));
      return;
    }
    const identite = identitesStagiaires.find(i => String(i.id) === String(identiteId));
    if (identite) {
      setForm(p => ({
        ...p,
        nom:       identite.nom,
        prenom:    identite.prenom,
        email:     identite.email,
        telephone: identite.telephone || '',
        cin:       identite.cin || '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!editMode) {
        payload.motDePasse = form.cin;
      }
      if (editMode) {
        await updateUtilisateur(selectedId, payload);
      } else {
        await createUtilisateur(payload);
        if (form.role === 'ROLE_STAGIAIRE' && selectedIdentiteId) {
          await marquerCompteCreer(selectedIdentiteId);
        }
      }
      setShowModal(false);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || '';
      let errorMsg = '';
      if (msg.includes('UKsbO9lhymuesdqO9oktbf4fj3u') || (msg.toLowerCase().includes('duplicata') && msg.includes('cin'))) {
        errorMsg = 'Ce numéro CIN est déjà associé à un autre compte.';
      } else if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('duplicate')) {
        errorMsg = 'Cette adresse email est déjà utilisée.';
      } else {
        errorMsg = msg || 'Une erreur est survenue lors de la sauvegarde.';
      }
      ClinisysAlert.error('Erreur', errorMsg);
    } finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try { 
      await toggleActif(id); 
      load(); 
      ClinisysAlert.success("Statut mis à jour");
    }
    catch { ClinisysAlert.error("Erreur", "Impossible de changer le statut"); }
  };

  const handleDelete = (id, nom) => {
    ClinisysAlert.confirm({
      title: 'Supprimer l\'utilisateur',
      text: `Êtes-vous sûr de vouloir supprimer ${nom} ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      danger: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteUtilisateur(id);
          load();
          ClinisysAlert.success("Utilisateur supprimé");
        } catch {
          ClinisysAlert.error("Erreur", "Impossible de supprimer l'utilisateur");
        }
      }
    });
  };

  const handleReset = async (id) => {
    const { value: mdp } = await Swal.fire({
      title: 'Réinitialiser le mot de passe',
      input: 'password',
      inputLabel: 'Nouveau mot de passe (min. 6 caractères)',
      inputPlaceholder: 'Entrez le nouveau mot de passe',
      showCancelButton: true,
      confirmButtonText: 'Réinitialiser',
      cancelButtonText: 'Annuler',
      customClass: {
        popup: 'premium-swal-popup',
        confirmButton: 'premium-swal-confirm',
        cancelButton: 'premium-swal-cancel',
        input: 'premium-swal-input'
      },
      buttonsStyling: false,
      inputValidator: (value) => {
        if (!value || value.length < 6) {
          return 'Le mot de passe doit contenir au moins 6 caractères !'
        }
      }
    });

    if (mdp) {
      try { 
        await resetPassword(id, mdp); 
        ClinisysAlert.success('Succès', 'Mot de passe réinitialisé.'); 
      }
      catch { ClinisysAlert.error('Erreur', 'Échec de la réinitialisation'); }
    }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const isStagiaire = form.role === 'ROLE_STAGIAIRE';

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      <main className="main-content fade-in">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-header"
        >
          <div>
            <h1 className="gradient-text">Gestion des Utilisateurs</h1>
            <div className="page-subtitle">Gérez les comptes et les accès de la plateforme</div>
          </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary" 
              style={{ borderRadius: 12, padding: '12px 24px', boxShadow: '0 10px 20px rgba(31, 169, 205, 0.2)', display: 'flex', alignItems: 'center', gap: 10 }}
              onClick={openCreate}
            >
              <UserPlus size={18} />
              <span>Nouvel utilisateur</span>
            </motion.button>
        </motion.div>

        {/* Stats Summary Area */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 32 }}>
          {[
            { label: 'Total', count: utilisateurs.length, color: 'var(--primary)', icon: <Users size={24} /> },
            { label: 'Actifs', count: utilisateurs.filter(u => u.actif).length, color: 'var(--success)', icon: <CheckCircle size={24} /> },
            { label: 'Inactifs', count: utilisateurs.filter(u => !u.actif).length, color: 'var(--danger)', icon: <Lock size={24} /> },
            { label: 'Stagiaires', count: utilisateurs.filter(u => u.role === 'ROLE_STAGIAIRE').length, color: 'var(--accent)', icon: <GraduationCap size={24} /> },
          ].map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card" 
              style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters Area */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card" 
          style={{ marginBottom: 24, padding: '16px 24px' }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input 
                placeholder="Rechercher par nom, prénom ou email..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 44, borderRadius: 12, background: 'var(--bg)', border: 'none' }} 
              />
            </div>
            <select 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              style={{ width: 220, borderRadius: 12, background: 'var(--bg)', border: 'none', paddingLeft: 16 }}
            >
              <option value="TOUS">Tous les rôles</option>
              {ROLES_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <button className="btn btn-outline" onClick={load} style={{ borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={16} />
              <span>Actualiser</span>
            </button>
          </div>
        </motion.div>

        {/* Table Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 100 }}>
            <div className="spinner" style={{ border: '3px solid var(--primary-lt)', borderTopColor: 'var(--primary)', width: 40, height: 40, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
            <div style={{ color: 'var(--text-3)', fontWeight: 500 }}>Chargement des utilisateurs...</div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="premium-card" 
            style={{ padding: 0, overflow: 'hidden' }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    {['Utilisateur', 'Contact', 'Habilitation', 'État', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: 60 }}>
                          <div style={{ marginBottom: 12, color: 'var(--text-3)' }}><Search size={48} /></div>
                          <div style={{ color: 'var(--text-2)', fontWeight: 500 }}>Aucun utilisateur ne correspond à votre recherche.</div>
                        </td>
                      </tr>
                    ) : filtered.map((u, i) => (
                      <motion.tr 
                        key={u.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                        className="table-row-hover"
                      >
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                              width: 42, height: 42, borderRadius: 14, 
                              background: 'linear-gradient(135deg, var(--primary), var(--primary-dk))', 
                              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, fontWeight: 700, boxShadow: '0 4px 10px rgba(10, 92, 158, 0.2)'
                            }}>
                              {u.prenom?.[0]}{u.nom?.[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{u.prenom} {u.nom}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>ID: #{u.id.toString().padStart(4, '0')}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>{u.email}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.telephone || '—'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span className={`badge ${getRoleBadgeClass(u.role)}`} style={{ padding: '6px 14px', borderRadius: 10 }}>
                            {getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <Toggle active={u.actif} onClick={() => handleToggle(u.id)} />
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <motion.button 
                              whileHover={{ scale: 1.1, backgroundColor: 'var(--primary-lt)' }} 
                              whileTap={{ scale: 0.9 }} 
                              className="topbar-btn" 
                              onClick={() => openEdit(u)} 
                              style={{ color: 'var(--primary)', border: '1px solid var(--border)' }}
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1, backgroundColor: 'var(--accent-lt)' }} 
                              whileTap={{ scale: 0.9 }} 
                              className="topbar-btn" 
                              onClick={() => handleReset(u.id)} 
                              style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}
                              title="Réinitialiser le mot de passe"
                            >
                              <Key size={16} />
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1, backgroundColor: 'var(--danger-lt)' }} 
                              whileTap={{ scale: 0.9 }} 
                              className="topbar-btn" 
                              style={{ color: 'var(--danger)', border: '1px solid var(--border)' }} 
                              onClick={() => handleDelete(u.id, `${u.prenom} ${u.nom}`)} 
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Modal Modification / Création */}
        <AnimatePresence>
          {showModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="premium-card" 
                style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                  <div>
                    <h2 style={{ fontSize: 22, margin: 0 }}>{editMode ? 'Modifier' : 'Nouvel'} utilisateur</h2>
                    <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Remplissez les informations ci-dessous</p>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{ background: 'var(--bg)', border: 'none', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="error-msg" style={{ marginBottom: 20, borderRadius: 12, padding: '12px 16px' }}>
                    ⚠️ {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                  {!editMode && (
                    <div className="form-group" style={{ marginBottom: 24 }}>
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Rôle de l'utilisateur *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {ROLES_OPTIONS.filter(r => r.value !== 'ROLE_ADMINISTRATEUR').map(r => (
                          <div 
                            key={r.value} 
                            onClick={() => setForm(p => ({ ...p, role: r.value }))}
                            style={{ 
                              padding: '12px', borderRadius: 12, border: '2px solid', 
                              borderColor: form.role === r.value ? 'var(--primary)' : 'var(--border)',
                              background: form.role === r.value ? 'var(--primary-lt)' : 'transparent',
                              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10
                            }}
                          >
                            <div style={{ color: form.role === r.value ? 'var(--primary)' : 'var(--text-3)' }}>{r.icon}</div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: form.role === r.value ? 'var(--primary)' : 'var(--text-2)' }}>{r.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!editMode && isStagiaire && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
                      <div className="form-group" style={{ background: 'var(--bg)', padding: 16, borderRadius: 16, border: '1px dashed var(--border)' }}>
                        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Associer à un stagiaire pré-enregistré</label>
                        <select 
                          value={selectedIdentiteId}
                          onChange={e => handleSelectIdentite(e.target.value)}
                          style={{ background: 'var(--surface)' }}
                        >
                          <option value="">— Aucun (Saisie manuelle) —</option>
                          {identitesStagiaires.map(i => (
                            <option key={i.id} value={i.id}>{i.prenom} {i.nom} ({i.email})</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
                    <div className="form-group">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Prénom *</label>
                      <input 
                        value={form.prenom} onChange={f('prenom')} onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }} required
                        placeholder="Ex: Ahmed"
                        readOnly={!editMode && isStagiaire && !!selectedIdentiteId}
                        style={{ borderRadius: 12 }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Nom *</label>
                      <input 
                        value={form.nom} onChange={f('nom')} onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }} required
                        placeholder="Ex: Ouali"
                        readOnly={!editMode && isStagiaire && !!selectedIdentiteId}
                        style={{ borderRadius: 12 }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Adresse Email *</label>
                    <input 
                      type="email" value={form.email} onChange={f('email')} required
                      disabled={editMode}
                      placeholder="email@exemple.com"
                      readOnly={!editMode && isStagiaire && !!selectedIdentiteId}
                      style={{ borderRadius: 12 }}
                    />
                  </div>

                  {!editMode && (
                    <div style={{ 
                      background: 'var(--primary-lt)', 
                      padding: '12px 16px', 
                      borderRadius: 12, 
                      marginBottom: 20, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12,
                      border: '1px solid var(--primary-light-alpha)'
                    }}>
                      <div style={{ color: 'var(--primary)' }}><Key size={20} /></div>
                      <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                        Sécurité automatique : Le mot de passe initial sera identique au numéro CIN.
                      </div>
                    </div>
                  )}

                  <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
                    <div className="form-group">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Numéro CIN *</label>
                      <input 
                        value={form.cin} onChange={f('cin')} onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} required maxLength={8} pattern="\d{8}"
                        placeholder="8 chiffres"
                        readOnly={!editMode && isStagiaire && !!selectedIdentiteId}
                        style={{ borderRadius: 12 }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Numéro Téléphone *</label>
                      <input 
                        value={form.telephone} onChange={f('telephone')} onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} required maxLength={8} pattern="\d{8}"
                        placeholder="8 chiffres"
                        readOnly={!editMode && isStagiaire && !!selectedIdentiteId}
                        style={{ borderRadius: 12 }}
                      />
                    </div>
                  </div>

                  {(form.role === 'ROLE_RESPONSABLE_STAGE' || form.role === 'ROLE_ENCADRANT') && (
                    <div className="form-group" style={{ marginBottom: 20 }}>
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Département / Spécialité</label>
                      <input 
                        value={form.role === 'ROLE_RESPONSABLE_STAGE' ? form.departement : form.specialite} 
                        onChange={f(form.role === 'ROLE_RESPONSABLE_STAGE' ? 'departement' : 'specialite')} 
                        onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }} 
                        placeholder="Ex: Informatique"
                        style={{ borderRadius: 12 }}
                      />
                    </div>
                  )}

                  {form.role === 'ROLE_ENCADRANT' && (
                    <div className="form-group" style={{ marginBottom: 20 }}>
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Nombre max de stagiaires</label>
                      <input type="number" value={form.nbStagiairesMax} onChange={f('nbStagiairesMax')} min={1} max={20} style={{ borderRadius: 12 }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} style={{ borderRadius: 12 }}>Annuler</button>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 12, padding: '12px 32px' }}>
                      {saving ? 'Enregistrement...' : editMode ? 'Enregistrer les modifications' : 'Créer le compte'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .table-row-hover:hover {
          background: rgba(10, 92, 158, 0.02) !important;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          display: inline-block;
        }
      `}</style>
    </div>
  );
}