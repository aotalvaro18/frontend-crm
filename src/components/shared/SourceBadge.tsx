// src/components/shared/SourceBadge.tsx
// SourceBadge siguiendo tu guía arquitectónica  
// Usa exactamente tus CONTACT_SOURCES constants y Badge component

import React from 'react';
import { 
  Users, 
  Globe, 
  UserPlus, 
  Edit, 
  Download, 
  Share2, 
  Megaphone, 
  Star, 
  Phone,
  Hash,
  Mail, // Añadido para 'EMAIL_CAMPAIGN' y 'COLD_EMAIL'
  Search, // Añadido para 'SEO'
  FileText, // Añadido para 'CONTENT_MARKETING'
  Building, // Añadido para 'TRADE_SHOW'
  Presentation, // Añadido para 'CONFERENCE'
  Church, // Añadido para 'CHURCH_SERVICE'
  HeartHandshake, // Añadido para 'VOLUNTEER'
  Group, // Añadido para 'MINISTRY'
  Handshake, // Añadido para 'PASTORAL_VISIT'
  Code, // Añadido para 'API'
  Smartphone, // Añadido para 'MOBILE_APP'
  Briefcase, // Añadido para 'PARTNER'
  ShoppingCart // Añadido para 'VENDOR'
} from 'lucide-react';
import { Badge, type BadgeSize } from '@/components/ui/Badge';
import { 
  CONTACT_SOURCES, 
  CONTACT_SOURCE_LABELS 
} from '@/utils/constants';
import type { ContactSource } from '@/utils/constants';
import { cn } from '@/utils/cn';

// ============================================
// SOURCE CONFIGURATION
// ============================================

const sourceConfig = {
  // Digital sources
  [CONTACT_SOURCES.WEBSITE]: { icon: Globe, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.WEBSITE], description: 'Registro a través de la página web', category: 'digital', priority: 'medium' },
  [CONTACT_SOURCES.SOCIAL_MEDIA]: { icon: Share2, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.SOCIAL_MEDIA], description: 'Contacto a través de redes sociales', category: 'digital', priority: 'medium' },
  [CONTACT_SOURCES.EMAIL_CAMPAIGN]: { icon: Mail, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.EMAIL_CAMPAIGN], description: 'Resultado de campaña de email marketing', category: 'marketing', priority: 'high' },
  [CONTACT_SOURCES.ONLINE_AD]: { icon: Megaphone, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.ONLINE_AD], description: 'Generado por un anuncio online', category: 'marketing', priority: 'high' },
  [CONTACT_SOURCES.SEO]: { icon: Search, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.SEO], description: 'Encontrado a través de motores de búsqueda', category: 'digital', priority: 'medium' },
  [CONTACT_SOURCES.CONTENT_MARKETING]: { icon: FileText, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.CONTENT_MARKETING], description: 'Atraído por contenido (blog, video, etc.)', category: 'digital', priority: 'medium' },

  // Traditional sources
  [CONTACT_SOURCES.REFERRAL]: { icon: UserPlus, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.REFERRAL], description: 'Referido por un contacto o miembro existente', category: 'referral', priority: 'high' },
  [CONTACT_SOURCES.COLD_CALL]: { icon: Phone, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.COLD_CALL], description: 'Contacto inicial por llamada en frío', category: 'direct', priority: 'low' },
  [CONTACT_SOURCES.COLD_EMAIL]: { icon: Mail, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.COLD_EMAIL], description: 'Contacto inicial por email en frío', category: 'direct', priority: 'low' },
  [CONTACT_SOURCES.NETWORKING]: { icon: Users, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.NETWORKING], description: 'Contacto establecido en un evento de networking', category: 'event', priority: 'medium' },
  [CONTACT_SOURCES.TRADE_SHOW]: { icon: Building, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.TRADE_SHOW], description: 'Contacto de una feria comercial', category: 'event', priority: 'high' },
  [CONTACT_SOURCES.CONFERENCE]: { icon: Presentation, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.CONFERENCE], description: 'Contacto de una conferencia', category: 'event', priority: 'high' },

  // Church-specific sources
  [CONTACT_SOURCES.CHURCH_SERVICE]: { icon: Church, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.CHURCH_SERVICE], description: 'Visitante en un servicio dominical', category: 'visit', priority: 'high' },
  [CONTACT_SOURCES.CHURCH_EVENT]: { icon: Star, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.CHURCH_EVENT], description: 'Asistente a un evento especial de la iglesia', category: 'event', priority: 'high' },
  [CONTACT_SOURCES.SMALL_GROUP]: { icon: Users, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.SMALL_GROUP], description: 'Participante de un grupo pequeño', category: 'internal', priority: 'medium' },
  [CONTACT_SOURCES.VOLUNTEER]: { icon: HeartHandshake, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.VOLUNTEER], description: 'Interesado o activo en voluntariado', category: 'internal', priority: 'medium' },
  [CONTACT_SOURCES.MINISTRY]: { icon: Group, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.MINISTRY], description: 'Participante de un ministerio', category: 'internal', priority: 'medium' },
  [CONTACT_SOURCES.PASTORAL_VISIT]: { icon: Handshake, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.PASTORAL_VISIT], description: 'Resultado de una visita pastoral', category: 'direct', priority: 'high' },

  // Internal sources
  [CONTACT_SOURCES.MANUAL_ENTRY]: { icon: Edit, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.MANUAL_ENTRY], description: 'Ingreso manual por un usuario', category: 'manual', priority: 'low' },
  [CONTACT_SOURCES.IMPORT]: { icon: Download, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.IMPORT], description: 'Importado desde un archivo', category: 'import', priority: 'medium' },
  [CONTACT_SOURCES.API]: { icon: Code, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.API], description: 'Creado a través de la API', category: 'integration', priority: 'medium' },
  [CONTACT_SOURCES.MOBILE_APP]: { icon: Smartphone, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.MOBILE_APP], description: 'Registrado desde la aplicación móvil', category: 'digital', priority: 'medium' },

  // Other
  [CONTACT_SOURCES.PARTNER]: { icon: Briefcase, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.PARTNER], description: 'Contacto a través de un socio estratégico', category: 'referral', priority: 'medium' },
  [CONTACT_SOURCES.VENDOR]: { icon: ShoppingCart, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.VENDOR], description: 'Contacto de un proveedor', category: 'other', priority: 'low' },
  [CONTACT_SOURCES.OTHER]: { icon: Hash, label: CONTACT_SOURCE_LABELS[CONTACT_SOURCES.OTHER], description: 'Fuente no especificada', category: 'other', priority: 'low' },
} as const;

// ============================================
// TYPES
// ============================================

interface SourceBadgeProps {
  source: ContactSource;
  sourceDetails?: string;
  variant?: 'default' | 'compact' | 'detailed' | 'icon-only';
  size?: BadgeSize;
  showIcon?: boolean;
  showDetails?: boolean;
  className?: string;
  onClick?: () => void;
}

// ============================================
// MAIN SOURCE BADGE COMPONENT
// ============================================

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  source,
  sourceDetails,
  variant = 'default',
  size = 'default',
  showIcon = true,
  showDetails = false,
  className,
  onClick,
}) => {
  const config = sourceConfig[source];
  
  if (!config) {
    console.warn(`SourceBadge: Unknown source "${source}"`);
    return (
      <Badge
        variant="outline"
        size={size}
        className={className}
        onClick={onClick}
      >
        <Hash className="h-3 w-3 mr-1" />
        {source}
      </Badge>
    );
  }

  const IconComponent = config.icon;
  
  // Icon only variant
  if (variant === 'icon-only') {
    return (
      <span
        className={cn('inline-flex items-center', className)}
        title={`${config.label}${sourceDetails ? ` - ${sourceDetails}` : ''}`}
        onClick={onClick}
      >
        <IconComponent 
          className={cn(
            size === 'sm' ? 'h-3 w-3' : 
            size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
            'text-app-gray-400'
          )}
        />
      </span>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Badge
        variant="outline"
        size={size}
        className={cn('gap-1', className)}
        onClick={onClick}
        title={`${config.label}${sourceDetails ? ` - ${sourceDetails}` : ''}`}
      >
        {showIcon && (
          <IconComponent className={cn(
            size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
          )} />
        )}
        <span className="truncate max-w-[100px]">{config.label}</span>
      </Badge>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-1', className)}>
        <Badge
          variant="outline"
          size={size}
          className="gap-2"
          onClick={onClick}
        >
          {showIcon && <IconComponent className="h-4 w-4" />}
          <span>{config.label}</span>
        </Badge>
        
        {showDetails && sourceDetails && (
          <p className="text-xs text-app-gray-500 truncate max-w-[200px]">
            {sourceDetails}
          </p>
        )}
        
        <p className="text-xs text-app-gray-400">
          {config.description}
        </p>
      </div>
    );
  }

  // Default variant
  return (
    <Badge
      variant="outline"
      size={size}
      className={cn('gap-1.5', className)}
      onClick={onClick}
      title={config.description}
    >
      {showIcon && (
        <IconComponent className={cn(
          size === 'sm' ? 'h-3 w-3' : 
          size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
        )} />
      )}
      <span>{config.label}</span>
      {sourceDetails && (
        <>
          <span className="text-app-gray-500">•</span>
          <span className="text-app-gray-400 truncate max-w-[80px]">
            {sourceDetails}
          </span>
        </>
      )}
    </Badge>
  );
};

// ============================================
// SPECIALIZED SOURCE COMPONENTS
// ============================================

/**
 * Table Source Badge - Optimizado para ContactsTable
 */
export const TableSourceBadge: React.FC<{
  source: ContactSource;
  sourceDetails?: string;
  className?: string;
}> = ({ source, sourceDetails, className }) => (
  <SourceBadge
    source={source}
    sourceDetails={sourceDetails}
    variant="compact"
    size="sm"
    className={className}
  />
);

/**
 * Card Source Badge - Para tarjetas de contacto
 */
export const CardSourceBadge: React.FC<{
  source: ContactSource;
  sourceDetails?: string;
  showDetails?: boolean;
  className?: string;
}> = ({ source, sourceDetails, showDetails = false, className }) => (
  <SourceBadge
    source={source}
    sourceDetails={sourceDetails}
    variant={showDetails ? 'detailed' : 'default'}
    size = 'default'
    showDetails={showDetails}
    className={className}
  />
);

/**
 * Filter Source Badge - Para mostrar filtros activos
 */
export const SourceFilterBadge: React.FC<{
  source: ContactSource;
  onRemove?: () => void;
  className?: string;
}> = ({ source, onRemove, className }) => {
  const config = sourceConfig[source];
  
  return (
    <Badge
      variant="outline"
      size="sm"
      className={cn('gap-1.5', className)}
      title={`Filtrado por: ${config.label}`}
    >
      <config.icon className="h-3 w-3" />
      <span>{config.label}</span>
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
    </Badge>
  );
};

/**
 * Source Badge con contador - Para estadísticas
 */
export const SourceBadgeWithCount: React.FC<{
  source: ContactSource;
  count: number;
  total?: number;
  showPercentage?: boolean;
  onClick?: () => void;
  className?: string;
}> = ({ 
  source, 
  count, 
  total, 
  showPercentage = false, 
  onClick,
  className 
}) => {
  const config = sourceConfig[source];
  const percentage = total && total > 0 ? Math.round((count / total) * 100) : 0;
  
  const displayText = showPercentage && total 
    ? `${config.label} (${percentage}%)`
    : `${config.label} (${count})`;

  return (
    <Badge
      variant="outline"
      size="default"
      className={cn(
        'gap-1.5',
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
      title={`${count} contactos de ${config.label}`}
    >
      <config.icon className="h-4 w-4" />
      <span>{displayText}</span>
    </Badge>
  );
};

/**
 * Source Priority Badge - Muestra prioridad de la fuente
 */
export const SourcePriorityBadge: React.FC<{
  source: ContactSource;
  showPriorityOnly?: boolean;
  className?: string;
}> = ({ source, showPriorityOnly = false, className }) => {
  const config = sourceConfig[source];
  
  const priorityConfig = {
    high: { color: 'text-green-600', bg: 'bg-green-100', label: 'Alta' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Media' },
    low: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Baja' },
  };
  
  const priority = priorityConfig[config.priority];
  
  if (showPriorityOnly) {
    return (
      <Badge
        variant="outline"
        size="sm"
        className={cn('gap-1', className)}
        title={`Prioridad ${priority.label} - ${config.label}`}
      >
        <span className={cn('w-2 h-2 rounded-full', priority.bg)} />
        {priority.label}
      </Badge>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SourceBadge source={source} variant="compact" size="sm" />
      <Badge variant="outline" size="sm" className="gap-1">
        <span className={cn('w-2 h-2 rounded-full', priority.bg)} />
        {priority.label}
      </Badge>
    </div>
  );
};

// ============================================
// SOURCE ANALYTICS COMPONENTS
// ============================================

/**
 * Source Distribution Chart - Para mostrar distribución de fuentes
 */
export const SourceDistribution: React.FC<{
  contacts: Array<{ source: ContactSource }>;
  className?: string;
}> = ({ contacts, className }) => {
  const distribution = Object.values(CONTACT_SOURCES).map(source => {
    const count = contacts.filter(c => c.source === source).length;
    const percentage = contacts.length > 0 ? Math.round((count / contacts.length) * 100) : 0;
    const config = sourceConfig[source];
    
    return {
      source,
      config,
      count,
      percentage,
    };
  }).filter(item => item.count > 0 && item.config) // Asegurarse de que config existe
    .sort((a, b) => b.count - a.count);

  // Helper para determinar el color de la barra basado en la categoría y prioridad
  const getBarColorClass = (config: typeof sourceConfig[keyof typeof sourceConfig]): string => {
    if (config.priority === 'high') {
      if (config.category === 'event') return 'bg-purple-500';
      if (config.category === 'marketing') return 'bg-orange-500';
      if (config.category === 'visit') return 'bg-green-500';
      return 'bg-blue-500'; // Default para prioridad alta (ej. Referral)
    }
    if (config.priority === 'medium') {
      if (config.category === 'import') return 'bg-indigo-500';
      return 'bg-cyan-500'; // Default para prioridad media (ej. Digital)
    }
    // Default para prioridad baja
    return 'bg-gray-500';
  };

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-app-gray-300">Fuentes de Contactos</h3>
      
      <div className="space-y-2">
        {distribution.map(({ source, config, count, percentage }) => (
          <div key={source} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <config.icon className="h-4 w-4 text-app-gray-400 flex-shrink-0" />
              <span className="text-sm text-app-gray-300 truncate">
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-16 bg-app-dark-600 rounded-full h-2 overflow-hidden">
                <div
                  className={cn('h-2 rounded-full transition-all', getBarColorClass(config))}
                  style={{ width: `${percentage}%` }}
                  title={`${config.label}: ${count} (${percentage}%)`}
                />
              </div>
              <span className="text-xs text-app-gray-400 w-8 text-right tabular-nums">
                {count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Source Performance Metrics - Para mostrar efectividad de fuentes
 */
export const SourcePerformanceMetrics: React.FC<{
  sources: Array<{
    source: ContactSource;
    totalContacts: number;
    activeContacts: number;
    engagementAverage: number;
  }>;
  className?: string;
}> = ({ sources, className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-sm font-medium text-app-gray-300">Rendimiento por Fuente</h3>
      
      <div className="space-y-3">
        {sources.map(({ source, totalContacts, activeContacts, engagementAverage }) => {
          const config = sourceConfig[source];
          const activeRate = totalContacts > 0 ? Math.round((activeContacts / totalContacts) * 100) : 0;
          
          return (
            <div key={source} className="p-3 bg-app-dark-800 rounded-lg border border-app-dark-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <config.icon className="h-4 w-4 text-app-gray-400" />
                  <span className="text-sm font-medium text-app-gray-200">
                    {config.label}
                  </span>
                </div>
                <Badge variant="outline" size="sm">
                  {totalContacts} contactos
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-app-gray-500">Activos:</span>
                  <span className="ml-1 text-app-gray-200 font-medium">
                    {activeRate}%
                  </span>
                </div>
                <div>
                  <span className="text-app-gray-500">Engagement:</span>
                  <span className="ml-1 text-app-gray-200 font-medium">
                    {Math.round(engagementAverage)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Obtiene la configuración de una fuente
 */
export const getSourceConfig = (source: ContactSource) => {
  return sourceConfig[source] || null;
};

/**
 * Obtiene todas las fuentes disponibles
 */
export const getAllContactSources = (): ContactSource[] => {
  return Object.keys(CONTACT_SOURCES) as ContactSource[];
};

/**
 * Verifica si una fuente es válida
 */
export const isValidContactSource = (source: string): source is ContactSource => {
  return Object.values(CONTACT_SOURCES).includes(source as ContactSource);
};

/**
 * Obtiene fuentes por categoría
 */
export const getSourcesByCategory = (category: string) => {
  return Object.entries(sourceConfig)
    .filter(([_, config]) => config.category === category)
    .map(([source]) => source as ContactSource);
};

/**
 * Obtiene fuentes por prioridad
 */
export const getSourcesByPriority = (priority: 'high' | 'medium' | 'low') => {
  return Object.entries(sourceConfig)
    .filter(([_, config]) => config.priority === priority)
    .map(([source]) => source as ContactSource);
};

/**
 * Recomienda la mejor fuente basada en contexto
 */
export const getRecommendedSource = (context: {
  hasReferrer?: boolean;
  fromWebsite?: boolean;
  isChurchEvent?: boolean; // Más específico que 'isEvent'
  isMarketing?: boolean;
}): ContactSource => {
  const { hasReferrer, fromWebsite, isChurchEvent, isMarketing } = context;
  
  // ✅ CORRECCIÓN: Usar las nuevas constantes en inglés
  if (hasReferrer) return CONTACT_SOURCES.REFERRAL;
  if (fromWebsite) return CONTACT_SOURCES.WEBSITE;
  if (isChurchEvent) return CONTACT_SOURCES.CHURCH_EVENT; // Usamos un evento de iglesia como el más común
  if (isMarketing) return CONTACT_SOURCES.EMAIL_CAMPAIGN; // Una campaña de email es un buen default
  
  // El fallback sigue siendo la entrada manual
  return CONTACT_SOURCES.MANUAL_ENTRY;
};

// ============================================
// EXPORTS
// ============================================

export default SourceBadge;

export {
  sourceConfig as contactSourceConfig,
  type SourceBadgeProps,
};

// Re-export para convenience
export { 
  CONTACT_SOURCES, 
  CONTACT_SOURCE_LABELS,
  type ContactSource 
} from '@/utils/constants';
