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
   * Helper to extract clean, human-readable error message from backend response/exception
   */
  extractMessage: (error, defaultMessage = 'An unexpected error occurred. Please try again.') => {
    if (!error) return defaultMessage;
    if (typeof error === 'string') return error;
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        return detail.map((d) => d.msg || d.message || JSON.stringify(d)).join('. ');
      }
      if (typeof detail === 'object' && detail.message) return detail.message;
    }
    if (error.response?.data?.message) return error.response.data.message;
    if (error.message && error.message !== '[object Object]') return error.message;
    return defaultMessage;
  },

  /**
   * Error Alert Modal with smart message extraction
   */
  error: (title, text = '', options = {}) => {
    let cleanText = text;
    if (text && typeof text === 'object') {
      cleanText = text.response?.data?.detail || text.message || JSON.stringify(text);
    }
    return esignivaSwal.fire({
      icon: 'error',
      title: title || 'Something Went Wrong',
      text: cleanText || 'We encountered an error processing your request. Please try again.',
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
