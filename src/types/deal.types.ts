// src/types/deal.types.ts
// ✅ Tipos específicos para el dominio de Oportunidades del CRM
// Matching exacto con DealDTO y DealController del backend
// Replicando estructura de company.types.ts

import {
    BaseEntity,
    BaseSearchCriteria,
    ID,
    CognitoSub,
    CustomFields,
  } from './common.types';
  
  import {
    EntityResponse,
    PagedResponse,
    ListResponse,
    SearchRequestParams,
    BatchRequest,
    EntityBatchResponse,
    MetricsRequest,
    BaseMetrics,
    GroupedMetrics,
  } from './api.types';
  
  import type { Tag } from './common.types';

  import type { BadgeVariant } from '@/components/ui/Badge';
    
  // ============================================
  // DEAL CORE TYPES (Matching DealDTO del backend)
  // ============================================
  
  /**
   * Estados de una oportunidad
   */
  export type DealStatus = 'OPEN' | 'WON' | 'LOST';
  
  /**
   * Prioridades de oportunidad
   */
  export type DealPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  /**
   * Tipos de oportunidad
   */
  export type DealType = 'NEW_BUSINESS' | 'EXISTING_BUSINESS' | 'RENEWAL' | 'UPSELL' | 'CROSS_SELL';
  
  /**
   * Entidad Deal completa (matching DealDTO del backend)
   */
  export interface Deal extends BaseEntity {
    // Información básica obligatoria
    title: string;
    description?: string;
    
    // Datos financieros
    amount?: number;  // monetaryValue en backend
    probability?: number;  // 0-100
    expectedCloseDate?: string;
    actualCloseDate?: string;
    
    // RELACIONES OBLIGATORIAS - Conecta con el pipeline
    pipelineId: number;
    stageId: number;
    contactId: number;      // Contacto principal
    companyId?: number;     // Empresa opcional
    
    // CAMPOS DENORMALIZADOS para UI (computed fields)
    pipelineName?: string;
    stageName?: string;
    contactName?: string;
    contactEmail?: string | null;
    companyName?: string;
    
    // Clasificación y seguimiento
    status: DealStatus;
    priority?: DealPriority;
    type?: DealType;
    source?: string;        // De dónde vino la oportunidad
    sourceDetails?: string; // Detalles adicionales sobre la fuente
    
    // Ownership y asignación
    ownerCognitoSub: CognitoSub;    // Owner de la oportunidad
    ownerName?: string;             // Computed field
    teamMembers?: string[];
  
    // Timestamps de tracking - ESTOS ESTABAN FALTANDO:
    stageEnteredAt?: string;
    closedAt?: string;
    
    // Razones de cierre - ESTOS TAMBIÉN FALTABAN:
    wonReason?: string;
    lostReason?: string;
    
    // Custom fields
    customFields: CustomFields;
  
    /**
     * Un array de objetos Tag asociados a esta oportunidad.
     * Permite una segmentación flexible y definida por el usuario.
     */
    tags?: Tag[];
    
    // Métricas y actividad (computed fields)
    activityCount?: number;         // Número de actividades registradas
    lastActivityAt?: string;        // Última actividad
    daysInCurrentStage?: number;    // Días en la etapa actual
    daysInPipeline?: number;        // Días total en el pipeline
    
    // Campos de Inteligencia de Negocio (del backend)
    healthScore?: number;           // 0-100, salud de la oportunidad
    riskLevel?: 'low' | 'medium' | 'high';
    nextAction?: string;            // Próxima acción sugerida
    
    // Display helpers (computed fields)
    displayName?: string;           // Nombre para mostrar
    formattedAmount?: string;       // Monto formateado con moneda
    isOverdue?: boolean;           // Si pasó la fecha esperada
    isHighValue?: boolean;         // Si es una oportunidad de alto valor
  }
  
  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
    /**
     * Obtiene el nombre para mostrar de una oportunidad
     */
    export const getDisplayName = (deal: Deal): string => {
        if (deal.displayName) return deal.displayName;
        return deal.title || `Oportunidad #${deal.id}`;
    };
    
    /**
     * Formatea el monto de la oportunidad
     */
    export const formatDealAmount = (deal: Deal): string => {
        if (!deal.amount) return 'Sin monto';
        return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        }).format(deal.amount);
    };
    
    /**
     * Obtiene la VARIANTE del Badge para el estado
     * ✅ CORREGIDO: Devuelve el tipo específico BadgeVariant
     */
    export const getStatusVariant = (status: DealStatus): BadgeVariant => {
        switch (status) {
        case 'OPEN': return 'info'; // 'info' es tu variante azul
        case 'WON': return 'success';
        case 'LOST': return 'destructive';
        default: return 'default';
        }
    };
    
    /**
     * Obtiene la VARIANTE del Badge para la prioridad
     * ✅ CORREGIDO: Devuelve el tipo específico BadgeVariant
     */
    export const getPriorityVariant = (priority?: DealPriority): BadgeVariant => {
        switch (priority) {
        case 'LOW': return 'success';
        case 'MEDIUM': return 'default';
        case 'HIGH': return 'warning';
        case 'URGENT': return 'destructive';
        default: return 'default';
        }
    };

  // ============================================
  // SEARCH CRITERIA
  // ============================================
  
  /**
   * Criterios de búsqueda para oportunidades
   */
  export interface DealSearchCriteria extends BaseSearchCriteria {
    search?: string;                    // Búsqueda en nombre, descripción
    
    // Filtros de relaciones
    pipelineId?: number;
    stageId?: number;
    contactId?: number;
    companyId?: number;
    
    // Filtros básicos
    status?: DealStatus;
    priority?: DealPriority;
    type?: DealType;
    source?: string;
    
    // Ownership y asignación
    ownerCognitoSub?: CognitoSub;
    onlyOwned?: boolean;               // Solo oportunidades que soy dueño
    
    // Fechas
    createdFrom?: string;
    createdTo?: string;
    expectedCloseFrom?: string;
    expectedCloseTo?: string;
    actualCloseFrom?: string;
    actualCloseTo?: string;
    
    // Montos
    minAmount?: number;
    maxAmount?: number;
    
    // Probabilidad
    minProbability?: number;
    maxProbability?: number;
    
    // Actividad
    hasActivities?: boolean;
    lastActivityFrom?: string;
    lastActivityTo?: string;
    
    // Pipeline específico
    daysInStageMin?: number;
    daysInStageMax?: number;
    
    // Custom fields
    customFields?: Record<string, any>;
    
    // Health y risk
    minHealthScore?: number;
    maxHealthScore?: number;
    riskLevel?: 'low' | 'medium' | 'high';
  }
  
  // ============================================
  // REQUEST/RESPONSE TYPES - ✅ MEJORADO CON TIPOS DE UTILIDAD
  // ============================================
  
  // --- Definimos la base de lo que se puede editar ---
  // Excluimos campos de BaseEntity, computed fields y campos que no se pueden editar directamente
  type DealEditableFields = Omit<Deal, 
    keyof BaseEntity | 
    'pipelineName' | 'stageName' | 'contactName' | 'companyName' | 'ownerName' |
    'displayName' | 'formattedAmount' | 'isOverdue' | 'isHighValue' |
    'activityCount' | 'lastActivityAt' | 'daysInCurrentStage' | 'daysInPipeline' |
    'healthScore' | 'riskLevel' | 'nextAction'
  >;
  
  /**
   * Request para crear oportunidad (más seguro y conciso)
   * ✅ Usamos Pick<> para seleccionar solo los campos requeridos y opcionales del formulario
   * ✅ Si se añade un campo a Deal, automáticamente se propaga aquí
   */
  export type CreateDealRequest = 
    // Campos REQUERIDOS para crear una oportunidad
    Pick<Deal, 'title' | 'pipelineId' | 'stageId' | 'contactId'> &
    // Campos OPCIONALES que se pueden proporcionar en la creación
    Partial<Pick<DealEditableFields, 
      'description' | 'amount' | 'probability' | 'expectedCloseDate' | 
      'companyId' | 'priority' | 'type' | 'source' | 'customFields'
    >>;
  
  /**
   * Request para actualizar oportunidad (más seguro y conciso)
   * ✅ Todos los campos editables son opcionales, excepto version que es requerida
   * ✅ El status sí se puede cambiar en una actualización (cerrar deal, reabrir, etc.)
   */
  export type UpdateDealRequest = Partial<DealEditableFields> & {
    version: number; // Requerido para optimistic locking
    status?: DealStatus; // El estado sí se puede cambiar en una actualización
  };
  
  /**
   * Request para mover oportunidad a otra etapa (drag & drop)
   */
  export interface MoveDealToStageRequest {
    dealId: number;
    newStageId: number;
    newProbability?: number;  // Opcional, se puede auto-calcular
  }
  
  /**
   * Response de oportunidad individual
   */
  export type DealResponse = EntityResponse<Deal>;
  
  /**
   * Response de oportunidades paginadas
   */
  export type DealPageResponse = PagedResponse<Deal>;
  
  /**
   * Response de lista de oportunidades
   */
  export type DealListResponse = ListResponse<Deal>;
  
  /**
   * Request para búsqueda de oportunidades
   */
  export interface DealSearchRequest extends SearchRequestParams {
    criteria: DealSearchCriteria;
  }
  
  /**
   * Request para operaciones batch de oportunidades
   */
  export type DealBatchRequest = BatchRequest<Deal>;
  
  /**
   * Response de operaciones batch de oportunidades
   */
  export type DealBatchResponse = EntityBatchResponse<Deal>;
  
  // ============================================
  // SPECIALIZED REQUESTS
  // ============================================
  
  /**
   * Request para asignar oportunidad
   */
  export interface AssignDealRequest {
    dealId: ID;
    assignToSub: CognitoSub;
    notes?: string;
  }
  
  /**
   * Request para cerrar oportunidad como ganada
   */
  export interface CloseDealWonRequest {
    dealId: ID;
    actualCloseDate?: string;  // Si no se proporciona, usa fecha actual
    finalAmount?: number;      // Monto final cerrado
    notes?: string;
  }
  
  /**
   * Request para cerrar oportunidad como perdida
   */
  export interface CloseDealLostRequest {
    dealId: ID;
    actualCloseDate?: string;  // Si no se proporciona, usa fecha actual
    lostReason?: string;       // Razón de la pérdida
    notes?: string;
  }
  
  /**
   * Request para reabrir oportunidad
   */
  export interface ReopenDealRequest {
    dealId: ID;
    newStageId?: number;       // A qué etapa regresarla
    notes?: string;
  }
  
  /**
   * Request para transferir ownership
   */
  export interface TransferDealOwnershipRequest {
    dealIds: ID[];
    newOwnerSub: CognitoSub;
    transferReason?: string;
    notifyNewOwner?: boolean;
  }
  
  /**
   * Request para clonar oportunidad
   */
  export interface CloneDealRequest {
    dealId: ID;
    newName?: string;
    newContactId?: number;
    newCompanyId?: number;
    resetStage?: boolean;      // Si volver a la primera etapa
    copyCustomFields?: boolean;
  }
  
  // ============================================
  // METRICS & ANALYTICS TYPES
  // ============================================
  
  /**
   * Métricas de oportunidades
   */
  export interface DealMetrics extends BaseMetrics {
    byStatus: GroupedMetrics;
    byPipeline: GroupedMetrics;
    byStage: GroupedMetrics;
    byOwner: GroupedMetrics;
    byPriority: GroupedMetrics;
    byType: GroupedMetrics;
    totalValue: number;
    averageValue: number;
    averageDaysToClose: number;
    conversionRate: number;
    recentlyCreated: number;
    recentlyClosed: number;
    overdue: number;
  }
  
  /**
   * Request para métricas de oportunidades
   */
  export interface DealMetricsRequest extends MetricsRequest {
    entityType: 'DEAL';
    pipelineId?: number;
    includeValueStats?: boolean;
    includeConversionStats?: boolean;
    includeTimeAnalysis?: boolean;
  }
  
  /**
   * Métricas específicas del pipeline (para Kanban)
   */
  export interface PipelineMetrics {
    pipelineId: number;
    pipelineName: string;
    stages: StageMetrics[];
    totalDeals: number;
    totalValue: number;
    averageDaysToMove: number;
    conversionRate: number;
  }
  
  /**
   * Métricas por etapa (para columnas del Kanban)
   */
  export interface StageMetrics {
    stageId: number;
    stageName: string;
    dealCount: number;
    totalValue: number;
    averageDaysInStage: number;
    deals: Deal[];  // Para renderizar las tarjetas
  }
  
  // ============================================
  // EXPORT UTILITY TYPES
  // ============================================
  
  /**
   * Alias para facilitar imports
   */
  export type DealDTO = Deal;
  
  /**
   * Tipo para la respuesta de estadísticas de deals
   */
  export interface DealStats {
    totalDeals: number;
    openDeals: number;
    wonDeals: number;
    lostDeals: number;
    totalValue: number;
    averageValue: number;
    winRate: number;
    averageDaysToClose: number;
  }
  
  /**
   * Configuración de etiquetas para estados
   */
  export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
    OPEN: 'Abierta',
    WON: 'Ganada', 
    LOST: 'Perdida',
  };
  
  /**
   * Configuración de etiquetas para prioridades
   */
  export const DEAL_PRIORITY_LABELS: Record<DealPriority, string> = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  };
  
  /**
   * Configuración de etiquetas para tipos
   */
  export const DEAL_TYPE_LABELS: Record<DealType, string> = {
    NEW_BUSINESS: 'Nuevo Negocio',
    EXISTING_BUSINESS: 'Negocio Existente',
    RENEWAL: 'Renovación',
    UPSELL: 'Venta Adicional',
    CROSS_SELL: 'Venta Cruzada',
  };

  // ============================================
// KANBAN SPECIFIC TYPES
// ============================================

/**
 * Datos completos para renderizar el Kanban (devueltos por dealApi.getPipelineKanbanData)
 */
export interface KanbanData {
    pipeline: {
      id: number;
      name: string;
      stages: StageMetrics[];
    };
    metrics: PipelineMetrics;
  }