// src/types/api.types.ts
// ✅ Tipos específicos para APIs del CRM
// Extiende common.types.ts, matching exacto con backend Spring Boot

import {
    BaseEntity,
    ApiResponse,
    ApiErrorResponse,
    BatchOperationResponse,
    ID,
    Timestamp,    
  } from './common.types';

  import type { PageResponse } from '@/types/common.types';
  
  // ============================================
  // HTTP METHOD TYPES
  // ============================================
  
  /**
   * Métodos HTTP soportados
   */
  export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /**
   * Headers HTTP comunes
   */
  export interface HttpHeaders {
    'Content-Type'?: string;
    'Accept'?: string;
    'Authorization'?: string;
    'X-Organization-Id'?: string;
    'X-Church-Id'?: string;
    'X-Client-Platform'?: string;
    'X-Client-Version'?: string;
    [key: string]: string | undefined;
  }
  
  /**
   * Configuración de request HTTP
   */
  export interface HttpRequestConfig {
    method: HttpMethod;
    url: string;
    headers?: HttpHeaders;
    params?: Record<string, any>;
    data?: any;
    timeout?: number;
    retries?: number;
    cache?: boolean;
  }
  
  // ============================================
  // API RESPONSE WRAPPERS
  // ============================================
  
  /**
   * Response wrapper para entidades individuales
   */
  export interface EntityResponse<T extends BaseEntity> extends ApiResponse<T> {
    data: T;
  }
  
  /**
   * Response wrapper para listas paginadas
   */
  export interface PagedResponse<T extends BaseEntity> extends ApiResponse<PageResponse<T>> {
    data: PageResponse<T>;
  }
  
  /**
   * Response wrapper para listas simples
   */
  export interface ListResponse<T> extends ApiResponse<T[]> {
    data: T[];
  }
  
  /**
   * Response para operaciones que no retornan data
   */
  export interface EmptyResponse extends ApiResponse<null> {
    data: null;
  }
  
  /**
   * Response para operaciones de conteo
   */
  export interface CountResponse extends ApiResponse<number> {
    data: number;
  }
  
  /**
   * Response para operaciones booleanas
   */
  export interface BooleanResponse extends ApiResponse<boolean> {
    data: boolean;
  }
  
  /**
   * Response para estadísticas
   */
  export interface StatsResponse<T = Record<string, any>> extends ApiResponse<T> {
    data: T;
  }
  
  // ============================================
  // ERROR HANDLING TYPES
  // ============================================
  
  /**
   * Tipos de error específicos del CRM
   */
  export type CrmErrorCode = 
    // Validation errors
    | 'VALIDATION_ERROR'
    | 'REQUIRED_FIELD'
    | 'INVALID_FORMAT'
    | 'INVALID_EMAIL'
    | 'INVALID_PHONE'
    | 'INVALID_DATE'
    | 'INVALID_RANGE'
    
    // Business logic errors
    | 'DUPLICATE_ENTITY'
    | 'DUPLICATE_EMAIL'
    | 'DUPLICATE_PHONE'
    | 'BUSINESS_CONTEXT_ERROR'
    | 'CONCURRENT_MODIFICATION'
    | 'OPTIMISTIC_LOCKING_FAILURE'
    | 'ENTITY_REFERENCED'
    | 'INVALID_STATE_TRANSITION'
    
    // Auth errors
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'TOKEN_EXPIRED'
    | 'INVALID_CREDENTIALS'
    | 'SESSION_EXPIRED'
    | 'MFA_REQUIRED'
    
    // Resource errors
    | 'NOT_FOUND'
    | 'ENTITY_NOT_FOUND'
    | 'CONTACT_NOT_FOUND'
    | 'COMPANY_NOT_FOUND'
    | 'DEAL_NOT_FOUND'
    | 'PIPELINE_NOT_FOUND'
    | 'STAGE_NOT_FOUND'
    
    // Network errors
    | 'NETWORK_ERROR'
    | 'TIMEOUT_ERROR'
    | 'SERVER_ERROR'
    | 'SERVICE_UNAVAILABLE'
    | 'BAD_GATEWAY'
    
    // File errors
    | 'FILE_TOO_LARGE'
    | 'INVALID_FILE_TYPE'
    | 'FILE_UPLOAD_FAILED'
    | 'FILE_NOT_FOUND'
    
    // Import/Export errors
    | 'IMPORT_FAILED'
    | 'EXPORT_FAILED'
    | 'INVALID_CSV_FORMAT'
    | 'INVALID_EXCEL_FORMAT'
    
    // Permission errors
    | 'INSUFFICIENT_PERMISSIONS'
    | 'ORGANIZATION_ACCESS_DENIED'
    | 'CHURCH_ACCESS_DENIED'
    
    // Generic
    | 'UNKNOWN_ERROR';
  
  /**
   * Error response extendido para el CRM
   */
  export interface CrmErrorResponse extends ApiErrorResponse {
    code: CrmErrorCode;
    correlationId?: string;
    suggestions?: string[];
    retryable?: boolean;
    retryAfter?: number;
  }
  
  /**
   * Error de validación específico
   */
  export interface ValidationErrorResponse extends CrmErrorResponse {
    code: 'VALIDATION_ERROR';
    fieldErrors: Record<string, string[]>;
    globalErrors?: string[];
  }
  
  /**
   * Error de concurrencia optimista
   */
  export interface ConcurrencyErrorResponse extends CrmErrorResponse {
    code: 'OPTIMISTIC_LOCKING_FAILURE' | 'CONCURRENT_MODIFICATION';
    currentVersion: number;
    attemptedVersion: number;
    lastModifiedBy?: string;
    lastModifiedAt?: Timestamp;
  }
  
  // ============================================
  // REQUEST PARAMETER TYPES
  // ============================================
  
  /**
   * Parámetros base para todas las requests
   */
  export interface BaseRequestParams {
    organizationId?: ID;
    churchId?: ID;
    includeDeleted?: boolean;
    fields?: string[];        // Para projection/select específico
    expand?: string[];        // Para eager loading de relaciones
  }
  
  /**
   * Parámetros para requests de listado
   */
  export interface ListRequestParams extends BaseRequestParams {
    page?: number;
    size?: number;
    sort?: string[];
    search?: string;
  }
  
  /**
   * Parámetros para requests de búsqueda avanzada
   */
  export interface SearchRequestParams extends ListRequestParams {
    filters?: Record<string, any>;
    dateFrom?: string;
    dateTo?: string;
    tags?: string[];
    customFields?: Record<string, any>;
  }
  
  /**
   * Parámetros para export
   */
  export interface ExportRequestParams extends SearchRequestParams {
    format: 'CSV' | 'EXCEL' | 'PDF';
    template?: string;
    includeHeaders?: boolean;
    customColumns?: string[];
  }
  
  /**
   * Parámetros para import
   */
  export interface ImportRequestParams extends BaseRequestParams {
    format: 'CSV' | 'EXCEL';
    skipHeaders?: boolean;
    mappings?: Record<string, string>;
    duplicateHandling?: 'SKIP' | 'UPDATE' | 'CREATE_NEW';
    validateOnly?: boolean;
  }
  
  // ============================================
  // BATCH OPERATION TYPES
  // ============================================
  
  /**
   * Request para operaciones batch
   */
  export interface BatchRequest<T> {
    operations: BatchOperation<T>[];
    validateOnly?: boolean;
    continueOnError?: boolean;
  }
  
  /**
   * Operación individual en batch
   */
  export interface BatchOperation<T> {
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    data: T;
    id?: ID;
    version?: number;  // Para updates
  }
  
  /**
   * Response de operación batch específica para entidades
   */
  export interface EntityBatchResponse<T extends BaseEntity> extends BatchOperationResponse<T> {
    createdEntities: T[];
    updatedEntities: T[];
    deletedIds: ID[];
    validationErrors: ValidationErrorResponse[];
    concurrencyErrors: ConcurrencyErrorResponse[];
  }

  // ============================================
  // ✅ NUEVO: TIPOS DE PAGINACIÓN Y OPERACIONES MASIVAS
  // (Se centralizan aquí para ser usados en toda la aplicación)
  // ============================================

  /**
   * Define la estructura del resultado de una operación masiva (bulk).
   */
  export interface BulkOperationResult {
    updated?: number; // Cuántos se actualizaron (opcional)
    deleted?: number; // Cuántos se eliminaron (opcional)
    failed: number;   // Cuántos fallaron
    errors: string[]; // Lista de mensajes de error de los que fallaron
  }
  

  // ============================================
  // STATS & ANALYTICS TYPES
  // ============================================
  
  /**
   * Métricas base para dashboards
   */
  export interface BaseMetrics {
    total: number;
    active: number;
    inactive: number;
    growth?: number;
    growthPercentage?: number;
    period: string;
  }
  
  /**
   * Métricas con comparación temporal
   */
  export interface TimeSeriesMetric {
    label: string;
    value: number;
    timestamp: Timestamp;
    change?: number;
    changePercentage?: number;
  }
  
  /**
   * Métricas agrupadas
   */
  export interface GroupedMetrics {
    groupBy: string;
    metrics: Array<{
      group: string;
      value: number;
      percentage?: number;
      count?: number;
    }>;
  }
  
  /**
   * Request para métricas
   */
  export interface MetricsRequest {
    entityType: 'CONTACT' | 'COMPANY' | 'DEAL' | 'ACTIVITY' | 'USER';
    metricType: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
    field?: string;
    groupBy?: string;
    dateFrom?: string;
    dateTo?: string;
    filters?: Record<string, any>;
    organizationId?: ID;
    churchId?: ID;
  }
  
  // ============================================
  // SEARCH & AUTOCOMPLETE TYPES
  // ============================================
  
  /**
   * Request para búsqueda de texto libre
   */
  export interface FullTextSearchRequest extends BaseRequestParams {
    query: string;
    entityTypes?: Array<'CONTACT' | 'COMPANY' | 'DEAL' | 'ACTIVITY'>;
    limit?: number;
    fuzzy?: boolean;
    highlight?: boolean;
  }
  
  /**
   * Resultado de búsqueda de texto libre
   */
  export interface SearchResult {
    entityType: string;
    entityId: ID;
    title: string;
    description?: string;
    highlights?: string[];
    score?: number;
    url?: string;
  }
  
  /**
   * Response para autocomplete
   */
  export interface AutocompleteResponse {
    suggestions: AutocompleteSuggestion[];
    hasMore: boolean;
  }
  
  /**
   * Sugerencia de autocomplete
   */
  export interface AutocompleteSuggestion {
    value: string;
    label: string;
    description?: string;
    category?: string;
    count?: number;
  }
  
  // ============================================
  // FILE UPLOAD TYPES
  // ============================================
  
  /**
   * Request para upload de archivo
   */
  export interface FileUploadRequest {
    entityType: 'CONTACT' | 'COMPANY' | 'DEAL' | 'ORGANIZATION';
    entityId: ID;
    category: 'DOCUMENT' | 'IMAGE' | 'AVATAR' | 'IMPORT' | 'EXPORT';
    description?: string;
    isPublic?: boolean;
  }
  
  /**
   * Response de pre-signed URL
   */
  export interface PreSignedUrlResponse {
    uploadUrl: string;
    fileKey: string;
    expiresAt: Timestamp;
    maxSize: number;
    allowedTypes: string[];
  }
  
  /**
   * Confirmación de upload
   */
  export interface FileUploadConfirmation {
    fileKey: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    checksum?: string;
  }
  
  // ============================================
  // WEBHOOK & INTEGRATION TYPES
  // ============================================
  
  /**
   * Configuración de webhook
   */
  export interface WebhookConfig {
    id?: ID;
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
    secret?: string;
    headers?: Record<string, string>;
    retryPolicy?: WebhookRetryPolicy;
  }
  
  /**
   * Política de reintentos para webhooks
   */
  export interface WebhookRetryPolicy {
    maxRetries: number;
    retryDelays: number[];  // En segundos
    exponentialBackoff: boolean;
  }
  
  /**
   * Payload de webhook
   */
  export interface WebhookPayload {
    eventType: string;
    entityType: string;
    entityId: ID;
    timestamp: Timestamp;
    organizationId: ID;
    churchId?: ID;
    data: any;
    metadata?: Record<string, any>;
  }
  
  // ============================================
  // INTEGRATION TYPES
  // ============================================
  
  /**
   * Configuración de integración externa
   */
  export interface IntegrationConfig {
    id?: ID;
    name: string;
    type: 'EMAIL' | 'CRM' | 'ACCOUNTING' | 'MARKETING' | 'CALENDAR' | 'STORAGE';
    provider: string;
    isActive: boolean;
    credentials: Record<string, any>;
    settings: Record<string, any>;
    lastSyncAt?: Timestamp;
    syncStatus?: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'ERROR';
    lastError?: string;
  }
  
  /**
   * Request para sincronización
   */
  export interface SyncRequest {
    integrationId: ID;
    syncType: 'FULL' | 'INCREMENTAL';
    entityTypes?: string[];
    dateFrom?: string;
    dryRun?: boolean;
  }
  
  /**
   * Response de sincronización
   */
  export interface SyncResponse {
    syncId: string;
    status: 'STARTED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    startedAt: Timestamp;
    completedAt?: Timestamp;
    processed: number;
    created: number;
    updated: number;
    errors: number;
    errorDetails?: string[];
  }
  
  // ============================================
  // CACHE TYPES
  // ============================================
  
  /**
   * Opciones de cache para requests
   */
  export interface CacheOptions {
    ttl?: number;           // TTL en milisegundos
    staleWhileRevalidate?: number;
    tags?: string[];        // Para invalidación selectiva
    key?: string;          // Cache key personalizada
    bypass?: boolean;       // Saltear cache
  }
  
  /**
   * Metadata de cache
   */
  export interface CacheMetadata {
    key: string;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    hitCount: number;
    size: number;
    tags: string[];
  }
  
  // ============================================
  // RATE LIMITING TYPES
  // ============================================
  
  /**
   * Información de rate limiting
   */
  export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;          // Unix timestamp
    retryAfter?: number;    // En segundos
  }
  
  /**
   * Headers de rate limiting
   */
  export interface RateLimitHeaders {
    'X-RateLimit-Limit': string;
    'X-RateLimit-Remaining': string;
    'X-RateLimit-Reset': string;
    'Retry-After'?: string;
  }
  
  // ============================================
  // HEALTH CHECK TYPES
  // ============================================
  
  /**
   * Response de health check
   */
  export interface HealthCheckResponse {
    status: 'UP' | 'DOWN' | 'DEGRADED';
    timestamp: Timestamp;
    version: string;
    components: Record<string, ComponentHealth>;
    duration: number;
  }
  
  /**
   * Salud de componente individual
   */
  export interface ComponentHealth {
    status: 'UP' | 'DOWN' | 'DEGRADED';
    details?: Record<string, any>;
    error?: string;
    responseTime?: number;
  }
  
  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  /**
   * Type guard para verificar si es un error de validación
   */
  export const isValidationError = (error: any): error is ValidationErrorResponse => {
    return error?.code === 'VALIDATION_ERROR' && error?.fieldErrors;
  };
  
  /**
   * Type guard para verificar si es un error de concurrencia
   */
  export const isConcurrencyError = (error: any): error is ConcurrencyErrorResponse => {
    return (
      error?.code === 'OPTIMISTIC_LOCKING_FAILURE' || 
      error?.code === 'CONCURRENT_MODIFICATION'
    ) && error?.currentVersion !== undefined;
  };
  
  /**
   * Type guard para verificar si es un error de CRM
   */
  export const isCrmError = (error: any): error is CrmErrorResponse => {
    return error?.code && typeof error.code === 'string' && error?.message;
  };
  
  /**
   * Helper para crear parámetros de búsqueda
   */
  export const createSearchParams = (
    base: Partial<SearchRequestParams> = {}
  ): SearchRequestParams => ({
    page: 0,
    size: 20,
    includeDeleted: false,
    ...base,
  });
  
  /**
   * Helper para crear configuración de cache
   */
  export const createCacheConfig = (
    ttl: number = 5 * 60 * 1000, // 5 minutos por defecto
    options: Partial<CacheOptions> = {}
  ): CacheOptions => ({
    ttl,
    ...options,
  });
  
  /**
   * Helper para extraer información de rate limiting de headers
   */
  export const extractRateLimitInfo = (headers: Record<string, string>): RateLimitInfo | null => {
    const limit = headers['X-RateLimit-Limit'];
    const remaining = headers['X-RateLimit-Remaining'];
    const reset = headers['X-RateLimit-Reset'];
    
    if (!limit || !remaining || !reset) {
      return null;
    }
    
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
      retryAfter: headers['Retry-After'] ? parseInt(headers['Retry-After'], 10) : undefined,
    };
  }; 
