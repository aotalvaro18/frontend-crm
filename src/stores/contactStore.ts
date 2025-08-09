// src/stores/contactStore.ts
// Store de Zustand para el ESTADO DE LA UI de la página de contactos
// NO gestiona datos del servidor. Delega esa responsabilidad a TanStack Query
// Siguiendo principio de responsabilidad única y tu guía arquitectónica

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { ContactSearchCriteria, ContactDTO } from '@/types/contact.types';

// ============================================
// TYPES - Solo para UI state
// ============================================

interface ContactUIState {
  // ============================================
  // FILTROS Y PAGINACIÓN
  // ============================================
  searchCriteria: ContactSearchCriteria;
  currentPage: number;
  pageSize: number;
  
  // ============================================
  // SELECCIÓN PARA OPERACIONES MASIVAS
  // ============================================
  selectedContactIds: Set<number>;
  
  // ============================================
  // UI ESPECÍFICO
  // ============================================
  isSelectionMode: boolean;
  viewMode: 'list' | 'grid' | 'table';
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  
  // ============================================
  // ACCIONES - FILTROS Y PAGINACIÓN
  // ============================================
  setSearchCriteria: (criteria: ContactSearchCriteria) => void;
  updateSearchCriteria: (partial: Partial<ContactSearchCriteria>) => void;
  clearSearchCriteria: () => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToFirstPage: () => void;
  goToNextPage: (totalPages: number) => void;
  goToPreviousPage: () => void;
  
  // ============================================
  // ACCIONES - SELECCIÓN
  // ============================================
  toggleSelection: (contactId: number) => void;
  selectContact: (contactId: number) => void;
  deselectContact: (contactId: number) => void;
  setAllSelected: (contacts: ContactDTO[], shouldSelect: boolean) => void;
  selectAll: (contacts: ContactDTO[]) => void;
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
  selectedContactIds: new Set<number>(),
  isSelectionMode: false,
  
  // UI
  viewMode: 'table' as const,
  sortBy: 'lastName',
  sortDirection: 'asc' as const,
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useContactUIStore = create<ContactUIState>()(
  devtools(
    subscribeWithSelector(
      (set) => ({
        ...initialState,

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

        toggleSelection: (contactId) => 
          set(state => {
            const newSelection = new Set(state.selectedContactIds);
            if (newSelection.has(contactId)) {
              newSelection.delete(contactId);
            } else {
              newSelection.add(contactId);
            }
            return { 
              selectedContactIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        selectContact: (contactId) => 
          set(state => {
            const newSelection = new Set(state.selectedContactIds);
            newSelection.add(contactId);
            return { 
              selectedContactIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        deselectContact: (contactId) => 
          set(state => {
            const newSelection = new Set(state.selectedContactIds);
            newSelection.delete(contactId);
            return { 
              selectedContactIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        setAllSelected: (contacts, shouldSelect) => 
          set(state => {
            const newSelection = new Set(state.selectedContactIds);
            if (shouldSelect) {
              contacts.forEach(contact => newSelection.add(contact.id));
            } else {
              contacts.forEach(contact => newSelection.delete(contact.id));
            }
            return { 
              selectedContactIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        selectAll: (contacts) => 
          set(state => {
            const newSelection = new Set(state.selectedContactIds);
            contacts.forEach(contact => newSelection.add(contact.id));
            return { 
              selectedContactIds: newSelection,
              isSelectionMode: newSelection.size > 0
            };
          }),

        deselectAll: () => 
          set({ 
            selectedContactIds: new Set(),
            isSelectionMode: false
          }),

        clearSelection: () => 
          set({ 
            selectedContactIds: new Set(),
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
            selectedContactIds: !state.isSelectionMode ? state.selectedContactIds : new Set()
          })),

        enableSelectionMode: () => 
          set({ isSelectionMode: true }),

        disableSelectionMode: () => 
          set({ 
            isSelectionMode: false,
            selectedContactIds: new Set()
          }),

        // ============================================
        // UTILIDADES
        // ============================================

        reset: () => 
          set({
            ...initialState,
            selectedContactIds: new Set(), // Ensure new Set instance
          }),

        resetFilters: () => 
          set({ 
            searchCriteria: {},
            currentPage: 1
          }),

        resetSelection: () => 
          set({ 
            selectedContactIds: new Set(),
            isSelectionMode: false
          }),
      })
    ),
    {
      name: 'contact-ui-store',
      // Solo debugueamos el estado relevante para UI
      partialize: (state: ContactUIState) => ({
        searchCriteria: state.searchCriteria,
        currentPage: state.currentPage,
        pageSize: state.pageSize,
        selectedContactIds: Array.from(state.selectedContactIds).slice(0, 5), // Solo primeros 5 para debug
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
export const useContactFilters = () => {
  return useContactUIStore(state => ({
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
export const useContactSelection = () => {
  return useContactUIStore(state => ({
    selectedContactIds: state.selectedContactIds,
    isSelectionMode: state.isSelectionMode,
    
    toggleSelection: state.toggleSelection,
    selectContact: state.selectContact,
    deselectContact: state.deselectContact,
    selectAll: state.selectAll,
    deselectAll: state.deselectAll,
    clearSelection: state.clearSelection,
    enableSelectionMode: state.enableSelectionMode,
    disableSelectionMode: state.disableSelectionMode,
    toggleSelectionMode: state.toggleSelectionMode,
    
    // Computed values
    hasSelection: state.selectedContactIds.size > 0,
    selectionCount: state.selectedContactIds.size,
    canBulkUpdate: state.selectedContactIds.size > 0 && state.selectedContactIds.size <= 100,
    canBulkDelete: state.selectedContactIds.size > 0 && state.selectedContactIds.size <= 50,
  }));
};

/**
 * Hook para paginación simple
 */
export const useContactPagination = () => {
  return useContactUIStore(state => ({
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
export const useContactView = () => {
  return useContactUIStore(state => ({
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
export const useContactQueryParams = () => {
  return useContactUIStore(state => ({
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
export const useContactUIMetrics = () => {
  return useContactUIStore(state => ({
    filtersActive: Object.keys(state.searchCriteria).length,
    itemsSelected: state.selectedContactIds.size,
    currentPageNumber: state.currentPage,
    itemsPerPage: state.pageSize,
    isInSelectionMode: state.isSelectionMode,
    currentView: state.viewMode,
    sortConfiguration: `${state.sortBy} ${state.sortDirection}`,
  }));
};

// ============================================
// PERSISTENCIA (Opcional)
// ============================================

// Función para guardar filtros en localStorage (opcional)
export const saveFiltersToStorage = () => {
  const { searchCriteria, pageSize, viewMode, sortBy, sortDirection } = useContactUIStore.getState();
  
  const filtersToSave = {
    searchCriteria,
    pageSize,
    viewMode,
    sortBy,
    sortDirection,
  };
  
  try {
    localStorage.setItem('contact-filters', JSON.stringify(filtersToSave));
  } catch (error) {
    console.warn('Could not save filters to localStorage:', error);
  }
};

// Función para cargar filtros desde localStorage (opcional)
export const loadFiltersFromStorage = () => {
  try {
    const savedFilters = localStorage.getItem('contact-filters');
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      useContactUIStore.setState({
        searchCriteria: filters.searchCriteria || {},
        pageSize: filters.pageSize || 20,
        viewMode: filters.viewMode || 'table',
        sortBy: filters.sortBy || 'lastName',
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
  useContactUIStore.subscribe(
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
        console.log('🔄 Contact filters changed, saving to localStorage');
        saveFiltersToStorage();
      }
    }
  );
}

export default useContactUIStore;