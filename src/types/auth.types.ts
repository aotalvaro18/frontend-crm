 // src/types/auth.types.ts
// ✅ Tipos específicos para autenticación y autorización
// Compatible con Amplify v6, AuthStore y AuthContext

import {
    BaseEntity,
    ID,
    CognitoSub,
    Timestamp,
    ApiResponse,
    Optional,
  } from './common.types';
  
  import {
    CrmErrorResponse,
    HttpHeaders,
  } from './api.types';
  
  // ============================================
  // USER & PROFILE TYPES
  // ============================================
  
  /**
   * Usuario completo del sistema (matching backend User entity)
   */
  export interface User extends BaseEntity {
    // Identificación
    email: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    
    // Cognito integration
    cognitoSub: CognitoSub;
    cognitoUsername?: string;
    
    // Profile
    profilePicture?: string;
    phoneNumber?: string;
    timezone?: string;
    language?: string;
    
    // Status
    isActive: boolean;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    
    // Access info
    lastLoginAt?: Timestamp;
    lastSeenAt?: Timestamp;
    loginCount?: number;
    
    // Preferences
    preferences: UserPreferences;
    
    // Relations
    roles: UserRole[];
    permissions: Permission[];
    organizationMemberships: OrganizationMembership[];
    churchMemberships: ChurchMembership[];
  }
  
  /**
   * Usuario simplificado para UI (sin datos sensibles)
   */
  export interface UserProfile {
    id: ID;
    email: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    profilePicture?: string;
    cognitoSub: CognitoSub;
    isActive: boolean;
    lastLoginAt?: Timestamp;
  }
  
  /**
   * Preferencias de usuario
   */
  export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
    currency: string;
    notifications: NotificationPreferences;
    dashboard: DashboardPreferences;
  }
  
  /**
   * Preferencias de notificaciones
   */
  export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    sms: boolean;
    desktop: boolean;
    digest: 'daily' | 'weekly' | 'never';
    mentions: boolean;
    assignments: boolean;
    deadlines: boolean;
    marketing: boolean;
  }
  
  /**
   * Preferencias de dashboard
   */
  export interface DashboardPreferences {
    defaultView: 'cards' | 'list' | 'kanban';
    widgetOrder: string[];
    hiddenWidgets: string[];
    refreshInterval: number;
    autoRefresh: boolean;
  }
  
  // ============================================
  // ROLE & PERMISSION TYPES
  // ============================================
  
  /**
   * Rol de usuario
   */
  export interface UserRole {
    id: ID;
    name: string;
    code: string;
    description?: string;
    level: number;
    isSystemRole: boolean;
    permissions: Permission[];
    organizationId?: ID;
    churchId?: ID;
  }
  
  /**
   * Permiso individual
   */
  export interface Permission {
    id: ID;
    name: string;
    code: string;
    resource: string;
    action: string;
    description?: string;
    isSystemPermission: boolean;
  }
  
  /**
   * Códigos de roles del sistema
   */
  export type SystemRole = 
    | 'SUPER_ADMIN'      // Administrador del sistema
    | 'ADMIN'            // Administrador de organización
    | 'ORG_ADMIN'        // Administrador de organización
    | 'CHURCH_ADMIN'     // Administrador de iglesia
    | 'MANAGER'          // Gerente/Supervisor
    | 'USER'             // Usuario estándar
    | 'VIEWER'           // Solo lectura
    | 'MEMBER';          // Miembro (portal)
  
  /**
   * Códigos de permisos del sistema
   */
  export type SystemPermission =
    // Contact permissions
    | 'CONTACT_VIEW'
    | 'CONTACT_CREATE'
    | 'CONTACT_EDIT'
    | 'CONTACT_DELETE'
    | 'CONTACT_EXPORT'
    | 'CONTACT_IMPORT'
    | 'CONTACT_ASSIGN'
    
    // Company permissions
    | 'COMPANY_VIEW'
    | 'COMPANY_CREATE'
    | 'COMPANY_EDIT'
    | 'COMPANY_DELETE'
    | 'COMPANY_EXPORT'
    
    // Deal permissions
    | 'DEAL_VIEW'
    | 'DEAL_CREATE'
    | 'DEAL_EDIT'
    | 'DEAL_DELETE'
    | 'DEAL_ASSIGN'
    | 'DEAL_CLOSE'
    
    // Pipeline permissions
    | 'PIPELINE_VIEW'
    | 'PIPELINE_CREATE'
    | 'PIPELINE_EDIT'
    | 'PIPELINE_DELETE'
    | 'PIPELINE_MANAGE'
    
    // Activity permissions
    | 'ACTIVITY_VIEW'
    | 'ACTIVITY_CREATE'
    | 'ACTIVITY_EDIT'
    | 'ACTIVITY_DELETE'
    
    // Report permissions
    | 'REPORT_VIEW'
    | 'REPORT_CREATE'
    | 'REPORT_EXPORT'
    | 'REPORT_ADVANCED'
    
    // Admin permissions
    | 'USER_MANAGE'
    | 'ROLE_MANAGE'
    | 'ORGANIZATION_MANAGE'
    | 'CHURCH_MANAGE'
    | 'SETTINGS_MANAGE'
    | 'INTEGRATION_MANAGE'
    
    // System permissions
    | 'SYSTEM_ADMIN'
    | 'AUDIT_VIEW'
    | 'BILLING_MANAGE';
  
  // ============================================
  // ORGANIZATION & CHURCH MEMBERSHIP
  // ============================================
  
  /**
   * Membresía en organización
   */
  export interface OrganizationMembership {
    id: ID;
    userId: ID;
    organizationId: ID;
    organizationName: string;
    role: UserRole;
    joinedAt: Timestamp;
    isActive: boolean;
    isPrimary: boolean;
    permissions: Permission[];
  }
  
  /**
   * Membresía en iglesia
   */
  export interface ChurchMembership {
    id: ID;
    userId: ID;
    churchId: ID;
    churchName: string;
    organizationId: ID;
    role: UserRole;
    joinedAt: Timestamp;
    isActive: boolean;
    isPrimary: boolean;
    permissions: Permission[];
  }
  
  // ============================================
  // AUTHENTICATION STATE TYPES
  // ============================================
  
  /**
   * Estado de autenticación (para stores)
   */
  export interface AuthState {
    // User data
    user: User | null;
    userProfile: UserProfile | null;
    
    // Authentication status
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    
    // Error state
    error: string | null;
    lastError: AuthError | null;
    
    // MFA state
    isMfaRequired: boolean;
    mfaType?: MfaType;
    mfaChallenge?: MfaChallenge;
    
    // Session info
    accessToken: string | null;
    idToken: string | null;
    refreshToken: string | null;
    tokenExpiry?: number;
    sessionExpiry?: number;
    lastActivity?: number;
    
    // Context
    currentOrganizationId?: ID;
    currentChurchId?: ID;
    availableOrganizations: OrganizationMembership[];
    availableChurches: ChurchMembership[];
  }
  
  /**
   * Tipos de MFA soportados
   */
  export type MfaType = 'SMS' | 'TOTP' | 'EMAIL';
  
  /**
   * Challenge de MFA
   */
  export interface MfaChallenge {
    type: MfaType;
    destination?: string; // Phone number masked or email masked
    sessionId: string;
    expiresAt: Timestamp;
    attemptsRemaining: number;
  }
  
  // ============================================
  // AUTHENTICATION REQUEST/RESPONSE TYPES
  // ============================================
  
  /**
   * Request de login
   */
  export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
    organizationId?: ID;
    churchId?: ID;
  }
  
  /**
   * Response de login
   */
  export interface LoginResponse extends ApiResponse<AuthTokens> {
    data: AuthTokens;
    user: UserProfile;
    mfaRequired?: boolean;
    mfaChallenge?: MfaChallenge;
  }
  
  /**
   * Tokens de autenticación
   */
  export interface AuthTokens {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    expiresAt: number;
  }
  
  /**
   * Request de confirmación MFA
   */
  export interface ConfirmMfaRequest {
    sessionId: string;
    code: string;
    type: MfaType;
  }
  
  /**
   * Request de cambio de contraseña
   */
  export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
  }
  
  /**
   * Request de recuperación de contraseña
   */
  export interface ForgotPasswordRequest {
    email: string;
    organizationId?: ID;
  }
  
  /**
   * Request de reset de contraseña
   */
  export interface ResetPasswordRequest {
    email: string;
    code: string;
    newPassword: string;
  }
  
  /**
   * Request de registro de usuario
   */
  export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    organizationId?: ID;
    churchId?: ID;
    invitationCode?: string;
  }
  
  /**
   * Request de verificación de email
   */
  export interface VerifyEmailRequest {
    email: string;
    code: string;
  }
  
  /**
   * Request de refresh token
   */
  export interface RefreshTokenRequest {
    refreshToken: string;
  }
  
  // ============================================
  // AUTHENTICATION ERROR TYPES
  // ============================================
  
  /**
   * Tipos de errores de autenticación
   */
  export type AuthErrorType =
    | 'INVALID_CREDENTIALS'
    | 'USER_NOT_FOUND'
    | 'USER_NOT_CONFIRMED'
    | 'PASSWORD_RESET_REQUIRED'
    | 'TOO_MANY_REQUESTS'
    | 'MFA_REQUIRED'
    | 'INVALID_MFA_CODE'
    | 'MFA_CODE_EXPIRED'
    | 'TOKEN_EXPIRED'
    | 'TOKEN_INVALID'
    | 'SESSION_EXPIRED'
    | 'ACCOUNT_LOCKED'
    | 'ACCOUNT_DISABLED'
    | 'EMAIL_NOT_VERIFIED'
    | 'PHONE_NOT_VERIFIED'
    | 'PASSWORD_TOO_WEAK'
    | 'PASSWORD_POLICY_VIOLATION'
    | 'INVITATION_EXPIRED'
    | 'INVITATION_INVALID'
    | 'ORGANIZATION_ACCESS_DENIED'
    | 'CHURCH_ACCESS_DENIED'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';
  
  /**
   * Error de autenticación extendido
   */
  export interface AuthError extends CrmErrorResponse {
    type: AuthErrorType;
    canRetry: boolean;
    retryAfter?: number;
    suggestions?: string[];
    supportContact?: string;
  }
  
  // ============================================
  // SESSION MANAGEMENT TYPES
  // ============================================
  
  /**
   * Información de sesión
   */
  export interface SessionInfo {
    sessionId: string;
    userId: ID;
    userEmail: string;
    organizationId: ID;
    churchId?: ID;
    ipAddress: string;
    userAgent: string;
    deviceId?: string;
    deviceName?: string;
    location?: SessionLocation;
    startedAt: Timestamp;
    lastActivityAt: Timestamp;
    expiresAt: Timestamp;
    isActive: boolean;
    isCurrent?: boolean;
  }
  
  /**
   * Ubicación de sesión
   */
  export interface SessionLocation {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    isp?: string;
  }
  
  /**
   * Request para terminar sesión
   */
  export interface TerminateSessionRequest {
    sessionId?: string;  // Si no se proporciona, termina la sesión actual
    terminateAll?: boolean;
  }
  
  // ============================================
  // INVITATION & ONBOARDING TYPES
  // ============================================
  
  /**
   * Invitación de usuario
   */
  export interface UserInvitation {
    id: ID;
    email: string;
    firstName?: string;
    lastName?: string;
    organizationId: ID;
    churchId?: ID;
    roleId: ID;
    invitedBy: CognitoSub;
    invitedAt: Timestamp;
    expiresAt: Timestamp;
    acceptedAt?: Timestamp;
    status: InvitationStatus;
    invitationCode: string;
    message?: string;
  }
  
  /**
   * Estados de invitación
   */
  export type InvitationStatus = 
    | 'PENDING' 
    | 'ACCEPTED' 
    | 'EXPIRED' 
    | 'REVOKED' 
    | 'BOUNCED';
  
  /**
   * Request para enviar invitación
   */
  export interface SendInvitationRequest {
    email: string;
    firstName?: string;
    lastName?: string;
    roleId: ID;
    organizationId: ID;
    churchId?: ID;
    message?: string;
    expiresIn?: number; // Días hasta expiración
  }
  
  /**
   * Request para aceptar invitación
   */
  export interface AcceptInvitationRequest {
    invitationCode: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }
  
  // ============================================
  // CONTEXT SWITCHING TYPES
  // ============================================
  
  /**
   * Request para cambiar contexto
   */
  export interface SwitchContextRequest {
    organizationId: ID;
    churchId?: ID;
  }
  
  /**
   * Contexto de usuario actual
   */
  export interface UserContext {
    userId: ID;
    organizationId: ID;
    organizationName: string;
    churchId?: ID;
    churchName?: string;
    roles: SystemRole[];
    permissions: SystemPermission[];
    canSwitchOrganization: boolean;
    canSwitchChurch: boolean;
    availableContexts: AvailableContext[];
  }
  
  /**
   * Contexto disponible para cambio
   */
  export interface AvailableContext {
    organizationId: ID;
    organizationName: string;
    churchId?: ID;
    churchName?: string;
    role: SystemRole;
    isPrimary: boolean;
  }
  
  // ============================================
  // AUDIT & SECURITY TYPES
  // ============================================
  
  /**
   * Log de evento de seguridad
   */
  export interface SecurityEvent {
    id: ID;
    userId?: ID;
    email?: string;
    eventType: SecurityEventType;
    description: string;
    ipAddress: string;
    userAgent: string;
    location?: SessionLocation;
    timestamp: Timestamp;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    resolved: boolean;
    resolvedAt?: Timestamp;
    resolvedBy?: CognitoSub;
  }
  
  /**
   * Tipos de eventos de seguridad
   */
  export type SecurityEventType =
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'LOGIN_SUSPICIOUS'
    | 'PASSWORD_CHANGED'
    | 'PASSWORD_RESET'
    | 'MFA_ENABLED'
    | 'MFA_DISABLED'
    | 'ACCOUNT_LOCKED'
    | 'ACCOUNT_UNLOCKED'
    | 'PERMISSION_ESCALATION'
    | 'UNAUTHORIZED_ACCESS'
    | 'DATA_EXPORT'
    | 'BULK_OPERATION'
    | 'API_KEY_CREATED'
    | 'API_KEY_REVOKED';
  
  // ============================================
  // TYPE GUARDS & HELPERS
  // ============================================
  
  /**
   * Type guard para verificar si es un error de auth
   */
  export const isAuthError = (error: any): error is AuthError => {
    return error?.type && typeof error.type === 'string' && error?.canRetry !== undefined;
  };
  
  /**
   * Type guard para verificar si el usuario tiene un rol específico
   */
  export const hasRole = (user: User | null, role: SystemRole): boolean => {
    if (!user) return false;
    return user.roles.some(r => r.code === role);
  };
  
  /**
   * Type guard para verificar si el usuario tiene un permiso específico
   */
  export const hasPermission = (user: User | null, permission: SystemPermission): boolean => {
    if (!user) return false;
    return user.permissions.some(p => p.code === permission);
  };
  
  /**
   * Type guard para verificar si el usuario puede acceder a una organización
   */
  export const canAccessOrganization = (user: User | null, organizationId: ID): boolean => {
    if (!user) return false;
    if (hasRole(user, 'SUPER_ADMIN')) return true;
    return user.organizationMemberships.some(
      m => m.organizationId === organizationId && m.isActive
    );
  };
  
  /**
   * Type guard para verificar si el usuario puede acceder a una iglesia
   */
  export const canAccessChurch = (user: User | null, churchId: ID): boolean => {
    if (!user) return false;
    if (hasRole(user, 'SUPER_ADMIN') || hasRole(user, 'ADMIN')) return true;
    return user.churchMemberships.some(
      m => m.churchId === churchId && m.isActive
    );
  };
  
  /**
   * Helper para obtener el contexto actual del usuario
   */
  export const getUserContext = (user: User | null, organizationId?: ID, churchId?: ID): UserContext | null => {
    if (!user) return null;
    
    const currentOrgId = organizationId || user.organizationMemberships.find(m => m.isPrimary)?.organizationId;
    const currentChurchId = churchId || user.churchMemberships.find(m => m.isPrimary)?.churchId;
    
    if (!currentOrgId) return null;
    
    const orgMembership = user.organizationMemberships.find(m => m.organizationId === currentOrgId);
    const churchMembership = currentChurchId ? user.churchMemberships.find(m => m.churchId === currentChurchId) : undefined;
    
    if (!orgMembership) return null;
    
    // Combinar roles y permisos
    const roles: SystemRole[] = [orgMembership.role.code as SystemRole];
    if (churchMembership) {
      roles.push(churchMembership.role.code as SystemRole);
    }
    
    const permissions: SystemPermission[] = [
      ...orgMembership.permissions.map(p => p.code as SystemPermission),
      ...(churchMembership?.permissions.map(p => p.code as SystemPermission) || [])
    ];
    
    return {
      userId: user.id,
      organizationId: currentOrgId,
      organizationName: orgMembership.organizationName,
      churchId: currentChurchId,
      churchName: churchMembership?.churchName,
      roles: Array.from(new Set(roles)),
      permissions: Array.from(new Set(permissions)),
      canSwitchOrganization: user.organizationMemberships.length > 1,
      canSwitchChurch: user.churchMemberships.length > 1,
      availableContexts: user.organizationMemberships.map(org => ({
        organizationId: org.organizationId,
        organizationName: org.organizationName,
        role: org.role.code as SystemRole,
        isPrimary: org.isPrimary,
      })),
    };
  };
  
  /**
   * Helper para verificar si una sesión está expirada
   */
  export const isSessionExpired = (sessionInfo: SessionInfo): boolean => {
    return new Date(sessionInfo.expiresAt) < new Date();
  };
  
  /**
   * Helper para verificar si un token está expirado
   */
  export const isTokenExpired = (tokenExpiry: number): boolean => {
    return tokenExpiry * 1000 < Date.now();
  };
