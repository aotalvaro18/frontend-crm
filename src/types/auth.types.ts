// src/types/auth.types.ts
// ✅ INTERFACES UNIFICADAS - UNA SOLA FUENTE DE VERDAD
// Versión optimizada con AuthStore interface

// ============================================
// CORE AUTH INTERFACES (UNIFICADAS)
// ============================================

/**
 * ✅ INTERFACE USER ÚNICA Y ROBUSTA
 * Esta es la única definición de User en toda la aplicación
 */
export interface User {
  id: string;
  email: string;
  nombre: string;
  cognitoSub: string;
  roles: string[];
  organizationId?: number;
  churchId?: number;
  isActive: boolean;
  lastLoginAt?: string;
  profilePicture?: string;
  preferences: Record<string, any>;
}

/**
 * ✅ AUTH STATE UNIFICADO
 * Usado tanto por AuthStore como por AuthContext
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  lastError: AuthError | null;
  isMfaRequired: boolean;
  mfaType?: 'SMS_MFA' | 'SOFTWARE_TOKEN_MFA';
  accessToken: string | null;
  sessionExpiry?: number;
  lastActivity?: number;
}

/**
 * ✅ ERROR TYPE ROBUSTO
 */
export interface AuthError {
  message: string;
  code: string;
  type: 'AUTH_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'TOKEN_ERROR';
  canRetry: boolean;
  timestamp: string;
  path?: string;
  status?: number;
  details?: Record<string, any>;
}

// ============================================
// AUTH ACTIONS INTERFACE
// ============================================

export interface AuthActions {
  // Core authentication
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Session management
  initialize: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  
  // Aliases for compatibility
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  confirmMFA: (code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  checkSession: () => Promise<boolean>;
  isTokenValid: () => Promise<boolean>;
  
  // UI state
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Internal
  initializeAuth: () => Promise<void>;
  checkAuthState: () => Promise<boolean>;
  handleAuthEvent: (event: string, data?: any) => void;
}

// ============================================
// ✅ ZUSTAND STORE INTERFACE (NUEVA)
// Combina el estado con las acciones para un tipado completo del store
// ============================================

export interface AuthStore extends AuthState, AuthActions {}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ConfirmResetPasswordData {
  email: string;
  code: string;
  newPassword: string;
}

export interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  error?: string;
}

// ============================================
// SERVICE USER (AUTH-SERVICE INTEGRATION)
// ============================================

export interface ServiceUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  cognitoSub: string;
  organizationId?: number;
  churchId?: number;
  roles: string[];
  isActive: boolean;
  lastLoginAt?: string;
  preferences: Record<string, any>;
  profilePicture?: string;
}

// ============================================
// TYPE GUARDS
// ============================================

export const isUser = (obj: unknown): obj is User => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as User).id === 'string' &&
    typeof (obj as User).email === 'string' &&
    typeof (obj as User).cognitoSub === 'string' &&
    Array.isArray((obj as User).roles)
  );
};

export const isAuthError = (obj: unknown): obj is AuthError => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as AuthError).message === 'string' &&
    typeof (obj as AuthError).code === 'string' &&
    typeof (obj as AuthError).type === 'string'
  );
};

export const isServiceUser = (obj: unknown): obj is ServiceUser => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as ServiceUser).id === 'number' &&
    typeof (obj as ServiceUser).email === 'string' &&
    typeof (obj as ServiceUser).cognitoSub === 'string'
  );
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convierte ServiceUser a User (formato interno)
 */
export const serviceUserToUser = (serviceUser: ServiceUser): User => {
  return {
    id: serviceUser.id.toString(),
    email: serviceUser.email,
    nombre: `${serviceUser.firstName} ${serviceUser.lastName}`.trim(),
    cognitoSub: serviceUser.cognitoSub,
    roles: serviceUser.roles,
    organizationId: serviceUser.organizationId,
    churchId: serviceUser.churchId,
    isActive: serviceUser.isActive,
    lastLoginAt: serviceUser.lastLoginAt,
    profilePicture: serviceUser.profilePicture,
    preferences: serviceUser.preferences,
  };
};

/**
 * Crea un AuthError consistente
 */
export const createAuthError = (
  message: string,
  code: string,
  type: AuthError['type'] = 'AUTH_ERROR',
  details?: Record<string, any>
): AuthError => {
  return {
    message,
    code,
    type,
    canRetry: type !== 'VALIDATION_ERROR',
    timestamp: new Date().toISOString(),
    details,
  };
};

/**
 * Extrae mensaje de error de manera segura
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  
  if (error && typeof error === 'object') {
    const err = error as any;
    return err.message || err.error || err.code || 'Error desconocido';
  }
  
  return 'Error desconocido';
};

/**
 * Logger mejorado para auth operations
 */
export const authLogger = {
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`🔐 Auth: ${message}`, data || '');
    }
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ Auth Warning: ${message}`, data || '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`❌ Auth Error: ${message}`, error || '');
  },
  
  success: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`✅ Auth Success: ${message}`, data || '');
    }
  }
};