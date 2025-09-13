// src/components/deals/DealDetailHeader.tsx
// ✅ DEAL DETAIL HEADER - Replicando CompanyDetailHeader para deals
// Mobile-first + Header con acciones + Estados de loading

import React from 'react';
import { 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';

// ============================================
// UI COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Dropdown from '@/components/ui/Dropdown';

// ============================================
// TYPES & UTILS
// ============================================
import type { Deal } from '@/types/deal.types';
import { 
  getDisplayName, 
  formatDealAmount,
  getStatusVariant,
  getPriorityVariant,
  DEAL_STATUS_LABELS,
  DEAL_PRIORITY_LABELS
} from '@/types/deal.types';

// ============================================
// TYPES
// ============================================

interface DealDetailHeaderProps {
  deal: Deal;
  onEdit: () => void;
  onDelete: () => void;
  onCloseWon: () => void;
  onCloseLost: () => void;
  onReopen: () => void;
  onStageMove: (stageId: number) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  isClosingWon: boolean;
  isClosingLost: boolean;
  isReopening: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

const DealDetailHeader: React.FC<DealDetailHeaderProps> = ({
  deal,
  onEdit,
  onDelete,
  onCloseWon,
  onCloseLost,
  onReopen,
  isUpdating,
  isDeleting,
  isClosingWon,
  isClosingLost,
  isReopening
}) => {
  const isLoading = isUpdating || isDeleting || isClosingWon || isClosingLost || isReopening;
  const statusVariant = getStatusVariant(deal.status);
  const priorityVariant = getPriorityVariant(deal.priority);

  // ============================================
  // ACTION DROPDOWN OPTIONS
  // ============================================
  const getActionOptions = () => {
    const options = [];

    // Editar (siempre disponible)
    options.push({
      id: 'edit',
      label: 'Editar oportunidad',
      icon: Edit3,
      onClick: onEdit,
      disabled: isLoading
    });

    // Acciones según estado
    if (deal.status === 'OPEN') {
      options.push({ type: 'separator' as const });
      options.push({
        id: 'close-won',
        label: 'Cerrar como ganada',
        icon: CheckCircle,
        onClick: onCloseWon,
        disabled: isLoading
      });
      options.push({
        id: 'close-lost',
        label: 'Cerrar como perdida',
        icon: XCircle,
        onClick: onCloseLost,
        disabled: isLoading,
        destructive: true
      });
    } else {
      // Para deals cerradas, permitir reabrir
      options.push({ type: 'separator' as const });
      options.push({
        id: 'reopen',
        label: 'Reabrir oportunidad',
        icon: RotateCcw,
        onClick: onReopen,
        disabled: isLoading
      });
    }

    // Eliminar (siempre al final)
    options.push({ type: 'separator' as const });
    options.push({
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      onClick: onDelete,
      disabled: isLoading,
      destructive: true
    });

    return options;
  };

  return (
    <div className="border-b border-app-dark-700 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Deal Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-app-gray-100 truncate">
              {getDisplayName(deal)}
              {isLoading && (
                <LoadingSpinner size="sm" className="ml-3 inline-block" />
              )}
            </h1>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
              <Badge variant={statusVariant} size="sm"> 
                {DEAL_STATUS_LABELS[deal.status]}
              </Badge>
              
              {deal.priority && deal.priority !== 'MEDIUM' && (
                <Badge variant={priorityVariant} size="sm"> 
                  {DEAL_PRIORITY_LABELS[deal.priority]}
                </Badge>
              )}
            </div>
          </div>

          {/* Pipeline and Stage Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-app-gray-400 mb-3">
            <span>{deal.pipelineName}</span>
            <span className="hidden sm:inline">•</span>
            <span>{deal.stageName}</span>
            {deal.probability && (
              <>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{deal.probability}% probabilidad</span>
                </div>
              </>
            )}
          </div>

          {/* Key Metrics Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Amount */}
            {deal.amount && (
              <div className="flex items-center space-x-1 text-green-400">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">{formatDealAmount(deal)}</span>
              </div>
            )}

            {/* Days in stage */}
            {deal.daysInCurrentStage && (
              <div className="flex items-center space-x-1 text-app-gray-400">
                <Clock className="h-4 w-4" />
                <span>{deal.daysInCurrentStage} días en etapa</span>
              </div>
            )}

            {/* Contact and Company */}
            <div className="flex items-center space-x-2 text-app-gray-400">
              {deal.contactName && (
                <span className="truncate max-w-[120px]">{deal.contactName}</span>
              )}
              {deal.contactName && deal.companyName && (
                <span>•</span>
              )}
              {deal.companyName && (
                <span className="truncate max-w-[120px]">{deal.companyName}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Quick Actions for OPEN deals */}
          {deal.status === 'OPEN' && (
            <>
              <Button
                size="sm"
                variant="default"
                icon={CheckCircle}
                onClick={onCloseWon}
                disabled={isLoading}
                loading={isClosingWon}
                className="hidden sm:flex"
              >
                Cerrar Ganada
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                icon={Edit3}
                onClick={onEdit}
                disabled={isLoading}
                loading={isUpdating}
              >
                <span className="hidden sm:inline">Editar</span>
              </Button>
            </>
          )}

          {/* Reopen for closed deals */}
          {deal.status !== 'OPEN' && (
            <Button
              size="sm"
              variant="outline"
              icon={RotateCcw}
              onClick={onReopen}
              disabled={isLoading}
              loading={isReopening}
            >
              <span className="hidden sm:inline">Reabrir</span>
            </Button>
          )}

          {/* Actions Dropdown */}
          <Dropdown
            trigger={
              <Button
                size="sm"
                variant="ghost"
                disabled={isLoading}
                className="px-2"
              >
                •••
              </Button>
            }
            items={getActionOptions()}
            align="end"
          />
        </div>
      </div>

      {/* Deal Description */}
      {deal.description && (
        <div className="mt-4 p-3 bg-app-dark-800 rounded-lg border border-app-dark-600">
          <p className="text-sm text-app-gray-300 leading-relaxed">
            {deal.description}
          </p>
        </div>
      )}

      {/* Loading States Overlay */}
      {isLoading && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-300">
            <LoadingSpinner size="sm" />
            <span className="text-sm">
              {isUpdating && 'Actualizando oportunidad...'}
              {isDeleting && 'Eliminando oportunidad...'}
              {isClosingWon && 'Cerrando como ganada...'}
              {isClosingLost && 'Cerrando como perdida...'}
              {isReopening && 'Reabriendo oportunidad...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealDetailHeader;