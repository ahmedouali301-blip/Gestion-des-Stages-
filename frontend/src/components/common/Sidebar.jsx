import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getRoleLabel } from "../../utils/roleHelpers";

export default function Sidebar({ navItems }) {
  const { user, logout } = useAuth();
  const { sidebarMini } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user
    ? `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
    : "?";

  const getProfilPath = () => {
    switch (user?.role) {
      case "ROLE_ADMINISTRATEUR": return "/admin/profil";
      case "ROLE_RESPONSABLE_STAGE": return "/responsable/profil";
      case "ROLE_ENCADRANT": return "/encadrant/profil";
      case "ROLE_STAGIAIRE": return "/stagiaire/profil";
      default: return "/login";
    }
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand" style={{ padding: '24px 20px', borderBottom: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/logo_clinisys_seullement.PNG" alt="Logo" style={{ height: '32px', width: 'auto' }} />
        {!sidebarMini && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div className="login-brand-text" style={{ fontSize: '18px', letterSpacing: '1px' }}>
                <span className="brand-clini">CLINI</span><span className="brand-sys">SYS</span>
            </div>
            <span style={{ fontSize: 9, letterSpacing: '0.5px', color: 'var(--text-3)', fontWeight: 600 }}>GESTION DE STAGES</span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" style={{ padding: '20px 14px' }}>
        {navItems.map((item, i) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            data-label={item.label}
            onClick={() => navigate(item.path)}
            style={{
              marginBottom: 4,
              borderRadius: 14,
              padding: '12px 14px'
            }}
          >
            <span className="nav-icon" style={{ fontSize: 18 }}>{item.icon}</span>
            <span className="nav-label" style={{ fontWeight: 600 }}>{item.label}</span>
            {location.pathname === item.path && (
              <motion.div
                layoutId="active-pill"
                style={{
                  position: 'absolute',
                  right: 8,
                  width: 4,
                  height: 16,
                  background: 'var(--primary)',
                  borderRadius: 2
                }}
              />
            )}
          </motion.div>
        ))}

        <div style={{ margin: "20px 0 10px", padding: "0 14px", fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "1px" }}>
          {!sidebarMini && "Compte"}
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: navItems.length * 0.1 }}
          className={`nav-item ${location.pathname.endsWith("/profil") ? "active" : ""}`}
          data-label="Mon profil"
          onClick={() => navigate(getProfilPath())}
          style={{ borderRadius: 14, padding: '12px 14px' }}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label" style={{ fontWeight: 600 }}>Mon profil</span>
        </motion.div>
      </nav>

      {/* Footer user */}
      <div className="sidebar-footer" style={{ borderTop: 'none', padding: '20px' }}>
        <div className="user-chip" style={{
          background: 'var(--bg)',
          borderRadius: 20,
          padding: '10px',
          border: '1px solid var(--border)'
        }}>
          <div className="user-avatar" style={{
            boxShadow: '0 0 0 4px var(--surface)',
            width: 38,
            height: 38
          }}>
            {initials}
          </div>
          {!sidebarMini && (
            <div className="user-info">
              <div className="user-name" style={{ fontSize: 13 }}>
                {user?.prenom} {user?.nom}
              </div>
              <div className="user-role" style={{ fontSize: 10 }}>{getRoleLabel(user?.role)}</div>
            </div>
          )}
          <button
            className="btn-logout"
            onClick={handleLogout}
            title="Déconnexion"
            style={{ padding: '8px', borderRadius: '50%' }}
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
