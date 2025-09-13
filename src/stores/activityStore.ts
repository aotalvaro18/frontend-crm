// src/stores/activityStore.ts
// Store de Zustand para el ESTADO DE LA UI de la página de actividades
// NO gestiona datos del servidor. Delega esa responsabilidad a TanStack Query
// Siguiendo principio de responsabilidad única y tu guía arquitectónica
// 🔧 REPLICANDO: Estructura exacta de companyStore.ts (GOLDEN STANDARD)

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { ActivitySearchCriteria, ActivityDTO } from '@/types/activity.types';
import toast from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';
import { 
  activityApi, 
  handleActivityApiError
} from '@/services/api/activityApi';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
  CompleteActivityRequest,
  RescheduleActivityRequest,
  AssignActivityRequest
} from '@/types/activity.types';

// ============================================
// TYPES - Solo para UI state
// ============================================

interface ActivityUIState {
  // ============================================
  // FILTROS Y PAGINACIÓN
  // ============================================
  searchCriteria: ActivitySearchCriteria;
  currentPage: number;
  pageSize: number;
  
  // ============================================
  // SELECCIÓN PARA OPERACIONES MASIVAS
  // ============================================
  selectedActivityIds: Set<number>;
  
  // ============================================
  // UI ESPECÍFICO
  // ============================================
  isSelectionMode: boolean;
  viewMode: 'list' | 'timeline' | 'table' | 'calendar';
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  
  // ============================================
  // ESTADO DE OPERACIONES (MUTACIONES)
  // ============================================
  isCreating: boolean;
  updating: Set<number>;
  deleting: Set<number>;
  completing: Set<number>;
  rescheduling: Set<number>;
  assigning: Set<number>;
  
  // ============================================
  // ACCIONES - FILTROS Y PAGINACIÓN
  // ============================================
  setSearchCriteria: (criteria: ActivitySearchCriteria) => void;
  updateSearchCriteria: (partial: Partial<ActivitySearchCriteria>) => void;
  clearSearchCriteria: () => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToFirstPage: () => void;
  goToNextPage: (totalPages: number) => void;
  goToPreviousPage: () => void;
  
  // ============================================
  // ACCIONES - SELECCIÓN
  // ============================================
  toggleSelection: (activityId: number) => void;
  selectActivity: (activityId: number) => void;
  deselectActivity: (activityId: number) => void;
  setAllSelected: (activities: ActivityDTO[], shouldSelect: boolean) => void;
  selectAll: (activities: ActivityDTO[]) => void;
  deselectAll: () => void;
  clearSelection: () => void;
  
  // ============================================
  // ACCIONES - UI
  // ============================================
  setViewMode: (mode: 'list' | 'timeline' | 'table' | 'calendar') => void;
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
  createActivity: (request: CreateActivityRequest, onSuccess?: (newActivity: ActivityDTO) => void) => Promise<void>;
  updateActivity: (id: number, request: UpdateActivityRequest, onSuccess?: () => void) => Promise<void>;
  deleteActivity: (id: number, onSuccess?: () => void) => Promise<void>;
  completeActivity: (request: CompleteActivityRequest, onSuccess?: () => void) => Promise<void>;
  rescheduleActivity: (request: RescheduleActivityRequest, onSuccess?: () => void) => Promise<void>;
  assignActivity: (request: AssignActivityRequest, onSuccess?: () => void) => Promise<void>;
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
  selectedActivityIds: new Set<number>(),
  isSelectionMode: false,
  
  // UI
  viewMode: 'timeline' as const,
  sortBy: 'activityDate',
  sortDirection: 'desc' as const,
  
  // Operaciones
  isCreating: false,
  updating: new Set<number>(),
  deleting: new Set<number>(),
  completing: new Set<number>(),
  rescheduling: new Set<number>(),
  assigning: new Set<number>(),
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useActivityUIStore = create<ActivityUIState>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        ...initialState,

        // ============================================
        // ACCIONES DE MUTACIÓN (CUD)
        // ============================================
        
        createActivity: async (request, onSuccess) => {
          set({ isCreating: true });
          try {
            const newActivity = await activityApi.createActivity(request);
            // Invalida y refresca todo lo relacionado con actividades
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'activities'
            });
            toast.success('Actividad creada exitosamente');
            onSuccess?.(newActivity);
          } catch (error: unknown) {
            const errorInfo = handleActivityApiError(error);
            toast.error(errorInfo.message || 'Error al crear la actividad');
          } finally {
            set({ isCreating: false });
          }
        },

        updateActivity: async (id, request, onSuccess) => {
          set(state => ({ updating: new Set(state.updating).add(id) }));
          try {
            await activityApi.updateActivity(id, request);
            // Invalida y refresca todo lo relacionado con actividades
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'activities'
            });
            toast.success('Actividad actualizada exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            const errorInfo = handleActivityApiError(error);
            toast.error(errorInfo.message || 'Error al actualizar la actividad');
            throw error;
          } finally {
            set(state => {
              const newUpdating = new Set(state.updating);
              newUpdating.delete(id);
              return { updating: newUpdating };
            });
          }
        },

        deleteActivity: async (id, onSuccess) => {
          set(state => ({ deleting: new Set(state.deleting).add(id) }));
          try {
            await activityApi.deleteActivity(id);
            // Invalida y refresca todo lo relacionado con actividades
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'activities'
            });
            toast.success('Actividad eliminada exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            const errorInfo = handleActivityApiError(error);
            toast.error(errorInfo.message || 'Error al eliminar la actividad');
            throw error;
          } finally {
            set(state => {
              const newDeleting = new Set(state.deleting);
              newDeleting.delete(id);
              return { deleting: newDeleting };
            });
          }
        },

        completeActivity: async (request, onSuccess) => {
          set(state => ({ completing: new Set(state.completing).add(request.activityId) }));
          try {
            await activityApi.completeActivity(request);
            // Invalida y refresca todo lo relacionado con actividades
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'activities'
            });
            toast.success('Actividad marcada como completada');
            onSuccess?.();
          } catch (error: unknown) {
            const errorInfo = handleActivityApiError(error);
            toast.error(errorInfo.message || 'Error al completar la actividad');
            throw error;
          } finally {
            set(state => {
              const newCompleting = new Set(state.completing);
              newCompleting.delete(request.activityId);
              return { completing: newCompleting };
            });
          }
        },

        rescheduleActivity: async (request, onSuccess) => {
          set(state => ({ rescheduling: new Set(state.rescheduling).add(request.activityId) }));
          try {
            await activityApi.rescheduleActivity(request);
            // Invalida y refresca todo lo relacionado con actividades
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'activities'
            });
            toast.success('Actividad reagendada exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            const errorInfo = handleActivityApiError(error);
            toast.error(errorInfo.message || 'Error al reagendar la actividad');
            throw error;
          } finally {
            set(state => {
              const newRescheduling = new Set(state.rescheduling);
              newRescheduling.delete(request.activityId);
              return { rescheduling: newRescheduling };
            });
          }
        },

        assignActivity: async (request, onSuccess) => {
          set(state => ({ assigning: new Set(state.assigning).add(request.activityId) }));
          try {
            await activityApi.assignActivity(request);
            // Invalida y refresca todo lo relacionado con actividades
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'activities'
            });
            toast.success('Actividad asignada exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            const errorInfo = handleActivityApiError(error);
            toast.error(errorInfo.message || 'Error al asignar la actividad');
            throw error;
          } finally {
            set(state => {
              const newAssigning = new Set(state.assigning);
              newAssigning.delete(request.activityId);
              return { assigning: newAssigning };
            });
          }
        },

        // ============================================
        // FILTROS Y PAGINACIÓN
        // ============================================

        setSearchCriteria: (criteria) => 
          set({ 
            searchCriteria: criteria, 
            currentPage: 1 // Reset page on filter change
          }),

        updateSearchCriteria: (partial) => 
          set(state => ({ 
            searchCriteria: { ...state.searchCriteria, ...partial },
            currentPage: 1 // Reset page on filter change
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
            currentPage: 1 // Reset to first page when changing page size
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

        toggleSelection: (activityId) => 
          set(state => {
            const newSelection = new Set(state.selectedActivityIds);
            if (newSelection.has(activityId)) {
              newSelection.delete(activityId);
            } else {
              newSelection.add(activityId);
            }
            return { 
              selectedActivityIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        selectActivity: (activityId) => 
          set(state => {
            const newSelection = new Set(state.selectedActivityIds);
            newSelection.add(activityId);
            return { 
              selectedActivityIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        deselectActivity: (activityId) => 
          set(state => {
            const newSelection = new Set(state.selectedActivityIds);
            newSelection.delete(activityId);
            return { 
              selectedActivityIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        setAllSelected: (activities, shouldSelect) => 
          set(state => {
            const newSelection = new Set(state.selectedActivityIds);
            if (shouldSelect) {
              activities.forEach(activity => newSelection.add(activity.id));
            } else {
              activities.forEach(activity => newSelection.delete(activity.id));
            }
            return { 
              selectedActivityIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        selectAll: (activities) => 
          set(state => {
            const newSelection = new Set(state.selectedActivityIds);
            activities.forEach(activity => newSelection.add(activity.id));
            return { 
              selectedActivityIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        deselectAll: () => 
          set({ 
            selectedActivityIds: new Set(),
            isSelectionMode: false
          }),

        clearSelection: () => 
          set({ 
            selectedActivityIds: new Set(),
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
            currentPage: 1 // Reset page when sorting changes
          })),

        toggleSelectionMode: () => 
          set(state => ({ 
            isSelectionMode: !state.isSelectionMode,
            selectedActivityIds: !state.isSelectionMode ? state.selectedActivityIds : new Set()
          })),

        enableSelectionMode: () => 
          set({ isSelectionMode: true }),

        disableSelectionMode: () => 
          set({ 
            isSelectionMode: false,
            selectedActivityIds: new Set()
          }),

        // ============================================
        // UTILIDADES
        // ============================================

        reset: () => 
          set({
            ...initialState,
            selectedActivityIds: new Set(), // Ensure new Set instance
            updating: new Set<number>(),
            deleting: new Set<number>(),
            completing: new Set<number>(),
            rescheduling: new Set<number>(),
            assigning: new Set<number>(),
          }),

        resetFilters: () => 
          set({ 
            searchCriteria: {},
            currentPage: 1
          }),

        resetSelection: () => 
          set({ 
            selectedActivityIds: new Set(),
            isSelectionMode: false
          }),
      })
    ),
    {
      name: 'activity-ui-store',
      // Solo debugueamos el estado relevante para UI
      partialize: (state: ActivityUIState) => ({
        searchCriteria: state.searchCriteria,
        currentPage: state.currentPage,
        pageSize: state.pageSize,
        selectedActivityIds: Array.from(state.selectedActivityIds).slice(0, 5), // Solo primeros 5 para debug
        isSelectionMode: state.isSelectionMode,
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
      }),
    }
  )
);

// ============================================
// SELECTOR HOOKS ESPECIALIZADOS
// ============================================

/**
 * Hook para gestión de filtros y paginación
 */
export const useActivityFilters = () => {
  return useActivityUIStore(state => ({
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
    
    // Computed values
    hasActiveFilters: Object.keys(state.searchCriteria).length > 0,
    isFirstPage: state.currentPage === 1,
  }));
};

/**
 * Hook para gestión de selección masiva
 */
export const useActivitySelection = () => {
  return useActivityUIStore(state => ({
    selectedActivityIds: state.selectedActivityIds,
    isSelectionMode: state.isSelectionMode,
    
    toggleSelection: state.toggleSelection,
    selectActivity: state.selectActivity,
    deselectActivity: state.deselectActivity,
    selectAll: state.selectAll,
    deselectAll: state.deselectAll,
    clearSelection: state.clearSelection,
    enableSelectionMode: state.enableSelectionMode,
    disableSelectionMode: state.disableSelectionMode,
    toggleSelectionMode: state.toggleSelectionMode,
    
    // Computed values
    hasSelection: state.selectedActivityIds.size > 0,
    selectionCount: state.selectedActivityIds.size,
    canBulkUpdate: state.selectedActivityIds.size > 0 && state.selectedActivityIds.size <= 100,
    canBulkDelete: state.selectedActivityIds.size > 0 && state.selectedActivityIds.size <= 50,
  }));
};

/**
 * Hook para paginación simple
 */
export const useActivityPagination = () => {
  return useActivityUIStore(state => ({
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    
    setCurrentPage: state.setCurrentPage,
    setPageSize: state.setPageSize,
    goToFirstPage: state.goToFirstPage,
    goToNextPage: state.goToNextPage,
    goToPreviousPage: state.goToPreviousPage,
    
    // Helper functions
    isFirstPage: state.currentPage === 1,
  }));
};

/**
 * Hook para configuración de vista
 */
export const useActivityView = () => {
  return useActivityUIStore(state => ({
    viewMode: state.viewMode,
    sortBy: state.sortBy,
    sortDirection: state.sortDirection,
    
    setViewMode: state.setViewMode,
    setSorting: state.setSorting,
  }));
};

/**
 * Hook para obtener parámetros de consulta actuales
 */
export const useActivityQueryParams = () => {
  return useActivityUIStore(state => ({
    page: state.currentPage,
    size: state.pageSize,
    criteria: state.searchCriteria,
    sort: [`${state.sortBy},${state.sortDirection}`],
  }));
};

// ============================================
// UTILIDADES PARA TESTING Y DEBUG
// ============================================

/**
 * Hook para obtener métricas del estado UI
 */
export const useActivityUIMetrics = () => {
  return useActivityUIStore(state => ({
    filtersActive: Object.keys(state.searchCriteria).length,
    itemsSelected: state.selectedActivityIds.size,
    currentPageNumber: state.currentPage,
    itemsPerPage: state.pageSize,
    isInSelectionMode: state.isSelectionMode,
    currentView: state.viewMode,
    sortConfiguration: `${state.sortBy} ${state.sortDirection}`,
  }));
};

/**
 * Hook para las operaciones de CUD (Create, Update, Delete) y estados relacionados.
 * Los componentes usarán este hook para MODIFICAR datos.
 */
export const useActivityOperations = () => {
  const operations = useActivityUIStore(state => ({
    createActivity: state.createActivity,
    updateActivity: state.updateActivity,
    deleteActivity: state.deleteActivity,
    completeActivity: state.completeActivity,
    rescheduleActivity: state.rescheduleActivity,
    assignActivity: state.assignActivity,
    isCreating: state.isCreating,
    updating: state.updating,
    deleting: state.deleting,
    completing: state.completing,
    rescheduling: state.rescheduling,
    assigning: state.assigning,
  }));

  // Devolvemos las operaciones y funciones para chequear el estado por ID
  return {
    ...operations,
    isUpdating: (id: number) => operations.updating.has(id),
    isDeleting: (id: number) => operations.deleting.has(id),
    isCompleting: (id: number) => operations.completing.has(id),
    isRescheduling: (id: number) => operations.rescheduling.has(id),
    isAssigning: (id: number) => operations.assigning.has(id),
  };
};

// ============================================
// PERSISTENCIA (Opcional)
// ============================================

// Función para guardar filtros en localStorage (opcional)
export const saveFiltersToStorage = () => {
  const { searchCriteria, pageSize, viewMode, sortBy, sortDirection } = useActivityUIStore.getState();
  
  const filtersToSave = {
    searchCriteria,
    pageSize,
    viewMode,
    sortBy,
    sortDirection,
  };
  
  try {
    localStorage.setItem('activity-filters', JSON.stringify(filtersToSave));
  } catch (error) {
    console.warn('Could not save filters to localStorage:', error);
  }
};

// Función para cargar filtros desde localStorage (opcional)
export const loadFiltersFromStorage = () => {
  try {
    const savedFilters = localStorage.getItem('activity-filters');
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      useActivityUIStore.setState({
        searchCriteria: filters.searchCriteria || {},
        pageSize: filters.pageSize || 20,
        viewMode: filters.viewMode || 'timeline',
        sortBy: filters.sortBy || 'activityDate',
        sortDirection: filters.sortDirection || 'desc',
        currentPage: 1, // Always start on first page
      });
    }
  } catch (error) {
    console.warn('Could not load filters from localStorage:', error);
  }
};

// ============================================
// SUSCRIPCIONES AUTOMÁTICAS (Development)
// ============================================

if (import.meta.env.DEV) {
  // Auto-save filters when they change (development only)
  useActivityUIStore.subscribe(
    (state) => ({
      searchCriteria: state.searchCriteria,
      pageSize: state.pageSize,
      viewMode: state.viewMode,
      sortBy: state.sortBy,
      sortDirection: state.sortDirection,
    }),
    (current, previous) => {
      // Only save if filters actually changed
      if (JSON.stringify(current) !== JSON.stringify(previous)) {
        console.log('🔄 Activity filters changed, saving to localStorage');
        saveFiltersToStorage();
      }
    }
  );
}

export default useActivityUIStore;
