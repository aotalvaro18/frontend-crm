// src/types/company.types.ts
// ✅ Tipos específicos para el dominio de Empresas del CRM
// Matching exacto con CompanyDTO y CompanyController del backend

import {
    BaseEntity,
    BaseSearchCriteria,
    ID,
    CognitoSub,
    CustomFields,
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
  // COMPANY CORE TYPES (Matching CompanyDTO)
  // ============================================
  
  /**
   * Entidad Company completa (matching CompanyDTO del backend)
   */
  export interface Company extends BaseEntity {
    // Información básica obligatoria
    name: string;
    type: CompanyType;
    
    // Información de contacto
    email?: string;
    phone?: string;
    website?: string;
    
    // Dirección (embedded AddressDTO)
    address?: Address;
    
    // Detalles comerciales
    industry?: string;
    companySize?: CompanySize;
    annualRevenue?: number;
    
    // Ownership y asignación
    ownerCognitoSub: CognitoSub;    // Owner de la empresa
    ownerName?: string;             // Computed field
    
    // Custom fields
    customFields: CustomFields;
    
    // Métricas y relaciones (computed fields)
    contactCount?: number;          // Número de contactos asociados
    activeContactsCount?: number;   // Contactos activos
    dealCount?: number;             // Número de deals
    totalDealValue?: number;        // Valor total de deals
    
    // Display helpers (computed fields)
    displayName?: string;           // Nombre para mostrar según tipo
    preferredContactMethod?: string; // email, phone, website, none
    hasCompleteContactInfo?: boolean;
    hasCompleteAddress?: boolean;
    isActive?: boolean;             // Tiene contactos activos
  }
  
  /**
   * Stats interface para empresas
   */
  export interface CompanyStats {
    // Campos básicos (del backend)
    total: number;
    byType: Record<CompanyType, number>;
    byIndustry: Record<string, number>;
    bySize: Record<CompanySize, number>;
    
    // Campos adicionales para UI
    totalContacts?: number;
    averageContactsPerCompany?: number;
    companiesWithDeals?: number;
    totalRevenue?: number;
    newCompaniesThisMonth?: number;
  }
  
  // ============================================
  // ALIAS TYPES (Para compatibilidad con componentes)
  // ============================================
  
  /**
   * Alias para mantener compatibilidad con componentes existentes
   */
  export type CompanyDTO = Company;
  
  // ============================================
  // ENUMS Y TIPOS ESPECÍFICOS
  // ============================================
  
  /**
   * Tipos de empresa (matching backend enum)
   */
  export type CompanyType = 
    | 'COMPANY'      // Empresa comercial
    | 'FAMILY'       // Grupo familiar (contexto iglesia)
    | 'INSTITUTION'  // Institución educativa, ONG
    | 'OTHER';       // Otros tipos de agrupación
  
  /**
   * Tamaños de empresa
   */
  export type CompanySize = 
    | 'SMALL'        // Pequeña (1-10 empleados)
    | 'MEDIUM'       // Mediana (11-50 empleados)
    | 'LARGE'        // Grande (51-200 empleados)
    | 'ENTERPRISE';  // Empresa (200+ empleados)
  
  /**
   * Industrias comunes (extensible)
   */
  export type Industry = 
    // Tecnología
    | 'TECHNOLOGY'
    | 'SOFTWARE'
    | 'IT_SERVICES'
    
    // Servicios
    | 'CONSULTING'
    | 'PROFESSIONAL_SERVICES'
    | 'FINANCIAL_SERVICES'
    | 'LEGAL_SERVICES'
    
    // Comercio
    | 'RETAIL'
    | 'E_COMMERCE'
    | 'WHOLESALE'
    
    // Manufactura
    | 'MANUFACTURING'
    | 'CONSTRUCTION'
    | 'AUTOMOTIVE'
    
    // Salud y educación
    | 'HEALTHCARE'
    | 'EDUCATION'
    | 'NON_PROFIT'
    
    // Otros
    | 'REAL_ESTATE'
    | 'TRANSPORTATION'
    | 'HOSPITALITY'
    | 'MEDIA'
    | 'OTHER';
  
  // ============================================
  // SEARCH & FILTER TYPES
  // ============================================
  
  /**
   * Criterios de búsqueda específicos para empresas
   */
  export interface CompanySearchCriteria extends BaseSearchCriteria {
    // Texto libre
    search?: string;                    // Búsqueda en nombre, email, website
    
    // Filtros básicos
    type?: CompanyType;
    industry?: string;
    companySize?: CompanySize;
    
    // Ownership y asignación
    ownerCognitoSub?: CognitoSub;
    onlyOwned?: boolean;               // Solo empresas que soy dueño
    
    // Fechas
    createdFrom?: string;
    createdTo?: string;
    
    // Revenue
    minRevenue?: number;
    maxRevenue?: number;
    
    // Ubicación
    city?: string;
    state?: string;
    country?: string;
    
    // Actividad
    hasContacts?: boolean;
    hasActiveContacts?: boolean;
    hasDeals?: boolean;
    
    // Custom fields
    customFields?: Record<string, any>;
    
    // Comunicación
    hasEmail?: boolean;
    hasPhone?: boolean;
    hasWebsite?: boolean;
  }
  
  // ============================================
  // REQUEST/RESPONSE TYPES
  // ============================================
  
  /**
   * Request para crear empresa
   */
  export type CreateCompanyRequest = Partial<Omit<Company, keyof BaseEntity>> & {
    // Campos requeridos por el formulario de creación
    name: string;
    type: CompanyType;
    // Campos opcionales del formulario
    email?: string;
    phone?: string;
    website?: string;
    industry?: string;
    companySize?: CompanySize;
    annualRevenue?: number;
    address?: Address;
    customFields?: CustomFields;
  };
  
  /**
   * Request para actualizar empresa
   */
  export type UpdateCompanyRequest = Partial<Omit<Company, keyof BaseEntity>> & {
    version: number; // Requerido para optimistic locking
    // Todos los demás campos opcionales
    name?: string;
    type?: CompanyType;
    email?: string;
    phone?: string;
    website?: string;
    industry?: string;
    companySize?: CompanySize;
    annualRevenue?: number;
    address?: Address;
    customFields?: CustomFields;
  };
  
  /**
   * Response de empresa individual
   */
  export type CompanyResponse = EntityResponse<Company>;
  
  /**
   * Response de empresas paginados
   */
  export type CompanyPageResponse = PagedResponse<Company>;
  
  /**
   * Response de lista de empresas
   */
  export type CompanyListResponse = ListResponse<Company>;
  
  /**
   * Request para búsqueda de empresas
   */
  export interface CompanySearchRequest extends SearchRequestParams {
    criteria: CompanySearchCriteria;
  }
  
  /**
   * Request para operaciones batch de empresas
   */
  export type CompanyBatchRequest = BatchRequest<Company>;
  
  /**
   * Response de operaciones batch de empresas
   */
  export type CompanyBatchResponse = EntityBatchResponse<Company>;
  
  // ============================================
  // SPECIALIZED REQUESTS
  // ============================================
  
  /**
   * Request para asignar empresa
   */
  export interface AssignCompanyRequest {
    companyId: ID;
    assignToSub: CognitoSub;
    notes?: string;
  }
  
  /**
   * Request para transferir ownership
   */
  export interface TransferCompanyOwnershipRequest {
    companyIds: ID[];
    newOwnerSub: CognitoSub;
    transferReason?: string;
    notifyNewOwner?: boolean;
  }
  
  /**
   * Request para merge de empresas
   */
  export interface MergeCompaniesRequest {
    primaryCompanyId: ID;
    duplicateCompanyIds: ID[];
    mergeStrategy: MergeStrategy;
    fieldMappings?: Record<string, 'PRIMARY' | 'DUPLICATE' | 'COMBINE'>;
  }
  
  /**
   * Estrategias de merge
   */
  export type MergeStrategy = 
    | 'KEEP_PRIMARY'     // Mantener datos de la empresa primaria
    | 'MERGE_ALL'        // Combinar todos los datos
    | 'MANUAL_MAPPING';  // Mapeo manual de campos
  
  /**
   * Request para import de empresas
   */
  export interface CompanyImportRequest {
    file: File;
    mappings: Record<string, string>;  // CSV column -> Company field
    duplicateStrategy: 'SKIP' | 'UPDATE' | 'CREATE_NEW';
    defaultValues?: Partial<Company>;
    validateOnly?: boolean;
  }
  
  /**
   * Response de import de empresas
   */
  export interface CompanyImportResponse {
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
   * Métricas de empresas
   */
  export interface CompanyMetrics extends BaseMetrics {
    byType: GroupedMetrics;
    byIndustry: GroupedMetrics;
    bySize: GroupedMetrics;
    byOwner: GroupedMetrics;
    recentlyAdded: number;
    recentlyUpdated: number;
    withContacts: number;
    withoutContacts: number;
    averageRevenue: number;
  }
  
  /**
   * Request para métricas de empresas
   */
  export interface CompanyMetricsRequest extends MetricsRequest {
    entityType: 'COMPANY';
    includeRevenueStats?: boolean;
    includeContactBreakdown?: boolean;
    includeIndustryAnalysis?: boolean;
  }
  
  // ============================================
  // UI CONSTANTS & LABELS (Para componentes)
  // ============================================
  
  /**
   * Labels para tipos de empresa
   */
  export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
    COMPANY: 'Empresa',
    FAMILY: 'Familia',
    INSTITUTION: 'Institución',
    OTHER: 'Otro'
  };
  
  /**
   * Labels para tamaños de empresa
   */
  export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
    SMALL: 'Pequeña',
    MEDIUM: 'Mediana',
    LARGE: 'Grande',
    ENTERPRISE: 'Corporativa'
  };
  
  /**
   * Labels para industrias
   */
  export const INDUSTRY_LABELS: Record<Industry, string> = {
    // Tecnología
    TECHNOLOGY: 'Tecnología',
    SOFTWARE: 'Software',
    IT_SERVICES: 'Servicios TI',
    
    // Servicios
    CONSULTING: 'Consultoría',
    PROFESSIONAL_SERVICES: 'Servicios Profesionales',
    FINANCIAL_SERVICES: 'Servicios Financieros',
    LEGAL_SERVICES: 'Servicios Legales',
    
    // Comercio
    RETAIL: 'Retail',
    E_COMMERCE: 'E-commerce',
    WHOLESALE: 'Mayorista',
    
    // Manufactura
    MANUFACTURING: 'Manufactura',
    CONSTRUCTION: 'Construcción',
    AUTOMOTIVE: 'Automotriz',
    
    // Salud y educación
    HEALTHCARE: 'Salud',
    EDUCATION: 'Educación',
    NON_PROFIT: 'Sin Fines de Lucro',
    
    // Otros
    REAL_ESTATE: 'Bienes Raíces',
    TRANSPORTATION: 'Transporte',
    HOSPITALITY: 'Hospitalidad',
    MEDIA: 'Medios',
    OTHER: 'Otro'
  };
  
  /**
   * Valores por defecto
   */
  export const DEFAULT_COMPANY_TYPE: CompanyType = 'COMPANY';
  export const DEFAULT_COMPANY_SIZE: CompanySize = 'SMALL';
  
  // ============================================
  // TYPE GUARDS & HELPERS
  // ============================================
  
  /**
   * Type guard para verificar si es una empresa válida
   */
  export const isValidCompany = (obj: any): obj is Company => {
    return obj && 
           typeof obj.id === 'number' &&
           typeof obj.name === 'string' &&
           typeof obj.type === 'string' &&
           typeof obj.ownerCognitoSub === 'string';
  };
  
  /**
   * Helper para obtener el nombre para mostrar según el tipo
   */
  export const getDisplayName = (company: Company): string => {
    if (company.displayName) return company.displayName;
    
    switch (company.type) {
      case 'FAMILY':
        return `Familia ${company.name}`;
      case 'INSTITUTION':
        return `${company.name} (Institución)`;
      case 'COMPANY':
        return `${company.name}`;
      default:
        return company.name;
    }
  };
  
  /**
   * Helper para verificar si una empresa es comercial
   */
  export const isCommercialCompany = (company: Company): boolean => {
    return company.type === 'COMPANY';
  };
  
  /**
   * Helper para verificar si es una empresa familiar
   */
  export const isFamily = (company: Company): boolean => {
    return company.type === 'FAMILY';
  };
  
  /**
   * Helper para verificar si es una institución
   */
  export const isInstitution = (company: Company): boolean => {
    return company.type === 'INSTITUTION';
  };
  
  /**
   * Helper para verificar si tiene información de contacto completa
   */
  export const hasCompleteContactInfo = (company: Company): boolean => {
    return !!(company.email || company.phone || company.website);
  };
  
  /**
   * Helper para obtener el canal de contacto preferido
   */
  export const getPreferredContactMethod = (company: Company): string => {
    if (company.email) return 'email';
    if (company.phone) return 'phone';
    if (company.website) return 'website';
    return 'none';
  };
  
  /**
   * Helper para verificar si es una empresa grande
   */
  export const isLargeCompany = (company: Company): boolean => {
    // Por tamaño declarado
    if (company.companySize === 'LARGE' || company.companySize === 'ENTERPRISE') {
      return true;
    }
    
    // Por revenue (> 10M como ejemplo)
    if (company.annualRevenue && company.annualRevenue > 10000000) {
      return true;
    }
    
    return false;
  };
  
  /**
   * Helper para verificar si la empresa está activa
   */
  export const isActiveCompany = (company: Company): boolean => {
    return company.isActive || (company.activeContactsCount && company.activeContactsCount > 0) || false;
  };
  
  /**
   * Helper para obtener icono sugerido según el tipo
   */
  export const getSuggestedIcon = (company: Company): string => {
    switch (company.type) {
      case 'COMPANY':
        return 'building';
      case 'FAMILY':
        return 'users';
      case 'INSTITUTION':
        return 'bank';
      case 'OTHER':
      default:
        return 'briefcase';
    }
  };
  
  /**
   * Helper para crear criterios de búsqueda básicos
   */
  export const createCompanySearchCriteria = (
    overrides: Partial<CompanySearchCriteria> = {}
  ): CompanySearchCriteria => ({
    page: 0,
    size: 20, // Este es el size de paginación de BaseSearchCriteria
    includeDeleted: false,
    ...overrides,
  });
  
  /**
   * Type guard para CompanyType
   */
  export const isValidCompanyType = (type: string): type is CompanyType => {
    return ['COMPANY', 'FAMILY', 'INSTITUTION', 'OTHER'].includes(type);
  };
  
  /**
   * Type guard para CompanySize
   */
  export const isValidCompanySize = (size: string): size is CompanySize => {
    return ['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'].includes(size);
  }; 
