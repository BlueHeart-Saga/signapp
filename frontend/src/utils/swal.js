import Swal from 'sweetalert2';

/**
 * Custom Esigniva SweetAlert2 Theme Helper
 * Provides consistent, high-end, beautiful UI alerts & toasts across the entire app.
 */

const esignivaSwal = Swal.mixin({
  customClass: {
    popup: 'esigniva-swal-popup',
    title: 'esigniva-swal-title',
    htmlContainer: 'esigniva-swal-html',
    confirmButton: 'esigniva-swal-confirm-btn',
    cancelButton: 'esigniva-swal-cancel-btn',
    denyButton: 'esigniva-swal-deny-btn',
    icon: 'esigniva-swal-icon',
  },
  buttonsStyling: false,
  background: '#ffffff',
  color: '#0f172a',
});

// Toast notification instance for top-right auto-dismiss alerts
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  customClass: {
    popup: 'esigniva-toast-popup',
    title: 'esigniva-toast-title',
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export const showAlert = {
  /**
   * Success Alert Modal
   */
  success: (title, text = '', options = {}) => {
    return esignivaSwal.fire({
      icon: 'success',
      title: title || 'Success!',
      text: text,
      confirmButtonText: options.confirmButtonText || 'Awesome',
      ...options,
    });
  },

  /**
   * Error Alert Modal
   */
  error: (title, text = '', options = {}) => {
    return esignivaSwal.fire({
      icon: 'error',
      title: title || 'Oops... Something went wrong!',
      text: typeof text === 'object' ? JSON.stringify(text) : text,
      confirmButtonText: options.confirmButtonText || 'Got it',
      ...options,
    });
  },

  /**
   * Warning Alert Modal
   */
  warning: (title, text = '', options = {}) => {
    return esignivaSwal.fire({
      icon: 'warning',
      title: title || 'Attention Needed',
      text: text,
      confirmButtonText: options.confirmButtonText || 'Understand',
      ...options,
    });
  },

  /**
   * Info Alert Modal
   */
  info: (title, text = '', options = {}) => {
    return esignivaSwal.fire({
      icon: 'info',
      title: title || 'Notice',
      text: text,
      confirmButtonText: options.confirmButtonText || 'OK',
      ...options,
    });
  },

  /**
   * Confirmation Dialog Modal (e.g., Delete document, Void envelope)
   */
  confirm: (title, text = '', confirmButtonText = 'Yes, Proceed', cancelButtonText = 'Cancel') => {
    return esignivaSwal.fire({
      icon: 'question',
      title: title,
      text: text,
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      reverseButtons: true,
    });
  },

  /**
   * Quick Toast Alert (Non-blocking notification)
   */
  toast: (icon = 'success', title = '') => {
    return Toast.fire({
      icon,
      title,
    });
  }
};

export default showAlert;
