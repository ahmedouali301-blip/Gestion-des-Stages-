import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ChevronRight, ShieldCheck, Activity, Users, FileText, BarChart3, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { login } from "../../api/authAPI";
import { getDashboardPath } from "../../utils/roleHelpers";

const LoginPage = () => {
    const [form, setForm] = useState({ email: "", motDePasse: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const { data } = await login(form);
            loginUser(data, data.token);
            navigate(getDashboardPath(data.role));
        } catch (err) {
            setError(
                err.response?.data?.message || "Email ou mot de passe incorrect.",
            );
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: <Activity className="f-icon" />, text: "Suivi des sprints en temps réel" },
        { icon: <Users className="f-icon" />, text: "Évaluation multicritère" },
        { icon: <FileText className="f-icon" />, text: "Réunions et PV numérisés" },
        { icon: <BarChart3 className="f-icon" />, text: "Tableaux de bord analytiques" },
    ];

    return (
        <div className="login-page">
            {/* Background Decorative Elements */}
            <div className="login-bg-glow glow-1"></div>
            <div className="login-bg-glow glow-2"></div>

            <div className="login-container">
                {/* Left Side: Branding & Features */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="login-content-left"
                >
                    <div className="login-logo-wrapper">
                        <img src="/logo_clinisys_seullement.PNG" alt="Logo" className="login-main-logo" />
                        <div className="login-brand-text">
                            <span className="brand-clini">CLINI</span><span className="brand-sys">SYS</span>
                        </div>
                    </div>

                    <h2 className="login-hero-title">
                        L'excellence dans la gestion <br />
                        <span>des stages.</span>
                    </h2>

                    <p className="login-hero-desc">
                        Une plateforme intelligente pour synchroniser, évaluer et propulser
                        les talents de demain au sein de Clinisys.
                    </p>

                    <div className="login-features-list">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + idx * 0.1 }}
                                className="login-feature-item"
                            >
                                <div className="feature-icon-box">{feature.icon}</div>
                                <span>{feature.text}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="login-footer-info">
                        © 2026 Clinisys. Tous droits réservés.
                    </div>
                </motion.div>

                {/* Right Side: Login Form */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="login-card-wrapper"
                >
                    <div className="login-card">
                        <div className="login-card-header">
                            <h3>Content de vous revoir</h3>
                            <p>Veuillez entrer vos accès pour continuer.</p>
                        </div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="login-error"
                                >
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="input-group">
                                <label>Email Professionnel</label>
                                <div className="input-wrapper">
                                    <Mail className="input-icon" size={20} />
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="exemple@clinisys.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <div className="flex-between">
                                    <label>Mot de passe</label>

                                    <Link to="/forgot-password" size="small" className="forgot-pass">
                                        Oublié ?
                                    </Link>
                                </div>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" size={20} />
                                    <input
                                        name="motDePasse"
                                        type="password"
                                        placeholder="••••••••"
                                        value={form.motDePasse}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="login-submit-btn" disabled={loading}>
                                {loading ? (
                                    <div className="loading-spinner"></div>
                                ) : (
                                    <>
                                        <span>Se connecter</span>
                                        <ChevronRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="login-help">
                            <p>Besoin d'aide ? <Link to="/contact">Contactez l'administrateur</Link></p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
