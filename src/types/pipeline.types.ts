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
   * Configuraciones de pipeline predefinidas
   */
  export const DEFAULT_PIPELINE_TEMPLATES = {
    SALES: {
      name: 'Pipeline de Ventas',
      description: 'Proceso estándar de ventas B2B',
      stages: [
        { name: 'Prospecto', probability: 10, color: DEFAULT_STAGE_COLORS[0] },
        { name: 'Calificado', probability: 25, color: DEFAULT_STAGE_COLORS[1] },
        { name: 'Propuesta', probability: 50, color: DEFAULT_STAGE_COLORS[2] },
        { name: 'Negociación', probability: 75, color: DEFAULT_STAGE_COLORS[3] },
        { name: 'Cerrado Ganado', probability: 100, color: DEFAULT_STAGE_COLORS[4], isClosedWon: true },
        { name: 'Cerrado Perdido', probability: 0, color: DEFAULT_STAGE_COLORS[5], isClosedLost: true },
      ],
    },
    LEAD_NURTURING: {
      name: 'Cultivo de Leads',
      description: 'Proceso de maduración de leads hasta la conversión',
      stages: [
        { name: 'Lead Frío', probability: 5, color: DEFAULT_STAGE_COLORS[0] },
        { name: 'Lead Interesado', probability: 15, color: DEFAULT_STAGE_COLORS[1] },
        { name: 'Lead Caliente', probability: 35, color: DEFAULT_STAGE_COLORS[2] },
        { name: 'Marketing Qualified Lead', probability: 60, color: DEFAULT_STAGE_COLORS[3] },
        { name: 'Sales Qualified Lead', probability: 85, color: DEFAULT_STAGE_COLORS[4] },
        { name: 'Convertido', probability: 100, color: DEFAULT_STAGE_COLORS[5], isClosedWon: true },
      ],
    },
  } as const; 
