// src/types/kanban.types.ts
// ✅ KANBAN TYPES - Siguiendo patrón de company.types.ts
// Tipos específicos para la funcionalidad kanban de deals

import type { Deal } from './deal.types';
import type { PipelineDTO } from './pipeline.types';

// ============================================
// KANBAN CORE TYPES (Matching backend response)
// ============================================

/**
 * Métrica de stage individual en el kanban
 */
export interface StageMetrics {
  stageId: number;
  stageName: string;
  orderIndex: number;
  color: string;
  dealCount: number;
  totalValue: number;
  averageDaysInStage: number;
  averageDealValue: number;
  deals: Deal[];
  probability?: number;
  isWon: boolean;
  isLost: boolean;
  closingStage: boolean;
}

/**
 * Métricas del pipeline completo
 */
export interface PipelineMetrics {
  pipelineId: number;
  pipelineName: string;
  totalDeals: number;
  totalValue: number;
  averageDealValue: number;
  averageDaysToMove?: number;
  averageCloseTime?: number;
  monthlyCloseRate?: number;
  conversionRate: number;
  dealsWon: number;
  dealsLost: number;
  wonValue?: number;
  totalStages: number;
  bottleneckStageName?: string;
  bottleneckStageCount?: number;
  healthScore: number;
  performanceStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  stalledDeals?: number;
  projectedValue?: number;
  expectedMonthlyRevenue?: number;
  expectedQuarterlyRevenue?: number;
  winLossRatio: number;
  performanceLevel: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'POOR';
}

/**
 * Stage más ocupado/con más actividad
 */
export interface BusiestStage extends StageMetrics {
  // Hereda todas las propiedades de StageMetrics
}

/**
 * Respuesta completa del endpoint kanban
 */
export interface KanbanDataDTO {
  pipeline: PipelineDTO;
  metrics: PipelineMetrics;
  stages: StageMetrics[];
  busiestStage: BusiestStage;
  totalDealsCount: number;
  valid: boolean;
}

// ============================================
// DRAG & DROP TYPES
// ============================================

/**
 * Datos del deal siendo arrastrado
 */
export interface DraggedDealData {
  deal: Deal;
  fromStageId: number;
  toStageId?: number;
}

/**
 * Resultado de movimiento de deal
 */
export interface DealMoveResult {
  success: boolean;
  deal?: Deal;
  error?: string;
  fromStageId: number;
  toStageId: number;
}

// ============================================
// KANBAN VIEW CONFIGURATION
// ============================================

/**
 * Configuración de vista kanban
 */
export interface KanbanViewConfig {
  showMetrics: boolean;
  enableDragDrop: boolean;
  showEmptyStages: boolean;
  compactView: boolean;
  showDealValues: boolean;
  showDealDates: boolean;
  maxDealsPerColumn?: number;
}

/**
 * Filtros específicos para kanban
 */
export interface KanbanFilters {
  search?: string;
  ownerCognitoSub?: string;
  minValue?: number;
  maxValue?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: 'OPEN' | 'WON' | 'LOST' | 'CANCELLED';
  includeOverdue?: boolean;
}

// ============================================
// API REQUEST TYPES
// ============================================

/**
 * Request para mover deal entre stages
 */
export interface MoveDealRequest {
  dealId: number;
  fromStageId: number;
  toStageId: number;
  effectiveDate?: string;
  notes?: string;
  updateProbability?: boolean;
  newProbability?: number;
}

/**
 * Request para actualizar posición en kanban
 */
export interface UpdateDealPositionRequest {
  dealId: number;
  stageId: number;
  orderIndex: number;
}

// ============================================
// EXPORT TYPES
// ============================================

/**
 * Alias para mantener compatibilidad
 */
export type KanbanData = KanbanDataDTO;

/**
 * Tipo para el hook de kanban
 */
export type UseKanbanDataResult = {
  data: KanbanDataDTO | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
};

/**
 * Tipo para operaciones de kanban
 */
export type UseKanbanOperationsResult = {
  moveDeal: (request: MoveDealRequest) => Promise<DealMoveResult>;
  updateDealPosition: (request: UpdateDealPositionRequest) => Promise<void>;
  isMoving: (dealId: number) => boolean;
  isUpdating: (dealId: number) => boolean;
};

export default KanbanDataDTO;