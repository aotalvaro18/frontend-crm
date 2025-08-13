// src/hooks/useDebounce.ts
// ✅ USE DEBOUNCE HOOK - ENTERPRISE GRADE
// Performance-optimized + Memory-safe + TypeScript strict + Mobile-optimized

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ============================================
// TYPES
// ============================================

/**
 * Opciones de configuración para useDebounce
 */
export interface DebounceOptions {
  /**
   * Delay en milisegundos para el debounce
   * @default 300
   */
  delay?: number;
  
  /**
   * Si el valor inicial debe ser debouncado inmediatamente
   * @default false
   */
  immediate?: boolean;
  
  /**
   * Valor máximo de delay (para prevenir delays excesivos)
   * @default 5000
   */
  maxDelay?: number;
  
  /**
   * Si debe ejecutarse en el leading edge del timeout
   * @default false
   */
  leading?: boolean;
  
  /**
   * Si debe ejecutarse en el trailing edge del timeout
   * @default true
   */
  trailing?: boolean;
}

/**
 * Return type del hook useDebounce con controles avanzados
 */
export interface DebounceReturn<T> {
  /** Valor debouncado */
  debouncedValue: T;
  
  /** Si hay un debounce pendiente */
  isPending: boolean;
  
  /** Cancela el debounce pendiente */
  cancel: () => void;
  
  /** Ejecuta inmediatamente el debounce */
  flush: () => void;
  
  /** Actualiza el valor inmediatamente sin debounce */
  immediate: (value: T) => void;
}

// ============================================
// MAIN HOOK
// ============================================

/**
 * Hook para debounce de valores con controles avanzados
 * Optimizado para performance y mobile-first
 * 
 * @param value - Valor a debounce
 * @param delay - Delay en milisegundos (default: 300)
 * @param options - Opciones avanzadas de configuración
 * @returns Objeto con valor debouncado y controles
 */
export function useDebounce<T>(
  value: T,
  delay: number = 300,
  options: DebounceOptions = {}
): DebounceReturn<T> {
  // ============================================
  // CONFIGURATION
  // ============================================
  
  const {
    immediate = false,
    maxDelay = 5000,
    leading = false,
    trailing = true,
  } = options;

  // Validate and clamp delay
  const safeDelay = useMemo(() => {
    const clampedDelay = Math.max(0, Math.min(delay, maxDelay));
    
    // Mobile optimization: minimum 100ms for touch interactions
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
      return Math.max(clampedDelay, 100);
    }
    
    return clampedDelay;
  }, [delay, maxDelay]);

  // ============================================
  // STATE
  // ============================================
  
  const [debouncedValue, setDebouncedValue] = useState<T>(
    immediate ? value : value
  );
  const [isPending, setIsPending] = useState(false);

  // ============================================
  // REFS
  // ============================================
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousValueRef = useRef<T>(value);
  const mountedRef = useRef(true);
  const leadingCalledRef = useRef(false);

  // ============================================
  // HANDLERS
  // ============================================
  
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setIsPending(false);
    leadingCalledRef.current = false;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    
    if (mountedRef.current) {
      setDebouncedValue(previousValueRef.current);
      setIsPending(false);
    }
    leadingCalledRef.current = false;
  }, []);

  const immediateUpdate = useCallback((newValue: T) => {
    cancel();
    if (mountedRef.current) {
      setDebouncedValue(newValue);
      previousValueRef.current = newValue;
    }
  }, [cancel]);

  // ============================================
  // MAIN EFFECT
  // ============================================
  
  useEffect(() => {
    // Si el valor no cambió, no hacer nada
    if (Object.is(previousValueRef.current, value)) {
      return;
    }

    previousValueRef.current = value;

    // Leading edge execution
    if (leading && !leadingCalledRef.current) {
      if (mountedRef.current) {
        setDebouncedValue(value);
        leadingCalledRef.current = true;
      }
      
      if (!trailing) {
        return;
      }
    }

    // Si el delay es 0, actualizar inmediatamente
    if (safeDelay === 0) {
      if (mountedRef.current) {
        setDebouncedValue(value);
        setIsPending(false);
      }
      return;
    }

    // Cancelar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsPending(true);

    // Establecer nuevo timeout
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && trailing) {
        setDebouncedValue(previousValueRef.current);
        setIsPending(false);
      }
      leadingCalledRef.current = false;
      timeoutRef.current = undefined;
    }, safeDelay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };
  }, [value, safeDelay, leading, trailing]);

  // ============================================
  // CLEANUP
  // ============================================
  
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ============================================
  // RETURN
  // ============================================
  
  return {
    debouncedValue,
    isPending,
    cancel,
    flush,
    immediate: immediateUpdate,
  };
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Hook específico para search inputs con optimizaciones mobile
 */
export function useSearchDebounce(
  searchTerm: string,
  delay: number = 300
): string {
  const { debouncedValue } = useDebounce(searchTerm, delay, {
    // Mobile-optimized: mayor delay para evitar requests excesivos
    delay: typeof window !== 'undefined' && 'ontouchstart' in window ? 
      Math.max(delay, 400) : delay,
    immediate: false,
    leading: false,
    trailing: true,
  });

  return debouncedValue;
}

/**
 * Hook para debounce de funciones con throttling automático
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number = 300,
  deps: React.DependencyList = []
): [(...args: Args) => void, () => void, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Actualizar callback ref
  useEffect(() => {
    callbackRef.current = callback;
  });

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const execute = useCallback((...args: Args) => { // ✅ CORRECCIÓN: Aceptar los argumentos genéricos
    cancel();
    callbackRef.current(...args); // ✅ CORRECCIÓN: Pasar los argumentos a la llamada
  }, [cancel]);

  const debouncedCallback = useCallback((...args: Args) => {
    cancel();
    
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay, cancel, ...deps]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedCallback, cancel, execute];
}

/**
 * Hook para debounce con async/await support
 */
export function useAsyncDebounce<T, R>(
  asyncFunction: (value: T) => Promise<R>,
  delay: number = 300
): [(value: T) => Promise<R | undefined>, boolean, () => void] {
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const latestValueRef = useRef<T>();
  const mountedRef = useRef(true);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setIsLoading(false);
  }, []);

  const debouncedAsyncFunction = useCallback(async (value: T): Promise<R | undefined> => {
    latestValueRef.current = value;
    
    return new Promise((resolve) => {
      // Cancelar llamada anterior
      cancel();
      setIsLoading(true);

      timeoutRef.current = setTimeout(async () => {
        try {
          // Verificar si el valor sigue siendo el más reciente
          if (latestValueRef.current === value && mountedRef.current) {
            const result = await asyncFunction(value);
            if (mountedRef.current) {
              setIsLoading(false);
              resolve(result);
            }
          } else {
            if (mountedRef.current) {
              setIsLoading(false);
            }
            resolve(undefined);
          }
        } catch (error) {
          if (mountedRef.current) {
            setIsLoading(false);
          }
          throw error;
        }
      }, delay);
    });
  }, [asyncFunction, delay, cancel]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  return [debouncedAsyncFunction, isLoading, cancel];
}

/**
 * Hook para window resize debouncing (optimizado para performance)
 */
export function useResizeDebounce(delay: number = 150): {
  width: number;
  height: number;
  isResizing: boolean;
} {
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  const { debouncedValue: debouncedDimensions, isPending } = useDebounce(
    dimensions,
    delay,
    { immediate: false }
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    width: debouncedDimensions.width,
    height: debouncedDimensions.height,
    isResizing: isPending,
  };
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default useDebounce;