// src/hooks/useNotifications.ts
// ✅ ENTERPRISE NOTIFICATION HOOKS - TypeScript-Safe
// Mobile-first + Zustand + Optimistic Updates + Real-time
// Siguiendo exactamente el patrón de useContacts.ts

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import toast from 'react-hot-toast';

import { 
  notificationService, 
  handleNotificationApiError,
  type NotificationSearchCriteria,
  type NotificationStats,
  type NotificationPreferences,
} from '@/services/notifications/notificationService';
import { APP_CONFIG } from '@/utils/constants';

import type {
  Notification,
  ID,
  PageRequest,
} from '@/types/common.types';

import type { 
  BulkOperationResult 
} from '@/types/api.types';

// ============================================
// NOTIFICATION STORE STATE
// ============================================

interface NotificationState {
  // ============================================
  // DATA STATE (Core data)
  // ============================================
  notifications: Notification[];
  selectedNotification: Notification | null;
  totalNotifications: number;
  unreadCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  searchCriteria: NotificationSearchCriteria;
  
  // ============================================
  // UI STATE (Mobile-optimized)
  // ============================================
  loading: boolean;
  error: string | null;
  lastError: unknown; // Para debugging
  
  // Operation states (granular)
  creating: boolean;
  updating: Set<ID>;
  deleting: Set<ID>;
  markingAsRead: Set<ID>;
  
  // ============================================
  // SELECTION & BULK OPERATIONS
  // ============================================
  selectedNotificationIds: Set<ID>;
  bulkOperationLoading: boolean;
  lastBulkOperation: string | null;
  
  // ============================================
  // STATS & ANALYTICS
  // ============================================
  stats: NotificationStats | null;
  statsLoading: boolean;
  statsLastUpdated: number | null;
  
  // ============================================
  // USER PREFERENCES
  // ============================================
  preferences: NotificationPreferences | null;
  preferencesLoading: boolean;
  preferencesLastUpdated: number | null;
  
  // ============================================
  // REAL-TIME STATE
  // ============================================
  isRealTimeConnected: boolean;
  eventSource: EventSource | null;
  
  // ============================================
  // CONNECTION STATE (Mobile-critical)
  // ============================================
  isOffline: boolean;
  isSyncing: boolean;
  hasUnsyncedChanges: boolean;
  
  // ============================================
  // ACTIONS - SEARCH & LIST
  // ============================================
  searchNotifications: (criteria?: NotificationSearchCriteria, page?: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  prefetchNextPage: () => Promise<void>;
  
  // ============================================
  // ACTIONS - INDIVIDUAL OPERATIONS
  // ============================================
  getNotificationById: (id: ID, forceRefresh?: boolean) => Promise<void>;
  createNotification: (request: any) => Promise<Notification>; // CreateNotificationRequest from API
  updateNotification: (id: ID, request: any) => Promise<Notification>; // UpdateNotificationRequest from API
  deleteNotification: (id: ID) => Promise<void>;
  setSelectedNotification: (notification: Notification | null) => void;
  
  // ============================================
  // ACTIONS - READ/UNREAD OPERATIONS
  // ============================================
  markAsRead: (id: ID) => Promise<void>;
  markAsUnread: (id: ID) => Promise<void>;
  markAllAsRead: (criteria?: NotificationSearchCriteria) => Promise<void>;
  
  // ============================================
  // ACTIONS - BULK OPERATIONS
  // ============================================
  selectNotification: (id: ID) => void;
  selectAllNotifications: () => void;
  deselectNotification: (id: ID) => void;
  deselectAllNotifications: () => void;
  bulkMarkAsRead: () => Promise<void>;
  bulkMarkAsUnread: () => Promise<void>;
  bulkDeleteNotifications: () => Promise<void>;
  
  // ============================================
  // ACTIONS - STATS & UNREAD COUNT
  // ============================================
  loadStats: (forceRefresh?: boolean) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  
  // ============================================
  // ACTIONS - USER PREFERENCES
  // ============================================
  loadUserPreferences: (forceRefresh?: boolean) => Promise<void>;
  updateUserPreferences: (preferences: NotificationPreferences) => Promise<void>;
  
  // ============================================
  // ACTIONS - REAL-TIME
  // ============================================
  connectRealTime: () => Promise<void>;
  disconnectRealTime: () => void;
  
  // ============================================
  // ACTIONS - CLEANUP
  // ============================================
  cleanupReadNotifications: (olderThanDays?: number) => Promise<void>;
  
  // ============================================
  // ACTIONS - SEARCH & FILTERS
  // ============================================
  setSearchCriteria: (criteria: NotificationSearchCriteria) => void;
  clearFilters: () => void;
  
  // ============================================
  // ACTIONS - ERROR HANDLING
  // ============================================
  clearError: () => void;
  resetState: () => void;
}

// ============================================
// HELPER FUNCTIONS (TypeScript-Safe)
// ============================================

// Helper para toast warnings (no existe toast.warning)
const showWarningToast = (message: string) => {
  toast(message, {
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
    },
  });
};

// Helper para merge seguro de notificaciones (evita conflictos de tipos)
const safeUpdateNotification = (
  notification: Notification,
  updates: Record<string, unknown>
): Notification => {
  return { ...notification, ...updates };
};

// ============================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================

export const useNotificationStore = create<NotificationState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // ============================================
      // INITIAL STATE
      // ============================================
      notifications: [],
      selectedNotification: null,
      totalNotifications: 0,
      unreadCount: 0,
      currentPage: 0,
      pageSize: APP_CONFIG.DEFAULT_PAGE_SIZE,
      totalPages: 0,
      searchCriteria: {},
      
      // UI State
      loading: false,
      error: null,
      lastError: null,
      
      // Operation states
      creating: false,
      updating: new Set(),
      deleting: new Set(),
      markingAsRead: new Set(),
      
      // Selection
      selectedNotificationIds: new Set(),
      bulkOperationLoading: false,
      lastBulkOperation: null,
      
      // Stats
      stats: null,
      statsLoading: false,
      statsLastUpdated: null,
      
      // Preferences
      preferences: null,
      preferencesLoading: false,
      preferencesLastUpdated: null,
      
      // Real-time
      isRealTimeConnected: false,
      eventSource: null,
      
      // Connection
      isOffline: false,
      isSyncing: false,
      hasUnsyncedChanges: false,

      // ============================================
      // SEARCH & LIST ACTIONS
      // ============================================
      
      searchNotifications: async (criteria = {}, page = 0) => {
        set({ loading: true, error: null });
        
        try {
          const currentCriteria = { ...get().searchCriteria, ...criteria };
          const pagination: PageRequest = {
            page,
            size: get().pageSize,
            sort: ['createdAt,desc'], // Más recientes primero
          };

          const response = await notificationService.searchNotifications(currentCriteria, pagination);
          
          set({
            notifications: response.content,
            totalNotifications: response.totalElements,
            currentPage: response.number,
            totalPages: response.totalPages,
            searchCriteria: currentCriteria,
            loading: false,
          });
          
          // Auto-refresh unread count cuando cargamos notifications
          get().refreshUnreadCount();
          
        } catch (error: unknown) {
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            loading: false,
          });
          
          // Solo mostrar toast si no es un error de red que se puede reintentar
          if (errorInfo.type !== 'network_error') {
            toast.error(errorInfo.message);
          }
        }
      },

      refreshNotifications: async () => {
        const { searchCriteria, currentPage } = get();
        await get().searchNotifications(searchCriteria, currentPage);
      },

      prefetchNextPage: async () => {
        const { searchCriteria, currentPage, totalPages, loading } = get();
        
        // Solo prefetch si no estamos cargando y hay más páginas
        if (loading || currentPage >= totalPages - 1) return;
        
        try {
          const nextPage = currentPage + 1;
          const pagination: PageRequest = {
            page: nextPage,
            size: get().pageSize,
            sort: ['createdAt,desc'],
          };
          
          // Prefetch silencioso (no actualizar el estado)
          await notificationService.searchNotifications(searchCriteria, pagination);
        } catch {
          // Ignorar errores en prefetch
        }
      },

      // ============================================
      // INDIVIDUAL NOTIFICATION ACTIONS
      // ============================================
      
      getNotificationById: async (id: ID) => {
        set({ loading: true, selectedNotification: null });
        
        try {
          const notification = await notificationService.getNotificationById(id);
          set({
            selectedNotification: notification,
            loading: false,
          });
        } catch (error: unknown) {
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            loading: false,
          });
          toast.error(errorInfo.message);
        }
      },

      createNotification: async (request: any) => {
        set({ creating: true, error: null });
        
        try {
          const newNotification = await notificationService.createNotification(request);
          
          // Agregar optimísticamente a la lista si está en la primera página
          const { currentPage } = get();
          if (currentPage === 0) {
            set(state => ({
              notifications: [newNotification, ...state.notifications.slice(0, state.pageSize - 1)],
              totalNotifications: state.totalNotifications + 1,
              unreadCount: !newNotification.isRead ? state.unreadCount + 1 : state.unreadCount,
              creating: false,
            }));
          } else {
            set({ creating: false });
          }
          
          toast.success('Notificación creada exitosamente');
          return newNotification;
          
        } catch (error: unknown) {
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            creating: false,
          });
          
          if (errorInfo.type === 'validation_error') {
            toast.error('Revisa los datos ingresados');
          } else {
            toast.error(errorInfo.message);
          }
          throw error;
        }
      },

      updateNotification: async (id: ID, request: any) => {
        set(state => ({
          updating: new Set([...state.updating, id]),
          error: null,
        }));
        
        // Guardar lista original para rollback
        const originalNotifications = [...get().notifications];
        
        // Actualizar optimísticamente
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === id ? safeUpdateNotification(notification, request) : notification
          ),
        }));
        
        try {
          const updatedNotification = await notificationService.updateNotification(id, request);
          
          // Actualizar con datos reales del servidor
          set(state => ({
            notifications: state.notifications.map(notification =>
              notification.id === id ? updatedNotification : notification
            ),
            selectedNotification: state.selectedNotification?.id === id ? updatedNotification : state.selectedNotification,
            updating: new Set([...state.updating].filter(notificationId => notificationId !== id)),
          }));
          
          toast.success('Notificación actualizada exitosamente');
          return updatedNotification;
          
        } catch (error: unknown) {
          // Revertir cambio optimista
          set(state => ({
            notifications: originalNotifications,
            updating: new Set([...state.updating].filter(notificationId => notificationId !== id)),
          }));
          
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
          });
          
          if (errorInfo.type === 'business_error') {
            toast.error(errorInfo.message);
            // Opcional: refrescar para corregir estados obsoletos (simula conflicto de concurrencia)
            setTimeout(() => get().getNotificationById(id, true), 1000);
          } else if (errorInfo.type === 'validation_error') {
            toast.error('Revisa los datos ingresados');
          } else {
            toast.error(errorInfo.message);
          }
          throw error;
        }
      },

      deleteNotification: async (id: ID) => {
        set(state => ({
          deleting: new Set([...state.deleting, id]),
          error: null,
        }));
        
        try {
          await notificationService.deleteNotification(id);
          
          // Obtener la notificación que se va a eliminar para actualizar el unread count
          const notificationToDelete = get().notifications.find(n => n.id === id);
          
          // Remover de la lista
          set(state => ({
            notifications: state.notifications.filter(notification => notification.id !== id),
            selectedNotification: state.selectedNotification?.id === id ? null : state.selectedNotification,
            totalNotifications: Math.max(0, state.totalNotifications - 1),
            unreadCount: notificationToDelete && !notificationToDelete.isRead 
              ? Math.max(0, state.unreadCount - 1) 
              : state.unreadCount,
            deleting: new Set([...state.deleting].filter(notificationId => notificationId !== id)),
            selectedNotificationIds: new Set([...state.selectedNotificationIds].filter(notificationId => notificationId !== id)),
          }));
          
          toast.success('Notificación eliminada exitosamente');
          
        } catch (error: unknown) {
          set(state => ({
            deleting: new Set([...state.deleting].filter(notificationId => notificationId !== id)),
          }));
          
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      setSelectedNotification: (notification: Notification | null) => {
        set({ selectedNotification: notification });
      },

      // ============================================
      // READ/UNREAD OPERATIONS
      // ============================================
      
      markAsRead: async (id: ID) => {
        set(state => ({
          markingAsRead: new Set([...state.markingAsRead, id]),
          error: null,
        }));
        
        // Obtener notificación actual para optimistic update
        const currentNotification = get().notifications.find(n => n.id === id);
        const wasUnread = currentNotification && !currentNotification.isRead;
        
        // Update optimista
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === id 
              ? safeUpdateNotification(notification, { isRead: true, readAt: new Date().toISOString() })
              : notification
          ),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        }));
        
        try {
          const updatedNotification = await notificationService.markAsRead(id);
          
          // Actualizar con datos reales del servidor
          set(state => ({
            notifications: state.notifications.map(notification =>
              notification.id === id ? updatedNotification : notification
            ),
            selectedNotification: state.selectedNotification?.id === id ? updatedNotification : state.selectedNotification,
            markingAsRead: new Set([...state.markingAsRead].filter(notificationId => notificationId !== id)),
          }));
          
        } catch (error: unknown) {
          // Revertir optimistic update
          if (currentNotification) {
            set(state => ({
              notifications: state.notifications.map(notification =>
                notification.id === id ? currentNotification : notification
              ),
              unreadCount: wasUnread ? state.unreadCount + 1 : state.unreadCount,
              markingAsRead: new Set([...state.markingAsRead].filter(notificationId => notificationId !== id)),
            }));
          }
          
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      markAsUnread: async (id: ID) => {
        set(state => ({
          markingAsRead: new Set([...state.markingAsRead, id]),
          error: null,
        }));
        
        // Obtener notificación actual para optimistic update
        const currentNotification = get().notifications.find(n => n.id === id);
        const wasRead = currentNotification && currentNotification.isRead;
        
        // Update optimista
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === id 
              ? safeUpdateNotification(notification, { isRead: false, readAt: undefined })
              : notification
          ),
          unreadCount: wasRead ? state.unreadCount + 1 : state.unreadCount,
        }));
        
        try {
          const updatedNotification = await notificationService.markAsUnread(id);
          
          // Actualizar con datos reales del servidor
          set(state => ({
            notifications: state.notifications.map(notification =>
              notification.id === id ? updatedNotification : notification
            ),
            selectedNotification: state.selectedNotification?.id === id ? updatedNotification : state.selectedNotification,
            markingAsRead: new Set([...state.markingAsRead].filter(notificationId => notificationId !== id)),
          }));
          
        } catch (error: unknown) {
          // Revertir optimistic update
          if (currentNotification) {
            set(state => ({
              notifications: state.notifications.map(notification =>
                notification.id === id ? currentNotification : notification
              ),
              unreadCount: wasRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
              markingAsRead: new Set([...state.markingAsRead].filter(notificationId => notificationId !== id)),
            }));
          }
          
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      markAllAsRead: async (criteria?: NotificationSearchCriteria) => {
        set({ loading: true, error: null });
        
        try {
          const result = await notificationService.markAllAsRead(criteria);
          
          // Update optimista de todas las notifications en la lista actual
          set(state => ({
            notifications: state.notifications.map(notification =>
              !notification.isRead 
                ? safeUpdateNotification(notification, { isRead: true, readAt: new Date().toISOString() })
                : notification
            ),
            unreadCount: 0, // Si marcamos todas como leídas, unread count es 0
            loading: false,
          }));
          
          toast.success(`${result.updatedCount} notificaciones marcadas como leídas`);
          
        } catch (error: unknown) {
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            loading: false,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      // ============================================
      // BULK OPERATIONS
      // ============================================
      
      selectNotification: (id: ID) => {
        set(state => ({
          selectedNotificationIds: new Set([...state.selectedNotificationIds, id]),
        }));
      },

      selectAllNotifications: () => {
        const { notifications } = get();
        set({
          selectedNotificationIds: new Set(notifications.map(notification => notification.id)),
        });
      },

      deselectNotification: (id: ID) => {
        set(state => ({
          selectedNotificationIds: new Set([...state.selectedNotificationIds].filter(notificationId => notificationId !== id)),
        }));
      },

      deselectAllNotifications: () => {
        set({ selectedNotificationIds: new Set() });
      },

      bulkMarkAsRead: async () => {
        const { selectedNotificationIds } = get();
        const notificationIds = Array.from(selectedNotificationIds);
        
        if (notificationIds.length === 0) return;
        
        set({ bulkOperationLoading: true, error: null, lastBulkOperation: 'mark-read' });
        
        try {
          const result = await notificationService.bulkUpdateNotifications(notificationIds, { isRead: true }) as BulkOperationResult;
          
          // Actualizar notificaciones con merge seguro
          set(state => ({
            notifications: state.notifications.map(notification =>
              notificationIds.includes(notification.id) 
                ? safeUpdateNotification(notification, { isRead: true, readAt: new Date().toISOString() })
                : notification
            ),
            selectedNotificationIds: new Set(), // Limpiar selección
            unreadCount: Math.max(0, state.unreadCount - (result.updated || (notificationIds.length - result.failed))),
            bulkOperationLoading: false,
          }));
          
          const updatedCount = result.updated || notificationIds.length - result.failed;
          toast.success(`${updatedCount} notificaciones marcadas como leídas`);
          
          if (result.failed > 0) {
            showWarningToast(`${result.failed} notificaciones no pudieron ser actualizadas`);
          }
          
        } catch (error: unknown) {
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            bulkOperationLoading: false,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      bulkMarkAsUnread: async () => {
        const { selectedNotificationIds } = get();
        const notificationIds = Array.from(selectedNotificationIds);
        
        if (notificationIds.length === 0) return;
        
        set({ bulkOperationLoading: true, error: null, lastBulkOperation: 'mark-unread' });
        
        try {
          const result = await notificationService.bulkUpdateNotifications(notificationIds, { isRead: false }) as BulkOperationResult;
          
          // Actualizar notificaciones con merge seguro
          set(state => ({
            notifications: state.notifications.map(notification =>
              notificationIds.includes(notification.id) 
                ? safeUpdateNotification(notification, { isRead: false, readAt: undefined })
                : notification
            ),
            selectedNotificationIds: new Set(), // Limpiar selección
            unreadCount: state.unreadCount + (result.updated || (notificationIds.length - result.failed)),
            bulkOperationLoading: false,
          }));
          
          const updatedCount = result.updated || notificationIds.length - result.failed;
          toast.success(`${updatedCount} notificaciones marcadas como no leídas`);
          
          if (result.failed > 0) {
            showWarningToast(`${result.failed} notificaciones no pudieron ser actualizadas`);
          }
          
        } catch (error: unknown) {
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            bulkOperationLoading: false,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      bulkDeleteNotifications: async () => {
        const { selectedNotificationIds } = get();
        const notificationIds = Array.from(selectedNotificationIds);
        
        if (notificationIds.length === 0) return;
        
        set({ bulkOperationLoading: true, error: null, lastBulkOperation: 'delete' });
        
        try {
          const result = await notificationService.bulkDeleteNotifications(notificationIds) as BulkOperationResult;
          
          // Calcular cuántas no leídas se eliminaron para actualizar unread count
          const unreadDeleted = get().notifications.filter(n => 
            notificationIds.includes(n.id) && !n.isRead
          ).length;
          
          const deletedCount = result.deleted || notificationIds.length - result.failed;
          
          // Remover notificaciones de la lista
          set(state => ({
            notifications: state.notifications.filter(notification => !notificationIds.includes(notification.id)),
            totalNotifications: Math.max(0, state.totalNotifications - deletedCount),
            unreadCount: Math.max(0, state.unreadCount - unreadDeleted),
            selectedNotificationIds: new Set(),
            bulkOperationLoading: false,
          }));
          
          toast.success(`${deletedCount} notificaciones eliminadas exitosamente`);
          
          if (result.failed > 0) {
            showWarningToast(`${result.failed} notificaciones no pudieron ser eliminadas`);
          }
          
        } catch (error: unknown) {
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            bulkOperationLoading: false,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      // ============================================
      // STATS & UNREAD COUNT OPERATIONS
      // ============================================
      
      loadStats: async (forceRefresh = false) => {
        const { statsLastUpdated, statsLoading } = get();
        
        // No recargar si ya están cargando o son recientes (menos de 5 minutos)
        const isStale = !statsLastUpdated || (Date.now() - statsLastUpdated > 5 * 60 * 1000);
        if (!forceRefresh && (!isStale || statsLoading)) return;
        
        set({ statsLoading: true, error: null });
        
        try {
          const stats = await notificationService.getNotificationStats();
          set({
            stats,
            statsLastUpdated: Date.now(),
            statsLoading: false,
          });
          
        } catch (error: unknown) {
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            statsLoading: false,
          });
          
          // No mostrar toast para errores de stats, son menos críticos
          console.warn('Failed to load notification stats:', errorInfo.message);
        }
      },

      refreshUnreadCount: async () => {
        try {
          const result = await notificationService.getUnreadCount();
          set({ unreadCount: result.count });
        } catch (error: unknown) {
          // Error silencioso, no crítico
          console.warn('Failed to refresh unread count:', error);
        }
      },

      // ============================================
      // USER PREFERENCES OPERATIONS
      // ============================================
      
      loadUserPreferences: async (forceRefresh = false) => {
        const { preferencesLastUpdated, preferencesLoading } = get();
        
        // No recargar si ya están cargando o son recientes (menos de 10 minutos)
        const isStale = !preferencesLastUpdated || (Date.now() - preferencesLastUpdated > 10 * 60 * 1000);
        if (!forceRefresh && (!isStale || preferencesLoading)) return;
        
        set({ preferencesLoading: true, error: null });
        
        try {
          const preferences = await notificationService.getUserNotificationPreferences();
          set({
            preferences,
            preferencesLastUpdated: Date.now(),
            preferencesLoading: false,
          });
          
        } catch (error: unknown) {
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            preferencesLoading: false,
          });
          
          // Error silencioso para preferencias
          console.warn('Failed to load notification preferences:', errorInfo.message);
        }
      },

      updateUserPreferences: async (preferences: NotificationPreferences) => {
        set({ preferencesLoading: true, error: null });
        
        try {
          const updatedPreferences = await notificationService.updateUserNotificationPreferences(preferences);
          set({
            preferences: updatedPreferences,
            preferencesLastUpdated: Date.now(),
            preferencesLoading: false,
          });
          
          toast.success('Preferencias de notificación actualizadas');
          
        } catch (error: unknown) {
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            preferencesLoading: false,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      // ============================================
      // REAL-TIME OPERATIONS
      // ============================================
      
      connectRealTime: async () => {
        if (get().isRealTimeConnected || get().eventSource) return;
        
        try {
          const eventSource = await notificationService.subscribeToNotifications();
          
          eventSource.onopen = () => {
            set({ isRealTimeConnected: true });
            console.log('✅ Real-time notifications connected');
          };
          
          eventSource.onmessage = (event) => {
            try {
              const notification: Notification = JSON.parse(event.data);
              
              // Agregar nueva notificación al inicio de la lista
              set(state => ({
                notifications: [notification, ...state.notifications].slice(0, state.pageSize),
                totalNotifications: state.totalNotifications + 1,
                unreadCount: !notification.isRead ? state.unreadCount + 1 : state.unreadCount,
              }));
              
              // Mostrar toast para nuevas notificaciones importantes
              if (notification.type === 'ERROR' || notification.type === 'WARNING') {
                toast(notification.message, {
                  icon: notification.type === 'ERROR' ? '❌' : '⚠️',
                });
              }
              
            } catch (error) {
              console.warn('Failed to parse real-time notification:', error);
            }
          };
          
          eventSource.onerror = () => {
            console.warn('Real-time connection error, reconnecting...');
            get().disconnectRealTime();
            // Auto-reconnect after 5 seconds
            setTimeout(() => get().connectRealTime(), 5000);
          };
          
          set({ eventSource });
          
        } catch (error) {
          console.warn('Failed to connect real-time notifications:', error);
        }
      },

      disconnectRealTime: () => {
        const { eventSource } = get();
        if (eventSource) {
          eventSource.close();
          set({ 
            eventSource: null, 
            isRealTimeConnected: false 
          });
          console.log('🔌 Real-time notifications disconnected');
        }
      },

      // ============================================
      // CLEANUP OPERATIONS
      // ============================================
      
      cleanupReadNotifications: async (olderThanDays = 30) => {
        set({ loading: true, error: null });
        
        try {
          const result = await notificationService.cleanupReadNotifications(olderThanDays);
          
          // Refresh la lista actual para remover las notificaciones eliminadas
          await get().refreshNotifications();
          
          set({ loading: false });
          toast.success(`${result.deletedCount} notificaciones antiguas eliminadas`);
          
        } catch (error: unknown) {
          const errorInfo = handleNotificationApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            loading: false,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      // ============================================
      // SEARCH & FILTER ACTIONS
      // ============================================
      
      setSearchCriteria: (criteria: NotificationSearchCriteria) => {
        set({ searchCriteria: criteria });
      },

      clearFilters: () => {
        set({ searchCriteria: {} });
        get().searchNotifications({}, 0);
      },

      // ============================================
      // ERROR HANDLING & UTILITY
      // ============================================
      
      clearError: () => {
        set({ error: null, lastError: null });
      },

      resetState: () => {
        // Disconnect real-time before reset
        get().disconnectRealTime();
        
        set({
          notifications: [],
          selectedNotification: null,
          totalNotifications: 0,
          unreadCount: 0,
          currentPage: 0,
          totalPages: 0,
          searchCriteria: {},
          loading: false,
          error: null,
          lastError: null,
          creating: false,
          updating: new Set(),
          deleting: new Set(),
          markingAsRead: new Set(),
          selectedNotificationIds: new Set(),
          bulkOperationLoading: false,
          lastBulkOperation: null,
          stats: null,
          statsLoading: false,
          statsLastUpdated: null,
          preferences: null,
          preferencesLoading: false,
          preferencesLastUpdated: null,
          isRealTimeConnected: false,
          eventSource: null,
        });
      },
    })),
    {
      name: 'notification-store',
      // Solo persistir datos no sensibles
      partialize: (state: NotificationState) => ({
        pageSize: state.pageSize,
        searchCriteria: state.searchCriteria,
        // No persistir notificaciones por seguridad
      }),
    }
  )
);

// ============================================
// SPECIALIZED HOOKS (Para componentes específicos)
// ============================================

/**
 * Hook principal para notificaciones - Para tu NotificationListPage
 */
export const useNotifications = () => {
  return useNotificationStore(state => ({
    notifications: state.notifications,
    loading: state.loading,
    error: state.error,
    totalNotifications: state.totalNotifications,
    unreadCount: state.unreadCount,
    searchNotifications: state.searchNotifications,
    refreshNotifications: state.refreshNotifications,
    markAsRead: state.markAsRead,
    markAllAsRead: state.markAllAsRead,
  }));
};

/**
 * Hook para operaciones bulk - Para tu NotificationListPage
 */
export const useBulkNotificationOperations = () => {
  return useNotificationStore(state => ({
    selectedNotificationIds: state.selectedNotificationIds,
    hasSelection: state.selectedNotificationIds.size > 0,
    selectionCount: state.selectedNotificationIds.size,
    bulkOperationLoading: state.bulkOperationLoading,
    selectNotification: state.selectNotification,
    selectAllNotifications: state.selectAllNotifications,
    deselectNotification: state.deselectNotification,
    deselectAllNotifications: state.deselectAllNotifications,
    bulkMarkAsRead: state.bulkMarkAsRead,
    bulkMarkAsUnread: state.bulkMarkAsUnread,
    bulkDeleteNotifications: state.bulkDeleteNotifications,
  }));
};

/**
 * Hook para stats - Para tu NotificationDashboard
 */
export const useNotificationStats = () => {
  return useNotificationStore(state => ({
    stats: state.stats,
    statsLoading: state.statsLoading,
    loadStats: state.loadStats,
  }));
};

/**
 * Hook para búsqueda y filtros - Para tu NotificationListPage
 */
export const useNotificationSearch = () => {
  return useNotificationStore(state => ({
    searchCriteria: state.searchCriteria,
    setSearchCriteria: state.setSearchCriteria,
    hasActiveFilters: Object.keys(state.searchCriteria).some(key => {
      const value = state.searchCriteria[key as keyof NotificationSearchCriteria];
      return value !== undefined && value !== null && value !== '';
    }),
    clearFilters: state.clearFilters,
  }));
};

/**
 * Hook para estados de operaciones - Para mostrar loading states
 */
export const useNotificationOperationStates = () => {
  return useNotificationStore(state => ({
    updating: state.updating,
    deleting: state.deleting,
    markingAsRead: state.markingAsRead,
    creating: state.creating,
  }));
};

/**
 * Hook para estado de conexión - Para mostrar status offline/online
 */
export const useNotificationConnectionStatus = () => {
  return useNotificationStore(state => ({
    isOnline: !state.isOffline,
    isRealTimeConnected: state.isRealTimeConnected,
    connectRealTime: state.connectRealTime,
    disconnectRealTime: state.disconnectRealTime,
  }));
};

/**
 * Hook para notificación seleccionada y operaciones individuales
 */
export const useSelectedNotification = () => {
  return useNotificationStore(state => ({
    selectedNotification: state.selectedNotification,
    getNotificationById: state.getNotificationById,
    setSelectedNotification: state.setSelectedNotification,
    // Include update/delete states for selected notification
    isUpdating: state.selectedNotification ? state.updating.has(state.selectedNotification.id) : false,
    isDeleting: state.selectedNotification ? state.deleting.has(state.selectedNotification.id) : false,
    isMarkingAsRead: state.selectedNotification ? state.markingAsRead.has(state.selectedNotification.id) : false,
  }));
};

/**
 * Hook para operaciones CRUD individuales
 */
export const useNotificationOperations = () => {
  return useNotificationStore(state => ({
    createNotification: state.createNotification,
    updateNotification: state.updateNotification,
    deleteNotification: state.deleteNotification,
    markAsRead: state.markAsRead,
    markAsUnread: state.markAsUnread,
    loading: state.loading,
    creating: state.creating,
    error: state.error,
    clearError: state.clearError,
  }));
};

/**
 * Hook para preferencias de usuario
 */
export const useNotificationPreferences = () => {
  return useNotificationStore(state => ({
    preferences: state.preferences,
    preferencesLoading: state.preferencesLoading,
    loadUserPreferences: state.loadUserPreferences,
    updateUserPreferences: state.updateUserPreferences,
  }));
};

/**
 * Hook para unread count (para badges, headers, etc.)
 */
export const useUnreadNotificationCount = () => {
  return useNotificationStore(state => ({
    unreadCount: state.unreadCount,
    refreshUnreadCount: state.refreshUnreadCount,
  }));
};

/**
 * Hook para manejo de errores de forma consistente
 */
export const useNotificationErrorHandler = () => {
  return useNotificationStore(state => ({
    error: state.error,
    lastError: state.lastError,
    clearError: state.clearError,
  }));
};

/**
 * Hook para operaciones de limpieza
 */
export const useNotificationCleanup = () => {
  return useNotificationStore(state => ({
    cleanupReadNotifications: state.cleanupReadNotifications,
    loading: state.loading,
  }));
};

// ============================================
// EXPORT DEFAULT (El hook principal)
// ============================================

export default useNotifications;