// src/hooks/useOfflineSync.ts
// Hook enterprise para manejo completo de estado offline - CORREGIDO
// Siguiendo guía TypeScript pragmático y arquitectura enterprise

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

// ============================================
// TYPES
// ============================================

interface OfflineSyncOptions {
  autoSync?: boolean;
  syncInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
  showNotifications?: boolean;
  backgroundSync?: boolean;
  syncOnVisibilityChange?: boolean;
  syncOnConnectionRestore?: boolean;
}

interface OfflineSyncState {
  isOnline: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  hasUnsyncedChanges: boolean;
  lastSyncTime: number | null;
  syncError: string | null;
  queueSize: number;
  connectionType: string;
  isSlowConnection: boolean;
}

interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: string[];
  duration: number;
}

// ============================================
// UTILIDADES INTERNAS
// ============================================

/**
 * Obtiene información de conexión real del navegador
 */
const getConnectionInfo = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    isOnline: navigator.onLine,
    type: connection?.effectiveType || 'unknown',
    isSlowConnection: connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g',
  };
};

/**
 * Simula estadísticas de cola offline (para futuro uso)
 */
const getOfflineQueueStats = () => {
  // Por ahora retornamos datos mock, se implementará cuando tengamos queue real
  return {
    total: 0,
    pending: 0,
    failed: 0,
  };
};

/**
 * Toast helpers seguros (solo métodos que existen en react-hot-toast)
 */
const safeToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  loading: (message: string) => toast.loading(message),
  info: (message: string) => toast(message, { icon: 'ℹ️' }), // Fallback para info
  warning: (message: string) => toast(message, { icon: '⚠️' }), // Fallback para warning
  dismiss: (id: string) => toast.dismiss(id),
};

// ============================================
// MAIN OFFLINE SYNC HOOK
// ============================================

export function useOfflineSync(options: OfflineSyncOptions = {}): {
  state: OfflineSyncState;
  sync: () => Promise<SyncResult>;
  forceSync: () => Promise<SyncResult>;
  clearQueue: () => void;
  pauseSync: () => void;
  resumeSync: () => void;
  getSyncStatus: () => OfflineSyncState;
} {
  const {
    autoSync = true,
    syncInterval = 30000, // 30 seconds
    maxRetries = 3,
    retryDelay = 5000,
    showNotifications = true,
    backgroundSync = true,
    syncOnVisibilityChange = true,
    syncOnConnectionRestore = true,
  } = options;

  // ============================================
  // STATE
  // ============================================

  const [state, setState] = useState<OfflineSyncState>(() => {
    const connection = getConnectionInfo();
    return {
      isOnline: connection.isOnline,
      isOffline: !connection.isOnline,
      isSyncing: false,
      hasUnsyncedChanges: false,
      lastSyncTime: null,
      syncError: null,
      queueSize: 0,
      connectionType: connection.type,
      isSlowConnection: connection.isSlowConnection,
    };
  });

  const [isPaused, setIsPaused] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const lastNotificationRef = useRef<number>(0);

  // ============================================
  // CONNECTION MONITORING
  // ============================================

  const updateConnectionState = useCallback(() => {
    const connection = getConnectionInfo();
    const queueStats = getOfflineQueueStats();

    setState(prev => ({
      ...prev,
      isOnline: connection.isOnline,
      isOffline: !connection.isOnline,
      connectionType: connection.type,
      isSlowConnection: connection.isSlowConnection,
      queueSize: queueStats.total,
      // hasUnsyncedChanges se mantiene como estaba (será actualizado por otros hooks)
    }));
  }, []);

  // ============================================
  // SYNC FUNCTIONS
  // ============================================

  const performSync = useCallback(async (force: boolean = false): Promise<SyncResult> => {
    const startTime = Date.now();
    
    setState(prev => ({ 
      ...prev, 
      isSyncing: true, 
      syncError: null 
    }));

    try {
      // Check if we should sync
      if (!force && (!state.isOnline || isPaused)) {
        throw new Error('Cannot sync while offline or paused');
      }

      // Show notification for long syncs
      let notificationId: string | undefined;
      if (showNotifications && state.queueSize > 5) {
        notificationId = safeToast.loading(`🔄 Sincronizando ${state.queueSize} cambios...`);
      }

      // TODO: Aquí iría la lógica real de sincronización
      // Por ahora simulamos una sincronización exitosa
      await new Promise(resolve => setTimeout(resolve, 1000));

      const duration = Date.now() - startTime;
      const syncedItems = state.queueSize; // Previous queue size

      // Update state
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: Date.now(),
        hasUnsyncedChanges: false,
        queueSize: 0,
      }));

      // Reset retry counter on success
      retryCountRef.current = 0;

      // Success notification
      if (showNotifications && syncedItems > 0) {
        if (notificationId) safeToast.dismiss(notificationId);
        
        // Throttle notifications to avoid spam
        const now = Date.now();
        if (now - lastNotificationRef.current > 10000) { // 10 seconds
          safeToast.success(`✅ ${syncedItems} cambios sincronizados`);
          lastNotificationRef.current = now;
        }
      }

      return {
        success: true,
        syncedItems,
        failedItems: 0,
        errors: [],
        duration,
      };

    } catch (error: unknown) {
      // Siguiendo tu guía TypeScript: usar unknown y type guards
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: errorMessage,
      }));

      const duration = Date.now() - startTime;

      // Handle retry logic
      if (retryCountRef.current < maxRetries && state.isOnline) {
        retryCountRef.current++;
        
        if (showNotifications) {
          safeToast.error(`❌ Error de sincronización. Reintentando en ${retryDelay / 1000}s...`);
        }

        retryTimeoutRef.current = setTimeout(() => {
          performSync(force);
        }, retryDelay);
      } else {
        // Max retries reached or offline
        if (showNotifications) {
          safeToast.error('❌ Error de sincronización. Se reintentará automáticamente.');
        }
      }

      return {
        success: false,
        syncedItems: 0,
        failedItems: state.queueSize,
        errors: [errorMessage],
        duration,
      };
    }
  }, [
    state.isOnline,
    state.queueSize,
    isPaused,
    showNotifications,
    maxRetries,
    retryDelay,
  ]);

  const sync = useCallback(() => performSync(false), [performSync]);
  const forceSync = useCallback(() => performSync(true), [performSync]);

  // ============================================
  // QUEUE MANAGEMENT
  // ============================================

  const clearQueue = useCallback(() => {
    // Reset state (la lógica real se implementará cuando tengamos queue)
    setState(prev => ({
      ...prev,
      queueSize: 0,
      hasUnsyncedChanges: false,
      syncError: null,
    }));

    if (showNotifications) {
      safeToast.info('🗑️ Cola de sincronización limpiada');
    }
  }, [showNotifications]);

  const pauseSync = useCallback(() => {
    setIsPaused(true);
    
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    if (showNotifications) {
      safeToast.info('⏸️ Sincronización pausada');
    }
  }, [showNotifications]);

  const resumeSync = useCallback(() => {
    setIsPaused(false);
    retryCountRef.current = 0;

    if (showNotifications) {
      safeToast.info('▶️ Sincronización reanudada');
    }

    // Restart auto-sync if enabled
    if (autoSync && state.isOnline) {
      sync();
    }
  }, [autoSync, state.isOnline, sync, showNotifications]);

  // ============================================
  // EVENT LISTENERS
  // ============================================

  useEffect(() => {
    // Connection change listeners
    const handleOnline = () => {
      updateConnectionState();
      
      if (syncOnConnectionRestore && !isPaused) {
        setTimeout(() => sync(), 1000); // Small delay to ensure connection is stable
      }
      
      if (showNotifications) {
        safeToast.success('📱 Conexión restaurada');
      }
    };

    const handleOffline = () => {
      updateConnectionState();
      
      if (showNotifications) {
        safeToast.warning('📶 Sin conexión. Los cambios se guardarán localmente.');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Visibility change listener
    const handleVisibilityChange = () => {
      if (syncOnVisibilityChange && !document.hidden && state.isOnline && !isPaused) {
        updateConnectionState();
        if (state.hasUnsyncedChanges) {
          sync();
        }
      }
    };

    if (syncOnVisibilityChange) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (syncOnVisibilityChange) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [
    updateConnectionState,
    syncOnConnectionRestore,
    syncOnVisibilityChange,
    sync,
    isPaused,
    state.isOnline,
    state.hasUnsyncedChanges,
    showNotifications,
  ]);

  // ============================================
  // AUTO-SYNC INTERVAL
  // ============================================

  useEffect(() => {
    if (!autoSync || isPaused || !backgroundSync) return;

    syncIntervalRef.current = setInterval(() => {
      if (state.isOnline && state.hasUnsyncedChanges && !state.isSyncing) {
        sync();
      }
    }, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, isPaused, backgroundSync, syncInterval, state.isOnline, state.hasUnsyncedChanges, state.isSyncing, sync]);

  // ============================================
  // PERIODIC STATE UPDATES
  // ============================================

  useEffect(() => {
    const interval = setInterval(updateConnectionState, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateConnectionState]);

  // ============================================
  // CLEANUP
  // ============================================

  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // ============================================
  // RETURN API
  // ============================================

  const getSyncStatus = useCallback((): OfflineSyncState => {
    const connection = getConnectionInfo();
    const queueStats = getOfflineQueueStats();

    return {
      ...state,
      isOnline: connection.isOnline,
      isOffline: !connection.isOnline,
      connectionType: connection.type,
      isSlowConnection: connection.isSlowConnection,
      queueSize: queueStats.total,
      // hasUnsyncedChanges se mantiene del estado actual
    };
  }, [state]);

  return {
    state,
    sync,
    forceSync,
    clearQueue,
    pauseSync,
    resumeSync,
    getSyncStatus,
  };
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Hook simplificado para estado de conexión
 */
export function useConnectionState() {
  const { state } = useOfflineSync({
    autoSync: false,
    showNotifications: false,
  });

  return {
    isOnline: state.isOnline,
    isOffline: state.isOffline,
    connectionType: state.connectionType,
    isSlowConnection: state.isSlowConnection,
  };
}

/**
 * Hook para indicador de estado offline
 */
export function useOfflineIndicator() {
  const { state, sync } = useOfflineSync({
    showNotifications: true,
    autoSync: true,
  });

  return {
    showOfflineIndicator: state.isOffline || state.hasUnsyncedChanges,
    isOffline: state.isOffline,
    hasUnsyncedChanges: state.hasUnsyncedChanges,
    isSyncing: state.isSyncing,
    queueSize: state.queueSize,
    lastSyncTime: state.lastSyncTime,
    manualSync: sync,
  };
}

/**
 * Hook para configuración automática de sincronización
 */
export function useAutoSync() {
  return useOfflineSync({
    autoSync: true,
    syncInterval: 30000,
    showNotifications: true,
    backgroundSync: true,
    syncOnVisibilityChange: true,
    syncOnConnectionRestore: true,
  });
}

export default useOfflineSync;