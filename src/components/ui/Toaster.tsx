// src/components/ui/Toaster.tsx
// Componente contenedor para el sistema de notificaciones de react-hot-toast.
// Debe ser renderizado una sola vez en el nivel más alto de la aplicación (App.tsx).

import { Toaster as HotToaster } from 'react-hot-toast';

export const Toaster = () => {
  return (
    <HotToaster
      position="top-right"
      gutter={8}
      // Opciones por defecto para todos los toasts.
      // Podemos sobreescribir esto desde nuestro toastService si es necesario.
      toastOptions={{
        duration: 5000,
        style: {
          background: '#1a202c', // Un color oscuro de tu paleta
          color: '#e2e8f0',      // Un color de texto claro
        },
      }}
    />
  );
}; 
