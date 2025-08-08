 // src/hooks/useOptimisticUpdate.ts
// Hook enterprise para optimistic updates mobile-first

import { useState, useCallback, useRef } from 'react';
import { useContactStore } from '@/stores/contactStore';
import { apiClient } from '@/services/api/baseApi';
import { ERROR_CODES } from '@/utils/constants';
import toast from 'react-hot-toast';

// ============================================
// TYPES
// ============================================

interface OptimisticUpdateOptions<T> {
  // Mobile: Connection-aware options
  skipOnSlowConnection?: boolean;
  skipOnOffline?: boolean;
  showLoadingToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  
  // Rollback options
  enableRollback?: boolean;
  rollbackDelay?: number;
  
  // Version control (para optimistic locking)
  versionField?: keyof T;
  optimisticVersionIncrement?: boolean;
}

interface OptimisticState<T> {
  data: T | null;
  isLoading: boolean;
  isOptimistic: boolean;
  error: any;
  lastOperation: string | null;
  rollbackData: T | null;
}

type OptimisticOperation<T, P = any> = (params: P) => Promise<T>;

// ============================================
// MAIN HOOK
// ============================================

export function useOptimisticUpdate<T extends { id?: number; version?: number }>(
  initialData: T | null = null,
  options: OptimisticUpdateOptions<T> = {}
) {
  const {
    skipOnSlowConnection = false,
    skipOnOffline = true,
    showLoadingToast = false,
    enableRollback = true,
    rollbackDelay = 5000,
    optimisticVersionIncrement = true,
  } = options;

  // ============================================
  // STATE
  // ============================================

  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isLoading: false,
    isOptimistic: false,
    error: null,
    lastOperation: null,
    rollbackData: null,
  });

  const rollbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const operationIdRef = useRef<string | null>(null);
  
  // Get connection info
  const connectionInfo = apiClient.getConnectionInfo();

  // ============================================
  // CORE OPTIMISTIC UPDATE FUNCTION
  // ============================================

  const executeOptimisticUpdate = useCallback(async <P>(
    operation: OptimisticOperation<T, P>,
    params: P,
    optimisticUpdate: Partial<T>,
    operationName: string = 'update'
  ): Promise<T> => {
    // Mobile: Check connection constraints
    if (skipOnOffline && !connectionInfo.isOnline) {
      throw new Error('Operation not allowed offline');
    }
    
    if (skipOnSlowConnection && connectionInfo.isSlowConnection) {
      throw new Error('Operation skipped on slow connection');
    }

    const operationId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    operationIdRef.current = operationId;

    // Clear any existing rollback
    if (rollbackTimeoutRef.current) {
      clearTimeout(rollbackTimeoutRef.current);
    }

    try {
      // Step 1: Apply optimistic update
      setState(prev => {
        const updatedData = prev.data ? { 
          ...prev.data, 
          ...optimisticUpdate,
          // Mobile: Optimistic version increment for optimistic locking
          ...(optimisticVersionIncrement && prev.data.version !== undefined ? {
            version: prev.data.version + 1
          } : {})
        } : null;

        return {
          ...prev,
          data: updatedData as T,
          isLoading: true,
          isOptimistic: true,
          error: null,
          lastOperation: operationName,
          rollbackData: enableRollback ? prev.data : null,
        };
      });

      // Mobile: Show loading feedback
      if (showLoadingToast) {
        toast.loading(`Actualizando ${operationName}...`, { id: operationId });
      }

      // Step 2: Execute real operation
      const result = await operation(params);

      // Step 3: Update with real data (only if this is still the current operation)
      if (operationIdRef.current === operationId) {
        setState(prev => ({
          ...prev,
          data: result,
          isLoading: false,
          isOptimistic: false,
          rollbackData: null,
        }));

        // Mobile: Success feedback
        if (showLoadingToast) {
          toast.dismiss(operationId);
          if (options.successMessage) {
            toast.success(options.successMessage);
          }
        }
      }

      return result;

    } catch (error: any) {
      // Step 4: Handle error and rollback
      if (operationIdRef.current === operationId) {
        const shouldRollback = enableRollback && state.rollbackData;

        setState(prev => ({
          ...prev,
          data: shouldRollback ? prev.rollbackData : prev.data,
          isLoading: false,
          isOptimistic: false,
          error,
          rollbackData: null,
        }));

        // Mobile: Error feedback
        if (showLoadingToast) {
          toast.dismiss(operationId);
        }

        // Handle specific error types
        this.handleOptimisticError(error, shouldRollback);
      }

      throw error;
    }
  }, [
    connectionInfo,
    skipOnOffline,
    skipOnSlowConnection,
    showLoadingToast,
    enableRollback,
    optimisticVersionIncrement,
    options.successMessage,
    state.rollbackData
  ]);

  // ============================================
  // ERROR HANDLING
  // ============================================

  const handleOptimisticError = useCallback((error: any, didRollback: boolean) => {
    // Mobile: Connection-aware error handling
    if (error.code === ERROR_CODES.NETWORK_ERROR) {
      if (connectionInfo.isSlowConnection) {
        toast.error('馃摫 Conexi贸n lenta. Intenta nuevamente.', { duration: 4000 });
      } else {
        toast.error('馃摰 Sin conexi贸n. Cambios se guardar谩n autom谩ticamente.', { duration: 6000 });
      }
      return;
    }

    // Optimistic locking conflict
    if (error.code === ERROR_CODES.CONCURRENT_MODIFICATION) {
      if (didRollback) {
        toast.error('鈿狅笍 Otro usuario modific贸 este registro. Cambios revertidos.', {
          duration: 6000,
          action: {
            label: 'Recargar',
            onClick: () => window.location.reload(),
          },
        });
      } else {
        toast.error('鈿狅笍 Conflicto de versiones detectado.', { duration: 4000 });
      }
      return;
    }

    // Validation errors
    if (error.code === ERROR_CODES.VALIDATION_ERROR) {
      const firstError = Object.values(error.fieldErrors || {}).flat()[0];
      toast.error(firstError || 'Datos inv谩lidos');
      return;
    }

    // Generic error
    const message = options.errorMessage || error.message || 'Error en la operaci贸n';
    toast.error(message);
  }, [connectionInfo, options.errorMessage]);

  // ============================================
  // SPECIALIZED UPDATE FUNCTIONS
  // ============================================

  const updateField = useCallback(async <K extends keyof T>(
    field: K,
    value: T[K],
    operation: OptimisticOperation<T, { [key in K]: T[K] }>
  ): Promise<T> => {
    return executeOptimisticUpdate(
      operation,
      { [field]: value } as { [key in K]: T[K] },
      { [field]: value } as Partial<T>,
      `update-${String(field)}`
    );
  }, [executeOptimisticUpdate]);

  const updateMultipleFields = useCallback(async (
    updates: Partial<T>,
    operation: OptimisticOperation<T, Partial<T>>
  ): Promise<T> => {
    return executeOptimisticUpdate(
      operation,
      updates,
      updates,
      'update-multiple'
    );
  }, [executeOptimisticUpdate]);

  // ============================================
  // ROLLBACK FUNCTIONS
  // ============================================

  const forceRollback = useCallback(() => {
    if (state.rollbackData) {
      setState(prev => ({
        ...prev,
        data: prev.rollbackData,
        isOptimistic: false,
        rollbackData: null,
        error: null,
      }));
      
      toast.info('馃攧 Cambios revertidos');
    }
  }, [state.rollbackData]);

  const scheduleRollback = useCallback((delay: number = rollbackDelay) => {
    if (rollbackTimeoutRef.current) {
      clearTimeout(rollbackTimeoutRef.current);
    }

    rollbackTimeoutRef.current = setTimeout(() => {
      if (state.isOptimistic && state.rollbackData) {
        forceRollback();
        toast.warning('鈴?Cambios revertidos por timeout');
      }
    }, delay);
  }, [rollbackDelay, state.isOptimistic, state.rollbackData, forceRollback]);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const reset = useCallback((newData: T | null = null) => {
    if (rollbackTimeoutRef.current) {
      clearTimeout(rollbackTimeoutRef.current);
    }
    
    setState({
      data: newData || initialData,
      isLoading: false,
      isOptimistic: false,
      error: null,
      lastOperation: null,
      rollbackData: null,
    });
  }, [initialData]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ============================================
  // CLEANUP
  // ============================================

  React.useEffect(() => {
    return () => {
      if (rollbackTimeoutRef.current) {
        clearTimeout(rollbackTimeoutRef.current);
      }
    };
  }, []);

  // ============================================
  // RETURN API
  // ============================================

  return {
    // State
    data: state.data,
    isLoading: state.isLoading,
    isOptimistic: state.isOptimistic,
    error: state.error,
    lastOperation: state.lastOperation,
    canRollback: !!state.rollbackData,
    
    // Core functions
    executeOptimisticUpdate,
    updateField,
    updateMultipleFields,
    
    // Rollback functions
    forceRollback,
    scheduleRollback,
    
    // Utility functions
    reset,
    clearError,
    
    // Connection info
    connectionInfo,
    canPerformOptimisticUpdates: connectionInfo.isOnline && (!skipOnSlowConnection || !connectionInfo.isSlowConnection),
  };
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Hook espec铆fico para optimistic updates de contactos
 */
export function useOptimisticContactUpdate(contact: any) {
  const { updateContact } = useContactStore();
  
  return useOptimisticUpdate(contact, {
    skipOnSlowConnection: false, // Always allow contact updates
    showLoadingToast: true,
    successMessage: 'Contacto actualizado',
    enableRollback: true,
    optimisticVersionIncrement: true,
  });
}

/**
 * Hook para optimistic updates con retry autom谩tico
 */
export function useOptimisticUpdateWithRetry<T extends { id?: number; version?: number }>(
  initialData: T | null = null,
  maxRetries: number = 3
) {
  const base = useOptimisticUpdate(initialData, {
    enableRollback: true,
    showLoadingToast: true,
  });
  
  const [retryCount, setRetryCount] = useState(0);
  
  const executeWithRetry = useCallback(async <P>(
    operation: OptimisticOperation<T, P>,
    params: P,
    optimisticUpdate: Partial<T>,
    operationName?: string
  ): Promise<T> => {
    try {
      const result = await base.executeOptimisticUpdate(operation, params, optimisticUpdate, operationName);
      setRetryCount(0); // Reset on success
      return result;
    } catch (error: any) {
      if (retryCount < maxRetries && error.code === ERROR_CODES.NETWORK_ERROR) {
        setRetryCount(prev => prev + 1);
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        
        toast.loading(`Reintentando... (${retryCount + 1}/${maxRetries})`, { duration: delay });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeWithRetry(operation, params, optimisticUpdate, operationName);
      }
      
      throw error;
    }
  }, [base.executeOptimisticUpdate, retryCount, maxRetries]);
  
  return {
    ...base,
    executeOptimisticUpdate: executeWithRetry,
    retryCount,
    canRetry: retryCount < maxRetries,
  };
}

export default useOptimisticUpdate;
