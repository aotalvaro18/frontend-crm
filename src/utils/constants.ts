 // src/utils/constants.ts
// Constantes enterprise completas siguiendo tu guía arquitectónica
// Matching exacto con tu backend Spring Boot

// ============================================
// APP CONFIGURATION
// ============================================

const ALLOWED_IMAGE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

export const APP_CONFIG = {
    NAME: 'Eklesa CRM',
    VERSION: '3.0.0',
    DESCRIPTION: 'Sistema de gestión de relaciones con clientes para organizaciones religiosas',
    
    // API Configuration
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    API_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    
    // Cache Configuration
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    OFFLINE_CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
    
    // UI Configuration
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 150,
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 4000,
    
    // File Upload
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES,
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
  } as const;
  
  // ============================================
  // API ENDPOINTS (Matching your Controllers)
  // ============================================
  
  export const API_ENDPOINTS = {
    // ============================================
    // CONTACT ENDPOINTS (ContactController)
    // ============================================
    CONTACTS: '/api/crm/contacts',
    CONTACT_BY_ID: (id: number) => `/api/crm/contacts/${id}`,
    CONTACT_AUTOCOMPLETE: '/api/crm/contacts/autocomplete',
    CONTACT_CHECK_EMAIL: '/api/crm/contacts/check-email',
    CONTACT_STATS: '/api/crm/contacts/stats',
    CONTACT_EXPORT_CSV: '/api/crm/contacts/export/csv',
    CONTACT_EXPORT_EXCEL: '/api/crm/contacts/export/excel',
    CONTACT_IMPORT_TURNS: '/api/crm/contacts/import/turns-service',
    CONTACT_PORTAL_INVITATION: (id: number) => `/api/crm/contacts/${id}/generate-portal-invitation`,
    CONTACT_PORTAL_STATS: '/api/crm/contacts/digital-portal-stats',
    
    // ============================================
    // DEAL ENDPOINTS (DealController)
    // ============================================
    DEALS: '/api/crm/deals',
    DEAL_BY_ID: (id: number) => `/api/crm/deals/${id}`,
    DEAL_STATS: '/api/crm/deals/stats',
    DEAL_PIPELINE_STATS: '/api/crm/deals/pipeline-stats',
    DEAL_STAGE_MOVE: (id: number, stageId: number) => `/api/crm/deals/${id}/stage/${stageId}`,
    DEAL_PROBABILITY_UPDATE: (id: number) => `/api/crm/deals/${id}/probability`,
    DEAL_CLOSE_WON: (id: number) => `/api/crm/deals/${id}/close-won`,
    DEAL_CLOSE_LOST: (id: number) => `/api/crm/deals/${id}/close-lost`,
    DEAL_REOPEN: (id: number) => `/api/crm/deals/${id}/reopen`,
    
    // ============================================
    // PIPELINE ENDPOINTS (PipelineController)
    // ============================================
    PIPELINES: '/api/crm/pipelines',
    PIPELINE_BY_ID: (id: number) => `/api/crm/pipelines/${id}`,
    PIPELINE_STAGES: (id: number) => `/api/crm/pipelines/${id}/stages`,
    PIPELINE_STAGE_BY_ID: (pipelineId: number, stageId: number) => `/api/crm/pipelines/${pipelineId}/stages/${stageId}`,
    PIPELINE_REORDER_STAGES: (id: number) => `/api/crm/pipelines/${id}/stages/reorder`,
    PIPELINE_CLONE: (id: number) => `/api/crm/pipelines/${id}/clone`,
    PIPELINE_METRICS: (id: number) => `/api/crm/pipelines/${id}/metrics`,
    
    // ============================================
    // COMPANY ENDPOINTS (CompanyController)
    // ============================================
    COMPANIES: '/api/crm/companies',
    COMPANY_BY_ID: (id: number) => `/api/crm/companies/${id}`,
    COMPANY_CONTACTS: (id: number) => `/api/crm/companies/${id}/contacts`,
    COMPANY_DEALS: (id: number) => `/api/crm/companies/${id}/deals`,
    COMPANY_STATS: '/api/crm/companies/stats',
    COMPANY_AUTOCOMPLETE: '/api/crm/companies/autocomplete',
    
    // ============================================
    // ACTIVITY ENDPOINTS (ActivityController)
    // ============================================
    ACTIVITIES: '/api/crm/activities',
    ACTIVITY_BY_ID: (id: number) => `/api/crm/activities/${id}`,
    ACTIVITY_BY_CONTACT: (contactId: number) => `/api/crm/activities/contact/${contactId}`,
    ACTIVITY_BY_DEAL: (dealId: number) => `/api/crm/activities/deal/${dealId}`,
    ACTIVITY_UPCOMING: '/api/crm/activities/upcoming',
    ACTIVITY_OVERDUE: '/api/crm/activities/overdue',
    ACTIVITY_COMPLETE: (id: number) => `/api/crm/activities/${id}/complete`,
    
    // ============================================
    // TAG ENDPOINTS (TagController)
    // ============================================
    TAGS: '/api/crm/tags',
    TAG_BY_ID: (id: number) => `/api/crm/tags/${id}`,
    TAG_AUTOCOMPLETE: '/api/crm/tags/autocomplete',
    TAG_BULK_ASSIGN: '/api/crm/tags/bulk-assign',
    TAG_USAGE_STATS: '/api/crm/tags/usage-stats',
    
    // ============================================
    // CUSTOM FIELD ENDPOINTS
    // ============================================
    CUSTOM_FIELDS: '/api/crm/custom-fields',
    CUSTOM_FIELD_BY_ID: (id: number) => `/api/crm/custom-fields/${id}`,
    CUSTOM_FIELD_BY_ENTITY: (entityType: string) => `/api/crm/custom-fields/entity/${entityType}`,
    CUSTOM_FIELD_REORDER: '/api/crm/custom-fields/reorder',
    
    // ============================================
    // USER & AUTH ENDPOINTS
    // ============================================
    USER_PROFILE: '/api/crm/users/profile',
    USER_PREFERENCES: '/api/crm/users/preferences',
    USER_ORGANIZATION: '/api/crm/users/organization',
    USER_PERMISSIONS: '/api/crm/users/permissions',
    
    // ============================================
    // REPORT ENDPOINTS
    // ============================================
    REPORTS: '/api/crm/reports',
    REPORT_CONTACTS: '/api/crm/reports/contacts',
    REPORT_DEALS: '/api/crm/reports/deals',
    REPORT_ACTIVITIES: '/api/crm/reports/activities',
    REPORT_PIPELINE_PERFORMANCE: '/api/crm/reports/pipeline-performance',
    REPORT_ENGAGEMENT_METRICS: '/api/crm/reports/engagement-metrics',
    REPORT_CUSTOM: '/api/crm/reports/custom',
    
    // ============================================
    // SETTINGS ENDPOINTS
    // ============================================
    SETTINGS: '/api/crm/settings',
    SETTINGS_ORGANIZATION: '/api/crm/settings/organization',
    SETTINGS_INTEGRATIONS: '/api/crm/settings/integrations',
    SETTINGS_NOTIFICATIONS: '/api/crm/settings/notifications',
    SETTINGS_SECURITY: '/api/crm/settings/security',
    
    // ============================================
    // MEMBER PORTAL INTEGRATION
    // ============================================
    PORTAL_STATS: '/api/crm/portal/stats',
    PORTAL_INVITATIONS: '/api/crm/portal/invitations',
    PORTAL_ENGAGEMENT: '/api/crm/portal/engagement',
    PORTAL_SUBSCRIPTIONS: '/api/crm/portal/subscriptions',
  } as const;
  
  // ============================================
  // CONTACT ENUMS (Matching your backend)
  // ============================================
  
  export const CONTACT_STATUS = {
    // --- Estados existentes ---
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    DO_NOT_CONTACT: 'DO_NOT_CONTACT',
    DUPLICATE: 'DUPLICATE',
    ARCHIVED: 'ARCHIVED',
    // --- ✅ Nuevos estados añadidos ---
    PROSPECT: 'PROSPECT',
    LEAD: 'LEAD',
    MEMBER: 'MEMBER',
    VISITOR: 'VISITOR',
    FORMER_MEMBER: 'FORMER_MEMBER',
    DECEASED: 'DECEASED',
    MOVED: 'MOVED',
    BOUNCED: 'BOUNCED',
    BLOCKED: 'BLOCKED',
  } as const;
  
  export const CONTACT_STATUS_LABELS = {
    [CONTACT_STATUS.ACTIVE]: 'Activo',
    [CONTACT_STATUS.INACTIVE]: 'Inactivo',
    [CONTACT_STATUS.DO_NOT_CONTACT]: 'No Contactar',
    [CONTACT_STATUS.DUPLICATE]: 'Duplicado',
    [CONTACT_STATUS.ARCHIVED]: 'Archivado',
    // --- ✅ Nuevas etiquetas añadidas ---
    [CONTACT_STATUS.PROSPECT]: 'Prospecto',
    [CONTACT_STATUS.LEAD]: 'Lead',
    [CONTACT_STATUS.MEMBER]: 'Miembro',
    [CONTACT_STATUS.VISITOR]: 'Visitante',
    [CONTACT_STATUS.FORMER_MEMBER]: 'Ex-Miembro',
    [CONTACT_STATUS.DECEASED]: 'Fallecido',
    [CONTACT_STATUS.MOVED]: 'Se Mudó',
    [CONTACT_STATUS.BOUNCED]: 'Email Rebotado',
    [CONTACT_STATUS.BLOCKED]: 'Bloqueado',
  } as const;
  
  export const CONTACT_STATUS_COLORS = {
    [CONTACT_STATUS.ACTIVE]: 'bg-green-100 text-green-800 border-green-200',
    [CONTACT_STATUS.INACTIVE]: 'bg-gray-100 text-gray-800 border-gray-200',
    [CONTACT_STATUS.DO_NOT_CONTACT]: 'bg-red-100 text-red-800 border-red-200',
    [CONTACT_STATUS.DUPLICATE]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [CONTACT_STATUS.ARCHIVED]: 'bg-purple-100 text-purple-800 border-purple-200',
    // --- ✅ Nuevos colores añadidos ---
    [CONTACT_STATUS.PROSPECT]: 'bg-blue-100 text-blue-800 border-blue-200',
    [CONTACT_STATUS.LEAD]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    [CONTACT_STATUS.MEMBER]: 'bg-teal-100 text-teal-800 border-teal-200',
    [CONTACT_STATUS.VISITOR]: 'bg-orange-100 text-orange-800 border-orange-200',
    [CONTACT_STATUS.FORMER_MEMBER]: 'bg-gray-100 text-gray-800 border-gray-200',
    [CONTACT_STATUS.DECEASED]: 'bg-black text-white border-gray-600',
    [CONTACT_STATUS.MOVED]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [CONTACT_STATUS.BOUNCED]: 'bg-red-100 text-red-800 border-red-200',
    [CONTACT_STATUS.BLOCKED]: 'bg-gray-800 text-gray-300 border-gray-600',
  } as const;
  
  export const GENDER = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
    PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
  } as const;
  
  export const GENDER_LABELS = {
    [GENDER.MALE]: 'Masculino',
    [GENDER.FEMALE]: 'Femenino',
    [GENDER.OTHER]: 'Otro',
    [GENDER.PREFER_NOT_TO_SAY]: 'Prefiere no decir',
  } as const;
  
  export const CONTACT_SOURCES = {
    // Digital sources
    WEBSITE: 'WEBSITE',
    SOCIAL_MEDIA: 'SOCIAL_MEDIA',
    EMAIL_CAMPAIGN: 'EMAIL_CAMPAIGN',
    ONLINE_AD: 'ONLINE_AD',
    SEO: 'SEO',
    CONTENT_MARKETING: 'CONTENT_MARKETING',
    
    // Traditional sources
    REFERRAL: 'REFERRAL',
    COLD_CALL: 'COLD_CALL',
    COLD_EMAIL: 'COLD_EMAIL',
    NETWORKING: 'NETWORKING',
    TRADE_SHOW: 'TRADE_SHOW',
    CONFERENCE: 'CONFERENCE',
    
    // Church-specific sources
    CHURCH_SERVICE: 'CHURCH_SERVICE',
    CHURCH_EVENT: 'CHURCH_EVENT',
    SMALL_GROUP: 'SMALL_GROUP',
    VOLUNTEER: 'VOLUNTEER',
    MINISTRY: 'MINISTRY',
    PASTORAL_VISIT: 'PASTORAL_VISIT',
    
    // Internal sources
    MANUAL_ENTRY: 'MANUAL_ENTRY',
    IMPORT: 'IMPORT',
    API: 'API',
    MOBILE_APP: 'MOBILE_APP',
    
    // Other
    PARTNER: 'PARTNER',
    VENDOR: 'VENDOR',
    OTHER: 'OTHER',
  } as const;
    
  export const CONTACT_SOURCE_LABELS = {
    // Digital sources
    [CONTACT_SOURCES.WEBSITE]: 'Sitio Web',
    [CONTACT_SOURCES.SOCIAL_MEDIA]: 'Redes Sociales',
    [CONTACT_SOURCES.EMAIL_CAMPAIGN]: 'Campaña de Email',
    [CONTACT_SOURCES.ONLINE_AD]: 'Anuncio Online',
    [CONTACT_SOURCES.SEO]: 'Búsqueda Orgánica (SEO)',
    [CONTACT_SOURCES.CONTENT_MARKETING]: 'Marketing de Contenidos',
    
    // Traditional sources
    [CONTACT_SOURCES.REFERRAL]: 'Referido',
    [CONTACT_SOURCES.COLD_CALL]: 'Llamada en Frío',
    [CONTACT_SOURCES.COLD_EMAIL]: 'Email en Frío',
    [CONTACT_SOURCES.NETWORKING]: 'Networking',
    [CONTACT_SOURCES.TRADE_SHOW]: 'Feria Comercial',
    [CONTACT_SOURCES.CONFERENCE]: 'Conferencia',
    
    // Church-specific sources
    [CONTACT_SOURCES.CHURCH_SERVICE]: 'Servicio Dominical',
    [CONTACT_SOURCES.CHURCH_EVENT]: 'Evento de la Iglesia',
    [CONTACT_SOURCES.SMALL_GROUP]: 'Grupo Pequeño',
    [CONTACT_SOURCES.VOLUNTEER]: 'Voluntariado',
    [CONTACT_SOURCES.MINISTRY]: 'Ministerio',
    [CONTACT_SOURCES.PASTORAL_VISIT]: 'Visita Pastoral',
    
    // Internal sources
    [CONTACT_SOURCES.MANUAL_ENTRY]: 'Entrada Manual',
    [CONTACT_SOURCES.IMPORT]: 'Importación',
    [CONTACT_SOURCES.API]: 'API',
    [CONTACT_SOURCES.MOBILE_APP]: 'App Móvil',
    
    // Other
    [CONTACT_SOURCES.PARTNER]: 'Socio',
    [CONTACT_SOURCES.VENDOR]: 'Proveedor',
    [CONTACT_SOURCES.OTHER]: 'Otro',
  } as const;
  
  // ============================================
  // DEAL ENUMS
  // ============================================
  
  export const DEAL_STATUS = {
    OPEN: 'OPEN',
    WON: 'WON',
    LOST: 'LOST',
    CANCELLED: 'CANCELLED',
  } as const;
  
  export const DEAL_STATUS_LABELS = {
    [DEAL_STATUS.OPEN]: 'Abierta',
    [DEAL_STATUS.WON]: 'Ganada',
    [DEAL_STATUS.LOST]: 'Perdida',
    [DEAL_STATUS.CANCELLED]: 'Cancelada',
  } as const;
  
  export const DEAL_STATUS_COLORS = {
    [DEAL_STATUS.OPEN]: 'bg-blue-100 text-blue-800 border-blue-200',
    [DEAL_STATUS.WON]: 'bg-green-100 text-green-800 border-green-200',
    [DEAL_STATUS.LOST]: 'bg-red-100 text-red-800 border-red-200',
    [DEAL_STATUS.CANCELLED]: 'bg-gray-100 text-gray-800 border-gray-200',
  } as const;
  
  export const DEAL_PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
  } as const;
  
  export const DEAL_PRIORITY_LABELS = {
    [DEAL_PRIORITY.LOW]: 'Baja',
    [DEAL_PRIORITY.MEDIUM]: 'Media',
    [DEAL_PRIORITY.HIGH]: 'Alta',
    [DEAL_PRIORITY.URGENT]: 'Urgente',
  } as const;
  
  export const DEAL_PRIORITY_COLORS = {
    [DEAL_PRIORITY.LOW]: 'bg-gray-100 text-gray-800',
    [DEAL_PRIORITY.MEDIUM]: 'bg-yellow-100 text-yellow-800',
    [DEAL_PRIORITY.HIGH]: 'bg-orange-100 text-orange-800',
    [DEAL_PRIORITY.URGENT]: 'bg-red-100 text-red-800',
  } as const;
  
  // ============================================
  // ACTIVITY ENUMS
  // ============================================
  
  export const ACTIVITY_TYPE = {
    CALL: 'CALL',
    EMAIL: 'EMAIL',
    MEETING: 'MEETING',
    TASK: 'TASK',
    NOTE: 'NOTE',
    VISIT: 'VISIT',
    FOLLOW_UP: 'FOLLOW_UP',
    PRAYER: 'PRAYER',
    COUNSELING: 'COUNSELING',
    DISCIPLESHIP: 'DISCIPLESHIP',
  } as const;
  
  export const ACTIVITY_TYPE_LABELS = {
    [ACTIVITY_TYPE.CALL]: 'Llamada',
    [ACTIVITY_TYPE.EMAIL]: 'Email',
    [ACTIVITY_TYPE.MEETING]: 'Reunión',
    [ACTIVITY_TYPE.TASK]: 'Tarea',
    [ACTIVITY_TYPE.NOTE]: 'Nota',
    [ACTIVITY_TYPE.VISIT]: 'Visita',
    [ACTIVITY_TYPE.FOLLOW_UP]: 'Seguimiento',
    [ACTIVITY_TYPE.PRAYER]: 'Oración',
    [ACTIVITY_TYPE.COUNSELING]: 'Consejería',
    [ACTIVITY_TYPE.DISCIPLESHIP]: 'Discipulado',
  } as const;
  
  export const ACTIVITY_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    OVERDUE: 'OVERDUE',
  } as const;
  
  export const ACTIVITY_STATUS_LABELS = {
    [ACTIVITY_STATUS.PENDING]: 'Pendiente',
    [ACTIVITY_STATUS.IN_PROGRESS]: 'En Progreso',
    [ACTIVITY_STATUS.COMPLETED]: 'Completada',
    [ACTIVITY_STATUS.CANCELLED]: 'Cancelada',
    [ACTIVITY_STATUS.OVERDUE]: 'Vencida',
  } as const;
  
  // ============================================
// ERROR CODES (Definición ÚNICA Y COMPLETA)
// ============================================

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PHONE: 'INVALID_PHONE',
  DUPLICATE_ENTITY: 'DUPLICATE_ENTITY',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  BUSINESS_CONTEXT_ERROR: 'BUSINESS_CONTEXT_ERROR',
  CONCURRENT_MODIFICATION: 'CONCURRENT_MODIFICATION',
  OPTIMISTIC_LOCKING_FAILURE: 'OPTIMISTIC_LOCKING_FAILURE',
  ENTITY_REFERENCED: 'ENTITY_REFERENCED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  BAD_GATEWAY: 'BAD_GATEWAY',
  NOT_FOUND: 'NOT_FOUND',
  ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND',
  CONTACT_NOT_FOUND: 'CONTACT_NOT_FOUND',
  DEAL_NOT_FOUND: 'DEAL_NOT_FOUND',
  COMPANY_NOT_FOUND: 'COMPANY_NOT_FOUND',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  IMPORT_FAILED: 'IMPORT_FAILED',
  EXPORT_FAILED: 'EXPORT_FAILED',
  INVALID_CSV_FORMAT: 'INVALID_CSV_FORMAT',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ORGANIZATION_ACCESS_DENIED: 'ORGANIZATION_ACCESS_DENIED',
  CHURCH_ACCESS_DENIED: 'CHURCH_ACCESS_DENIED',
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Los datos ingresados no son válidos',
  [ERROR_CODES.DUPLICATE_ENTITY]: 'Ya existe un registro con estos datos',
  [ERROR_CODES.DUPLICATE_EMAIL]: 'Este email ya está registrado',
  [ERROR_CODES.CONCURRENT_MODIFICATION]: 'Este registro fue modificado por otro usuario',
  [ERROR_CODES.OPTIMISTIC_LOCKING_FAILURE]: 'Conflicto de versiones detectado',
  [ERROR_CODES.UNAUTHORIZED]: 'No tienes permisos para realizar esta acción',
  [ERROR_CODES.FORBIDDEN]: 'Acceso denegado',
  [ERROR_CODES.NOT_FOUND]: 'El recurso solicitado no fue encontrado',
  [ERROR_CODES.NETWORK_ERROR]: 'Error de conexión. Verifica tu internet',
  [ERROR_CODES.SERVER_ERROR]: 'Error interno del servidor',
  [ERROR_CODES.FILE_TOO_LARGE]: 'El archivo es demasiado grande',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Tipo de archivo no permitido',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'Permisos insuficientes',
} as const;
  
  // ============================================
  // UI CONSTANTS
  // ============================================
  
  export const BREAKPOINTS = {
    XS: 320,
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  } as const;
  
  export const Z_INDEX = {
    BASE: 0,
    DROPDOWN: 50,
    STICKY: 60,
    FIXED: 70,
    MODAL_BACKDROP: 80,
    MODAL: 90,
    POPOVER: 100,
    TOOLTIP: 110,
    TOAST: 120,
    LOADING_OVERLAY: 9999,
  } as const;
  
  export const ANIMATION_DURATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    EXTRA_SLOW: 750,
  } as const;
  
  export const SPACING = {
    PAGE_PADDING: 'p-4 sm:p-6 lg:p-8',
    CARD_PADDING: 'p-4 sm:p-6',
    SECTION_MARGIN: 'mb-6 sm:mb-8',
    ITEM_MARGIN: 'mb-4',
  } as const;
  
  // ============================================
  // REGEX PATTERNS
  // ============================================
  
  export const REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+?[\d\s\-\(\)]{7,15}$/,
    URL: /^https?:\/\/.+/,
    POSTAL_CODE: /^\d{5}(-\d{4})?$/,
    
    // Colombian specific
    COLOMBIA_PHONE: /^(\+57)?[3][0-9]{9}$/,
    COLOMBIA_MOBILE: /^3[0-9]{9}$/,
    COLOMBIA_ID: /^[0-9]{8,11}$/,
    COLOMBIA_NIT: /^[0-9]{9,10}-[0-9]{1}$/,
    
    // International
    INTERNATIONAL_PHONE: /^\+[1-9]\d{1,14}$/,
    
    // Text patterns
    ONLY_LETTERS: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/,
    ALPHANUMERIC: /^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s]+$/,
    NO_SPECIAL_CHARS: /^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s_-]+$/,
  } as const;
  
  // ============================================
  // LOCAL STORAGE KEYS
  // ============================================
  
  export const STORAGE_KEYS = {
    // Auth
    AUTH_TOKEN: 'eklesa_auth_token',
    REFRESH_TOKEN: 'eklesa_refresh_token',
    USER_DATA: 'eklesa_user_data',
    
    // UI State
    SIDEBAR_STATE: 'eklesa_sidebar_state',
    THEME_PREFERENCE: 'eklesa_theme',
    LANGUAGE_PREFERENCE: 'eklesa_language',
    
    // User Preferences
    USER_PREFERENCES: 'eklesa_user_preferences',
    LAST_VISITED_PAGE: 'eklesa_last_page',
    FILTER_PREFERENCES: 'eklesa_filter_prefs',
    TABLE_PREFERENCES: 'eklesa_table_prefs',
    SORT_PREFERENCES: 'eklesa_sort_prefs',
    
    // Cache
    CONTACTS_CACHE: 'eklesa_contacts_cache',
    DEALS_CACHE: 'eklesa_deals_cache',
    COMPANIES_CACHE: 'eklesa_companies_cache',
    
    // Offline
    OFFLINE_QUEUE: 'eklesa_offline_queue',
    OFFLINE_DATA: 'eklesa_offline_data',
    LAST_SYNC: 'eklesa_last_sync',
    
    // Analytics
    ANALYTICS_SESSION: 'eklesa_analytics_session',
    PAGE_VIEWS: 'eklesa_page_views',
  } as const;
  
  // ============================================
  // DATE & TIME CONSTANTS
  // ============================================
  
  export const DATE_FORMATS = {
    SHORT: 'dd/MM/yyyy',
    MEDIUM: 'dd MMM yyyy',
    LONG: 'dd MMMM yyyy',
    WITH_TIME: 'dd/MM/yyyy HH:mm',
    TIME_ONLY: 'HH:mm',
    ISO: "yyyy-MM-dd'T'HH:mm:ss",
  } as const;
  
  export const TIME_RANGES = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    THIS_WEEK: 'this_week',
    LAST_WEEK: 'last_week',
    THIS_MONTH: 'this_month',
    LAST_MONTH: 'last_month',
    THIS_QUARTER: 'this_quarter',
    LAST_QUARTER: 'last_quarter',
    THIS_YEAR: 'this_year',
    LAST_YEAR: 'last_year',
    CUSTOM: 'custom',
  } as const;
  
  // ============================================
  // NOTIFICATION TYPES
  // ============================================
  
  export const NOTIFICATION_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
  } as const;
  
  export const NOTIFICATION_POSITIONS = {
    TOP_LEFT: 'top-left',
    TOP_CENTER: 'top-center',
    TOP_RIGHT: 'top-right',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_CENTER: 'bottom-center',
    BOTTOM_RIGHT: 'bottom-right',
  } as const;
  
  // ============================================
  // PERMISSIONS & ROLES
  // ============================================
  
  export const USER_ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    USER: 'USER',
    VIEWER: 'VIEWER',
    MEMBER: 'MEMBER',
  } as const;
  
  export const PERMISSIONS = {
    // Contact permissions
    CONTACTS_READ: 'contacts:read',
    CONTACTS_WRITE: 'contacts:write',
    CONTACTS_DELETE: 'contacts:delete',
    CONTACTS_EXPORT: 'contacts:export',
    CONTACTS_IMPORT: 'contacts:import',
    
    // Deal permissions
    DEALS_READ: 'deals:read',
    DEALS_WRITE: 'deals:write',
    DEALS_DELETE: 'deals:delete',
    DEALS_MANAGE: 'deals:manage',
    
    // Company permissions
    COMPANIES_READ: 'companies:read',
    COMPANIES_WRITE: 'companies:write',
    COMPANIES_DELETE: 'companies:delete',
    
    // Report permissions
    REPORTS_READ: 'reports:read',
    REPORTS_CREATE: 'reports:create',
    REPORTS_ADVANCED: 'reports:advanced',
    
    // Admin permissions
    SETTINGS_READ: 'settings:read',
    SETTINGS_WRITE: 'settings:write',
    USERS_MANAGE: 'users:manage',
    ORGANIZATION_MANAGE: 'organization:manage',
  } as const;
  
  // ============================================
  // TYPE EXPORTS
  // ============================================
  
  export type ContactStatus = keyof typeof CONTACT_STATUS;
  export type Gender = keyof typeof GENDER;
  export type ContactSource = keyof typeof CONTACT_SOURCES;
  export type DealStatus = keyof typeof DEAL_STATUS;
  export type DealPriority = keyof typeof DEAL_PRIORITY;
  export type ActivityType = keyof typeof ACTIVITY_TYPE;
  export type ActivityStatus = keyof typeof ACTIVITY_STATUS;
  export type ErrorCode = keyof typeof ERROR_CODES;
  export type UserRole = keyof typeof USER_ROLES;
  export type Permission = keyof typeof PERMISSIONS;
  export type NotificationType = keyof typeof NOTIFICATION_TYPES;
  export type TimeRange = keyof typeof TIME_RANGES;
