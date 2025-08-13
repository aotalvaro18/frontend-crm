// src/components/shared/ContactStatusBadge.tsx
// ContactStatusBadge siguiendo tu guía arquitectónica
// Usa exactamente tus constants y Badge component

import React from 'react';
import { StatusBadge } from '@/components/ui/Badge';
import { 
  CONTACT_STATUS, 
  CONTACT_STATUS_LABELS   
} from '@/utils/constants';
import type { ContactStatus } from '@/utils/constants';

// ============================================
// TYPES (Usando tus constants exactos)
// ============================================

interface ContactStatusBadgeProps {
  status: ContactStatus;
  showIcon?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

// ============================================
// STATUS CONFIGURATION
// ============================================

const statusConfig = {
  [CONTACT_STATUS.ACTIVE]: {
    variant: 'active' as const,
    icon: '✓',
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.ACTIVE],
    description: 'Contacto activo en el sistema'
  },
  [CONTACT_STATUS.INACTIVE]: {
    variant: 'inactive' as const,
    icon: '○',
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.INACTIVE],
    description: 'Contacto inactivo temporalmente'
  },
  [CONTACT_STATUS.DO_NOT_CONTACT]: {
    variant: 'do_not_contact' as const,
    icon: '🚫',
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.DO_NOT_CONTACT],
    description: 'No contactar bajo ninguna circunstancia'
  },
  [CONTACT_STATUS.DUPLICATE]: {
    variant: 'duplicate' as const,
    icon: '⚠️',
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.DUPLICATE],
    description: 'Contacto duplicado, requiere fusión'
  },
  [CONTACT_STATUS.ARCHIVED]: {
    variant: 'archived' as const,
    icon: '📁',
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.ARCHIVED],
    description: 'Contacto archivado'
  },
  [CONTACT_STATUS.PROSPECT]: {
    variant: 'prospect' as const,
    icon: '👤',
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.PROSPECT],
    description: 'Contacto potencial, sin calificar'
  },
  [CONTACT_STATUS.LEAD]: {
    variant: 'lead' as const,
    icon: '✨',
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.LEAD],
    description: 'Prospecto calificado, listo para seguimiento'
  },
  [CONTACT_STATUS.MEMBER]: {
    variant: 'member' as const,
    icon: '⭐', // O el que prefieras
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.MEMBER],
    description: 'Contacto es un miembro activo'
  },
  [CONTACT_STATUS.VISITOR]: {
    variant: 'visitor' as const,
    icon: '👋',
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.VISITOR],
    description: 'Contacto que ha visitado la organización'
  },
  [CONTACT_STATUS.FORMER_MEMBER]: {
    variant: 'former_member' as const,
    icon: '🚶',
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.FORMER_MEMBER],
    description: 'El contacto fue miembro anteriormente'
  },
  [CONTACT_STATUS.DECEASED]: {
    variant: 'deceased' as const,
    icon: '🖤',
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.DECEASED],
    description: 'El contacto ha fallecido'
  },
  [CONTACT_STATUS.MOVED]: {
    variant: 'moved' as const,
    icon: '🚚',
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.MOVED],
    description: 'El contacto se ha mudado de la zona'
  },
  [CONTACT_STATUS.BOUNCED]: {
    variant: 'bounced' as const,
    icon: '📧',
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.BOUNCED],
    description: 'El email del contacto rebotó permanentemente'
  },
  [CONTACT_STATUS.BLOCKED]: {
    variant: 'blocked' as const,
    icon: '🔒',
    label: CONTACT_STATUS_LABELS[CONTACT_STATUS.BLOCKED],
    description: 'El contacto ha sido bloqueado'
  },
} as const;

// ============================================
// CONTACT STATUS BADGE COMPONENT
// ============================================

export const ContactStatusBadge: React.FC<ContactStatusBadgeProps> = ({
  status,
  showIcon = false,
  className,
  onClick,
}) => {
  const config = statusConfig[status];
  
  if (!config) {
    console.warn(`ContactStatusBadge: Unknown status "${status}"`);
    return (
      <StatusBadge status="inactive" className={className}>
        {status}
      </StatusBadge>
    );
  }

  return (
    <StatusBadge
      status={config.variant}
      className={className}
      onClick={onClick}
      title={config.description}
    >
      {showIcon && (
        <span className="mr-1" role="img" aria-hidden="true">
          {config.icon}
        </span>
      )}
      {config.label}
    </StatusBadge>
  );
};

// ============================================
// SPECIALIZED VARIANTS
// ============================================

/**
 * Compact Status Badge - Para tablas y listas
 */
export const CompactContactStatusBadge: React.FC<{
  status: ContactStatus;
  iconOnly?: boolean;
  className?: string;
}> = ({ status, iconOnly = false, className }) => {
  const config = statusConfig[status];
  
  if (!config) return null;

  if (iconOnly) {
    return (
      <span
        className={className}
        title={`${config.label} - ${config.description}`}
        role="img"
        aria-label={config.label}
      >
        {config.icon}
      </span>
    );
  }

  return (
    <StatusBadge
      status={config.variant}
      className={className}
      title={config.description}
    >
      <span className="mr-1" role="img" aria-hidden="true">
        {config.icon}
      </span>
      {config.label}
    </StatusBadge>
  );
};

/**
 * Interactive Status Badge - Para cambiar status
 */
export const InteractiveContactStatusBadge: React.FC<{
  status: ContactStatus;
  onStatusChange?: (newStatus: ContactStatus) => void;
  availableStatuses?: ContactStatus[];
  disabled?: boolean;
  className?: string;
}> = ({ 
  status, 
  onStatusChange, 
  availableStatuses, 
  disabled = false,
  className 
}) => {
  const config = statusConfig[status];
  
  if (!onStatusChange || disabled) {
    return <ContactStatusBadge status={status} className={className} />;
  }

  // Si no se especifican estados disponibles, usar todos excepto el actual
  const defaultAvailableStatuses = Object.keys(CONTACT_STATUS)
    .filter(s => s !== status) as ContactStatus[];
  
  const statuses = availableStatuses || defaultAvailableStatuses;

  return (
    <div className="relative group">
      <StatusBadge
        status={config.variant}
        className={`${className} cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={() => {
          // Por simplicidad, rotar entre estados disponibles
          const currentIndex = statuses.indexOf(status);
          const nextIndex = (currentIndex + 1) % statuses.length;
          onStatusChange(statuses[nextIndex]);
        }}
        title={`${config.description} - Click para cambiar`}
      >
        <span className="mr-1" role="img" aria-hidden="true">
          {config.icon}
        </span>
        {config.label}
      </StatusBadge>
      
      {/* Tooltip con estados disponibles */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-app-dark-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        Click para cambiar estado
      </div>
    </div>
  );
};

/**
 * Status Badge con contador - Para filtros y resúmenes
 */
export const ContactStatusBadgeWithCount: React.FC<{
  status: ContactStatus;
  count: number;
  total?: number;
  showPercentage?: boolean;
  onClick?: () => void;
  className?: string;
}> = ({ 
  status, 
  count, 
  total, 
  showPercentage = false, 
  onClick,
  className 
}) => {
  const config = statusConfig[status];
  const percentage = total && total > 0 ? Math.round((count / total) * 100) : 0;
  
  const displayText = showPercentage && total 
    ? `${config.label} (${percentage}%)`
    : `${config.label} (${count})`;

  return (
    <StatusBadge
      status={config.variant}
      className={`${className} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
      title={`${count} contactos ${config.label.toLowerCase()}`}
    >
      <span className="mr-1" role="img" aria-hidden="true">
        {config.icon}
      </span>
      {displayText}
    </StatusBadge>
  );
};

/**
 * Status Filter Badge - Para mostrar filtros activos
 */
export const ContactStatusFilterBadge: React.FC<{
  status: ContactStatus;
  onRemove?: () => void;
  className?: string;
}> = ({ status, onRemove, className }) => {
  const config = statusConfig[status];
  
  return (
    <StatusBadge
      status={config.variant}
      className={className}
      title={`Filtrado por: ${config.label}`}
    >
      <span className="mr-1" role="img" aria-hidden="true">
        {config.icon}
      </span>
      {config.label}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
          aria-label={`Remover filtro ${config.label}`}
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </StatusBadge>
  );
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Obtiene la configuración de un status
 */
export const getContactStatusConfig = (status: ContactStatus) => {
  return statusConfig[status] || null;
};

/**
 * Obtiene todos los status disponibles
 */
export const getAllContactStatuses = (): ContactStatus[] => {
  return Object.keys(CONTACT_STATUS) as ContactStatus[];
};

/**
 * Verifica si un status es válido
 */
export const isValidContactStatus = (status: string): status is ContactStatus => {
  return Object.values(CONTACT_STATUS).includes(status as ContactStatus);
};

/**
 * Obtiene el status más apropiado basado en condiciones
 */
export const getRecommendedStatus = (conditions: {
  hasEmail?: boolean;
  hasPhone?: boolean;
  lastActivityDays?: number;
  isSystemUser?: boolean;
}): ContactStatus => {
  const { hasEmail, hasPhone, lastActivityDays, isSystemUser } = conditions;
  
  // Si es usuario del sistema, probablemente activo
  if (isSystemUser) {
    return CONTACT_STATUS.ACTIVE;
  }
  
  // Si no tiene datos de contacto básicos, puede ser duplicado o incompleto
  if (!hasEmail && !hasPhone) {
    return CONTACT_STATUS.INACTIVE;
  }
  
  // Si no ha tenido actividad en mucho tiempo
  if (lastActivityDays && lastActivityDays > 365) {
    return CONTACT_STATUS.INACTIVE;
  }
  
  // Por defecto, activo
  return CONTACT_STATUS.ACTIVE;
};

/**
 * Obtiene estadísticas de status para un conjunto de contactos
 */
export const getStatusStatistics = (contacts: Array<{ status: ContactStatus }>) => {
  const stats = Object.values(CONTACT_STATUS).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<ContactStatus, number>);
  
  contacts.forEach(contact => {
    if (isValidContactStatus(contact.status)) {
      stats[contact.status]++;
    }
  });
  
  const total = contacts.length;
  
  return {
    stats,
    total,
    percentages: Object.entries(stats).reduce((acc, [status, count]) => {
      acc[status as ContactStatus] = total > 0 ? Math.round((count / total) * 100) : 0;
      return acc;
    }, {} as Record<ContactStatus, number>)
  };
};

// ============================================
// EXPORTS
// ============================================

export default ContactStatusBadge;

export {
  statusConfig as contactStatusConfig,
  type ContactStatusBadgeProps,
};

// ============================================
// TYPE-SAFE STATUS CONSTANTS EXPORT
// ============================================

// Re-export para convenience
export { 
  CONTACT_STATUS, 
  CONTACT_STATUS_LABELS, 
  CONTACT_STATUS_COLORS,
  type ContactStatus 
} from '@/utils/constants';