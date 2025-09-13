// src/types/user.types.ts
// ✅ Tipos específicos para el dominio de Usuarios del AuthService
// Matching exacto con UserDTO y UserController del backend - NOMBRES NORMALIZADOS AL INGLÉS

import {
    BaseEntity,
    BaseSearchCriteria,
    ID,
    CognitoSub,
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
  // TENANT & ORGANIZATION TYPES
  // ============================================
  
  /**
   * Información de organización (inferida del backend)
   */
  export interface OrganizationInfo {
    id?: number;
    name?: string;
    code?: string;
    // Agregar más campos cuando sea necesario
  }
  
  /**
   * Información de iglesia (inferida del backend)
   */
  export interface ChurchInfo {
    id?: number;
    name?: string;
    code?: string;
    organizationId?: number;
    // Agregar más campos cuando sea necesario
  }
  
  /**
   * Información del tenant (matching TenantInfoDTO del backend)
   */
  export interface TenantInfo {
    organizacion?: OrganizationInfo;  // Nombre original del DTO
    iglesia?: ChurchInfo;             // Nombre original del DTO
  }
  
  // ============================================
  // USER CORE TYPES (Matching UserDTO normalizado)
  // ============================================
  
  /**
   * Entidad User completa (matching UserDTO del backend con nombres normalizados)
   */
  export interface User extends BaseEntity {
    // Identificación única de Cognito
    cognitoSub: CognitoSub;
    
    // Información básica (normalizados del DTO español)
    name?: string;              // "nombre" en DTO
    email: string;
    phone?: string;             // "telefono" en DTO
    
    // Estado del usuario (normalizados del DTO español)
    isActive: boolean;          // "activo" en DTO
    isEmailVerified: boolean;   // "emailVerificado" en DTO
    isPhoneVerified: boolean;   // "telefonoVerificado" en DTO
    
    // Roles y permisos (tal como vienen del backend)
    roles: UserRole[];          // Lista de códigos de roles
    permissions: string[];      // Lista de códigos de permisos efectivos (calculados)
    
    // Información del tenant
    tenantInfo?: TenantInfo;
    
    // Datos del perfil (profileData del DTO)
    profileData?: Record<string, any>;
    
    // Actividad
    lastLogin?: string;         // "ultimoAcceso" en DTO (ISO string)
    
    // Computed fields para UI
    displayName?: string;
    initials?: string;
    hasCompleteProfile?: boolean;
    isOnline?: boolean;
  }
  
  /**
   * Stats interface para usuarios
   */
  export interface UserStats {
    // Campos básicos
    total: number;
    active: number;
    inactive: number;
    
    // Por roles (usando roles reales de la BD)
    byRole: Record<UserRole, number>;
    
    // Por contexto
    byOrganization: Record<string, number>;
    byChurch: Record<string, number>;
    
    // Métricas de verificación
    emailVerified: number;
    phoneVerified: number;
    unverified: number;
    
    // Métricas de actividad
    recentlyActive: number;
    newUsersThisMonth: number;
  }
  
  // ============================================
  // ALIAS TYPES (Para compatibilidad con componentes)
  // ============================================
  
  /**
   * Alias para mantener compatibilidad con componentes existentes
   */
  export type UserDTO = User;
  
  // ============================================
  // ENUMS Y TIPOS ESPECÍFICOS (EXACTOS DE LA BD)
  // ============================================
  
  /**
   * Roles de usuario (EXACTOS de la tabla roles de tu BD)
   */
  export type UserRole = 
    | 'SUPER_ADMIN'      // ID: 1 - Administrador con acceso completo a la plataforma
    | 'ORG_ADMIN'        // ID: 2 - Administrador de una organización específica  
    | 'CHURCH_ADMIN'     // ID: 3 - Administrador de una iglesia específica
    | 'MINISTRY_LEADER'  // ID: 4 - Líder de un ministerio específico
    | 'VOLUNTEER'        // ID: 5 - Voluntario en ministerios
    | 'USER'             // ID: 6 - Usuario básico del sistema
    | 'ADMIN'            // ID: 7 - Administrador global
    | 'MEMBER';          // ID: 10 - Miembro regular
  
  /**
   * Estados de usuario para UI (no existe enum en backend)
   */
  export type UserStatus = 
    | 'ACTIVE'           // Usuario activo
    | 'INACTIVE';        // Usuario inactivo
  
  // ============================================
  // SEARCH & FILTER TYPES
  // ============================================
  
  /**
   * Criterios de búsqueda específicos para usuarios
   */
  export interface UserSearchCriteria extends BaseSearchCriteria {
    // Texto libre (busca en name, email)
    search?: string;
    
    // Filtros básicos
    role?: UserRole;
    roles?: UserRole[];
    isActive?: boolean;
    
    // Contexto organizacional
    organizationId?: number;
    churchId?: number;
    
    // Verificación
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    
    // Actividad
    lastLoginFrom?: string;
    lastLoginTo?: string;
    
    // Filtros específicos para liderazgo
    canLeadMinistry?: boolean;
    availableForVolunteering?: boolean;
  }
  
  // ============================================
  // REQUEST/RESPONSE TYPES
  // ============================================
  
  /**
   * Request para actualizar perfil de usuario (matching UserUpdateDTO del controller)
   */
  export interface UserUpdateRequest {
    name?: string;
    phone?: string;
    profilePictureUrl?: string;
    // Cualquier campo del profileData
    profileData?: Record<string, any>;
  }
  
  /**
   * Alias para compatibilidad con userApi
   */
  export type UserUpdateDTO = UserUpdateRequest;
  
  /**
   * Request para operaciones administrativas de usuarios
   */
  export interface UserAdminUpdateRequest {
    userId: ID;
    roles?: UserRole[];
    isActive?: boolean;
    organizationId?: number;
    churchId?: number;
    notes?: string;
  }
  
  /**
   * Request para invitar nuevo usuario
   */
  export interface UserInviteRequest {
    email: string;
    name?: string;
    roles: UserRole[];
    organizationId: number;
    churchId?: number;
    personalizedMessage?: string;
    sendWelcomeEmail?: boolean;
  }
  
  /**
   * Response de mensajes del backend (matching MessageResponseDTO del controller)
   */
  export interface MessageResponseDTO {
    message: string;
    success: boolean;
    timestamp?: string;
    data?: any;
  }
  
  /**
   * Response de usuario individual
   */
  export type UserResponse = EntityResponse<User>;
  
  /**
   * Response de usuarios paginados
   */
  export type UserPageResponse = PagedResponse<User>;
  
  /**
   * Response de lista de usuarios
   */
  export type UserListResponse = ListResponse<User>;
  
  /**
   * Request para búsqueda de usuarios
   */
  export interface UserSearchRequest extends SearchRequestParams {
    criteria: UserSearchCriteria;
  }
  
  /**
   * Request para operaciones batch de usuarios
   */
  export type UserBatchRequest = BatchRequest<User>;
  
  /**
   * Response de operaciones batch de usuarios
   */
  export type UserBatchResponse = EntityBatchResponse<User>;
  
  // ============================================
  // SPECIALIZED REQUESTS
  // ============================================
  
  /**
   * Request para transferir usuarios entre iglesias
   */
  export interface TransferUserRequest {
    userIds: ID[];
    fromChurchId: number;
    toChurchId: number;
    transferReason?: string;
    notifyUsers?: boolean;
  }
  
  /**
   * Request para asignar roles
   */
  export interface AssignRolesRequest {
    userId: ID;
    roles: UserRole[];
    replaceExisting?: boolean;
    notes?: string;
  }
  
  /**
   * Request para búsqueda de usuarios para liderazgo (matching controller endpoint)
   */
  export interface UserLeadershipSearchRequest {
    query: string;
    organizationId: number;
    churchId: number;
    requiredRoles?: UserRole[];
    excludeUserIds?: ID[];
  }
  
  // ============================================
  // METRICS & ANALYTICS TYPES
  // ============================================
  
  /**
   * Métricas de usuarios
   */
  export interface UserMetrics extends BaseMetrics {
    byRole: GroupedMetrics;
    byOrganization: GroupedMetrics;
    byChurch: GroupedMetrics;
    byVerificationStatus: GroupedMetrics;
    recentlyAdded: number;
    recentlyActive: number;
    averageSessionDuration: number;
  }
  
  /**
   * Request para métricas de usuarios
   */
  export interface UserMetricsRequest extends MetricsRequest {
    entityType: 'USER';
    includeActivityStats?: boolean;
    includeRoleBreakdown?: boolean;
    includeVerificationStats?: boolean;
  }
  
  // ============================================
  // UI CONSTANTS & LABELS (Para componentes)
  // ============================================
  
  /**
   * Labels para roles de usuario (EXACTOS de la tabla roles)
   */
  export const USER_ROLE_LABELS: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    ORG_ADMIN: 'Administrador de Organización',
    CHURCH_ADMIN: 'Administrador de Iglesia',
    MINISTRY_LEADER: 'Líder de Ministerio',
    VOLUNTEER: 'Voluntario',
    USER: 'Usuario',
    ADMIN: 'Administrador',
    MEMBER: 'Miembro'
  };
  
  /**
   * Labels para estados de usuario
   */
  export const USER_STATUS_LABELS: Record<UserStatus, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo'
  };
  
  /**
   * Colors para roles (para badges y UI)
   */
  export const USER_ROLE_COLORS: Record<UserRole, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-800',
    ADMIN: 'bg-red-100 text-red-800',
    ORG_ADMIN: 'bg-purple-100 text-purple-800',
    CHURCH_ADMIN: 'bg-blue-100 text-blue-800',
    MINISTRY_LEADER: 'bg-green-100 text-green-800',
    VOLUNTEER: 'bg-orange-100 text-orange-800',
    MEMBER: 'bg-gray-100 text-gray-800',
    USER: 'bg-gray-100 text-gray-800'
  };
  
  /**
   * Icons para roles (usando Lucide React)
   */
  export const USER_ROLE_ICONS: Record<UserRole, string> = {
    SUPER_ADMIN: 'Crown',
    ADMIN: 'Shield',
    ORG_ADMIN: 'Building2',
    CHURCH_ADMIN: 'Building',
    MINISTRY_LEADER: 'Star',
    VOLUNTEER: 'Heart',
    MEMBER: 'User',
    USER: 'UserCheck'
  };
  
  /**
   * Valores por defecto
   */
  export const DEFAULT_USER_ROLE: UserRole = 'USER';
  export const DEFAULT_USER_STATUS: UserStatus = 'ACTIVE';
  
  // ============================================
  // PERMISSION CONSTANTS (EXACTOS DE LA BD)
  // ============================================
  
  /**
   * Permisos del sistema (EXACTOS de la tabla permissions)
   * Formato: RESOURCE:ACTION
   */
  export const USER_PERMISSIONS = {
    // Organization permissions
    ORGANIZATION_READ: 'ORGANIZATION:READ',
    ORGANIZATION_UPDATE: 'ORGANIZATION:UPDATE', 
    ORGANIZATION_MANAGE_PLAN: 'ORGANIZATION:MANAGE_PLAN',
    
    // Church permissions
    CHURCH_CREATE: 'CHURCH:CREATE',
    CHURCH_READ: 'CHURCH:READ',
    CHURCH_UPDATE: 'CHURCH:UPDATE',
    CHURCH_DELETE: 'CHURCH:DELETE',
    
    // User permissions
    USER_CREATE: 'USER:CREATE',
    USER_READ: 'USER:READ',
    USER_UPDATE: 'USER:UPDATE',
    USER_DELETE: 'USER:DELETE',
    USER_INVITE: 'USER:INVITE',
    
    // Role permissions
    ROLE_CREATE: 'ROLE:CREATE',
    ROLE_READ: 'ROLE:READ',
    ROLE_UPDATE: 'ROLE:UPDATE',
    ROLE_DELETE: 'ROLE:DELETE',
    ROLE_ASSIGN: 'ROLE:ASSIGN',
    
    // Ministry permissions (TURNS service)
    MINISTRY_CREATE: 'TURNS:MINISTRY:CREATE',
    MINISTRY_READ: 'TURNS:MINISTRY:READ',
    MINISTRY_UPDATE: 'TURNS:MINISTRY:UPDATE',
    MINISTRY_DELETE: 'TURNS:MINISTRY:DELETE',
    MINISTRY_MANAGE_LEADERS: 'TURNS:MINISTRY:MANAGE_LEADERS',
    
    // Shift permissions (TURNS service)
    SHIFT_CREATE: 'TURNS:SHIFT:CREATE',
    SHIFT_READ: 'TURNS:SHIFT:READ',
    SHIFT_UPDATE: 'TURNS:SHIFT:UPDATE',
    SHIFT_DELETE: 'TURNS:SHIFT:DELETE',
    SHIFT_ASSIGN: 'TURNS:SHIFT:ASSIGN',
    SHIFT_REPLACE: 'TURNS:SHIFT:REPLACE',
    SHIFT_VIEW_ALL: 'TURNS:SHIFT:VIEW_ALL',
    
    // Attendance permissions (TURNS service)
    ATTENDANCE_VIEW: 'TURNS:ATTENDANCE:VIEW',
    ATTENDANCE_RECORD: 'TURNS:ATTENDANCE:RECORD',
    ATTENDANCE_MANAGE: 'TURNS:ATTENDANCE:MANAGE',
    
    // Notification preferences
    NOTIFICATION_PREFERENCES: 'TURNS:NOTIFICATION:PREFERENCES',
    
    // CRM Contact permissions
    CONTACT_CREATE: 'CRM:CONTACT:CREATE',
    CONTACT_VIEW: 'CRM:CONTACT:VIEW',
    CONTACT_VIEW_ALL: 'CRM:CONTACT:VIEW_ALL',
    CONTACT_VIEW_OWN: 'CRM:CONTACT:VIEW_OWN',
    CONTACT_UPDATE_ALL: 'CRM:CONTACT:UPDATE_ALL',
    CONTACT_UPDATE_OWN: 'CRM:CONTACT:UPDATE_OWN',
    CONTACT_DELETE_ALL: 'CRM:CONTACT:DELETE_ALL',
    CONTACT_DELETE_OWN: 'CRM:CONTACT:DELETE_OWN',
    CONTACT_ASSIGN: 'CRM:CONTACT:ASSIGN',
    CONTACT_IMPORT: 'CRM:CONTACT:IMPORT',
    CONTACT_EXPORT: 'CRM:CONTACT:EXPORT',
    
    // CRM Company permissions
    COMPANY_CREATE: 'CRM:COMPANY:CREATE',
    COMPANY_VIEW: 'CRM:COMPANY:VIEW',
    COMPANY_UPDATE: 'CRM:COMPANY:UPDATE',
    COMPANY_DELETE: 'CRM:COMPANY:DELETE',
    
    // CRM Pipeline permissions
    PIPELINE_CREATE: 'CRM:PIPELINE:CREATE',
    PIPELINE_VIEW: 'CRM:PIPELINE:VIEW',
    PIPELINE_UPDATE: 'CRM:PIPELINE:UPDATE',
    PIPELINE_DELETE: 'CRM:PIPELINE:DELETE',
    
    // CRM Deal permissions
    DEAL_CREATE: 'CRM:DEAL:CREATE',
    DEAL_VIEW_ALL: 'CRM:DEAL:VIEW_ALL',
    DEAL_VIEW_OWN: 'CRM:DEAL:VIEW_OWN',
    DEAL_UPDATE_ALL: 'CRM:DEAL:UPDATE_ALL',
    DEAL_UPDATE_OWN: 'CRM:DEAL:UPDATE_OWN',
    DEAL_DELETE: 'CRM:DEAL:DELETE',
    DEAL_MOVE_STAGE: 'CRM:DEAL:MOVE_STAGE',
    DEAL_ASSIGN: 'CRM:DEAL:ASSIGN',
    
    // CRM Activity permissions
    ACTIVITY_CREATE: 'CRM:ACTIVITY:CREATE',
    ACTIVITY_VIEW_ALL: 'CRM:ACTIVITY:VIEW_ALL',
    ACTIVITY_VIEW_OWN: 'CRM:ACTIVITY:VIEW_OWN',
    ACTIVITY_UPDATE: 'CRM:ACTIVITY:UPDATE',
    ACTIVITY_DELETE: 'CRM:ACTIVITY:DELETE',
    
    // CRM Settings permissions
    CRM_SETTINGS_MANAGE: 'CRM:SETTINGS:MANAGE',
    
    // CRM Tag permissions
    TAG_CREATE: 'CRM:TAG:CREATE',
    TAG_MANAGE: 'CRM:TAG:MANAGE',
    
    // CRM Report permissions
    REPORT_VIEW: 'CRM:REPORT:VIEW',
  } as const;
  
  // ============================================
  // TYPE GUARDS & HELPERS
  // ============================================
  
  /**
   * Type guard para verificar si es un usuario válido
   */
  export const isValidUser = (obj: any): obj is User => {
    return obj && 
           typeof obj.id === 'number' &&
           typeof obj.cognitoSub === 'string' &&
           typeof obj.email === 'string' &&
           typeof obj.isActive === 'boolean';
  };
  
  /**
   * Helper para obtener el nombre para mostrar
   */
  export const getDisplayName = (user: User): string => {
    if (user.displayName) return user.displayName;
    if (user.name) return user.name;
    return user.email.split('@')[0];
  };
  
  /**
   * Helper para obtener las iniciales del usuario
   */
  export const getUserInitials = (user: User): string => {
    if (user.initials) return user.initials;
    
    const name = getDisplayName(user);
    const parts = name.split(' ');
    
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    
    return name.substring(0, 2).toUpperCase();
  };
  
  /**
   * Helper para verificar si el usuario tiene un rol específico
   */
  export const hasRole = (user: User, role: UserRole): boolean => {
    return user.roles?.includes(role) ?? false;
  };
  
  /**
   * Helper para verificar si el usuario es administrador
   */
  export const isAdmin = (user: User): boolean => {
    return hasRole(user, 'SUPER_ADMIN') || 
           hasRole(user, 'ADMIN') ||
           hasRole(user, 'ORG_ADMIN') || 
           hasRole(user, 'CHURCH_ADMIN');
  };
  
  /**
   * Helper para verificar si el usuario puede liderar ministerios
   */
  export const canLeadMinistry = (user: User): boolean => {
    return isAdmin(user) || hasRole(user, 'MINISTRY_LEADER');
  };
  
  /**
   * Helper para obtener el rol más alto del usuario
   */
  export const getHighestRole = (user: User): UserRole => {
    if (!user.roles || user.roles.length === 0) return DEFAULT_USER_ROLE;
    
    // Jerarquía basada en los roles reales de la BD
    const roleHierarchy: UserRole[] = [
      'SUPER_ADMIN',
      'ADMIN',
      'ORG_ADMIN', 
      'CHURCH_ADMIN',
      'MINISTRY_LEADER',
      'VOLUNTEER',
      'MEMBER',
      'USER'
    ];
    
    for (const role of roleHierarchy) {
      if (user.roles.includes(role)) {
        return role;
      }
    }
    
    return DEFAULT_USER_ROLE;
  };
  
  /**
   * Helper para verificar si el perfil está completo
   */
  export const hasCompleteProfile = (user: User): boolean => {
    return !!(
      user.name &&
      user.phone &&
      user.isEmailVerified
    );
  };
  
  /**
   * Helper para verificar si el usuario tiene un permiso específico
   */
  export const hasPermission = (user: User, permission: string): boolean => {
    return user.permissions?.includes(permission) ?? false;
  };
  
  /**
   * Helper para obtener información de organización del usuario
   */
  export const getOrganizationInfo = (user: User): OrganizationInfo | undefined => {
    return user.tenantInfo?.organizacion;
  };
  
  /**
   * Helper para obtener información de iglesia del usuario
   */
  export const getChurchInfo = (user: User): ChurchInfo | undefined => {
    return user.tenantInfo?.iglesia;
  };
  
  /**
   * Helper para verificar si el usuario puede gestionar el CRM
   */
  export const canManageCRM = (user: User): boolean => {
    return hasPermission(user, USER_PERMISSIONS.CONTACT_VIEW_ALL) ||
           hasPermission(user, USER_PERMISSIONS.DEAL_VIEW_ALL) ||
           hasPermission(user, USER_PERMISSIONS.CRM_SETTINGS_MANAGE);
  };
  
  /**
   * Helper para verificar si el usuario puede gestionar ministerios
   */
  export const canManageMinistries = (user: User): boolean => {
    return hasPermission(user, USER_PERMISSIONS.MINISTRY_CREATE) ||
           hasPermission(user, USER_PERMISSIONS.MINISTRY_MANAGE_LEADERS);
  };