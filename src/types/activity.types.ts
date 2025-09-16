// src/types/activity.types.ts
// ✅ Tipos específicos para el dominio de Actividades del CRM
// Matching exacto con ActivityDTO y ActivityController del backend
// Siguiendo EXACTAMENTE el patrón de company.types.ts (GOLDEN STANDARD)

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
    
  // ============================================
  // ACTIVITY CORE TYPES (Matching ActivityDTO)
  // ============================================
  
  /**
   * Entidad Activity completa (matching ActivityDTO del backend)
   */
  export interface Activity extends BaseEntity {
    // =============================================================
    // CAMPOS QUE VIENEN DIRECTAMENTE DEL ActivityDTO.java
    // =============================================================
    
    // Información básica (Nombres corregidos)
    type: ActivityType;
    subject: string;                  // ✅ CORREGIDO: de 'title' a 'subject'
    description?: string;
    
    // Fechas y duración (Nombres y tipos corregidos)
    scheduledAt: string;              // ✅ CORREGIDO: de 'activityDate' a 'scheduledAt'
    completedAt?: string;
    durationMinutes?: number;         // ✅ CORREGIDO: de 'duration' a 'durationMinutes'
    
    // Asignación (Nombre corregido)
    assigneeCognitoSub: CognitoSub;   // ✅ CORREGIDO: de 'assignedToCognitoSub' a 'assigneeCognitoSub'
  
    // Relaciones (Nombres corregidos)
    contactId?: ID;
    contactName?: string;
    companyId?: ID;
    companyName?: string;
    dealId?: ID;
    dealTitle?: string;               // ✅ CORREGIDO: 'dealTitle' ya estaba bien
  
    // Estado y outcome
    status: ActivityStatus;
    outcome?: string;                 // Cambiado de 'ActivityOutcome' a 'string' para coincidir
    outcomeNotes?: string;
  
    // =============================================================
    // CAMPOS ADICIONALES O CALCULADOS EN EL FRONTEND (PUEDEN QUEDAR)
    // =============================================================
    
    // Estos campos no vienen del DTO principal pero pueden ser útiles en el frontend.
    // Es importante saber que son opcionales y pueden no estar presentes.
    dueDate?: string;                 // Para tasks/follow-ups
    priority?: ActivityPriority;
    metadata?: ActivityMetadata;
    customFields?: CustomFields;
    tags?: Tag[];
    createdByName?: string;           // Computed field
    assignedToName?: string;          // Computed field
    isOverdue?: boolean;              // Computed field
  }
  
  /**
   * Metadata específica según el tipo de actividad
   */
  export interface ActivityMetadata {
    // Para llamadas
    phoneNumber?: string;
    callDirection?: 'INBOUND' | 'OUTBOUND';
    callResult?: 'ANSWERED' | 'VOICEMAIL' | 'NO_ANSWER' | 'BUSY';
    
    // Para emails
    emailSubject?: string;
    emailTo?: string[];
    emailCc?: string[];
    emailBcc?: string[];
    emailAttachments?: string[];
    
    // Para reuniones
    meetingLocation?: string;
    meetingType?: 'IN_PERSON' | 'VIDEO_CALL' | 'PHONE_CALL';
    meetingUrl?: string;
    attendees?: string[];
    
    // Para tasks
    taskCategory?: string;
    estimatedTime?: number;
    actualTime?: number;
    
    // Para notas
    noteCategory?: string;
    isPrivate?: boolean;
    
    // Campos adicionales
    nextSteps?: string;
    followUpDate?: string;
    attachments?: string[];
    externalUrl?: string;
  }
  
  /**
   * Stats interface para actividades
   */
  export interface ActivityStats {
    // Campos básicos (del backend)
    total: number;
    byType: Record<ActivityType, number>;
    byStatus: Record<ActivityStatus, number>;
    byOutcome: Record<ActivityOutcome, number>;
    
    // Campos adicionales para UI
    completedToday?: number;
    overdueCount?: number;
    scheduledThisWeek?: number;
    averageDuration?: number;
    completionRate?: number;
  }
  
  // ============================================
  // ALIAS TYPES (Para compatibilidad con componentes)
  // ============================================
  
  /**
   * Alias para mantener compatibilidad con componentes existentes
   */
  export type ActivityDTO = Activity;
  
  // ============================================
  // ENUMS Y TIPOS ESPECÍFICOS
  // ============================================
  
  /**
   * Tipos de actividad (matching backend enum)
   */
  export type ActivityType = 
    | 'CALL'         // Llamada telefónica
    | 'EMAIL'        // Email enviado/recibido
    | 'MEETING'      // Reunión/cita
    | 'NOTE'         // Nota/observación
    | 'TASK'         // Tarea/follow-up
    | 'STAGE_CHANGE' // Cambio de etapa (deals)
    | 'PROPOSAL'     // Propuesta enviada
    | 'CONTRACT'     // Contrato/acuerdo
    | 'PAYMENT'      // Pago recibido
    | 'SUPPORT'      // Ticket de soporte
    | 'OTHER';       // Otros tipos
  
  /**
   * Estados de actividad
   */
  export type ActivityStatus = 
    | 'PENDING'      // Pendiente de realizar
    | 'IN_PROGRESS'  // En progreso
    | 'COMPLETED'    // Completada
    | 'CANCELLED'    // Cancelada
    | 'OVERDUE';     // Vencida
  
  /**
   * Resultados/outcomes de actividad
   */
  export type ActivityOutcome = 
    | 'SUCCESSFUL'   // Exitosa
    | 'UNSUCCESSFUL' // No exitosa
    | 'NO_RESPONSE'  // Sin respuesta
    | 'RESCHEDULED'  // Reagendada
    | 'CANCELLED'    // Cancelada
    | 'PENDING';     // Pendiente de evaluar
  
  /**
   * Prioridad de actividad
   */
  export type ActivityPriority = 
    | 'LOW'          // Baja prioridad
    | 'MEDIUM'       // Prioridad media
    | 'HIGH'         // Alta prioridad
    | 'URGENT';      // Urgente
  
  // ============================================
  // SEARCH & FILTER TYPES
  // ============================================
  
  /**
   * Criterios de búsqueda específicos para actividades
   */
  export interface ActivitySearchCriteria extends BaseSearchCriteria {
    // Texto libre
    search?: string;                    // Búsqueda en título, descripción
    
    // Filtros básicos
    type?: ActivityType;
    status?: ActivityStatus;
    outcome?: ActivityOutcome;
    priority?: ActivityPriority;
    
    // Ownership y asignación
    createdByCognitoSub?: CognitoSub;
    assignedToCognitoSub?: CognitoSub;
    onlyMine?: boolean;                // Solo actividades que me pertenecen
    
    // Relaciones con entidades
    contactId?: ID;
    companyId?: ID;
    dealId?: ID;
    entityType?: 'CONTACT' | 'COMPANY' | 'DEAL';
    entityId?: ID;
    
    // Fechas
    activityDateFrom?: string;
    activityDateTo?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    createdFrom?: string;
    createdTo?: string;
    
    // Estado y tiempo
    isOverdue?: boolean;
    isCompleted?: boolean;
    isToday?: boolean;
    isThisWeek?: boolean;
    
    // Custom fields
    customFields?: Record<string, any>;
    
    // Metadata
    hasOutcome?: boolean;
    hasNextSteps?: boolean;
    hasAttachments?: boolean;
  }
  
  // ============================================
  // REQUEST/RESPONSE TYPES
  // ============================================
  
  /**
   * Request para crear actividad
   */
  export type CreateActivityRequest = Partial<Omit<Activity, keyof BaseEntity>> & {
    // Campos requeridos por el formulario de creación
    type: ActivityType;
    subject: string;
    scheduledAt: string;
    
    // Campos opcionales del formulario
    description?: string;
    dueDate?: string;
    duration?: number;
    status?: ActivityStatus;
    priority?: ActivityPriority;
    
    // Relaciones (al menos una requerida)
    contactId?: ID;
    companyId?: ID;
    dealId?: ID;
    
    // Asignación
    assigneeCognitoSub: CognitoSub;
    
    // Metadata y campos adicionales
    metadata?: ActivityMetadata;
    customFields?: CustomFields;
  };
  
  /**
   * Request para actualizar actividad
   */
  export type UpdateActivityRequest = Partial<Omit<Activity, keyof BaseEntity>> & {
    version: number; // Requerido para optimistic locking
    
    // Todos los demás campos opcionales
    type?: ActivityType;
    subject?: string;
    description?: string;
    scheduledAt?: string;
    dueDate?: string;
    duration?: number;
    status?: ActivityStatus;
    outcome?: ActivityOutcome;
    priority?: ActivityPriority;
    assigneeCognitoSub?: CognitoSub;
    metadata?: ActivityMetadata;
    customFields?: CustomFields;
  };
  
  /**
   * Response de actividad individual
   */
  export type ActivityResponse = EntityResponse<Activity>;
  
  /**
   * Response de actividades paginados
   */
  export type ActivityPageResponse = PagedResponse<Activity>;
  
  /**
   * Response de lista de actividades
   */
  export type ActivityListResponse = ListResponse<Activity>;
  
  /**
   * Request para búsqueda de actividades
   */
  export interface ActivitySearchRequest extends SearchRequestParams {
    criteria: ActivitySearchCriteria;
  }
  
  /**
   * Request para operaciones batch de actividades
   */
  export type ActivityBatchRequest = BatchRequest<Activity>;
  
  /**
   * Response de operaciones batch de actividades
   */
  export type ActivityBatchResponse = EntityBatchResponse<Activity>;
  
  // ============================================
  // SPECIALIZED REQUESTS
  // ============================================
  
  /**
   * Request para marcar actividad como completada
   */
  export interface CompleteActivityRequest {
    activityId: ID;
    outcome: ActivityOutcome;
    completionNotes?: string;
    actualDuration?: number;
    nextSteps?: string;
    scheduleFollowUp?: boolean;
    followUpDate?: string;
  }
  
  /**
   * Request para reagendar actividad
   */
  export interface RescheduleActivityRequest {
    activityId: ID;
    newActivityDate: string;
    newDueDate?: string;
    reason?: string;
    notifyAssignee?: boolean;
  }
  
  /**
   * Request para asignar actividad
   */
  export interface AssignActivityRequest {
    activityId: ID;
    assignToSub: CognitoSub;
    notes?: string;
    notifyAssignee?: boolean;
  }
  
  /**
   * Request para crear actividad de seguimiento
   */
  export interface CreateFollowUpActivityRequest extends CreateActivityRequest {
    parentActivityId: ID;
    followUpType: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK';
    scheduledFor: string;
    remindBefore?: number; // Minutos antes de recordar
  }
  
  /**
   * Request para bulk update de actividades
   */
  export interface BulkUpdateActivitiesRequest {
    activityIds: ID[];
    updates: {
      status?: ActivityStatus;
      assignedToCognitoSub?: CognitoSub;
      priority?: ActivityPriority;
      tags?: ID[];
    };
  }
  
  // ============================================
  // METRICS & ANALYTICS TYPES
  // ============================================
  
  /**
   * Métricas de actividades
   */
  export interface ActivityMetrics extends BaseMetrics {
    byType: GroupedMetrics;
    byStatus: GroupedMetrics;
    byOutcome: GroupedMetrics;
    byPriority: GroupedMetrics;
    byAssignee: GroupedMetrics;
    completionRate: number;
    averageDuration: number;
    overdueCount: number;
    todayCount: number;
    thisWeekCount: number;
  }
  
  /**
   * Request para métricas de actividades
   */
  export interface ActivityMetricsRequest extends MetricsRequest {
    entityType: 'ACTIVITY';
    includeCompletionRates?: boolean;
    includeDurationStats?: boolean;
    includeOutcomeAnalysis?: boolean;
    byAssignee?: boolean;
  }
  
  // ============================================
  // UI CONSTANTS & LABELS (Para componentes)
  // ============================================
  
  /**
   * Labels para tipos de actividad
   */
  export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
    CALL: 'Llamada',
    EMAIL: 'Email',
    MEETING: 'Reunión',
    NOTE: 'Nota',
    TASK: 'Tarea',
    STAGE_CHANGE: 'Cambio de Etapa',
    PROPOSAL: 'Propuesta',
    CONTRACT: 'Contrato',
    PAYMENT: 'Pago',
    SUPPORT: 'Soporte',
    OTHER: 'Otro'
  };
  
  /**
   * Labels para estados de actividad
   */
  export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En Progreso',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    OVERDUE: 'Vencida'
  };
  
  /**
   * Labels para outcomes de actividad
   */
  export const ACTIVITY_OUTCOME_LABELS: Record<ActivityOutcome, string> = {
    SUCCESSFUL: 'Exitosa',
    UNSUCCESSFUL: 'No Exitosa',
    NO_RESPONSE: 'Sin Respuesta',
    RESCHEDULED: 'Reagendada',
    CANCELLED: 'Cancelada',
    PENDING: 'Pendiente'
  };
  
  /**
   * Labels para prioridad de actividad
   */
  export const ACTIVITY_PRIORITY_LABELS: Record<ActivityPriority, string> = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    URGENT: 'Urgente'
  };
  
  /**
   * Colores para tipos de actividad
   */
  export const ACTIVITY_TYPE_COLORS: Record<ActivityType, { text: string; bg: string }> = {
    CALL: { text: 'text-blue-400', bg: 'bg-blue-900/20' },
    EMAIL: { text: 'text-green-400', bg: 'bg-green-900/20' },
    MEETING: { text: 'text-purple-400', bg: 'bg-purple-900/20' },
    NOTE: { text: 'text-yellow-400', bg: 'bg-yellow-900/20' },
    TASK: { text: 'text-orange-400', bg: 'bg-orange-900/20' },
    STAGE_CHANGE: { text: 'text-primary-400', bg: 'bg-primary-900/20' },
    PROPOSAL: { text: 'text-indigo-400', bg: 'bg-indigo-900/20' },
    CONTRACT: { text: 'text-emerald-400', bg: 'bg-emerald-900/20' },
    PAYMENT: { text: 'text-teal-400', bg: 'bg-teal-900/20' },
    SUPPORT: { text: 'text-rose-400', bg: 'bg-rose-900/20' },
    OTHER: { text: 'text-gray-400', bg: 'bg-gray-900/20' }
  };
  
  /**
   * Valores por defecto
   */
  export const DEFAULT_ACTIVITY_TYPE: ActivityType = 'NOTE';
  export const DEFAULT_ACTIVITY_STATUS: ActivityStatus = 'PENDING';
  export const DEFAULT_ACTIVITY_PRIORITY: ActivityPriority = 'MEDIUM';
  
  // ============================================
  // TYPE GUARDS & HELPERS
  // ============================================
  
  /**
   * Type guard para verificar si es una actividad válida
   */
  export const isValidActivity = (obj: any): obj is Activity => {
    return obj && 
           typeof obj.id === 'number' &&
           typeof obj.type === 'string' &&
           typeof obj.title === 'string' &&
           typeof obj.createdByCognitoSub === 'string';
  };
  
  /**
   * Helper para verificar si una actividad está vencida
   */
  export const isActivityOverdue = (activity: Activity): boolean => {
    if (!activity.dueDate || activity.status === 'COMPLETED' || activity.status === 'CANCELLED') {
      return false;
    }
    return new Date(activity.dueDate) < new Date();
  };
  
  /**
   * Helper para verificar si una actividad está completada
   */
  export const isActivityCompleted = (activity: Activity): boolean => {
    return activity.status === 'COMPLETED' && !!activity.completedAt;
  };
  
  /**
   * Helper para verificar si es una actividad de hoy
   */
  export const isActivityToday = (activity: Activity): boolean => {
    // Si la actividad no tiene fecha programada, no puede ser de hoy.
    if (!activity.scheduledAt) {
        return false;
    }
    
    // ✅ CORRECCIÓN QUIRÚRGICA: Usa 'scheduledAt' en lugar de 'activityDate'
    // Se convierten ambas fechas a formato YYYY-MM-DD para una comparación segura
    // sin verse afectado por zonas horarias o milisegundos.
    const today = new Date().toISOString().slice(0, 10);
    const activityDate = new Date(activity.scheduledAt).toISOString().slice(0, 10);
    
    return activityDate === today;
  };
  
  /**
   * Helper para verificar si es una actividad de esta semana
   */
  export const isActivityThisWeek = (activity: Activity): boolean => {
    const now = new Date();
    // Ajuste para que la semana comience en Lunes (1) o Domingo (0) según tu preferencia. 
    // new Date().getDay() devuelve 0 para Domingo.
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))); // Lunes
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // ✅ CORRECCIÓN QUIRÚRGICA: Usa 'scheduledAt' en lugar de 'activityDate'
    const activityDate = new Date(activity.scheduledAt);
    return activityDate >= startOfWeek && activityDate <= endOfWeek;
  };
  
  /**
   * Helper para obtener el nombre de la entidad relacionada
   */
  export const getRelatedEntityName = (activity: Activity): string => {
    // Este helper ya estaba correcto, no necesita cambios.
    if (activity.dealTitle) return activity.dealTitle;
    if (activity.contactName) return activity.contactName;
    if (activity.companyName) return activity.companyName;
    return 'Sin relación';
  };
  
  /**
   * Helper para obtener el tipo de entidad relacionada
   */
  export const getRelatedEntityType = (activity: Activity): 'CONTACT' | 'COMPANY' | 'DEAL' | null => {
    // Este helper ya estaba correcto, no necesita cambios.
    if (activity.dealId) return 'DEAL';
    if (activity.contactId) return 'CONTACT';
    if (activity.companyId) return 'COMPANY';
    return null;
  };
  
  /**
   * Helper para verificar si requiere seguimiento
   */
  export const requiresFollowUp = (activity: Activity): boolean => {
    // Este helper ya estaba correcto, no necesita cambios.
    return !!(activity.metadata?.nextSteps || activity.metadata?.followUpDate);
  };
  
  /**
   * Helper para obtener duración formateada
   */
  export const getFormattedDuration = (activity: Activity): string => {
    // ✅ CORRECCIÓN QUIRÚRGICA: Usa 'durationMinutes' en lugar de 'duration'
    if (!activity.durationMinutes) return 'Sin duración';
    const hours = Math.floor(activity.durationMinutes / 60);
    const minutes = activity.durationMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    }
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}min`;
  };
  
  /**
   * Helper para crear criterios de búsqueda básicos
   */
  export const createActivitySearchCriteria = (
    overrides: Partial<ActivitySearchCriteria> = {}
  ): ActivitySearchCriteria => ({
    ...overrides,
  });
  
  /**
   * Type guard para ActivityType
   */
  export const isValidActivityType = (type: string): type is ActivityType => {
    return ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'STAGE_CHANGE', 'PROPOSAL', 'CONTRACT', 'PAYMENT', 'SUPPORT', 'OTHER'].includes(type);
  };
  
  /**
   * Type guard para ActivityStatus
   */
  export const isValidActivityStatus = (status: string): status is ActivityStatus => {
    return ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'].includes(status);
  };
  
  /**
   * Type guard para ActivityOutcome
   */
  export const isValidActivityOutcome = (outcome: string): outcome is ActivityOutcome => {
    return ['SUCCESSFUL', 'UNSUCCESSFUL', 'NO_RESPONSE', 'RESCHEDULED', 'CANCELLED', 'PENDING'].includes(outcome);
  };
  
  /**
   * Type guard para ActivityPriority
   */
  export const isValidActivityPriority = (priority: string): priority is ActivityPriority => {
    return ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority);
  };
