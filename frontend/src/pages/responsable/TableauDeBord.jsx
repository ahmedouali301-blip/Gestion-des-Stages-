import React, { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar";
import Topbar from "../../components/common/Topbar";
import { useTheme } from "../../context/ThemeContext";
import {
  getDashboardComplet,
  exporterRapportGlobal,
  exporterRapportStagiaire,
  telechargerPdf,
} from "../../api/dashboardAPI";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, PieChart, TrendingUp, Users,
  UserCheck, Calendar, Star, FileText, Download,
  Award, RefreshCw, ChevronUp, Clock, Info,
  LayoutDashboard, ClipboardList, GraduationCap, BarChart as BarChartIcon
} from "lucide-react";
import { useSession } from "../../context/SessionContext";

const NAV = [
  { path: "/responsable/dashboard", icon: <LayoutDashboard size={18} />, label: "Tableau de bord" },
  { path: "/responsable/stages", icon: <ClipboardList size={18} />, label: "Stages" },
  { path: "/responsable/sujets", icon: <FileText size={18} />, label: "Sujets" },
  { path: "/responsable/stagiaires", icon: <GraduationCap size={18} />, label: "Stagiaires" },
  { path: "/responsable/analytique", icon: <BarChartIcon size={18} />, label: "Analytique" },
];

// ── Composant KPI Card Elite ────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="kpi-card-elite"
    >
      <div className="kpi-icon-wrapper" style={{ '--kpi-color': color }}>
        <Icon size={24} className="kpi-icon-svg" />
      </div>
      <div className="kpi-content">
        <label className="kpi-label">{label}</label>
        <div className="kpi-value-row">
          <span className="kpi-value">{value ?? "—"}</span>
          {sub && <span className="kpi-sub">{sub}</span>}
        </div>
      </div>
    </motion.div>
  );
}

// ── Composant Donut Chart Elite ─────────────────────────────────
function DonutChart({ data, title }) {
  if (!data || Object.keys(data).length === 0) return null;

  const COLORS = {
    EN_COURS: "#6366f1", // Indigo
    VALIDE: "#10b981",    // Emerald
    INTERROMPU: "#ef4444", // Rose
    EN_ATTENTE: "#f59e0b", // Amber
    PFE: "#6366f1",
    PFA: "#8b5cf6",       // Violet
    STAGE_ETE: "#facc15",  // Yellow
  };
  const LABELS = {
    EN_COURS: "En cours",
    VALIDE: "Validé",
    INTERROMPU: "Interrompu",
    EN_ATTENTE: "En attente",
    PFE: "PFE",
    PFA: "PFA",
    STAGE_ETE: "Stage été",
  };

  const total = Object.values(data).reduce((a, b) => a + Number(b), 0);
  if (total === 0) return null;

  const r = 54, stroke = 12, size = 160;
  const circumference = 2 * Math.PI * r;
  let cumul = 0;

  const segments = Object.entries(data).map(([k, v]) => {
    const pct = (Number(v) / total) * 100;
    const seg = { key: k, value: Number(v), pct, start: cumul, color: COLORS[k] || "#64748b" };
    cumul += pct;
    return seg;
  });

  return (
    <div className="chart-box-elite">
      <h3 className="chart-title"><PieChart size={18} /> {title}</h3>
      <div className="chart-container">
        <div className="svg-wrapper">
          <svg viewBox="0 0 160 160" width={size} height={size}>
            <circle cx="80" cy="80" r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} opacity="0.1" />
            {segments.map((s) => (
              <motion.circle
                key={s.key}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${(s.pct / 100) * circumference} ${circumference}` }}
                transition={{ duration: 1, ease: "easeOut" }}
                cx="80" cy="80" r={r} fill="none" stroke={s.color}
                strokeWidth={stroke} strokeDashoffset={-((s.start / 100) * circumference)}
                transform="rotate(-90 80 80)"
                strokeLinecap="round"
              />
            ))}
            <text x="80" y="75" textAnchor="middle" className="chart-total-val">{total}</text>
            <text x="80" y="95" textAnchor="middle" className="chart-total-lbl">TOTAL</text>
          </svg>
        </div>
        <div className="chart-legend">
          {segments.map((s) => (
            <div key={s.key} className="legend-item">
              <div className="dot" style={{ background: s.color }} />
              <span className="label text-truncate">{LABELS[s.key] || s.key}</span>
              <span className="val">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Composant Bar Chart Elite ───────────────────────────────────────
function BarChart({ data, title }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value || 0), 1);

  return (
    <div className="chart-box-elite">
      <h3 className="chart-title"><BarChart2 size={18} /> {title}</h3>
      <div className="bar-list">
        {data.map((d, i) => (
          <div key={i} className="bar-row">
            <div className="bar-info">
              <span className="bar-label text-truncate">{d.label}</span>
              <span className="bar-val">{d.value} missions</span>
            </div>
            <div className="bar-track">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(d.value / max) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.05 }}
                className="bar-fill"
                style={{ background: d.color || 'var(--primary)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TableauDeBord() {
  const { sidebarMini } = useTheme();
  const { activeSession } = useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingId, setExportingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, [activeSession]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getDashboardComplet(activeSession);
      setStats(data);
    } catch {
      setError("Synchronisation analytique échouée.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportGlobal = async () => {
    setExporting(true);
    try {
      const { data } = await exporterRapportGlobal();
      telechargerPdf(data, "EXCELLENCE_REPORT_CLINISYS.pdf");
    } catch {
      alert("Erreur lors de la génération du rapport.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportStagiaire = async (stagiaireId, nom) => {
    setExportingId(stagiaireId);
    try {
      const { data } = await exporterRapportStagiaire(stagiaireId);
      telechargerPdf(data, `PROFILE_REPORT_${nom.toUpperCase()}.pdf`);
    } catch {
      alert("Erreur export PDF.");
    } finally {
      setExportingId(null);
    }
  };

  if (loading) return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      <main className="main-content flex-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="loading-state-elite"
        >
          <RefreshCw size={48} className="spin text-primary" />
          <p>Intelligence en cours...</p>
        </motion.div>
      </main>
    </div>
  );

  return (
    <div className={`app-layout ${sidebarMini ? "sidebar-mini" : ""}`}>
      <Sidebar navItems={NAV} />
      <Topbar />
      <main className="main-content fade-in">

        {/* HEADER ELITE */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-analytics-header"
        >
          <div className="header-meta">
            <span className="badge-elite blue">PROMOTION {activeSession}</span>
            <h1 className="gradient-text">Excellence Analytics</h1>
            <p>Intelligence opérationnelle et tracking de performance des stages Clinisys.</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary elite-btn" onClick={handleExportGlobal} disabled={exporting}>
              {exporting ? <RefreshCw className="spin" /> : <Download size={20} />}
              <span>Générer Rapport Global</span>
            </button>
          </div>
        </motion.div>

        {error && <div className="alert-elite danger"><Info size={18} /> {error}</div>}

        {stats && (
          <div className="analytics-body">

            {/* KPI TRACKING GRID */}
            <div className="stats-grid-elite">
              <KpiCard icon={Users} label="Total Stagiaires" value={stats.nbStagiaires} color="#6366f1" delay={0.1} />
              <KpiCard icon={UserCheck} label="Stages Validés" value={stats.nbStagesValides} sub={`${stats.tauxReussitePromotion?.toFixed(0)}% de réussite`} color="#10b981" delay={0.2} />
              <KpiCard icon={Clock} label="Actions en cours" value={stats.nbStagesEnCours} color="#f59e0b" delay={0.3} />
              <KpiCard icon={Star} label="Indice de satisfaction" value={stats.moyenneEvaluations ? `${Number(stats.moyenneEvaluations).toFixed(1)}/20` : "—"} color="#8b5cf6" delay={0.4} />
            </div>

            {/* PROGRESS OVERVIEW */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="premium-card progress-hero"
            >
              <div className="hero-content">
                <div className="hero-text">
                  <h3>Avancement de la Promotion</h3>
                  <p>Calculé sur la base des livrables et sprints validés.</p>
                </div>
                <div className="hero-val">{stats.tauxAvancementGlobal?.toFixed(1)}%</div>
              </div>
              <div className="elite-progress-track">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.tauxAvancementGlobal || 0}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="elite-progress-fill"
                />
              </div>
            </motion.div>

            {/* DATA VISUALIZATION */}
            <div className="grid-2-elite">
              <DonutChart data={stats.repartitionStatutStages} title="États de Progression" />
              <DonutChart data={stats.repartitionTypeStages} title="Mix de Candidature" />
            </div>

            <div className="grid-analytics-main">
              {/* BAR CHART: LOAD */}
              <div className="left-panel-analytics">
                {stats.chargeEncadrants?.length > 0 && (
                  <BarChart
                    title="Charge de Tutorat par Encadrant"
                    data={stats.chargeEncadrants.map(e => ({
                      label: `${e.encadrantPrenom} ${e.encadrantNom}`,
                      value: Number(e.nbStagiaires),
                      color: 'var(--primary)'
                    }))}
                  />
                )}
              </div>

              {/* EXCELLENCE WALL */}
              <div className="right-panel-analytics">
                <div className="premium-card excellence-card">
                  <div className="card-header-v2">
                    <h3 className="excellence-title"><Award size={20} /> Hall of Excellence</h3>
                    <span className="subtitle">Top 5 de la promotion</span>
                  </div>

                  <div className="excellence-list">
                    {stats.topStagiaires?.map((s, i) => {
                      const note = s.moyenne || 0;
                      const MEDALS = ["🥇", "🥈", "🥉", "🎖️", "🎖️"];
                      return (
                        <motion.div
                          key={s.stagiaireId}
                          whileHover={{ x: 8, background: 'var(--primary-light-alpha)' }}
                          className={`excellence-item ${i === 0 ? 'top-1' : ''}`}
                        >
                          <div className="rank-badge">{MEDALS[i]}</div>
                          <div className="profile-box">
                            <div className="avatar-mini">{s.stagiairePrenom[0]}{s.stagiaireNom[0]}</div>
                            <div className="names">
                              <span className="full-name">{s.stagiairePrenom} {s.stagiaireNom}</span>
                              <span className="mention">{note >= 16 ? 'Distingé' : 'Mention Bien'}</span>
                            </div>
                          </div>
                          <div className="metrics-box">
                            <div className="progress-mini">
                              <div className="track"><div className="fill" style={{ width: `${s.tauxAvancement}%` }} /></div>
                              <span>{s.tauxAvancement?.toFixed(0)}%</span>
                            </div>
                            <div className="final-note">
                              <span className="n">{note.toFixed(1)}</span>
                              <span className="total">/20</span>
                            </div>
                          </div>
                          <button
                            className="export-mini-btn"
                            title="Exporter Dossier"
                            onClick={() => handleExportStagiaire(s.stagiaireId, `${s.stagiairePrenom} ${s.stagiaireNom}`)}
                            disabled={exportingId === s.stagiaireId}
                          >
                            {exportingId === s.stagiaireId ? <RefreshCw spin size={14} /> : <FileText size={14} />}
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .premium-analytics-header {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-bottom: 40px; border-bottom: 2px solid var(--border); padding-bottom: 32px;
        }
        .badge-elite {
          padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 800;
          letter-spacing: 1px; margin-bottom: 12px; display: inline-block;
        }
        .badge-elite.blue { background: var(--primary-light-alpha); color: var(--primary); }
        
        .elite-btn {
          display: flex; align-items: center; gap: 12px; padding: 18px 36px;
          border-radius: 18px; font-weight: 900; box-shadow: 0 10px 30px -10px var(--primary);
        }

        .stats-grid-elite {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px; margin-bottom: 32px;
        }
        .kpi-card-elite {
          background: var(--surface); border: 1.5px solid var(--border); padding: 24px;
          border-radius: 24px; display: flex; align-items: center; gap: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .kpi-icon-svg {
          color: var(--kpi-color);
          transition: color 0.3s ease;
        }
        [data-theme="dark"] .kpi-icon-base {
           color: #000;
        }
        .kpi-card-elite:hover { transform: translateY(-8px); border-color: var(--primary); box-shadow: 0 20px 40px -15px rgba(0,0,0,0.1); }
        .kpi-icon-wrapper {
          width: 60px; height: 60px; border-radius: 18px; background: color-mix(in srgb, var(--kpi-color) 12%, transparent);
          display: flex; align-items: center; justify-content: center;
        }
        .kpi-label { font-size: 12px; font-weight: 800; color: var(--text-3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; display: block; }
        .kpi-value { font-size: 26px; font-weight: 900; color: var(--text); }
        .kpi-sub { font-size: 13px; color: var(--text-2); font-weight: 600; margin-left: 10px; opacity: 0.7; }

        .progress-hero {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #fff;
          padding: 40px; border-radius: 32px; margin-bottom: 40px; position: relative; overflow: hidden;
        }
        .progress-hero .hero-content { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .progress-hero h3 { font-size: 24px; font-weight: 900; margin-bottom: 8px; }
        .progress-hero p { opacity: 0.6; font-size: 15px; }
        .progress-hero .hero-val { font-size: 56px; font-weight: 900; font-family: 'Syne', sans-serif; background: linear-gradient(to bottom, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .elite-progress-track { height: 12px; background: rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; }
        .elite-progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6, #10b981); border-radius: 10px; }

        .chart-box-elite { background: var(--surface); border: 1.5px solid var(--border); padding: 32px; border-radius: 28px; }
        .chart-title { font-size: 18px; font-weight: 900; margin-bottom: 32px; display: flex; align-items: center; gap: 12px; color: var(--text); }
        .grid-2-elite { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }

        .chart-container { display: flex; align-items: center; gap: 40px; }
        .chart-total-val { font-size: 26px; font-weight: 900; fill: var(--text); font-family: 'Syne'; }
        .chart-total-lbl { font-size: 10px; font-weight: 800; fill: var(--text-3); letter-spacing: 2px; }
        .chart-legend { flex: 1; display: grid; grid-template-columns: 1fr; gap: 12px; }
        .legend-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--bg); border-radius: 12px; font-size: 13px; font-weight: 700; }
        .legend-item .dot { width: 10px; height: 10px; border-radius: 3px; }
        .legend-item .label { flex: 1; color: var(--text-2); }
        .legend-item .val { color: var(--text); padding-left: 10px; }

        .bar-list { display: flex; flex-direction: column; gap: 24px; }
        .bar-row { display: flex; flex-direction: column; gap: 12px; }
        .bar-info { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; }
        .bar-label { color: var(--text-2); }
        .bar-track { height: 10px; background: var(--border); border-radius: 10px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 10px; }

        .grid-analytics-main { display: grid; grid-template-columns: 1fr 480px; gap: 32px; margin-bottom: 60px; }
        
        .excellence-card { padding: 32px; border-radius: 32px; }
        .card-header-v2 { margin-bottom: 28px; }
        .excellence-title { font-size: 20px; font-weight: 900; display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
        .card-header-v2 .subtitle { font-size: 13px; color: var(--text-3); font-weight: 600; }
        
        .excellence-list { display: flex; flex-direction: column; gap: 12px; }
        .excellence-item {
          display: flex; align-items: center; gap: 20px; padding: 16px; border-radius: 20px;
          background: var(--bg); border: 1.5px solid transparent; transition: all 0.3s;
        }
        .excellence-item.top-1 { background: rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.2); }
        .rank-badge { font-size: 22px; width: 40px; text-align: center; }
        .profile-box { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
        .avatar-mini { width: 44px; height: 44px; border-radius: 14px; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; }
        .names { display: flex; flex-direction: column; min-width: 0; }
        .full-name { font-weight: 800; font-size: 15px; color: var(--text); }
        .mention { font-size: 12px; font-weight: 800; color: var(--primary); text-transform: uppercase; }
        
        .metrics-box { display: flex; align-items: center; gap: 24px; }
        .progress-mini { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 700; color: var(--text-3); }
        .progress-mini .track { width: 50px; height: 4px; background: var(--border); border-radius: 4px; }
        .progress-mini .fill { height: 100%; background: var(--accent); border-radius: 4px; }
        
        .final-note { text-align: right; min-width: 60px; }
        .final-note .n { font-size: 18px; font-weight: 900; color: var(--text); font-family: 'Syne'; }
        .final-note .total { font-size: 12px; color: var(--text-3); font-weight: 700; }
        
        .export-mini-btn {
          width: 36px; height: 36px; border-radius: 12px; border: none; background: var(--bg);
          color: var(--text-3); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .export-mini-btn:hover { background: var(--primary); color: #fff; transform: scale(1.1); }

        .flex-center { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
        .loading-state-elite { text-align: center; }
        .loading-state-elite p { margin-top: 16px; font-weight: 800; color: var(--text-3); letter-spacing: 1px; }
      ` }} />
    </div>
  );
}
