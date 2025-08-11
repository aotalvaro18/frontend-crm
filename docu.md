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
      
      const response = await fetch(`${this.baseURL}/api/auth/me`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        // ✅ Timeout para evitar requests colgados
        signal: AbortSignal.timeout(10000) // 10 segundos
      });
      
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
      
    } catch (error) {
      authLogger.warn('Failed to fetch user profile from service, using Cognito fallback', error);
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






// src/pages/auth/LoginPage.tsx
// VERSIÓN HÍBRIDA DEFINITIVA Y REFACTORIZADA

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, WifiOff } from 'lucide-react';

// Components
import { Button } from '@/components/ui/Button';
import { Input, EmailInput } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Page from '@/components/layout/Page';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import FeaturesShowcase from '@/components/auth/FeaturesShowcase';

// Hooks y context
import { useAuthState, useAuthActions } from '@/stores/authStore';
// Utils
//import { cn } from '@/utils/cn';
import { env } from '@/config/environment';
import { resetPassword } from 'aws-amplify/auth';

// ============================================
// VALIDATION SCHEMA
// ============================================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido')
    .max(100, 'El email es demasiado largo'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================
// MAIN LOGIN PAGE COMPONENT
// ============================================

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // ✅ CORRECCIÓN 1: Traemos la función 'resetPassword' del contexto de autenticación.
  const { isAuthenticated, isLoading: authLoading } = useAuthState();
  const { signIn } = useAuthActions();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  // --- EFFECTS ---
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const state = location.state as { from?: { pathname?: string } } | null;
      const from = state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location.state]);

  useEffect(() => {
    const timer = setTimeout(() => setFocus('email'), 100);
    return () => clearTimeout(timer);
  }, [setFocus]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- HANDLERS ---
  const onLoginSubmit = async (data: LoginFormData) => {
    if (isOffline) {
      setLoginError('No hay conexión a internet. Verifica y reintenta.');
      return;
    }
    setLoginError('');
    
    try {
      await signIn({ email: data.email, password: data.password });
    } catch (error: any) {
      const COGNITO_ERROR_MAP: Record<string, string> = {
        'User does not exist': 'Usuario no encontrado. Verifica tu email.',
        'Incorrect username or password': 'Email o contraseña incorrectos.',
        'User is not confirmed': 'Debes confirmar tu cuenta antes de iniciar sesión.',
        'Too many failed attempts': 'Demasiados intentos fallidos. Intenta más tarde.',
        'Network error': 'Error de conexión. Verifica tu internet.',
      };
      
      const rawMessage = error.message || 'unknown';
      let finalMessage = 'Error al iniciar sesión. Intenta nuevamente.';
      for (const key in COGNITO_ERROR_MAP) {
        if (rawMessage.includes(key)) {
          finalMessage = COGNITO_ERROR_MAP[key];
          break;
        }
      }
      setLoginError(finalMessage);
    }
  };

  // ✅ CORRECCIÓN 2: Creamos la función que manejará la lógica de "onSubmit" del modal.
  // Esta función es la que realmente llama al método 'resetPassword' del contexto.
  const handleForgotPasswordSubmit = async (email: string) => {
    // La lógica de 'try/catch' y el estado de carga ya están manejados dentro del modal,
    // pero esta función debe lanzar un error si 'resetPassword' falla para que el modal lo capture.
    await resetPassword({ username: email });
  };


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-dark-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Page 
      title="Iniciar Sesión" 
      className="bg-app-dark-900"
      showHeader={false}
    >
      <div className="min-h-screen flex">
        <FeaturesShowcase />
        
        <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 bg-app-dark-900">
          <div className="mx-auto w-full max-w-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white">Iniciar Sesión</h2>
              <p className="mt-2 text-sm text-app-gray-400">Accede a tu cuenta de {env.appName}</p>
            </div>
            
            {isOffline && (
              <div className="mb-4 flex items-center justify-center space-x-2 text-yellow-400 p-3 bg-yellow-900/50 rounded-lg">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">Estás sin conexión</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-6">
              <Controller name="email" control={control} render={({ field }) => (
                <EmailInput {...field} id="login-email" label="Email empresarial" placeholder="tu@empresa.com" error={errors.email?.message} leftIcon={<Mail className="h-4 w-4 text-app-gray-400" />} autoComplete="email" required />
              )} />
              
              <Controller name="password" control={control} render={({ field }) => (
                <Input {...field} id="login-password" label="Contraseña" type={showPassword ? 'text' : 'password'} placeholder="Tu contraseña segura" error={errors.password?.message} leftIcon={<Lock className="h-4 w-4 text-app-gray-400" />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="text-gray-400 hover:text-white">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  autoComplete="current-password" required
                />
              )} />

              <div className="flex items-center justify-between">
                <Controller name="rememberMe" control={control} render={({ field: { value, onChange } }) => (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={value} onChange={onChange} className="h-4 w-4 text-blue-600 bg-app-dark-700 border-app-dark-600 rounded focus:ring-blue-500" />
                    <span className="text-sm text-app-gray-300">Recordarme</span>
                  </label>
                )} />
                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-blue-500 hover:text-blue-400 font-medium">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {loginError && <ErrorMessage message={loginError} />}

              <Button type="submit" loading={isSubmitting} disabled={isOffline || isSubmitting} className="w-full" size="lg">
                Iniciar Sesión
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-app-gray-500">
                © 2025 {env.appName}. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ CORRECCIÓN 3: Pasamos la nueva función 'handleForgotPasswordSubmit' como la prop 'onSubmit'. */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSubmit={handleForgotPasswordSubmit}
      />
    </Page>
  );
};

export default LoginPage;