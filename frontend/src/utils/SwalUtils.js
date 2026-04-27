import Swal from 'sweetalert2';
import './SwalElite.css';

/**
 * Clinisys Elite - Custom Notification System
 * A high-end replacement for standard browser alerts.
 */
const ClinisysAlert = {
    /**
     * Show a generic message modal
     */
    show: ({ title, text, icon = 'info', confirmButtonText = 'OK' }) => {
        return Swal.fire({
            title,
            text,
            icon,
            confirmButtonText,
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                htmlContainer: 'premium-swal-text',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel',
                icon: 'premium-swal-icon'
            },
            buttonsStyling: false,
            showClass: {
                popup: 'animate__animated animate__fadeInDown animate__faster'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp animate__faster'
            }
        });
    },

    /**
     * Show a success notification
     */
    success: (title, text = '') => {
        return Swal.fire({
            title,
            text,
            icon: 'success',
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
            customClass: {
                popup: 'premium-swal-toast success',
            }
        });
    },

    /**
     * Show an error notification
     */
    error: (title, text = 'Une erreur est survenue.') => {
        return Swal.fire({
            title,
            text,
            icon: 'error',
            confirmButtonText: 'Fermer',
            customClass: {
                popup: 'premium-swal-popup danger',
                confirmButton: 'premium-swal-confirm danger',
            },
            buttonsStyling: false
        });
    },

    /**
     * Show a confirmation dialog
     */
    confirm: ({ title, text, icon = 'warning', confirmText = 'Confirmer', cancelText = 'Annuler', danger = false }) => {
        return Swal.fire({
            title,
            text,
            icon,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            reverseButtons: true,
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                htmlContainer: 'premium-swal-text',
                confirmButton: `premium-swal-confirm ${danger ? 'danger' : ''}`,
                cancelButton: 'premium-swal-cancel',
            },
            buttonsStyling: false
        });
    }
};

export default ClinisysAlert;
