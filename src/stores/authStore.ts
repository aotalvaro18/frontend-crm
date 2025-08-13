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
  CognitoSession,
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

console.log('🆘 EMERGENCY DEBUG: authStore.ts loaded at:', new Date().toISOString());
console.log('🆘 EMERGENCY DEBUG: Code version check');

// ============================================
// AUTH SERVICE CLIENT (Interno al store)
// ============================================

class AuthServiceClient {
  private baseURL: string;

  constructor() {
    console.log('🆘 EMERGENCY: AuthServiceClient constructor called');
    this.baseURL = import.meta.env['VITE_API_GATEWAY_URL'] || 'http://localhost:8080';
    console.log('🆘 EMERGENCY: baseURL set to:', this.baseURL);

    if (!this.baseURL || this.baseURL === 'http://localhost:8080') {
      authLogger.warn('VITE_API_GATEWAY_URL not configured properly, using fallback');
    }
  }

  async getCurrentUserFromService(accessToken: string): Promise<User | null> {
    try {
      authLogger.info('Fetching user profile from auth-service');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 2 segundos
      
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
// ESTADO INICIAL (MODIFICADO)
// ============================================

const initialState: AuthState = {
  // Core user data
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastError: null,
  
  // MFA state
  isMfaRequired: false,
  mfaType: undefined,
  
  // Session data
  accessToken: null,
  sessionExpiry: undefined,
  lastActivity: undefined,
  cognitoSession: null,
  
  // Loading states
  isLoadingSession: false,
  isLoadingProfile: false,
  
  // Computed properties
  get isReady() { 
    return !this.isLoadingSession; 
  },
  get hasProfile() { 
    return !!this.user; 
  },
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
        // NEW GRANULAR FUNCTIONS
        // ============================================

        loadCognitoSession: async () => {
          set({ isLoadingSession: true, error: null });
          
          try {
            const authUser = await getCurrentUser();
            const session = await fetchAuthSession();
            const accessToken = session.tokens?.accessToken?.toString();
            
            if (authUser && accessToken && session.tokens) {
              const cognitoSession: CognitoSession = {
                accessToken,
                refreshToken: (session.tokens as any)?.refreshToken?.toString(),
                idToken: session.tokens.idToken?.toString(),
                expiresAt: (session.tokens.accessToken.payload.exp as number) * 1000
              };
              
              set({ 
                cognitoSession,
                accessToken,
                sessionExpiry: cognitoSession.expiresAt,
                isAuthenticated: true,
                lastActivity: Date.now()
              });
              
              authLogger.success('Cognito session loaded successfully');
            } else {
              set({ 
                cognitoSession: null,
                accessToken: null,
                isAuthenticated: false
              });
              authLogger.info('No valid Cognito session found');
            }
          } catch (error) {
            authLogger.info('No authenticated user found', error);
            set({ 
              cognitoSession: null,
              accessToken: null,
              isAuthenticated: false,
              error: null // Normal state, not an error
            });
          } finally {
            set({ isLoadingSession: false });
          }
        },
        
        loadUserProfile: async () => {
          const { cognitoSession } = get();
          if (!cognitoSession) {
            set({ user: null });
            return;
          }
          
          set({ isLoadingProfile: true, error: null });
          
          try {
            authLogger.info('Loading user profile from auth-service');
            
            // Try auth-service first
            let userProfile = await authServiceClient.getCurrentUserFromService(
              cognitoSession.accessToken
            );
            
            // Fallback to Cognito data
            if (!userProfile) {
              authLogger.info('Auth-service failed, using Cognito fallback');
              const authUser = await getCurrentUser();
              const session = await fetchAuthSession();
              userProfile = extractUserFromCognito(authUser, session);
            }
            
            set({ user: userProfile });
            authLogger.success('User profile loaded successfully', { 
              email: userProfile.email,
              source: userProfile.id.length > 10 ? 'auth-service' : 'cognito'
            });
          } catch (error) {
            authLogger.error('Failed to load user profile', error);
            set({ user: null, error: getErrorMessage(error) });
          } finally {
            set({ isLoadingProfile: false });
          }
        },

        // ============================================
        // CORE METHODS (MODIFICADOS)
        // ============================================

        initialize: async () => {
          authLogger.info('Initializing auth store...');
          
          // 1. Load Cognito session
          await get().loadCognitoSession();
          
          // 2. Load user profile if authenticated
          const state = get();
          if (state.isAuthenticated && !state.user) {
            await get().loadUserProfile();
          }
          
          authLogger.success('Auth store initialization completed');
        },
        
        signIn: async (credentials: SignInCredentials) => {
          authLogger.info('Sign in attempt', { email: credentials.email });
          set({ isLoading: true, error: null, lastError: null });
          
          try {
            // 1. Cognito sign in
            const { isSignedIn, nextStep } = await signIn({ 
              username: credentials.email, 
              password: credentials.password 
            });
            
            if (isSignedIn) {
              authLogger.success('Cognito sign in successful');
              
              // 2. Load session
              await get().loadCognitoSession();
              
              // 3. Load profile if authenticated
              if (get().isAuthenticated) {
                await get().loadUserProfile();
              }
              
              // 4. Success feedback
              const { user } = get();
              if (user) {
                toast.success(`¡Bienvenido, ${user.nombre}!`);
              }
              
            } else if (nextStep) {
              // Handle MFA if required
              authLogger.info('MFA required', { step: nextStep.signInStep });
              
              set({
                isMfaRequired: true,
                mfaType: nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_SMS_CODE' 
                  ? 'SMS_MFA' 
                  : 'SOFTWARE_TOKEN_MFA',
                isLoading: false,
              });
            }
          } catch (error: any) {
            authLogger.error('Sign in failed', error);
            
            const authError = createAuthError(
              getErrorMessage(error),
              error.name || 'SignInError',
              'AUTH_ERROR'
            );
            
            set({ 
              error: authError.message,
              lastError: authError,
              isLoading: false,
              isMfaRequired: false,
            });
            
            toast.error(authError.message);
          } finally {
            set({ isLoading: false });
          }
        },

        signOut: async () => {
          authLogger.info('Sign out attempt');
          set({ isLoading: true });
          
          try {
            await signOut();
            
            set({
              ...initialState,
              isLoadingSession: false,
              isLoadingProfile: false,
            });
            
            authLogger.success('Sign out successful');
            toast.success('Sesión cerrada correctamente');
            
          } catch (error: any) {
            authLogger.error('Sign out failed', error);
            
            // Clear local state anyway
            set({
              ...initialState,
              isLoadingSession: false,
              isLoadingProfile: false,
              error: 'Error al cerrar sesión, pero se limpió el estado local',
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
      if (store.isReady) { // CAMBIO: usar isReady en vez de isInitialized
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
// CONVENIENCE HOOKS (ACTUALIZADOS)
// ============================================

/**
 * Hook optimizado para obtener solo el estado de auth
 */
export const useAuthState = () => useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  isReady: state.isReady, // CAMBIO: usar isReady en vez de isInitialized
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