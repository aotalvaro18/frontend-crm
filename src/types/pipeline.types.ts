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
// ENUMS DEL BACKEND
// ============================================

/**
 * Categorías de pipeline (matching PipelineCategory del backend)
 */
export type PipelineCategory = 
  | 'CHURCH'       // ⛪ Pipeline para iglesias
  | 'BUSINESS'     // 🏢 Pipeline empresarial/comercial  
  | 'NONPROFIT'    // 🤝 Pipeline para ONGs
  | 'EDUCATION'    // 🎓 Pipeline para instituciones educativas
  | 'GENERAL';     // 📋 Pipeline general/personalizado

/**
 * Labels para las categorías (matching backend)
 */
export const PIPELINE_CATEGORY_LABELS: Record<PipelineCategory, string> = {
  CHURCH: 'Iglesia',
  BUSINESS: 'Empresarial', 
  NONPROFIT: 'Sin Fines de Lucro',
  EDUCATION: 'Educativo',
  GENERAL: 'General',
};
  
  // ============================================
  // PIPELINE STAGE TYPES (Matching PipelineStageDTO)
  // ============================================
  
  /**
   * Etapa individual de un pipeline (matching PipelineStageDTO del backend)
   */
  
  // ✅ DEFINICIÓN FINAL Y CORRECTA (Reflejo exacto del StageDTO.java)
  export interface PipelineStage extends BaseEntity {
    // Información básica obligatoria
    name: string;
    orderIndex: number;
    pipelineId: number;
    
    // Configuración opcional (matching StageDTO.java)
    description?: string | null; // Puede ser null desde la BD
    color?: string | null;
    
    // ✅ CORRECCIÓN: Nombres exactos del DTO de Java
    isWon?: boolean | null;
    isLost?: boolean | null;
    
    probability?: number | null; // Integer en Java puede ser null
    
    // Métricas computadas (del backend)
    dealCount?: number;
    totalValue?: number;
    averageDealValue?: number;
    averageTimeInStage?: number;
    
    // Ownership
    ownerCognitoSub: CognitoSub;
    ownerName?: string;
  }

/**
 * Request para crear una nueva etapa (matching StageRequest del backend)
 */
export interface CreatePipelineStageRequest {
  // Información básica
  name: string;
  description?: string;
  position: number;                        // 🔥 CORREGIDO: era 'order'
  color?: string;
  probability?: number;
  
  // Estados de cierre (matching backend)
  isWon?: boolean;                         // 🔥 CORREGIDO: era 'isClosedWon'
  isLost?: boolean;                        // 🔥 CORREGIDO: era 'isClosedLost'
  
  // Configuración adicional (matching backend)
  autoMoveDays?: number;
  active?: boolean;
}
  
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
 * Request para crear un nuevo pipeline (matching CreatePipelineRequest del backend)
 */
export interface CreatePipelineRequest {
  // Información básica requerida (matching backend)
  name: string;
  category: PipelineCategory;              // 🔥 CORREGIDO: era 'type'
  
  // Información opcional
  description?: string;
  icon?: string;
  color?: string;
  
  // Configuración (matching backend)
  settings?: Record<string, any>;
  trackingMetrics?: string[];
  active?: boolean;                        // 🔥 CORREGIDO: era 'isActive'  
  isDefault?: boolean;
  
  // Configuraciones avanzadas (matching backend)
  enableAutomations?: boolean;
  enableNotifications?: boolean;
  enableReports?: boolean;
  
  // Etapas iniciales (matching StageRequest del backend)
  stages: CreatePipelineStageRequest[];
}
  
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
        { name: 'Lead', orderIndex: 0, probability: 10, color: DEFAULT_STAGE_COLORS[0] },
        { name: 'Contacto Establecido', orderIndex: 1, probability: 20, color: DEFAULT_STAGE_COLORS[1] },
        { name: 'Calificado', orderIndex: 2, probability: 40, color: DEFAULT_STAGE_COLORS[2] },
        { name: 'Propuesta Presentada', orderIndex: 3, probability: 60, color: DEFAULT_STAGE_COLORS[3] },
        { name: 'En Negociación', orderIndex: 4, probability: 80, color: DEFAULT_STAGE_COLORS[4] },
        { name: 'Ganado', orderIndex: 5, probability: 100, color: DEFAULT_STAGE_COLORS[5], isClosedWon: true },
        { name: 'Perdido', orderIndex: 6, probability: 0, color: DEFAULT_STAGE_COLORS[6], isClosedLost: true },
      ],
    },
  
    BUSINESS_SERVICE_DELIVERY: {
      key: 'BUSINESS_SERVICE_DELIVERY',
      name: 'Proceso de Entrega de Servicio',
      description: 'Flujo de trabajo para gestionar la entrega de un proyecto o servicio desde la orden hasta la facturación.',
      icon: 'ClipboardCheck',
      stages: [
        { name: 'Costos Aprobados', orderIndex: 0, probability: 10, color: DEFAULT_STAGE_COLORS[0] },
        { name: 'Orden de Servicio Generada', orderIndex: 1, probability: 30, color: DEFAULT_STAGE_COLORS[1] },
        { name: 'En Desarrollo / Ejecución', orderIndex: 2, probability: 60, color: DEFAULT_STAGE_COLORS[2] },
        { name: 'Control de Calidad / QA', orderIndex: 3, probability: 80, color: DEFAULT_STAGE_COLORS[3] },
        { name: 'Acta de Entrega Firmada', orderIndex: 4, probability: 95, color: DEFAULT_STAGE_COLORS[4] },
        { name: 'Facturado y Cerrado', orderIndex: 5, probability: 100, color: DEFAULT_STAGE_COLORS[5], isClosedWon: true },
        { name: 'Cancelado', orderIndex: 6, probability: 0, color: DEFAULT_STAGE_COLORS[6], isClosedLost: true },
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
        { name: 'Nuevo Contacto', orderIndex: 0, color: DEFAULT_STAGE_COLORS[0] },
        { name: 'En Seguimiento Personal', orderIndex: 1, color: DEFAULT_STAGE_COLORS[1] },
        { name: 'Asistente Regular', orderIndex: 2, color: DEFAULT_STAGE_COLORS[2] },
        { name: 'Asistió a Encuentro/Retiro', orderIndex: 3, color: DEFAULT_STAGE_COLORS[3] },
        { name: 'Consolidado', orderIndex: 4, color: DEFAULT_STAGE_COLORS[4], isClosedWon: true },
        { name: 'No Interesado / Inactivo', orderIndex: 5, color: DEFAULT_STAGE_COLORS[5], isClosedLost: true },
      ],
    },
    
    // ===============================================
    // PLANTILLA PARA ORGANIZACIONES SIN FINES DE LUCRO
    // ===============================================
  
    NONPROFIT_VOLUNTEER_MANAGEMENT: {
      key: 'NONPROFIT_VOLUNTEER_MANAGEMENT',
      name: 'Gestión de Voluntarios',
      description: 'Proceso para reclutar, entrenar e integrar voluntarios a una causa u ONG.',
      icon: 'Megaphone',
      stages: [
        { name: 'Interesado Registrado', orderIndex: 0, color: DEFAULT_STAGE_COLORS[0] },
        { name: 'Entrevista / Contacto', orderIndex: 1, color: DEFAULT_STAGE_COLORS[1] },
        { name: 'En Entrenamiento', orderIndex: 2, color: DEFAULT_STAGE_COLORS[2] },
        { name: 'Voluntario Activo', orderIndex: 3, color: DEFAULT_STAGE_COLORS[3], isClosedWon: true },
        { name: 'No Disponible / Descartado', orderIndex: 4, color: DEFAULT_STAGE_COLORS[4], isClosedLost: true },
      ],
    },
  
  } as const;