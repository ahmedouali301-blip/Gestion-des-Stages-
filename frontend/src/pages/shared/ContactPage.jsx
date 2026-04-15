import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Mail, Phone, MapPin, 
  ShieldCheck, CheckCircle2, Headphones,
  Send, Globe, MessageSquare, Zap
} from "lucide-react";

const ContactPage = () => {
  return (
    <div className="login-page">
      <div className="login-bg-glow glow-1"></div>
      <div className="login-bg-glow glow-2"></div>
      <div className="login-bg-glow glow-3"></div>

      <div className="login-container" style={{ gridTemplateColumns: "1fr" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="login-card-wrapper"
          style={{ justifyContent: "center" }}
        >
          <div className="login-card elite-support-card">
            <div className="login-logo-wrapper" style={{ justifyContent: "center", marginBottom: "40px" }}>
              <img src="/logo_clinisys_seullement.PNG" alt="Logo" className="login-main-logo" style={{ height: "50px" }} />
              <div className="login-brand-text elite">
                <span className="brand-clini">CLINI</span><span className="brand-sys">SYS</span>
              </div>
            </div>

            <div className="support-hero">
               <div className="support-badge"><Zap size={14} /> ELITE SERVICE DESK</div>
               <h3>Besoin d'expertise ?</h3>
               <p>Notre équipe d'ingénierie et d'administration est mobilisée pour assurer la continuité de votre expérience.</p>
            </div>

            <div className="elite-channel-grid">
               <motion.div whileHover={{ y: -5 }} className="channel-tile">
                  <div className="c-icon mail"><Mail size={22} /></div>
                  <div className="c-info">
                     <label>LIGNES DIRECTES EMAIL</label>
                     <p>ahmedouali301@gmail.com</p>
                     <p>marouenweli8@gmail.com</p>
                  </div>
               </motion.div>

               <motion.div whileHover={{ y: -5 }} className="channel-tile">
                  <div className="c-icon phone"><Phone size={22} /></div>
                  <div className="c-info">
                     <label>SUPPORT OPÉRATIONNEL</label>
                     <p>+216 74 123 456</p>
                     <span>Standard Clinisys Digital</span>
                  </div>
               </motion.div>

               <motion.div whileHover={{ y: -5 }} className="channel-tile">
                  <div className="c-icon map"><MapPin size={22} /></div>
                  <div className="c-info">
                     <label>SIÈGE SOCIAL</label>
                     <p>Technopark El Ghazala, Sfax</p>
                     <span>Tunisie, Zone Industrielle</span>
                  </div>
               </motion.div>
            </div>

            <div className="availability-guarantee">
               <div className="g-left">
                  <CheckCircle2 size={20} />
                  <div className="g-text">
                     <strong>Support 24/7 Actif</strong>
                     <p>Intervention prioritaire garantie pour les incidents critiques.</p>
                  </div>
               </div>
               <div className="live-status-pulse"></div>
            </div>

            <div className="support-footer-action">
              <Link to="/login" className="back-link-elite">
                <ArrowLeft size={18} />
                <span>Retour au Portail de Connexion</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .elite-support-card { max-width: 600px !important; padding: 48px !important; }
        .login-brand-text.elite { transform: translateY(4px); }
        
        .support-hero { text-align: center; margin-bottom: 48px; }
        .support-badge { 
          display: inline-flex; align-items: center; gap: 8px; 
          background: rgba(0,184,160,0.1); color: var(--accent); 
          padding: 6px 16px; border-radius: 20px; font-size: 11px; 
          font-weight: 900; letter-spacing: 2px; margin-bottom: 20px; 
        }
        .support-hero h3 { font-size: 28px; font-weight: 900; color: #fff; margin-bottom: 12px; }
        .support-hero p { color: rgba(255,255,255,0.5); font-size: 15px; line-height: 1.6; max-width: 440px; margin: 0 auto; }

        .elite-channel-grid { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }
        .channel-tile { 
          background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.05); 
          padding: 24px; border-radius: 20px; display: flex; gap: 24px; align-items: center;
          transition: 0.3s; cursor: default;
        }
        .channel-tile:hover { background: rgba(255,255,255,0.05); border-color: var(--accent-light); }
        .c-icon { 
          width: 54px; height: 54px; border-radius: 16px; background: rgba(255,255,255,0.03); 
          display: flex; align-items: center; justify-content: center; color: var(--accent); 
        }
        .c-icon.mail { color: #818cf8; }
        .c-icon.phone { color: #4ade80; }
        .c-icon.map { color: #fbbf24; }
        
        .c-info label { display: block; font-size: 10px; font-weight: 900; color: rgba(255,255,255,0.3); letter-spacing: 1.5px; margin-bottom: 4px; }
        .c-info p { font-size: 15px; font-weight: 700; color: #fff; line-height: 1.4; }
        .c-info span { font-size: 13px; color: rgba(255,255,255,0.4); font-weight: 500; }

        .availability-guarantee { 
          background: rgba(74,222,128,0.03); border: 1.5px solid rgba(74,222,128,0.1); 
          border-radius: 16px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;
        }
        .g-left { display: flex; gap: 16px; align-items: center; color: #4ade80; }
        .g-text strong { display: block; font-size: 14px; font-weight: 900; }
        .g-text p { font-size: 12px; opacity: 0.7; margin-top: 2px; }
        
        .live-status-pulse { 
          width: 10px; height: 10px; background: #4ade80; border-radius: 50%; 
          box-shadow: 0 0 0 rgba(74,222,128,0.4); animation: pulseGreen 2s infinite; 
        }
        @keyframes pulseGreen { 
          0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.7); } 
          70% { box-shadow: 0 0 0 10px rgba(74,222,128,0); } 
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); } 
        }

        .support-footer-action { margin-top: 48px; text-align: center; }
        .back-link-elite { 
          display: inline-flex; align-items: center; gap: 12px; color: rgba(255,255,255,0.4); 
          font-weight: 800; font-size: 14px; transition: 0.2s; 
        }
        .back-link-elite:hover { color: #fff; transform: translateX(-4px); }
        
        .glow-3 { top: 70%; left: 50%; background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%); }
      ` }} />
    </div>
  );
};

export default ContactPage;
