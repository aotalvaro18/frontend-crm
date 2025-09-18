// src/services/api/dealApi.ts
// Deal API service enterprise mobile-first - TypeScript-Safe
// ✅ REPLICANDO estructura de CompanyApiService con especialización para oportunidades
// 🎯 DRAG & DROP: Incluye métodos específicos para Kanban y movimiento de etapas

import { apiClient } from './baseApi';
import { API_ENDPOINTS, ERROR_CODES } from '@/utils/constants';
import { getErrorCode, getErrorMessage } from './baseApi';
import type {
  DealDTO,
  CreateDealRequest,
  UpdateDealRequest,
  DealSearchCriteria,
  DealStats,
  MoveDealToStageRequest,
  CloseDealWonRequest,
  CloseDealLostRequest,
  ReopenDealRequest,
  KanbanData, // ✅ CORRECCIÓN 2: Importar desde types en lugar de definir localmente
} from '@/types/deal.types';

import type { 
  BulkOperationResult 
} from '@/types/api.types';

import type { PageRequest, PageResponse } from '@/types/common.types';

// ============================================
// ✅ CORRECCIÓN 3: Tipos locales optimizados (solo los que no están en types/)
// ============================================

interface DealAvailability {
  available: boolean;
  conflictingDealId?: number;
  conflictingDealName?: string;
}

interface DealValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================
// DEAL API SERVICE CLASS
// ============================================

export class DealApiService {
  
  // ============================================
  // SEARCH & LIST OPERATIONS - SIMPLIFICADOS
  // ============================================

  /**
   * 🔧 SIMPLIFICADO: Única función para buscar y listar oportunidades.
   * 
   * Usa el endpoint unificado GET /api/crm/deals que maneja
   * todos los casos: listado, búsqueda, filtros avanzados y Kanban.
   * 
   * @param criteria Criterios de búsqueda opcionales
   * @param pagination Configuración de paginación
   * @returns Página de oportunidades que coinciden con los criterios
   */
  async searchDeals(
    criteria: DealSearchCriteria = {},
    pagination: PageRequest = { page: 0, size: 25, sort: ['name,asc'] }
  ): Promise<PageResponse<DealDTO>> {
    
    const params = new URLSearchParams();
    
    // Añadir todos los criterios de búsqueda que existan
    if (criteria.search) params.append('search', criteria.search);
    if (criteria.pipelineId) params.append('pipelineId', String(criteria.pipelineId));
    if (criteria.stageId) params.append('stageId', String(criteria.stageId));
    if (criteria.contactId) params.append('contactId', String(criteria.contactId));
    if (criteria.companyId) params.append('companyId', String(criteria.companyId));
    if (criteria.status) params.append('status', criteria.status);
    if (criteria.priority) params.append('priority', criteria.priority);
    if (criteria.type) params.append('type', criteria.type);
    if (criteria.source) params.append('source', criteria.source);
    if (criteria.minAmount !== undefined) params.append('minAmount', String(criteria.minAmount));
    if (criteria.maxAmount !== undefined) params.append('maxAmount', String(criteria.maxAmount));
    if (criteria.minProbability !== undefined) params.append('minProbability', String(criteria.minProbability));
    if (criteria.maxProbability !== undefined) params.append('maxProbability', String(criteria.maxProbability));
    if (criteria.expectedCloseFrom) params.append('expectedCloseFrom', criteria.expectedCloseFrom);
    if (criteria.expectedCloseTo) params.append('expectedCloseTo', criteria.expectedCloseTo);
    if (criteria.onlyOwned !== undefined) params.append('onlyOwned', String(criteria.onlyOwned));
    if (criteria.hasActivities !== undefined) params.append('hasActivities', String(criteria.hasActivities));
    if (criteria.riskLevel) params.append('riskLevel', criteria.riskLevel);
    if (criteria.includeDeleted !== undefined) params.append('includeDeleted', String(criteria.includeDeleted));
    
    // Añadir la paginación
    params.append('page', String(pagination.page));
    params.append('size', String(pagination.size));
    params.append('sort', pagination.sort.join(','));

    // 🔧 ACTUALIZADO: Usar siempre el endpoint principal unificado
    const url = `${API_ENDPOINTS.DEALS}?${params.toString()}`;
    
    try {
      return await apiClient.get<PageResponse<DealDTO>>(url);
    } catch (error: unknown) {
      this.handleSearchError(error, criteria);
      throw error;
    }
  }

  /**
   * 🔧 SIMPLIFICADO: Autocompletar oportunidades.
   * 
   * Usa el mismo endpoint con límite pequeño y ordenamiento por relevancia.
   * Perfecto para campos de búsqueda y selección.
   * 
   * @param query Término de búsqueda
   * @param limit Número máximo de resultados (default: 10)
   * @returns Lista pequeña de oportunidades para autocompletar
   */
  async autocompleteDeal(query: string, limit: number = 10): Promise<DealDTO[]> {
    const criteria: DealSearchCriteria = { 
      search: query,
      status: 'OPEN' // Solo oportunidades abiertas para autocompletar
    };
    const pagination: PageRequest = { 
      page: 0, 
      size: limit, 
      sort: ['name,asc'] 
    };
    
    const result = await this.searchDeals(criteria, pagination);
    return result.content;
  }

  /**
   * 📊 Obtener métricas de pipeline para Kanban.
   * 
   * Este es el endpoint clave para la vista Kanban. Devuelve no solo
   * las oportunidades sino también las métricas por etapa y pipeline.
   * 
   * @param pipelineId ID del pipeline a analizar
   * @returns Datos completos para renderizar el Kanban
   */
  async getPipelineKanbanData(pipelineId: number): Promise<KanbanData> {
    // ✅ CORRECCIÓN 4: Endpoint corregido
    const url = `${API_ENDPOINTS.DEALS}/pipeline/${pipelineId}/kanban`;
    
    try {
      return await apiClient.get<KanbanData>(url);
    } catch (error: unknown) {
      this.handlePipelineError(error, pipelineId);
      throw error;
    }
  }

  /**
   * 📈 Obtener estadísticas generales de oportunidades.
   * 
   * Llama al endpoint GET /api/crm/deals/stats para obtener métricas
   * agregadas que se muestran en el dashboard y reportes.
   * 
   * @returns Estadísticas calculadas del backend
   */
  async getDealStats(): Promise<DealStats> {
    const url = `${API_ENDPOINTS.DEAL_STATS}`;
    return apiClient.get<DealStats>(url);
  }

  // ============================================
  // INDIVIDUAL DEAL OPERATIONS
  // ============================================

  /**
   * Obtener oportunidad por ID
   */
  async getDealById(id: number): Promise<DealDTO> {
    try {
      return await apiClient.get<DealDTO>(API_ENDPOINTS.DEAL_BY_ID(id));
    } catch (error: unknown) {
      this.handleDealError(error, id);
      throw error;
    }
  }

  /**
   * Crear nueva oportunidad
   */
  async createDeal(request: CreateDealRequest): Promise<DealDTO> {
    // Validación local primero
    this.validateCreateRequest(request);
    
    try {
      const result = await apiClient.post<DealDTO>(API_ENDPOINTS.DEALS, request);
      return result;
    } catch (error: unknown) {
      this.handleDealError(error);
      throw error;
    }
  }

  /**
   * Actualizar oportunidad con optimistic locking
   */
  async updateDeal(
    id: number, 
    request: UpdateDealRequest
  ): Promise<DealDTO> {
    
    // Validar version para optimistic locking
    if (typeof request.version !== 'number') {
      throw new Error('Version is required for deal updates (optimistic locking)');
    }
    
    this.validateUpdateRequest(request);
    
    try {
      const result = await apiClient.put<DealDTO>(
        `${API_ENDPOINTS.DEALS}/${id}`, 
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
   * Soft delete oportunidad
   */
  async deleteDeal(id: number): Promise<void> {
    try {
      await apiClient.delete<void>(`${API_ENDPOINTS.DEALS}/${id}`);
    } catch (error: unknown) {
      this.handleDealError(error, id);
      throw error;
    }
  }

  // ============================================
  // 🎯 KANBAN & PIPELINE SPECIFIC OPERATIONS
  // ============================================

  /**
   * 🔄 Mover oportunidad a otra etapa (DRAG & DROP)
   * 
   * Esta es la función clave para el Kanban. Se llama cuando
   * el usuario arrastra una tarjeta de deal a otra columna.
   * 
   * @param dealId ID de la oportunidad a mover
   * @param newStageId ID de la nueva etapa
   * @param newProbability Nueva probabilidad (opcional, se puede auto-calcular)
   * @returns Oportunidad actualizada con la nueva etapa
   */
  async moveDealToStage(
    dealId: number, 
    newStageId: number, 
    newProbability?: number
  ): Promise<DealDTO> {
    
    const request: MoveDealToStageRequest = {
      dealId,
      newStageId,
      newProbability
    };
    
    try {
      const result = await apiClient.patch<DealDTO>(
        API_ENDPOINTS.DEAL_STAGE_MOVE(dealId, newStageId), 
        request
      );
      return result;
    } catch (error: unknown) {
      this.handleStageMovementError(error, dealId, newStageId);
      throw error;
    }
  }

  /**
   * 🎯 Cerrar oportunidad como ganada
   */
  async closeDealWon(request: CloseDealWonRequest): Promise<DealDTO> {
    try {
      const result = await apiClient.patch<DealDTO>(
        API_ENDPOINTS.DEAL_CLOSE_WON(request.dealId), 
        request
      );
      return result;
    } catch (error: unknown) {
      this.handleCloseError(error, request.dealId, 'WON');
      throw error;
    }
  }

  /**
   * ❌ Cerrar oportunidad como perdida
   */
  async closeDealLost(request: CloseDealLostRequest): Promise<DealDTO> {
    try {
      const result = await apiClient.patch<DealDTO>(
        API_ENDPOINTS.DEAL_CLOSE_LOST(request.dealId), 
        request
      );
      return result;
    } catch (error: unknown) {
      this.handleCloseError(error, request.dealId, 'LOST');
      throw error;
    }
  }

  /**
   * 🔄 Reabrir oportunidad
   */
  async reopenDeal(request: ReopenDealRequest): Promise<DealDTO> {
    try {
      const result = await apiClient.patch<DealDTO>(
        API_ENDPOINTS.DEAL_REOPEN(request.dealId), 
        request
      );
      return result;
    } catch (error: unknown) {
      this.handleReopenError(error, request.dealId);
      throw error;
    }
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Operación masiva: actualizar múltiples oportunidades
   */
  async bulkUpdateDeals(
    dealIds: number[], 
    updates: Partial<Pick<DealDTO, 'stageId' | 'priority' | 'type' | 'ownerCognitoSub'>>
  ): Promise<BulkOperationResult> {
    
    try {
      const result = await apiClient.patch<BulkOperationResult>(
        `${API_ENDPOINTS.DEALS}/bulk-update`, 
        { dealIds, updates }
      );
      return result;
    } catch (error: unknown) {
      this.handleBulkError(error, 'update', dealIds.length);
      throw error;
    }
  }

  /**
   * Operación masiva: eliminar múltiples oportunidades
   * ✅ CORRECCIÓN: Siguiendo exactamente el patrón de bulkDeleteCompanies
   */
  async bulkDeleteDeals(dealIds: number[]): Promise<BulkOperationResult> {
    if (dealIds.length > 50) {
      throw new Error('Bulk delete limited to 50 deals');
    }

    try {
      const result = await apiClient.post<BulkOperationResult>(
        `${API_ENDPOINTS.DEALS}/bulk-delete`,
        { dealIds }
      );
      return result;
    } catch (error: unknown) {
      this.handleBulkError(error, 'delete', dealIds.length);
      throw error;
    }
  }

  // ============================================
  // VALIDATION METHODS
  // ============================================

  /**
   * Validar request de creación
   */
  private validateCreateRequest(request: CreateDealRequest): void {
    const errors: string[] = [];

    // Validaciones obligatorias
    if (!request.title?.trim()) {
      errors.push('El nombre de la oportunidad es obligatorio');
    }

    if (!request.pipelineId || request.pipelineId <= 0) {
      errors.push('Debe seleccionar un pipeline válido');
    }

    if (!request.stageId || request.stageId <= 0) {
      errors.push('Debe seleccionar una etapa válida');
    }

    if (!request.contactId || request.contactId <= 0) {
      errors.push('Debe asociar la oportunidad a un contacto');
    }

    // Validaciones de rangos
    if (request.amount !== undefined && request.amount < 0) {
      errors.push('El monto no puede ser negativo');
    }

    if (request.probability !== undefined && (request.probability < 0 || request.probability > 100)) {
      errors.push('La probabilidad debe estar entre 0 y 100');
    }

    // Validación de fechas
    if (request.expectedCloseDate) {
      const closeDate = new Date(request.expectedCloseDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (closeDate < today) {
        errors.push('La fecha esperada de cierre no puede ser en el pasado');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }
  }

  /**
   * Validar request de actualización
   */
  private validateUpdateRequest(request: UpdateDealRequest): void {
    const errors: string[] = [];

    // Validaciones condicionales
    if (request.title !== undefined && !request.title?.trim()) {
      errors.push('El nombre no puede estar vacío');
    }

    if (request.amount !== undefined && request.amount < 0) {
      errors.push('El monto no puede ser negativo');
    }

    if (request.probability !== undefined && (request.probability < 0 || request.probability > 100)) {
      errors.push('La probabilidad debe estar entre 0 y 100');
    }

    // Validación de fechas en actualizaciones
    if (request.expectedCloseDate) {
      const closeDate = new Date(request.expectedCloseDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (closeDate < today) {
        errors.push('La fecha esperada de cierre no puede ser en el pasado');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }
  }

  // ============================================
  // ✅ CORRECCIÓN 5: ERROR HANDLING METHODS - Usando helpers consolidados
  // ============================================

  /**
   * Manejo de errores de búsqueda
   */
  private handleSearchError(error: unknown, criteria: DealSearchCriteria): void {
    console.error('❌ Deal search error:', { error, criteria });
    
    // Agregar contexto específico para debugging
    if (criteria.pipelineId) {
      console.error(`Pipeline ID: ${criteria.pipelineId}`);
    }
    if (criteria.stageId) {
      console.error(`Stage ID: ${criteria.stageId}`);
    }
  }

  /**
   * Manejo de errores específicos de oportunidades
   */
  private handleDealError(error: unknown, dealId?: number): void {
    console.error('❌ Deal operation error:', { error, dealId });
    
    // Log adicional para debugging
    if (dealId) {
      console.error(`Deal ID: ${dealId}`);
    }
  }

  /**
   * Manejo de errores de pipeline
   */
  private handlePipelineError(error: unknown, pipelineId: number): void {
    console.error('❌ Pipeline operation error:', { error, pipelineId });
  }

  /**
   * Manejo de errores de movimiento de etapas (crítico para Kanban)
   */
  private handleStageMovementError(error: unknown, dealId: number, newStageId: number): void {
    console.error('❌ Stage movement error:', { error, dealId, newStageId });
    
    // Este error es crítico para UX del Kanban
    console.error('🎯 Kanban drag & drop failed - this affects user workflow');
  }

  /**
   * Manejo de errores de cierre de oportunidades
   */
  private handleCloseError(error: unknown, dealId: number, closeType: 'WON' | 'LOST'): void {
    console.error('❌ Deal close error:', { error, dealId, closeType });
  }

  /**
   * Manejo de errores de reapertura
   */
  private handleReopenError(error: unknown, dealId: number): void {
    console.error('❌ Deal reopen error:', { error, dealId });
  }

  /**
   * Manejo de errores de operaciones masivas
   */
  private handleBulkError(error: unknown, operation: string, count: number): void {
    console.error('❌ Bulk operation error:', { error, operation, count });
  }

  /**
   * Detectar errores de concurrencia (optimistic locking)
   */
  private isConcurrencyError(error: unknown): boolean {
    return getErrorCode(error) === ERROR_CODES.OPTIMISTIC_LOCKING_FAILURE ||
           getErrorMessage(error).toLowerCase().includes('version') ||
           getErrorMessage(error).toLowerCase().includes('concurrent');
  }

  /**
   * Manejo específico de errores de concurrencia
   */
  private handleConcurrencyError(error: unknown, dealId: number): void {
    console.error('⚠️ Optimistic locking failure for deal:', { dealId, error });
    throw new Error('La oportunidad fue modificada por otro usuario. Por favor, recarga y vuelve a intentar.');
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Verificar disponibilidad de nombre de oportunidad
   */
  async checkDealNameAvailability(name: string, excludeDealId?: number): Promise<DealAvailability> {
    const params = new URLSearchParams();
    params.append('name', name);
    if (excludeDealId) {
      params.append('excludeId', String(excludeDealId));
    }

    const url = `${API_ENDPOINTS.DEALS}/check-name?${params.toString()}`;
    return apiClient.get<DealAvailability>(url);
  }

  /**
   * Validar oportunidad antes de operaciones críticas
   */
  async validateDeal(dealId: number): Promise<DealValidationResult> {
    const url = `${API_ENDPOINTS.DEALS}/${dealId}/validate`;
    return apiClient.get<DealValidationResult>(url);
  }
}

// ============================================
// SINGLETON INSTANCE & ERROR HANDLER
// ============================================

export const dealApi = new DealApiService();

/**
 * ✅ CORRECCIÓN 6: Manejo unificado de errores usando helpers consolidados
 * Función equivalente a handleCompanyApiError pero para deals
 */
export const handleDealApiError = (error: unknown) => {
  const defaultError = {
    type: 'unknown_error' as const,
    message: 'Error desconocido al procesar la oportunidad.',
    action: 'retry',
  };

  if (!error) return defaultError;

  // Error de red
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network_error' as const,
      message: 'Error de conexión. Verifica tu internet.',
      action: 'retry_when_online',
    };
  }

  // Error con estructura esperada
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    const code = getErrorCode(error); // ✅ Usando helper consolidado
    const message = getErrorMessage(error); // ✅ Usando helper consolidado

    if (status === 400) {
      return {
        type: 'validation_error' as const,
        message: message || 'Datos de la oportunidad inválidos.',
        action: 'fix_input',
        fieldErrors: (error as any).details || {},
      };
    }

    if (status === 404) {
      return {
        type: 'not_found' as const,
        message: 'La oportunidad no fue encontrada.',
        action: 'redirect_to_list',
      };
    }

    if (status === 409) {
      if (code === 'OPTIMISTIC_LOCKING_FAILURE') {
        return {
          type: 'concurrency_error' as const,
          message: 'La oportunidad fue modificada por otro usuario.',
          action: 'reload_and_retry',
        };
      }

      return {
        type: 'conflict_error' as const,
        message: message || 'Conflicto al procesar la oportunidad.',
        action: 'reload_and_retry',
      };
    }

    if (code === ERROR_CODES.NETWORK_ERROR) {
      return {
        type: 'network_error' as const,
        message: 'Sin conexión a internet.',
        action: 'retry_when_online',
      };
    }
  }

  return {
    type: 'unknown_error' as const,
    message: getErrorMessage(error) || 'Error desconocido.', // ✅ Usando helper consolidado
    action: 'retry',
  };
};

export default dealApi;