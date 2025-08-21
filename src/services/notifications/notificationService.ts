// src/services/notificatiosn/notificationService.ts
// ✅ NOTIFICATION API SERVICE - Enterprise grade
// Mobile-first + Optimistic Updates + Error Handling
// Siguiendo exactamente el patrón de contactApi

import { apiClient } from '../api/baseApi';
import { ERROR_MESSAGES } from '../api/baseApi';
import type {
  Notification,
  NotificationType,
  NotificationChannel,
  ID,
  PageRequest,
  PageResponse,
} from '@/types/common.types';

import type {
  BulkOperationResult,
  CrmErrorResponse,
  CrmErrorCode,
} from '@/types/api.types';

// ============================================
// NOTIFICATION-SPECIFIC TYPES
// ============================================

/**
 * Criterios de búsqueda para notificaciones
 */
export interface NotificationSearchCriteria {
  search?: string;
  isRead?: boolean;
  type?: NotificationType;
  channel?: NotificationChannel;
  dateFrom?: string;
  dateTo?: string;
  organizationId?: ID;
  churchId?: ID;
  includeExpired?: boolean;
}

/**
 * Request para crear notificación
 */
export type CreateNotificationRequest = Partial<Notification>;

/**
 * Request para actualizar notificación
 */
export type UpdateNotificationRequest = Partial<Notification>;

/**
 * Estadísticas de notificaciones
 */
export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  recent: number; // Últimas 24 horas
}

/**
 * Configuración de preferencias de notificación del usuario
 */
export interface NotificationPreferences {
  enableInApp: boolean;
  enableEmail: boolean;
  enableSms: boolean;
  enablePush: boolean;
  types: Record<NotificationType, {
    enabled: boolean;
    channels: NotificationChannel[];
  }>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
}

// ============================================
// ERROR HANDLING (Siguiendo patrón de contactApi)
// ============================================

/**
 * Información de error para notificaciones
 */
interface NotificationErrorInfo {
  message: string;
  type: 'validation_error' | 'business_error' | 'network_error' | 'auth_error' | 'unknown_error';
  canRetry: boolean;
  retryAfter?: number;
}

/**
 * Mapeo de errores específicos de notificaciones
 */
const notificationErrorMessages: Record<string, string> = {
  NOTIFICATION_NOT_FOUND: 'La notificación no fue encontrada',
  NOTIFICATION_ALREADY_READ: 'La notificación ya fue marcada como leída',
  NOTIFICATION_EXPIRED: 'La notificación ha expirado',
  INVALID_NOTIFICATION_TYPE: 'Tipo de notificación inválido',
  INVALID_NOTIFICATION_CHANNEL: 'Canal de notificación inválido',
  NOTIFICATION_SEND_FAILED: 'Error al enviar la notificación',
  NOTIFICATION_PREFERENCES_INVALID: 'Preferencias de notificación inválidas',
  ...ERROR_MESSAGES,
};

/**
 * Handler de errores de API de notificaciones
 */
export const handleNotificationApiError = (error: unknown): NotificationErrorInfo => {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Error de conexión. Verifica tu internet.',
      type: 'network_error',
      canRetry: true,
      retryAfter: 3000,
    };
  }

  // API errors
  if (error && typeof error === 'object' && 'code' in error) {
    const apiError = error as CrmErrorResponse;
    const message = notificationErrorMessages[apiError.code] || apiError.message || 'Error desconocido';
    
    let type: NotificationErrorInfo['type'] = 'unknown_error';
    let canRetry = false;
    let retryAfter: number | undefined;

    const code = String(apiError.code);

    const validationCodes = new Set<CrmErrorCode | string>([
      'VALIDATION_ERROR',
      'INVALID_FORMAT',
    ]);
    const authCodes = new Set<CrmErrorCode | string>([
      'UNAUTHORIZED',
      'FORBIDDEN',
      'TOKEN_EXPIRED',
    ]);
    const networkCodes = new Set<CrmErrorCode | string>([
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'SERVICE_UNAVAILABLE',
    ]);
    const notificationBusinessCodes = new Set<string>([
      'NOTIFICATION_NOT_FOUND',
      'NOTIFICATION_ALREADY_READ',
      'NOTIFICATION_EXPIRED',
    ]);

    if (validationCodes.has(code)) {
      type = 'validation_error';
    } else if (notificationBusinessCodes.has(code)) {
      type = 'business_error';
    } else if (authCodes.has(code)) {
      type = 'auth_error';
    } else if (networkCodes.has(code)) {
      type = 'network_error';
      canRetry = true;
      retryAfter = apiError.retryAfter ? apiError.retryAfter * 1000 : 5000;
    } else {
      canRetry = true;
      retryAfter = 3000;
    }

    return { message, type, canRetry, retryAfter };
  }

  // Generic errors
  const message = error instanceof Error ? error.message : 'Error desconocido';
  return {
    message,
    type: 'unknown_error',
    canRetry: true,
    retryAfter: 3000,
  };
};

// ============================================
// NOTIFICATION API SERVICE CLASS
// ============================================

export class NotificationApiService {
  
  /**
   * Búsqueda de notificaciones con paginación y filtros
   * Matches endpoint: GET /api/notifications
   */
  async searchNotifications(
    criteria: NotificationSearchCriteria = {},
    pagination: PageRequest = { page: 0, size: 20, sort: ['createdAt,desc'] }
  ): Promise<PageResponse<Notification>> {
    
    const params = {
      // Search criteria
      ...(criteria.search && { search: criteria.search }),
      ...(criteria.isRead !== undefined && { isRead: criteria.isRead }),
      ...(criteria.type && { type: criteria.type }),
      ...(criteria.channel && { channel: criteria.channel }),
      ...(criteria.dateFrom && { dateFrom: criteria.dateFrom }),
      ...(criteria.dateTo && { dateTo: criteria.dateTo }),
      ...(criteria.organizationId && { organizationId: criteria.organizationId }),
      ...(criteria.churchId && { churchId: criteria.churchId }),
      ...(criteria.includeExpired !== undefined && { includeExpired: criteria.includeExpired }),
      
      // Pagination
      page: pagination.page,
      size: pagination.size,
      sort: pagination.sort.join(','),
    };

    return apiClient.get<PageResponse<Notification>>('/api/notifications', params);
  }

  /**
   * Obtener notificación por ID
   * Matches endpoint: GET /api/notifications/{id}
   */
  async getNotificationById(id: ID): Promise<Notification> {
    return apiClient.get<Notification>(`/api/notifications/${id}`);
  }

  /**
   * Crear nueva notificación
   * Matches endpoint: POST /api/notifications
   */
  async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    return apiClient.post<Notification>('/api/notifications', request);
  }

  /**
   * Actualizar notificación existente
   * Matches endpoint: PUT /api/notifications/{id}
   */
  async updateNotification(id: ID, request: UpdateNotificationRequest): Promise<Notification> {
    return apiClient.put<Notification>(`/api/notifications/${id}`, request);
  }

  /**
   * Eliminar notificación
   * Matches endpoint: DELETE /api/notifications/{id}
   */
  async deleteNotification(id: ID): Promise<void> {
    return apiClient.delete<void>(`/api/notifications/${id}`);
  }

  /**
   * Marcar notificación como leída
   * Matches endpoint: POST /api/notifications/{id}/mark-read
   */
  async markAsRead(id: ID): Promise<Notification> {
    return apiClient.post<Notification>(`/api/notifications/${id}/mark-read`);
  }

  /**
   * Marcar notificación como no leída
   * Matches endpoint: POST /api/notifications/{id}/mark-unread
   */
  async markAsUnread(id: ID): Promise<Notification> {
    return apiClient.post<Notification>(`/api/notifications/${id}/mark-unread`);
  }

  /**
   * Marcar todas las notificaciones como leídas
   * Matches endpoint: POST /api/notifications/mark-all-read
   */
  async markAllAsRead(criteria?: NotificationSearchCriteria): Promise<{ updatedCount: number }> {
    return apiClient.post<{ updatedCount: number }>('/api/notifications/mark-all-read', criteria);
  }

  /**
   * Obtener conteo de notificaciones no leídas
   * Matches endpoint: GET /api/notifications/unread-count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>('/api/notifications/unread-count');
  }

  /**
   * Obtener estadísticas de notificaciones
   * Matches endpoint: GET /api/notifications/stats
   */
  async getNotificationStats(): Promise<NotificationStats> {
    return apiClient.get<NotificationStats>('/api/notifications/stats');
  }

  /**
   * Obtener notificaciones recientes (últimas 24h)
   * Matches endpoint: GET /api/notifications/recent
   */
  async getRecentNotifications(limit: number = 10): Promise<Notification[]> {
    return apiClient.get<Notification[]>('/api/notifications/recent', { limit });
  }

  /**
   * Eliminar notificaciones leídas antiguas
   * Matches endpoint: DELETE /api/notifications/cleanup
   */
  async cleanupReadNotifications(olderThanDays: number = 30): Promise<{ deletedCount: number }> {
    return apiClient.delete<{ deletedCount: number }>(`/api/notifications/cleanup?olderThanDays=${olderThanDays}`);
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Operaciones bulk sobre notificaciones
   * Matches endpoint: POST /api/notifications/bulk-update
   */
  async bulkUpdateNotifications(
    notificationIds: ID[], 
    updates: Partial<Pick<Notification, 'isRead'>>
  ): Promise<BulkOperationResult> {
    return apiClient.post<BulkOperationResult>('/api/notifications/bulk-update', {
      notificationIds,
      updates,
    });
  }

  /**
   * Eliminación bulk de notificaciones
   * Matches endpoint: DELETE /api/notifications/bulk-delete
   */
  async bulkDeleteNotifications(notificationIds: ID[]): Promise<BulkOperationResult> {
    return apiClient.post<BulkOperationResult>('/api/notifications/bulk-delete', {
      notificationIds,
    });
  }

  // ============================================
  // USER PREFERENCES
  // ============================================

  /**
   * Obtener preferencias de notificación del usuario
   * Matches endpoint: GET /api/notifications/preferences
   */
  async getUserNotificationPreferences(): Promise<NotificationPreferences> {
    return apiClient.get<NotificationPreferences>('/api/notifications/preferences');
  }

  /**
   * Actualizar preferencias de notificación del usuario
   * Matches endpoint: PUT /api/notifications/preferences
   */
  async updateUserNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    return apiClient.put<NotificationPreferences>('/api/notifications/preferences', preferences);
  }

  // ============================================
  // REAL-TIME OPERATIONS
  // ============================================

  /**
   * Suscribirse a notificaciones en tiempo real (Server-Sent Events)
   * Matches endpoint: GET /api/notifications/stream
   */
  async subscribeToNotifications(): Promise<EventSource> {
    // Para implementación futura con Server-Sent Events
    const eventSource = new EventSource('/api/notifications/stream');
    return eventSource;
  }

  /**
   * Enviar notificación push de prueba
   * Matches endpoint: POST /api/notifications/test-push
   */
  async sendTestPushNotification(): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/api/notifications/test-push');
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const notificationService = new NotificationApiService();