// src/services/notifications/toastService.ts
// ✅ Servicio dedicado para mostrar notificaciones de UI efímeras (toasts).
// Centraliza la configuración y estilos de react-hot-toast para toda la aplicación.

import toast from 'react-hot-toast';

// Define los tipos de toasts que tu UI manejará
type ToastType = 'success' | 'error' | 'info' | 'warning';

// Opciones base para todos los toasts para mantener la consistencia visual.
// Ajusta estos colores para que coincidan con tu paleta de tema oscuro.
const baseToastOptions = {
  duration: 4000,
  style: {
    background: '#1a202c', // Un color oscuro de tu paleta (ej. app-dark-900)
    color: '#e2e8f0',      // Un color de texto claro (ej. app-gray-200)
    border: '1px solid #4a5568', // Un borde sutil (ej. app-dark-600)
  },
};

/**
 * Muestra un toast de éxito.
 * @param message El mensaje a mostrar.
 */
export const toastSuccess = (message: string) => {
  toast.success(message, baseToastOptions);
};

/**
 * Muestra un toast de error.
 * @param message El mensaje a mostrar.
 */
export const toastError = (message: string) => {
  toast.error(message, baseToastOptions);
};

/**
 * Muestra un toast de información.
 * @param message El mensaje a mostrar.
 */
export const toastInfo = (message: string) => {
  toast(message, {
    ...baseToastOptions,
    icon: 'ℹ️',
  });
};

/**
 * Muestra un toast de advertencia.
 * @param message El mensaje a mostrar.
 */
export const toastWarning = (message: string) => {
  toast(message, {
    ...baseToastOptions,
    icon: '⚠️',
  });
};

/**
 * Un objeto que agrupa todos los métodos del servicio para una importación más limpia si se prefiere.
 */
export const toastService = {
  success: toastSuccess,
  error: toastError,
  info: toastInfo,
  warning: toastWarning,
};