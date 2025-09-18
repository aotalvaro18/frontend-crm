// src/services/api/kanbanApi.ts
// ✅ KANBAN API SERVICE - Siguiendo patrón de companyApi.ts
// Service para todas las operaciones del kanban de deals
// 🔧 REFACTORIZADO: Sin any, tipos seguros, siguiendo guía arquitectónica

import { apiClient } from './baseApi';

import type {
  KanbanDataDTO,
  MoveDealRequest,
  UpdateDealPositionRequest,
  DealMoveResult,
  PipelineMetrics
} from '@/types/kanban.types';
import type { Deal } from '@/types/deal.types';

// ============================================
// API ENDPOINTS
// ============================================
const KANBAN_ENDPOINTS = {
  PIPELINE_KANBAN: (pipelineId: number) => `/api/crm/pipelines/${pipelineId}/kanban`,
  MOVE_DEAL: (dealId: number) => `/api/crm/deals/${dealId}/move`,
  UPDATE_POSITION: (dealId: number) => `/api/crm/deals/${dealId}/position`,
  PIPELINE_METRICS: (pipelineId: number) => `/api/crm/pipelines/${pipelineId}/metrics`,
} as const;

// ============================================
// KANBAN API SERVICE CLASS
// ============================================
export class KanbanApiService {

  // ============================================
  // KANBAN DATA OPERATIONS
  // ============================================

  /**
   * Obtener datos completos del kanban para un pipeline
   * Matches: GET /api/crm/pipelines/{pipelineId}/kanban
   */
  async getPipelineKanbanData(pipelineId: number): Promise<KanbanDataDTO> {
    try {
      const response = await apiClient.get<KanbanDataDTO>(
        KANBAN_ENDPOINTS.PIPELINE_KANBAN(pipelineId)
      );
      
      // Validación de respuesta
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid kanban data response format');
      }

      // Validar estructura mínima requerida
      if (!response.pipeline || !response.stages || !Array.isArray(response.stages)) {
        throw new Error('Kanban response missing required fields: pipeline or stages');
      }

      return response;
    } catch (error: unknown) {
      this.handleKanbanError(error, pipelineId);
      throw error;
    }
  }

  /**
   * Obtener solo métricas del pipeline (más liviano)
   * Matches: GET /api/crm/pipelines/{pipelineId}/metrics
   */
  async getPipelineMetrics(pipelineId: number): Promise<PipelineMetrics> {
    try {
      return await apiClient.get<PipelineMetrics>(
        KANBAN_ENDPOINTS.PIPELINE_METRICS(pipelineId)
      );
    } catch (error: unknown) {
      this.handleKanbanError(error, pipelineId);
      throw error;
    }
  }

  // ============================================
  // DEAL MOVEMENT OPERATIONS
  // ============================================

  /**
   * Mover deal a otra stage del pipeline
   * Matches: PUT /api/crm/deals/{dealId}/move
   */
  async moveDealToStage(request: MoveDealRequest): Promise<DealMoveResult> {
    try {
      // Validación de request
      this.validateMoveRequest(request);

      // 🔧 REFACTORIZACIÓN: Tipado seguro de la respuesta
      interface MoveApiResponse {
        deal?: Deal;
        success?: boolean;
        message?: string;
      }

      const response = await apiClient.put<MoveApiResponse>(
        KANBAN_ENDPOINTS.MOVE_DEAL(request.dealId),
        {
          fromStageId: request.fromStageId,
          toStageId: request.toStageId,
          effectiveDate: request.effectiveDate || new Date().toISOString(),
          notes: request.notes,
          updateProbability: request.updateProbability,
          newProbability: request.newProbability
        }
      );

      // 🔧 REFACTORIZACIÓN: Manejo seguro de la respuesta del backend
      const resultDeal = this.extractDealFromResponse(response);

      return {
        success: true,
        deal: resultDeal,
        fromStageId: request.fromStageId,
        toStageId: request.toStageId,
        error: undefined
      };
    } catch (error: unknown) {
      const errorResult: DealMoveResult = {
        success: false,
        deal: undefined, // 🔧 EXPLÍCITO: undefined en lugar de omitir la propiedad
        error: this.extractErrorMessage(error),
        fromStageId: request.fromStageId,
        toStageId: request.toStageId
      };
      
      this.handleDealMoveError(error, request);
      return errorResult;
    }
  }

  /**
   * Actualizar posición/orden de deal dentro de una stage
   * Matches: PUT /api/crm/deals/{dealId}/position
   */
  async updateDealPosition(request: UpdateDealPositionRequest): Promise<void> {
    try {
      await apiClient.put<void>(
        KANBAN_ENDPOINTS.UPDATE_POSITION(request.dealId),
        {
          stageId: request.stageId,
          orderIndex: request.orderIndex
        }
      );
    } catch (error: unknown) {
      this.handleKanbanError(error, request.dealId);
      throw error;
    }
  }

  // ============================================
  // BULK OPERATIONS (Para futuro)
  // ============================================

  /**
   * Mover múltiples deals a una stage
   * Para implementación futura si es necesario
   */
  async bulkMoveDealesToStage(
    dealIds: number[], 
    toStageId: number,
    notes?: string
  ): Promise<DealMoveResult[]> {
    try {
      const movePromises = dealIds.map(dealId => 
        this.moveDealToStage({
          dealId,
          fromStageId: 0, // Se determina en el backend
          toStageId,
          notes
        })
      );

      return await Promise.all(movePromises);
    } catch (error: unknown) {
      this.handleKanbanError(error);
      throw error;
    }
  }

  // ============================================
  // HELPER METHODS - 🔧 NUEVOS PARA MANEJO SEGURO
  // ============================================

  /**
   * Extrae el Deal de la respuesta del backend de forma segura
   */
  private extractDealFromResponse(response: unknown): Deal {
    // Si la respuesta es directamente un Deal
    if (this.isDeal(response)) {
      return response;
    }

    // Si la respuesta tiene una propiedad 'deal'
    if (this.isObjectWithDeal(response)) {
      return response.deal;
    }

    // Si no podemos extraer un Deal válido, lanzar error
    throw new Error('Invalid response format: expected Deal object');
  }

  /**
   * Type guard para verificar si un objeto es un Deal válido
   */
  private isDeal(obj: unknown): obj is Deal {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'id' in obj &&
      'title' in obj &&
      'pipelineId' in obj &&
      'stageId' in obj &&
      'contactId' in obj &&
      typeof (obj as Record<string, unknown>)['id'] === 'number' &&
      typeof (obj as Record<string, unknown>)['title'] === 'string'
    );
  }

  /**
   * Type guard para verificar si un objeto tiene una propiedad 'deal' válida
   */
  private isObjectWithDeal(obj: unknown): obj is { deal: Deal } {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'deal' in obj &&
      this.isDeal((obj as Record<string, unknown>)['deal'])
    );
  }

  // ============================================
  // VALIDATION METHODS
  // ============================================

  private validateMoveRequest(request: MoveDealRequest): void {
    if (!request.dealId || request.dealId <= 0) {
      throw new Error('Invalid dealId in move request');
    }
    
    if (!request.toStageId || request.toStageId <= 0) {
      throw new Error('Invalid toStageId in move request');
    }

    if (request.fromStageId === request.toStageId) {
      throw new Error('Cannot move deal to the same stage');
    }

    if (request.newProbability !== undefined) {
      if (request.newProbability < 0 || request.newProbability > 100) {
        throw new Error('Probability must be between 0 and 100');
      }
    }
  }

  // ============================================
  // ERROR HANDLING METHODS
  // ============================================

  private handleKanbanError(error: unknown, entityId?: number): void {
    const errorMessage = this.extractErrorMessage(error);
    const entityInfo = entityId ? ` (ID: ${entityId})` : '';
    
    console.error(`[KanbanApi] Error${entityInfo}:`, errorMessage);
    
    // Log específico para debugging
    if (error instanceof Error) {
      console.error(`[KanbanApi] Stack trace:`, error.stack);
    }
  }

  private handleDealMoveError(error: unknown, request: MoveDealRequest): void {
    const errorMessage = this.extractErrorMessage(error);
    
    console.error(`[KanbanApi] Deal move error:`, {
      dealId: request.dealId,
      fromStageId: request.fromStageId,
      toStageId: request.toStageId,
      error: errorMessage
    });
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'object' && error !== null) {
      // 🔧 REFACTORIZACIÓN: Type narrowing seguro sin any
      const errorObj = error as Record<string, unknown>;
      // ✅ CORRECCIÓN QUIRÚRGICA: Notación de corchetes
      const message = errorObj['message'];
      const errorProp = errorObj['error'];
      
      if (typeof message === 'string') return message;
      if (typeof errorProp === 'string') return errorProp;
      
      return 'Unknown error occurred';
    }
    
    return String(error);
  }

  // ============================================
  // CACHE INVALIDATION HELPERS (Para react-query)
  // ============================================

  /**
   * Helper para invalidar cache después de operaciones
   */
  public static getInvalidationKeys(pipelineId: number, dealId?: number): string[][] {
    const keys: string[][] = [
      ['kanban', 'pipeline', pipelineId.toString()],
      ['pipeline', 'metrics', pipelineId.toString()],
      ['deals', 'list'], // Invalidar listas de deals
    ];

    if (dealId) {
      keys.push(['deals', 'detail', dealId.toString()]);
    }

    return keys;
  }

  /**
   * Query key para react-query
   */
  public static getQueryKey(pipelineId: number): string[] {
    return ['kanban', 'pipeline', pipelineId.toString()];
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================
export const kanbanApi = new KanbanApiService();

// ============================================
// EXPORT DEFAULT
// ============================================
export default kanbanApi;