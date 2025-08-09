// src/context/AuthContext.tsx
// Auth context enterprise-grade con Amplify v6
// ADAPTADO para API Gateway + Auth-Service integration

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  signIn, 
  signOut, 
  getCurrentUser, 
  fetchAuthSession,
  resetPassword,
  confirmResetPassword,
  type AuthUser
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import toast from 'react-hot-toast';

// ============================================
// TYPES (siguiendo tu guía arquitectónica)
// ============================================

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
  preferences: Record<string, any>;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

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

interface AuthContextType extends AuthState {
  // Authentication methods
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  confirmResetPassword: (data: ConfirmResetPasswordData) => Promise<void>;
  
  // Utility methods
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  
  // Token management
  getAccessToken: () => Promise<string | null>;
  isTokenValid: () => Promise<boolean>;
}

// ===================================
// API CLIENT PARA AUTH-SERVICE
// ===================================

// ✅ MEJORA 1: Se extrae la URL a una constante fuera de la clase para una validación temprana.
const API_GATEWAY_URL = import.meta.env['VITE_API_GATEWAY_URL'];

// ✅ MEJORA 2: Se verifica que la URL exista. Si no, se lanza un error descriptivo.
// Esto previene errores silenciosos en las llamadas a la API más adelante.
if (!API_GATEWAY_URL) {
  throw new Error(
    'Error de configuración crítica: La variable de entorno VITE_API_GATEWAY_URL no está definida.'
  );
}

// ============================================
// API CLIENT PARA AUTH-SERVICE
// ============================================

class AuthServiceClient {
  private readonly baseUrl: string;

  constructor() {
    // Usar API Gateway como punto único de entrada
    this.baseUrl = API_GATEWAY_URL;
  }

  /**
   * Obtiene datos completos del usuario desde auth-service
   * Usa el endpoint GET /api/users/me
   */
  async getCurrentUserFromService(accessToken: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('User not found in auth-service');
          return null;
        }
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const userData = await response.json();
      
      // Mapear respuesta del auth-service a nuestro User interface
      // Siguiendo la guía TypeScript: validación antes de usar
      const mappedUser: User = {
        id: this.safeExtractString(userData, 'id'),
        email: this.safeExtractString(userData, 'email'),
        nombre: this.safeExtractString(userData, 'name', userData.email?.split('@')[0] || 'Usuario'),
        cognitoSub: this.safeExtractString(userData, 'cognitoSub'),
        roles: this.safeExtractArray(userData, 'roles'),
        organizationId: this.safeExtractNumber(userData, 'organizationId'),
        churchId: this.safeExtractNumber(userData, 'churchId'),
        isActive: this.safeExtractBoolean(userData, 'isActive', true),
        lastLoginAt: this.safeExtractString(userData, 'lastLoginAt'),
        preferences: this.safeExtractObject(userData, 'preferences'),
      };

      return mappedUser;
    } catch (error) {
      console.error('Error fetching user from auth-service:', error);
      return null;
    }
  }

  // ============================================
  // UTILITY METHODS SIGUIENDO GUÍA TYPESCRIPT
  // ============================================

  private safeExtractString(obj: unknown, key: string, defaultValue: string = ''): string {
    if (typeof obj === 'object' && obj !== null && key in obj) {
      const value = (obj as Record<string, unknown>)[key];
      return typeof value === 'string' ? value : defaultValue;
    }
    return defaultValue;
  }

  private safeExtractNumber(obj: unknown, key: string): number | undefined {
    if (typeof obj === 'object' && obj !== null && key in obj) {
      const value = (obj as Record<string, unknown>)[key];
      return typeof value === 'number' ? value : undefined;
    }
    return undefined;
  }

  private safeExtractBoolean(obj: unknown, key: string, defaultValue: boolean = false): boolean {
    if (typeof obj === 'object' && obj !== null && key in obj) {
      const value = (obj as Record<string, unknown>)[key];
      return typeof value === 'boolean' ? value : defaultValue;
    }
    return defaultValue;
  }

  private safeExtractArray(obj: unknown, key: string): string[] {
    if (typeof obj === 'object' && obj !== null && key in obj) {
      const value = (obj as Record<string, unknown>)[key];
      return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
    }
    return [];
  }

  private safeExtractObject(obj: unknown, key: string): Record<string, any> {
    if (typeof obj === 'object' && obj !== null && key in obj) {
      const value = (obj as Record<string, unknown>)[key];
      return (typeof value === 'object' && value !== null) ? value as Record<string, any> : {};
    }
    return {};
  }
}

// ============================================
// CONTEXT CREATION
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// AUTH PROVIDER COMPONENT
// ============================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
  });

  const authServiceClient = new AuthServiceClient();

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const setAuthState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const parseUserFromCognito = useCallback(async (authUser: AuthUser): Promise<User> => {
    try {
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken;
      
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // NUEVA FUNCIONALIDAD: Obtener datos completos desde auth-service
      const serviceUser = await authServiceClient.getCurrentUserFromService(accessToken.toString());
      
      if (serviceUser) {
        // Si auth-service tiene datos completos, usarlos
        return serviceUser;
      }

      // Fallback: Extraer datos básicos del token Cognito (como antes)
      const attributes = authUser.signInDetails?.loginId ? {
        email: authUser.signInDetails.loginId,
      } : {};

      // Siguiendo guía TypeScript: validación segura del payload del token
      const payload = accessToken.payload;
      const cognitoGroups = Array.isArray(payload['cognito:groups']) 
        ? payload['cognito:groups'] as string[]
        : [];

      const customOrgId = typeof payload['custom:organizationId'] === 'string' 
        ? parseInt(payload['custom:organizationId'], 10) 
        : undefined;

      const customChurchId = typeof payload['custom:churchId'] === 'string' 
        ? parseInt(payload['custom:churchId'], 10) 
        : undefined;

      const userData: User = {
        id: authUser.userId,
        email: attributes.email || '',
        nombre: attributes.email?.split('@')[0] || 'Usuario',
        cognitoSub: authUser.userId,
        roles: cognitoGroups,
        organizationId: customOrgId,
        churchId: customChurchId,
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        preferences: {},
      };

      return userData;
    } catch (error) {
      console.error('Error parsing user from Cognito:', error);
      throw new Error('Failed to parse user data');
    }
  }, [authServiceClient]);

  // ============================================
  // AUTHENTICATION METHODS (SIN CAMBIOS)
  // ============================================

  const handleSignIn = useCallback(async ({ email, password }: SignInCredentials) => {
    try {
      setAuthState({ isLoading: true });
      
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      });

      if (isSignedIn) {
        // Get current user and update state
        const authUser = await getCurrentUser();
        const userData = await parseUserFromCognito(authUser);
        
        setAuthState({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        });
        
        toast.success(`¡Bienvenido, ${userData.nombre}!`);
      } else {
        // Handle MFA or other required steps
        if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_SMS_CODE') {
          toast('Se ha enviado un código de verificación a tu teléfono', {
            icon: '📱',
            duration: 5000,
          });
          // TODO: Navigate to MFA confirmation screen
        }
        setAuthState({ isLoading: false });
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthState({ isLoading: false });
      
      // Handle specific Cognito errors
      switch (error.name) {
        case 'UserNotConfirmedException':
          toast.error('Por favor, confirma tu cuenta antes de iniciar sesion');
          break;
        case 'NotAuthorizedException':
          toast.error('Email o contraseña incorrectos');
          break;
        case 'UserNotFoundException':
          toast.error('Usuario no encontrado');
          break;
        case 'TooManyRequestsException':
          toast.error('Demasiados intentos. Intenta nuevamente mas tarde');
          break;
        default:
          toast.error('Error al iniciar sesion. Intenta nuevamente');
      }
      throw error;
    }
  }, [parseUserFromCognito, setAuthState]);

  const handleSignOut = useCallback(async () => {
    try {
      setAuthState({ isLoading: true });
      
      await signOut();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      // Clear any local storage or cache
      localStorage.removeItem('crm_cache');
      sessionStorage.clear();
      
      toast.success('Sesion cerrada correctamente');
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthState({ isLoading: false });
      toast.error('Error al cerrar sesion');
      throw error;
    }
  }, [setAuthState]);

  const handleResetPassword = useCallback(async ({ email }: ResetPasswordData) => {
    try {
      await resetPassword({ username: email });
      toast.success('Se ha enviado un codigo de recuperacion a tu email');
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      switch (error.name) {
        case 'UserNotFoundException':
          toast.error('Usuario no encontrado');
          break;
        case 'LimitExceededException':
          toast.error('Demasiados intentos. Intenta más tarde');
          break;
        default:
          toast.error('Error al enviar codigo de recuperacion');
      }
      throw error;
    }
  }, []);

  const handleConfirmResetPassword = useCallback(async ({ 
    email, 
    code, 
    newPassword 
  }: ConfirmResetPasswordData) => {
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
      toast.success('Contraseña actualizada correctamente');
    } catch (error: any) {
      console.error('Confirm reset password error:', error);
      
      switch (error.name) {
        case 'CodeMismatchException':
          toast.error('Codigo de verificacion incorrecto');
          break;
        case 'ExpiredCodeException':
          toast.error('El codigo ha expirado. Solicita uno nuevo');
          break;
        default:
          toast.error('Error al actualizar contraseña');
      }
      throw error;
    }
  }, []);

  // ============================================
  // UTILITY METHODS (MEJORADOS)
  // ============================================

  const refreshUser = useCallback(async () => {
    try {
      const authUser = await getCurrentUser();
      const userData = await parseUserFromCognito(authUser);
      setAuthState({ user: userData });
    } catch (error) {
      console.error('Error refreshing user:', error);
      // Don't throw here, just log
    }
  }, [parseUserFromCognito, setAuthState]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.user || !state.isAuthenticated) return false;
    
    // Siguiendo guía TypeScript: validación antes de usar
    const userRoles = state.user.roles;
    if (!Array.isArray(userRoles)) return false;

    return userRoles.some(role => {
      // Example permission mapping - ajusta según tu SecurityService
      const permissionMap: Record<string, string[]> = {
        'ADMIN': ['*'],
        'ORG_ADMIN': ['contacts:*', 'deals:*', 'reports:read'],
        'CHURCH_ADMIN': ['contacts:read', 'contacts:write', 'deals:read', 'deals:write'],
        'MANAGER': ['contacts:read', 'contacts:write', 'deals:read', 'deals:write'],
        'USER': ['contacts:read', 'deals:read'],
      };
      
      const allowedPermissions = permissionMap[role] || [];
      return allowedPermissions.includes('*') || allowedPermissions.includes(permission);
    });
  }, [state.user, state.isAuthenticated]);

  const hasRole = useCallback((role: string): boolean => {
    if (!state.user?.roles || !Array.isArray(state.user.roles)) return false;
    return state.user.roles.includes(role);
  }, [state.user]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken;
      return token ? token.toString() : null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }, []);

  const isTokenValid = useCallback(async (): Promise<boolean> => {
    try {
      const session = await fetchAuthSession();
      return !!session.tokens?.accessToken;
    } catch (error) {
      return false;
    }
  }, []);

  // ============================================
  // INITIALIZATION & AUTH LISTENER (SIN CAMBIOS)
  // ============================================

  // En AuthContext.tsx - reemplaza todo el useEffect

  useEffect(() => {
    let isMounted = true;
    console.log('AuthContext: useEffect MOUNTED');
  
    const initAuth = async () => {
      console.log('AuthContext: initAuth START. Current state:', { isInitialized: state.isInitialized, isLoading: state.isLoading });
      
      if (state.isInitialized) {
        console.log('AuthContext: Already initialized, skipping.');
        // Si ya está inicializado, nos aseguramos de que no se quede cargando.
        if (state.isLoading) setAuthState({ isLoading: false });
        return;
      }
      
      try {
        console.log('AuthContext: Calling getCurrentUser()...');
        const authUser = await getCurrentUser();
        console.log('AuthContext: getCurrentUser() SUCCESS', authUser);
        
        console.log('AuthContext: Calling parseUserFromCognito()...');
        const userData = await parseUserFromCognito(authUser);
        console.log('AuthContext: parseUserFromCognito() SUCCESS', userData);
  
        if (isMounted) {
          console.log('AuthContext: Setting AUTHENTICATED state');
          setAuthState({
            user: userData,
            isAuthenticated: true,
          });
        }
  
      } catch (error) {
        console.log('AuthContext: CAUGHT an error in initAuth', error);
        
        if (isMounted) {
          console.log('AuthContext: Setting UNAUTHENTICATED state due to error.');
          setAuthState({
            user: null,
            isAuthenticated: false,
          });
        }
      } finally {
        console.log('AuthContext: FINALLY block reached. Setting isLoading: false, isInitialized: true');
        if (isMounted) {
          setAuthState({
            isLoading: false,
            isInitialized: true,
          });
        }
      }
    };
  
    initAuth();
  
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (!isMounted) return;
      console.log(`AuthContext: Hub event received: ${payload.event}`);
      // ... tu lógica de Hub ...
    });
  
    return () => {
      isMounted = false;
      unsubscribe();
      console.log('AuthContext: useEffect UNMOUNTED');
    };
  }, [state.isInitialized, setAuthState, parseUserFromCognito, refreshUser]);

  // ============================================
  // CONTEXT VALUE (SIN CAMBIOS)
  // ============================================

  const contextValue: AuthContextType = {
    ...state,
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    confirmResetPassword: handleConfirmResetPassword,
    refreshUser,
    hasPermission,
    hasRole,
    getAccessToken,
    isTokenValid,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// HOOKS (SIN CAMBIOS)
// ============================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthToken = () => {
  const { getAccessToken } = useAuth();
  return { getAccessToken };
};

export const usePermissions = () => {
  const { hasPermission, hasRole, user } = useAuth();
  
  return {
    hasPermission,
    hasRole,
    permissions: user?.roles || [],
    can: hasPermission,
    is: hasRole,
  };
};

export const useRequireAuth = () => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      // Redirect to login or show login modal
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading, isInitialized]);
  
  return { isAuthenticated, isLoading, isInitialized };
};