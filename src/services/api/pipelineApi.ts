// src/services/api/pipelineApi.ts
// Pipeline API service enterprise mobile-first - TypeScript-Safe
// 🔧 REPLICANDO: Estructura exacta de companyApi.ts

import { apiClient } from './baseApi';
import { API_ENDPOINTS } from '@/utils/constants';
import type {
  PipelineDTO,
  PipelineStageDTO,
  CreatePipelineRequest,
  UpdatePipelineRequest,
  CreatePipelineStageRequest,
  UpdatePipelineStageRequest,
  ReorderPipelineStagesRequest,
  PipelineSearchCriteria,
  PipelineStageSearchCriteria,
  PipelineStats,
} from '@/types/pipeline.types';

import type { 
  BulkOperationResult 
} from '@/types/api.types';

import type { PageRequest, PageResponse } from '@/types/common.types';
import { ERROR_CODES } from '@/utils/constants';

// ============================================
// PIPELINE API SERVICE CLASS
// ============================================

export class PipelineApiService {
  
  // ============================================
  // SEARCH & LIST OPERATIONS - SIMPLIFICADOS
  // ============================================

  /**
   * 🔧 SIMPLIFICADO: Única función para buscar y listar pipelines.
   * 
   * Usa el endpoint unificado GET /api/crm/pipelines que maneja
   * todos los casos: listado, búsqueda y filtros avanzados.
   * 
   * @param criteria Criterios de búsqueda opcionales
   * @param pagination Configuración de paginación
   * @returns Página de pipelines que coinciden con los criterios
   */
  async searchPipelines(
    criteria: PipelineSearchCriteria = {},
    pagination: PageRequest = { page: 0, size: 25, sort: ['name,asc'] }
  ): Promise<PageResponse<PipelineDTO>> {
    
    const params = new URLSearchParams();
    
    // Añadir todos los criterios de búsqueda que existan
    if (criteria.search) params.append('search', criteria.search);
    if (criteria.isDefault !== undefined) params.append('isDefault', String(criteria.isDefault));
    if (criteria.isActive !== undefined) params.append('isActive', String(criteria.isActive));
    if (criteria.type) params.append('type', criteria.type);
    if (criteria.hasDeals !== undefined) params.append('hasDeals', String(criteria.hasDeals));
    if (criteria.onlyOwned !== undefined) params.append('onlyOwned', String(criteria.onlyOwned));
    if (criteria.ownerCognitoSub) params.append('ownerCognitoSub', criteria.ownerCognitoSub);
    if (criteria.minDeals !== undefined) params.append('minDeals', String(criteria.minDeals));
    if (criteria.maxDeals !== undefined) params.append('maxDeals', String(criteria.maxDeals));
    if (criteria.minValue !== undefined) params.append('minValue', String(criteria.minValue));
    if (criteria.maxValue !== undefined) params.append('maxValue', String(criteria.maxValue));
    if (criteria.performanceStatus) params.append('performanceStatus', criteria.performanceStatus);
    if (criteria.minConversionRate !== undefined) params.append('minConversionRate', String(criteria.minConversionRate));
    if (criteria.maxConversionRate !== undefined) params.append('maxConversionRate', String(criteria.maxConversionRate));
    if (criteria.requiresApproval !== undefined) params.append('requiresApproval', String(criteria.requiresApproval));
    if (criteria.autoProgressRules !== undefined) params.append('autoProgressRules', String(criteria.autoProgressRules));
    
    // Añadir la paginación
    params.append('page', String(pagination.page));
    params.append('size', String(pagination.size));
    params.append('sort', pagination.sort.join(','));

    // 🔧 ACTUALIZADO: Usar siempre el endpoint principal unificado
    const url = `${API_ENDPOINTS.PIPELINES}?${params.toString()}`;
    
    try {
      return await apiClient.get<PageResponse<PipelineDTO>>(url);
    } catch (error: unknown) {
      this.handleSearchError(error, criteria);
      throw error;
    }
  }

  /**
   * 🔧 SIMPLIFICADO: Autocompletar pipelines usa el mismo endpoint.
   * 
   * Utiliza el endpoint unificado con el parámetro 'limit' para obtener
   * resultados optimizados para componentes de autocompletado.
   * 
   * @param term Término de búsqueda
   * @param limit Máximo número de resultados
   * @returns Array de pipelines para autocompletado
   */
  async autocompletePipelines(
    term: string, 
    limit: number = 10
  ): Promise<PipelineDTO[]> {
    
    if (!term.trim() || term.length < 2) {
      return [];
    }

    const params = new URLSearchParams();
    params.append('search', term.trim());
    params.append('limit', String(limit));

    // 🔧 ACTUALIZADO: Usar el endpoint unificado con parámetro limit
    const url = `${API_ENDPOINTS.PIPELINES}?${params.toString()}`;
    
    try {
      const pageResponse = await apiClient.get<PageResponse<PipelineDTO>>(url);
      return pageResponse.content; // Extraer solo el array de pipelines
    } catch (error: unknown) {
      this.handleSearchError(error, { search: term });
      throw error;
    }
  }

  // ============================================
  // PIPELINE TYPES OPERATION
  // ============================================

  /**
   * Obtiene los tipos de pipeline activos desde el backend.
   * Llama al endpoint GET /api/crm/pipelines/types, que devuelve una lista
   * curada de tipos (ej. Sales, Lead Nurturing) para ser usados en formularios.
   *
   * @returns Una promesa que resuelve a un array de objetos con `value` y `label`.
   */
  async getActivePipelineTypes(): Promise<{ value: string; label: string }[]> {
    const url = `${API_ENDPOINTS.PIPELINES}/types`;
    return apiClient.get<{ value: string; label: string }[]>(url);
  }

  /**
   * Obtiene plantillas predefinidas de pipelines
   */
  async getPipelineTemplates(): Promise<{ id: string; name: string; description: string; stages: any[] }[]> {
    const url = `${API_ENDPOINTS.PIPELINES}/templates`;
    return apiClient.get<{ id: string; name: string; description: string; stages: any[] }[]>(url);
  }

  // ============================================
  // INDIVIDUAL PIPELINE OPERATIONS
  // ============================================

  /**
   * Obtener pipeline por ID con sus etapas
   */
  async getPipelineById(id: number): Promise<PipelineDTO> {
    try {
      return await apiClient.get<PipelineDTO>(`${API_ENDPOINTS.PIPELINES}/${id}`);
    } catch (error: unknown) {
      this.handlePipelineError(error, id);
      throw error;
    }
  }

  /**
   * Crear nuevo pipeline con sus etapas
   */
  async createPipeline(request: CreatePipelineRequest): Promise<PipelineDTO> {
    // Validación local primero
    this.validateCreatePipelineRequest(request);
    
    try {
      const result = await apiClient.post<PipelineDTO>(API_ENDPOINTS.PIPELINES, request);
      return result;
    } catch (error: unknown) {
      this.handlePipelineError(error);
      throw error;
    }
  }

  /**
   * Actualizar pipeline con optimistic locking
   */
  async updatePipeline(
    id: number, 
    request: UpdatePipelineRequest
  ): Promise<PipelineDTO> {
    
    // Validar version para optimistic locking
    if (typeof request.version !== 'number') {
      throw new Error('Version is required for pipeline updates (optimistic locking)');
    }
    
    this.validateUpdatePipelineRequest(request);
    
    try {
      const result = await apiClient.put<PipelineDTO>(
        `${API_ENDPOINTS.PIPELINES}/${id}`, 
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
   * Soft delete pipeline
   */
  async deletePipeline(id: number): Promise<void> {
    try {
      await apiClient.delete<void>(`${API_ENDPOINTS.PIPELINES}/${id}`);
    } catch (error: unknown) {
      this.handlePipelineError(error, id);
      throw error;
    }
  }

  // ============================================
  // PIPELINE STAGE OPERATIONS
  // ============================================

  /**
   * Buscar etapas de un pipeline específico
   */
  async searchPipelineStages(
    criteria: PipelineStageSearchCriteria = {},
    pagination: PageRequest = { page: 0, size: 50, sort: ['order,asc'] }
  ): Promise<PageResponse<PipelineStageDTO>> {
    
    const params = new URLSearchParams();
    
    if (criteria.search) params.append('search', criteria.search);
    if (criteria.pipelineId !== undefined) params.append('pipelineId', String(criteria.pipelineId));
    if (criteria.isClosedWon !== undefined) params.append('isClosedWon', String(criteria.isClosedWon));
    if (criteria.isClosedLost !== undefined) params.append('isClosedLost', String(criteria.isClosedLost));
    if (criteria.minDealCount !== undefined) params.append('minDealCount', String(criteria.minDealCount));
    if (criteria.maxDealCount !== undefined) params.append('maxDealCount', String(criteria.maxDealCount));
    if (criteria.minValue !== undefined) params.append('minValue', String(criteria.minValue));
    if (criteria.maxValue !== undefined) params.append('maxValue', String(criteria.maxValue));
    if (criteria.minProbability !== undefined) params.append('minProbability', String(criteria.minProbability));
    if (criteria.maxProbability !== undefined) params.append('maxProbability', String(criteria.maxProbability));
    
    // Paginación
    params.append('page', String(pagination.page));
    params.append('size', String(pagination.size));
    params.append('sort', pagination.sort.join(','));

    const url = `/api/crm/pipeline-stages?${params.toString()}`;
    
    try {
      return await apiClient.get<PageResponse<PipelineStageDTO>>(url);
    } catch (error: unknown) {
      this.handleSearchError(error, criteria);
      throw error;
    }
  }

  /**
   * Obtener etapa específica por ID
   */
  async getStageById(id: number): Promise<PipelineStageDTO> {
    try {
      return await apiClient.get<PipelineStageDTO>(`/api/crm/pipeline-stages/${id}`);
    } catch (error: unknown) {
      this.handleStageError(error, id);
      throw error;
    }
  }

  /**
   * Crear nueva etapa en un pipeline
   */
  async createStage(request: CreatePipelineStageRequest): Promise<PipelineStageDTO> {
    this.validateCreateStageRequest(request);
    
    try {
      const result = await apiClient.post<PipelineStageDTO>('/api/crm/pipeline-stages', request);
      return result;
    } catch (error: unknown) {
      this.handleStageError(error);
      throw error;
    }
  }

  /**
   * Actualizar etapa existente
   */
  async updateStage(
    id: number, 
    request: UpdatePipelineStageRequest
  ): Promise<PipelineStageDTO> {
    
    if (typeof request.version !== 'number') {
      throw new Error('Version is required for stage updates (optimistic locking)');
    }
    
    this.validateUpdateStageRequest(request);
    
    try {
      const result = await apiClient.put<PipelineStageDTO>(
        `/api/crm/pipeline-stages/${id}`, 
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
   * Eliminar etapa
   */
  async deleteStage(id: number): Promise<void> {
    try {
      await apiClient.delete<void>(`/api/crm/pipeline-stages/${id}`);
    } catch (error: unknown) {
      this.handleStageError(error, id);
      throw error;
    }
  }

  /**
   * Reordenar etapas de un pipeline
   */
  async reorderStages(request: ReorderPipelineStagesRequest): Promise<PipelineDTO> {
    this.validateReorderRequest(request);
    
    try {
      const result = await apiClient.put<PipelineDTO>(
        `${API_ENDPOINTS.PIPELINES}/${request.pipelineId}/reorder-stages`, 
        request
      );
      return result;
    } catch (error: unknown) {
      if (this.isConcurrencyError(error)) {
        this.handleConcurrencyError(error, request.pipelineId);
      }
      throw error;
    }
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Operaciones masivas sobre pipelines
   */
  async bulkDeletePipelines(ids: number[]): Promise<BulkOperationResult> {
    if (!ids.length) {
        return { deleted: 0, failed: 0, errors: [] };
    }

    try {
      return await apiClient.post<BulkOperationResult>(
        `${API_ENDPOINTS.PIPELINES}/bulk-delete`, 
        { ids }
      );
    } catch (error: unknown) {
      this.handleBulkError(error);
      throw error;
    }
  }

  /**
   * Duplicar un pipeline con todas sus etapas
   */
  async duplicatePipeline(id: number, newName: string): Promise<PipelineDTO> {
    try {
      const result = await apiClient.post<PipelineDTO>(
        `${API_ENDPOINTS.PIPELINES}/${id}/duplicate`, 
        { name: newName }
      );
      return result;
    } catch (error: unknown) {
      this.handlePipelineError(error, id);
      throw error;
    }
  }

  // ============================================
  // METRICS & ANALYTICS
  // ============================================

  /**
   * Obtener estadísticas generales de pipelines
   */
  async getPipelineStats(): Promise<PipelineStats> {
    try {
      return await apiClient.get<PipelineStats>(`${API_ENDPOINTS.PIPELINES}/stats`);
    } catch (error: unknown) {
      this.handleMetricsError(error);
      throw error;
    }
  }

  
  // ============================================
  // VALIDATION METHODS (PRIVADAS)
  // ============================================

  private validateCreatePipelineRequest(request: CreatePipelineRequest): void {
    if (!request.name?.trim()) {
      throw new Error('Pipeline name is required');
    }
    
    if (request.name.length > 100) {
      throw new Error('Pipeline name cannot exceed 100 characters');
    }

    if (!request.stages || request.stages.length < 2) {
      throw new Error('Pipeline must have at least 2 stages');
    }

    if (request.stages.length > 20) {
      throw new Error('Pipeline cannot have more than 20 stages');
    }

    // Validar nombres únicos de etapas
    const stageNames = request.stages.map(s => s.name?.trim().toLowerCase());
    const uniqueNames = new Set(stageNames);
    if (stageNames.length !== uniqueNames.size) {
      throw new Error('Stage names must be unique within the pipeline');
    }

    // Validar cada etapa
    request.stages.forEach((stage, index) => {
      if (!stage.name?.trim()) {
        throw new Error(`Stage ${index + 1} name is required`);
      }
      if (stage.name.length > 50) {
        throw new Error(`Stage ${index + 1} name cannot exceed 50 characters`);
      }
    });
  }

  private validateUpdatePipelineRequest(request: UpdatePipelineRequest): void {
    if (request.name !== undefined) {
      if (!request.name?.trim()) {
        throw new Error('Pipeline name cannot be empty');
      }
      if (request.name.length > 100) {
        throw new Error('Pipeline name cannot exceed 100 characters');
      }
    }

    if (request.stages) {
      if (request.stages.length < 2) {
        throw new Error('Pipeline must have at least 2 stages');
      }
      if (request.stages.length > 20) {
        throw new Error('Pipeline cannot have more than 20 stages');
      }
    }
  }

  private validateCreateStageRequest(request: CreatePipelineStageRequest): void {
    if (!request.name?.trim()) {
      throw new Error('Stage name is required');
    }
    
    if (request.name.length > 50) {
      throw new Error('Stage name cannot exceed 50 characters');
    }

    if (request.probability !== undefined && (request.probability < 0 || request.probability > 100)) {
      throw new Error('Stage probability must be between 0 and 100');
    }
  }

  private validateUpdateStageRequest(request: UpdatePipelineStageRequest): void {
    if (request.name !== undefined) {
      if (!request.name?.trim()) {
        throw new Error('Stage name cannot be empty');
      }
      if (request.name.length > 50) {
        throw new Error('Stage name cannot exceed 50 characters');
      }
    }

    if (request.probability !== undefined && (request.probability < 0 || request.probability > 100)) {
      throw new Error('Stage probability must be between 0 and 100');
    }
  }

  private validateReorderRequest(request: ReorderPipelineStagesRequest): void {
    if (!request.pipelineId) {
      throw new Error('Pipeline ID is required for reordering stages');
    }

    if (!request.stageOrders || request.stageOrders.length === 0) {
      throw new Error('Stage orders are required for reordering');
    }

    if (typeof request.version !== 'number') {
      throw new Error('Version is required for reordering (optimistic locking)');
    }
  }

  // ============================================
  // ERROR HANDLING METHODS (PRIVADAS)
  // ============================================

  private handleSearchError(error: unknown, criteria?: any): void {
    console.error('🚨 Pipeline search error:', error, 'criteria:', criteria);
    
    if (this.isValidationError(error)) {
      throw new Error('Invalid search criteria. Please check your filters.');
    }
    
    if (this.isNetworkError(error)) {
      throw new Error('Network error. Please check your connection and try again.');
    }
  }

  private handlePipelineError(error: unknown, pipelineId?: number): void {
    console.error('🚨 Pipeline operation error:', error, 'pipelineId:', pipelineId);
    
    if (this.isNotFoundError(error)) {
      throw new Error(`Pipeline ${pipelineId ? `#${pipelineId}` : ''} not found`);
    }
    
    if (this.isValidationError(error)) {
      // Error del backend - usar mensaje original
      throw error;
    }
    
    if (this.isDuplicateError(error)) {
      throw new Error('A pipeline with this name already exists');
    }
  }

  private handleStageError(error: unknown, stageId?: number): void {
    console.error('🚨 Pipeline stage operation error:', error, 'stageId:', stageId);
    
    if (this.isNotFoundError(error)) {
      throw new Error(`Pipeline stage ${stageId ? `#${stageId}` : ''} not found`);
    }
    
    if (this.isValidationError(error)) {
      throw error;
    }
  }

  private handleBulkError(error: unknown): void {
    console.error('🚨 Pipeline bulk operation error:', error);
    throw new Error('Bulk operation failed. Some pipelines may not have been processed.');
  }

  private handleMetricsError(error: unknown): void {
    console.error('🚨 Pipeline metrics error:', error);
    throw new Error('Unable to load pipeline metrics. Please try again later.');
  }

  private handleConcurrencyError(error: unknown, entityId: number): void {
    console.error('🚨 Pipeline optimistic locking error:', error, 'entityId:', entityId);
    throw new Error(
      'This pipeline has been modified by another user. Please refresh and try again.'
    );
  }

  // ============================================
  // ERROR TYPE CHECKERS (PRIVADAS)
  // ============================================

  private isConcurrencyError(error: unknown): boolean {
    return (
      error instanceof Error && 
      (error.message.includes('OptimisticLock') || 
       error.message.includes('version') ||
       error.message.includes('409'))
    );
  }

  private isValidationError(error: unknown): boolean {
    return (
      error instanceof Error && 
      (error.message.includes('validation') || 
       error.message.includes('400'))
    );
  }

  private isNotFoundError(error: unknown): boolean {
    return (
      error instanceof Error && 
      (error.message.includes('not found') || 
       error.message.includes('404'))
    );
  }

  private isDuplicateError(error: unknown): boolean {
    return (
      error instanceof Error && 
      (error.message.includes('duplicate') || 
       error.message.includes('already exists') ||
       error.message.includes('409'))
    );
  }

  private isNetworkError(error: unknown): boolean {
    return (
      error instanceof Error && 
      (error.message.includes('network') || 
       error.message.includes('fetch') ||
       error.message.includes('timeout'))
    );
  }
}

/**
 * Helper para manejar errores de Pipeline API de forma consistente
 */
export const handlePipelineApiError = (error: unknown) => {
    // Type guard seguro (sin cambios)
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
        message: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
        action: 'retry',
      };
    }
  
    // ✅ CAMBIO: Mensajes adaptados a "Pipeline"
    if (error.status === 409 && error.code === 'CONCURRENT_MODIFICATION') {
      const details = error.details || {};
      return {
        type: 'concurrency_conflict' as const,
        message: 'Este pipeline fue modificado por otro usuario.',
        action: 'refresh_and_retry',
        currentVersion: details['currentVersion'],
        attemptedVersion: details['attemptedVersion'],
      };
    }
  
    // ✅ CAMBIO: Mensajes adaptados a "Pipeline"
    if (error.status === 409 && error.code === 'DUPLICATE_ENTITY') {
      return {
        type: 'duplicate_error' as const,
        message: 'Ya existe un pipeline con este nombre.',
        action: 'change_name',
      };
    }
  
    if (error.status === 422 && error.code === 'VALIDATION_ERROR') {
      return {
        type: 'validation_error' as const,
        message: 'Los datos ingresados para el pipeline no son válidos.',
        fieldErrors: error.details || {},
      };
    }
  
    // ✅ CAMBIO: Mensajes adaptados a "Pipeline"
    if (error.status === 404) {
      return {
        type: 'not_found' as const,
        message: 'El pipeline no fue encontrado.',
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
      message: error.message || 'Error desconocido al procesar el pipeline.',
      action: 'retry',
    };
  };

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================

export const pipelineApi = new PipelineApiService();
export default pipelineApi;