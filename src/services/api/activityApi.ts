// src/services/api/activityApi.ts
// Activity API service enterprise mobile-first - TypeScript-Safe
// 🔧 REPLICANDO: Estructura exacta de companyApi.ts (GOLDEN STANDARD)

import { apiClient } from './baseApi';
import { APP_CONFIG, API_ENDPOINTS, ERROR_CODES } from '@/utils/constants';
import type {
  ActivityDTO,
  CreateActivityRequest,
  UpdateActivityRequest,
  CompleteActivityRequest,
  RescheduleActivityRequest,
  AssignActivityRequest,
  ActivityType,
  ActivityStatus,
  ActivitySearchCriteria,
  ActivityStats,
} from '@/types/activity.types';

import type { 
  BulkOperationResult 
} from '@/types/api.types';

import type { PageRequest, PageResponse } from '@/types/common.types';

// ============================================
// TIPOS LOCALES
// ============================================

interface ActivityAvailability {
  available: boolean;
  conflictingActivityId?: number;
  conflictReason?: string;
}

interface ActivityRelation {
  entityType: 'CONTACT' | 'COMPANY' | 'DEAL';
  entityId: number;
  entityName: string;
}

// ============================================
// ACTIVITY API SERVICE CLASS
// ============================================

export class ActivityApiService {
  
  // ============================================
  // SEARCH & LIST OPERATIONS - SIMPLIFICADOS
  // ============================================

  /**
   * 🔧 SIMPLIFICADO: Única función para buscar y listar actividades.
   * 
   * Ahora usa el endpoint unificado GET /api/crm/activities que maneja
   * todos los casos: listado, búsqueda y filtros avanzados.
   * 
   * @param criteria Criterios de búsqueda opcionales
   * @param pagination Configuración de paginación
   * @returns Página de actividades que coinciden con los criterios
   */
  async searchActivities(
    criteria: ActivitySearchCriteria = {},
    pagination: PageRequest = { page: 0, size: 25, sort: ['activityDate,desc'] }
  ): Promise<PageResponse<ActivityDTO>> {
    
    const params = new URLSearchParams();
    
    // Añadir todos los criterios de búsqueda que existan
    if (criteria.search) params.append('search', criteria.search);
    if (criteria.type) params.append('type', criteria.type);
    if (criteria.status) params.append('status', criteria.status);
    if (criteria.outcome) params.append('outcome', criteria.outcome);
    if (criteria.priority) params.append('priority', criteria.priority);
    if (criteria.contactId) params.append('contactId', String(criteria.contactId));
    if (criteria.companyId) params.append('companyId', String(criteria.companyId));
    if (criteria.dealId) params.append('dealId', String(criteria.dealId));
    if (criteria.entityType) params.append('entityType', criteria.entityType);
    if (criteria.entityId) params.append('entityId', String(criteria.entityId));
    if (criteria.createdByCognitoSub) params.append('createdByCognitoSub', criteria.createdByCognitoSub);
    if (criteria.assignedToCognitoSub) params.append('assignedToCognitoSub', criteria.assignedToCognitoSub);
    if (criteria.onlyMine !== undefined) params.append('onlyMine', String(criteria.onlyMine));
    if (criteria.activityDateFrom) params.append('activityDateFrom', criteria.activityDateFrom);
    if (criteria.activityDateTo) params.append('activityDateTo', criteria.activityDateTo);
    if (criteria.dueDateFrom) params.append('dueDateFrom', criteria.dueDateFrom);
    if (criteria.dueDateTo) params.append('dueDateTo', criteria.dueDateTo);
    if (criteria.isOverdue !== undefined) params.append('isOverdue', String(criteria.isOverdue));
    if (criteria.isCompleted !== undefined) params.append('isCompleted', String(criteria.isCompleted));
    if (criteria.isToday !== undefined) params.append('isToday', String(criteria.isToday));
    if (criteria.isThisWeek !== undefined) params.append('isThisWeek', String(criteria.isThisWeek));
    if (criteria.hasOutcome !== undefined) params.append('hasOutcome', String(criteria.hasOutcome));
    if (criteria.hasNextSteps !== undefined) params.append('hasNextSteps', String(criteria.hasNextSteps));
    if (criteria.hasAttachments !== undefined) params.append('hasAttachments', String(criteria.hasAttachments));
    if (criteria.includeDeleted !== undefined) params.append('includeDeleted', String(criteria.includeDeleted));
    
    // Añadir la paginación
    params.append('page', String(pagination.page));
    params.append('size', String(pagination.size));
    params.append('sort', pagination.sort.join(','));

    // 🔧 ACTUALIZADO: Usar siempre el endpoint principal unificado
    const url = `${API_ENDPOINTS.ACTIVITIES}?${params.toString()}`;
    
    try {
      return await apiClient.get<PageResponse<ActivityDTO>>(url);
    } catch (error: unknown) {
      this.handleSearchError(error, criteria);
      throw error;
    }
  }

  /**
   * 🔧 SIMPLIFICADO: Autocompletar ahora usa el mismo endpoint.
   * 
   * Utiliza el endpoint unificado con el parámetro 'limit' para obtener
   * resultados optimizados para componentes de autocompletado.
   * 
   * @param term Término de búsqueda
   * @param limit Máximo número de resultados
   * @returns Array de actividades para autocompletado
   */
  async autocompleteActivities(
    term: string, 
    limit: number = 10
  ): Promise<ActivityDTO[]> {
    
    if (!term.trim() || term.length < 2) {
      return [];
    }

    const params = new URLSearchParams();
    params.append('search', term.trim());
    params.append('limit', String(limit));

    // 🔧 ACTUALIZADO: Usar el endpoint unificado con parámetro limit
    const url = `${API_ENDPOINTS.ACTIVITIES}?${params.toString()}`;
    
    try {
      const pageResponse = await apiClient.get<PageResponse<ActivityDTO>>(url);
      return pageResponse.content; // Extraer solo el array de actividades
    } catch (error: unknown) {
      this.handleSearchError(error, { search: term });
      throw error;
    }
  }

  // ============================================
  // ACTIVITY TYPES OPERATION
  // ============================================

  /**
   * Obtiene los tipos de actividad activos y filtrados desde el backend.
   * Llama al endpoint GET /api/crm/activities/types, que devuelve una lista
   * curada de tipos (ej. Llamada, Email, Reunión) para ser usados en formularios.
   *
   * @returns Una promesa que resuelve a un array de objetos con `value` y `label`.
   */
  async getActiveActivityTypes(): Promise<{ value: string; label: string }[]> {
    const url = `${API_ENDPOINTS.ACTIVITIES}/types`;
    return apiClient.get<{ value: string; label: string }[]>(url);
  }

  // ============================================
  // INDIVIDUAL ACTIVITY OPERATIONS
  // ============================================

  /**
   * Obtener actividad por ID
   */
  async getActivityById(id: number): Promise<ActivityDTO> {
    try {
      return await apiClient.get<ActivityDTO>(`${API_ENDPOINTS.ACTIVITIES}/${id}`);
    } catch (error: unknown) {
      this.handleActivityError(error, id);
      throw error;
    }
  }

  /**
   * Crear nueva actividad
   */
  async createActivity(request: CreateActivityRequest): Promise<ActivityDTO> {
    // Validación local primero
    this.validateCreateRequest(request);
    
    try {
      const result = await apiClient.post<ActivityDTO>(API_ENDPOINTS.ACTIVITIES, request);
      return result;
    } catch (error: unknown) {
      this.handleActivityError(error);
      throw error;
    }
  }

  /**
   * Actualizar actividad con optimistic locking
   */
  async updateActivity(
    id: number, 
    request: UpdateActivityRequest
  ): Promise<ActivityDTO> {
    
    // Validar version para optimistic locking
    if (typeof request.version !== 'number') {
      throw new Error('Version is required for activity updates (optimistic locking)');
    }
    
    this.validateUpdateRequest(request);
    
    try {
      const result = await apiClient.put<ActivityDTO>(
        `${API_ENDPOINTS.ACTIVITIES}/${id}`, 
        request
      );
      return result;
    } catch (error: unknown) {
      if (this.isConcurrencyError(error)) {
        this.handleConcurrencyError(error, id);
      }
      throw error;
    }
  }

  /**
   * Soft delete actividad
   */
  async deleteActivity(id: number): Promise<void> {
    try {
      await apiClient.delete<void>(`${API_ENDPOINTS.ACTIVITIES}/${id}`);
    } catch (error: unknown) {
      this.handleActivityError(error, id);
      throw error;
    }
  }

  // ============================================
  // SPECIALIZED ACTIVITY OPERATIONS
  // ============================================

  /**
   * Marcar actividad como completada
   */
  async completeActivity(request: CompleteActivityRequest): Promise<ActivityDTO> {
    this.validateCompleteRequest(request);
    
    try {
      return await apiClient.post<ActivityDTO>(
        `${API_ENDPOINTS.ACTIVITIES}/${request.activityId}/complete`,
        request
      );
    } catch (error: unknown) {
      this.handleActivityError(error, request.activityId);
      throw error;
    }
  }

  /**
   * Reagendar actividad
   */
  async rescheduleActivity(request: RescheduleActivityRequest): Promise<ActivityDTO> {
    this.validateRescheduleRequest(request);
    
    try {
      return await apiClient.post<ActivityDTO>(
        `${API_ENDPOINTS.ACTIVITIES}/${request.activityId}/reschedule`,
        request
      );
    } catch (error: unknown) {
      this.handleActivityError(error, request.activityId);
      throw error;
    }
  }

  /**
   * Asignar actividad a usuario
   */
  async assignActivity(request: AssignActivityRequest): Promise<ActivityDTO> {
    this.validateAssignRequest(request);
    
    try {
      return await apiClient.post<ActivityDTO>(
        `${API_ENDPOINTS.ACTIVITIES}/${request.activityId}/assign`,
        request
      );
    } catch (error: unknown) {
      this.handleActivityError(error, request.activityId);
      throw error;
    }
  }

  // ============================================
  // RELATED DATA OPERATIONS
  // ============================================

  /**
   * Obtener actividades por contacto
   */
  async getActivitiesByContact(contactId: number): Promise<ActivityDTO[]> {
    try {
      const params = new URLSearchParams();
      params.append('contactId', String(contactId));
      params.append('sort', 'activityDate,desc');
      
      const pageResponse = await apiClient.get<PageResponse<ActivityDTO>>(
        `${API_ENDPOINTS.ACTIVITIES}?${params.toString()}`
      );
      return pageResponse.content;
    } catch (error: unknown) {
      this.handleActivityError(error, contactId);
      throw error;
    }
  }

  /**
   * Obtener actividades por empresa
   */
  async getActivitiesByCompany(companyId: number): Promise<ActivityDTO[]> {
    try {
      const params = new URLSearchParams();
      params.append('companyId', String(companyId));
      params.append('sort', 'activityDate,desc');
      
      const pageResponse = await apiClient.get<PageResponse<ActivityDTO>>(
        `${API_ENDPOINTS.ACTIVITIES}?${params.toString()}`
      );
      return pageResponse.content;
    } catch (error: unknown) {
      this.handleActivityError(error, companyId);
      throw error;
    }
  }

  /**
   * Obtener actividades por deal
   */
  async getActivitiesByDeal(dealId: number): Promise<ActivityDTO[]> {
    try {
      const params = new URLSearchParams();
      params.append('dealId', String(dealId));
      params.append('sort', 'activityDate,desc');
      
      const pageResponse = await apiClient.get<PageResponse<ActivityDTO>>(
        `${API_ENDPOINTS.ACTIVITIES}?${params.toString()}`
      );
      return pageResponse.content;
    } catch (error: unknown) {
      this.handleActivityError(error, dealId);
      throw error;
    }
  }

  // ============================================
  // UTILITY OPERATIONS
  // ============================================

  /**
   * Verificar disponibilidad de horario para reunión
   */
  async checkTimeSlotAvailability(
    activityDate: string,
    duration: number,
    assignedToCognitoSub?: string
  ): Promise<ActivityAvailability> {
    const params = new URLSearchParams();
    params.append('activityDate', activityDate);
    params.append('duration', String(duration));
    if (assignedToCognitoSub) {
      params.append('assignedToCognitoSub', assignedToCognitoSub);
    }
    
    const url = `${API_ENDPOINTS.ACTIVITIES}/check-availability?${params.toString()}`;
    
    try {
      return await apiClient.get<ActivityAvailability>(url);
    } catch (error: unknown) {
      // Si no existe el endpoint, consideramos disponible
      return { available: true };
    }
  }

  /**
   * Estadísticas generales de actividades
   */
  async getActivityStats(): Promise<ActivityStats> {
    return apiClient.get<ActivityStats>(`${API_ENDPOINTS.ACTIVITIES}/stats`);
  }

  /**
   * Obtener actividades pendientes del usuario
   */
  async getMyPendingActivities(): Promise<ActivityDTO[]> {
    const params = new URLSearchParams();
    params.append('onlyMine', 'true');
    params.append('status', 'PENDING');
    params.append('sort', 'dueDate,asc');
    
    const url = `${API_ENDPOINTS.ACTIVITIES}?${params.toString()}`;
    
    try {
      const pageResponse = await apiClient.get<PageResponse<ActivityDTO>>(url);
      return pageResponse.content;
    } catch (error: unknown) {
      this.handleSearchError(error, { onlyMine: true, status: 'PENDING' });
      throw error;
    }
  }

  /**
   * Obtener actividades vencidas
   */
  async getOverdueActivities(): Promise<ActivityDTO[]> {
    const params = new URLSearchParams();
    params.append('isOverdue', 'true');
    params.append('sort', 'dueDate,asc');
    
    const url = `${API_ENDPOINTS.ACTIVITIES}?${params.toString()}`;
    
    try {
      const pageResponse = await apiClient.get<PageResponse<ActivityDTO>>(url);
      return pageResponse.content;
    } catch (error: unknown) {
      this.handleSearchError(error, { isOverdue: true });
      throw error;
    }
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Bulk update de actividades
   */
  async bulkUpdateActivities(
    activityIds: number[],
    updates: Partial<Pick<UpdateActivityRequest, 'status' | 'priority' | 'assignedToCognitoSub'>>
  ): Promise<BulkOperationResult> {
    
    if (activityIds.length > 100) {
      throw new Error('Bulk operations limited to 100 activities');
    }

    return apiClient.post<BulkOperationResult>(
      `${API_ENDPOINTS.ACTIVITIES}/bulk-update`,
      { activityIds, updates }
    );
  }

  /**
   * Bulk delete de actividades
   */
  async bulkDeleteActivities(activityIds: number[]): Promise<BulkOperationResult> {
    if (activityIds.length > 50) {
      throw new Error('Bulk delete limited to 50 activities');
    }

    return apiClient.post<BulkOperationResult>(
      `${API_ENDPOINTS.ACTIVITIES}/bulk-delete`,
      { activityIds }
    );
  }

  /**
   * Bulk complete de actividades
   */
  async bulkCompleteActivities(
    activityIds: number[],
    outcome: string,
    notes?: string
  ): Promise<BulkOperationResult> {
    if (activityIds.length > 50) {
      throw new Error('Bulk complete limited to 50 activities');
    }

    return apiClient.post<BulkOperationResult>(
      `${API_ENDPOINTS.ACTIVITIES}/bulk-complete`,
      { activityIds, outcome, notes }
    );
  }

  // ============================================
  // EXPORT OPERATIONS
  // ============================================

  /**
   * Exportar actividades a CSV
   */
  async exportActivitiesCSV(criteria: ActivitySearchCriteria = {}): Promise<Blob> {
    const params = this.buildExportParams(criteria);
    const baseURL = this.getBaseURL();
    
    const response = await fetch(
      `${baseURL}${API_ENDPOINTS.ACTIVITIES}/export/csv?${params.toString()}`,
      {
        method: 'GET',
        headers: await this.getExportHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Exportar actividades a Excel
   */
  async exportActivitiesExcel(criteria: ActivitySearchCriteria = {}): Promise<Blob> {
    const params = this.buildExportParams(criteria);
    const baseURL = this.getBaseURL();
    
    const response = await fetch(
      `${baseURL}${API_ENDPOINTS.ACTIVITIES}/export/excel?${params.toString()}`,
      {
        method: 'GET',
        headers: await this.getExportHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // ============================================
  // VALIDATION HELPERS
  // ============================================

  private validateCreateRequest(request: CreateActivityRequest): void {
    if (!request.title?.trim()) {
      throw new Error('El título de la actividad es requerido');
    }
    if (!request.type) {
      throw new Error('El tipo de actividad es requerido');
    }
    if (!request.activityDate) {
      throw new Error('La fecha de actividad es requerida');
    }
    
    // Validar que al menos una relación esté presente
    if (!request.contactId && !request.companyId && !request.dealId) {
      throw new Error('La actividad debe estar relacionada a un contacto, empresa o deal');
    }
    
    // Validar fecha de actividad
    if (new Date(request.activityDate).getTime() < Date.now() - 86400000) {
      throw new Error('La fecha de actividad no puede ser más de 1 día en el pasado');
    }
    
    // Validar duración si existe
    if (request.duration && (request.duration < 1 || request.duration > 1440)) {
      throw new Error('La duración debe estar entre 1 y 1440 minutos');
    }
  }

  private validateUpdateRequest(request: UpdateActivityRequest): void {
    if (request.title !== undefined && !request.title?.trim()) {
      throw new Error('El título de la actividad es requerido');
    }
    if (request.activityDate && new Date(request.activityDate).getTime() < Date.now() - 86400000) {
      throw new Error('La fecha de actividad no puede ser más de 1 día en el pasado');
    }
    if (request.duration && (request.duration < 1 || request.duration > 1440)) {
      throw new Error('La duración debe estar entre 1 y 1440 minutos');
    }
    if (typeof request.version !== 'number') {
      throw new Error('La versión es requerida para actualizaciones');
    }
  }

  private validateCompleteRequest(request: CompleteActivityRequest): void {
    if (!request.activityId || request.activityId <= 0) {
      throw new Error('ID de actividad inválido');
    }
    if (!request.outcome) {
      throw new Error('El resultado de la actividad es requerido');
    }
    if (request.actualDuration && (request.actualDuration < 1 || request.actualDuration > 1440)) {
      throw new Error('La duración real debe estar entre 1 y 1440 minutos');
    }
  }

  private validateRescheduleRequest(request: RescheduleActivityRequest): void {
    if (!request.activityId || request.activityId <= 0) {
      throw new Error('ID de actividad inválido');
    }
    if (!request.newActivityDate) {
      throw new Error('La nueva fecha de actividad es requerida');
    }
    if (new Date(request.newActivityDate).getTime() < Date.now()) {
      throw new Error('La nueva fecha debe ser en el futuro');
    }
  }

  private validateAssignRequest(request: AssignActivityRequest): void {
    if (!request.activityId || request.activityId <= 0) {
      throw new Error('ID de actividad inválido');
    }
    if (!request.assignToSub?.trim()) {
      throw new Error('El usuario asignado es requerido');
    }
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  private handleSearchError(error: unknown, criteria: ActivitySearchCriteria): void {
    if (this.isApiError(error)) {
      if (error.code === ERROR_CODES.NETWORK_ERROR) {
        console.warn('Search failed offline, using cached results if available');
      } else if (error.status === 400) {
        console.error('Invalid search criteria:', criteria);
      }
    }
  }

  private handleActivityError(error: unknown, activityId?: number): void {
    if (!this.isApiError(error)) return;
    
    switch (error.code) {
      case ERROR_CODES.NOT_FOUND:
        console.warn('Activity not found:', activityId);
        break;
      case ERROR_CODES.VALIDATION_ERROR:
        console.warn('Activity validation failed:', this.safeGetDetails(error));
        break;
      case ERROR_CODES.CONCURRENT_MODIFICATION:
        console.warn('Activity was modified by another user:', activityId);
        break;
      case ERROR_CODES.DUPLICATE_ENTITY:
        console.warn('Activity conflict detected:', activityId);
        break;
    }
  }

  private handleConcurrencyError(error: unknown, activityId: number): void {
    if (!this.isApiError(error)) return;
    
    console.warn(`Concurrency conflict for activity ${activityId}:`, {
      currentVersion: this.safeGetProperty(error, 'currentVersion'),
      attemptedVersion: this.safeGetProperty(error, 'attemptedVersion'),
    });
  }

  // ============================================
  // TYPE GUARDS
  // ============================================

  private isApiError(error: unknown): error is { 
    code: string; 
    message: string; 
    status: number; 
    details?: Record<string, unknown>;
    [key: string]: unknown;
  } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'status' in error &&
      typeof (error as Record<string, unknown>)['code'] === 'string' &&
      typeof (error as Record<string, unknown>)['message'] === 'string' &&
      typeof (error as Record<string, unknown>)['status'] === 'number'
    );
  }

  private isConcurrencyError(error: unknown): boolean {
    return this.isApiError(error) && (
      error.code === ERROR_CODES.CONCURRENT_MODIFICATION ||
      error.code === ERROR_CODES.OPTIMISTIC_LOCKING_FAILURE
    );
  }

  // ============================================
  // SAFE PROPERTY ACCESS
  // ============================================

  private safeGetDetails(error: unknown): Record<string, unknown> {
    if (typeof error === 'object' && error !== null && 'details' in error) {
      const details = (error as Record<string, unknown>)['details'];
      return typeof details === 'object' && details !== null ? details as Record<string, unknown> : {};
    }
    return {};
  }

  private safeGetProperty(error: unknown, property: string): unknown {
    const details = this.safeGetDetails(error);
    return details[property];
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private async getExportHeaders(): Promise<Record<string, string>> {
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      
      return {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/octet-stream',
      };
    } catch {
      return { 'Accept': 'application/octet-stream' };
    }
  }

  private buildExportParams(criteria: ActivitySearchCriteria): URLSearchParams {
    const params = new URLSearchParams();
    
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, String(v)));
        } else {
          params.append(key, String(value));
        }
      }
    });
    
    return params;
  }

  private getBaseURL(): string {
    const envVar = import.meta.env['VITE_API_BASE_URL'];
    return typeof envVar === 'string' ? envVar : 'http://localhost:8080';
  }

  /**
   * Get optimal page size for mobile
   */
  getOptimalPageSize(): number {
    return APP_CONFIG.DEFAULT_PAGE_SIZE;
  }

  /**
   * Prefetch next page
   */
  async prefetchNextPage(
    criteria: ActivitySearchCriteria,
    currentPage: number,
    pageSize: number
  ): Promise<void> {
    try {
      await this.searchActivities(
        criteria,
        { page: currentPage + 1, size: pageSize, sort: ['activityDate,desc'] }
      );
    } catch {
      // Ignore prefetch errors silently
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const activityApi = new ActivityApiService();

// ============================================
// MOBILE-SPECIFIC HELPERS
// ============================================

/**
 * Helper para construir criterios de búsqueda mobile-friendly
 */
export const buildMobileActivitySearchCriteria = (filters: {
  search?: string;
  types?: string[];
  statuses?: string[];
  priorities?: string[];
  entityType?: 'CONTACT' | 'COMPANY' | 'DEAL';
  entityId?: number;
  onlyMine?: boolean;
  includeCompleted?: boolean;
}): ActivitySearchCriteria => {
  return {
    search: filters.search?.trim() || undefined,
    type: filters.types?.[0] as ActivityType | undefined,
    status: filters.statuses?.[0] as ActivityStatus | undefined,
    priority: filters.priorities?.[0] as any,
    entityType: filters.entityType,
    entityId: filters.entityId,
    onlyMine: filters.onlyMine,
    isCompleted: filters.includeCompleted,
  };
};

/**
 * Helper para construir paginación mobile-optimized
 */
export const buildMobileActivityPagination = (
  page: number,
  sortBy: string = 'activityDate',
  sortDirection: 'asc' | 'desc' = 'desc'
): PageRequest => {
  const pageSize = activityApi.getOptimalPageSize();
  
  return {
    page,
    size: pageSize,
    sort: [`${sortBy},${sortDirection}`],
  };
};

/**
 * Helper para manejar errores de Activity API de forma consistente
 */
export const handleActivityApiError = (error: unknown) => {
  // Type guard seguro
  const isApiError = (err: unknown): err is {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } => {
    return (
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      'code' in err &&
      'message' in err &&
      typeof (err as Record<string, unknown>)['status'] === 'number' &&
      typeof (err as Record<string, unknown>)['code'] === 'string' &&
      typeof (err as Record<string, unknown>)['message'] === 'string'
    );
  };

  if (!isApiError(error)) {
    return {
      type: 'unknown_error' as const,
      message: error instanceof Error ? error.message : 'Error desconocido.',
      action: 'retry',
    };
  }

  if (error.status === 409 && error.code === 'CONCURRENT_MODIFICATION') {
    const details = error.details || {};
    return {
      type: 'concurrency_conflict' as const,
      message: 'Esta actividad fue modificada por otro usuario.',
      action: 'refresh_and_retry',
      currentVersion: details['currentVersion'],
      attemptedVersion: details['attemptedVersion'],
    };
  }

  if (error.status === 409 && error.code === 'TIME_SLOT_CONFLICT') {
    return {
      type: 'time_conflict' as const,
      message: 'Ya existe una actividad programada en este horario.',
      action: 'reschedule',
    };
  }

  if (error.status === 422 && error.code === 'VALIDATION_ERROR') {
    return {
      type: 'validation_error' as const,
      message: 'Los datos ingresados no son válidos.',
      fieldErrors: error.details || {},
    };
  }

  if (error.status === 404) {
    return {
      type: 'not_found' as const,
      message: 'La actividad no fue encontrada.',
      action: 'redirect_to_list',
    };
  }

  if (error.code === ERROR_CODES.NETWORK_ERROR) {
    return {
      type: 'network_error' as const,
      message: 'Sin conexión a internet.',
      action: 'retry_when_online',
    };
  }

  return {
    type: 'unknown_error' as const,
    message: error.message || 'Error desconocido.',
    action: 'retry',
  };
};

export default activityApi;
