// src/types/contact.types.ts
// ✅ Tipos específicos para el dominio de Contactos del CRM
// Matching exacto con ContactDTO y ContactController del backend

import {
  BaseEntity,
  BaseSearchCriteria,
  ID,
  CognitoSub,
  Timestamp,
  CustomFields,
  Tag,
  Address,
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

// ============================================
// CONTACT CORE TYPES (Matching ContactDTO)
// ============================================

/**
 * Entidad Contact completa (matching ContactDTO del backend)
 */
export interface Contact extends BaseEntity {
  // Información personal básica
  firstName: string;
  lastName: string;
  fullName?: string;              // Computed field
  displayName?: string;           // Nombre preferido para mostrar
  email?: string;
  alternateEmail?: string;
  phone?: string;
  alternatePhone?: string;
  
  // Identidad digital
  cognitoSub?: CognitoSub;        // Si tiene acceso al sistema
  hasSystemAccess?: boolean;      // Computed field
  
  // Información demográfica
  birthDate?: string;             // ISO date string
  age?: number;                   // Computed field
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  
  // Dirección (embedded AddressDTO)
  address?: Address;
  
  // Información profesional
  jobTitle?: string;
  companyName?: string;
  companyId?: ID;                 // FK to Company
  department?: string;
  workPhone?: string;
  workEmail?: string;
  
  // Source y origen
  source: ContactSource;
  sourceDetails?: string;
  referredBy?: string;
  referredByContactId?: ID;       // FK to Contact
  
  // Ownership y asignación
  ownerCognitoSub: CognitoSub;    // Owner del contacto
  ownerName?: string;             // Computed field
  assignedToSub?: CognitoSub;     // Assigned user (puede ser diferente al owner)
  assignedToName?: string;        // Computed field
  assignedAt?: Timestamp;
  
  // Estado y engagement
  status: ContactStatus;
  lifecycleStage?: LifecycleStage;
  engagementScore: number;        // 0-100
  previousEngagementScore?: number;
  engagementLevel?: EngagementLevel;  // Computed field
  
  // Actividad y comunicación
  lastActivityAt?: Timestamp;
  lastContactedAt?: Timestamp;
  lastEmailedAt?: Timestamp;
  lastCalledAt?: Timestamp;
  nextFollowUpAt?: Timestamp;
  communicationCount?: number;    // Computed field
  
  // Tags y categorización
  tags: Tag[];
  categories?: string[];
  interests?: string[];
  
  // Custom fields
  customFields: CustomFields;
  
  // Preferencias de comunicación
  communicationPreferences: CommunicationPreferences;
  
  // 🆕 Member Portal Integration (matching guía arquitectónica)
  hasDigitalPortal: boolean;
  digitalPortalStatus?: DigitalPortalStatus;
  digitalEngagementScore?: number;  // 0-100
  lastPortalActivity?: Timestamp;
  portalInvitationSent?: Timestamp;
  portalInvitationAccepted?: Timestamp;
  portalFeatures?: DigitalPortalFeature[];
  
  // Métricas y KPIs
  dealCount?: number;             // Computed field
  totalDealValue?: number;        // Computed field
  wonDealCount?: number;          // Computed field
  wonDealValue?: number;          // Computed field
  avgDealSize?: number;           // Computed field
  salesCycleLength?: number;      // Days, computed field
  
  // Social media
  socialProfiles?: SocialProfile[];
  linkedInUrl?: string;
  twitterHandle?: string;
  facebookUrl?: string;
  instagramHandle?: string;
  
  // Información adicional
  notes?: string;
  description?: string;
  keywords?: string[];
  priority?: ContactPriority;
  
  // Compliance y privacidad
  gdprConsent?: boolean;
  gdprConsentDate?: Timestamp;
  marketingConsent?: boolean;
  marketingConsentDate?: Timestamp;
  doNotContact?: boolean;
  doNotContactReason?: string;
  
  // Relaciones
  parentContactId?: ID;           // Para contactos relacionados
  childContacts?: Contact[];      // Computed field
  relatedContacts?: ContactRelation[];
  
  // Files y attachments
  profilePicture?: string;        // URL o S3 key
  attachments?: ContactAttachment[];
}

// Stats interface unificada - combina todos los campos necesarios
export interface ContactStats {
  // Campos básicos (del backend)
  total: number;
  active: number;
  inactive: number;
  withPortal: number;
  adoptionRate: number;
  
  // Campos adicionales para UI (opcionales para retrocompatibilidad)
  totalContacts?: number;
  contactsWithPortal?: number;
  contactsWithoutPortal?: number;
  averageEngagementScore?: number;
  newContactsThisMonth?: number;
}


// ============================================
// ALIAS TYPES (Para compatibilidad con componentes)
// ============================================

/**
 * Alias para mantener compatibilidad con componentes existentes
 */
export type ContactDTO = Contact;
export type AddressDTO = Address;
export type TagDTO = Tag;

// ============================================
// ENUMS Y TIPOS ESPECÍFICOS
// ============================================

/**
 * Género (matching backend enum)
 */
export type Gender = 
  | 'MALE' 
  | 'FEMALE' 
  | 'OTHER' 
  | 'PREFER_NOT_TO_SAY';

/**
 * Estado civil
 */
export type MaritalStatus = 
  | 'SINGLE' 
  | 'MARRIED' 
  | 'DIVORCED' 
  | 'WIDOWED' 
  | 'SEPARATED' 
  | 'DOMESTIC_PARTNERSHIP' 
  | 'PREFER_NOT_TO_SAY';

/**
 * Fuentes de contacto (matching backend enum)
 */
export type ContactSource = 
  // Digital sources
  | 'WEBSITE'
  | 'SOCIAL_MEDIA'
  | 'EMAIL_CAMPAIGN'
  | 'ONLINE_AD'
  | 'SEO'
  | 'CONTENT_MARKETING'
  
  // Traditional sources
  | 'REFERRAL'
  | 'COLD_CALL'
  | 'COLD_EMAIL'
  | 'NETWORKING'
  | 'TRADE_SHOW'
  | 'CONFERENCE'
  
  // Church-specific sources
  | 'CHURCH_SERVICE'
  | 'CHURCH_EVENT'
  | 'SMALL_GROUP'
  | 'VOLUNTEER'
  | 'MINISTRY'
  | 'PASTORAL_VISIT'
  
  // Internal sources
  | 'MANUAL_ENTRY'
  | 'IMPORT'
  | 'API'
  | 'MOBILE_APP'
  
  // Other
  | 'PARTNER'
  | 'VENDOR'
  | 'OTHER';

/**
 * Estados de contacto (matching backend enum)
 */
export type ContactStatus = 
  | 'ACTIVE'           // Activo y participando
  | 'INACTIVE'         // No activo pero no perdido
  | 'PROSPECT'         // Prospecto potencial
  | 'LEAD'             // Lead cualificado
  | 'MEMBER'           // Miembro activo
  | 'VISITOR'          // Visitante
  | 'FORMER_MEMBER'    // Ex-miembro
  | 'DECEASED'         // Fallecido
  | 'MOVED'            // Se mudó
  | 'DO_NOT_CONTACT'   // No contactar
  | 'BOUNCED'          // Email/Phone bounced
  | 'BLOCKED';         // Bloqueado

/**
 * Etapas del ciclo de vida
 */
export type LifecycleStage = 
  | 'SUBSCRIBER'       // Suscrito a newsletter
  | 'LEAD'             // Lead inicial
  | 'MARKETING_QUALIFIED_LEAD'  // MQL
  | 'SALES_QUALIFIED_LEAD'      // SQL
  | 'OPPORTUNITY'      // Oportunidad activa
  | 'CUSTOMER'         // Cliente/miembro
  | 'EVANGELIST'       // Promotor/evangelista
  | 'OTHER';

/**
 * Niveles de engagement
 */
export type EngagementLevel = 
  | 'VERY_HIGH'        // 80-100
  | 'HIGH'             // 60-79
  | 'MEDIUM'           // 40-59
  | 'LOW'              // 20-39
  | 'VERY_LOW';        // 0-19

/**
 * Prioridades de contacto
 */
export type ContactPriority = 
  | 'URGENT' 
  | 'HIGH' 
  | 'MEDIUM' 
  | 'LOW';

/**
 * Estados del portal digital
 */
export type DigitalPortalStatus = 
  | 'NOT_INVITED'      // No invitado
  | 'INVITATION_SENT'  // Invitación enviada
  | 'REGISTERED'       // Registrado pero no activo
  | 'ACTIVE'           // Usuario activo del portal
  | 'INACTIVE'         // Inactivo en el portal
  | 'BLOCKED';         // Bloqueado del portal

/**
 * Features disponibles en el portal digital
 */
export type DigitalPortalFeature = 
  | 'DONATIONS'        // Donaciones online
  | 'EVENT_REGISTRATION'  // Registro a eventos
  | 'SMALL_GROUPS'     // Grupos pequeños
  | 'VOLUNTEER_SIGNUP' // Registro de voluntariado
  | 'PRAYER_REQUESTS'  // Solicitudes de oración
  | 'DIRECTORY'        // Directorio de miembros
  | 'GIVING_HISTORY'   // Historial de donaciones
  | 'SERMON_NOTES'     // Notas de sermones
  | 'RESOURCES';       // Recursos digitales

// ============================================
// TIPOS RELACIONADOS
// ============================================

/**
 * Perfil de red social
 */
export interface SocialProfile {
  platform: 'FACEBOOK' | 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN' | 'YOUTUBE' | 'TIKTOK' | 'OTHER';
  handle: string;
  url: string;
  followerCount?: number;
  isVerified?: boolean;
  lastUpdated?: Timestamp;
}

/**
 * Preferencias de comunicación
 */
export interface CommunicationPreferences {
  allowEmail: boolean;
  allowSms: boolean;
  allowPhone: boolean;
  allowWhatsapp: boolean;
  allowPostalMail: boolean;
  preferredContactMethod: 'EMAIL' | 'PHONE' | 'SMS' | 'WHATSAPP' | 'POSTAL';
  preferredTime: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME';
  timezone?: string;
  language: string;
  unsubscribeDate?: Timestamp;
  unsubscribeReason?: string;
}

/**
 * Relación entre contactos
 */
export interface ContactRelation {
  id: ID;
  contactId: ID;
  relatedContactId: ID;
  relatedContactName: string;
  relationType: ContactRelationType;
  relationship: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

/**
 * Tipos de relación entre contactos
 */
export type ContactRelationType = 
  | 'FAMILY'           // Familiar
  | 'SPOUSE'           // Cónyuge
  | 'CHILD'            // Hijo/a
  | 'PARENT'           // Padre/madre
  | 'SIBLING'          // Hermano/a
  | 'COLLEAGUE'        // Colega
  | 'FRIEND'           // Amigo/a
  | 'NEIGHBOR'         // Vecino/a
  | 'BUSINESS_PARTNER' // Socio de negocio
  | 'REFERRER'         // Quien refirió
  | 'REFERRED'         // Quien fue referido
  | 'OTHER';

/**
 * Archivo adjunto de contacto
 */
export interface ContactAttachment {
  id: ID;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: 'DOCUMENT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'OTHER';
  url: string;
  uploadedBy: CognitoSub;
  uploadedAt: Timestamp;
  description?: string;
  isPublic: boolean;
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

/**
 * Criterios de búsqueda específicos para contactos
 */
export interface ContactSearchCriteria extends BaseSearchCriteria {
  // Texto libre
  search?: string;                    // Búsqueda en nombre, email, phone
  
  // Filters básicos
  status?: ContactStatus;
  source?: ContactSource;
  gender?: Gender;
  lifecycleStage?: LifecycleStage;
  priority?: ContactPriority;
  
  // Ownership y asignación
  ownerCognitoSub?: CognitoSub;
  assignedToSub?: CognitoSub;
  onlyOwned?: boolean;               // Solo contactos que soy dueño
  onlyAssigned?: boolean;            // Solo contactos asignados a mí
  onlySystemUsers?: boolean;         // Solo contactos con cognitoSub
  
  // Fechas
  createdFrom?: string;
  createdTo?: string;
  lastActivityFrom?: string;
  lastActivityTo?: string;
  birthDateFrom?: string;
  birthDateTo?: string;
  
  // Engagement
  minEngagementScore?: number;
  maxEngagementScore?: number;
  engagementLevel?: EngagementLevel;
  hasRecentActivity?: boolean;       // Actividad en últimos 30 días
  
  // Portal digital
  hasDigitalPortal?: boolean;
  digitalPortalStatus?: DigitalPortalStatus;
  portalFeatures?: DigitalPortalFeature[];
  
  // Ubicación
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  
  // Relaciones
  companyId?: ID;
  hasCompany?: boolean;
  parentContactId?: ID;
  hasChildren?: boolean;
  
  // Tags y categorías
  tags?: string[];                   // IDs o nombres de tags
  categories?: string[];
  interests?: string[];
  
  // Custom fields
  customFields?: Record<string, any>;
  
  // Comunicación
  allowsEmail?: boolean;
  allowsSms?: boolean;
  allowsPhone?: boolean;
  preferredContactMethod?: string;
  
  // Compliance
  hasGdprConsent?: boolean;
  hasMarketingConsent?: boolean;
  doNotContact?: boolean;
  
  // Métricas
  minDealCount?: number;
  maxDealCount?: number;
  minDealValue?: number;
  maxDealValue?: number;
  hasDeal?: boolean;
  hasWonDeal?: boolean;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

/**
 * Request para crear contacto.
 * Hacemos TODAS las propiedades de Contact opcionales,
 * pero luego hacemos REQUERIDAS las que vienen del formulario.
 */
export type CreateContactRequest = Partial<Omit<Contact, 'tags' | keyof BaseEntity>> & {
  // Campos requeridos por el formulario de creación
  firstName: string;
  lastName: string;
  source: ContactSource;
  // Campos opcionales del formulario
  tags?: number[];
  email?: string;
  phone?: string;
  // ... puedes añadir otros campos opcionales del formulario aquí
};

/**
 * Request para actualizar contacto.
 * Similar a crear, pero requiere obligatoriamente 'version'.
 */
export type UpdateContactRequest = Partial<Omit<Contact, 'tags' | keyof BaseEntity>> & {
  version: number; // Requerido para optimistic locking
  // Campos opcionales del formulario
  tags?: number[];
  firstName?: string;
  lastName?: string;
  // ... puedes añadir otros campos opcionales del formulario aquí
};

/**
 * Response de contacto individual
 */
export type ContactResponse = EntityResponse<Contact>;

/**
 * Response de contactos paginados
 */
export type ContactPageResponse = PagedResponse<Contact>;

/**
 * Response de lista de contactos
 */
export type ContactListResponse = ListResponse<Contact>;

/**
 * Request para búsqueda de contactos
 */
export interface ContactSearchRequest extends SearchRequestParams {
  criteria: ContactSearchCriteria;
}

/**
 * Request para operaciones batch de contactos
 */
export type ContactBatchRequest = BatchRequest<Contact>;

/**
 * Response de operaciones batch de contactos
 */
export type ContactBatchResponse = EntityBatchResponse<Contact>;

// ============================================
// SPECIALIZED REQUESTS
// ============================================

/**
 * Request para asignar contacto
 */
export interface AssignContactRequest {
  contactId: ID;
  assignToSub: CognitoSub;
  notes?: string;
}

/**
 * Request para transferir ownership
 */
export interface TransferOwnershipRequest {
  contactIds: ID[];
  newOwnerSub: CognitoSub;
  transferReason?: string;
  notifyNewOwner?: boolean;
}

/**
 * Request para merge de contactos
 */
export interface MergeContactsRequest {
  primaryContactId: ID;
  duplicateContactIds: ID[];
  mergeStrategy: MergeStrategy;
  fieldMappings?: Record<string, 'PRIMARY' | 'DUPLICATE' | 'COMBINE'>;
}

/**
 * Estrategias de merge
 */
export type MergeStrategy = 
  | 'KEEP_PRIMARY'     // Mantener datos del contacto primario
  | 'MERGE_ALL'        // Combinar todos los datos
  | 'MANUAL_MAPPING';  // Mapeo manual de campos

/**
 * Request para generar invitación de portal
 */
export interface GeneratePortalInvitationRequest {
  contactId: ID;
  features: DigitalPortalFeature[];
  customMessage?: string;
  expiresIn?: number;  // Días
}

/**
 * Response de invitación de portal
 */
export interface PortalInvitationResponse {
  invitationToken: string;
  invitationUrl: string;
  expiresAt: Timestamp;
  features: DigitalPortalFeature[];
}

/**
 * Request para import de contactos
 */
export interface ContactImportRequest {
  file: File;
  mappings: Record<string, string>;  // CSV column -> Contact field
  duplicateStrategy: 'SKIP' | 'UPDATE' | 'CREATE_NEW';
  defaultValues?: Partial<Contact>;
  validateOnly?: boolean;
}

/**
 * Response de import de contactos
 */
export interface ContactImportResponse {
  jobId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  duplicatesFound: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  downloadUrl?: string;  // Para reporte de errores
}

/**
 * Error de import
 */
export interface ImportError {
  row: number;
  field?: string;
  error: string;
  value?: string;
}

/**
 * Warning de import
 */
export interface ImportWarning {
  row: number;
  field?: string;
  warning: string;
  value?: string;
  suggestion?: string;
}

// ============================================
// METRICS & ANALYTICS TYPES
// ============================================

/**
 * Métricas de contactos
 */
export interface ContactMetrics extends BaseMetrics {
  byStatus: GroupedMetrics;
  bySource: GroupedMetrics;
  byEngagementLevel: GroupedMetrics;
  byLifecycleStage: GroupedMetrics;
  byOwner: GroupedMetrics;
  recentlyAdded: number;
  recentlyUpdated: number;
  highEngagement: number;
  needsFollowUp: number;
  digitalPortalAdoption: number;
}

/**
 * Request para métricas de contactos
 */
export interface ContactMetricsRequest extends MetricsRequest {
  entityType: 'CONTACT';
  includePortalStats?: boolean;
  includeEngagementBreakdown?: boolean;
  includeSourceAnalysis?: boolean;
}

/**
 * Estadísticas de adopción del portal digital
 */
export interface DigitalPortalStats {
  totalContacts: number;
  contactsWithPortal: number;
  adoptionRate: number;
  contactsWithoutPortal: number;
  byStatus: Record<DigitalPortalStatus, number>;
  byFeature: Record<DigitalPortalFeature, number>;
  engagementByPortalStatus: Record<DigitalPortalStatus, number>;
  conversionFunnel: {
    invited: number;
    registered: number;
    active: number;
    engaged: number;
  };
}

// ============================================
// VALIDATION TYPES
// ============================================

/**
 * Reglas de validación para contactos
 */
export interface ContactValidationRules {
  requireEmail: boolean;
  requirePhone: boolean;
  allowDuplicateEmails: boolean;
  allowDuplicatePhones: boolean;
  emailDomainWhitelist?: string[];
  emailDomainBlacklist?: string[];
  phoneFormat?: 'INTERNATIONAL' | 'NATIONAL' | 'LOCAL';
  requiredFields: string[];
  customFieldRules?: Record<string, any>;
}

/**
 * Resultado de validación
 */
export interface ContactValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

/**
 * Error de validación
 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

/**
 * Warning de validación
 */
export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  value?: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Sugerencia de validación
 */
export interface ValidationSuggestion {
  field: string;
  suggestion: string;
  confidence: number;  // 0-1
  action: 'AUTO_FIX' | 'MANUAL_REVIEW' | 'IGNORE';
}

// ============================================
// UI CONSTANTS & LABELS (Para componentes)
// ============================================

/**
 * Labels para estados de contacto
 */
export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  PROSPECT: 'Prospecto',
  LEAD: 'Lead',
  MEMBER: 'Miembro',
  VISITOR: 'Visitante',
  FORMER_MEMBER: 'Ex-miembro',
  DECEASED: 'Fallecido',
  MOVED: 'Se mudó',
  DO_NOT_CONTACT: 'No Contactar',
  BOUNCED: 'Rebotado',
  BLOCKED: 'Bloqueado'
};

/**
 * Labels para géneros
 */
export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  OTHER: 'Otro',
  PREFER_NOT_TO_SAY: 'Prefiero no decir'
};

/**
 * Labels para fuentes de contacto
 */
export const CONTACT_SOURCE_LABELS: Record<ContactSource, string> = {
  WEBSITE: 'Sitio Web',
  SOCIAL_MEDIA: 'Redes Sociales',
  EMAIL_CAMPAIGN: 'Campaña Email',
  ONLINE_AD: 'Publicidad Online',
  SEO: 'SEO',
  CONTENT_MARKETING: 'Marketing de Contenido',
  REFERRAL: 'Referido',
  COLD_CALL: 'Llamada en Frío',
  COLD_EMAIL: 'Email en Frío',
  NETWORKING: 'Networking',
  TRADE_SHOW: 'Feria Comercial',
  CONFERENCE: 'Conferencia',
  CHURCH_SERVICE: 'Servicio Religioso',
  CHURCH_EVENT: 'Evento de Iglesia',
  SMALL_GROUP: 'Grupo Pequeño',
  VOLUNTEER: 'Voluntariado',
  MINISTRY: 'Ministerio',
  PASTORAL_VISIT: 'Visita Pastoral',
  MANUAL_ENTRY: 'Entrada Manual',
  IMPORT: 'Importación',
  API: 'API',
  MOBILE_APP: 'App Móvil',
  PARTNER: 'Socio',
  VENDOR: 'Proveedor',
  OTHER: 'Otro'
};

/**
 * Valores por defecto
 */
export const DEFAULT_CONTACT_STATUS: ContactStatus = 'ACTIVE';
export const DEFAULT_ENGAGEMENT_SCORE = 0;
export const DEFAULT_PAGE_SIZE = 25;

// ============================================
// TYPE GUARDS & HELPERS
// ============================================

/**
 * Type guard para verificar si es un contacto válido
 */
export const isValidContact = (obj: any): obj is Contact => {
  return obj && 
         typeof obj.id === 'number' &&
         typeof obj.firstName === 'string' &&
         typeof obj.lastName === 'string' &&
         typeof obj.status === 'string' &&
         typeof obj.source === 'string';
};

/**
 * Helper para calcular el nivel de engagement
 */
export const calculateEngagementLevel = (score: number): EngagementLevel => {
  if (score >= 80) return 'VERY_HIGH';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  if (score >= 20) return 'LOW';
  return 'VERY_LOW';
};

/**
 * Helper para verificar si un contacto tiene acceso al portal
 */
export const hasPortalAccess = (contact: Contact): boolean => {
  return contact.hasDigitalPortal && 
         contact.digitalPortalStatus === 'ACTIVE';
};

/**
 * Helper para obtener el nombre completo
 */
export const getFullName = (contact: Contact): string => {
  return contact.fullName || `${contact.firstName} ${contact.lastName}`.trim();
};

/**
 * Helper para verificar si un contacto necesita seguimiento
 */
export const needsFollowUp = (contact: Contact): boolean => {
  if (!contact.nextFollowUpAt) return false;
  return new Date(contact.nextFollowUpAt) <= new Date();
};

/**
 * Helper para verificar si un contacto está activo
 */
export const isActiveContact = (contact: Contact): boolean => {
  return contact.status === 'ACTIVE' || 
         contact.status === 'MEMBER' || 
         contact.status === 'PROSPECT' ||
         contact.status === 'LEAD';
};

/**
 * Helper para crear criterios de búsqueda básicos
 */
export const createContactSearchCriteria = (
  overrides: Partial<ContactSearchCriteria> = {}
): ContactSearchCriteria => ({
  page: 0,
  size: 20,
  includeDeleted: false,
  ...overrides,
});

/**
 * Type guard para ContactStatus
 */
export const isValidContactStatus = (status: string): status is ContactStatus => {
  return ['ACTIVE', 'INACTIVE', 'PROSPECT', 'LEAD', 'MEMBER', 'VISITOR', 'FORMER_MEMBER', 'DECEASED', 'MOVED', 'DO_NOT_CONTACT', 'BOUNCED', 'BLOCKED'].includes(status);
};

/**
 * Type guard para Gender
 */
export const isValidGender = (gender: string): gender is Gender => {
  return ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'].includes(gender);
};