 // src/hooks/usePagination.ts
// Hook de paginaci贸n enterprise mobile-first

import { useState, useCallback, useMemo, useEffect } from 'react';
import { apiClient } from '@/services/api/baseApi';
import { APP_CONFIG } from '@/utils/constants';

// ============================================
// TYPES
// ============================================

interface PaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  maxPages?: number;
  // Mobile-specific
  adaptivePageSize?: boolean;
  prefetchNext?: boolean;
  prefetchPrevious?: boolean;
  infiniteScroll?: boolean;
  // Performance
  debouncePageChange?: number;
  cachePages?: boolean;
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  startIndex: number;
  endIndex: number;
}

interface UsePaginationReturn extends PaginationState {
  // Navigation
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  
  // Page size
  setPageSize: (size: number) => void;
  getOptimalPageSize: () => number;
  
  // Utility
  reset: () => void;
  setTotalItems: (total: number) => void;
  getPageNumbers: (delta?: number) => number[];
  
  // Mobile-specific
  loadMore: () => void; // For infinite scroll
  canLoadMore: boolean;
  
  // Performance
  prefetchPage: (page: number) => void;
  isPrefetching: boolean;
}

// ============================================
// MAIN PAGINATION HOOK
// ============================================

export function usePagination(
  initialTotalItems: number = 0,
  options: PaginationOptions = {}
): UsePaginationReturn {
  const {
    initialPage = 0,
    initialPageSize,
    maxPages = 1000,
    adaptivePageSize = true,
    prefetchNext = true,
    prefetchPrevious = false,
    infiniteScroll = false,
    debouncePageChange = 100,
    cachePages = true,
  } = options;

  // ============================================
  // STATE
  // ============================================

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(() => {
    if (initialPageSize) return initialPageSize;
    if (adaptivePageSize) return getAdaptivePageSize();
    return APP_CONFIG.DEFAULT_PAGE_SIZE;
  });
  const [totalItems, setTotalItems] = useState(initialTotalItems);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([initialPage]));

  // ============================================
  // MOBILE-ADAPTIVE PAGE SIZE
  // ============================================

  function getAdaptivePageSize(): number {
    const connection = apiClient.getConnectionInfo();
    
    // Mobile: Adjust page size based on connection
    if (connection.isSlowConnection) {
      return 10; // Smaller pages on slow connections
    } else if (connection.isFastConnection) {
      return 50; // Larger pages on fast connections
    }
    
    // Screen size considerations
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      return 15; // Smaller pages on mobile for better scrolling
    }
    
    return APP_CONFIG.DEFAULT_PAGE_SIZE;
  }

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const paginationState = useMemo((): PaginationState => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(currentPage, totalPages - 1);
    
    return {
      currentPage: safePage,
      pageSize,
      totalItems,
      totalPages: Math.min(totalPages, maxPages),
      hasNextPage: safePage < totalPages - 1 && safePage < maxPages - 1,
      hasPreviousPage: safePage > 0,
      isFirstPage: safePage === 0,
      isLastPage: safePage >= totalPages - 1 || safePage >= maxPages - 1,
      startIndex: safePage * pageSize,
      endIndex: Math.min((safePage + 1) * pageSize - 1, totalItems - 1),
    };
  }, [currentPage, pageSize, totalItems, maxPages]);

  // ============================================
  // NAVIGATION FUNCTIONS
  // ============================================

  const goToPage = useCallback((page: number) => {
    const { totalPages } = paginationState;
    const targetPage = Math.max(0, Math.min(page, totalPages - 1));
    
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
      setLoadedPages(prev => new Set([...prev, targetPage]));
      
      // Mobile: Prefetch adjacent pages
      if (prefetchNext && targetPage < totalPages - 1) {
        setTimeout(() => prefetchPage(targetPage + 1), debouncePageChange);
      }
      if (prefetchPrevious && targetPage > 0) {
        setTimeout(() => prefetchPage(targetPage - 1), debouncePageChange);
      }
    }
  }, [currentPage, paginationState, prefetchNext, prefetchPrevious, debouncePageChange]);

  const nextPage = useCallback(() => {
    if (paginationState.hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, paginationState.hasNextPage, goToPage]);

  const previousPage = useCallback(() => {
    if (paginationState.hasPreviousPage) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, paginationState.hasPreviousPage, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(0);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(paginationState.totalPages - 1);
  }, [paginationState.totalPages, goToPage]);

  // ============================================
  // PAGE SIZE MANAGEMENT
  // ============================================

  const setPageSize = useCallback((size: number) => {
    const validSize = Math.min(size, APP_CONFIG.MAX_PAGE_SIZE);
    const newPage = Math.floor((currentPage * pageSize) / validSize);
    
    setPageSizeState(validSize);
    setCurrentPage(newPage);
    setLoadedPages(new Set([newPage]));
  }, [currentPage, pageSize]);

  const getOptimalPageSize = useCallback(() => {
    return getAdaptivePageSize();
  }, []);

  // ============================================
  // INFINITE SCROLL SUPPORT
  // ============================================

  const loadMore = useCallback(() => {
    if (infiniteScroll && paginationState.hasNextPage) {
      nextPage();
    }
  }, [infiniteScroll, paginationState.hasNextPage, nextPage]);

  const canLoadMore = useMemo(() => {
    return infiniteScroll && paginationState.hasNextPage;
  }, [infiniteScroll, paginationState.hasNextPage]);

  // ============================================
  // PREFETCHING
  // ============================================

  const prefetchPage = useCallback(async (page: number) => {
    if (!cachePages || loadedPages.has(page) || isPrefetching) {
      return;
    }

    const connection = apiClient.getConnectionInfo();
    
    // Mobile: Only prefetch on good connections
    if (connection.isSlowConnection || !connection.isOnline) {
      return;
    }

    setIsPrefetching(true);
    
    try {
      // This would be implemented by the consuming component
      // We just mark the page as being prefetched
      await new Promise(resolve => setTimeout(resolve, 100));
      setLoadedPages(prev => new Set([...prev, page]));
    } catch (error) {
      console.warn('Prefetch failed for page:', page, error);
    } finally {
      setIsPrefetching(false);
    }
  }, [cachePages, loadedPages, isPrefetching]);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setTotalItems(0);
    setLoadedPages(new Set([initialPage]));
  }, [initialPage]);

  const setTotalItemsCallback = useCallback((total: number) => {
    setTotalItems(total);
    
    // Adjust current page if it's now out of bounds
    const newTotalPages = Math.ceil(total / pageSize);
    if (currentPage >= newTotalPages) {
      setCurrentPage(Math.max(0, newTotalPages - 1));
    }
  }, [currentPage, pageSize]);

  const getPageNumbers = useCallback((delta: number = 2): number[] => {
    const { totalPages } = paginationState;
    const start = Math.max(0, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [currentPage, paginationState]);

  // ============================================
  // RESPONSIVE ADJUSTMENTS
  // ============================================

  useEffect(() => {
    if (!adaptivePageSize) return;

    const handleResize = () => {
      const newOptimalSize = getAdaptivePageSize();
      if (newOptimalSize !== pageSize) {
        setPageSize(newOptimalSize);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adaptivePageSize, pageSize, setPageSize]);

  // ============================================
  // RETURN OBJECT
  // ============================================

  return {
    ...paginationState,
    
    // Navigation
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    
    // Page size
    setPageSize,
    getOptimalPageSize,
    
    // Utility
    reset,
    setTotalItems: setTotalItemsCallback,
    getPageNumbers,
    
    // Mobile-specific
    loadMore,
    canLoadMore,
    
    // Performance
    prefetchPage,
    isPrefetching,
  };
}

// ============================================
// SPECIALIZED PAGINATION HOOKS
// ============================================

/**
 * Hook para paginaci贸n con tabla
 */
export function useTablePagination(initialTotalItems: number = 0) {
  return usePagination(initialTotalItems, {
    adaptivePageSize: true,
    prefetchNext: true,
    infiniteScroll: false,
    cachePages: true,
  });
}

/**
 * Hook para infinite scroll
 */
export function useInfiniteScrollPagination(initialTotalItems: number = 0) {
  const pagination = usePagination(initialTotalItems, {
    adaptivePageSize: true,
    infiniteScroll: true,
    prefetchNext: true,
    cachePages: true,
  });

  // Mobile: Intersection observer for auto-loading
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!loadMoreRef || !pagination.canLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          pagination.loadMore();
        }
      },
      { rootMargin: '100px' } // Load before actually reaching the bottom
    );

    observer.observe(loadMoreRef);
    return () => observer.disconnect();
  }, [loadMoreRef, pagination.canLoadMore, pagination.loadMore]);

  return {
    ...pagination,
    setLoadMoreRef,
    loadMoreRef,
  };
}

/**
 * Hook para paginaci贸n mobile-optimizada
 */
export function useMobilePagination(initialTotalItems: number = 0) {
  const isMobile = window.innerWidth < 768;
  
  return usePagination(initialTotalItems, {
    adaptivePageSize: true,
    prefetchNext: isMobile,
    prefetchPrevious: false, // Less aggressive on mobile
    infiniteScroll: isMobile, // Prefer infinite scroll on mobile
    debouncePageChange: isMobile ? 200 : 100,
    cachePages: true,
  });
}

export default usePagination;
