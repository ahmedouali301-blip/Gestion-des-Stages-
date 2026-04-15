import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { resetPassword } from "../../api/authAPI";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) =>
        setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");
        try {
            await resetPassword({ token, newPassword: passwords.newPassword });
            setMessage("Votre mot de passe a été réinitialisé avec succès. Redirection...");
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Une erreur est survenue lors de la réinitialisation.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-glow glow-1"></div>
            <div className="login-bg-glow glow-2"></div>

            <div className="login-container" style={{ gridTemplateColumns: "1fr" }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="login-card-wrapper"
                    style={{ justifyContent: "center" }}
                >
                    <div className="login-card">
                        <div className="login-logo-wrapper" style={{ justifyContent: "center", marginBottom: "24px" }}>
                            <img src="/logo_clinisys_seullement.PNG" alt="Logo" className="login-main-logo" style={{ height: "45px" }} />
                            <div className="login-brand-text" style={{ fontSize: "20px" }}>
                                <span className="brand-clini">CLINI</span><span className="brand-sys">SYS</span>
                            </div>
                        </div>

                        <div className="login-card-header" style={{ textAlign: "center" }}>
                            <h3>Nouveau mot de passe</h3>
                            <p>Veuillez choisir un mot de passe sécurisé pour votre compte.</p>
                        </div>

                        {!token ? (
                            <div className="login-error">
                                <AlertCircle size={18} />
                                <span>Lien de réinitialisation invalide ou expiré.</span>
                            </div>
                        ) : (
                            <>
                                <AnimatePresence mode="wait">
                                    {message && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="login-success"
                                            style={{
                                                background: "rgba(22, 163, 74, 0.1)",
                                                color: "#4ade80",
                                                padding: "16px",
                                                borderRadius: "12px",
                                                marginBottom: "24px",
                                                fontSize: "13px",
                                                display: "flex",
                                                gap: "12px",
                                                border: "1px solid rgba(22, 163, 74, 0.2)"
                                            }}
                                        >
                                            <CheckCircle2 size={18} />
                                            <span>{message}</span>
                                        </motion.div>
                                    )}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="login-error"
                                        >
                                            <AlertCircle size={18} />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSubmit} className="login-form">
                                    <div className="input-group">
                                        <label>Nouveau mot de passe</label>
                                        <div className="input-wrapper">
                                            <Lock className="input-icon" size={20} />
                                            <input
                                                name="newPassword"
                                                type="password"
                                                placeholder="••••••••"
                                                value={passwords.newPassword}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label>Confirmer le mot de passe</label>
                                        <div className="input-wrapper">
                                            <Lock className="input-icon" size={20} />
                                            <input
                                                name="confirmPassword"
                                                type="password"
                                                placeholder="••••••••"
                                                value={passwords.confirmPassword}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" className="login-submit-btn" disabled={loading}>
                                        {loading ? (
                                            <div className="loading-spinner"></div>
                                        ) : (
                                            <span>Réinitialiser</span>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}

                        <div className="login-help">
                            <Link to="/login" className="flex-center" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "rgba(255,255,255,0.6)" }}>
                                <ArrowLeft size={16} />
                                <span>Retour à la connexion</span>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ResetPassword;
