// src/components/deals/DealPipelineInfo.tsx
// ✅ DEAL PIPELINE INFO - Información del pipeline y etapa del deal
// Reescrito siguiendo arquitectura correcta: React Query + dealStore + datos reales

import React, { useState, useMemo } from 'react';
import { 
  Workflow, 
  ChevronRight, 
  Target, 
  CheckCircle2, 
  XCircle, 
  RotateCcw
} from 'lucide-react';

// ============================================
// UI COMPONENTS (Reutilizables del design system)
// ============================================
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';


// ============================================
// HOOKS & SERVICES (Arquitectura correcta)
// ============================================
import { 
  useDealOperations, 
  usePipelineKanbanData,
  useDealById 
} from '@/hooks/useDeals';

import { useErrorHandler } from '@/hooks/useErrorHandler';

// ============================================
// TYPES (Exactos del sistema)
// ============================================
import type { 
  DealDTO, 
  DealStatus,
  KanbanData 
} from '@/types/deal.types';

import { 
  getStatusVariant,
  formatDealAmount,
  DEAL_STATUS_LABELS 
} from '@/types/deal.types';

import { cn } from '@/utils/cn';

// ============================================
// COMPONENT PROPS
// ============================================
interface DealPipelineInfoProps {
    deal: DealDTO;
    kanbanData: KanbanData; // También lo necesita para las etapas
    isLoading?: boolean;
    error?: Error | null;
    isOperationInProgress: boolean;
    onStageMove: (newStageId: number) => void;
    onCloseWon: () => void;
    onCloseLost: () => void;
    onReopen: () => void;
    className?: string;
    showActions?: boolean;
  }

// ============================================
// MAIN COMPONENT
// ============================================
const DealPipelineInfo: React.FC<DealPipelineInfoProps> = ({ 
    deal, 
    kanbanData,
    isLoading = false,
    error = null,
    onStageMove,
    onCloseWon,
    onCloseLost,
    onReopen,
    className,
    showActions = true,
  }) => {
  
  // ============================================
  // LOCAL STATE (Solo para UI)
  // ============================================
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'won' | 'lost' | 'reopen' | 'move';
    data?: any;
  } | null>(null);

  // ============================================
  // OPERATIONS (Mutaciones desde dealStore)
  // ============================================
  const {
    moveDealToStage,
    closeDealWon,
    closeDealLost,
    reopenDeal,
    isMovingToStage,
    isClosingWon,
    isClosingLost,
    isReopening
  } = useDealOperations();

  const { handleError } = useErrorHandler();

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const currentStage = useMemo(() => {
    if (!deal || !kanbanData) return null;
    return kanbanData.pipeline.stages.find(stage => stage.stageId === deal.stageId);
  }, [deal, kanbanData]);

  const availableStages = useMemo(() => {
    if (!kanbanData) return [];
    return kanbanData.pipeline.stages.filter(stage => stage.stageId !== deal?.stageId);
  }, [kanbanData, deal?.stageId]);

  const isOperationInProgress = useMemo(() => {
    if (!deal) return false;
    return isMovingToStage(deal.id) || 
           isClosingWon(deal.id) || 
           isClosingLost(deal.id) || 
           isReopening(deal.id);
  }, [deal, isMovingToStage, isClosingWon, isClosingLost, isReopening]);

  // ============================================
  // EVENT HANDLERS
  // ============================================
  

  

  
  const handleConfirmAction = () => {
    if (!confirmAction) return;
    
    switch (confirmAction.type) {
      case 'won':
        onCloseWon();
        break;
      case 'lost':
        onCloseLost();
        break;
      case 'reopen':
        onReopen();
        break;
      case 'move':
        if (confirmAction.data?.stageId) {
          onStageMove(confirmAction.data.stageId);
        }
        break;
    }
    // Cerramos el diálogo después de invocar la acción del padre
    setConfirmAction(null); 
  };

  // ============================================
  // LOADING STATES
  // ============================================
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-6 h-48 bg-app-dark-800 rounded-lg", className)}>
        <div className="text-center">
          <LoadingSpinner size="md" />
          <p className="mt-2 text-sm text-app-gray-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATES
  // ============================================
  if (error) {
    return (
      <div className={className}>
        <EmptyState
          icon={Workflow}
          title="Error al Cargar"
          description={error.message || "No se pudo cargar la información del pipeline."}
          action={
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()} // O idealmente una función 'onRetry'
            >
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={cn("space-y-4", className)}>
      
      {/* Pipeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Workflow className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            {kanbanData.pipeline.name}
          </h3>
        </div>
        
        <Badge variant={getStatusVariant(deal.status)}>
          {DEAL_STATUS_LABELS[deal.status]}
        </Badge>
      </div>

      {/* Current Stage Info */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Etapa Actual</span>
          </div>
          
          {showActions && deal.status === 'OPEN' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStageSelector(!showStageSelector)}
              disabled={isOperationInProgress}
            >
              Cambiar Etapa
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-gray-900">
            {currentStage?.stageName || 'Etapa no encontrada'}
          </h4>
          
          {currentStage && (
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {currentStage.dealCount} oportunidades
              </div>
              <div className="text-sm font-medium text-gray-900">
                {formatDealAmount({ amount: currentStage.totalValue } as DealDTO)}
              </div>
            </div>
          )}
        </div>

        {/* Stage Metrics */}
        {currentStage && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xs text-gray-500">Deals</div>
              <div className="text-sm font-semibold text-gray-900">
                {currentStage.dealCount}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Valor Total</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatDealAmount({ amount: currentStage.totalValue } as DealDTO)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Días Promedio</div>
              <div className="text-sm font-semibold text-gray-900">
                {Math.round(currentStage.averageDaysInStage || 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Tasa Conversión</div>
              <div className="text-sm font-semibold text-gray-900">
                {Math.round(kanbanData.metrics.conversionRate || 0)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage Selector */}
      {showStageSelector && availableStages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Seleccionar Nueva Etapa
          </h4>
          
          <div className="space-y-2">
            {availableStages.map((stage) => (
              <button
                key={stage.stageId}
                onClick={() => {
                  setSelectedStageId(stage.stageId);
                  setConfirmAction({ 
                    type: 'move', 
                    data: { stageId: stage.stageId, stageName: stage.stageName } 
                  });
                }}
                className="w-full text-left p-2 rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                disabled={isOperationInProgress}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {stage.stageName}
                  </span>
                  <div className="text-xs text-gray-500">
                    {stage.dealCount} deals
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {showActions && (
        <div className="flex flex-wrap gap-2">
          {deal.status === 'OPEN' && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => setConfirmAction({ type: 'won' })}
                disabled={isOperationInProgress}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Cerrar Ganada
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction({ type: 'lost' })}
                disabled={isOperationInProgress}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cerrar Perdida
              </Button>
            </>
          )}
          
          {(deal.status === 'WON' || deal.status === 'LOST') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmAction({ type: 'reopen' })}
              disabled={isOperationInProgress}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reabrir
            </Button>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {isOperationInProgress && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-gray-600">Procesando...</span>
        </div>
      )}

        <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={
            confirmAction?.type === 'won' ? 'Cerrar como Ganada' :
            confirmAction?.type === 'lost' ? 'Cerrar como Perdida' :
            confirmAction?.type === 'reopen' ? 'Reabrir Oportunidad' :
            confirmAction?.type === 'move' ? 'Mover a Nueva Etapa' : 'Confirmar Acción'
        }
        // ✅ CORREGIDO: 'message' -> 'description'
        description={
            confirmAction?.type === 'won' ? '¿Estás seguro de que quieres marcar esta oportunidad como ganada?' :
            confirmAction?.type === 'lost' ? '¿Estás seguro de que quieres marcar esta oportunidad como perdida?' :
            confirmAction?.type === 'reopen' ? '¿Estás seguro de que quieres reabrir esta oportunidad?' :
            confirmAction?.type === 'move' ? `¿Confirmas mover la oportunidad a "${confirmAction.data?.stageName}"?` : 'Por favor, confirma la acción.'
        }
        // ✅ CORREGIDO: 'confirmText' -> 'confirmLabel'
        confirmLabel={
            confirmAction?.type === 'won' ? 'Sí, Cerrar Ganada' :
            confirmAction?.type === 'lost' ? 'Sí, Cerrar Perdida' :
            confirmAction?.type === 'reopen' ? 'Sí, Reabrir' :
            confirmAction?.type === 'move' ? 'Sí, Mover' : 'Confirmar'
        }
        // ✅ CORREGIDO: 'loading' -> 'isConfirming'
        isConfirming={isOperationInProgress}
        variant={
            confirmAction?.type === 'lost' ? 'destructive' : 'default'
        }
        />
    </div>
  );
};

export default DealPipelineInfo;