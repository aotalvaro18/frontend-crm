// src/stores/authStore.ts
// ✅ AUTH STORE SIMPLIFICADO Y ENFOCADO - VERSIÓN OPTIMIZADA
// Su única responsabilidad es la autenticación del usuario.

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  signIn, 
  signOut, 
  getCurrentUser, 
  fetchAuthSession, 
  type AuthUser, 
  type AuthSession 
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import toast from 'react-hot-toast';

// 1. Importamos solo los TIPOS con 'import type'.
import type { 
  AuthStore, 
  AuthState, 
  User,
  SignInCredentials,
  ServiceUser
} from '@/types/auth.types';

// 2. Importamos los VALORES (funciones y objetos) con un 'import' normal.
import { 
  serviceUserToUser,
  createAuthError,
  getErrorMessage,
  authLogger 
} from '@/types/auth.types';

// ============================================
// AUTH SERVICE CLIENT (Interno al store)
// ============================================

class AuthServiceClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env['VITE_API_GATEWAY_URL'] || 'http://localhost:8080';
    
    if (!this.baseURL || this.baseURL === 'http://localhost:8080') {
      authLogger.warn('VITE_API_GATEWAY_URL not configured properly, using fallback');
    }
  }

  async getCurrentUserFromService(accessToken: string): Promise<User | null> {
    try {
      authLogger.info('Fetching user profile from auth-service');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos
      
      const response = await fetch(`${this.baseURL}/api/users/me`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          authLogger.info('User not found in auth-service, using Cognito fallback');
          return null;
        }
        throw new Error(`Auth service error: ${response.status}`);
      }
      
      const serviceUser: ServiceUser = await response.json();
      const user = serviceUserToUser(serviceUser);
      
      authLogger.success('User profile loaded from auth-service', { email: user.email });
      return user;
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        authLogger.warn('Auth service timeout (2s), using Cognito fallback');
      } else {
        authLogger.warn('Failed to fetch user profile from service, using Cognito fallback', error);
      }
      return null;
    }
  }
}

// ============================================
// HELPER FUNCTION
// ============================================

const extractUserFromCognito = (authUser: AuthUser, session: AuthSession): User => {
  const payload = session.tokens?.accessToken?.payload ?? {};
  
  // ✅ Extracción más robusta con fallbacks
  const email = authUser.signInDetails?.loginId || payload['email'] as string || '';
  const name = payload['name'] as string || payload['given_name'] as string || email.split('@')[0] || 'Usuario';
  const roles = (payload['cognito:groups'] as string[]) || [];
  
  // ✅ Parsing seguro de IDs numéricos
  const parseOptionalNumber = (value: unknown): number | undefined => {
    if (typeof value === 'string' && value) {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    return typeof value === 'number' ? value : undefined;
  };

  const user: User = {
    id: authUser.userId,
    cognitoSub: authUser.userId,
    email,
    nombre: name,
    roles,
    organizationId: parseOptionalNumber(payload['custom:organizationId']),
    churchId: parseOptionalNumber(payload['custom:churchId']),
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    preferences: {},
  };

  authLogger.info('User extracted from Cognito', { email: user.email, roles: user.roles });
  return user;
};

// ============================================
// SINGLETON AUTH SERVICE INSTANCE
// ============================================

const authServiceClient = new AuthServiceClient();

// ============================================
// ESTADO INICIAL
// ============================================

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,
  lastError: null,
  isMfaRequired: false,
  mfaType: undefined,
  accessToken: null,
  sessionExpiry: undefined,
  lastActivity: undefined,
};

// ============================================
// AUTH STORE
// ============================================

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ============================================
        // CORE METHODS
        // ============================================

        initialize: async () => {
          const currentState = get();
          if (currentState.isInitialized) {
            authLogger.info('Auth store already initialized, skipping');
            return;
          }
          
          authLogger.info('Initializing auth store...');
          set({ isLoading: true });
          
          try {
            const authUser = await getCurrentUser();
            const session = await fetchAuthSession();
            const accessToken = session.tokens?.accessToken?.toString();

            if (authUser && accessToken) {
              authLogger.info('Valid Cognito session found');
              
              // ✅ Intentar obtener perfil completo del auth-service
              let userProfile = await authServiceClient.getCurrentUserFromService(accessToken);
              
              // ✅ Fallback a datos de Cognito si auth-service falla
              if (!userProfile) {
                userProfile = extractUserFromCognito(authUser, session);
              }

              const sessionExpiry = session.tokens?.accessToken?.payload?.exp 
                ? (session.tokens.accessToken.payload.exp as number) * 1000 
                : undefined;

              set({
                user: userProfile,
                isAuthenticated: true,
                accessToken,
                sessionExpiry,
                lastActivity: Date.now(),
                isLoading: false,
                isInitialized: true,
                error: null,
              });

              authLogger.success('Auth store initialized successfully', { 
                email: userProfile.email,
                source: userProfile.id.length > 10 ? 'auth-service' : 'cognito'
              });
            } else {
              authLogger.info('No valid session found');
              set({ 
                isLoading: false, 
                isInitialized: true,
                isAuthenticated: false,
                user: null 
              });
            }
          } catch (error) {
            authLogger.info('No authenticated user found (normal on first visit)', error);
            set({ 
              isLoading: false, 
              isInitialized: true,
              isAuthenticated: false,
              user: null,
              error: null // ✅ No mostrar error para usuarios no autenticados
            });
          }
        },
        
        signIn: async (credentials: SignInCredentials) => {
          authLogger.info('Sign in attempt', { email: credentials.email });
          set({ isLoading: true, error: null, lastError: null });
          
          try {
            const { isSignedIn, nextStep } = await signIn({ 
              username: credentials.email, 
              password: credentials.password 
            });
            
            if (isSignedIn) {
              authLogger.success('Sign in successful');
              
              // ✅ Re-inicializar para obtener perfil completo
              await get().initialize();
              
              const user = get().user;
              if (user) {
                toast.success(`¡Bienvenido, ${user.nombre}!`);
              }
            } else if (nextStep) {
              // ✅ Manejar MFA si es necesario
              authLogger.info('MFA required', { step: nextStep.signInStep });
              
              set({
                isMfaRequired: true,
                mfaType: nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_SMS_CODE' ? 'SMS_MFA' : 'SOFTWARE_TOKEN_MFA',
                isLoading: false,
              });
              
              toast('Se requiere verificación adicional', {
                icon: '🔐',
                duration: 5000,
              });
            }
          } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            const authError = createAuthError(errorMessage, error.name || 'SIGNIN_ERROR');
            
            authLogger.error('Sign in failed', error);
            
            set({ 
              error: errorMessage,
              lastError: authError,
              isLoading: false 
            });
            
            toast.error(errorMessage);
            throw error;
          }
        },

        signOut: async () => {
          authLogger.info('Sign out initiated');
          set({ isLoading: true });
          
          try {
            await signOut();
            
            // ✅ Limpiar completamente el estado
            set({ 
              ...initialState, 
              isLoading: false, 
              isInitialized: true 
            });
            
            // ✅ Limpiar caches locales
            localStorage.removeItem('crm_cache');
            sessionStorage.clear();
            
            authLogger.success('Sign out completed');
            toast.success('Sesión cerrada correctamente');
            
          } catch (error) {
            authLogger.error('Sign out failed', error);
            
            // ✅ Limpiar estado aún si hay error
            set({ 
              ...initialState, 
              isLoading: false, 
              isInitialized: true 
            });
            
            toast.error('Error al cerrar sesión');
          }
        },
        
        getAccessToken: async () => {
          try {
            authLogger.info('Getting access token...');
            
            const session = await fetchAuthSession({ forceRefresh: true });
            const token = session.tokens?.accessToken?.toString();
            
            if (token) {
              const sessionExpiry = session.tokens?.accessToken?.payload?.exp 
                ? (session.tokens.accessToken.payload.exp as number) * 1000 
                : undefined;
              
              set({ 
                accessToken: token,
                sessionExpiry,
                lastActivity: Date.now(),
              });
              
              authLogger.info('Access token updated');
            }
            
            return token || null;
          } catch (error) {
            authLogger.warn('Failed to get access token', error);
            return null;
          }
        },

        // ============================================
        // ALIAS METHODS (Para compatibilidad)
        // ============================================

        login: (email: string, password: string) => get().signIn({ email, password }),
        logout: () => get().signOut(),
        
        confirmMFA: async (_code: string) => { 
          authLogger.warn('confirmMFA not fully implemented');
          // TODO: Implementar MFA confirmation
        },
        
        forgotPassword: async (_email: string) => { 
          authLogger.warn('forgotPassword not fully implemented');
          // TODO: Implementar password reset
        },
        
        resetPasswordWithCode: async (_email: string, _code: string, _newPassword: string) => { 
          authLogger.warn('resetPasswordWithCode not fully implemented');
          // TODO: Implementar password reset confirmation
        },
        
        refreshUser: () => get().initialize(),
        
        refreshToken: async () => { 
          const token = await get().getAccessToken(); 
          return !!token;
        },
        
        checkSession: async () => { 
          try { 
            const session = await fetchAuthSession(); 
            return !!session.tokens?.accessToken;
          } catch { 
            return false; 
          } 
        },
        
        isTokenValid: async () => get().checkSession(),
        
        clearError: () => set({ error: null, lastError: null }),
        
        setLoading: (isLoading: boolean) => set({ isLoading }),
        
        initializeAuth: () => get().initialize(),
        
        checkAuthState: () => get().checkSession(),
        
        handleAuthEvent: (event: string, data?: any) => {
          authLogger.info(`Auth event received: ${event}`, data);
          
          // ✅ Manejo básico de eventos Hub
          switch (event) {
            case 'signedIn':
            case 'signedOut':
            case 'tokenRefresh':
              get().initialize();
              break;
            default:
              authLogger.info(`Unhandled auth event: ${event}`);
          }
        },
      }),
      {
        name: 'auth-store',
        // ✅ Persist config optimizado
        partialize: (state) => ({ 
          isAuthenticated: state.isAuthenticated,
          user: state.user ? {
            id: state.user.id,
            email: state.user.email,
            nombre: state.user.nombre,
          } : null, // Solo persistir datos básicos del usuario
        }),
        version: 1, // ✅ Versioning para migrations futuras
      }
    ),
    {
      name: 'AuthStore',
      // ✅ Solo incluir en devtools en desarrollo
      enabled: import.meta.env.DEV,
    }
  )
);

// ============================================
// HUB LISTENER SETUP (UNA SOLA VEZ)
// ============================================

let hubListenerConfigured = false;

const setupHubListener = () => {
  if (hubListenerConfigured) return;
  
  authLogger.info('Setting up Hub listener...');
  
  Hub.listen('auth', (capsule: any) => {
    const { payload } = capsule;
    const { event, data } = payload;
    
    authLogger.info(`Hub event: ${event}`, data);
    
    // ✅ Solo reinicializar en eventos relevantes
    if (['signedIn', 'signedOut', 'tokenRefresh'].includes(event)) {
      const store = useAuthStore.getState();
      if (store.isInitialized) {
        store.initialize();
      }
    }
  });
  
  hubListenerConfigured = true;
  authLogger.success('Hub listener configured');
};

// ✅ Configurar listener automáticamente
setupHubListener();

// ============================================
// CONVENIENCE HOOKS
// ============================================

/**
 * Hook optimizado para obtener solo el estado de auth
 */
export const useAuthState = () => useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  isInitialized: state.isInitialized,
  error: state.error,
}));

/**
 * Hook para obtener solo las acciones
 */
export const useAuthActions = () => useAuthStore((state) => ({
  signIn: state.signIn,
  signOut: state.signOut,
  initialize: state.initialize,
  getAccessToken: state.getAccessToken,
  clearError: state.clearError,
}));

/**
 * Hook para verificar autenticación
 */
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);

/**
 * Hook para obtener usuario actual
 */
export const useCurrentUser = () => useAuthStore((state) => state.user);