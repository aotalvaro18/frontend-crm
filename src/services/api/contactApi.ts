// src/services/api/contactApi.ts
// Contact API service enterprise mobile-first - CORREGIDO TypeScript-Safe
// Solo usa tipos que EXISTEN en tu proyecto + pragmatismo inteligente

import { apiClient } from './baseApi';
import { APP_CONFIG, API_ENDPOINTS, ERROR_CODES } from '@/utils/constants';
import type {
  ContactDTO,
  CreateContactRequest,
  UpdateContactRequest,
  ContactSource,
  ContactSearchCriteria,
} from '@/types/contact.types';

// ============================================
// TIPOS LOCALES (Ya que no existen en tu proyecto)
// ============================================

// Types básicos que necesitamos pero no están definidos
interface PageRequest {
  page: number;
  size: number;
  sort: string[];
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Tipos simplificados para stats y utilidades
interface ContactStats {
  total: number;
  active: number;
  inactive: number;
  withPortal: number;
  adoptionRate: number;
}

interface EmailAvailability {
  available: boolean;
  existingContactId?: number;
}

interface BulkOperationResult {
  updated: number;
  failed: number;
  errors: string[];
}

// ============================================
// CONTACT API SERVICE CLASS
// ============================================

export class ContactApiService {
  
  // ============================================
  // SEARCH & LIST OPERATIONS (TypeScript-Safe)
  // ============================================

  /**
   * Búsqueda avanzada de contactos
   * CORREGIDO: Usa solo apiClient sin opciones extra
   */
  async searchContacts(
    criteria: ContactSearchCriteria = {},
    pagination: PageRequest = { page: 0, size: 20, sort: ['lastName,asc'] }
  ): Promise<PageResponse<ContactDTO>> {
    
    const params = new URLSearchParams();
    
    // Search criteria (solo los que existen en ContactSearchCriteria)
    if (criteria.search) params.append('search', criteria.search);
    if (criteria.source) params.append('source', criteria.source);
    if (criteria.status) params.append('status', criteria.status);
    if (criteria.gender) params.append('gender', criteria.gender);
    if (criteria.onlyOwned !== undefined) params.append('onlyOwned', String(criteria.onlyOwned));
    if (criteria.onlySystemUsers !== undefined) params.append('onlySystemUsers', String(criteria.onlySystemUsers));
    if (criteria.includeDeleted !== undefined) params.append('includeDeleted', String(criteria.includeDeleted));
    if (criteria.tags && criteria.tags.length > 0) params.append('tags', criteria.tags.join(','));
    
    // Pagination
    params.append('page', String(pagination.page));
    params.append('size', String(Math.min(pagination.size, APP_CONFIG.MAX_PAGE_SIZE)));
    params.append('sort', pagination.sort.join(','));

    try {
      const url = `${API_ENDPOINTS.CONTACTS}?${params.toString()}`;
      return await apiClient.get<PageResponse<ContactDTO>>(url);
    } catch (error: unknown) {
      this.handleSearchError(error, criteria);
      throw error;
    }
  }

  /**
   * Autocompletar contactos
   * CORREGIDO: Usa el endpoint correcto y tipo simple
   */
  async autocompleteContacts(
    term: string, 
    limit: number = 10
  ): Promise<ContactDTO[]> {
    
    if (!term.trim() || term.length < 2) {
      return [];
    }

    const params = new URLSearchParams();
    params.append('term', term.trim());
    params.append('limit', String(limit));

    const url = `${API_ENDPOINTS.CONTACT_AUTOCOMPLETE}?${params.toString()}`;
    return apiClient.get<ContactDTO[]>(url);
  }

  // ============================================
  // INDIVIDUAL CONTACT OPERATIONS
  // ============================================

  /**
   * Obtener contacto por ID
   */
  async getContactById(id: number): Promise<ContactDTO> {
    try {
      return await apiClient.get<ContactDTO>(API_ENDPOINTS.CONTACT_BY_ID(id));
    } catch (error: unknown) {
      this.handleContactError(error, id);
      throw error;
    }
  }

  /**
   * Crear nuevo contacto
   */
  async createContact(request: CreateContactRequest): Promise<ContactDTO> {
    // Validación local primero
    this.validateCreateRequest(request);
    
    try {
      const result = await apiClient.post<ContactDTO>(API_ENDPOINTS.CONTACTS, request);
      return result;
    } catch (error: unknown) {
      this.handleContactError(error);
      throw error;
    }
  }

  /**
   * Actualizar contacto con optimistic locking
   */
  async updateContact(
    id: number, 
    request: UpdateContactRequest
  ): Promise<ContactDTO> {
    
    // Validar version para optimistic locking
    if (typeof request.version !== 'number') {
      throw new Error('Version is required for contact updates (optimistic locking)');
    }
    
    this.validateUpdateRequest(request);
    
    try {
      const result = await apiClient.put<ContactDTO>(
        API_ENDPOINTS.CONTACT_BY_ID(id), 
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
   * Soft delete contacto
   */
  async deleteContact(id: number): Promise<void> {
    try {
      await apiClient.delete<void>(API_ENDPOINTS.CONTACT_BY_ID(id));
    } catch (error: unknown) {
      this.handleContactError(error, id);
      throw error;
    }
  }

  // ============================================
  // MEMBER PORTAL OPERATIONS (Simplificadas)
  // ============================================

  /**
   * Generar invitación de portal para miembro
   */
  async generateMemberPortalInvitation(contactId: number): Promise<{ invitationToken: string }> {
    try {
      const result = await apiClient.post<{ invitationToken: string }>(
        API_ENDPOINTS.CONTACT_PORTAL_INVITATION(contactId)
      );
      return result;
    } catch (error: unknown) {
      this.handlePortalError(error, contactId);
      throw error;
    }
  }

  /**
   * Reenviar invitación de portal
   */
  async resendPortalInvitation(contactId: number): Promise<{ invitationToken: string }> {
    return apiClient.post<{ invitationToken: string }>(
      `${API_ENDPOINTS.CONTACT_PORTAL_INVITATION(contactId)}/resend`
    );
  }

  /**
   * Revocar acceso de portal
   */
  async revokePortalAccess(contactId: number): Promise<void> {
    await apiClient.delete<void>(`${API_ENDPOINTS.CONTACT_BY_ID(contactId)}/portal-access`);
  }

  // ============================================
  // UTILITY OPERATIONS
  // ============================================

  /**
   * Verificar disponibilidad de email
   */
  async checkEmailAvailability(email: string): Promise<EmailAvailability> {
    if (!email || !this.isValidEmail(email)) {
      return { available: false };
    }

    const params = new URLSearchParams();
    params.append('email', email.toLowerCase().trim());
    
    const url = `${API_ENDPOINTS.CONTACT_CHECK_EMAIL}?${params.toString()}`;
    return apiClient.get<EmailAvailability>(url);
  }

  /**
   * Estadísticas generales de contactos
   */
  async getContactStats(): Promise<ContactStats> {
    return apiClient.get<ContactStats>(API_ENDPOINTS.CONTACT_STATS);
  }

  // ============================================
  // EXPORT OPERATIONS (Simplificadas)
  // ============================================

  /**
   * Exportar contactos a CSV
   * CORREGIDO: Usa fetch directo para blobs
   */
  async exportContactsCSV(criteria: ContactSearchCriteria = {}): Promise<Blob> {
    const params = this.buildExportParams(criteria);
    const baseURL = this.getBaseURL();
    
    const response = await fetch(
      `${baseURL}${API_ENDPOINTS.CONTACT_EXPORT_CSV}?${params.toString()}`,
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
   * Exportar contactos a Excel
   */
  async exportContactsExcel(criteria: ContactSearchCriteria = {}): Promise<Blob> {
    const params = this.buildExportParams(criteria);
    const baseURL = this.getBaseURL();
    
    const response = await fetch(
      `${baseURL}${API_ENDPOINTS.CONTACT_EXPORT_EXCEL}?${params.toString()}`,
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
  // BULK OPERATIONS
  // ============================================

  /**
   * Bulk update de contactos
   */
  async bulkUpdateContacts(
    contactIds: number[],
    updates: Partial<Pick<UpdateContactRequest, 'status' | 'source'>>
  ): Promise<BulkOperationResult> {
    
    if (contactIds.length > 100) {
      throw new Error('Bulk operations limited to 100 contacts');
    }

    return apiClient.post<BulkOperationResult>(
      `${API_ENDPOINTS.CONTACTS}/bulk-update`,
      { contactIds, updates }
    );
  }

  /**
   * Bulk delete de contactos
   */
  async bulkDeleteContacts(contactIds: number[]): Promise<BulkOperationResult> {
    if (contactIds.length > 50) {
      throw new Error('Bulk delete limited to 50 contacts');
    }

    return apiClient.post<BulkOperationResult>(
      `${API_ENDPOINTS.CONTACTS}/bulk-delete`,
      { contactIds }
    );
  }

  // ============================================
  // VALIDATION HELPERS
  // ============================================

  private validateCreateRequest(request: CreateContactRequest): void {
    if (!request.firstName?.trim()) {
      throw new Error('El nombre es requerido');
    }
    if (!request.lastName?.trim()) {
      throw new Error('El apellido es requerido');
    }
    if (request.email && !this.isValidEmail(request.email)) {
      throw new Error('El email no tiene un formato válido');
    }
    if (request.phone && !this.isValidPhone(request.phone)) {
      throw new Error('El teléfono no tiene un formato válido');
    }
  }

  private validateUpdateRequest(request: UpdateContactRequest): void {
    // CORREGIDO: Solo validamos las propiedades que sabemos que existen
    if (!request.firstName?.trim()) {
      throw new Error('El nombre es requerido');
    }
    if (!request.lastName?.trim()) {
      throw new Error('El apellido es requerido');
    }
    if (request.email && !this.isValidEmail(request.email)) {
      throw new Error('El email no tiene un formato válido');
    }
    if (request.phone && !this.isValidPhone(request.phone)) {
      throw new Error('El teléfono no tiene un formato válido');
    }
    if (typeof request.version !== 'number') {
      throw new Error('La versión es requerida para actualizaciones');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone);
  }

  // ============================================
  // ERROR HANDLING (TypeScript-Safe)
  // ============================================

  private handleSearchError(error: unknown, criteria: ContactSearchCriteria): void {
    if (this.isApiError(error)) {
      if (error.code === ERROR_CODES.NETWORK_ERROR) {
        console.warn('📱 Search failed offline, using cached results if available');
      } else if (error.status === 400) {
        console.error('Invalid search criteria:', criteria);
      }
    }
  }

  private handleContactError(error: unknown, contactId?: number): void {
    if (!this.isApiError(error)) return;
    
    switch (error.code) {
      case ERROR_CODES.NOT_FOUND:
        console.warn('Contact not found:', contactId);
        break;
      case ERROR_CODES.VALIDATION_ERROR:
        console.warn('Contact validation failed:', this.safeGetDetails(error));
        break;
      case ERROR_CODES.CONCURRENT_MODIFICATION:
        console.warn('Contact was modified by another user:', contactId);
        break;
    }
  }

  private handleConcurrencyError(error: unknown, contactId: number): void {
    if (!this.isApiError(error)) return;
    
    console.warn(`🔄 Concurrency conflict for contact ${contactId}:`, {
      currentVersion: this.safeGetProperty(error, 'currentVersion'),
      attemptedVersion: this.safeGetProperty(error, 'attemptedVersion'),
    });
  }

  private handlePortalError(error: unknown, contactId: number): void {
    if (!this.isApiError(error)) {
      // Si no es un error de API, al menos loguea el error desconocido con el ID del contacto
      console.error(`Unknown portal error for contact ID: ${contactId}`, error);
      return;
    }
    
    // ✅ CORRECCIÓN: Ahora usamos 'contactId' para dar contexto al log de error.
    console.warn(`Portal API error for contact ID: ${contactId}`, {
      code: error.code,
      message: error.message,
    });
  
    switch (error.code) {
      case ERROR_CODES.VALIDATION_ERROR:
        if (error.message?.includes('email')) {
          throw new Error('Se requiere un email válido para generar la invitación de portal');
        }
        break;
      case ERROR_CODES.BUSINESS_CONTEXT_ERROR:
        throw new Error('El contacto no cumple los requisitos para acceso al portal');
    }
  }

  // ============================================
  // TYPE GUARDS (Siguiendo tu guía TypeScript)
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
    return this.isApiError(error) && error.code === ERROR_CODES.CONCURRENT_MODIFICATION;
  }

  // ============================================
  // SAFE PROPERTY ACCESS (TypeScript-Safe)
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

  private buildExportParams(criteria: ContactSearchCriteria): URLSearchParams {
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
    // CORREGIDO: Acceso seguro a import.meta.env
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
    criteria: ContactSearchCriteria,
    currentPage: number,
    pageSize: number
  ): Promise<void> {
    try {
      await this.searchContacts(
        criteria,
        { page: currentPage + 1, size: pageSize, sort: ['lastName,asc'] }
      );
    } catch {
      // Ignore prefetch errors silently
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const contactApi = new ContactApiService();

// ============================================
// MOBILE-SPECIFIC HELPERS (TypeScript-Safe)
// ============================================

/**
 * Helper para construir criterios de búsqueda mobile-friendly
 * CORREGIDO: Solo usa propiedades que existen en ContactSearchCriteria
 */
export const buildMobileSearchCriteria = (filters: {
  search?: string;
  sources?: string[];
  statuses?: string[];
  tags?: string[];
  onlyOwned?: boolean;
  includeArchived?: boolean;
}): ContactSearchCriteria => {
  return {
    search: filters.search?.trim() || undefined,
    source: filters.sources?.[0] as ContactSource | undefined, // Mobile: Solo un source por simplicidad
    status: filters.statuses?.[0] as ContactSearchCriteria['status'],
    tags: filters.tags,
    onlyOwned: filters.onlyOwned,
    includeDeleted: filters.includeArchived,
  };
};

/**
 * Helper para construir paginación mobile-optimized
 */
export const buildMobilePagination = (
  page: number,
  sortBy: string = 'lastName',
  sortDirection: 'asc' | 'desc' = 'asc'
): PageRequest => {
  const pageSize = contactApi.getOptimalPageSize();
  
  return {
    page,
    size: pageSize,
    sort: [`${sortBy},${sortDirection}`],
  };
};

/**
 * Helper para manejar errores de Contact API de forma consistente
 * CORREGIDO: TypeScript-safe con type guards seguros
 */
export const handleContactApiError = (error: unknown) => {
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
      message: 'Este contacto fue modificado por otro usuario.',
      action: 'refresh_and_retry',
      currentVersion: details['currentVersion'],
      attemptedVersion: details['attemptedVersion'],
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
      message: 'El contacto no fue encontrado.',
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

export default contactApi;