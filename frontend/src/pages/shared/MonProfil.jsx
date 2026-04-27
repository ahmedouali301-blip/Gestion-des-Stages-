import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/common/Sidebar";
import Topbar from "../../components/common/Topbar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getRoleLabel } from "../../utils/roleHelpers";
import api from "../../api/axiosConfig";
import { 
  User, Mail, Phone, Shield, Lock, 
  Palette, Sun, Moon, CheckCircle, 
  AlertCircle, Key, Save, Fingerprint, Camera,
  Briefcase, Activity, ShieldCheck, Zap,
  LayoutDashboard, Users, ClipboardList, FileText, 
  GraduationCap, BarChart, Calendar, Star, RefreshCw, CheckSquare
} from "lucide-react";

const NAV_MAP = {
  ROLE_ADMINISTRATEUR: [
    { path: "/admin/dashboard", icon: <LayoutDashboard size={18} />, label: "Tableau de bord" },
    { path: "/admin/utilisateurs", icon: <Users size={18} />, label: "Utilisateurs" },
  ],
  ROLE_RESPONSABLE_STAGE: [
    { path: "/responsable/dashboard", icon: <LayoutDashboard size={18} />, label: "Tableau de bord" },
    { path: "/responsable/stages", icon: <ClipboardList size={18} />, label: "Stages" },
    { path: "/responsable/sujets", icon: <FileText size={18} />, label: "Sujets" },
    { path: "/responsable/stagiaires", icon: <GraduationCap size={18} />, label: "Stagiaires" },
    { path: "/responsable/analytique", icon: <BarChart size={18} />, label: "Analytique" },
  ],
  ROLE_ENCADRANT: [
    { path: "/encadrant/dashboard", icon: <LayoutDashboard size={18} />, label: "Tableau de bord" },
    { path: "/encadrant/stages", icon: <ClipboardList size={18} />, label: "Mes stages" },
    { path: "/encadrant/sujets", icon: <FileText size={18} />, label: "Sujets" },
    { path: "/encadrant/reunions", icon: <Calendar size={18} />, label: "Réunions" },
    { path: "/encadrant/evaluations", icon: <Star size={18} />, label: "Évaluations" },
  ],
  ROLE_STAGIAIRE: [
    { path: "/stagiaire/dashboard", icon: <LayoutDashboard size={18} />, label: "Mon espace" },
    { path: "/stagiaire/sujets", icon: <FileText size={18} />, label: "Sujets" },
    { path: "/stagiaire/sprints", icon: <RefreshCw size={18} />, label: "Mes sprints" },
    { path: "/stagiaire/taches", icon: <CheckCircle size={18} />, label: "Mes tâches" },
    { path: "/stagiaire/reunions", icon: <Calendar size={18} />, label: "Mes réunions" },
    { path: "/stagiaire/evaluations", icon: <Star size={18} />, label: "Mes évaluations" },
  ],
};

export default function MonProfil() {
  const { user, loginUser } = useAuth();
  const { isDark, toggleTheme, sidebarMini } = useTheme();

  const nav = NAV_MAP[user?.role] || [];

  const [infoForm, setInfoForm] = useState({ nom: user?.nom || "", prenom: user?.prenom || "", telephone: user?.telephone || "" });
  const [infoSuccess, setInfoSuccess] = useState("");
  const [infoError, setInfoError] = useState("");
  const [infoSaving, setInfoSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ motDePasseActuel: "", nouveauMotDePasse: "", confirmation: "" });
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get(`/utilisateurs/${user.id}`);
        setInfoForm({ nom: data.nom, prenom: data.prenom, telephone: data.telephone || "" });
        loginUser({ ...user, ...data }, localStorage.getItem("token"));
      } catch {}
    };
    if (user?.id) fetchProfile();
  }, [user?.id]);

  const handleInfoSubmit = async (e) => {
    e.preventDefault(); setInfoSaving(true); setInfoError(""); setInfoSuccess("");
    try {
      await api.put(`/profil/${user.id}`, infoForm);
      loginUser({ ...user, ...infoForm }, localStorage.getItem("token"));
      setInfoSuccess("Synchronisation des données identitaires réussie.");
    } catch { setInfoError("Échec de la mise à jour des paramètres."); }
    finally { setInfoSaving(false); }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault(); setPwError(""); setPwSuccess("");
    if (pwForm.nouveauMotDePasse !== pwForm.confirmation) return setPwError("Incohérence entre les nouveaux mots de passe.");
    setPwSaving(true);
    try {
      await api.patch(`/profil/${user.id}/changer-mot-de-passe`, { motDePasseActuel: pwForm.motDePasseActuel, nouveauMotDePasse: pwForm.nouveauMotDePasse });
      setPwSuccess("Protocole de sécurité mis à jour avec succès.");
      setPwForm({ motDePasseActuel: "", nouveauMotDePasse: "", confirmation: "" });
    } catch { setPwError("Le mot de passe actuel est incorrect."); }
    finally { setPwSaving(false); }
  };

  const initials = user ? `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase() : "?";
  const fi = (k) => (e) => setInfoForm((p) => ({ ...p, [k]: e.target.value }));
  const fp = (k) => (e) => setPwForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={nav} />
      <Topbar />
      
      <main className="main-content fade-in">
        <header className="elite-profile-header">
           <div className="title-stack">
              <h1 className="gradient-text">Identity Hub</h1>
              <p>Gestion centrale de vos paramètres d'accès et de visibilité Elite</p>
           </div>
           
           <div className="auth-level-badge">
              <ShieldCheck size={16} />
              <span>Authentification de niveau 2</span>
           </div>
        </header>

        <div className="profile-orchestrator">
           {/* VISION PANEL */}
           <div className="vision-panel">
              <motion.section initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="avatar-master-premium">
                 <div className="avatar-glass-layer"></div>
                 <div className="avatar-wrapper-elite">
                    <div className="initials-box">{initials}</div>
                    <button className="btn-camera-ops"><Camera size={14} /></button>
                 </div>
                 <h2 className="profile-display-name">{user?.prenom} {user?.nom}</h2>
                 <div className="role-tag-elite">{getRoleLabel(user?.role)}</div>
                 
                 <div className="profile-meta-list">
                    <div className="p-m-item"><Mail size={14} /> <span>{user?.email}</span></div>
                    <div className="p-m-item"><Fingerprint size={14} /> <span>ID: {user?.cin || 'ELITE_USR'}</span></div>
                 </div>
              </motion.section>

              <motion.section initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }} className="appearance-card-elite">
                 <h3 className="s-label"><Palette size={16} /> Expérience Visuelle</h3>
                 <div className="theme-toggle-orb" onClick={toggleTheme}>
                    <div className="t-info">
                       <span className="t-title">{isDark ? "Mode Nocturne" : "Mode Solaire"}</span>
                       <span className="t-desc">{isDark ? "Optimisé pour la concentration" : "Optimisé pour la clarté"}</span>
                    </div>
                    <div className={`t-switch ${isDark ? 'active' : ''}`}>
                       {isDark ? <Moon size={14} fill="currentColor" /> : <Sun size={14} fill="currentColor" />}
                    </div>
                 </div>
              </motion.section>
           </div>

           {/* CONTROLS PANEL */}
           <div className="controls-panel">
              {/* PARAMETERS FORM */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="control-card-premium">
                 <div className="c-head"><User size={20} /> Paramètres Personnels</div>
                 
                 <AnimatePresence>
                    {(infoSuccess || infoError) && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} className={`elite-status-banner ${infoSuccess ? 'success' : 'danger'}`}>
                         {infoSuccess ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                         <span>{infoSuccess || infoError}</span>
                      </motion.div>
                    )}
                 </AnimatePresence>

                 <form onSubmit={handleInfoSubmit} className="elite-manager-form mini">
                    <div className="grid-2">
                       <div className="form-group-v3">
                          <label>Prénom</label>
                          <input value={infoForm.prenom} onChange={fi("prenom")} onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }} required />
                       </div>
                       <div className="form-group-v3">
                          <label>Nom</label>
                          <input value={infoForm.nom} onChange={fi("nom")} onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }} required />
                       </div>
                    </div>
                    <div className="form-group-v3 mt-4">
                       <label>Contact Téléphonique</label>
                       <div className="input-group-v2">
                          <Phone size={18} />
                          <input value={infoForm.telephone} onChange={fi("telephone")} onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} pattern="\d{8}" maxLength={8} required />
                       </div>
                    </div>
                    <div className="form-actions-end">
                       <button type="submit" disabled={infoSaving} className="btn btn-primary elite-btn">
                          {infoSaving ? 'Synchronisation...' : <><Save size={18} /> Valider Changements</>}
                       </button>
                    </div>
                 </form>
              </motion.div>

              {/* SECURITY FORM */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="control-card-premium">
                 <div className="c-head"><Shield size={20} /> Sécurité & Accès</div>
                 
                 <AnimatePresence>
                    {(pwSuccess || pwError) && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} className={`elite-status-banner ${pwSuccess ? 'success' : 'danger'}`}>
                         {pwSuccess ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                         <span>{pwSuccess || pwError}</span>
                      </motion.div>
                    )}
                 </AnimatePresence>

                 <form onSubmit={handlePwSubmit} className="elite-manager-form mini">
                    <div className="form-group-v3">
                       <label>Mot de passe actuel</label>
                       <div className="input-group-v2">
                          <Key size={18} />
                          <input type="password" value={pwForm.motDePasseActuel} onChange={fp("motDePasseActuel")} required />
                       </div>
                    </div>
                    <div className="grid-2 mt-4">
                       <div className="form-group-v3">
                          <label>Nouveau Mot de Passe</label>
                          <input type="password" value={pwForm.nouveauMotDePasse} onChange={fp("nouveauMotDePasse")} required />
                       </div>
                       <div className="form-group-v3">
                          <label>Confirmation</label>
                          <input type="password" value={pwForm.confirmation} onChange={fp("confirmation")} required />
                       </div>
                    </div>
                    <div className="form-actions-end">
                       <button type="submit" disabled={pwSaving} className="btn btn-outline elite-btn">
                          {pwSaving ? 'Mise à jour sécurisée...' : <><Zap size={18} /> Changer les Identifiants</>}
                       </button>
                    </div>
                 </form>
              </motion.div>
           </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .elite-profile-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
        .auth-level-badge { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; color: #10b981; background: rgba(16,185,129,0.1); padding: 8px 16px; border-radius: 10px; border: 1.5px solid rgba(16,185,129,0.2); text-transform: uppercase; letter-spacing: 1px; }
        
        .profile-orchestrator { display: grid; grid-template-columns: 380px 1fr; gap: 32px; }
        
        .avatar-master-premium { background: var(--surface); border: 1.5px solid var(--border); border-radius: 32px; padding: 48px 32px; text-align: center; position: relative; overflow: hidden; margin-bottom: 32px; }
        .avatar-glass-layer { position: absolute; top: 0; left: 0; right: 0; height: 120px; background: linear-gradient(135deg, var(--primary-light-alpha) 0%, transparent 100%); pointer-events: none; }
        .avatar-wrapper-elite { position: relative; width: 120px; height: 120px; margin: 0 auto 32px; z-index: 1; }
        .initials-box { width: 100%; height: 100%; border-radius: 40px; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 900; box-shadow: 0 20px 40px var(--primary-light-alpha); }
        .btn-camera-ops { position: absolute; bottom: 0; right: 0; width: 40px; height: 40px; border-radius: 12px; background: var(--surface); border: 2.5px solid var(--primary); color: var(--primary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
        .btn-camera-ops:hover { transform: scale(1.1); background: var(--primary); color: #fff; }
        
        .profile-display-name { font-size: 24px; font-weight: 900; color: var(--text); margin-bottom: 8px; }
        .role-tag-elite { display: inline-block; padding: 6px 18px; border-radius: 12px; background: var(--bg); color: var(--text-3); font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 32px; }
        
        .profile-meta-list { display: flex; flex-direction: column; gap: 12px; text-align: left; background: var(--bg-alpha); padding: 20px; border-radius: 20px; }
        .p-m-item { display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--text-2); font-weight: 700; }
        .p-m-item svg { color: var(--primary); }

        .appearance-card-elite { background: var(--surface); border: 1.5px solid var(--border); border-radius: 24px; padding: 32px; }
        .s-label { font-size: 11px; font-weight: 900; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 10px; border-bottom: 1.5px solid var(--border); padding-bottom: 16px; margin-bottom: 24px; }
        .theme-toggle-orb { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: var(--bg); border-radius: 16px; cursor: pointer; transition: 0.2s; border: 1.5px solid transparent; }
        .theme-toggle-orb:hover { border-color: var(--primary); }
        .t-info { display: flex; flex-direction: column; }
        .t-title { font-size: 14px; font-weight: 800; color: var(--text); }
        .t-desc { font-size: 11px; color: var(--text-3); font-weight: 600; }
        .t-switch { width: 50px; height: 26px; border-radius: 20px; background: var(--border); position: relative; transition: 0.3s; }
        .t-switch.active { background: var(--primary); }
        .t-switch svg { position: absolute; top: 50%; transform: translateY(-50%); left: 6px; transition: 0.3s; color: #fff; }
        .t-switch.active svg { left: 28px; }

        .control-card-premium { background: var(--surface); border: 1.5px solid var(--border); border-radius: 24px; padding: 40px; margin-bottom: 32px; }
        .c-head { font-size: 18px; font-weight: 900; color: var(--text); display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
        .elite-status-banner { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-radius: 14px; font-size: 13px; font-weight: 800; margin-bottom: 32px; }
        .elite-status-banner.success { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
        .elite-status-banner.danger { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
        
        .input-group-v2 { position: relative; display: flex; align-items: center; }
        .input-group-v2 svg { position: absolute; left: 18px; color: var(--text-3); transition: 0.3s; }
        .input-group-v2 input { padding-left: 52px !important; }
        .input-group-v2 input:focus + svg { color: var(--primary); }
        
        .form-actions-end { display: flex; justify-content: flex-end; margin-top: 32px; padding-top: 24px; border-top: 1.5px dashed var(--border); }
      ` }} />
    </div>
  );
}
