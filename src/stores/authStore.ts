 // src/stores/authStore.ts
// ✅ AuthStore empresarial con Zustand + Amplify v6
// 100% ceñido a la guía arquitectónica y acoplado con AuthContext.tsx

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  signIn, 
  signOut, 
  getCurrentUser, 
  fetchAuthSession,
  confirmSignIn,
  resetPassword,
  confirmResetPassword,
  type AuthUser,
  type SignInInput,
  type ConfirmSignInInput
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import toast from 'react-hot-toast';
import { env } from '@/config/environment';

// ============================================
// TYPES SEGUROS (Siguiendo guía TypeScript)
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
  profilePicture?: string;
}

export interface AuthState {
  // User data
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // MFA state
  isMfaRequired: boolean;
  mfaType?: 'SMS' | 'TOTP';
  
  // Session info
  accessToken: string | null;
  sessionExpiry?: number;
  lastActivity?: number;
}

export interface AuthActions {
  // Authentication
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  confirmMFA: (code: string) => Promise<void>;
  
  // Password reset
  forgotPassword: (email: string) => Promise<void>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<void>;
  
  // Session management
  refreshUser: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  getAccessToken: () => Promise<string | null>;
  
  // UI state
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Internal
  initialize: () => Promise<void>;
  handleAuthEvent: (event: string, data?: any) => void;
}

export type AuthStore = AuthState & AuthActions;

// ============================================
// HELPER FUNCTIONS (Type-safe según guía)
// ============================================

/**
 * Extrae datos del usuario de Amplify de forma segura
 */
const extractUserFromAuthUser = (authUser: AuthUser, session: any): User => {
  // Type-safe extraction siguiendo la guía
  const safeGetString = (obj: any, key: string, defaultValue: string = ''): string => {
    const value = obj?.[key];
    return typeof value === 'string' ? value : defaultValue;
  };

  const safeGetNumber = (obj: any, key: string): number | undefined => {
    const value = obj?.[key];
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    return typeof value === 'number' ? value : undefined;
  };

  const safeGetArray = (obj: any, key: string, separator: string = ','): string[] => {
    const value = obj?.[key];
    if (typeof value === 'string' && value.length > 0) {
      return value.split(separator).filter(Boolean);
    }
    return [];
  };

  // Safe extraction from token payload
  const accessToken = session?.tokens?.accessToken;
  const payload = accessToken?.payload || {};
  const userAttributes = authUser?.signInDetails?.loginId
  ? { email: authUser.signInDetails.loginId }
  : {};

  return {
    id: authUser.userId || '',
    email: safeGetString(userAttributes, 'email') || safeGetString(authUser, 'signInDetails.loginId'),
    nombre: safeGetString(userAttributes, 'name') || 
            safeGetString(userAttributes, 'given_name') || 
            'Usuario',
    cognitoSub: authUser.userId || '',
    roles: safeGetArray(payload, 'custom:roles'),
    organizationId: safeGetNumber(payload, 'custom:organizationId'),
    churchId: safeGetNumber(payload, 'custom:churchId'),
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    profilePicture: safeGetString(userAttributes, 'picture'),
  };
};

/**
 * Determina si se requiere MFA basado en el resultado de sign-in
 */
const getMfaRequirement = (signInResult: any): { required: boolean; type?: 'SMS' | 'TOTP' } => {
  const nextStep = signInResult?.nextStep?.signInStep;
  
  if (nextStep === 'CONFIRM_SIGN_IN_WITH_SMS_CODE') {
    return { required: true, type: 'SMS' };
  }
  
  if (nextStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
    return { required: true, type: 'TOTP' };
  }
  
  return { required: false };
};

/**
 * Maneja errores de auth de forma tipada
 */
const handleAuthError = (error: unknown, defaultMessage: string): string => {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const authError = error as { name: string; message?: string };
    
    switch (authError.name) {
      case 'NotAuthorizedException':
        return 'Email o contraseña incorrectos';
      case 'UserNotConfirmedException':
        return 'Cuenta no confirmada. Verifica tu email';
      case 'PasswordResetRequiredException':
        return 'Debes restablecer tu contraseña';
      case 'UserNotFoundException':
        return 'Usuario no encontrado';
      case 'TooManyRequestsException':
        return 'Demasiados intentos. Intenta más tarde';
      case 'CodeMismatchException':
        return 'Código incorrecto';
      case 'ExpiredCodeException':
        return 'Código expirado';
      case 'InvalidPasswordException':
        return 'La contraseña no cumple los requisitos';
      default:
        return authError.message || defaultMessage;
    }
  }
  
  return defaultMessage;
};

// ============================================
// ZUSTAND STORE (Enterprise-grade)
// ============================================

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ============================================
        // INITIAL STATE
        // ============================================
        
        user: null,
        isAuthenticated: false,
        isLoading: true, // Start loading to check existing session
        error: null,
        isMfaRequired: false,
        mfaType: undefined,
        accessToken: null,
        sessionExpiry: undefined,
        lastActivity: Date.now(),

        // ============================================
        // AUTHENTICATION ACTIONS
        // ============================================

        login: async (email: string, password: string): Promise<void> => {
          set({ isLoading: true, error: null, isMfaRequired: false });

          try {
            const signInInput: SignInInput = {
              username: email,
              password,
            };

            const signInResult = await signIn(signInInput);
            const mfaRequirement = getMfaRequirement(signInResult);

            if (mfaRequirement.required) {
              set({ 
                isLoading: false,
                isMfaRequired: true,
                mfaType: mfaRequirement.type,
                error: null,
              });
              
              toast.success(
                mfaRequirement.type === 'SMS' 
                  ? 'Código SMS enviado. Por favor, verifica tu teléfono'
                  : 'Ingresa tu código de autenticación',
                { duration: 5000 }
              );
              return;
            }

            // Si no se requiere MFA, el login está completo
            if (signInResult.isSignedIn) {
              await get().refreshUser();
              toast.success('¡Bienvenido!', { duration: 3000 });
            }
          } catch (error: unknown) {
            console.error('Login error:', error);
            const errorMessage = handleAuthError(error, 'Error de inicio de sesión');
            
            set({ 
              isLoading: false,
              error: errorMessage,
              isMfaRequired: false,
            });

            toast.error(errorMessage, { duration: 5000 });
          }
        },

        confirmMFA: async (code: string): Promise<void> => {
          set({ isLoading: true, error: null });

          try {
            const confirmInput: ConfirmSignInInput = {
              challengeResponse: code,
            };

            const result = await confirmSignIn(confirmInput);

            if (result.isSignedIn) {
              await get().refreshUser();
              set({ isMfaRequired: false, mfaType: undefined });
              toast.success('Autenticación completada exitosamente');
            }
          } catch (error: unknown) {
            console.error('MFA confirmation error:', error);
            const errorMessage = handleAuthError(error, 'Error al confirmar el código');

            set({ 
              isLoading: false,
              error: errorMessage,
            });

            toast.error(errorMessage);
          }
        },

        logout: async (): Promise<void> => {
          set({ isLoading: true });

          try {
            await signOut();
            
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              isMfaRequired: false,
              mfaType: undefined,
              accessToken: null,
              sessionExpiry: undefined,
            });

            toast.success('Sesión cerrada exitosamente');
          } catch (error: unknown) {
            console.error('Logout error:', error);
            
            // Force logout on client even if server call fails
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              isMfaRequired: false,
              mfaType: undefined,
              accessToken: null,
              sessionExpiry: undefined,
            });

            toast.error('Error al cerrar sesión, pero se cerró localmente');
          }
        },

        // ============================================
        // PASSWORD RESET
        // ============================================

        forgotPassword: async (email: string): Promise<void> => {
          try {
            await resetPassword({ username: email });
            toast.success('Código de recuperación enviado a tu email');
          } catch (error: unknown) {
            console.error('Forgot password error:', error);
            const errorMessage = handleAuthError(error, 'Error al enviar código de recuperación');
            toast.error(errorMessage);
            throw new Error(errorMessage);
          }
        },

        resetPasswordWithCode: async (
          email: string, 
          code: string, 
          newPassword: string
        ): Promise<void> => {
          try {
            await confirmResetPassword({
              username: email,
              confirmationCode: code,
              newPassword,
            });
            
            toast.success('Contraseña restablecida exitosamente');
          } catch (error: unknown) {
            console.error('Reset password error:', error);
            const errorMessage = handleAuthError(error, 'Error al restablecer contraseña');
            toast.error(errorMessage);
            throw new Error(errorMessage);
          }
        },

        // ============================================
        // SESSION MANAGEMENT
        // ============================================

        refreshUser: async (): Promise<void> => {
          try {
            const authUser = await getCurrentUser();
            const session = await fetchAuthSession();

            if (authUser && session.tokens?.accessToken) {
              const user = extractUserFromAuthUser(authUser, session);
              const accessToken = session.tokens.accessToken.toString();
              const sessionExpiry = session.tokens.accessToken.payload.exp 
                ? (session.tokens.accessToken.payload.exp as number) * 1000 
                : undefined;
              
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                accessToken,
                sessionExpiry,
                lastActivity: Date.now(),
              });
            } else {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
                accessToken: null,
                sessionExpiry: undefined,
              });
            }
          } catch (error: unknown) {
            console.warn('Failed to refresh user:', error);
            
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              accessToken: null,
              sessionExpiry: undefined,
            });
          }
        },

        checkSession: async (): Promise<boolean> => {
          try {
            const session = await fetchAuthSession();
            const isValid = !!session.tokens?.accessToken;
            
            if (isValid) {
              set({ lastActivity: Date.now() });
            }
            
            return isValid;
          } catch (error: unknown) {
            console.warn('Session check failed:', error);
            return false;
          }
        },

        getAccessToken: async (): Promise<string | null> => {
          try {
            const session = await fetchAuthSession();
            const token = session.tokens?.accessToken?.toString();
            
            if (token) {
              set({ 
                accessToken: token,
                lastActivity: Date.now(),
              });
            }
            
            return token || null;
          } catch (error: unknown) {
            console.warn('Failed to get access token:', error);
            return null;
          }
        },

        // ============================================
        // UI STATE MANAGEMENT
        // ============================================

        clearError: (): void => {
          set({ error: null });
        },

        setLoading: (loading: boolean): void => {
          set({ isLoading: loading });
        },

        // ============================================
        // INITIALIZATION & EVENT HANDLING
        // ============================================

        initialize: async (): Promise<void> => {
          console.log('🔐 Initializing AuthStore...');
          
          try {
            const hasValidSession = await get().checkSession();
            
            if (hasValidSession) {
              await get().refreshUser();
              console.log('✅ Auth session restored');
            } else {
              set({ isLoading: false });
              console.log('📝 No valid session found');
            }
          } catch (error: unknown) {
            console.warn('Auth initialization failed:', error);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },

        handleAuthEvent: (event: string, data?: any): void => {
          console.log(`🔐 Auth event: ${event}`, data);
          
          switch (event) {
            case 'signedIn':
              console.log('User signed in via Hub');
              get().refreshUser();
              break;
              
            case 'signedOut':
              console.log('User signed out via Hub');
              set({
                user: null,
                isAuthenticated: false,
                error: null,
                isMfaRequired: false,
                mfaType: undefined,
                accessToken: null,
                sessionExpiry: undefined,
              });
              break;
              
            case 'tokenRefresh':
              console.log('Token refreshed via Hub');
              // Optionally refresh user data or just update last activity
              set({ lastActivity: Date.now() });
              break;
              
            case 'tokenRefresh_failure':
              console.warn('Token refresh failed via Hub');
              set({
                error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
                accessToken: null,
                sessionExpiry: undefined,
              });
              break;
              
            case 'signIn_failure':
              console.error('Sign in failed via Hub:', data);
              break;
              
            default:
              console.log(`Unhandled auth event: ${event}`);
          }
        },
      }),
      {
        name: 'auth-store',
        // Solo persistir datos no sensibles
        partialize: (state) => ({
          lastActivity: state.lastActivity,
          // NO persistir tokens, user data sensible, etc.
        }),
        // Storage configuration
        version: 1,
      }
    ),
    {
      name: 'AuthStore',
      enabled: env.isDev, // Solo en desarrollo
    }
  )
);

// ============================================
// HUB LISTENER SETUP (Auto-inicialización)
// ============================================

// Setup Hub listener una sola vez
let hubListenerSetup = false;

export const setupAuthStoreHubListener = (): void => {
  if (hubListenerSetup) return;

  Hub.listen('auth', ({ payload }) => {
    const store = useAuthStore.getState();
    store.handleAuthEvent(payload.event, 'data' in payload ? (payload as any).data : undefined);
  });

  hubListenerSetup = true;
  console.log('🔐 AuthStore Hub listener configured');
};

// Auto-setup en desarrollo
if (env.isDev) {
  setupAuthStoreHubListener();
}

// ============================================
// CONVENIENCE HOOKS
// ============================================

/**
 * Hook para obtener solo el estado de auth (optimizado para re-renders)
 */
export const useAuthState = () => useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  error: state.error,
  isMfaRequired: state.isMfaRequired,
  mfaType: state.mfaType,
}));

/**
 * Hook para obtener solo las acciones de auth
 */
export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  confirmMFA: state.confirmMFA,
  forgotPassword: state.forgotPassword,
  resetPasswordWithCode: state.resetPasswordWithCode,
  refreshUser: state.refreshUser,
  clearError: state.clearError,
  getAccessToken: state.getAccessToken,
}));

/**
 * Hook para obtener info del usuario actual
 */
export const useCurrentUser = () => useAuthStore((state) => state.user);

/**
 * Hook para obtener solo el status de autenticación
 */
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Helper para verificar roles del usuario actual
 */
export const hasRole = (role: string): boolean => {
  const user = useAuthStore.getState().user;
  return user?.roles.includes(role) || false;
};

/**
 * Helper para verificar múltiples roles
 */
export const hasAnyRole = (roles: string[]): boolean => {
  const user = useAuthStore.getState().user;
  return roles.some(role => user?.roles.includes(role)) || false;
};

/**
 * Helper para verificar acceso a organización
 */
export const canAccessOrganization = (organizationId: number): boolean => {
  const user = useAuthStore.getState().user;
  return user?.organizationId === organizationId || hasRole('ADMIN');
};

/**
 * Helper para verificar acceso a iglesia
 */
export const canAccessChurch = (churchId: number): boolean => {
  const user = useAuthStore.getState().user;
  return user?.churchId === churchId || hasRole('ADMIN') || hasRole('ORG_ADMIN');
};
