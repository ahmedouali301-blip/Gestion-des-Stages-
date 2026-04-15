import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ConfirmModal.css';

/**
 * A professional, animated confirmation modal.
 * @param {boolean} isOpen - Whether the modal is visible.
 * @param {function} onClose - Function to call when canceling.
 * @param {function} onConfirm - Function to call when confirming.
 * @param {string} title - Modal title.
 * @param {string} message - Modal body text.
 * @param {string} confirmText - Label for the confirm button.
 * @param {string} cancelText - Label for the cancel button.
 * @param {string} type - 'primary' | 'danger' | 'success' | 'warning'
 * @param {boolean} loading - If true, show a spinner on the confirm button.
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmation",
  message = "Êtes-vous sûr de vouloir effectuer cette action ?",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "primary",
  loading = false,
  showCancel = true
}) => {
  
  // Prevent closing when clicking inside the modal
  const handleContentClick = (e) => e.stopPropagation();

  const getTypeStyles = () => {
    switch (type) {
      case 'danger': return { icon: '⚠', color: 'var(--danger)', bg: 'var(--danger-lt)' };
      case 'success': return { icon: '✅', color: 'var(--success)', bg: 'var(--success-lt)' };
      case 'warning': return { icon: '⚡', color: 'var(--warning)', bg: 'var(--warning-lt)' };
      default: return { icon: '❓', color: 'var(--primary)', bg: 'var(--primary-lt)' };
    }
  };

  const style = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="confirm-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="confirm-modal-card"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={handleContentClick}
          >
            <div className="confirm-modal-header">
              <div className="confirm-modal-icon" style={{ background: style.bg, color: style.color }}>
                {style.icon}
              </div>
              <h3>{title}</h3>
            </div>
            
            <div className="confirm-modal-body">
              <p>{message}</p>
            </div>
            
            <div className="confirm-modal-footer">
              {showCancel && (
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={onClose}
                  disabled={loading}
                >
                  {cancelText}
                </button>
              )}
              <button 
                type="button" 
                className={`btn btn-${type === 'warning' ? 'primary' : type}`} 
                onClick={onConfirm}
                disabled={loading}
                style={type === 'warning' ? { background: 'var(--warning)', color: '#fff' } : {}}
              >
                {loading ? (
                  <span className="spinner-small"></span>
                ) : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
