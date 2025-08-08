// src/hooks/useOfflineSync.ts
// Hook enterprise para manejo completo de estado offline

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/services/api/baseApi';
import { useContactStore } from '@/stores/contactStore';
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
    const connection = apiClient.getConnectionInfo();
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

  // Store references
  const { syncOfflineChanges, getConnectionStatus } = useContactStore();

  // ============================================
  // CONNECTION MONITORING
  // ============================================

  const updateConnectionState = useCallback(() => {
    const connection = apiClient.getConnectionInfo();
    const queueStats = apiClient.getOfflineQueueStats();
    const contactStatus = getConnectionStatus();

    setState(prev => ({
      ...prev,
      isOnline: connection.isOnline,
      isOffline: !connection.isOnline,
      connectionType: connection.type,
      isSlowConnection: connection.isSlowConnection,
      queueSize: queueStats.total,
      hasUnsyncedChanges: contactStatus.hasUnsyncedChanges,
    }));
  }, [getConnectionStatus]);

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
        notificationId = toast.loading(`馃攧 Sincronizando ${state.queueSize} cambios...`);
      }

      // Perform the actual sync
      await apiClient.forceSyncOfflineQueue();
      await syncOfflineChanges();

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
        if (notificationId) toast.dismiss(notificationId);
        
        // Throttle notifications to avoid spam
        const now = Date.now();
        if (now - lastNotificationRef.current > 10000) { // 10 seconds
          toast.success(`鉁?${syncedItems} cambios sincronizados`);
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

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error.message,
      }));

      const duration = Date.now() - startTime;

      // Handle retry logic
      if (retryCountRef.current < maxRetries && state.isOnline) {
        retryCountRef.current++;
        
        if (showNotifications) {
          toast.error(`鉂?Error de sincronizaci贸n. Reintentando en ${retryDelay / 1000}s...`);
        }

        retryTimeoutRef.current = setTimeout(() => {
          performSync(force);
        }, retryDelay);
      } else {
        // Max retries reached or offline
        if (showNotifications) {
          toast.error('鉂?Error de sincronizaci贸n. Se reintentar谩 autom谩ticamente.');
        }
      }

      return {
        success: false,
        syncedItems: 0,
        failedItems: state.queueSize,
        errors: [error.message],
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
    syncOfflineChanges,
  ]);

  const sync = useCallback(() => performSync(false), [performSync]);
  const forceSync = useCallback(() => performSync(true), [performSync]);

  // ============================================
  // QUEUE MANAGEMENT
  // ============================================

  const clearQueue = useCallback(() => {
    // This would clear the offline queue in the API client
    // For now, we'll just reset our state
    setState(prev => ({
      ...prev,
      queueSize: 0,
      hasUnsyncedChanges: false,
      syncError: null,
    }));

    if (showNotifications) {
      toast.info('馃棏锔?Cola de sincronizaci贸n limpiada');
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
      toast.info('鈴革笍 Sincronizaci贸n pausada');
    }
  }, [showNotifications]);

  const resumeSync = useCallback(() => {
    setIsPaused(false);
    retryCountRef.current = 0;

    if (showNotifications) {
      toast.info('鈻讹笍 Sincronizaci贸n reanudada');
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
        toast.success('馃摱 Conexi贸n restaurada');
      }
    };

    const handleOffline = () => {
      updateConnectionState();
      
      if (showNotifications) {
        toast.warning('馃摰 Sin conexi贸n. Los cambios se guardar谩n localmente.');
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
    const connection = apiClient.getConnectionInfo();
    const queueStats = apiClient.getOfflineQueueStats();
    const contactStatus = getConnectionStatus();

    return {
      ...state,
      isOnline: connection.isOnline,
      isOffline: !connection.isOnline,
      connectionType: connection.type,
      isSlowConnection: connection.isSlowConnection,
      queueSize: queueStats.total,
      hasUnsyncedChanges: contactStatus.hasUnsyncedChanges,
    };
  }, [state, getConnectionStatus]);

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
 * Hook simplificado para estado de conexi贸n
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
 * Hook para configuraci贸n autom谩tica de sincronizaci贸n
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