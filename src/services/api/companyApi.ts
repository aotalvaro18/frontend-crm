// src/services/api/companyApi.ts
// Company API service enterprise mobile-first - TypeScript-Safe
// 🔧 ACTUALIZADO: Usa endpoint unificado del backend

import { apiClient } from './baseApi';
import { APP_CONFIG, API_ENDPOINTS, ERROR_CODES } from '@/utils/constants';
import type {
  CompanyDTO,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanyType,
  CompanySearchCriteria,
  CompanyStats,
} from '@/types/company.types';

import type { 
  BulkOperationResult 
} from '@/types/api.types';

import type { PageRequest, PageResponse } from '@/types/common.types';

// ============================================
// TIPOS LOCALES
// ============================================

interface CompanyAvailability {
  available: boolean;
  existingCompanyId?: number;
}

// ============================================
// COMPANY API SERVICE CLASS
// ============================================

export class CompanyApiService {
  
  // ============================================
  // SEARCH & LIST OPERATIONS - SIMPLIFICADOS
  // ============================================

  /**
   * 🔧 SIMPLIFICADO: Única función para buscar y listar empresas.
   * 
   * Ahora usa el endpoint unificado GET /api/crm/companies que maneja
   * todos los casos: listado, búsqueda y filtros avanzados.
   * 
   * @param criteria Criterios de búsqueda opcionales
   * @param pagination Configuración de paginación
   * @returns Página de empresas que coinciden con los criterios
   */
  async searchCompanies(
    criteria: CompanySearchCriteria = {},
    pagination: PageRequest = { page: 0, size: 25, sort: ['name,asc'] }
  ): Promise<PageResponse<CompanyDTO>> {
    
    const params = new URLSearchParams();
    
    // Añadir todos los criterios de búsqueda que existan
    if (criteria.search) params.append('search', criteria.search);
    if (criteria.type) params.append('type', criteria.type);
    if (criteria.industry) params.append('industry', criteria.industry);
    if (criteria.size) params.append('size', String(criteria.size));
    if (criteria.city) params.append('city', criteria.city);
    if (criteria.state) params.append('state', criteria.state);
    if (criteria.country) params.append('country', criteria.country);
    if (criteria.minRevenue !== undefined) params.append('minRevenue', String(criteria.minRevenue));
    if (criteria.maxRevenue !== undefined) params.append('maxRevenue', String(criteria.maxRevenue));
    if (criteria.onlyOwned !== undefined) params.append('onlyOwned', String(criteria.onlyOwned));
    if (criteria.hasContacts !== undefined) params.append('hasContacts', String(criteria.hasContacts));
    if (criteria.hasActiveContacts !== undefined) params.append('hasActiveContacts', String(criteria.hasActiveContacts));
    if (criteria.hasDeals !== undefined) params.append('hasDeals', String(criteria.hasDeals));
    if (criteria.includeDeleted !== undefined) params.append('includeDeleted', String(criteria.includeDeleted));
    
    // Añadir la paginación
    params.append('page', String(pagination.page));
    params.append('size', String(pagination.size));
    params.append('sort', pagination.sort.join(','));

    // 🔧 ACTUALIZADO: Usar siempre el endpoint principal unificado
    const url = `${API_ENDPOINTS.COMPANIES}?${params.toString()}`;
    
    try {
      return await apiClient.get<PageResponse<CompanyDTO>>(url);
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
   * @returns Array de empresas para autocompletado
   */
  async autocompleteCompanies(
    term: string, 
    limit: number = 10
  ): Promise<CompanyDTO[]> {
    
    if (!term.trim() || term.length < 2) {
      return [];
    }

    const params = new URLSearchParams();
    params.append('search', term.trim()); // Usar searchTerm para consistencia
    params.append('limit', String(limit));

    // 🔧 ACTUALIZADO: Usar el endpoint unificado con parámetro limit
    const url = `${API_ENDPOINTS.COMPANIES}?${params.toString()}`;
    
    try {
      const pageResponse = await apiClient.get<PageResponse<CompanyDTO>>(url);
      return pageResponse.content; // Extraer solo el array de empresas
    } catch (error: unknown) {
      this.handleSearchError(error, { search: term });
      throw error;
    }
  }

  // ============================================
  // COMPANY TYPES OPERATION
  // ============================================

  /**
   * Obtiene los tipos de organización activos y filtrados desde el backend.
   * Llama al endpoint GET /api/crm/companies/types, que devuelve una lista
   * curada de tipos (ej. Empresa, Iglesia) para ser usados en formularios.
   *
   * @returns Una promesa que resuelve a un array de objetos con `value` y `label`.
   */
  async getActiveCompanyTypes(): Promise<{ value: string; label: string }[]> {
    const url = `${API_ENDPOINTS.COMPANIES}/types`;
    return apiClient.get<{ value: string; label: string }[]>(url);
  }

  // ============================================
  // INDIVIDUAL COMPANY OPERATIONS
  // ============================================

  /**
   * Obtener empresa por ID
   */
  async getCompanyById(id: number): Promise<CompanyDTO> {
    try {
      return await apiClient.get<CompanyDTO>(`${API_ENDPOINTS.COMPANIES}/${id}`);
    } catch (error: unknown) {
      this.handleCompanyError(error, id);
      throw error;
    }
  }

  /**
   * Crear nueva empresa
   */
  async createCompany(request: CreateCompanyRequest): Promise<CompanyDTO> {
    // Validación local primero
    this.validateCreateRequest(request);
    
    try {
      const result = await apiClient.post<CompanyDTO>(API_ENDPOINTS.COMPANIES, request);
      return result;
    } catch (error: unknown) {
      this.handleCompanyError(error);
      throw error;
    }
  }

  /**
   * Actualizar empresa con optimistic locking
   */
  async updateCompany(
    id: number, 
    request: UpdateCompanyRequest
  ): Promise<CompanyDTO> {
    
    // Validar version para optimistic locking
    if (typeof request.version !== 'number') {
      throw new Error('Version is required for company updates (optimistic locking)');
    }
    
    this.validateUpdateRequest(request);
    
    try {
      const result = await apiClient.put<CompanyDTO>(
        `${API_ENDPOINTS.COMPANIES}/${id}`, 
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
   * Soft delete empresa
   */
  async deleteCompany(id: number): Promise<void> {
    try {
      await apiClient.delete<void>(`${API_ENDPOINTS.COMPANIES}/${id}`);
    } catch (error: unknown) {
      this.handleCompanyError(error, id);
      throw error;
    }
  }

  // ============================================
  // RELATED DATA OPERATIONS
  // ============================================

  /**
   * Obtener contactos de una empresa
   */
  async getCompanyContacts(companyId: number): Promise<any[]> {
    try {
      return await apiClient.get<any[]>(`${API_ENDPOINTS.COMPANIES}/${companyId}/contacts`);
    } catch (error: unknown) {
      this.handleCompanyError(error, companyId);
      throw error;
    }
  }

  /**
   * Obtener deals de una empresa
   */
  async getCompanyDeals(companyId: number): Promise<any[]> {
    try {
      return await apiClient.get<any[]>(`${API_ENDPOINTS.COMPANIES}/${companyId}/deals`);
    } catch (error: unknown) {
      this.handleCompanyError(error, companyId);
      throw error;
    }
  }

  // ============================================
  // UTILITY OPERATIONS
  // ============================================

  /**
   * Verificar disponibilidad de nombre de empresa
   */
  async checkNameAvailability(name: string): Promise<CompanyAvailability> {
    if (!name || name.trim().length < 2) {
      return { available: false };
    }

    const params = new URLSearchParams();
    params.append('name', name.trim());
    
    const url = `${API_ENDPOINTS.COMPANIES}/check-name?${params.toString()}`;
    
    try {
      return await apiClient.get<CompanyAvailability>(url);
    } catch (error: unknown) {
      // Si no existe el endpoint, consideramos disponible
      return { available: true };
    }
  }

  /**
   * Estadísticas generales de empresas
   */
  async getCompanyStats(): Promise<CompanyStats> {
    return apiClient.get<CompanyStats>(`${API_ENDPOINTS.COMPANIES}/stats`);
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Bulk update de empresas
   */
  async bulkUpdateCompanies(
    companyIds: number[],
    updates: Partial<Pick<UpdateCompanyRequest, 'type' | 'industry' | 'size'>>
  ): Promise<BulkOperationResult> {
    
    if (companyIds.length > 100) {
      throw new Error('Bulk operations limited to 100 companies');
    }

    return apiClient.post<BulkOperationResult>(
      `${API_ENDPOINTS.COMPANIES}/bulk-update`,
      { companyIds, updates }
    );
  }

  /**
   * Bulk delete de empresas
   */
  async bulkDeleteCompanies(companyIds: number[]): Promise<BulkOperationResult> {
    if (companyIds.length > 50) {
      throw new Error('Bulk delete limited to 50 companies');
    }

    return apiClient.post<BulkOperationResult>(
      `${API_ENDPOINTS.COMPANIES}/bulk-delete`,
      { companyIds }
    );
  }

  // ============================================
  // EXPORT OPERATIONS
  // ============================================

  /**
   * Exportar empresas a CSV
   */
  async exportCompaniesCSV(criteria: CompanySearchCriteria = {}): Promise<Blob> {
    const params = this.buildExportParams(criteria);
    const baseURL = this.getBaseURL();
    
    const response = await fetch(
      `${baseURL}${API_ENDPOINTS.COMPANIES}/export/csv?${params.toString()}`,
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
   * Exportar empresas a Excel
   */
  async exportCompaniesExcel(criteria: CompanySearchCriteria = {}): Promise<Blob> {
    const params = this.buildExportParams(criteria);
    const baseURL = this.getBaseURL();
    
    const response = await fetch(
      `${baseURL}${API_ENDPOINTS.COMPANIES}/export/excel?${params.toString()}`,
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

  private validateCreateRequest(request: CreateCompanyRequest): void {
    if (!request.name?.trim()) {
      throw new Error('El nombre de la empresa es requerido');
    }
    if (!request.type) {
      throw new Error('El tipo de empresa es requerido');
    }
    if (request.email && !this.isValidEmail(request.email)) {
      throw new Error('El email no tiene un formato válido');
    }
    if (request.phone && !this.isValidPhone(request.phone)) {
      throw new Error('El teléfono no tiene un formato válido');
    }
    if (request.website && !this.isValidWebsite(request.website)) {
      throw new Error('El sitio web no tiene un formato válido');
    }
    if (request.annualRevenue && request.annualRevenue < 0) {
      throw new Error('El revenue anual no puede ser negativo');
    }
  }

  private validateUpdateRequest(request: UpdateCompanyRequest): void {
    if (request.name !== undefined && !request.name?.trim()) {
      throw new Error('El nombre de la empresa es requerido');
    }
    if (request.email && !this.isValidEmail(request.email)) {
      throw new Error('El email no tiene un formato válido');
    }
    if (request.phone && !this.isValidPhone(request.phone)) {
      throw new Error('El teléfono no tiene un formato válido');
    }
    if (request.website && !this.isValidWebsite(request.website)) {
      throw new Error('El sitio web no tiene un formato válido');
    }
    if (request.annualRevenue && request.annualRevenue < 0) {
      throw new Error('El revenue anual no puede ser negativo');
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

  private isValidWebsite(website: string): boolean {
    const websiteRegex = /^https?:\/\/.+/;
    return websiteRegex.test(website);
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  private handleSearchError(error: unknown, criteria: CompanySearchCriteria): void {
    if (this.isApiError(error)) {
      if (error.code === ERROR_CODES.NETWORK_ERROR) {
        console.warn('Search failed offline, using cached results if available');
      } else if (error.status === 400) {
        console.error('Invalid search criteria:', criteria);
      }
    }
  }

  private handleCompanyError(error: unknown, companyId?: number): void {
    if (!this.isApiError(error)) return;
    
    switch (error.code) {
      case ERROR_CODES.NOT_FOUND:
        console.warn('Company not found:', companyId);
        break;
      case ERROR_CODES.VALIDATION_ERROR:
        console.warn('Company validation failed:', this.safeGetDetails(error));
        break;
      case ERROR_CODES.CONCURRENT_MODIFICATION:
        console.warn('Company was modified by another user:', companyId);
        break;
      case ERROR_CODES.DUPLICATE_ENTITY:
        console.warn('Company name already exists:', companyId);
        break;
    }
  }

  private handleConcurrencyError(error: unknown, companyId: number): void {
    if (!this.isApiError(error)) return;
    
    console.warn(`Concurrency conflict for company ${companyId}:`, {
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

  private buildExportParams(criteria: CompanySearchCriteria): URLSearchParams {
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
    criteria: CompanySearchCriteria,
    currentPage: number,
    pageSize: number
  ): Promise<void> {
    try {
      await this.searchCompanies(
        criteria,
        { page: currentPage + 1, size: pageSize, sort: ['name,asc'] }
      );
    } catch {
      // Ignore prefetch errors silently
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const companyApi = new CompanyApiService();

// ============================================
// MOBILE-SPECIFIC HELPERS
// ============================================

/**
 * Helper para construir criterios de búsqueda mobile-friendly
 */
export const buildMobileCompanySearchCriteria = (filters: {
  search?: string;
  types?: string[];
  industries?: string[];
  sizes?: string[];
  onlyOwned?: boolean;
  includeArchived?: boolean;
}): CompanySearchCriteria => {
  return {
    search: filters.search?.trim() || undefined, // Cambio: usar searchTerm
    type: filters.types?.[0] as CompanyType | undefined,
    industry: filters.industries?.[0],
    size: filters.sizes?.[0] as any,
    onlyOwned: filters.onlyOwned,
    includeDeleted: filters.includeArchived,
  };
};

/**
 * Helper para construir paginación mobile-optimized
 */
export const buildMobileCompanyPagination = (
  page: number,
  sortBy: string = 'name',
  sortDirection: 'asc' | 'desc' = 'asc'
): PageRequest => {
  const pageSize = companyApi.getOptimalPageSize();
  
  return {
    page,
    size: pageSize,
    sort: [`${sortBy},${sortDirection}`],
  };
};

/**
 * Helper para manejar errores de Company API de forma consistente
 */
export const handleCompanyApiError = (error: unknown) => {
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
      message: 'Esta empresa fue modificada por otro usuario.',
      action: 'refresh_and_retry',
      currentVersion: details['currentVersion'],
      attemptedVersion: details['attemptedVersion'],
    };
  }

  if (error.status === 409 && error.code === 'DUPLICATE_ENTITY') {
    return {
      type: 'duplicate_error' as const,
      message: 'Ya existe una empresa con este nombre.',
      action: 'change_name',
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
      message: 'La empresa no fue encontrada.',
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

export default companyApi;