// src/stores/dealStore.ts
// Store de Zustand para el ESTADO DE LA UI de la página de oportunidades
// NO gestiona datos del servidor. Delega esa responsabilidad a TanStack Query
// Siguiendo principio de responsabilidad única y tu guía arquitectónica
// 🔧 REPLICANDO: Estructura exacta de companyStore.ts (GOLDEN STANDARD)

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { DealSearchCriteria, DealDTO } from '@/types/deal.types';
import toast from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';
import { 
  dealApi, 
  handleDealApiError
} from '@/services/api/dealApi';
import type {
  CreateDealRequest,
  UpdateDealRequest,
  MoveDealToStageRequest,
  CloseDealWonRequest,
  CloseDealLostRequest,
  ReopenDealRequest
} from '@/types/deal.types';

// ============================================
// TYPES - Solo para UI state
// ============================================

interface DealUIState {
  // ============================================
  // FILTROS Y PAGINACIÓN
  // ============================================
  searchCriteria: DealSearchCriteria;
  currentPage: number;
  pageSize: number;
  
  // ============================================
  // SELECCIÓN PARA OPERACIONES MASIVAS
  // ============================================
  selectedDealIds: Set<number>;
  
  // ============================================
  // UI ESPECÍFICO
  // ============================================
  isSelectionMode: boolean;
  viewMode: 'list' | 'grid' | 'table' | 'kanban';
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  
  // ============================================
  // ESTADO DE OPERACIONES (MUTACIONES)
  // ============================================
  isCreating: boolean;
  updating: Set<number>;
  deleting: Set<number>;
  
  // Estado específico para Pipeline/Kanban
  movingToStage: Set<number>;
  closingWon: Set<number>;
  closingLost: Set<number>;
  reopening: Set<number>;
  bulkOperationLoading: boolean;
  
  // ============================================
  // ACCIONES - FILTROS Y PAGINACIÓN
  // ============================================
  setSearchCriteria: (criteria: DealSearchCriteria) => void;
  updateSearchCriteria: (partial: Partial<DealSearchCriteria>) => void;
  clearSearchCriteria: () => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToFirstPage: () => void;
  goToNextPage: (totalPages: number) => void;
  goToPreviousPage: () => void;
  
  // ============================================
  // ACCIONES - SELECCIÓN
  // ============================================
  toggleSelection: (dealId: number) => void;
  selectDeal: (dealId: number) => void;
  deselectDeal: (dealId: number) => void;
  setAllSelected: (deals: DealDTO[], shouldSelect: boolean) => void;
  selectAll: (deals: DealDTO[]) => void;
  deselectAll: () => void;
  clearSelection: () => void;
  
  // ============================================
  // ACCIONES - UI
  // ============================================
  setViewMode: (mode: 'list' | 'grid' | 'table' | 'kanban') => void;
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
  // ACCIONES DE MUTACIÓN
  // ============================================
  createDeal: (request: CreateDealRequest, onSuccess?: (newDeal: DealDTO) => void) => Promise<void>;
  updateDeal: (id: number, request: UpdateDealRequest, onSuccess?: () => void) => Promise<void>;
  deleteDeal: (id: number, onSuccess?: () => void) => Promise<void>;
  
  // Acciones específicas de Pipeline/Kanban
  moveDealToStage: (dealId: number, newStageId: number, newProbability?: number, onSuccess?: () => void) => Promise<void>;
  closeDealWon: (request: CloseDealWonRequest, onSuccess?: () => void) => Promise<void>;
  closeDealLost: (request: CloseDealLostRequest, onSuccess?: () => void) => Promise<void>;
  reopenDeal: (request: ReopenDealRequest, onSuccess?: () => void) => Promise<void>;
  
  // Operaciones masivas
  bulkUpdateDeals: (updates: Partial<Pick<DealDTO, 'stageId' | 'priority' | 'type' | 'ownerCognitoSub'>>) => Promise<void>;
  bulkDeleteDeals: () => Promise<void>;
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
  selectedDealIds: new Set<number>(),
  isSelectionMode: false,
  
  // UI
  viewMode: 'kanban' as const, // Default a kanban para deals
  sortBy: 'name',
  sortDirection: 'asc' as const,
  
  // Operaciones
  isCreating: false,
  updating: new Set<number>(),
  deleting: new Set<number>(),
  movingToStage: new Set<number>(),
  closingWon: new Set<number>(),
  closingLost: new Set<number>(),
  reopening: new Set<number>(),
  bulkOperationLoading: false,
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useDealStore = create<DealUIState>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        ...initialState,

        // ============================================
        // ACCIONES DE MUTACIÓN (CUD)
        // ============================================
        
        createDeal: async (request, onSuccess) => {
          set({ isCreating: true });
          try {
            const newDeal = await dealApi.createDeal(request);
            // Invalidar TODO lo relacionado con deals
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'deals'
            });
            toast.success('Oportunidad creada exitosamente');
            onSuccess?.(newDeal);
          } catch (error: unknown) {
            const errorInfo = handleDealApiError(error);
            toast.error(errorInfo.message);
          } finally {
            set({ isCreating: false });
          }
        },

        updateDeal: async (id, request, onSuccess) => {
          set(state => ({ updating: new Set(state.updating).add(id) }));
          try {
            await dealApi.updateDeal(id, request);
            // Invalidar TODO y refetch específico
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'deals'
            });
            toast.success('Oportunidad actualizada exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            const errorInfo = handleDealApiError(error);
            toast.error(errorInfo.message);
            throw error;
          } finally {
            set(state => {
              const newUpdating = new Set(state.updating);
              newUpdating.delete(id);
              return { updating: newUpdating };
            });
          }
        },

        deleteDeal: async (id, onSuccess) => {
          set(state => ({ deleting: new Set(state.deleting).add(id) }));
          try {
            await dealApi.deleteDeal(id);
            // Invalidar TODO y refetch específico
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'deals'
            });
            toast.success('Oportunidad eliminada exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            const errorInfo = handleDealApiError(error);
            toast.error(errorInfo.message);
            throw error;
          } finally {
            set(state => {
              const newDeleting = new Set(state.deleting);
              newDeleting.delete(id);
              return { deleting: newDeleting };
            });
          }
        },

        // ============================================
        // ACCIONES ESPECÍFICAS DE PIPELINE/KANBAN
        // ============================================

        moveDealToStage: async (dealId, newStageId, newProbability, onSuccess) => {
          set(state => ({ movingToStage: new Set(state.movingToStage).add(dealId) }));
          try {
            await dealApi.moveDealToStage(dealId, newStageId, newProbability);
            // Invalidar datos de Kanban y deal específico
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'deals'
            });
            toast.success('Oportunidad movida exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            const errorInfo = handleDealApiError(error);
            toast.error(errorInfo.message);
            throw error;
          } finally {
            set(state => {
              const newMoving = new Set(state.movingToStage);
              newMoving.delete(dealId);
              return { movingToStage: newMoving };
            });
          }
        },

        closeDealWon: async (request, onSuccess) => {
          set(state => ({ closingWon: new Set(state.closingWon).add(request.dealId) }));
          try {
            await dealApi.closeDealWon(request);
            // Invalidar todas las queries relevantes
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'deals'
            });
            toast.success('🎉 Oportunidad cerrada como ganada');
            onSuccess?.();
          } catch (error: unknown) {
            const errorInfo = handleDealApiError(error);
            toast.error(errorInfo.message);
            throw error;
          } finally {
            set(state => {
              const newClosing = new Set(state.closingWon);
              newClosing.delete(request.dealId);
              return { closingWon: newClosing };
            });
          }
        },

        closeDealLost: async (request, onSuccess) => {
          set(state => ({ closingLost: new Set(state.closingLost).add(request.dealId) }));
          try {
            await dealApi.closeDealLost(request);
            // Invalidar todas las queries relevantes
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'deals'
            });
            toast.success('Oportunidad cerrada como perdida');
            onSuccess?.();
          } catch (error: unknown) {
            const errorInfo = handleDealApiError(error);
            toast.error(errorInfo.message);
            throw error;
          } finally {
            set(state => {
              const newClosing = new Set(state.closingLost);
              newClosing.delete(request.dealId);
              return { closingLost: newClosing };
            });
          }
        },

        reopenDeal: async (request, onSuccess) => {
          set(state => ({ reopening: new Set(state.reopening).add(request.dealId) }));
          try {
            await dealApi.reopenDeal(request);
            // Invalidar todas las queries relevantes
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'deals'
            });
            toast.success('Oportunidad reabierta exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            const errorInfo = handleDealApiError(error);
            toast.error(errorInfo.message);
            throw error;
          } finally {
            set(state => {
              const newReopening = new Set(state.reopening);
              newReopening.delete(request.dealId);
              return { reopening: newReopening };
            });
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
        // SELECCIÓN
        // ============================================

        toggleSelection: (dealId) => 
          set(state => {
            const newSelection = new Set(state.selectedDealIds);
            if (newSelection.has(dealId)) {
              newSelection.delete(dealId);
            } else {
              newSelection.add(dealId);
            }
            return { 
              selectedDealIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        selectDeal: (dealId) => 
          set(state => {
            const newSelection = new Set(state.selectedDealIds);
            newSelection.add(dealId);
            return { 
              selectedDealIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        deselectDeal: (dealId) => 
          set(state => {
            const newSelection = new Set(state.selectedDealIds);
            newSelection.delete(dealId);
            return { 
              selectedDealIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        setAllSelected: (deals, shouldSelect) => 
          set(state => {
            const newSelection = new Set(state.selectedDealIds);
            if (shouldSelect) {
              deals.forEach(deal => newSelection.add(deal.id));
            } else {
              deals.forEach(deal => newSelection.delete(deal.id));
            }
            return { 
              selectedDealIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        selectAll: (deals) => 
          set(state => {
            const newSelection = new Set(state.selectedDealIds);
            deals.forEach(deal => newSelection.add(deal.id));
            return { 
              selectedDealIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        deselectAll: () => 
          set({ 
            selectedDealIds: new Set(),
            isSelectionMode: false
          }),

        clearSelection: () => 
          set({ 
            selectedDealIds: new Set(),
            isSelectionMode: false
          }),

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
            selectedDealIds: !state.isSelectionMode ? state.selectedDealIds : new Set()
          })),

        enableSelectionMode: () => 
          set({ isSelectionMode: true }),

        disableSelectionMode: () => 
          set({ 
            isSelectionMode: false,
            selectedDealIds: new Set()
          }),

        // ============================================
        // OPERACIONES MASIVAS
        // ============================================

        bulkUpdateDeals: async (updates) => {
            const { selectedDealIds } = get();
            if (selectedDealIds.size === 0) return;
            
            set({ bulkOperationLoading: true }); // Inicia la carga
            try {
              await dealApi.bulkUpdateDeals(Array.from(selectedDealIds), updates);
              await queryClient.invalidateQueries({ queryKey: ['deals'] });
              set({ selectedDealIds: new Set(), isSelectionMode: false }); // Limpia y desactiva el modo selección
              toast.success(`${selectedDealIds.size} oportunidades actualizadas.`);
            } catch (error: unknown) {
              const errorInfo = handleDealApiError(error);
              toast.error(errorInfo.message);
            } finally {
              set({ bulkOperationLoading: false }); // Finaliza la carga
            }
          },

          bulkDeleteDeals: async () => {
            const { selectedDealIds } = get();
            if (selectedDealIds.size === 0) return;
            
            set({ bulkOperationLoading: true }); // Inicia la carga
            try {
              await dealApi.bulkDeleteDeals(Array.from(selectedDealIds));
              await queryClient.invalidateQueries({ queryKey: ['deals'] });
              set({ selectedDealIds: new Set(), isSelectionMode: false }); // Limpia y desactiva el modo selección
              toast.success(`${selectedDealIds.size} oportunidades eliminadas.`);
            } catch (error: unknown) {
              const errorInfo = handleDealApiError(error);
              toast.error(errorInfo.message);
            } finally {
              set({ bulkOperationLoading: false }); // Finaliza la carga
            }
          },

        // ============================================
        // UTILIDADES
        // ============================================

        reset: () => 
          set({
            ...initialState,
            selectedDealIds: new Set(),
            updating: new Set<number>(),
            deleting: new Set<number>(),
            movingToStage: new Set<number>(),
            closingWon: new Set<number>(),
            closingLost: new Set<number>(),
            reopening: new Set<number>(),
          }),

        resetFilters: () => 
          set({ 
            searchCriteria: {},
            currentPage: 1
          }),

        resetSelection: () => 
          set({ 
            selectedDealIds: new Set(),
            isSelectionMode: false
          }),
      })
    ),
    {
      name: 'deal-store',
      partialize: (state: DealUIState) => ({
        searchCriteria: state.searchCriteria,
        currentPage: state.currentPage,
        pageSize: state.pageSize,
        selectedDealIds: Array.from(state.selectedDealIds).slice(0, 5),
        isSelectionMode: state.isSelectionMode,
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
      }),
    }
  )
);

// ============================================
// HOOK PARA OPERACIONES DE DEALS
// ============================================

export const useDealOperations = () => {
  const operations = useDealStore(state => ({
    createDeal: state.createDeal,
    updateDeal: state.updateDeal,
    deleteDeal: state.deleteDeal,
    moveDealToStage: state.moveDealToStage,
    closeDealWon: state.closeDealWon,
    closeDealLost: state.closeDealLost,
    reopenDeal: state.reopenDeal,
    isCreating: state.isCreating,
    updating: state.updating,
    deleting: state.deleting,
    movingToStage: state.movingToStage,
    closingWon: state.closingWon,
    closingLost: state.closingLost,
    reopening: state.reopening,
  }));

  return {
    ...operations,
    isUpdating: (id: number) => operations.updating.has(id),
    isDeleting: (id: number) => operations.deleting.has(id),
    isMovingToStage: (id: number) => operations.movingToStage.has(id),
    isClosingWon: (id: number) => operations.closingWon.has(id),
    isClosingLost: (id: number) => operations.closingLost.has(id),
    isReopening: (id: number) => operations.reopening.has(id),
  };
};

// ============================================
// HOOKS ESPECIALIZADOS - SIGUIENDO PATRÓN DE COMPANY
// ============================================

export const useDealFilters = () => {
  return useDealStore(state => ({
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

export const useDealSelection = () => {
  return useDealStore(state => ({
    selectedDealIds: state.selectedDealIds,
    isSelectionMode: state.isSelectionMode,
    
    toggleSelection: state.toggleSelection,
    selectDeal: state.selectDeal,
    deselectDeal: state.deselectDeal,
    selectAll: state.selectAll,
    deselectAll: state.deselectAll,
    clearSelection: state.clearSelection,
    enableSelectionMode: state.enableSelectionMode,
    disableSelectionMode: state.disableSelectionMode,
    toggleSelectionMode: state.toggleSelectionMode,
    
    hasSelection: state.selectedDealIds.size > 0,
    selectionCount: state.selectedDealIds.size,
    canBulkUpdate: state.selectedDealIds.size > 0 && state.selectedDealIds.size <= 100,
    canBulkDelete: state.selectedDealIds.size > 0 && state.selectedDealIds.size <= 50,
  }));
};

export const useDealPagination = () => {
  return useDealStore(state => ({
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    
    setCurrentPage: state.setCurrentPage,
    setPageSize: state.setPageSize,
    goToFirstPage: state.goToFirstPage,
    goToNextPage: state.goToNextPage,
    goToPreviousPage: state.goToPreviousPage,
    
    isFirstPage: state.currentPage === 1,
  }));
};

export const useDealView = () => {
  return useDealStore(state => ({
    viewMode: state.viewMode,
    sortBy: state.sortBy,
    sortDirection: state.sortDirection,
    
    setViewMode: state.setViewMode,
    setSorting: state.setSorting,
  }));
};

/**
 * ✅ HOOK ESPECIALIZADO PARA OPERACIONES MASIVAS
 * Combina el estado de selección con las acciones de mutación en lote.
 */
export const useBulkDealOperations = () => {
    return useDealStore(state => ({
      // Estado de selección
      selectedDealIds: state.selectedDealIds,
      hasSelection: state.selectedDealIds.size > 0,
      selectionCount: state.selectedDealIds.size,
      
      // Acciones de selección
      selectAll: state.selectAll,
      deselectAll: state.deselectAll,
      
      // Acciones de mutación en lote
      bulkUpdateDeals: state.bulkUpdateDeals,
      bulkDeleteDeals: state.bulkDeleteDeals,
      
      // ✅ CORREGIDO: Accede directamente a la propiedad que ahora sí existe
      bulkOperationLoading: state.bulkOperationLoading,
    }));
  };

export const useDealQueryParams = () => {
  return useDealStore(state => ({
    page: state.currentPage,
    size: state.pageSize,
    criteria: state.searchCriteria,
    sort: [`${state.sortBy},${state.sortDirection}`],
  }));
};

export default useDealStore;
