// src/components/deals/DealPipelineInfo.tsx
// ✅ DEAL PIPELINE INFO - Información del pipeline y etapa del deal
// Reescrito siguiendo arquitectura correcta: React Query + dealStore + datos reales

import React, { useState, useMemo, useCallback } from 'react'; // <-- Se añade useCallback
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
import { useDealOperations } from '@/hooks/useDeals';
import { useErrorHandler } from '@/hooks/useErrorHandler';

// ============================================
// TYPES (Cambiado para alineación)
// ============================================
import type { DealDTO } from '@/types/deal.types';
// ✅ CAMBIO QUIRÚRGICO 1: Importar el tipo KanbanDataDTO global
import type { KanbanDataDTO } from '@/types/kanban.types'; 

import { 
  getStatusVariant,
  formatDealAmount,
  DEAL_STATUS_LABELS 
} from '@/types/deal.types';
import { cn } from '@/utils/cn';

// ============================================
// COMPONENT PROPS (Actualizadas con los tipos correctos)
// ============================================
interface DealPipelineInfoProps {
    deal: DealDTO;
    // ✅ CAMBIO QUIRÚRGICO 2: Usar el tipo global 'KanbanDataDTO' en lugar del tipo local 'KanbanData'.
    kanbanData: KanbanDataDTO;
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
  // LOCAL STATE (Solo para UI) - SIN CAMBIOS
  // ============================================
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'won' | 'lost' | 'reopen' | 'move';
    data?: any;
  } | null>(null);

  // ============================================
  // OPERATIONS (Mutaciones desde dealStore) - SIN CAMBIOS
  // ============================================
  const {
    isMovingToStage,
    isClosingWon,
    isClosingLost,
    isReopening
  } = useDealOperations();

  const { handleError } = useErrorHandler();

  // ============================================
  // COMPUTED VALUES - CON CAMBIO QUIRÚRGICO
  // ============================================
  const currentStage = useMemo(() => {
    if (!deal) return null;
    
    // ✅ CAMBIO QUIRÚRGICO 3: Acceder a 'stages' desde la raíz de 'kanbanData'.
    if (kanbanData?.stages) {
      const found = kanbanData.stages.find(stage => 
        Number(stage.stageId) === Number(deal.stageId)
      );
      if (found) return found;
    }
    
    // Fallback se mantiene por robustez.
    return {
      stageId: deal.stageId,
      stageName: deal.stageName || 'Etapa sin nombre',
      dealCount: 1,
      totalValue: deal.amount || 0,
      averageDaysInStage: deal.daysInCurrentStage || 0
    };
  }, [deal, kanbanData]);

  const availableStages = useMemo(() => {
    if (!kanbanData) return [];
    // ✅ CAMBIO QUIRÚRGICO 4: Acceder a 'stages' desde la raíz de 'kanbanData'.
    return kanbanData.stages.filter(stage => stage.stageId !== deal?.stageId);
  }, [kanbanData, deal?.stageId]);

  const isOperationInProgress = useMemo(() => {
    if (!deal) return false;
    return isMovingToStage(deal.id) || 
           isClosingWon(deal.id) || 
           isClosingLost(deal.id) || 
           isReopening(deal.id);
  }, [deal, isMovingToStage, isClosingWon, isClosingLost, isReopening]);

  // ============================================
  // EVENT HANDLERS - SIN CAMBIOS
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
    setConfirmAction(null); 
  };

  // ============================================
  // LOADING STATES - SIN CAMBIOS
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
  // ERROR STATES - SIN CAMBIOS
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
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  // ============================================
  // RENDER - SIN CAMBIOS EN LA ESTRUCTURA, SOLO ACCESO A DATOS
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
            {currentStage?.stageName || deal.stageName || 'Sin etapa asignada'}
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
        description={
            confirmAction?.type === 'won' ? '¿Estás seguro de que quieres marcar esta oportunidad como ganada?' :
            confirmAction?.type === 'lost' ? '¿Estás seguro de que quieres marcar esta oportunidad como perdida?' :
            confirmAction?.type === 'reopen' ? '¿Estás seguro de que quieres reabrir esta oportunidad?' :
            confirmAction?.type === 'move' ? `¿Confirmas mover la oportunidad a "${confirmAction.data?.stageName}"?` : 'Por favor, confirma la acción.'
        }
        confirmLabel={
            confirmAction?.type === 'won' ? 'Sí, Cerrar Ganada' :
            confirmAction?.type === 'lost' ? 'Sí, Cerrar Perdida' :
            confirmAction?.type === 'reopen' ? 'Sí, Reabrir' :
            confirmAction?.type === 'move' ? 'Sí, Mover' : 'Confirmar'
        }
        isConfirming={isOperationInProgress}
        variant={
            confirmAction?.type === 'lost' ? 'destructive' : 'default'
        }
        />
    </div>
  );
};

export default DealPipelineInfo;