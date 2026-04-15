import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getRoleLabel } from "../../utils/roleHelpers";
import { 
  getNotificationsByUser, 
  marquerCommeLue, 
  marquerToutCommeLues, 
  supprimerToutNotifs 
} from "../../api/notificationAPI";
import { 
  Bell, 
  Check, 
  Trash2, 
  Calendar, 
  ClipboardList, 
  UserPlus, 
  CheckCircle, 
  AlertCircle,
  FileText,
  UserCheck
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import ConfirmModal from "./ConfirmModal";

const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export default function Topbar() {
  const { user } = useAuth();
  const { isDark, toggleTheme, toggleSidebar } = useTheme();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [notifs, setNotifs] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', type: 'primary', onConfirm: () => {} });

  const closeConfirm = () => setConfirm(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadNotifs();
      const interval = setInterval(loadNotifs, 30000); // Poll less frequently
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifs = async () => {
    if (!user?.id) return;
    try {
      const res = await getNotificationsByUser(user.id);
      setNotifs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setNotifs([]);
    }
  };

  const handleRead = async (n) => {
    try {
      if (!n.lue) {
        await marquerCommeLue(n.id);
        loadNotifs();
      }
      
      // Navigation logic
      setShowNotifMenu(false);
      
      const role = user?.role;
      const type = n.type || "";
      
      if (type.startsWith("TACHE_")) {
        if (role === "ROLE_STAGIAIRE") navigate("/stagiaire/taches");
        else if (role === "ROLE_ENCADRANT") navigate("/encadrant/stages"); // To choose stage first or specific if ID was there
      } else if (type.startsWith("REUNION_") || n.reunionId) {
        if (role === "ROLE_STAGIAIRE") navigate("/stagiaire/reunions");
        else if (role === "ROLE_ENCADRANT") navigate("/encadrant/reunions");
      } else if (type.startsWith("SPRINT_")) {
        if (role === "ROLE_STAGIAIRE") navigate("/stagiaire/sprints");
        else if (role === "ROLE_ENCADRANT") navigate("/encadrant/stages");
      } else if (type.startsWith("SUJET_") || n.titre.includes("sujet")) {
        if (role === "ROLE_RESPONSABLE_STAGE") navigate("/responsable/sujets");
        else if (role === "ROLE_STAGIAIRE") navigate("/stagiaire/sujets");
      } else if (type.startsWith("STAGE_")) {
        if (role === "ROLE_RESPONSABLE_STAGE") navigate("/responsable/stages");
        else if (role === "ROLE_ENCADRANT") navigate("/encadrant/stages");
        else if (role === "ROLE_STAGIAIRE") navigate("/stagiaire/dashboard");
      }
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await marquerToutCommeLues(user.id);
      loadNotifs();
    } catch (err) {}
  };

  const handleDeleteAll = () => {
    if (!user?.id) return;
    setConfirm({
      isOpen: true,
      title: 'Vider les notifications',
      message: 'Voulez-vous supprimer toutes vos notifications ?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await supprimerToutNotifs(user.id);
          loadNotifs();
          closeConfirm();
        } catch (err) {
          closeConfirm();
        }
      }
    });
  };

  const unreadCount = Array.isArray(notifs) ? notifs.filter(n => !n.lue).length : 0;
  const dateStr = `${JOURS[now.getDay()]} ${now.getDate()} ${MOIS[now.getMonth()]}`;
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const initials = user ? `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase() : "?";

  return (
    <div className="topbar" style={{ padding: '0 32px' }}>
      <div className="topbar-left">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="topbar-toggle"
          onClick={toggleSidebar}
          style={{ background: 'var(--bg)', border: 'none', width: 40, height: 40, borderRadius: 12 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </motion.button>

        <div className="topbar-datetime" style={{ marginLeft: 8 }}>
          <span className="topbar-date" style={{ color: 'var(--text-3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{dateStr}</span>
          <span className="topbar-time" style={{ fontSize: 18, color: 'var(--text)', fontWeight: 700 }}>{timeStr}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="topbar-btn"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            style={{ position: 'relative', width: 44, height: 44, borderRadius: 14, background: 'var(--bg)', border: 'none' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: "absolute", top: 8, right: 8,
                  background: "var(--danger)", color: "#fff",
                  fontSize: 10, fontWeight: "bold",
                  minWidth: 18, height: 18, borderRadius: 9,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid var(--surface)",
                  boxShadow: '0 2px 4px rgba(224, 60, 60, 0.3)'
                }}
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifMenu && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 1050 }} 
                  onClick={() => setShowNotifMenu(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10, x: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10, x: 20 }}
                  className="glass-card" 
                  style={{
                    position: "absolute", top: "100%", right: 0,
                    width: 380, maxHeight: 520, 
                    display: 'flex', flexDirection: 'column',
                    marginTop: 14, zIndex: 1100,
                    boxShadow: "var(--shadow-lg)",
                    padding: 0, overflow: 'hidden',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  <div style={{ 
                    padding: '20px 24px', 
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--surface)',
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center" 
                  }}>
                    <div>
                      <h4 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Notifications</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                        Vous avez {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
                      </p>
                    </div>
                    {notifs.length > 0 && (
                      <button 
                        onClick={handleMarkAllRead} 
                        className="btn-text"
                        style={{ 
                          color: "var(--primary)", 
                          fontSize: 13, 
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Check size={16} /> Tout lire
                      </button>
                    )}
                  </div>

                  <div className="custom-scrollbar" style={{ 
                    overflowY: "auto", 
                    flex: 1,
                    padding: '8px'
                  }}>
                    {notifs.length === 0 ? (
                      <div style={{ 
                        textAlign: "center", 
                        padding: '60px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 16
                      }}>
                        <div style={{ 
                          width: 64, height: 64, 
                          borderRadius: '50%', 
                          background: 'var(--bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-3)'
                        }}>
                          <Bell size={32} strokeWidth={1.5} />
                        </div>
                        <div style={{ color: "var(--text-2)", fontSize: 14, fontWeight: 500 }}>
                          Aucune notification pour le moment.
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {notifs.map(n => {
                          const isUnread = !n.lue;
                          let Icon = Bell;
                          let iconColor = "var(--primary)";
                          
                          if (n.type?.startsWith("TACHE")) { Icon = ClipboardList; iconColor = "var(--warning)"; }
                          else if (n.type?.startsWith("REUNION")) { Icon = Calendar; iconColor = "var(--success)"; }
                          else if (n.type?.startsWith("SUJET")) { Icon = FileText; iconColor = "var(--primary)"; }
                          else if (n.type?.startsWith("STAGE")) { Icon = UserCheck; iconColor = "var(--accent)"; }
                          
                          return (
                            <motion.div 
                              key={n.id} 
                              whileHover={{ x: 4, background: 'var(--bg)' }}
                              style={{
                                padding: "16px", 
                                borderRadius: 12,
                                background: isUnread ? "var(--primary-lt)" : "transparent",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: 'flex',
                                gap: 14,
                                position: 'relative'
                              }} 
                              onClick={() => handleRead(n)}
                            >
                              <div style={{ 
                                width: 42, height: 42, 
                                borderRadius: 12, 
                                background: isUnread ? 'var(--surface)' : 'var(--bg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: iconColor,
                                flexShrink: 0,
                                border: isUnread ? '1px solid var(--primary-lt)' : '1px solid transparent'
                              }}>
                                <Icon size={20} />
                              </div>
                              
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                  fontWeight: isUnread ? 700 : 600, 
                                  fontSize: 14,
                                  color: 'var(--text)',
                                  marginBottom: 4, 
                                  display: "flex", 
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  gap: 8
                                }}>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {n.titre}
                                  </span>
                                  {isUnread && (
                                    <span style={{ 
                                      width: 8, height: 8, 
                                      borderRadius: '50%', 
                                      background: 'var(--primary)',
                                      flexShrink: 0,
                                      marginTop: 5
                                    }} />
                                  )}
                                </div>
                                <div style={{ 
                                  color: "var(--text-2)", 
                                  fontSize: 13, 
                                  lineHeight: "1.5",
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>
                                  {n.message}
                                </div>
                                <div style={{ 
                                  marginTop: 8, 
                                  fontSize: 11, 
                                  color: 'var(--text-3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}>
                                  <AlertCircle size={10} />
                                  {n.dateCreation ? formatDistanceToNow(new Date(n.dateCreation), { addSuffix: true, locale: fr }) : "À l'instant"}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {notifs.length > 0 && (
                    <div style={{ 
                      padding: '12px 16px', 
                      background: 'var(--surface)', 
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'center'
                    }}>
                      <button 
                        onClick={handleDeleteAll} 
                        style={{ 
                          width: '100%',
                          padding: '10px', 
                          background: 'var(--danger-lt)', 
                          border: 'none', 
                          borderRadius: 10, 
                          color: 'var(--danger)', 
                          fontSize: 13, 
                          cursor: 'pointer', 
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'var(--danger-lt)'; }}
                      >
                        <Trash2 size={16} /> Effacer tout l'historique
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="topbar-btn"
          onClick={toggleTheme}
          style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--bg)', border: 'none' }}
        >
          {isDark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          )}
        </motion.button>

        <div className="topbar-role" style={{ borderRadius: 10, background: 'var(--primary-lt)', color: 'var(--primary)', fontWeight: 700, padding: '6px 16px', fontSize: 12 }}>
          {getRoleLabel(user?.role)}
        </div>

        <motion.div
          whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(10, 92, 158, 0.2)' }}
          className="topbar-avatar"
          onClick={() => navigate(user?.role === "ROLE_ADMINISTRATEUR" ? "/admin/profil" : "/login")}
          style={{ width: 42, height: 42, cursor: 'pointer', borderRadius: 14 }}
        >
          {initials}
        </motion.div>
      </div>

      <ConfirmModal
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        onClose={closeConfirm}
        onConfirm={confirm.onConfirm}
        type={confirm.type}
      />
    </div>
  );
}
