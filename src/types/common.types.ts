 // src/types/common.types.ts
// ✅ Tipos base empresariales para todo el CRM
// Mobile-first, type-safe, compatible con TypeScript 5.4.5

// ============================================
// UTILITY TYPES (Type-safe según guía)
// ============================================

/**
 * Hace todas las propiedades opcionales de forma segura
 */
export type Optional<T> = {
    [K in keyof T]?: T[K];
  };
  
  /**
   * Hace propiedades específicas opcionales
   */
  export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
  
  /**
   * Hace propiedades específicas requeridas
   */
  export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
  
  /**
   * Extrae tipos de arrays de forma segura
   */
  export type ArrayElement<ArrayType extends readonly unknown[]> = 
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
  
  /**
   * Tipo para valores que pueden ser null o undefined
   */
  export type Nullable<T> = T | null | undefined;
  
  /**
   * Tipo para IDs (siguiendo backend Spring Boot)
   */
  export type ID = number;
  
  /**
   * Tipo para cognito subs (string UUID-like)
   */
  export type CognitoSub = string;
  
  /**
   * Tipo para timestamps ISO (siguiendo backend)
   */
  export type Timestamp = string;
  
  // ============================================
  // BASE ENTITY TYPES (Matching backend BaseEntity)
  // ============================================
  
  /**
   * Campos base que toda entidad del CRM tiene
   * Matching exacto con BaseEntity del backend
   */
  export interface BaseEntity {
    id: ID;
    
    // Multi-tenancy (siguiendo arquitectura backend)
    organizationId: ID;
    churchId?: ID;
    
    // Auditoría
    createdBy: CognitoSub;
    createdAt: Timestamp;
    updatedBy?: CognitoSub;
    updatedAt?: Timestamp;
    
    // Soft delete
    deleted: boolean;
    deletedAt?: Timestamp;
    deletedBy?: CognitoSub;
    
    // Optimistic locking
    version: number;
  }
  
  /**
   * Versión minimal de BaseEntity para listados
   */
  export interface BaseEntitySummary {
    id: ID;
    organizationId: ID;
    churchId?: ID;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    version: number;
  }
  
  /**
   * Para crear entidades (sin campos autogenerados)
   */
  export type CreateEntityRequest<T extends BaseEntity> = Omit<
    T, 
    'id' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt' | 'deleted' | 'deletedAt' | 'deletedBy' | 'version'
  >;
  
  /**
   * Para actualizar entidades (campos opcionales + version obligatorio)
   */
  export type UpdateEntityRequest<T extends BaseEntity> = Partial<
  Omit<T, 'id' | 'createdBy' | 'createdAt' | 'organizationId' | 'churchId'>
    > & {
        version: number; // Requerido para optimistic locking
    };
  
  // ============================================
  // PAGINATION TYPES (Matching Spring Boot PageRequest/PageResponse)
  // ============================================
  
  /**
   * Request de paginación (matching PageRequest del backend)
   */
  export interface PageRequest {
    page: number;        // 0-based (Spring Boot standard)
    size: number;        // Número de elementos por página
    sort: string[];      // Array de strings: ["field,asc", "field2,desc"]
  }
  
  /**
   * Response de paginación (matching PageResponse del backend)
   */
  export interface PageResponse<T> {
    content: T[];              // Los elementos de la página actual
    totalElements: number;     // Total de elementos en todas las páginas
    totalPages: number;        // Total de páginas
    size: number;             // Tamaño de página solicitado
    number: number;           // Número de página actual (0-based)
    numberOfElements: number;  // Elementos en esta página
    first: boolean;           // Es la primera página
    last: boolean;            // Es la última página
    empty: boolean;           // La página está vacía
  }
  
  /**
   * Información de paginación para UI (mobile-optimized)
   */
  export interface PaginationInfo {
    currentPage: number;      // 1-based para UI
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
    startItem: number;        // Número del primer elemento en la página
    endItem: number;          // Número del último elemento en la página
  }
  
  // ============================================
  // SEARCH & FILTER TYPES
  // ============================================
  
  /**
   * Criterios base de búsqueda
   */
  export interface BaseSearchCriteria {
    search?: string;                    // Búsqueda de texto libre
    page?: number;                      // Página (0-based)
    size?: number;                      // Tamaño de página
    sort?: string[];                    // Ordenamiento
    organizationId?: ID;                // Filtro por organización
    churchId?: ID;                      // Filtro por iglesia
    includeDeleted?: boolean;           // Incluir elementos eliminados
    dateFrom?: string;                  // Fecha desde (ISO)
    dateTo?: string;                    // Fecha hasta (ISO)
  }
  
  /**
   * Operadores de filtro para búsquedas avanzadas
   */
  export type FilterOperator = 
    | 'equals' 
    | 'contains' 
    | 'startsWith' 
    | 'endsWith' 
    | 'greaterThan' 
    | 'lessThan' 
    | 'greaterThanOrEqual' 
    | 'lessThanOrEqual' 
    | 'between' 
    | 'in' 
    | 'notIn' 
    | 'isNull' 
    | 'isNotNull';
  
  /**
   * Filtro individual
   */
  export interface Filter {
    field: string;
    operator: FilterOperator;
    value: any;
    values?: any[];        // Para operadores 'in', 'notIn', 'between'
  }
  
  /**
   * Grupo de filtros con lógica
   */
  export interface FilterGroup {
    logic: 'AND' | 'OR';
    filters: Filter[];
    groups?: FilterGroup[];  // Filtros anidados
  }
  
  /**
   * Configuración de ordenamiento
   */
  export interface SortConfig {
    field: string;
    direction: 'ASC' | 'DESC';
    nullsFirst?: boolean;
  }
  
  // ============================================
  // API RESPONSE TYPES
  // ============================================
  
  /**
   * Response genérico para APIs
   */
  export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    timestamp: Timestamp;
    success: boolean;
  }
  
  /**
   * Response de error de API (matching backend GlobalExceptionHandler)
   */
  export interface ApiErrorResponse {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: Timestamp;
    path: string;
    status: number;
    
    // Para errores de validación
    fieldErrors?: Record<string, string[]>;
    
    // Para errores de concurrencia optimista
    currentVersion?: number;
    attemptedVersion?: number;
  }
  
  /**
   * Response de operaciones batch
   */
  export interface BatchOperationResponse<T = any> {
    successful: T[];
    failed: BatchError[];
    totalProcessed: number;
    successCount: number;
    errorCount: number;
  }
  
  /**
   * Error individual en operación batch
   */
  export interface BatchError {
    item: any;
    error: string;
    code?: string;
  }
  
  // ============================================
  // FILE & UPLOAD TYPES
  // ============================================
  
  /**
   * Información de archivo
   */
  export interface FileInfo {
    id?: ID;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    url?: string;
    uploadedAt: Timestamp;
    uploadedBy: CognitoSub;
  }
  
  /**
   * Request para upload de archivo
   */
  export interface FileUploadRequest {
    file: File;
    category?: string;
    description?: string;
    isPublic?: boolean;
  }
  
  /**
   * Response de upload
   */
  export interface FileUploadResponse {
    fileInfo: FileInfo;
    uploadUrl?: string;  // Pre-signed URL si es necesario
  }
  
  // ============================================
  // ADDRESS TYPES (Matching AddressDTO del backend)
  // ============================================
  
  /**
   * Dirección (matching AddressDTO)
   */
  export interface Address {
    street?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }
  
  /**
   * Dirección completa con geocoding
   */
  export interface AddressWithGeo extends Address {
    latitude?: number;
    longitude?: number;
    timezone?: string;
    formattedAddress?: string;
  }
  
  // ============================================
  // CONTACT INFORMATION TYPES
  // ============================================
  
  /**
   * Tipos de comunicación
   */
  export type CommunicationType = 'EMAIL' | 'PHONE' | 'SMS' | 'WHATSAPP' | 'SOCIAL';
  
  /**
   * Información de contacto individual
   */
  export interface ContactInfo {
    type: CommunicationType;
    value: string;
    label?: string;
    isPrimary?: boolean;
    isVerified?: boolean;
  }
  
  /**
   * Preferencias de comunicación
   */
  export interface CommunicationPreferences {
    allowEmail: boolean;
    allowSms: boolean;
    allowPhone: boolean;
    allowWhatsapp: boolean;
    preferredTime?: 'MORNING' | 'AFTERNOON' | 'EVENING';
    timezone?: string;
    language?: string;
  }
  
  // ============================================
  // CUSTOM FIELDS TYPES
  // ============================================
  
  /**
   * Tipos de campos personalizados
   */
  export type CustomFieldType = 
    | 'TEXT' 
    | 'NUMBER' 
    | 'DATE' 
    | 'BOOLEAN' 
    | 'SELECT' 
    | 'MULTISELECT' 
    | 'EMAIL' 
    | 'PHONE' 
    | 'URL' 
    | 'TEXTAREA';
  
  /**
   * Definición de campo personalizado
   */
  export interface CustomFieldDefinition {
    id: ID;
    fieldKey: string;
    fieldName: string;
    fieldType: CustomFieldType;
    entityType: 'CONTACT' | 'COMPANY' | 'DEAL';
    isRequired: boolean;
    defaultValue?: any;
    options?: string[];          // Para SELECT/MULTISELECT
    validationRules?: Record<string, any>;
    displayOrder: number;
    isActive: boolean;
  }
  
  /**
   * Valor de campo personalizado
   */
  export interface CustomFieldValue {
    fieldKey: string;
    value: any;
  }
  
  /**
   * Colección de campos personalizados
   */
  export type CustomFields = Record<string, any>;
  
  // ============================================
  // TAG TYPES
  // ============================================
  
  /**
 * Tag/Etiqueta
 * ✅ CORRECCIÓN: Ahora extiende BaseEntity para ser una entidad completa del sistema.
 */
  export interface Tag extends BaseEntity { // <-- LA MODIFICACIÓN CLAVE
    name: string;
    color?: string;
    description?: string;
    category?: string;
    usage_count?: number;
  }
  
  /**
   * Request para crear tag
   */
  export type CreateTagRequest = CreateEntityRequest<Tag>;
  
  // ============================================
  // AUDIT & ACTIVITY TYPES
  // ============================================
  
  /**
   * Tipos de actividad de auditoría
   */
  export type AuditAction = 
    | 'CREATE' 
    | 'UPDATE' 
    | 'DELETE' 
    | 'VIEW' 
    | 'EXPORT' 
    | 'IMPORT' 
    | 'LOGIN' 
    | 'LOGOUT';
  
  /**
   * Log de auditoría
   */
  export interface AuditLog {
    id: ID;
    action: AuditAction;
    entityType: string;
    entityId?: ID;
    userId: CognitoSub;
    userName?: string;
    timestamp: Timestamp;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    changes?: Record<string, { old: any; new: any }>;
  }
  
  // ============================================
  // NOTIFICATION TYPES
  // ============================================
  
  /**
   * Tipos de notificación
   */
  export type NotificationType = 
    | 'INFO' 
    | 'SUCCESS' 
    | 'WARNING' 
    | 'ERROR' 
    | 'REMINDER';
  
  /**
   * Canales de notificación
   */
  export type NotificationChannel = 
    | 'IN_APP' 
    | 'EMAIL' 
    | 'SMS' 
    | 'PUSH';
  
  /**
   * Notificación
   */
  export interface Notification {
    id: ID;
    type: NotificationType;
    title: string;
    message: string;
    channel: NotificationChannel;
    recipientId: CognitoSub;
    isRead: boolean;
    readAt?: Timestamp;
    data?: Record<string, any>;
    expiresAt?: Timestamp;
    createdAt: Timestamp;
  }
  
  // ============================================
  // UI STATE TYPES
  // ============================================
  
  /**
   * Estados de loading
   */
  export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
  
  /**
   * Tamaños de componentes (mobile-first)
   */
  export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Variantes de color
   */
  export type ColorVariant = 
    | 'primary' 
    | 'secondary' 
    | 'success' 
    | 'warning' 
    | 'error' 
    | 'info' 
    | 'neutral';
  
  /**
   * Posiciones para tooltips, dropdowns, etc.
   */
  export type Position = 
    | 'top' 
    | 'bottom' 
    | 'left' 
    | 'right' 
    | 'top-start' 
    | 'top-end' 
    | 'bottom-start' 
    | 'bottom-end';
  
  /**
   * Estado de componente de tabla
   */
  export interface TableState {
    loading: boolean;
    error?: string;
    selectedRows: ID[];
    sortColumn?: string;
    sortDirection?: 'ASC' | 'DESC';
    page: number;
    pageSize: number;
    totalItems: number;
  }
  
  /**
   * Estado de formulario
   */
  export interface FormState {
    isDirty: boolean;
    isSubmitting: boolean;
    isValid: boolean;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
  }
  
  // ============================================
  // MOBILE & RESPONSIVE TYPES
  // ============================================
  
  /**
   * Breakpoints responsive (matching Tailwind)
   */
  export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  
  /**
   * Información de dispositivo
   */
  export interface DeviceInfo {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    screenWidth: number;
    screenHeight: number;
    currentBreakpoint: Breakpoint;
  }
  
  /**
   * Configuración responsive para componentes
   */
  export interface ResponsiveConfig<T> {
    base: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
  }
  
  // ============================================
  // ERROR TYPES
  // ============================================
  
  /**
   * Tipos de error personalizados
   */
  export class ValidationError extends Error {
    constructor(
      message: string,
      public field: string,
      public code?: string
    ) {
      super(message);
      this.name = 'ValidationError';
    }
  }
  
  export class BusinessError extends Error {
    constructor(
      message: string,
      public code: string,
      public details?: Record<string, any>
    ) {
      super(message);
      this.name = 'BusinessError';
    }
  }
  
  export class NetworkError extends Error {
    constructor(
      message: string,
      public status?: number,
      public statusText?: string
    ) {
      super(message);
      this.name = 'NetworkError';
    }
  }
  
  // ============================================
  // EXPORT HELPERS
  // ============================================
  
  /**
   * Helper para crear PageRequest con defaults
   */
  export const createPageRequest = (
    page: number = 0,
    size: number = 20,
    sort: string[] = []
  ): PageRequest => ({
    page,
    size,
    sort,
  });
  
  /**
   * Helper para crear filtro básico
   */
  export const createFilter = (
    field: string,
    operator: FilterOperator,
    value: any
  ): Filter => ({
    field,
    operator,
    value,
  });
  
  /**
   * Helper para crear BaseSearchCriteria
   */
  export const createSearchCriteria = (
    overrides: Partial<BaseSearchCriteria> = {}
  ): BaseSearchCriteria => ({
    page: 0,
    size: 20,
    ...overrides,
  });
  
  /**
   * Helper para extraer información de paginación para UI
   */
  export const extractPaginationInfo = (pageResponse: PageResponse<any>): PaginationInfo => ({
    currentPage: pageResponse.number + 1, // Convert to 1-based
    totalPages: pageResponse.totalPages,
    totalItems: pageResponse.totalElements,
    itemsPerPage: pageResponse.size,
    hasNext: !pageResponse.last,
    hasPrevious: !pageResponse.first,
    startItem: pageResponse.number * pageResponse.size + 1,
    endItem: pageResponse.number * pageResponse.size + pageResponse.numberOfElements,
  });
