import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "../../components/common/Sidebar";
import { getDashboardComplet, exporterRapportGlobal, telechargerPdf } from "../../api/dashboardAPI";
import Topbar from "../../components/common/Topbar";
import { useTheme } from "../../context/ThemeContext";
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  Briefcase, 
  Calendar, 
  Star, 
  Zap, 
  BarChart, 
  TrendingUp, 
  FileDown, 
  PieChart, 
  Activity,
  Award,
  BookOpen,
  ChevronRight,
  UserPlus,
  LayoutDashboard
} from 'lucide-react';

const NAV = [
  { path: "/admin/dashboard", icon: <LayoutDashboard size={18} />, label: "Tableau de bord" },
  { path: "/admin/utilisateurs", icon: <Users size={18} />, label: "Utilisateurs" },
];

function StatCard({ icon: Icon, label, value, color, delay, onClick, subtext, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
      className="premium-card"
      onClick={onClick}
      style={{ 
        cursor: onClick ? "pointer" : "default",
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ 
          width: 48, height: 48, 
          borderRadius: 14, 
          background: `${color}1A`, 
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 8px 16px ${color}10`
        }}>
          <Icon size={24} />
        </div>
        {trend && (
          <div style={{ color: trend > 0 ? 'var(--success)' : 'var(--danger)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, background: trend > 0 ? 'var(--success-lt)' : 'var(--danger-lt)', padding: '4px 8px', borderRadius: 8 }}>
            <TrendingUp size={12} style={{ transform: trend < 0 ? 'rotate(180deg)' : 'none' }} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>{value ?? "—"}</div>
        {subtext && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{subtext}</div>}
      </div>

      <div style={{ 
        position: 'absolute', 
        top: -20, 
        right: -20, 
        fontSize: 100, 
        opacity: 0.03, 
        color: color,
        pointerEvents: 'none'
      }}>
        <Icon size={120} />
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { sidebarMini } = useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    getDashboardComplet()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    try {
      const res = await exporterRapportGlobal();
      telechargerPdf(res.data, 'rapport_global_clinisys.pdf');
    } catch {
      alert('Erreur lors de l\'exportation');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      <main className="main-content fade-in" style={{ padding: '40px 48px' }}>
        {/* Elite Header section */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 2, background: 'var(--primary)' }} />
                Vue d'ensemble
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', margin: 0 }}>
                Tableau de <span className="gradient-text">Bord</span>
              </h1>
            </motion.div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleExport}
                className="btn btn-outline" 
                style={{ borderRadius: 14, padding: '12px 20px', gap: 10 }}
              >
                <FileDown size={18} /> Exporter Rapport
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02, boxShadow: '0 10px 30px var(--primary-lt)' }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/admin/utilisateurs")}
                className="btn btn-primary" 
                style={{ borderRadius: 14, padding: '12px 24px', gap: 10, boxShadow: 'var(--shadow-md)' }}
              >
                <UserPlus size={18} /> Nouvel Utilisateur
              </motion.button>
            </div>
          </div>
          <p style={{ color: 'var(--text-3)', fontSize: 16 }}>Bienvenue, {user.prenom || 'Administrateur'}. Voici les indicateurs de performance de votre plateforme.</p>
        </section>

        {/* Top metrics grid */}
        <motion.div 
          variants={containerVariants} initial="hidden" animate="visible"
          className="stats-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 32 }}
        >
          <StatCard
            icon={Users}
            label="Utilisateurs"
            value={loading ? "..." : stats?.nbUtilisateurs}
            color="#0ea5e9" delay={0.1}
            subtext={`${stats?.nbEncadrants || 0} encadrants actifs`}
            trend={12}
            onClick={() => navigate("/admin/utilisateurs")}
          />
          <StatCard
            icon={GraduationCap}
            label="Stagiaires"
            value={loading ? "..." : stats?.nbStagiaires}
            color="#10b981" delay={0.2}
            subtext={`${stats?.nbSujets || 0} sujets disponibles`}
            trend={8}
          />
          <StatCard
            icon={Briefcase}
            label="Projets en cours"
            value={loading ? "..." : stats?.nbStagesEnCours}
            color="#f59e0b" delay={0.3}
            subtext={`${stats?.nbStagesValides || 0} projets clôturés`}
            trend={5}
          />
          <StatCard
            icon={Star}
            label="Moyenne"
            value={loading ? "..." : (stats?.moyenneEvaluations?.toFixed(1) || "0.0")}
            color="#8b5cf6" delay={0.4}
            subtext="Performance académique"
            trend={2}
          />
        </motion.div>

        {/* Analytics Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32, marginBottom: 32 }}>
          {/* Main Analytics Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            className="premium-card" style={{ padding: 40 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Performances de la session</h3>
                <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Analyse comparative des avancements et de la réussite</p>
              </div>
              <Activity className="gradient-text" size={32} opacity={0.3} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ padding: '20px', borderRadius: 20, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>AVANCEMENT GLOBAL</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--primary)' }}>{Math.round(stats?.tauxAvancementGlobal || 0)}%</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: `${stats?.tauxAvancementGlobal || 0}%` }}
                      transition={{ duration: 1, delay: 0.8 }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))' }}
                    />
                  </div>
                </div>

                <div style={{ padding: '20px', borderRadius: 20, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>TAUX DE RÉUSSITE</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--success)' }}>{Math.round(stats?.tauxReussitePromotion || 0)}%</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: `${stats?.tauxReussitePromotion || 0}%` }}
                      transition={{ duration: 1, delay: 1 }}
                      style={{ height: '100%', background: 'var(--success)' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>REPARTITION STATUTS</div>
                  {stats?.repartitionStatutStages && Object.entries(stats.repartitionStatutStages).map(([key, val], idx) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: idx % 2 === 0 ? 'var(--primary)' : 'var(--accent)' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', flex: 1 }}>{key.replace('_',' ')}</span>
                      <span style={{ fontSize: 12, fontWeight: 800 }}>{val}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                   <div style={{ position: 'relative', width: 100, height: 100 }}>
                      <svg width="100" height="100" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="16" fill="none" stroke="var(--primary)" strokeWidth="3" 
                          strokeDasharray={`${stats?.tauxAvancementGlobal || 0}, 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900 }}>
                        {Math.round(stats?.tauxAvancementGlobal || 0)}%
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
            className="premium-card" style={{ padding: 40, background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)' }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Zap size={20} className="gradient-text" /> 
              Actions Rapides
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Gérer les Utilisateurs', icon: Users, path: '/admin/utilisateurs', color: 'var(--primary)' },
                { label: 'Audit Stagiaires', icon: Award, path: '/admin/utilisateurs', color: 'var(--success)' },
                { label: 'Mon profil', icon: UserCheck, path: '/admin/profil', color: 'var(--warning)' },
              ].map((item, i) => (
                <motion.button
                  key={i} whileHover={{ x: 6, background: 'var(--surface)' }}
                  onClick={() => navigate(item.path)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', 
                    borderRadius: 16, background: 'transparent', border: '1px solid var(--border)',
                    textAlign: 'left', width: '100%', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.color}1A`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <item.icon size={20} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-2)', flex: 1 }}>{item.label}</span>
                  <ChevronRight size={18} color="var(--text-3)" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Section: Leaderboard & Load */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Top Stagiaires */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="premium-card" style={{ padding: 0, overflow: 'hidden' }}
          >
            <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 900 }}>Top Performers</h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-lt)', padding: '4px 12px', borderRadius: 20 }}>Top 5</span>
            </div>
            <div style={{ padding: '24px 40px' }}>
              {loading ? (
                 <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Analyse en cours...</div>
              ) : stats?.topStagiaires?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {stats.topStagiaires.map((s, idx) => (
                    <div key={s.stagiaireId} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{s.stagiairePrenom[0]}{s.stagiaireNom[0]}</span>
                        {idx === 0 && <Award size={14} style={{ position: 'absolute', top: -6, right: -6, color: '#fbbf24' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{s.stagiairePrenom} {s.stagiaireNom}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.nbTachesTerminees} tâches effectuées</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: 16 }}>{s.moyenne.toFixed(1)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase' }}>SCORE</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Pas encore de données.</div>}
            </div>
          </motion.div>

          {/* Encadrant Load */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="premium-card" style={{ padding: 0, overflow: 'hidden' }}
          >
            <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 900 }}>Charge d'Encadrement</h3>
              <BarChart size={18} color="var(--text-3)" />
            </div>
            <div style={{ padding: '24px 40px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {stats?.chargeEncadrants?.slice(0, 4).map(e => (
                    <div key={e.encadrantId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{e.encadrantPrenom} {e.encadrantNom}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{e.nbStagiaires} stagiaires</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'var(--bg)', borderRadius: 10, overflow: 'hidden' }}>
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${(e.nbStagiaires / 10) * 100}%` }}
                          style={{ height: '100%', background: e.nbStagiaires > 7 ? 'var(--danger)' : 'var(--primary)', borderRadius: 10 }}
                        />
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
