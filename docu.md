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
  PipelineMetricsResponse,
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

  /**
   * Obtener métricas detalladas de pipelines
   */
  async getPipelineMetrics(
    startDate?: string, 
    endDate?: string
  ): Promise<PipelineMetricsResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `${API_ENDPOINTS.PIPELINES}/metrics?${params.toString()}`;
    
    try {
      return await apiClient.get<PipelineMetricsResponse>(url);
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

    if (!request.pipelineId) {
      throw new Error('Pipeline ID is required for stage creation');
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











// src/hooks/usePipelines.ts
// ✅ Enterprise pipeline hooks - VERSIÓN FINAL CON REACT QUERY COMO FUENTE DE VERDAD
// El store de Zustand maneja el estado de la UI y las acciones (mutaciones).
// React Query maneja los datos del servidor (fetching, caching, invalidation).

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';
import { useQuery } from '@tanstack/react-query';

import { 
  pipelineApi,
  handlePipelineApiError  
} from '@/services/api/pipelineApi';

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
} from '@/types/pipeline.types';

// ============================================
// REACT QUERY KEYS (ÚNICA FUENTE DE VERDAD PARA CACHÉ)
// ============================================
// Exportamos las llaves para que los componentes puedan usarlas con useQuery.

export const PIPELINES_LIST_QUERY_KEY = (criteria: PipelineSearchCriteria = {}, page = 0) => 
  ['pipelines', 'list', { ...criteria, page }];
export const PIPELINE_DETAIL_QUERY_KEY = (id: number | null) => ['pipelines', 'detail', id];
export const PIPELINE_STATS_QUERY_KEY = ['pipelines', 'stats'];
export const PIPELINE_METRICS_QUERY_KEY = (startDate?: string, endDate?: string) => 
  ['pipelines', 'metrics', { startDate, endDate }];

// Keys para Pipeline Stages
export const PIPELINE_STAGES_LIST_QUERY_KEY = (criteria: PipelineStageSearchCriteria = {}, page = 0) => 
  ['pipeline-stages', 'list', { ...criteria, page }];
export const PIPELINE_STAGE_DETAIL_QUERY_KEY = (id: number | null) => ['pipeline-stages', 'detail', id];

// Keys para tipos y templates
export const PIPELINE_TYPES_QUERY_KEY = ['pipelines', 'types'];
export const PIPELINE_TEMPLATES_QUERY_KEY = ['pipelines', 'templates'];

// ============================================
// PIPELINE STORE STATE (Simplificado: solo estado de UI y acciones)
// ============================================

interface PipelineState {
  // Estado de operaciones - Pipelines
  isCreating: boolean;
  updating: Set<number>;
  deleting: Set<number>;
  duplicating: Set<number>;
  
  // Estado de operaciones - Stages
  isCreatingStage: boolean;
  updatingStages: Set<number>;
  deletingStages: Set<number>;
  reorderingStages: boolean;
  
  // Estado para selecciones y operaciones en lote
  selectedPipelineIds: Set<number>;
  selectedStageIds: Set<number>;
  bulkOperationLoading: boolean;
  
  // Acciones de Pipeline (mutaciones y manejo de estado de UI)
  createPipeline: (request: CreatePipelineRequest, onSuccess?: (newPipeline: PipelineDTO) => void) => Promise<void>;
  updatePipeline: (id: number, request: UpdatePipelineRequest, onSuccess?: () => void) => Promise<void>;
  deletePipeline: (id: number, onSuccess?: () => void) => Promise<void>;
  duplicatePipeline: (id: number, newName: string, onSuccess?: (newPipeline: PipelineDTO) => void) => Promise<void>;

  // Acciones de Pipeline Stage
  createStage: (request: CreatePipelineStageRequest, onSuccess?: (newStage: PipelineStageDTO) => void) => Promise<void>;
  updateStage: (id: number, request: UpdatePipelineStageRequest, onSuccess?: () => void) => Promise<void>;
  deleteStage: (id: number, onSuccess?: () => void) => Promise<void>;
  reorderStages: (request: ReorderPipelineStagesRequest, onSuccess?: () => void) => Promise<void>;

  // Selección - Pipelines
  selectPipeline: (id: number) => void;
  selectAllPipelines: (pipelineIds: number[]) => void;
  deselectPipeline: (id: number) => void;
  deselectAllPipelines: () => void;
  
  // Selección - Stages
  selectStage: (id: number) => void;
  selectAllStages: (stageIds: number[]) => void;
  deselectStage: (id: number) => void;
  deselectAllStages: () => void;
  
  // Operaciones masivas
  bulkDeletePipelines: () => Promise<void>;
  bulkDeleteStages: () => Promise<void>;
}

// ============================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================

export const usePipelineStore = create<PipelineState>()(
  devtools(
    (set, get) => ({
      // INITIAL STATE
      isCreating: false,
      updating: new Set(),
      deleting: new Set(),
      duplicating: new Set(),
      isCreatingStage: false,
      updatingStages: new Set(),
      deletingStages: new Set(),
      reorderingStages: false,
      selectedPipelineIds: new Set(),
      selectedStageIds: new Set(),
      bulkOperationLoading: false,

      // ============================================
      // ACCIONES DE MUTACIÓN - PIPELINES (CUD)
      // ============================================
      
      createPipeline: async (request, onSuccess) => {
        set({ isCreating: true });
        try {
          const newPipeline = await pipelineApi.createPipeline(request);
          // Invalidar TODO lo relacionado con pipelines
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          // Forzar refetch inmediato
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'pipelines'
          });
          toast.success('Pipeline creado exitosamente');
          onSuccess?.(newPipeline);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set({ isCreating: false });
        }
      },

      updatePipeline: async (id, request, onSuccess) => {
        set(state => ({ updating: new Set(state.updating).add(id) }));
        try {
          const updatedPipeline = await pipelineApi.updatePipeline(id, request);
          // Invalidar caché de lista y detalle específico
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          await queryClient.invalidateQueries({ queryKey: PIPELINE_DETAIL_QUERY_KEY(id) });
          toast.success('Pipeline actualizado exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newUpdating = new Set(state.updating);
            newUpdating.delete(id);
            return { updating: newUpdating };
          });
        }
      },

      deletePipeline: async (id, onSuccess) => {
        set(state => ({ deleting: new Set(state.deleting).add(id) }));
        try {
          await pipelineApi.deletePipeline(id);
          // Invalidar caché
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          // Remover caché específica del pipeline eliminado
          queryClient.removeQueries({ queryKey: PIPELINE_DETAIL_QUERY_KEY(id) });
          toast.success('Pipeline eliminado exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newDeleting = new Set(state.deleting);
            newDeleting.delete(id);
            return { deleting: newDeleting };
          });
        }
      },

      duplicatePipeline: async (id, newName, onSuccess) => {
        set(state => ({ duplicating: new Set(state.duplicating).add(id) }));
        try {
          const newPipeline = await pipelineApi.duplicatePipeline(id, newName);
          // Invalidar caché
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          toast.success(`Pipeline "${newName}" duplicado exitosamente`);
          onSuccess?.(newPipeline);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newDuplicating = new Set(state.duplicating);
            newDuplicating.delete(id);
            return { duplicating: newDuplicating };
          });
        }
      },

      // ============================================
      // ACCIONES DE MUTACIÓN - PIPELINE STAGES (CUD)
      // ============================================

      createStage: async (request, onSuccess) => {
        set({ isCreatingStage: true });
        try {
          const newStage = await pipelineApi.createStage(request);
          // Invalidar caché de stages y pipeline padre
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          if (request.pipelineId) {
            await queryClient.invalidateQueries({ queryKey: PIPELINE_DETAIL_QUERY_KEY(request.pipelineId) });
          }
          toast.success('Etapa creada exitosamente');
          onSuccess?.(newStage);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set({ isCreatingStage: false });
        }
      },

      updateStage: async (id, request, onSuccess) => {
        set(state => ({ updatingStages: new Set(state.updatingStages).add(id) }));
        try {
          const updatedStage = await pipelineApi.updateStage(id, request);
          // Invalidar caché relacionado
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: PIPELINE_STAGE_DETAIL_QUERY_KEY(id) });
          // Si la etapa pertenece a un pipeline específico, invalidar el pipeline también
          if (request.pipelineId) {
            await queryClient.invalidateQueries({ queryKey: PIPELINE_DETAIL_QUERY_KEY(request.pipelineId) });
          }
          toast.success('Etapa actualizada exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newUpdating = new Set(state.updatingStages);
            newUpdating.delete(id);
            return { updatingStages: newUpdating };
          });
        }
      },

      deleteStage: async (id, onSuccess) => {
        set(state => ({ deletingStages: new Set(state.deletingStages).add(id) }));
        try {
          await pipelineApi.deleteStage(id);
          // Invalidar caché
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          queryClient.removeQueries({ queryKey: PIPELINE_STAGE_DETAIL_QUERY_KEY(id) });
          toast.success('Etapa eliminada exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newDeleting = new Set(state.deletingStages);
            newDeleting.delete(id);
            return { deletingStages: newDeleting };
          });
        }
      },

      reorderStages: async (request, onSuccess) => {
        set({ reorderingStages: true });
        try {
          const updatedPipeline = await pipelineApi.reorderStages(request);
          // Invalidar caché del pipeline y sus etapas
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: PIPELINE_DETAIL_QUERY_KEY(request.pipelineId) });
          toast.success('Etapas reordenadas exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set({ reorderingStages: false });
        }
      },

      // ============================================
      // BULK & SELECTION ACTIONS - PIPELINES
      // ============================================
      
      selectPipeline: (id) => set(state => ({ selectedPipelineIds: new Set(state.selectedPipelineIds).add(id) })),
      deselectPipeline: (id) => set(state => {
        const newSelection = new Set(state.selectedPipelineIds);
        newSelection.delete(id);
        return { selectedPipelineIds: newSelection };
      }),
      selectAllPipelines: (pipelineIds) => set({ selectedPipelineIds: new Set(pipelineIds) }),
      deselectAllPipelines: () => set({ selectedPipelineIds: new Set() }),

      // ============================================
      // BULK & SELECTION ACTIONS - STAGES
      // ============================================

      selectStage: (id) => set(state => ({ selectedStageIds: new Set(state.selectedStageIds).add(id) })),
      deselectStage: (id) => set(state => {
        const newSelection = new Set(state.selectedStageIds);
        newSelection.delete(id);
        return { selectedStageIds: newSelection };
      }),
      selectAllStages: (stageIds) => set({ selectedStageIds: new Set(stageIds) }),
      deselectAllStages: () => set({ selectedStageIds: new Set() }),

      // ============================================
      // BULK OPERATIONS
      // ============================================

      bulkDeletePipelines: async () => {
        const { selectedPipelineIds } = get();
        if (selectedPipelineIds.size === 0) return;
        set({ bulkOperationLoading: true });
        try {
          await pipelineApi.bulkDeletePipelines(Array.from(selectedPipelineIds));
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          set({ selectedPipelineIds: new Set() });
          toast.success(`${selectedPipelineIds.size} pipelines eliminados.`);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
        } finally {
          set({ bulkOperationLoading: false });
        }
      },

      bulkDeleteStages: async () => {
        const { selectedStageIds } = get();
        if (selectedStageIds.size === 0) return;
        set({ bulkOperationLoading: true });
        try {
          // Eliminar etapas una por una (el API no tiene bulk delete para stages)
          const promises = Array.from(selectedStageIds).map(id => pipelineApi.deleteStage(id));
          await Promise.all(promises);
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          set({ selectedStageIds: new Set() });
          toast.success(`${selectedStageIds.size} etapas eliminadas.`);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
        } finally {
          set({ bulkOperationLoading: false });
        }
      },
    }),
    {
      name: 'pipeline-store',
    }
  )
);

// ============================================
// HOOKS ESPECIALIZADOS (Exportados para uso en componentes)
// ============================================

/**
 * Hook para las operaciones de CUD (Create, Update, Delete) y estados relacionados.
 * Los componentes usarán este hook para MODIFICAR datos.
 */
export const usePipelineOperations = () => {
  const operations = usePipelineStore(state => ({
    createPipeline: state.createPipeline,
    updatePipeline: state.updatePipeline,
    deletePipeline: state.deletePipeline,
    duplicatePipeline: state.duplicatePipeline,
    isCreating: state.isCreating,
    updating: state.updating,
    deleting: state.deleting,
    duplicating: state.duplicating,
  }));

  // Devolvemos las operaciones y funciones para chequear el estado por ID
  return {
    ...operations,
    isUpdating: (id: number) => operations.updating.has(id),
    isDeleting: (id: number) => operations.deleting.has(id),
    isDuplicating: (id: number) => operations.duplicating.has(id),
  };
};

/**
 * Hook para las operaciones de etapas (stages)
 */
export const usePipelineStageOperations = () => {
  const operations = usePipelineStore(state => ({
    createStage: state.createStage,
    updateStage: state.updateStage,
    deleteStage: state.deleteStage,
    reorderStages: state.reorderStages,
    isCreatingStage: state.isCreatingStage,
    updatingStages: state.updatingStages,
    deletingStages: state.deletingStages,
    reorderingStages: state.reorderingStages,
  }));

  return {
    ...operations,
    isUpdatingStage: (id: number) => operations.updatingStages.has(id),
    isDeletingStage: (id: number) => operations.deletingStages.has(id),
  };
};

/**
 * Hook para obtener pipeline por ID
 */
export const usePipelineById = (id: number) => {
  return useQuery({
    queryKey: PIPELINE_DETAIL_QUERY_KEY(id),
    queryFn: () => pipelineApi.getPipelineById(id),
    enabled: !!id && id > 0,
  });
};

/**
 * Hook para obtener etapa por ID
 */
export const usePipelineStageById = (id: number) => {
  return useQuery({
    queryKey: PIPELINE_STAGE_DETAIL_QUERY_KEY(id),
    queryFn: () => pipelineApi.getStageById(id),
    enabled: !!id && id > 0,
  });
};

/**
 * Hook para las operaciones en lote (Bulk) y estados de selección.
 * Los componentes usarán este hook para seleccionar múltiples pipelines y hacer operaciones masivas.
 */
export const useBulkPipelineOperations = () => {
  return usePipelineStore(state => ({
    selectedPipelineIds: state.selectedPipelineIds,
    selectedStageIds: state.selectedStageIds,
    bulkOperationLoading: state.bulkOperationLoading,
    selectPipeline: state.selectPipeline,
    deselectPipeline: state.deselectPipeline,
    selectAllPipelines: state.selectAllPipelines,
    deselectAllPipelines: state.deselectAllPipelines,
    selectStage: state.selectStage,
    deselectStage: state.deselectStage,
    selectAllStages: state.selectAllStages,
    deselectAllStages: state.deselectAllStages,
    bulkDeletePipelines: state.bulkDeletePipelines,
    bulkDeleteStages: state.bulkDeleteStages,
  }));
};

// ============================================
// HOOKS DE CONSULTA (REACT QUERY)
// ============================================

/**
 * Hook para obtener estadísticas de pipelines
 */
export const usePipelineStats = () => {
  return useQuery({
    queryKey: PIPELINE_STATS_QUERY_KEY,
    queryFn: () => pipelineApi.getPipelineStats(),
  });
};

/**
 * Hook para obtener métricas detalladas de pipelines
 */
export const usePipelineMetrics = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: PIPELINE_METRICS_QUERY_KEY(startDate, endDate),
    queryFn: () => pipelineApi.getPipelineMetrics(startDate, endDate),
  });
};

/**
 * Hook para obtener tipos de pipeline
 */
export const usePipelineTypes = () => {
  return useQuery({
    queryKey: PIPELINE_TYPES_QUERY_KEY,
    queryFn: () => pipelineApi.getActivePipelineTypes(),
    staleTime: 1000 * 60 * 5, // 5 minutos - los tipos no cambian frecuentemente
  });
};

/**
 * Hook para obtener templates de pipeline
 */
export const usePipelineTemplates = () => {
  return useQuery({
    queryKey: PIPELINE_TEMPLATES_QUERY_KEY,
    queryFn: () => pipelineApi.getPipelineTemplates(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};


















// src/types/pipeline.types.ts
// ✅ Tipos específicos para el dominio de Pipelines del CRM
// Matching exacto con PipelineDTO y PipelineController del backend
// Siguiendo el patrón establecido en company.types.ts

import {
    BaseEntity,
    BaseSearchCriteria,
    CognitoSub,
  } from './common.types';
  
  import {
    BaseMetrics,
    GroupedMetrics,
  } from './api.types';
  
  // ============================================
  // PIPELINE STAGE TYPES (Matching PipelineStageDTO)
  // ============================================
  
  /**
   * Etapa individual de un pipeline (matching PipelineStageDTO del backend)
   */
  export interface PipelineStage extends BaseEntity {
    // Información básica obligatoria
    name: string;
    order: number;              // Para la secuencia en el Kanban (0, 1, 2...)
    pipelineId: number;         // FK al pipeline padre
    
    // Configuración opcional
    description?: string;
    color?: string;             // Color para el Kanban (#FF5733, etc.)
    isClosedWon?: boolean;      // Etapa que marca como "ganado"
    isClosedLost?: boolean;     // Etapa que marca como "perdido"
    probability?: number;       // Probabilidad de cierre (0-100)
    
    // Métricas computadas (del backend)
    dealCount?: number;         // Número de deals en esta etapa
    totalValue?: number;        // Valor total de deals en esta etapa
    averageDealValue?: number;  // Valor promedio
    averageTimeInStage?: number; // Días promedio en esta etapa
    
    // Ownership
    ownerCognitoSub: CognitoSub;
    ownerName?: string;         // Computed field
  }
  
  /**
   * Request para crear una nueva etapa
   */
  export type CreatePipelineStageRequest = Omit<
    PipelineStage, 
    keyof BaseEntity | 'dealCount' | 'totalValue' | 'averageDealValue' | 
    'averageTimeInStage' | 'ownerName'
  >;
  
  /**
   * Request para actualizar una etapa existente
   */
  export type UpdatePipelineStageRequest = Partial<CreatePipelineStageRequest> & {
    version: number;
  };
  
  // ============================================
  // PIPELINE CORE TYPES (Matching PipelineDTO)
  // ============================================
  
  /**
   * Entidad Pipeline completa (matching PipelineDTO del backend)
   */
  export interface Pipeline extends BaseEntity {
    // Información básica obligatoria
    name: string;
    type?: PipelineType;
    // Información opcional
    description?: string;
    isDefault?: boolean;        // Pipeline por defecto de la organización
    isActive?: boolean;         // Pipeline activo/inactivo
    
    // Configuración
    autoProgressRules?: boolean; // Auto-avanzar deals según reglas
    requiresApproval?: boolean;  // Requiere aprobación para avanzar
    
    // Ownership y asignación
    ownerCognitoSub: CognitoSub;
    ownerName?: string;         // Computed field
    
    // Relaciones
    stages: PipelineStage[];    // Etapas ordenadas del pipeline
    
    // Métricas computadas (del backend)
    totalDeals?: number;        // Total de deals en este pipeline
    totalValue?: number;        // Valor total de todos los deals
    averageDealsPerStage?: number;
    averageCloseTime?: number;  // Días promedio para cerrar
    conversionRate?: number;    // % de deals que se cierran como ganados
    
    // Health metrics
    overallHealthScore?: number;
    performanceStatus?: 'excellent' | 'good' | 'warning' | 'critical';
    
    // Display helpers (computed fields)
    stageCount?: number;        // Número de etapas
    hasClosedWonStage?: boolean;
    hasClosedLostStage?: boolean;
    canBeDeleted?: boolean;     // Si tiene deals, no se puede borrar
  }
  
  /**
   * Stats interface para pipelines
   */
  export interface PipelineStats {
    // Campos básicos (del backend)
    total: number;
    active: number;
    inactive: number;
    defaultPipelines: number;
    
    // Campos adicionales para UI
    totalStages?: number;
    averageStagesPerPipeline?: number;
    totalDealsInPipelines?: number;
    totalValueInPipelines?: number;
    newPipelinesThisMonth?: number;
  }
  
  // ============================================
  // ALIAS TYPES (Para compatibilidad con componentes)
  // ============================================
  
  /**
   * Alias para mantener compatibilidad con componentes existentes
   */
  export type PipelineDTO = Pipeline;
  export type PipelineStageDTO = PipelineStage;
  
  // ============================================
  // ENUMS Y TIPOS ESPECÍFICOS
  // ============================================
  
  /**
   * Tipos de pipeline según el proceso de negocio
   */
  export type PipelineType = 
    | 'SALES'           // Pipeline de ventas estándar
    | 'LEAD_NURTURING'  // Proceso de cultivar leads
    | 'CUSTOMER_SUCCESS' // Post-venta y retención
    | 'PROJECT'         // Gestión de proyectos
    | 'FUNDRAISING'     // Recaudación de fondos
    | 'CUSTOM';         // Pipeline personalizado
  
  /**
   * Estados de progreso de un deal en el pipeline
   */
  export type DealProgressStatus = 
    | 'on_track'        // En tiempo y forma
    | 'at_risk'         // En riesgo de no avanzar
    | 'stalled'         // Estancado por más de X días
    | 'accelerated';    // Avanzando más rápido de lo normal
  
  // ============================================
  // SEARCH & FILTER TYPES
  // ============================================
  
  /**
   * Criterios de búsqueda específicos para pipelines
   */
  export interface PipelineSearchCriteria extends BaseSearchCriteria {
    // Texto libre
    search?: string;              // Busca en name y description
    
    // Filtros específicos
    isDefault?: boolean;          // Solo pipelines por defecto
    isActive?: boolean;           // Solo pipelines activos
    type?: PipelineType;          // Tipo de pipeline
    hasDeals?: boolean;           // Solo pipelines con deals
    
    // Filtros de ownership
    onlyOwned?: boolean;          // Solo mis pipelines
    ownerCognitoSub?: string;     // Pipelines de un usuario específico
    
    // Filtros de métricas
    minDeals?: number;            // Pipelines con al menos X deals
    maxDeals?: number;            // Pipelines con máximo X deals
    minValue?: number;            // Valor mínimo total
    maxValue?: number;            // Valor máximo total
    
    // Filtros de rendimiento
    performanceStatus?: Pipeline['performanceStatus'];
    minConversionRate?: number;   // % mínimo de conversión
    maxConversionRate?: number;   // % máximo de conversión
    
    // Filtros de configuración
    requiresApproval?: boolean;   // Solo pipelines que requieren aprobación
    autoProgressRules?: boolean; // Solo pipelines con auto-progreso
  }
  
  /**
   * Criterios de búsqueda para etapas de pipeline
   */
  export interface PipelineStageSearchCriteria extends BaseSearchCriteria {
    // Texto libre
    search?: string;              // Busca en name y description
    
    // Filtros específicos
    pipelineId?: number;          // Etapas de un pipeline específico
    isClosedWon?: boolean;        // Solo etapas de cierre ganado
    isClosedLost?: boolean;       // Solo etapas de cierre perdido
    
    // Filtros de métricas
    minDealCount?: number;        // Etapas con al menos X deals
    maxDealCount?: number;        // Etapas con máximo X deals
    minValue?: number;            // Valor mínimo total
    maxValue?: number;            // Valor máximo total
    
    // Filtros de probabilidad
    minProbability?: number;      // Probabilidad mínima de cierre
    maxProbability?: number;      // Probabilidad máxima de cierre
    
    // Ordenamiento específico
    orderBy?: 'order' | 'dealCount' | 'totalValue' | 'averageTimeInStage';
  }
  
  // ============================================
  // REQUEST & RESPONSE TYPES (Para APIs)
  // ============================================
  
  /**
   * Request para crear un nuevo pipeline
   */
  
    export type CreatePipelineRequest = Omit<
    Pipeline, 
    keyof BaseEntity | 'ownerCognitoSub' | 'stages' | // <-- Omitir ownerCognitoSub temporalmente
    'totalDeals' | 'totalValue' | 'averageDealsPerStage' | 'averageCloseTime' | 
    'conversionRate' | 'overallHealthScore' | 'performanceStatus' | 'stageCount' | 
    'hasClosedWonStage' | 'hasClosedLostStage' | 'canBeDeleted' | 'ownerName'
    > & {
    // ✅ HACERLO OPCIONAL AQUÍ: El backend asignará al usuario actual
    ownerCognitoSub?: CognitoSub; 
    // Etapas iniciales del pipeline (sin IDs)
    stages: CreatePipelineStageRequest[];
    };
  
  /**
   * Request para actualizar un pipeline existente
   */
  export type UpdatePipelineRequest = Partial<CreatePipelineRequest> & {
    version: number;
    // Para actualizar etapas existentes o añadir nuevas
    stages?: (UpdatePipelineStageRequest | CreatePipelineStageRequest)[];
    // IDs de etapas a eliminar
    stagesToDelete?: number[];
  };
  
  /**
   * Request para reordenar etapas de un pipeline
   */
  export interface ReorderPipelineStagesRequest {
    pipelineId: number;
    version: number;
    stageOrders: {
      stageId: number;
      newOrder: number;
    }[];
  }
  
  /**
   * Response de métricas de pipeline
   */
  export interface PipelineMetricsResponse extends BaseMetrics {
    // Métricas básicas
    totalPipelines: number;
    activePipelines: number;
    totalStages: number;
    averageStagesPerPipeline: number;
    
    // Métricas de deals
    totalDealsInPipelines: number;
    totalValueInPipelines: number;
    averageValuePerDeal: number;
    
    // Métricas de rendimiento
    averageConversionRate: number;
    averageCloseTime: number;
    
    // Distribución por tipo
    pipelinesByType: GroupedMetrics;
    
    // Top performers
    topPipelinesByDeals: Pipeline[];
    topPipelinesByValue: Pipeline[];
    
    // Trends
    pipelineCreationTrend: Array<{
      period: string;
      count: number;
    }>;
    
    dealProgressTrend: Array<{
      period: string;
      totalDeals: number;
      totalValue: number;
      conversionRate: number;
    }>;
  }
  
  // ============================================
  // UTILITY TYPES
  // ============================================
  
  /**
   * Configuración de una etapa para el componente Kanban
   */
  export interface KanbanStageConfig {
    stage: PipelineStage;
    deals: any[];  // Will be Deal[] when we create deal.types.ts
    isDroppable: boolean;
    maxDeals?: number;
    color: string;
  }
  
  /**
   * Configuración completa de un pipeline para el Kanban
   */
  export interface KanbanPipelineConfig {
    pipeline: Pipeline;
    stages: KanbanStageConfig[];
    allowDragAndDrop: boolean;
    showMetrics: boolean;
  }
  
  /**
   * Evento de movimiento de deal en el Kanban
   */
  export interface DealMoveEvent {
    dealId: number;
    fromStageId: number;
    toStageId: number;
    newOrder?: number;
    pipelineId: number;
  }
  
  // ============================================
  // VALIDATION SCHEMAS (Para react-hook-form + zod)
  // ============================================
  
  /**
   * Configuración de validación para formularios de pipeline
   */
  export interface PipelineFormValidation {
    name: {
      required: true;
      minLength: 2;
      maxLength: 100;
    };
    description: {
      maxLength: 500;
    };
    stages: {
      required: true;
      minItems: 2;        // Un pipeline debe tener al menos 2 etapas
      maxItems: 20;       // Límite razonable de etapas
    };
    stageNames: {
      required: true;
      minLength: 1;
      maxLength: 50;
      unique: true;       // Nombres de etapas únicos dentro del pipeline
    };
  }
  
  // ============================================
  // CONSTANTS
  // ============================================
  
  /**
   * Labels para mostrar en la UI
   */
  export const PIPELINE_TYPE_LABELS: Record<PipelineType, string> = {
    SALES: 'Ventas',
    LEAD_NURTURING: 'Cultivo de Leads',
    CUSTOMER_SUCCESS: 'Éxito del Cliente',
    PROJECT: 'Proyectos',
    FUNDRAISING: 'Recaudación',
    CUSTOM: 'Personalizado',
  };
  
  export const PERFORMANCE_STATUS_LABELS: Record<Pipeline['performanceStatus'] & string, string> = {
    excellent: 'Excelente',
    good: 'Bueno',
    warning: 'Advertencia',
    critical: 'Crítico',
  };
  
  export const DEAL_PROGRESS_STATUS_LABELS: Record<DealProgressStatus, string> = {
    on_track: 'En seguimiento',
    at_risk: 'En riesgo',
    stalled: 'Estancado',
    accelerated: 'Acelerado',
  };
  
  /**
   * Colores por defecto para etapas de pipeline
   */
  export const DEFAULT_STAGE_COLORS: string[] = [
    '#3B82F6', // blue-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#EC4899', // pink-500
    '#6B7280', // gray-500
  ];
  
  /**
 * ✅ PLANTILLAS DE PROCESOS
 * 
 * Configuraciones de pipeline predefinidas y supervisadas que se ofrecen
 * al usuario. Cada plantilla está diseñada para un vertical de negocio y un
 * caso de uso específico, proporcionando valor inmediato.
 */

  export const DEFAULT_PIPELINE_TEMPLATES = {
  
    // ===============================================
    // PLANTILLAS PARA EMPRESAS (Vertical: BUSINESS)
    // ===============================================
  
    BUSINESS_SALES: {
      key: 'BUSINESS_SALES',
      name: 'Proceso de Ventas B2B',
      description: 'Un embudo de ventas estándar para seguir oportunidades comerciales desde el lead hasta el cierre.',
      icon: 'TrendingUp', // Sugerencia de icono (nombre de Lucide React)
      stages: [
        { name: 'Lead', order: 0, probability: 10, color: DEFAULT_STAGE_COLORS[0] },
        { name: 'Contacto Establecido', order: 1, probability: 20, color: DEFAULT_STAGE_COLORS[1] },
        { name: 'Calificado', order: 2, probability: 40, color: DEFAULT_STAGE_COLORS[2] },
        { name: 'Propuesta Presentada', order: 3, probability: 60, color: DEFAULT_STAGE_COLORS[3] },
        { name: 'En Negociación', order: 4, probability: 80, color: DEFAULT_STAGE_COLORS[4] },
        { name: 'Ganado', order: 5, probability: 100, color: DEFAULT_STAGE_COLORS[5], isClosedWon: true },
        { name: 'Perdido', order: 6, probability: 0, color: DEFAULT_STAGE_COLORS[6], isClosedLost: true },
      ],
    },
  
    BUSINESS_SERVICE_DELIVERY: {
      key: 'BUSINESS_SERVICE_DELIVERY',
      name: 'Proceso de Entrega de Servicio',
      description: 'Flujo de trabajo para gestionar la entrega de un proyecto o servicio desde la orden hasta la facturación.',
      icon: 'ClipboardCheck',
      stages: [
        { name: 'Costos Aprobados', order: 0, probability: 10, color: DEFAULT_STAGE_COLORS[0] },
        { name: 'Orden de Servicio Generada', order: 1, probability: 30, color: DEFAULT_STAGE_COLORS[1] },
        { name: 'En Desarrollo / Ejecución', order: 2, probability: 60, color: DEFAULT_STAGE_COLORS[2] },
        { name: 'Control de Calidad / QA', order: 3, probability: 80, color: DEFAULT_STAGE_COLORS[3] },
        { name: 'Acta de Entrega Firmada', order: 4, probability: 95, color: DEFAULT_STAGE_COLORS[4] },
        { name: 'Facturado y Cerrado', order: 5, probability: 100, color: DEFAULT_STAGE_COLORS[5], isClosedWon: true },
        { name: 'Cancelado', order: 6, probability: 0, color: DEFAULT_STAGE_COLORS[6], isClosedLost: true },
      ],
    },
    
    // ===============================================
    // PLANTILLA PARA IGLESIAS (Vertical: CHURCH)
    // ===============================================
  
    CHURCH_CONSOLIDATION: {
      key: 'CHURCH_CONSOLIDATION',
      name: 'Proceso de Consolidación',
      description: 'Seguimiento de nuevos contactos hasta que se consolidan como miembros activos en la comunidad.',
      icon: 'HeartHandshake',
      stages: [
        { name: 'Nuevo Contacto', order: 0, color: DEFAULT_STAGE_COLORS[0] },
        { name: 'En Seguimiento Personal', order: 1, color: DEFAULT_STAGE_COLORS[1] },
        { name: 'Asistente Regular', order: 2, color: DEFAULT_STAGE_COLORS[2] },
        { name: 'Asistió a Encuentro/Retiro', order: 3, color: DEFAULT_STAGE_COLORS[3] },
        { name: 'Consolidado', order: 4, color: DEFAULT_STAGE_COLORS[4], isClosedWon: true },
        { name: 'No Interesado / Inactivo', order: 5, color: DEFAULT_STAGE_COLORS[5], isClosedLost: true },
      ],
    },
    
    // ===============================================
    // PLANTILLA PARA ORGANIZACIONES CÍVICAS
    // ===============================================
  
    CIVIC_VOLUNTEER_MANAGEMENT: {
      key: 'CIVIC_VOLUNTEER_MANAGEMENT',
      name: 'Gestión de Voluntarios',
      description: 'Proceso para reclutar, entrenar e integrar voluntarios a una causa o campaña.',
      icon: 'Megaphone',
      stages: [
        { name: 'Interesado Registrado', order: 0, color: DEFAULT_STAGE_COLORS[0] },
        { name: 'Entrevista / Contacto', order: 1, color: DEFAULT_STAGE_COLORS[1] },
        { name: 'En Entrenamiento', order: 2, color: DEFAULT_STAGE_COLORS[2] },
        { name: 'Voluntario Activo', order: 3, color: DEFAULT_STAGE_COLORS[3], isClosedWon: true },
        { name: 'No Disponible / Descartado', order: 4, color: DEFAULT_STAGE_COLORS[4], isClosedLost: true },
      ],
    },
  
  } as const; 













// src/pages/pipelines/PipelineListPage.tsx
// ✅ PIPELINE LIST PAGE - Replicando exactamente CompanyListPage.tsx
// EL KANBAN PRINCIPAL - Donde se muestran los deals fluyendo por las etapas

import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, Settings, Filter, Search, X,
  Target, BarChart3, TrendingUp,
  RefreshCw, Eye, Edit3, Copy, Trash2, GitBranch
} from 'lucide-react';

// ============================================
// UI COMPONENTS - Siguiendo patrón de CompanyListPage
// ============================================
import { Page } from '@/components/layout/Page';
import { Input } from '@/components/ui/Input';
import { Button, IconButton } from '@/components/ui/Button';

import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Dropdown from '@/components/ui/Dropdown';

// ============================================
// SHARED COMPONENTS - Reutilizando exactamente como Companies
// ============================================
import { StatsCards } from '@/components/shared/StatsCards';
import type { StatCardConfig } from '@/components/shared/StatsCards';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

// ============================================
// PIPELINE COMPONENTS - Componentes específicos
// ============================================
import PipelineSelector from '@/components/pipelines/PipelineSelector';
// import { DealKanbanView } from '@/components/deals/DealKanbanView'; // TODO: Crear después

// ============================================
// HOOKS & SERVICES - Siguiendo patrón Slice Vertical
// ============================================
import { 
  usePipelineOperations,
  PIPELINE_STATS_QUERY_KEY,
  PIPELINES_LIST_QUERY_KEY
} from '@/hooks/usePipelines';
import { pipelineApi } from '@/services/api/pipelineApi';
import { useSearchDebounce } from '@/hooks/useDebounce';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { toastSuccess } from '@/services/notifications/toastService';

// ============================================
// TYPES - Importando desde types como CompanyListPage
// ============================================
import type { 
  PipelineDTO, 
  PipelineSearchCriteria
} from '@/types/pipeline.types';
import { cn } from '@/utils/cn';
import { formatters } from '@/utils/formatters';

// ============================================
// MAIN COMPONENT
// ============================================
const PipelineListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ============================================
  // LOCAL STATE para UI y Filtros - Mismo patrón que CompanyListPage
  // ============================================
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage] = useState(Number(searchParams.get('page')) || 0);
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(
    searchParams.get('pipeline') ? Number(searchParams.get('pipeline')) : null
  );
  const [pipelineToDelete, setPipelineToDelete] = useState<PipelineDTO | null>(null);

  const debouncedSearchTerm = useSearchDebounce(searchTerm, 300);

  // 🔧 Search criteria siguiendo el patrón de Companies
  const searchCriteria = useMemo((): PipelineSearchCriteria => {
    const criteria: PipelineSearchCriteria = {};
    if (debouncedSearchTerm) {
      criteria.search = debouncedSearchTerm;
    }
    // Solo pipelines activos por defecto para el Kanban
    criteria.isActive = true;
    return criteria;
  }, [debouncedSearchTerm]);

  // ============================================
  // DATA FETCHING CON REACT QUERY - Mismo patrón que Companies
  // ============================================

  const { 
    data: pipelinesData, 
    isLoading: isLoadingPipelines, 
    isFetching: isFetchingPipelines,
    error: pipelinesError,
    refetch: refetchPipelines,
  } = useQuery({
    queryKey: PIPELINES_LIST_QUERY_KEY(searchCriteria, currentPage),
    queryFn: () => pipelineApi.searchPipelines(searchCriteria, { 
      page: currentPage, 
      size: 100, // Más pipelines para el selector
      sort: ['isDefault,desc', 'name,asc'] 
    }),
    enabled: true,
    placeholderData: (previousData) => previousData,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const pipelines = pipelinesData?.content || [];
  //const totalPipelines = pipelinesData?.totalElements || 0;

  // Obtener el pipeline seleccionado (el primero por defecto si no hay uno específico)
  const currentPipeline = useMemo(() => {
    if (selectedPipelineId) {
      return pipelines.find(p => p.id === selectedPipelineId);
    }
    // Priorizar pipeline por defecto, luego el primero
    return pipelines.find(p => p.isDefault) || pipelines[0];
  }, [pipelines, selectedPipelineId]);

  // Stats query
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: PIPELINE_STATS_QUERY_KEY,
    queryFn: () => pipelineApi.getPipelineStats(),
  });

  // ============================================
  // HOOKS DE ZUSTAND - Para acciones y estado de UI
  // ============================================
  const { deletePipeline } = usePipelineOperations();
  const { handleError } = useErrorHandler();

  // ============================================
  // STATS CARDS CONFIGURATION - Adaptado para Pipeline Kanban
  // ============================================
  const pipelineStatConfigs: StatCardConfig[] = [
    { 
      key: 'total', 
      title: 'Pipelines Activos', 
      description: 'Procesos de negocio disponibles para gestionar deals.', 
      icon: GitBranch, 
      variant: 'default', 
      format: 'number' 
    },
    { 
      key: 'totalDealsInPipelines', 
      title: 'Oportunidades Activas', 
      description: 'Deals fluyendo actualmente por todos los pipelines.', 
      icon: BarChart3, 
      variant: 'info', 
      format: 'number' 
    },
    { 
      key: 'totalValueInPipelines', 
      title: 'Valor en Pipeline', 
      description: 'Valor total de todas las oportunidades en proceso.', 
      icon: TrendingUp, 
      variant: 'success', 
      format: 'currency' 
    },
    { 
      key: 'averageConversionRate', 
      title: 'Tasa de Conversión', 
      description: 'Promedio de deals cerrados como ganados.', 
      icon: Target, 
      variant: 'warning', 
      format: 'percentage' 
    },
  ];

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handlePipelineChange = (pipelineId: number) => {
    setSelectedPipelineId(pipelineId);
    // Actualizar URL para mantener el estado
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('pipeline', pipelineId.toString());
    setSearchParams(newSearchParams);
  };

  const handleCreateNewPipeline = () => {
    navigate('/pipelines/new');
  };

  const handleManagePipelines = () => {
    navigate('/settings/pipelines');
  };

  const handleCreateNew = () => {
    navigate('/pipelines/new');
  };

  const handlePipelineEdit = (pipeline: PipelineDTO) => {
    navigate(`/pipelines/${pipeline.id}/edit`);
  };

  const handlePipelineDetail = (pipeline: PipelineDTO) => {
    navigate(`/pipelines/${pipeline.id}`);
  };

  const handleDeleteClick = (pipeline: PipelineDTO) => {
    setPipelineToDelete(pipeline);
  };

  const handleConfirmDelete = async () => {
    if (!pipelineToDelete) return;
    
    try {
      await deletePipeline(pipelineToDelete.id, () => {
        setPipelineToDelete(null);
        // Si se elimina el pipeline actual, seleccionar otro
        if (selectedPipelineId === pipelineToDelete.id) {
          setSelectedPipelineId(null);
        }
        refetchPipelines();
        refetchStats();
        toastSuccess('Pipeline eliminado exitosamente');
      });
    } catch (error) {
      handleError(error);
    }
  };

  const handleRefresh = () => {
    refetchPipelines();
    refetchStats();
  };

  // ============================================
  // DROPDOWN ITEMS CONFIGURATION
  // ============================================
  const getPipelineActionItems = (pipeline: PipelineDTO) => [
    { id: 'view', label: 'Ver Detalles', icon: Eye, onClick: () => handlePipelineDetail(pipeline) },
    { id: 'edit', label: 'Editar Pipeline', icon: Edit3, onClick: () => handlePipelineEdit(pipeline) },
    { type: 'separator' as const },
    { id: 'duplicate', label: 'Duplicar Pipeline', icon: Copy, onClick: () => navigate(`/pipelines/new?template=${pipeline.id}`) },
    { id: 'delete', label: 'Eliminar Pipeline', icon: Trash2, onClick: () => handleDeleteClick(pipeline), className: 'text-red-400 hover:text-red-300' },
  ];

  // ============================================
  // RENDER STATES
  // ============================================

  if (pipelinesError) {
    return (
      <Page 
        title="Error al cargar Pipelines" 
        description="Ha ocurrido un error al cargar los pipelines."
      >
        <div className="text-center py-12">
          <p className="text-app-gray-400 mb-4">Error: {pipelinesError.message}</p>
          <Button onClick={() => refetchPipelines()}>
            Reintentar
          </Button>
        </div>
      </Page>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <Page 
      title="Gestión de Oportunidades" 
      description="Visualiza y gestiona el flujo de oportunidades a través de tus pipelines de negocio"
    >
      {/* ============================================ */}
      {/* STATS CARDS - Usando componente shared */}
      {/* ============================================ */}
      <StatsCards
        configs={pipelineStatConfigs}
        stats={stats}
        isLoading={isLoadingStats}
      />

      {/* ============================================ */}
      {/* ACTIONS BAR - Selector de Pipeline + Acciones */}
      {/* ============================================ */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Pipeline Selector y controles */}
        <div className="flex items-center gap-3 flex-1">
          {/* Pipeline Selector - Usando componente reutilizable */}
          <PipelineSelector
            pipelines={pipelines}
            selectedPipeline={currentPipeline}
            onPipelineChange={(pipeline) => handlePipelineChange(pipeline.id)}
            onCreateNew={handleCreateNewPipeline}
            onManagePipelines={handleManagePipelines}
            loading={isLoadingPipelines}
            showCreateButton={true}
            showManageButton={true}
            showMetrics={true}
            size="md"
            placeholder="Seleccionar pipeline..."
          />
          
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-app-gray-400" />
            <Input
              placeholder="Buscar en deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-primary-500/10 border-primary-500/30")}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetchingPipelines}
          >
            <RefreshCw className={cn("h-4 w-4", isFetchingPipelines && "animate-spin")} />
          </Button>

          {/* Pipeline Actions - ✅ CORRECCIÓN QUIRÚRGICA */}
          {currentPipeline && (
            <Dropdown
              trigger={
                <Button variant="outline">
                  <Settings className="h-4 w-4" />
                  Pipeline
                </Button>
              }
              items={getPipelineActionItems(currentPipeline)}
            />
          )}
          
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4" />
            Nueva Oportunidad
          </Button>
        </div>
      </div>

      {/* ============================================ */}
      {/* FILTERS PANEL (Condicional) - Mismo patrón que Companies */}
      {/* ============================================ */}
      {showFilters && (
        <div className="p-4 mb-6 border-app-dark-600 bg-app-dark-800/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-app-gray-200">Filtros de Oportunidades</h3>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
            >
              <X className="h-4 w-4" />
            </IconButton>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-app-gray-300 mb-2">
                Estado
              </label>
              <select className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded-lg text-app-gray-200">
                <option value="">Todos</option>
                <option value="OPEN">Abiertos</option>
                <option value="WON">Ganados</option>
                <option value="LOST">Perdidos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-app-gray-300 mb-2">
                Propietario
              </label>
              <select className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded-lg text-app-gray-200">
                <option value="">Todos</option>
                <option value="me">Mis oportunidades</option>
                <option value="team">Mi equipo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-app-gray-300 mb-2">
                Valor mínimo
              </label>
              <Input
                type="number"
                placeholder="0"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-app-gray-300 mb-2">
                Empresa
              </label>
              <select className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded-lg text-app-gray-200">
                <option value="">Todas</option>
                {/* TODO: Cargar empresas dinámicamente */}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* KANBAN VIEW - EL CORAZÓN DE LA PÁGINA */}
      {/* ============================================ */}
      {isLoadingPipelines && !currentPipeline ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : !currentPipeline ? (
        <EmptyState
          icon={GitBranch}
          title="No hay pipelines disponibles"
          description="Crea tu primer pipeline para empezar a gestionar oportunidades."
          action={
            <Button onClick={handleCreateNewPipeline}>
              <Plus className="h-4 w-4" />
              Crear Primer Pipeline
            </Button>
          }
        />
      ) : (
        <div className="border-app-dark-600 bg-app-dark-800/50 p-6">
          {/* Pipeline Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500/10 rounded-lg">
                <GitBranch className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-app-gray-100">
                  {currentPipeline.name}
                </h2>
                {currentPipeline.description && (
                  <p className="text-sm text-app-gray-400">
                    {currentPipeline.description}
                  </p>
                )}
              </div>
              {currentPipeline.isDefault && (
                <Badge variant="success" size="sm">Por Defecto</Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-app-gray-400">
              <Target className="h-4 w-4" />
              <span>{currentPipeline.stages?.length || 0} etapas</span>
              <span>•</span>
              <BarChart3 className="h-4 w-4" />
              <span>{currentPipeline.totalDeals || 0} oportunidades</span>
              {currentPipeline.totalValue && (
                <>
                  <span>•</span>
                  <TrendingUp className="h-4 w-4" />
                  <span>{formatters.currency(currentPipeline.totalValue)}</span>
                </>
              )}
            </div>
          </div>

          {/* TODO: Aquí irá el DealKanbanView cuando lo creemos */}
          <div className="text-center py-16 border-2 border-dashed border-app-dark-600 rounded-lg">
            <BarChart3 className="h-16 w-16 text-app-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-app-gray-100 mb-2">
              Vista Kanban en Desarrollo
            </h3>
            <p className="text-app-gray-400 mb-6">
              El componente DealKanbanView se integrará aquí para mostrar las oportunidades fluyendo por las etapas del pipeline.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={handleCreateNewPipeline}>
                <Plus className="h-4 w-4" />
                Crear Nueva Oportunidad
              </Button>
              <Button onClick={() => handlePipelineDetail(currentPipeline)}>
                <Eye className="h-4 w-4" />
                Ver Detalles del Pipeline
              </Button>
            </div>

            {/* Preview de las etapas */}
            {currentPipeline.stages && currentPipeline.stages.length > 0 && (
              <div className="mt-8">
                <p className="text-sm text-app-gray-500 mb-4">
                  Etapas de este pipeline:
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {currentPipeline.stages
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((stage, index) => (
                      <Badge 
                        key={stage.id}
                        variant="outline" 
                        className="text-xs"
                      >
                        {index + 1}. {stage.name}
                      </Badge>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODALES DE CONFIRMACIÓN - Usando componente shared */}
      {/* ============================================ */}
      
      {/* ✅ CORRECCIÓN QUIRÚRGICA - ConfirmDialog props corregidas */}
      <ConfirmDialog
        isOpen={!!pipelineToDelete}
        onClose={() => setPipelineToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Pipeline"
        description={`¿Estás seguro de que quieres eliminar el pipeline "${pipelineToDelete?.name}"? Esta acción también eliminará todas las oportunidades asociadas.`}
      />
    </Page>
  );
};

export default PipelineListPage;
//este pipelinelistpage es el que estaba antes de refactorizar para que fuera dinamico y solo mostrar opciones segun el contexto