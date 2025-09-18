// src/components/deals/DealKanbanView.tsx
// ✅ EL CORAZÓN DE LA FUNCIONALIDAD KANBAN
// Componente responsable del tablero Kanban y manejo de Drag & Drop
// 🔧 REFACTORIZADO: Con KanbanColumnHeader de nivel Salesforce
// Validaciones defensivas para evitar crashes

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
import { AlertCircle } from 'lucide-react';

// ============================================
// HOOKS & SERVICES
// ============================================
import { usePipelineKanbanData, useDealOperations } from '@/hooks/useDeals';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

// ============================================
// DEAL COMPONENTS
// ============================================
import DealCard from './DealCard';
import { EmptyKanbanColumn } from './EmptyKanbanColumn';
// 🔧 NUEVO: Import del componente de cabecera mejorado
import KanbanColumnHeader from './KanbanColumnHeader';

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
      deals: (stage.deals || []).filter(deal => {
        if (!deal) return false;
        
        const searchableText = [
          deal.title,
          deal.description,
          deal.contactName,
          deal.companyName,
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchLower);
      })
    }));
  }, [kanbanData?.pipeline?.stages, searchTerm]);

  // ============================================
  // DRAG & DROP HANDLERS
  // ============================================
  const [activeDragData, setActiveDragData] = React.useState<{
    deal: Deal;
    fromStageId: number;
  } | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    
    // Encontrar el deal que se está arrastrando
    const deal = filteredStages
      .flatMap(stage => stage.deals || [])
      .find(d => d?.id === active.id);
    
    if (deal) {
      const fromStage = filteredStages.find(stage => 
        (stage.deals || []).some(d => d?.id === deal.id)
      );
      
      setActiveDragData({
        deal,
        fromStageId: fromStage?.stageId || 0
      });
    }
  }, [filteredStages]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveDragData(null);
    
    if (!over || !activeDragData) {
      return;
    }

    const dealId = active.id as number;
    const newStageId = parseInt(over.id as string);
    const fromStageId = activeDragData.fromStageId;

    // No hacer nada si se suelta en la misma columna
    if (newStageId === fromStageId) {
      return;
    }

    try {
      await moveDealToStage(dealId, fromStageId, newStageId);
    } catch (error) {
      console.error('Error moving deal:', error);
      // El error se manejará en el hook useDealOperations
    }
  }, [activeDragData, moveDealToStage]);

  // ============================================
  // CREATE DEAL HANDLER
  // ============================================
  const handleCreateDeal = useCallback((stageId: number) => {
    // TODO: Implementar lógica para crear deal
    // Posiblemente abrir un modal o navegar a página de creación
    console.log('Create deal for stage:', stageId);
  }, []);

  // ============================================
  // LOADING & ERROR STATES
  // ============================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        message="Error al cargar el kanban" 
        onRetry={refetch}
      />
    );
  }

  if (!kanbanData?.pipeline?.stages || kanbanData.pipeline.stages.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-app-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-app-gray-300 mb-2">
          Sin Etapas Configuradas
        </h3>
        <p className="text-app-gray-400">
          Este pipeline no tiene etapas configuradas.
        </p>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="h-full overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Grid de columnas con scroll horizontal */}
        <div className="flex gap-6 h-full overflow-x-auto pb-6">
          {filteredStages.map((stage) => (
            <div 
              key={stage.stageId} 
              className="flex-shrink-0 w-80 flex flex-col"
            >
              {/* 🔧 REFACTORIZACIÓN QUIRÚRGICA: Reemplazar cabecera básica con componente avanzado */}
              <KanbanColumnHeader 
                stage={stage}
                onCreateDeal={handleCreateDeal}
                showMetrics={true}
                showBottleneckAlerts={true}
                showStageColor={true}
                compactMode={false}
              />

              {/* Lista de Deals - DROPPABLE ZONE - CON VALIDACIONES DEFENSIVAS */}
              <SortableContext 
                items={(stage.deals || []).map(d => d?.id).filter(id => id !== undefined)}
                strategy={verticalListSortingStrategy}
                id={stage.stageId?.toString() || 'unknown'}
              >
                <div 
                  className="min-h-[200px] space-y-3 flex-1 overflow-y-auto"
                  data-stage-id={stage.stageId}
                >
                  {(stage.deals || []).length === 0 ? (
                    <EmptyKanbanColumn 
                      stageName={stage.stageName || 'Etapa'}
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