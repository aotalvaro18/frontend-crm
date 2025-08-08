// src/hooks/useDebounce.ts
// Debounce hook siguiendo tu guía arquitectónica

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// TYPES
// ============================================

interface UseDebounceOptions {
  delay?: number;
  minLength?: number;
  adaptiveDelay?: boolean;
  searchOnEmpty?: boolean;
}

interface UseSearchDebounceReturn {
  debouncedSearch: (value: any) => void;
  isSearching: boolean;
  clearSearch: () => void;
}

// ============================================
// BASIC DEBOUNCE HOOK
// ============================================

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// ADVANCED SEARCH DEBOUNCE HOOK
// ============================================

export function useSearchDebounce(
  searchFunction?: (value: any) => Promise<void> | void,
  options: UseDebounceOptions = {}
): UseSearchDebounceReturn {
  const {
    delay = 300,
    minLength = 0,
    adaptiveDelay = false,
    searchOnEmpty = true
  } = options;

  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSearchRef = useRef<string>('');

  const debouncedSearch = useCallback((value: any) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const searchValue = typeof value === 'string' ? value : value?.search || '';
    
    // Don't search if below minimum length and not searching empty
    if (searchValue.length < minLength && (!searchOnEmpty || searchValue.length > 0)) {
      setIsSearching(false);
      return;
    }

    // Don't search if same as last search
    if (searchValue === lastSearchRef.current) {
      return;
    }

    setIsSearching(true);

    // Calculate adaptive delay
    let currentDelay = delay;
    if (adaptiveDelay) {
      currentDelay = searchValue.length < 3 ? delay * 2 : delay;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        lastSearchRef.current = searchValue;
        if (searchFunction) {
          await searchFunction(value);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, currentDelay);
  }, [delay, minLength, searchOnEmpty, adaptiveDelay, searchFunction]);

  const clearSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsSearching(false);
    lastSearchRef.current = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    debouncedSearch,
    isSearching,
    clearSearch
  };
}

export default useDebounce;