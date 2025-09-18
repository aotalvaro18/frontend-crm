// src/components/deals/DealCard.tsx
// ✅ DEAL CARD COMPONENT - Tarjeta individual para el Kanban
// 🔧 MEJORADO: Con elementos de nivel Salesforce siguiendo arquitectura Eklesa
// Mobile-first + Drag & Drop compatible + Enterprise design + Rico en información

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  DollarSign, 
  Calendar, 
  User, 
  Building, 
  Clock, 
  TrendingUp,
  AlertCircle,
  GripVertical,
  Edit3,
  Trash2,
  // 🔧 NUEVOS ICONOS para características de nivel mundial
  Flame,        // Prioridad alta/urgente
  AlertTriangle, // Actividades vencidas
  Timer,        // Días sin actividad
  Target,       // Próxima actividad
  CheckCircle   // Health score alto
} from 'lucide-react';

// ============================================
// UI COMPONENTS
// ============================================
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ActionDropdown } from '@/components/ui/Dropdown';

// 🔧 NUEVO: Avatar component para el propietario
import { Avatar } from '@/components/ui/Avatar';

// ============================================
// TYPES & UTILS
// ============================================
import type { Deal } from '@/types/deal.types';
import { 
  formatDealAmount, 
  getDisplayName, 
  getStatusVariant,
  getPriorityVariant,
  DEAL_STATUS_LABELS,
  DEAL_PRIORITY_LABELS 
} from '@/types/deal.types';
import { cn } from '@/utils/cn';
import { formatDistance, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// 🔧 NUEVAS FUNCIONES HELPER para características avanzadas
// ============================================
// BUSINESS LOGIC HELPERS
// ============================================

/**
 * Calcula días desde la última actividad para alertas de estancamiento
 */
const getDaysSinceLastActivity = (deal: Deal): number => {
  if (!deal.lastActivityAt) return 999; // Sin actividad = muchos días
  
  const lastActivity = new Date(deal.lastActivityAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastActivity.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Determina si un deal está estancado (criterio de negocio)
 */
const isDealStalled = (deal: Deal): boolean => {
  const daysSinceActivity = getDaysSinceLastActivity(deal);
  const daysInStage = deal.daysInCurrentStage || 0;
  
  // Criterios de estancamiento: más de 7 días sin actividad O más de 21 días en la misma etapa
  return daysSinceActivity > 7 || daysInStage > 21;
};

/**
 * Obtiene el color del border izquierdo según prioridad y estado
 */
const getLeftBorderColor = (deal: Deal): string => {
  // Prioridad URGENT = rojo
  if (deal.priority === 'URGENT') return 'border-l-red-500';
  
  // Deal vencido = rojo
  if (deal.isOverdue) return 'border-l-red-500';
  
  // Prioridad HIGH = naranja
  if (deal.priority === 'HIGH') return 'border-l-orange-500';
  
  // Deal estancado = amarillo
  if (isDealStalled(deal)) return 'border-l-yellow-500';
  
  // Health score bajo = amarillo
  if (deal.healthScore && deal.healthScore < 40) return 'border-l-yellow-500';
  
  // Por defecto = azul (normal)
  return 'border-l-blue-500';
};

/**
 * Obtiene la fecha más relevante para mostrar (próxima actividad o cierre esperado)
 */
const getKeyDate = (deal: Deal): { text: string; isUrgent: boolean; icon: typeof Calendar | typeof Target } => {
  // Si hay próxima actividad programada, esa es prioridad
  if (deal.nextAction && deal.nextAction.includes('Próx')) {
    return {
      text: deal.nextAction,
      isUrgent: deal.nextAction.includes('Hoy') || deal.nextAction.includes('Vencida'),
      icon: Target
    };
  }
  
  // Si no, mostrar fecha de cierre esperado
  if (deal.expectedCloseDate) {
    const closeDate = parseISO(deal.expectedCloseDate);
    const formatted = formatDistance(closeDate, new Date(), { 
      addSuffix: true, 
      locale: es 
    });
    
    const isOverdue = new Date(deal.expectedCloseDate) < new Date() && deal.status === 'OPEN';
    
    return {
      text: `Cierre: ${formatted}`,
      isUrgent: isOverdue,
      icon: Calendar
    };
  }
  
  return {
    text: '',
    isUrgent: false,
    icon: Calendar
  };
};

// ============================================
// TYPES - Sin cambios
// ============================================

interface DealCardProps {
  deal: Deal;
  isMoving?: boolean;
  showStage?: boolean;
  className?: string;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

const DealCard: React.FC<DealCardProps> = ({
  deal,
  isMoving = false,
  showStage = true,
  className,
  onEdit,
  onDelete,
}) => {
  // ============================================
  // DND-KIT INTEGRATION - Sin cambios
  // ============================================
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // ============================================
  // COMPUTED VALUES - Mejorados con nuevas características
  // ============================================
  const formattedAmount = formatDealAmount(deal);
  const displayName = getDisplayName(deal);
  const statusVariant = getStatusVariant(deal.status);
  const priorityVariant = getPriorityVariant(deal.priority);

  // Calcular días en etapa actual
  const daysInStage = deal.daysInCurrentStage || 0;
  const isStalled = isDealStalled(deal); // 🔧 NUEVO: usar función helper

  // 🔧 NUEVOS: Computed values para características avanzadas
  const daysSinceActivity = getDaysSinceLastActivity(deal);
  const leftBorderColor = getLeftBorderColor(deal);
  const keyDate = getKeyDate(deal);
  const hasHealthScore = deal.healthScore !== undefined;
  const isHighPriority = deal.priority === 'HIGH' || deal.priority === 'URGENT';

  // ✅ CONSERVADO: Optimización con useMemo para formatDistance
  const expectedCloseFormatted = useMemo(() => {
    if (!deal.expectedCloseDate) return null;
    return formatDistance(parseISO(deal.expectedCloseDate), new Date(), { 
      addSuffix: true, 
      locale: es 
    });
  }, [deal.expectedCloseDate]);

  // Determinar si está vencida - CONSERVADO
  const isOverdue = deal.expectedCloseDate 
    ? new Date(deal.expectedCloseDate) < new Date() && deal.status === 'OPEN'
    : false;

  // ✅ CONSERVADO: Items para el dropdown de acciones
  const actionItems = useMemo(() => {
    if (!onEdit && !onDelete) return [];
    
    const items = [];
    
    if (onEdit) {
      items.push({
        id: 'edit',
        label: 'Editar',
        icon: Edit3,
        onClick: () => onEdit(deal)
      });
    }
    
    if (onEdit && onDelete) {
      items.push({ type: 'separator' as const });
    }
    
    if (onDelete) {
      items.push({
        id: 'delete',
        label: 'Eliminar',
        icon: Trash2,
        destructive: true,
        onClick: () => onDelete(deal)
      });
    }
    
    return items;
  }, [deal, onEdit, onDelete]);

  // ============================================
  // RENDER HELPERS - Mejorados y nuevos
  // ============================================
  
  // ✅ CONSERVADO: renderAmount
  const renderAmount = () => {
    if (!deal.amount) return null;
    
    return (
      <div className="flex items-center space-x-1 text-sm">
        <DollarSign className="h-3 w-3 text-green-400" />
        <span className="font-medium text-white">{formattedAmount}</span>
        {deal.probability && (
          <span className="text-xs text-app-gray-400">
            ({deal.probability}%)
          </span>
        )}
      </div>
    );
  };

  // ✅ CONSERVADO: renderContacts
  const renderContacts = () => {
    return (
      <div className="space-y-1">
        {deal.contactName && (
          <div className="flex items-center space-x-1 text-xs text-app-gray-300">
            <User className="h-3 w-3" />
            <span className="truncate">{deal.contactName}</span>
          </div>
        )}
        {deal.companyName && (
          <div className="flex items-center space-x-1 text-xs text-app-gray-300">
            <Building className="h-3 w-3" />
            <span className="truncate">{deal.companyName}</span>
          </div>
        )}
      </div>
    );
  };

  // 🔧 NUEVO: Renderizar propietario con avatar
  const renderOwner = () => {
    if (!deal.ownerName) return null;
    
    return (
      <div className="flex items-center space-x-2">
        <Avatar
          name={deal.ownerName}
          size="sm"
          className="flex-shrink-0"
        />
        <span className="text-xs text-app-gray-400 truncate">
          {deal.ownerName}
        </span>
      </div>
    );
  };

  // 🔧 NUEVO: Indicadores de alerta y prioridad
  const renderAlerts = () => {
    const alerts = [];
    
    // Alerta de actividades vencidas
    if (deal.isOverdue) {
      alerts.push(
        <div key="overdue" className="flex items-center space-x-1 text-red-400">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-xs font-medium">Vencida</span>
        </div>
      );
    }
    
    // Alerta de estancamiento
    if (isStalled && !deal.isOverdue) {
      alerts.push(
        <div key="stalled" className="flex items-center space-x-1 text-yellow-400">
          <Timer className="h-3 w-3" />
          <span className="text-xs">{daysSinceActivity}d sin actividad</span>
        </div>
      );
    }
    
    // Indicador de prioridad alta
    if (isHighPriority && !deal.isOverdue) {
      alerts.push(
        <div key="priority" className="flex items-center space-x-1 text-orange-400">
          <Flame className="h-3 w-3" />
          <span className="text-xs font-medium">{DEAL_PRIORITY_LABELS[deal.priority!]}</span>
        </div>
      );
    }
    
    if (alerts.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2">
        {alerts}
      </div>
    );
  };

  // 🔧 MEJORADO: renderMetadata con fecha clave prominente
  const renderMetadata = () => {
    return (
      <div className="space-y-2">
        {/* Fecha clave (próxima actividad o cierre) */}
        {keyDate.text && (
          <div className={cn(
            "flex items-center space-x-1 text-xs",
            keyDate.isUrgent ? "text-red-400" : "text-app-gray-400"
          )}>
            <keyDate.icon className="h-3 w-3" />
            <span className="font-medium">{keyDate.text}</span>
          </div>
        )}
        
        {/* Metadata secundaria */}
        <div className="flex items-center justify-between text-xs text-app-gray-400">
          <div className="flex items-center space-x-3">
            {/* Días en etapa */}
            <div className={cn(
              "flex items-center space-x-1",
              isStalled && "text-yellow-400"
            )}>
              <Clock className="h-3 w-3" />
              <span>{daysInStage}d</span>
            </div>
          </div>

          {/* Health score */}
          {hasHealthScore && (
            <div className="flex items-center space-x-1">
              <TrendingUp className={cn(
                "h-3 w-3",
                deal.healthScore! >= 70 ? "text-green-400" :
                deal.healthScore! >= 40 ? "text-yellow-400" : "text-red-400"
              )} />
              <span>{deal.healthScore}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ✅ CONSERVADO: renderBadges (con pequeñas mejoras)
  const renderBadges = () => {
    return (
      <div className="flex flex-wrap gap-1">
        {/* Badge de estado */}
        {deal.status !== 'OPEN' && (
          <Badge 
            variant={statusVariant} 
            size="sm"
          >
            {DEAL_STATUS_LABELS[deal.status]}
          </Badge>
        )}

        {/* Badge de prioridad - Solo si no se muestra en alertas */}
        {deal.priority && deal.priority !== 'MEDIUM' && !isHighPriority && (
          <Badge 
            variant={priorityVariant} 
            size="sm"
          >
            {DEAL_PRIORITY_LABELS[deal.priority]}
          </Badge>
        )}

        {/* Badge de etapa (solo si showStage es true) */}
        {showStage && deal.stageName && (
          <Badge variant="outline" size="sm">
            {deal.stageName}
          </Badge>
        )}
      </div>
    );
  };

  // ============================================
  // MAIN RENDER - Con mejoras visuales
  // ============================================
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        // Layout base con border izquierdo colorizado
        'group relative rounded-lg border border-app-dark-600 p-3 bg-app-dark-800',
        'border-l-4', // 🔧 NUEVO: Border izquierdo más grueso
        leftBorderColor, // 🔧 NUEVO: Color dinámico del border
        'transition-all duration-200 cursor-pointer',
        
        // Hover states
        'hover:bg-app-dark-750 hover:border-app-dark-500',
        'hover:shadow-lg hover:shadow-app-dark-900/20',
        
        // Dragging states
        isDragging && 'opacity-50 rotate-2 scale-105 shadow-xl',
        isMoving && 'opacity-70',
        
        // Mobile-first responsive
        'space-y-3',
        
        className
      )}
      {...attributes}
    >
      {/* Loading overlay - CONSERVADO */}
      {isMoving && (
        <div className="absolute inset-0 bg-app-dark-900/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <LoadingSpinner size="sm" variant="white" />
        </div>
      )}

      {/* Header con drag handle - CONSERVADO */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link 
            to={`/crm/deals/${deal.id}`}
            className="block hover:no-underline"
          >
            <h3 className={cn(
              "font-medium text-white text-sm leading-tight",
              "hover:text-app-accent-400 transition-colors",
              "line-clamp-2"
            )}>
              {displayName}
            </h3>
          </Link>
          
          {deal.description && (
            <p className="text-xs text-app-gray-400 mt-1 line-clamp-2">
              {deal.description}
            </p>
          )}
        </div>

        {/* Drag handle - CONSERVADO */}
        <div 
          {...listeners}
          className={cn(
            "flex-shrink-0 p-1 ml-2 rounded cursor-grab active:cursor-grabbing",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-app-dark-700"
          )}
        >
          <GripVertical className="h-4 w-4 text-app-gray-400" />
        </div>
      </div>

      {/* 🔧 NUEVO: Alertas prominentes */}
      {renderAlerts()}

      {/* Monto y probabilidad - CONSERVADO */}
      {renderAmount()}

      {/* Contactos relacionados - CONSERVADO */}
      {renderContacts()}

      {/* 🔧 NUEVO: Propietario con avatar */}
      {renderOwner()}

      {/* Badges - CONSERVADO */}
      {renderBadges()}

      {/* Metadata mejorada */}
      {renderMetadata()}

      {/* Actions dropdown - CONSERVADO */}
      {actionItems.length > 0 && (
        <div className={cn(
          "absolute top-2 right-2 opacity-0 group-hover:opacity-100",
          "transition-opacity duration-200"
        )}>
          <ActionDropdown
            items={actionItems}
            align="end"
          />
        </div>
      )}
    </div>
  );
};

export default DealCard;