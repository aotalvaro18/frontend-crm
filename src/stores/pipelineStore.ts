// src/stores/pipelineStore.ts
// ✅ PIPELINE STORE - Siguiendo exactamente el patrón de useCompanyUIStore
// Store de Zustand para el ESTADO DE LA UI de pipelines

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';
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
} from '@/types/pipeline.types';

// ============================================
// TYPES - Solo para UI state
// ============================================

interface PipelineUIState {
  // ============================================
  // FILTROS Y PAGINACIÓN
  // ============================================
  searchCriteria: PipelineSearchCriteria;
  currentPage: number;
  pageSize: number;
  
  // ============================================
  // SELECCIÓN PARA OPERACIONES MASIVAS
  // ============================================
  selectedPipelineIds: Set<number>;
  selectedStageIds: Set<number>;
  
  // ============================================
  // UI ESPECÍFICO
  // ============================================
  isSelectionMode: boolean;
  viewMode: 'list' | 'grid' | 'kanban';
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  
  // ============================================
  // ESTADO DE OPERACIONES (MUTACIONES) - PIPELINES
  // ============================================
  isCreating: boolean;
  updating: Set<number>;
  deleting: Set<number>;
  duplicating: Set<number>;
  
  // ============================================
  // ESTADO DE OPERACIONES - STAGES
  // ============================================
  isCreatingStage: boolean;
  updatingStages: Set<number>;
  deletingStages: Set<number>;
  reorderingStages: boolean;
  bulkOperationLoading: boolean;
  
  // ============================================
  // ACCIONES - FILTROS Y PAGINACIÓN
  // ============================================
  setSearchCriteria: (criteria: PipelineSearchCriteria) => void;
  updateSearchCriteria: (partial: Partial<PipelineSearchCriteria>) => void;
  clearSearchCriteria: () => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToFirstPage: () => void;
  goToNextPage: (totalPages: number) => void;
  goToPreviousPage: () => void;
  
  // ============================================
  // ACCIONES - SELECCIÓN PIPELINES
  // ============================================
  togglePipelineSelection: (pipelineId: number) => void;
  selectPipeline: (pipelineId: number) => void;
  deselectPipeline: (pipelineId: number) => void;
  setAllPipelinesSelected: (pipelines: PipelineDTO[], shouldSelect: boolean) => void;
  selectAllPipelines: (pipelines: PipelineDTO[]) => void;
  deselectAllPipelines: () => void;
  clearPipelineSelection: () => void;
  
  // ============================================
  // ACCIONES - SELECCIÓN STAGES
  // ============================================
  toggleStageSelection: (stageId: number) => void;
  selectStage: (stageId: number) => void;
  deselectStage: (stageId: number) => void;
  selectAllStages: (stageIds: number[]) => void;
  deselectAllStages: () => void;
  clearStageSelection: () => void;
  
  // ============================================
  // ACCIONES - UI
  // ============================================
  setViewMode: (mode: 'list' | 'grid' | 'kanban') => void;
  setSorting: (sortBy: string, direction?: 'asc' | 'desc') => void;
  toggleSelectionMode: () => void;
  enableSelectionMode: () => void;
  disableSelectionMode: () => void;
  
  // ============================================
  // ACCIONES - UTILIDADES
  // ============================================
  reset: () => void;
  resetFilters: () => void;
  resetSelection: () => void;
  
  // ============================================
  // ACCIONES DE MUTACIÓN - PIPELINES
  // ============================================
  createPipeline: (request: CreatePipelineRequest, onSuccess?: (newPipeline: PipelineDTO) => void) => Promise<void>;
  updatePipeline: (id: number, request: UpdatePipelineRequest, onSuccess?: () => void) => Promise<void>;
  deletePipeline: (id: number, onSuccess?: () => void) => Promise<void>;
  duplicatePipeline: (id: number, newName: string, onSuccess?: (newPipeline: PipelineDTO) => void) => Promise<void>;
  
  // ============================================
  // ACCIONES DE MUTACIÓN - STAGES
  // ============================================
  createStage: (request: CreatePipelineStageRequest, onSuccess?: (newStage: PipelineStageDTO) => void) => Promise<void>;
  updateStage: (id: number, request: UpdatePipelineStageRequest, onSuccess?: () => void) => Promise<void>;
  deleteStage: (id: number, onSuccess?: () => void) => Promise<void>;
  reorderStages: (request: ReorderPipelineStagesRequest, onSuccess?: () => void) => Promise<void>;
  
  // ============================================
  // OPERACIONES MASIVAS
  // ============================================
  bulkDeletePipelines: () => Promise<void>;
  bulkDeleteStages: () => Promise<void>;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  // Filtros y paginación
  searchCriteria: {},
  currentPage: 1,
  pageSize: 20,
  
  // Selección
  selectedPipelineIds: new Set<number>(),
  selectedStageIds: new Set<number>(),
  isSelectionMode: false,
  
  // UI
  viewMode: 'kanban' as const, // Default a kanban para pipelines
  sortBy: 'name',
  sortDirection: 'asc' as const,
  
  // Operaciones - Pipelines
  isCreating: false,
  updating: new Set<number>(),
  deleting: new Set<number>(),
  duplicating: new Set<number>(),
  
  // Operaciones - Stages
  isCreatingStage: false,
  updatingStages: new Set<number>(),
  deletingStages: new Set<number>(),
  reorderingStages: false,
  bulkOperationLoading: false,
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const usePipelineStore = create<PipelineUIState>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        ...initialState,

        // ============================================
        // ACCIONES DE MUTACIÓN - PIPELINES
        // ============================================
        
        createPipeline: async (request, onSuccess) => {
          console.log('🔥 usePipelineStore.createPipeline llamado con:', request);
          set({ isCreating: true });
          
          try {
            const newPipeline = await pipelineApi.createPipeline(request);
            console.log('🔥 Pipeline creado exitosamente:', newPipeline);
            
            // Invalidar y refrescar todo lo relacionado con pipelines
            await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'pipelines'
            });
            
            toast.success('Pipeline creado exitosamente');
            onSuccess?.(newPipeline);
          } catch (error: unknown) {
            console.error('🔥 Error en createPipeline:', error);
            const errorMessage = handlePipelineApiError ? handlePipelineApiError(error).message : 'Error al crear el pipeline';
            toast.error(errorMessage);
            throw error;
          } finally {
            set({ isCreating: false });
          }
        },

        updatePipeline: async (id, request, onSuccess) => {
          set(state => ({ updating: new Set(state.updating).add(id) }));
          
          try {
            await pipelineApi.updatePipeline(id, request);
            
            // Invalidar y refrescar todo lo relacionado con pipelines
            await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'pipelines'
            });
            
            toast.success('Pipeline actualizado exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            const errorMessage = handlePipelineApiError ? handlePipelineApiError(error).message : 'Error al actualizar el pipeline';
            toast.error(errorMessage);
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
            
            // Invalidar y refrescar todo lo relacionado con pipelines
            await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
            
            toast.success('Pipeline eliminado exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            const errorMessage = handlePipelineApiError ? handlePipelineApiError(error).message : 'Error al eliminar el pipeline';
            toast.error(errorMessage);
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
            const errorMessage = handlePipelineApiError ? handlePipelineApiError(error).message : 'Error al duplicar el pipeline';
            toast.error(errorMessage);
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
        // ACCIONES DE MUTACIÓN - STAGES
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
            const errorMessage = handlePipelineApiError ? handlePipelineApiError(error).message : 'Error al crear la etapa';
            toast.error(errorMessage);
            throw error;
          } finally {
            set({ isCreatingStage: false });
          }
        },

        updateStage: async (id, request, onSuccess) => {
          set(state => ({ updatingStages: new Set(state.updatingStages).add(id) }));
          
          try {
            const updatedStage = await pipelineApi.updateStage(id, request);
            
            // Invalidar cachés relacionadas
            await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
            await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
            
            if (updatedStage.pipelineId) {
              await queryClient.invalidateQueries({ queryKey: ['pipelines', 'detail', updatedStage.pipelineId] });
            }
            
            toast.success('Etapa actualizada exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            const errorMessage = handlePipelineApiError ? handlePipelineApiError(error).message : 'Error al actualizar la etapa';
            toast.error(errorMessage);
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
            
            toast.success('Etapa eliminada exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            const errorMessage = handlePipelineApiError ? handlePipelineApiError(error).message : 'Error al eliminar la etapa';
            toast.error(errorMessage);
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
            await pipelineApi.reorderStages(request);
            
            // Invalidar caché del pipeline y sus etapas
            await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
            await queryClient.invalidateQueries({ queryKey: ['pipelines', 'detail', request.pipelineId] });
            
            toast.success('Etapas reordenadas exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            const errorMessage = handlePipelineApiError ? handlePipelineApiError(error).message : 'Error al reordenar las etapas';
            toast.error(errorMessage);
            throw error;
          } finally {
            set({ reorderingStages: false });
          }
        },

        // ============================================
        // FILTROS Y PAGINACIÓN
        // ============================================

        setSearchCriteria: (criteria) => 
          set({ 
            searchCriteria: criteria, 
            currentPage: 1
          }),

        updateSearchCriteria: (partial) => 
          set(state => ({ 
            searchCriteria: { ...state.searchCriteria, ...partial },
            currentPage: 1
          })),

        clearSearchCriteria: () => 
          set({ 
            searchCriteria: {}, 
            currentPage: 1 
          }),

        setCurrentPage: (page) => 
          set({ currentPage: Math.max(1, page) }),

        setPageSize: (size) => 
          set({ 
            pageSize: Math.max(1, size), 
            currentPage: 1
          }),

        goToFirstPage: () => 
          set({ currentPage: 1 }),

        goToNextPage: (totalPages) => 
          set(state => ({ 
            currentPage: Math.min(state.currentPage + 1, totalPages) 
          })),

        goToPreviousPage: () => 
          set(state => ({ 
            currentPage: Math.max(1, state.currentPage - 1) 
          })),

        // ============================================
        // SELECCIÓN - PIPELINES
        // ============================================

        togglePipelineSelection: (pipelineId) => 
          set(state => {
            const newSelection = new Set(state.selectedPipelineIds);
            if (newSelection.has(pipelineId)) {
              newSelection.delete(pipelineId);
            } else {
              newSelection.add(pipelineId);
            }
            return { 
              selectedPipelineIds: newSelection,
              isSelectionMode: newSelection.size > 0 || state.selectedStageIds.size > 0
            };
          }),

        selectPipeline: (pipelineId) => 
          set(state => {
            const newSelection = new Set(state.selectedPipelineIds);
            newSelection.add(pipelineId);
            return { 
              selectedPipelineIds: newSelection,
              isSelectionMode: newSelection.size > 0 || state.selectedStageIds.size > 0
            };
          }),

        deselectPipeline: (pipelineId) => 
          set(state => {
            const newSelection = new Set(state.selectedPipelineIds);
            newSelection.delete(pipelineId);
            return { 
              selectedPipelineIds: newSelection,
              isSelectionMode: newSelection.size > 0 || state.selectedStageIds.size > 0
            };
          }),

        setAllPipelinesSelected: (pipelines, shouldSelect) => 
          set(state => {
            const newSelection = new Set(state.selectedPipelineIds);
            if (shouldSelect) {
              pipelines.forEach(pipeline => newSelection.add(pipeline.id));
            } else {
              pipelines.forEach(pipeline => newSelection.delete(pipeline.id));
            }
            return { 
              selectedPipelineIds: newSelection,
              isSelectionMode: newSelection.size > 0 || state.selectedStageIds.size > 0
            };
          }),

        selectAllPipelines: (pipelines) => 
          set(state => {
            const newSelection = new Set(state.selectedPipelineIds);
            pipelines.forEach(pipeline => newSelection.add(pipeline.id));
            return { 
              selectedPipelineIds: newSelection,
              isSelectionMode: newSelection.size > 0 || state.selectedStageIds.size > 0
            };
          }),

        deselectAllPipelines: () => 
          set(state => ({ 
            selectedPipelineIds: new Set(),
            isSelectionMode: state.selectedStageIds.size > 0
          })),

        clearPipelineSelection: () => 
          set(state => ({ 
            selectedPipelineIds: new Set(),
            isSelectionMode: state.selectedStageIds.size > 0
          })),

        // ============================================
        // SELECCIÓN - STAGES
        // ============================================

        toggleStageSelection: (stageId) => 
          set(state => {
            const newSelection = new Set(state.selectedStageIds);
            if (newSelection.has(stageId)) {
              newSelection.delete(stageId);
            } else {
              newSelection.add(stageId);
            }
            return { 
              selectedStageIds: newSelection,
              isSelectionMode: state.selectedPipelineIds.size > 0 || newSelection.size > 0
            };
          }),

        selectStage: (stageId) => 
          set(state => {
            const newSelection = new Set(state.selectedStageIds);
            newSelection.add(stageId);
            return { 
              selectedStageIds: newSelection,
              isSelectionMode: state.selectedPipelineIds.size > 0 || newSelection.size > 0
            };
          }),

        deselectStage: (stageId) => 
          set(state => {
            const newSelection = new Set(state.selectedStageIds);
            newSelection.delete(stageId);
            return { 
              selectedStageIds: newSelection,
              isSelectionMode: state.selectedPipelineIds.size > 0 || newSelection.size > 0
            };
          }),

        selectAllStages: (stageIds) => 
          set(state => {
            const newSelection = new Set([...state.selectedStageIds, ...stageIds]);
            return { 
              selectedStageIds: newSelection,
              isSelectionMode: state.selectedPipelineIds.size > 0 || newSelection.size > 0
            };
          }),

        deselectAllStages: () => 
          set(state => ({ 
            selectedStageIds: new Set(),
            isSelectionMode: state.selectedPipelineIds.size > 0
          })),

        clearStageSelection: () => 
          set(state => ({ 
            selectedStageIds: new Set(),
            isSelectionMode: state.selectedPipelineIds.size > 0
          })),

        // ============================================
        // UI ACTIONS
        // ============================================

        setViewMode: (mode) => 
          set({ viewMode: mode }),

        setSorting: (sortBy, direction) => 
          set(state => ({
            sortBy,
            sortDirection: direction || (state.sortBy === sortBy && state.sortDirection === 'asc' ? 'desc' : 'asc'),
            currentPage: 1
          })),

        toggleSelectionMode: () => 
          set(state => ({ 
            isSelectionMode: !state.isSelectionMode,
            selectedPipelineIds: !state.isSelectionMode ? state.selectedPipelineIds : new Set(),
            selectedStageIds: !state.isSelectionMode ? state.selectedStageIds : new Set()
          })),

        enableSelectionMode: () => 
          set({ isSelectionMode: true }),

        disableSelectionMode: () => 
          set({ 
            isSelectionMode: false,
            selectedPipelineIds: new Set(),
            selectedStageIds: new Set()
          }),

        // ============================================
        // OPERACIONES MASIVAS
        // ============================================

        bulkDeletePipelines: async () => {
          const { selectedPipelineIds } = get();
          if (selectedPipelineIds.size === 0) return;
          
          set({ bulkOperationLoading: true });
          try {
            // Eliminar pipelines uno por uno si no hay bulk API
            const promises = Array.from(selectedPipelineIds).map(id => pipelineApi.deletePipeline(id));
            await Promise.all(promises);
            
            await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
            set({ selectedPipelineIds: new Set() });
            toast.success(`${selectedPipelineIds.size} pipelines eliminados.`);
          } catch (error: unknown) {
            const errorMessage = handlePipelineApiError ? handlePipelineApiError(error).message : 'Error en operación masiva';
            toast.error(errorMessage);
          } finally {
            set({ bulkOperationLoading: false });
          }
        },

        bulkDeleteStages: async () => {
          const { selectedStageIds } = get();
          if (selectedStageIds.size === 0) return;
          
          set({ bulkOperationLoading: true });
          try {
            const promises = Array.from(selectedStageIds).map(id => pipelineApi.deleteStage(id));
            await Promise.all(promises);
            
            await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
            await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
            set({ selectedStageIds: new Set() });
            toast.success(`${selectedStageIds.size} etapas eliminadas.`);
          } catch (error: unknown) {
            const errorMessage = handlePipelineApiError ? handlePipelineApiError(error).message : 'Error en operación masiva';
            toast.error(errorMessage);
          } finally {
            set({ bulkOperationLoading: false });
          }
        },

        // ============================================
        // UTILIDADES
        // ============================================

        reset: () => 
          set({
            ...initialState,
            selectedPipelineIds: new Set(),
            selectedStageIds: new Set(),
            updating: new Set<number>(),
            deleting: new Set<number>(),
            duplicating: new Set<number>(),
            updatingStages: new Set<number>(),
            deletingStages: new Set<number>(),
          }),

        resetFilters: () => 
          set({ 
            searchCriteria: {},
            currentPage: 1
          }),

        resetSelection: () => 
          set({ 
            selectedPipelineIds: new Set(),
            selectedStageIds: new Set(),
            isSelectionMode: false
          }),
      })
    ),
    {
      name: 'pipeline-store',
      partialize: (state: PipelineUIState) => ({
        searchCriteria: state.searchCriteria,
        currentPage: state.currentPage,
        pageSize: state.pageSize,
        selectedPipelineIds: Array.from(state.selectedPipelineIds).slice(0, 5),
        selectedStageIds: Array.from(state.selectedStageIds).slice(0, 5),
        isSelectionMode: state.isSelectionMode,
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
      }),
    }
  )
);

// ============================================
// HOOK PARA OPERACIONES DE PIPELINES
// ============================================

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

  return {
    ...operations,
    isUpdating: (id: number) => operations.updating.has(id),
    isDeleting: (id: number) => operations.deleting.has(id),
    isDuplicating: (id: number) => operations.duplicating.has(id),
  };
};

// ============================================
// HOOKS ESPECIALIZADOS - SIGUIENDO PATRÓN DE COMPANY
// ============================================

export const usePipelineFilters = () => {
  return usePipelineStore(state => ({
    searchCriteria: state.searchCriteria,
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    sortBy: state.sortBy,
    sortDirection: state.sortDirection,
    
    setSearchCriteria: state.setSearchCriteria,
    updateSearchCriteria: state.updateSearchCriteria,
    clearSearchCriteria: state.clearSearchCriteria,
    setCurrentPage: state.setCurrentPage,
    setPageSize: state.setPageSize,
    setSorting: state.setSorting,
    resetFilters: state.resetFilters,
    
    hasActiveFilters: Object.keys(state.searchCriteria).length > 0,
    isFirstPage: state.currentPage === 1,
  }));
};

export const usePipelineSelection = () => {
  return usePipelineStore(state => ({
    selectedPipelineIds: state.selectedPipelineIds,
    selectedStageIds: state.selectedStageIds,
    isSelectionMode: state.isSelectionMode,
    
    // Pipeline selection
    togglePipelineSelection: state.togglePipelineSelection,
    selectPipeline: state.selectPipeline,
    deselectPipeline: state.deselectPipeline,
    selectAllPipelines: state.selectAllPipelines,
    deselectAllPipelines: state.deselectAllPipelines,
    
    // Stage selection
    toggleStageSelection: state.toggleStageSelection,
    selectStage: state.selectStage,
    deselectStage: state.deselectStage,
    selectAllStages: state.selectAllStages,
    deselectAllStages: state.deselectAllStages,
    
    // General
    enableSelectionMode: state.enableSelectionMode,
    disableSelectionMode: state.disableSelectionMode,
    toggleSelectionMode: state.toggleSelectionMode,
    resetSelection: state.resetSelection,
    
    // Computed values
    hasPipelineSelection: state.selectedPipelineIds.size > 0,
    hasStageSelection: state.selectedStageIds.size > 0,
    hasAnySelection: state.selectedPipelineIds.size > 0 || state.selectedStageIds.size > 0,
    pipelineSelectionCount: state.selectedPipelineIds.size,
    stageSelectionCount: state.selectedStageIds.size,
  }));
};

export default usePipelineStore;
