// src/components/deals/DealCard.tsx
// ✅ DEAL CARD COMPONENT - Tarjeta individual para el Kanban
// Mobile-first + Drag & Drop compatible + Enterprise design

import React, { useMemo } from 'react'; // ✅ RECOMENDACIÓN 2: Agregado useMemo
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
  Edit3, // ✅ RECOMENDACIÓN 1: Para el dropdown
  Trash2 // ✅ RECOMENDACIÓN 1: Para el dropdown
} from 'lucide-react';

// ============================================
// UI COMPONENTS
// ============================================
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ActionDropdown } from '@/components/ui/Dropdown';
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

// ============================================
// TYPES
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
  // DND-KIT INTEGRATION
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
  // COMPUTED VALUES
  // ============================================
  const formattedAmount = formatDealAmount(deal);
  const displayName = getDisplayName(deal);
  const statusVariant = getStatusVariant(deal.status);
  const priorityVariant = getPriorityVariant(deal.priority);

  // Calcular días en etapa actual
  const daysInStage = deal.daysInCurrentStage || 0;
  const isStalled = daysInStage > 30; // Más de 30 días en la misma etapa

  // ✅ RECOMENDACIÓN 2: Optimización con useMemo para formatDistance
  const expectedCloseFormatted = useMemo(() => {
    if (!deal.expectedCloseDate) return null;
    return formatDistance(parseISO(deal.expectedCloseDate), new Date(), { 
      addSuffix: true, 
      locale: es 
    });
  }, [deal.expectedCloseDate]);

  // Determinar si está vencida
  const isOverdue = deal.expectedCloseDate 
    ? new Date(deal.expectedCloseDate) < new Date() && deal.status === 'OPEN'
    : false;

  // ✅ RECOMENDACIÓN 1: Items para el dropdown de acciones
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
  // RENDER HELPERS
  // ============================================
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

  const renderMetadata = () => {
    return (
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
          
          {/* Fecha esperada */}
          {expectedCloseFormatted && (
            <div className={cn(
              "flex items-center space-x-1",
              isOverdue && "text-red-400"
            )}>
              <Calendar className="h-3 w-3" />
              <span>{expectedCloseFormatted}</span>
            </div>
          )}
        </div>

        {/* Health score */}
        {deal.healthScore && (
          <div className="flex items-center space-x-1">
            <TrendingUp className={cn(
              "h-3 w-3",
              deal.healthScore >= 70 ? "text-green-400" :
              deal.healthScore >= 40 ? "text-yellow-400" : "text-red-400"
            )} />
            <span>{deal.healthScore}</span>
          </div>
        )}
      </div>
    );
  };

  const renderBadges = () => {
    return (
      <div className="flex flex-wrap gap-1">
        {/* Badge de estado */}
        {deal.status !== 'OPEN' && (
        // ✅ CAMBIO: de 'statusColor' a 'statusVariant'
        <Badge 
            variant={statusVariant} 
            size="sm"
        >
            {DEAL_STATUS_LABELS[deal.status]}
        </Badge>
        )}

        {/* Badge de prioridad */}
        {deal.priority && deal.priority !== 'MEDIUM' && (
        // ✅ CAMBIO: de 'priorityColor' a 'priorityVariant'
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

        {/* Badge de alerta si está vencida */}
        {isOverdue && (
          <Badge variant="destructive" size="sm">
            <AlertCircle className="h-2 w-2 mr-1" />
            Vencida
          </Badge>
        )}

        {/* Badge de estancada */}
        {isStalled && !isOverdue && (
          <Badge variant="warning" size="sm">
            <Clock className="h-2 w-2 mr-1" />
            Estancada
          </Badge>
        )}
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        // Layout base
        'group relative rounded-lg border p-3 bg-app-dark-800 border-app-dark-600',
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
      {/* Loading overlay */}
      {isMoving && (
        <div className="absolute inset-0 bg-app-dark-900/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <LoadingSpinner size="sm" variant="white" />
        </div>
      )}

      {/* Header con drag handle */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link 
            to={`/crm/deals/${deal.id}`}
            className="block hover:no-underline"
          >
            <h3 className={cn(
              "font-medium text-white text-sm leading-tight",
              "hover:text-app-accent-400 transition-colors",
              "line-clamp-2" // Máximo 2 líneas
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

        {/* Drag handle */}
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

      {/* Monto y probabilidad */}
      {renderAmount()}

      {/* Contactos relacionados */}
      {renderContacts()}

      {/* Badges */}
      {renderBadges()}

      {/* Metadata (días, fechas, health) */}
      {renderMetadata()}

      {/* ✅ RECOMENDACIÓN 1: Actions dropdown implementado */}
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