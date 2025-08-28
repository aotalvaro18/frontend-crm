// src/stores/companyStore.ts
// Store de Zustand para el ESTADO DE LA UI de la página de empresas
// NO gestiona datos del servidor. Delega esa responsabilidad a TanStack Query
// Siguiendo principio de responsabilidad única y tu guía arquitectónica

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { CompanySearchCriteria, CompanyDTO } from '@/types/company.types';
import toast from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';
import { 
  companyApi, 
  handleCompanyApiError // Asegúrate de tener un manejador de errores similar para company
} from '@/services/api/companyApi';
import type {
  CreateCompanyRequest,
  UpdateCompanyRequest
} from '@/types/company.types';

// ============================================
// TYPES - Solo para UI state
// ============================================

interface CompanyUIState {
  // ============================================
  // FILTROS Y PAGINACIÓN
  // ============================================
  searchCriteria: CompanySearchCriteria;
  currentPage: number;
  pageSize: number;
  
  // ============================================
  // SELECCIÓN PARA OPERACIONES MASIVAS
  // ============================================
  selectedCompanyIds: Set<number>;
  
  // ============================================
  // UI ESPECÍFICO
  // ============================================
  isSelectionMode: boolean;
  viewMode: 'list' | 'grid' | 'table';
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  
  // ============================================
  // ESTADO DE OPERACIONES (MUTACIONES)
  // ============================================
  isCreating: boolean;
  updating: Set<number>;
  deleting: Set<number>;
  
  // ============================================
  // ACCIONES - FILTROS Y PAGINACIÓN
  // ============================================
  setSearchCriteria: (criteria: CompanySearchCriteria) => void;
  updateSearchCriteria: (partial: Partial<CompanySearchCriteria>) => void;
  clearSearchCriteria: () => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToFirstPage: () => void;
  goToNextPage: (totalPages: number) => void;
  goToPreviousPage: () => void;
  
  // ============================================
  // ACCIONES - SELECCIÓN
  // ============================================
  toggleSelection: (companyId: number) => void;
  selectCompany: (companyId: number) => void;
  deselectCompany: (companyId: number) => void;
  setAllSelected: (companies: CompanyDTO[], shouldSelect: boolean) => void;
  selectAll: (companies: CompanyDTO[]) => void;
  deselectAll: () => void;
  clearSelection: () => void;
  
  // ============================================
  // ACCIONES - UI
  // ============================================
  setViewMode: (mode: 'list' | 'grid' | 'table') => void;
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
  createCompany: (request: CreateCompanyRequest, onSuccess?: (newCompany: CompanyDTO) => void) => Promise<void>;
  updateCompany: (id: number, request: UpdateCompanyRequest, onSuccess?: () => void) => Promise<void>;
  deleteCompany: (id: number, onSuccess?: () => void) => Promise<void>;
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
  selectedCompanyIds: new Set<number>(),
  isSelectionMode: false,
  
  // UI
  viewMode: 'table' as const,
  sortBy: 'name',
  sortDirection: 'asc' as const,
  
  // Operaciones
  isCreating: false,
  updating: new Set<number>(),
  deleting: new Set<number>(),
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useCompanyUIStore = create<CompanyUIState>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        ...initialState,

        // ============================================
        // ACCIONES DE MUTACIÓN (CUD)
        // ============================================
        
        createCompany: async (request, onSuccess) => {
          set({ isCreating: true });
          try {
            const newCompany = await companyApi.createCompany(request);
            // Invalida y refresca todo lo relacionado con empresas
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'companies'
            });
            toast.success('Empresa creada exitosamente');
            onSuccess?.(newCompany);
          } catch (error: unknown) {
            // Asegúrate de tener un handleCompanyApiError o usa un mensaje genérico
            toast.error('Error al crear la empresa'); 
          } finally {
            set({ isCreating: false });
          }
        },

        updateCompany: async (id, request, onSuccess) => {
          set(state => ({ updating: new Set(state.updating).add(id) }));
          try {
            await companyApi.updateCompany(id, request);
            // Invalida y refresca todo lo relacionado con empresas
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'companies'
            });
            toast.success('Empresa actualizada exitosamente');
            onSuccess?.();
          } catch (error: unknown) {
            toast.error('Error al actualizar la empresa');
            throw error;
          } finally {
            set(state => {
              const newUpdating = new Set(state.updating);
              newUpdating.delete(id);
              return { updating: newUpdating };
            });
          }
        },

        deleteCompany: async (id, onSuccess) => {
          set(state => ({ deleting: new Set(state.deleting).add(id) }));
          try {
            await companyApi.deleteCompany(id);
            // Invalida y refresca todo lo relacionado con empresas
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'companies'
            });
            onSuccess?.();
          } catch (error: unknown) {
            toast.error('Error al eliminar la empresa');
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

        toggleSelection: (companyId) => 
          set(state => {
            const newSelection = new Set(state.selectedCompanyIds);
            if (newSelection.has(companyId)) {
              newSelection.delete(companyId);
            } else {
              newSelection.add(companyId);
            }
            return { 
              selectedCompanyIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        selectCompany: (companyId) => 
          set(state => {
            const newSelection = new Set(state.selectedCompanyIds);
            newSelection.add(companyId);
            return { 
              selectedCompanyIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        deselectCompany: (companyId) => 
          set(state => {
            const newSelection = new Set(state.selectedCompanyIds);
            newSelection.delete(companyId);
            return { 
              selectedCompanyIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        setAllSelected: (companies, shouldSelect) => 
          set(state => {
            const newSelection = new Set(state.selectedCompanyIds);
            if (shouldSelect) {
              companies.forEach(company => newSelection.add(company.id));
            } else {
              companies.forEach(company => newSelection.delete(company.id));
            }
            return { 
              selectedCompanyIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        selectAll: (companies) => 
          set(state => {
            const newSelection = new Set(state.selectedCompanyIds);
            companies.forEach(company => newSelection.add(company.id));
            return { 
              selectedCompanyIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        deselectAll: () => 
          set({ 
            selectedCompanyIds: new Set(),
            isSelectionMode: false
          }),

        clearSelection: () => 
          set({ 
            selectedCompanyIds: new Set(),
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
            selectedCompanyIds: !state.isSelectionMode ? state.selectedCompanyIds : new Set()
          })),

        enableSelectionMode: () => 
          set({ isSelectionMode: true }),

        disableSelectionMode: () => 
          set({ 
            isSelectionMode: false,
            selectedCompanyIds: new Set()
          }),

        // ============================================
        // UTILIDADES
        // ============================================

        reset: () => 
          set({
            ...initialState,
            selectedCompanyIds: new Set(), // Ensure new Set instance
            updating: new Set<number>(),
            deleting: new Set<number>(),
          }),

        resetFilters: () => 
          set({ 
            searchCriteria: {},
            currentPage: 1
          }),

        resetSelection: () => 
          set({ 
            selectedCompanyIds: new Set(),
            isSelectionMode: false
          }),
      })
    ),
    {
      name: 'company-ui-store',
      // Solo debugueamos el estado relevante para UI
      partialize: (state: CompanyUIState) => ({
        searchCriteria: state.searchCriteria,
        currentPage: state.currentPage,
        pageSize: state.pageSize,
        selectedCompanyIds: Array.from(state.selectedCompanyIds).slice(0, 5), // Solo primeros 5 para debug
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
export const useCompanyFilters = () => {
  return useCompanyUIStore(state => ({
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
export const useCompanySelection = () => {
  return useCompanyUIStore(state => ({
    selectedCompanyIds: state.selectedCompanyIds,
    isSelectionMode: state.isSelectionMode,
    
    toggleSelection: state.toggleSelection,
    selectCompany: state.selectCompany,
    deselectCompany: state.deselectCompany,
    selectAll: state.selectAll,
    deselectAll: state.deselectAll,
    clearSelection: state.clearSelection,
    enableSelectionMode: state.enableSelectionMode,
    disableSelectionMode: state.disableSelectionMode,
    toggleSelectionMode: state.toggleSelectionMode,
    
    // Computed values
    hasSelection: state.selectedCompanyIds.size > 0,
    selectionCount: state.selectedCompanyIds.size,
    canBulkUpdate: state.selectedCompanyIds.size > 0 && state.selectedCompanyIds.size <= 100,
    canBulkDelete: state.selectedCompanyIds.size > 0 && state.selectedCompanyIds.size <= 50,
  }));
};

/**
 * Hook para paginación simple
 */
export const useCompanyPagination = () => {
  return useCompanyUIStore(state => ({
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
export const useCompanyView = () => {
  return useCompanyUIStore(state => ({
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
export const useCompanyQueryParams = () => {
  return useCompanyUIStore(state => ({
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
export const useCompanyUIMetrics = () => {
  return useCompanyUIStore(state => ({
    filtersActive: Object.keys(state.searchCriteria).length,
    itemsSelected: state.selectedCompanyIds.size,
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
export const useCompanyOperations = () => {
  const operations = useCompanyUIStore(state => ({
    createCompany: state.createCompany,
    updateCompany: state.updateCompany,
    deleteCompany: state.deleteCompany,
    isCreating: state.isCreating,
    updating: state.updating,
    deleting: state.deleting,
  }));

  // Devolvemos las operaciones y funciones para chequear el estado por ID
  return {
    ...operations,
    isUpdating: (id: number) => operations.updating.has(id),
    isDeleting: (id: number) => operations.deleting.has(id),
  };
};

// ============================================
// PERSISTENCIA (Opcional)
// ============================================

// Función para guardar filtros en localStorage (opcional)
export const saveFiltersToStorage = () => {
  const { searchCriteria, pageSize, viewMode, sortBy, sortDirection } = useCompanyUIStore.getState();
  
  const filtersToSave = {
    searchCriteria,
    pageSize,
    viewMode,
    sortBy,
    sortDirection,
  };
  
  try {
    localStorage.setItem('company-filters', JSON.stringify(filtersToSave));
  } catch (error) {
    console.warn('Could not save filters to localStorage:', error);
  }
};

// Función para cargar filtros desde localStorage (opcional)
export const loadFiltersFromStorage = () => {
  try {
    const savedFilters = localStorage.getItem('company-filters');
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      useCompanyUIStore.setState({
        searchCriteria: filters.searchCriteria || {},
        pageSize: filters.pageSize || 20,
        viewMode: filters.viewMode || 'table',
        sortBy: filters.sortBy || 'name',
        sortDirection: filters.sortDirection || 'asc',
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
  useCompanyUIStore.subscribe(
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
        console.log('🔄 Company filters changed, saving to localStorage');
        saveFiltersToStorage();
      }
    }
  );
}

export default useCompanyUIStore;