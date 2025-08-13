// src/hooks/usePagination.ts
// ✅ USE PAGINATION HOOK - ENTERPRISE GRADE
// Type-safe + Mobile-optimized + Performance-focused + Backend-compatible

import { useState, useEffect, useMemo, useCallback } from 'react';

// ============================================
// TYPES - REUTILIZACIÓN DE ARQUITECTURA
// ============================================

import type { 
  PageRequest, 
  PageResponse, 
  PaginationInfo 
} from '@/types/common.types';

/**
 * Configuración del hook usePagination
 */
export interface PaginationConfig {
  /**
   * Número total de elementos
   */
  totalItems: number;
  
  /**
   * Tamaño de página por defecto
   * @default 25
   */
  defaultPageSize?: number;
  
  /**
   * Página inicial (0-based para compatibilidad con backend)
   * @default 0
   */
  initialPage?: number;
  
  /**
   * Tamaños de página permitidos
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: number[];
  
  /**
   * Máximo número de páginas a mostrar en navegación
   * @default 7
   */
  maxVisiblePages?: number;
  
  /**
   * Si debe resetear a página 1 cuando cambia totalItems
   * @default true
   */
  resetOnTotalChange?: boolean;
  
  /**
   * Callback cuando cambia la página
   */
  onPageChange?: (page: number) => void;
  
  /**
   * Callback cuando cambia el tamaño de página
   */
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * Estado de paginación con información completa
 */
export interface PaginationState {
  // Página actual (0-based para backend compatibility)
  currentPage: number;
  
  // Tamaño de página actual
  pageSize: number;
  
  // Total de elementos
  totalItems: number;
  
  // Total de páginas calculado
  totalPages: number;
  
  // Información para UI (1-based)
  paginationInfo: PaginationInfo;
  
  // Navegación
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  
  // Páginas visibles para navegación
  visiblePages: number[];
  
  // Range de elementos en página actual
  startItem: number;
  endItem: number;
  
  // Estados para UI
  isFirstPage: boolean;
  isLastPage: boolean;
}

/**
 * Acciones de paginación
 */
export interface PaginationActions {
  // Navegación básica
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // Navegación por dirección
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  
  // Navegación relativa
  goToPage: (page: number) => void; // 1-based para UI
  
  // Utilidades
  resetToFirstPage: () => void;
  canGoToPage: (page: number) => boolean;
  
  // Para integración con backend
  getPageRequest: () => PageRequest;
  updateFromPageResponse: (response: PageResponse<any>) => void;
}

/**
 * Return completo del hook
 */
export interface UsePaginationReturn extends PaginationState, PaginationActions {}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calcula páginas visibles para navegación
 */
function calculateVisiblePages(
  currentPage: number,
  totalPages: number,
  maxVisible: number
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(currentPage + 1 - half, 1);
  let end = start + maxVisible - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(end - maxVisible + 1, 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Convierte PageResponse del backend a información de UI
 */
function pageResponseToPaginationInfo(response: PageResponse<any>): PaginationInfo {
  return {
    currentPage: response.number + 1, // Convert to 1-based
    totalPages: response.totalPages,
    totalItems: response.totalElements,
    itemsPerPage: response.size,
    hasNext: !response.last,
    hasPrevious: !response.first,
    startItem: response.number * response.size + 1,
    endItem: response.number * response.size + response.numberOfElements,
  };
}

/**
 * Valida número de página
 */
function validatePageNumber(page: number, totalPages: number): number {
  return Math.max(0, Math.min(page, totalPages - 1));
}

// ============================================
// MAIN HOOK
// ============================================

/**
 * Hook completo de paginación enterprise-grade
 * Compatible con backend Spring Boot PageRequest/PageResponse
 */
export function usePagination(config: PaginationConfig): UsePaginationReturn {
  // ============================================
  // CONFIGURATION
  // ============================================
  
  const {
    totalItems,
    defaultPageSize = 25,
    initialPage = 0,
    pageSizeOptions = [10, 25, 50, 100],
    maxVisiblePages = 7,
    resetOnTotalChange = true,
    onPageChange,
    onPageSizeChange,
  } = config;

  // ============================================
  // STATE
  // ============================================
  
  const [currentPage, setCurrentPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(() => {
    // Validar que defaultPageSize esté en las opciones
    return pageSizeOptions.includes(defaultPageSize) 
      ? defaultPageSize 
      : pageSizeOptions[0];
  });

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  const validatedCurrentPage = useMemo(() => {
    return validatePageNumber(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const paginationInfo = useMemo((): PaginationInfo => ({
    currentPage: validatedCurrentPage + 1, // Convert to 1-based for UI
    totalPages,
    totalItems,
    itemsPerPage: pageSize,
    hasNext: validatedCurrentPage < totalPages - 1,
    hasPrevious: validatedCurrentPage > 0,
    startItem: validatedCurrentPage * pageSize + 1,
    endItem: Math.min((validatedCurrentPage + 1) * pageSize, totalItems),
  }), [validatedCurrentPage, totalPages, totalItems, pageSize]);

  const visiblePages = useMemo(() => {
    return calculateVisiblePages(
      validatedCurrentPage,
      totalPages,
      maxVisiblePages
    );
  }, [validatedCurrentPage, totalPages, maxVisiblePages]);

  const startItem = useMemo(() => {
    if (totalItems === 0) return 0;
    return validatedCurrentPage * pageSize + 1;
  }, [validatedCurrentPage, pageSize, totalItems]);

  const endItem = useMemo(() => {
    if (totalItems === 0) return 0;
    return Math.min((validatedCurrentPage + 1) * pageSize, totalItems);
  }, [validatedCurrentPage, pageSize, totalItems]);

  // ============================================
  // EFFECTS
  // ============================================
  
  // Reset to first page when totalItems changes significantly
  useEffect(() => {
    if (resetOnTotalChange && validatedCurrentPage >= totalPages && totalPages > 0) {
      setCurrentPageState(0);
    }
  }, [totalItems, totalPages, resetOnTotalChange, validatedCurrentPage]);

  // Sync with validated page
  useEffect(() => {
    if (currentPage !== validatedCurrentPage) {
      setCurrentPageState(validatedCurrentPage);
    }
  }, [validatedCurrentPage, currentPage]);

  // ============================================
  // ACTIONS
  // ============================================
  
  const setCurrentPage = useCallback((page: number) => {
    const newPage = validatePageNumber(page, totalPages);
    if (newPage !== currentPage) {
      setCurrentPageState(newPage);
      onPageChange?.(newPage);
    }
  }, [currentPage, totalPages, onPageChange]);

  const setPageSize = useCallback((size: number) => {
    // Validar que el tamaño esté en las opciones permitidas
    if (!pageSizeOptions.includes(size)) {
      console.warn(`Page size ${size} not in allowed options:`, pageSizeOptions);
      return;
    }

    if (size !== pageSize) {
      setPageSizeState(size);
      onPageSizeChange?.(size);
      
      // Calcular nueva página para mantener aproximadamente los mismos elementos visibles
      const currentFirstItem = currentPage * pageSize;
      const newPage = Math.floor(currentFirstItem / size);
      const validatedNewPage = validatePageNumber(newPage, Math.ceil(totalItems / size));
      
      if (validatedNewPage !== currentPage) {
        setCurrentPageState(validatedNewPage);
        onPageChange?.(validatedNewPage);
      }
    }
  }, [pageSize, pageSizeOptions, currentPage, totalItems, onPageSizeChange, onPageChange]);

  const goToNextPage = useCallback(() => {
    if (paginationInfo.hasNext) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, paginationInfo.hasNext, setCurrentPage]);

  const goToPreviousPage = useCallback(() => {
    if (paginationInfo.hasPrevious) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, paginationInfo.hasPrevious, setCurrentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(0);
  }, [setCurrentPage]);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages - 1);
  }, [totalPages, setCurrentPage]);

  const goToPage = useCallback((page: number) => {
    // Convert from 1-based (UI) to 0-based (internal)
    setCurrentPage(page - 1);
  }, [setCurrentPage]);

  const resetToFirstPage = useCallback(() => {
    setCurrentPage(0);
  }, [setCurrentPage]);

  const canGoToPage = useCallback((page: number): boolean => {
    const zeroBasedPage = page - 1; // Convert from 1-based to 0-based
    return zeroBasedPage >= 0 && zeroBasedPage < totalPages;
  }, [totalPages]);

  const getPageRequest = useCallback((): PageRequest => ({
    page: validatedCurrentPage,
    size: pageSize,
    sort: [], // Can be extended to include sort parameters
  }), [validatedCurrentPage, pageSize]);

  const updateFromPageResponse = useCallback((response: PageResponse<any>) => {
    // Update state from backend response
    if (response.size !== pageSize) {
      setPageSizeState(response.size);
    }
    
    if (response.number !== validatedCurrentPage) {
      setCurrentPageState(response.number);
    }
  }, [pageSize, validatedCurrentPage]);

  // ============================================
  // RETURN OBJECT
  // ============================================
  
  return {
    // State
    currentPage: validatedCurrentPage,
    pageSize,
    totalItems,
    totalPages,
    paginationInfo,
    hasNextPage: paginationInfo.hasNext,
    hasPreviousPage: paginationInfo.hasPrevious,
    visiblePages,
    startItem,
    endItem,
    isFirstPage: validatedCurrentPage === 0,
    isLastPage: validatedCurrentPage === totalPages - 1,
    
    // Actions
    setCurrentPage,
    setPageSize,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    goToPage,
    resetToFirstPage,
    canGoToPage,
    getPageRequest,
    updateFromPageResponse,
  };
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Hook simplificado para paginación básica
 */
export function useSimplePagination(totalItems: number, pageSize: number = 25) {
  const pagination = usePagination({
    totalItems,
    defaultPageSize: pageSize,
    pageSizeOptions: [pageSize], // Solo un tamaño
    maxVisiblePages: 5,
  });

  return {
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    hasNext: pagination.hasNextPage,
    hasPrevious: pagination.hasPreviousPage,
    goToNext: pagination.goToNextPage,
    goToPrevious: pagination.goToPreviousPage,
    goToPage: pagination.goToPage,
    startItem: pagination.startItem,
    endItem: pagination.endItem,
    totalItems: pagination.totalItems,
  };
}

/**
 * Hook para paginación infinita (lazy loading)
 */
export function useInfinitePagination(
  totalItems: number,
  pageSize: number = 25,
  onLoadMore?: () => void
) {
  const [loadedPages, setLoadedPages] = useState(1);
  
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasMore = loadedPages < totalPages;
  const itemsLoaded = Math.min(loadedPages * pageSize, totalItems);

  const loadMore = useCallback(() => {
    if (hasMore) {
      setLoadedPages(prev => prev + 1);
      onLoadMore?.();
    }
  }, [hasMore, onLoadMore]);

  const reset = useCallback(() => {
    setLoadedPages(1);
  }, []);

  return {
    loadedPages,
    totalPages,
    hasMore,
    itemsLoaded,
    totalItems,
    loadMore,
    reset,
    progress: totalItems > 0 ? (itemsLoaded / totalItems) * 100 : 0,
  };
}

/**
 * Hook para paginación con URL sync
 */
export function useUrlPagination(
  totalItems: number,
  searchParams: URLSearchParams,
  setSearchParams: (params: URLSearchParams) => void,
  config?: Omit<PaginationConfig, 'totalItems' | 'onPageChange' | 'onPageSizeChange'>
) {
  const initialPage = parseInt(searchParams.get('page') || '0', 10);
  const initialPageSize = parseInt(searchParams.get('size') || '25', 10);

  const pagination = usePagination({
    ...config,
    totalItems,
    initialPage,
    defaultPageSize: initialPageSize,
    onPageChange: (page) => {
      const newParams = new URLSearchParams(searchParams);
      if (page === 0) {
        newParams.delete('page');
      } else {
        newParams.set('page', page.toString());
      }
      setSearchParams(newParams);
    },
    onPageSizeChange: (size) => {
      const newParams = new URLSearchParams(searchParams);
      if (size === 25) {
        newParams.delete('size');
      } else {
        newParams.set('size', size.toString());
      }
      setSearchParams(newParams);
    },
  });

  return pagination;
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default usePagination;