// src/components/deals/DealKanbanView.tsx
// ✅ EL CORAZÓN DE LA FUNCIONALIDAD KANBAN
// Componente responsable del tablero Kanban y manejo de Drag & Drop
// 🔧 ACTUALIZADO: Con validaciones defensivas para evitar crashes

import React, { useMemo, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  MouseSensor,
  TouchSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, AlertCircle, TrendingUp, DollarSign, Clock } from 'lucide-react';

// ============================================
// HOOKS & SERVICES
// ============================================
import { usePipelineKanbanData, useDealOperations } from '@/hooks/useDeals';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';

// ============================================
// DEAL COMPONENTS
// ============================================
import DealCard from './DealCard';
import { EmptyKanbanColumn } from './EmptyKanbanColumn';

// ============================================
// TYPES
// ============================================
import type { Deal } from '@/types/deal.types';
import type { PipelineDTO } from '@/types/pipeline.types';

interface DealKanbanViewProps {
  pipeline: PipelineDTO;
  searchTerm?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================
const DealKanbanView: React.FC<DealKanbanViewProps> = ({ pipeline, searchTerm }) => {
  
  // ============================================
  // DATA FETCHING - ÚNICA FUENTE DE VERDAD
  // ============================================
  const { 
    data: kanbanData, 
    isLoading, 
    isFetching,
    error,
    refetch 
  } = usePipelineKanbanData(pipeline.id);

  // DEBUG: Logging temporal para diagnosticar errores
  console.log('Debug kanbanData:', kanbanData);
  console.log('Debug pipeline stages:', kanbanData?.pipeline?.stages);

  // ============================================
  // ACTIONS - Para el Drag & Drop
  // ============================================
  const { moveDealToStage, isMovingToStage } = useDealOperations();

  // ============================================
  // DRAG & DROP SENSORS
  // ============================================
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // ============================================
  // FILTERED DEALS (Por término de búsqueda) - CON VALIDACIÓN DEFENSIVA
  // ============================================
  const filteredStages = useMemo(() => {
    // ✅ VALIDACIÓN DEFENSIVA: Evita crashes por datos undefined
    if (!kanbanData?.pipeline?.stages || !Array.isArray(kanbanData.pipeline.stages)) {
      return [];
    }
    
    if (!searchTerm || searchTerm.trim() === '') {
      return kanbanData.pipeline.stages;
    }

    const searchLower = searchTerm.toLowerCase();
    return kanbanData.pipeline.stages.map(stage => ({
      ...stage,
      deals: (stage.deals || []).filter(deal => 
        deal && deal.title && (
          deal.title?.toLowerCase().includes(searchLower) ||
          deal.description?.toLowerCase().includes(searchLower) ||
          deal.contactName?.toLowerCase().includes(searchLower) ||
          deal.companyName?.toLowerCase().includes(searchLower)
        )
      )
    }));
  }, [kanbanData?.pipeline?.stages, searchTerm]);

  // ============================================
  // DRAG & DROP HANDLERS - CON VALIDACIÓN DEFENSIVA
  // ============================================
  const [activeDragData, setActiveDragData] = React.useState<{ deal: Deal; fromStageId: number } | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const dealId = Number(active.id);
    
    // ✅ VALIDACIÓN DEFENSIVA: Verificar que filteredStages existe y es un array
    if (!filteredStages || !Array.isArray(filteredStages)) {
      return;
    }
    
    const stage = filteredStages.find(s => 
      s.deals && Array.isArray(s.deals) && s.deals.some(d => d && d.id === dealId)
    );
    if (stage) {
      const deal = stage.deals.find(d => d && d.id === dealId);
      if (deal) {
        setActiveDragData({
          deal,
          fromStageId: stage.stageId
        });
      }
    }
  }, [filteredStages]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { over } = event;
    
    const currentDragData = activeDragData;
    setActiveDragData(null);
    
    if (!over || !currentDragData) return;

    const fromStageId = currentDragData.fromStageId;
    const newStageId = Number(over.id);
    
    if (fromStageId === newStageId) {
      return;
    }

    try {
      await moveDealToStage(currentDragData.deal.id, newStageId, undefined, () => {
        console.log(`✅ Deal ${currentDragData.deal.id} moved to stage ${newStageId} successfully`);
      });
    } catch (error) {
      console.error('❌ Failed to move deal:', error);
    }
  }, [activeDragData, moveDealToStage]);

  // ============================================
  // CREATE DEAL HANDLER
  // ============================================
  const handleCreateDeal = useCallback((stageId: number) => {
    console.log('Create deal in stage:', stageId);
  }, []);

  // ============================================
  // RENDER HELPERS
  // ============================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-app-gray-400">Cargando pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        message="Error al cargar los datos del pipeline"
        actions={[
          <Button key="retry" onClick={() => refetch()}>
            Reintentar
          </Button>
        ]}
      />
    );
  }

  // ✅ VALIDACIÓN DEFENSIVA: Verificar que tenemos stages válidos
  if (!kanbanData?.pipeline?.stages || !Array.isArray(kanbanData.pipeline.stages) || kanbanData.pipeline.stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-app-dark-600 rounded-lg">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-app-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-app-gray-300 mb-2">
            Pipeline Sin Etapas
          </h3>
          <p className="text-app-gray-400">
            Este pipeline no tiene etapas configuradas.
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER - TABLERO KANBAN
  // ============================================
  return (
    <div className="h-full">
      {/* Header del Pipeline con métricas */}
      <div className="mb-6 p-4 bg-app-dark-800 border border-app-dark-600 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{pipeline.name}</h2>
            {pipeline.description && (
              <p className="text-sm text-app-gray-400 mt-1">{pipeline.description}</p>
            )}
          </div>
          
          {/* Métricas del Pipeline */}
          {kanbanData?.metrics && (
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="flex items-center space-x-1 text-app-gray-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Total Deals</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {kanbanData.metrics.totalDeals}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center space-x-1 text-app-gray-400">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Valor Total</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {kanbanData.metrics.totalValue?.toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                  }) || '$0'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center space-x-1 text-app-gray-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Conversión</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {(kanbanData.metrics.conversionRate * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Indicador de loading durante fetching */}
      {isFetching && (
        <div className="mb-4 p-2 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-300">
            <LoadingSpinner size="sm" />
            <span className="text-sm">Actualizando datos...</span>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TABLERO KANBAN CON DND-KIT */}
      {/* ============================================ */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {(filteredStages || []).map((stage) => (
            <div key={stage.stageId} className="flex-shrink-0 w-80">
              {/* Cabecera de la Columna */}
              <div className="mb-4 p-3 bg-app-dark-700 border border-app-dark-600 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">{stage.stageName}</h3>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-app-gray-400">
                      <span>{stage.dealCount || (stage.deals || []).length} deals</span>
                      <span>{stage.totalValue?.toLocaleString('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                      }) || '$0'}</span>
                    </div>
                  </div>
                  
                  <Button
                    icon={Plus}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCreateDeal(stage.stageId)}
                    className="text-app-gray-400 hover:text-white"
                  />
                </div>
              </div>

              {/* Lista de Deals - DROPPABLE ZONE - CON VALIDACIONES DEFENSIVAS */}
              <SortableContext 
                items={(stage.deals || []).map(d => d?.id).filter(id => id !== undefined)}
                strategy={verticalListSortingStrategy}
                id={stage.stageId?.toString() || 'unknown'}
              >
                <div 
                  className="min-h-[200px] space-y-3"
                  data-stage-id={stage.stageId}
                >
                  {(stage.deals || []).length === 0 ? (
                    <EmptyKanbanColumn 
                      stageName={stage.stageName}
                      onCreateDeal={() => handleCreateDeal(stage.stageId)}
                    />
                  ) : (
                    (stage.deals || []).filter(deal => deal && deal.id).map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        isMoving={isMovingToStage(deal.id)}
                        showStage={false}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        {/* ============================================ */}
        {/* DRAG OVERLAY - Muestra el deal mientras se arrastra */}
        {/* ============================================ */}
        <DragOverlay>
          {activeDragData ? (
            <div className="transform rotate-3 opacity-90">
              <DealCard 
                deal={activeDragData.deal} 
                isMoving={false}
                showStage={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Mensaje de búsqueda si no hay resultados */}
      {searchTerm && (filteredStages || []).every(stage => !(stage.deals || []).length) && (
        <div className="mt-8 text-center">
          <AlertCircle className="h-12 w-12 text-app-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-app-gray-300 mb-2">
            Sin Resultados
          </h3>
          <p className="text-app-gray-400">
            No se encontraron oportunidades que coincidan con "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
};

export default DealKanbanView;