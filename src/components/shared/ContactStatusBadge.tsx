 // src/components/shared/ContactStatusBadge.tsx

import React from 'react';
import { cn } from '@/utils/cn'; // Asegúrate de que la ruta a cn.ts es correcta
import type { ContactStatus } from '@/types/contact.types';

// ============================================
// CONTACT STATUS BADGE (ÚNICA FUENTE DE VERDAD)
// ============================================

interface ContactStatusBadgeProps { 
  status: ContactStatus; 
  className?: string;
}

// Objeto de configuración fuera del componente para que no se recree en cada render
const statusConfig: Record<ContactStatus, { label: string; className: string }> = {
  ACTIVE: { 
    label: 'Activo', 
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
  },
  INACTIVE: { 
    label: 'Inactivo', 
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' 
  },
  PROSPECT: { 
    label: 'Prospecto', 
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' 
  },
  LEAD: { 
    label: 'Lead', 
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400' 
  },
  MEMBER: { 
    label: 'Miembro', 
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400' 
  },
  VISITOR: { 
    label: 'Visitante', 
    className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400' 
  },
  FORMER_MEMBER: { 
    label: 'Ex-miembro', 
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' 
  },
  DECEASED: { 
    label: 'Fallecido', 
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' 
  },
  MOVED: { 
    label: 'Se mudó', 
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' 
  },
  DO_NOT_CONTACT: { 
    label: 'No Contactar', 
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
  },
  BOUNCED: { 
    label: 'Rebotado', 
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' 
  },
  BLOCKED: { 
    label: 'Bloqueado', 
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
  },
  // Nota: Si 'DUPLICATE' y 'ARCHIVED' no están en tu tipo ContactStatus, elimínalos de aquí
  // o añádelos al tipo en contact.types.ts para mantener la consistencia.
};

export const ContactStatusBadge: React.FC<ContactStatusBadgeProps> = ({ status, className }) => {
  // Ahora esta línea es 100% segura y no dará error
  const config = statusConfig[status] || statusConfig.ACTIVE;

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
};

export default ContactStatusBadge;
