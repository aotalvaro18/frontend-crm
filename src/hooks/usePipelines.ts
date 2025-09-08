// src/hooks/usePipelines.ts
// ✅ Enterprise pipeline hooks - VERSIÓN FINAL CON REACT QUERY COMO FUENTE DE VERDAD
// El store de Zustand maneja el estado de la UI y las acciones (mutaciones).
// React Query maneja los datos del servidor (fetching, caching, invalidation).

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';
import { useQuery } from '@tanstack/react-query';

import { 
  pipelineApi,
  handlePipelineApiError  
} from '@/services/api/pipelineApi';

import type {
  PipelineDTO,
  PipelineStageDTO,
  CreatePipelineRequest,
  UpdatePipelineRequest,
  CreatePipelineStageRequest,
  UpdatePipelineStageRequest,
  ReorderPipelineStagesRequest,
  PipelineSearchCriteria,
  PipelineStageSearchCriteria,
} from '@/types/pipeline.types';

// ============================================
// REACT QUERY KEYS (ÚNICA FUENTE DE VERDAD PARA CACHÉ)
// ============================================
// Exportamos las llaves para que los componentes puedan usarlas con useQuery.

export const PIPELINES_LIST_QUERY_KEY = (criteria: PipelineSearchCriteria = {}, page = 0) => 
  ['pipelines', 'list', { ...criteria, page }];
export const PIPELINE_DETAIL_QUERY_KEY = (id: number | null) => ['pipelines', 'detail', id];
export const PIPELINE_STATS_QUERY_KEY = ['pipelines', 'stats'];
export const PIPELINE_METRICS_QUERY_KEY = (startDate?: string, endDate?: string) => 
  ['pipelines', 'metrics', { startDate, endDate }];

// Keys para Pipeline Stages
export const PIPELINE_STAGES_LIST_QUERY_KEY = (criteria: PipelineStageSearchCriteria = {}, page = 0) => 
  ['pipeline-stages', 'list', { ...criteria, page }];
export const PIPELINE_STAGE_DETAIL_QUERY_KEY = (id: number | null) => ['pipeline-stages', 'detail', id];

// Keys para tipos y templates
export const PIPELINE_TYPES_QUERY_KEY = ['pipelines', 'types'];
export const PIPELINE_TEMPLATES_QUERY_KEY = ['pipelines', 'templates'];

// ============================================
// PIPELINE STORE STATE (Simplificado: solo estado de UI y acciones)
// ============================================

interface PipelineState {
  // Estado de operaciones - Pipelines
  isCreating: boolean;
  updating: Set<number>;
  deleting: Set<number>;
  duplicating: Set<number>;
  
  // Estado de operaciones - Stages
  isCreatingStage: boolean;
  updatingStages: Set<number>;
  deletingStages: Set<number>;
  reorderingStages: boolean;
  
  // Estado para selecciones y operaciones en lote
  selectedPipelineIds: Set<number>;
  selectedStageIds: Set<number>;
  bulkOperationLoading: boolean;
  
  // Acciones de Pipeline (mutaciones y manejo de estado de UI)
  createPipeline: (request: CreatePipelineRequest, onSuccess?: (newPipeline: PipelineDTO) => void) => Promise<void>;
  updatePipeline: (id: number, request: UpdatePipelineRequest, onSuccess?: () => void) => Promise<void>;
  deletePipeline: (id: number, onSuccess?: () => void) => Promise<void>;
  duplicatePipeline: (id: number, newName: string, onSuccess?: (newPipeline: PipelineDTO) => void) => Promise<void>;

  // Acciones de Pipeline Stage
  createStage: (request: CreatePipelineStageRequest, onSuccess?: (newStage: PipelineStageDTO) => void) => Promise<void>;
  updateStage: (id: number, request: UpdatePipelineStageRequest, onSuccess?: () => void) => Promise<void>;
  deleteStage: (id: number, onSuccess?: () => void) => Promise<void>;
  reorderStages: (request: ReorderPipelineStagesRequest, onSuccess?: () => void) => Promise<void>;

  // Selección - Pipelines
  selectPipeline: (id: number) => void;
  selectAllPipelines: (pipelineIds: number[]) => void;
  deselectPipeline: (id: number) => void;
  deselectAllPipelines: () => void;
  
  // Selección - Stages
  selectStage: (id: number) => void;
  selectAllStages: (stageIds: number[]) => void;
  deselectStage: (id: number) => void;
  deselectAllStages: () => void;
  
  // Operaciones masivas
  bulkDeletePipelines: () => Promise<void>;
  bulkDeleteStages: () => Promise<void>;
}

// ============================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================

export const usePipelineStore = create<PipelineState>()(
  devtools(
    (set, get) => ({
      // INITIAL STATE
      isCreating: false,
      updating: new Set(),
      deleting: new Set(),
      duplicating: new Set(),
      isCreatingStage: false,
      updatingStages: new Set(),
      deletingStages: new Set(),
      reorderingStages: false,
      selectedPipelineIds: new Set(),
      selectedStageIds: new Set(),
      bulkOperationLoading: false,

      // ============================================
      // ACCIONES DE MUTACIÓN - PIPELINES (CUD)
      // ============================================
      
      createPipeline: async (request, onSuccess) => {
        set({ isCreating: true });
        try {
          const newPipeline = await pipelineApi.createPipeline(request);
          // Invalidar TODO lo relacionado con pipelines
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          // Forzar refetch inmediato
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'pipelines'
          });
          toast.success('Pipeline creado exitosamente');
          onSuccess?.(newPipeline);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set({ isCreating: false });
        }
      },

      updatePipeline: async (id, request, onSuccess) => {
        set(state => ({ updating: new Set(state.updating).add(id) }));
        try {
          const updatedPipeline = await pipelineApi.updatePipeline(id, request);
          // Invalidar caché de lista y detalle específico
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          await queryClient.invalidateQueries({ queryKey: PIPELINE_DETAIL_QUERY_KEY(id) });
          toast.success('Pipeline actualizado exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newUpdating = new Set(state.updating);
            newUpdating.delete(id);
            return { updating: newUpdating };
          });
        }
      },

      deletePipeline: async (id, onSuccess) => {
        set(state => ({ deleting: new Set(state.deleting).add(id) }));
        try {
          await pipelineApi.deletePipeline(id);
          // Invalidar caché
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          // Remover caché específica del pipeline eliminado
          queryClient.removeQueries({ queryKey: PIPELINE_DETAIL_QUERY_KEY(id) });
          //toast.success('Pipeline eliminado exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newDeleting = new Set(state.deleting);
            newDeleting.delete(id);
            return { deleting: newDeleting };
          });
        }
      },

      duplicatePipeline: async (id, newName, onSuccess) => {
        set(state => ({ duplicating: new Set(state.duplicating).add(id) }));
        try {
          const newPipeline = await pipelineApi.duplicatePipeline(id, newName);
          // Invalidar caché
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          toast.success(`Pipeline "${newName}" duplicado exitosamente`);
          onSuccess?.(newPipeline);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newDuplicating = new Set(state.duplicating);
            newDuplicating.delete(id);
            return { duplicating: newDuplicating };
          });
        }
      },

      // ============================================
      // ACCIONES DE MUTACIÓN - PIPELINE STAGES (CUD)
      // ============================================

      createStage: async (request, onSuccess) => {
        set({ isCreatingStage: true });
        try {
          const newStage = await pipelineApi.createStage(request);
          // Invalidar caché de stages y pipeline padre
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          
          toast.success('Etapa creada exitosamente');
          onSuccess?.(newStage);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set({ isCreatingStage: false });
        }
      },

      updateStage: async (id, request, onSuccess) => {
        set(state => ({ updatingStages: new Set(state.updatingStages).add(id) }));
        try {
          // 1. Llama a la API. La respuesta 'updatedStage' SÍ contiene el pipelineId
          const updatedStage = await pipelineApi.updateStage(id, request);
          
          // 2. Invalida las cachés relacionadas con la etapa misma
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: PIPELINE_STAGE_DETAIL_QUERY_KEY(id) });

          // 3. ✅ LA SOLUCIÓN: Usa el pipelineId de la RESPUESTA para invalidar al padre
          if (updatedStage.pipelineId) {
            await queryClient.invalidateQueries({ queryKey: PIPELINE_DETAIL_QUERY_KEY(updatedStage.pipelineId) });
          }
          
          toast.success('Etapa actualizada exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newUpdating = new Set(state.updatingStages);
            newUpdating.delete(id);
            return { updatingStages: newUpdating };
          });
        }
      },

      deleteStage: async (id, onSuccess) => {
        set(state => ({ deletingStages: new Set(state.deletingStages).add(id) }));
        try {
          await pipelineApi.deleteStage(id);
          // Invalidar caché
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          queryClient.removeQueries({ queryKey: PIPELINE_STAGE_DETAIL_QUERY_KEY(id) });
          toast.success('Etapa eliminada exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newDeleting = new Set(state.deletingStages);
            newDeleting.delete(id);
            return { deletingStages: newDeleting };
          });
        }
      },

      reorderStages: async (request, onSuccess) => {
        set({ reorderingStages: true });
        try {
          const updatedPipeline = await pipelineApi.reorderStages(request);
          // Invalidar caché del pipeline y sus etapas
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: PIPELINE_DETAIL_QUERY_KEY(request.pipelineId) });
          toast.success('Etapas reordenadas exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set({ reorderingStages: false });
        }
      },

      // ============================================
      // BULK & SELECTION ACTIONS - PIPELINES
      // ============================================
      
      selectPipeline: (id) => set(state => ({ selectedPipelineIds: new Set(state.selectedPipelineIds).add(id) })),
      deselectPipeline: (id) => set(state => {
        const newSelection = new Set(state.selectedPipelineIds);
        newSelection.delete(id);
        return { selectedPipelineIds: newSelection };
      }),
      selectAllPipelines: (pipelineIds) => set({ selectedPipelineIds: new Set(pipelineIds) }),
      deselectAllPipelines: () => set({ selectedPipelineIds: new Set() }),

      // ============================================
      // BULK & SELECTION ACTIONS - STAGES
      // ============================================

      selectStage: (id) => set(state => ({ selectedStageIds: new Set(state.selectedStageIds).add(id) })),
      deselectStage: (id) => set(state => {
        const newSelection = new Set(state.selectedStageIds);
        newSelection.delete(id);
        return { selectedStageIds: newSelection };
      }),
      selectAllStages: (stageIds) => set({ selectedStageIds: new Set(stageIds) }),
      deselectAllStages: () => set({ selectedStageIds: new Set() }),

      // ============================================
      // BULK OPERATIONS
      // ============================================

      bulkDeletePipelines: async () => {
        const { selectedPipelineIds } = get();
        if (selectedPipelineIds.size === 0) return;
        set({ bulkOperationLoading: true });
        try {
          await pipelineApi.bulkDeletePipelines(Array.from(selectedPipelineIds));
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          set({ selectedPipelineIds: new Set() });
          toast.success(`${selectedPipelineIds.size} pipelines eliminados.`);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
        } finally {
          set({ bulkOperationLoading: false });
        }
      },

      bulkDeleteStages: async () => {
        const { selectedStageIds } = get();
        if (selectedStageIds.size === 0) return;
        set({ bulkOperationLoading: true });
        try {
          // Eliminar etapas una por una (el API no tiene bulk delete para stages)
          const promises = Array.from(selectedStageIds).map(id => pipelineApi.deleteStage(id));
          await Promise.all(promises);
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          set({ selectedStageIds: new Set() });
          toast.success(`${selectedStageIds.size} etapas eliminadas.`);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
        } finally {
          set({ bulkOperationLoading: false });
        }
      },
    }),
    {
      name: 'pipeline-store',
    }
  )
);

// ============================================
// HOOKS ESPECIALIZADOS (Exportados para uso en componentes)
// ============================================

/**
 * Hook para las operaciones de CUD (Create, Update, Delete) y estados relacionados.
 * Los componentes usarán este hook para MODIFICAR datos.
 */
export const usePipelineOperations = () => {
  const operations = usePipelineStore(state => ({
    createPipeline: state.createPipeline,
    updatePipeline: state.updatePipeline,
    deletePipeline: state.deletePipeline,
    duplicatePipeline: state.duplicatePipeline,
    isCreating: state.isCreating,
    updating: state.updating,
    deleting: state.deleting,
    duplicating: state.duplicating,
  }));

  // Devolvemos las operaciones y funciones para chequear el estado por ID
  return {
    ...operations,
    isUpdating: (id: number) => operations.updating.has(id),
    isDeleting: (id: number) => operations.deleting.has(id),
    isDuplicating: (id: number) => operations.duplicating.has(id),
  };
};

/**
 * Hook para las operaciones de etapas (stages)
 */
export const usePipelineStageOperations = () => {
  const operations = usePipelineStore(state => ({
    createStage: state.createStage,
    updateStage: state.updateStage,
    deleteStage: state.deleteStage,
    reorderStages: state.reorderStages,
    isCreatingStage: state.isCreatingStage,
    updatingStages: state.updatingStages,
    deletingStages: state.deletingStages,
    reorderingStages: state.reorderingStages,
  }));

  return {
    ...operations,
    isUpdatingStage: (id: number) => operations.updatingStages.has(id),
    isDeletingStage: (id: number) => operations.deletingStages.has(id),
  };
};

/**
 * Hook para obtener pipeline por ID
 */
export const usePipelineById = (id: number) => {
  return useQuery({
    queryKey: PIPELINE_DETAIL_QUERY_KEY(id),
    queryFn: () => pipelineApi.getPipelineById(id),
    enabled: !!id && id > 0,
  });
};

/**
 * Hook para obtener etapa por ID
 */
export const usePipelineStageById = (id: number) => {
  return useQuery({
    queryKey: PIPELINE_STAGE_DETAIL_QUERY_KEY(id),
    queryFn: () => pipelineApi.getStageById(id),
    enabled: !!id && id > 0,
  });
};

/**
 * Hook para las operaciones en lote (Bulk) y estados de selección.
 * Los componentes usarán este hook para seleccionar múltiples pipelines y hacer operaciones masivas.
 */
export const useBulkPipelineOperations = () => {
  return usePipelineStore(state => ({
    selectedPipelineIds: state.selectedPipelineIds,
    selectedStageIds: state.selectedStageIds,
    bulkOperationLoading: state.bulkOperationLoading,
    selectPipeline: state.selectPipeline,
    deselectPipeline: state.deselectPipeline,
    selectAllPipelines: state.selectAllPipelines,
    deselectAllPipelines: state.deselectAllPipelines,
    selectStage: state.selectStage,
    deselectStage: state.deselectStage,
    selectAllStages: state.selectAllStages,
    deselectAllStages: state.deselectAllStages,
    bulkDeletePipelines: state.bulkDeletePipelines,
    bulkDeleteStages: state.bulkDeleteStages,
  }));
};

// ============================================
// HOOKS DE CONSULTA (REACT QUERY)
// ============================================

/**
 * Hook para obtener estadísticas de pipelines
 */
export const usePipelineStats = () => {
  return useQuery({
    queryKey: PIPELINE_STATS_QUERY_KEY,
    queryFn: () => pipelineApi.getPipelineStats(),
  });
};

/**
 * Hook para obtener tipos de pipeline
 */
export const usePipelineTypes = () => {
  return useQuery({
    queryKey: PIPELINE_TYPES_QUERY_KEY,
    queryFn: () => pipelineApi.getActivePipelineTypes(),
    staleTime: 1000 * 60 * 5, // 5 minutos - los tipos no cambian frecuentemente
  });
};

/**
 * Hook para obtener templates de pipeline
 */
export const usePipelineTemplates = () => {
  return useQuery({
    queryKey: PIPELINE_TEMPLATES_QUERY_KEY,
    queryFn: () => pipelineApi.getPipelineTemplates(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
