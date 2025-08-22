// src/App.tsx
// ✅ ORQUESTADOR PRINCIPAL OPTIMIZADO - SIN BUCLE DE REDIRECCIÓN
// Versión mejorada con error boundaries y logging granular

import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorMessage';
import { Toaster } from 'react-hot-toast';
import { authLogger } from '@/types/auth.types';
import { queryClient } from '@/lib/react-query';

// ============================================
// ERROR BOUNDARY ESPECÍFICO PARA AUTH
// ============================================

class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    authLogger.error('Auth Error Boundary caught error', error);
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    authLogger.error('Auth Error Boundary error details', { error, errorInfo });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Error de Autenticación
            </h1>
            <p className="text-gray-600 mb-4">
              Ha ocurrido un error inesperado. Por favor, recarga la página.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Recargar Página
              </button>
              {import.meta.env.DEV && (
                <details className="text-left">
                  <summary className="text-gray-500 cursor-pointer hover:text-gray-700 text-sm">
                    Detalles del error (desarrollo)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {this.state.error?.message}
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ============================================
  // 🔧 CAMBIO 2: MODIFICAR DESTRUCTURING DEL STORE
  // ============================================
  const { 
    isAuthenticated, 
    isLoading, 
    isReady, 
    hasProfile, 
    isLoadingProfile,
    initialize, 
    user, 
    error 
  } = useAuthStore();

  // ============================================
  // 🔧 CAMBIO 1: INICIALIZACIÓN (SIMPLIFICADA)
  // ============================================

  useEffect(() => {
    const initializeAuth = async () => {
      authLogger.info('App: Starting auth initialization...');
      try {
        await initialize();
      } catch (error) {
        authLogger.error('App: Auth initialization failed', error);
      }
    };
    
    initializeAuth();
  }, [initialize]);

  // ============================================
  // 🔧 CAMBIO 5: LÓGICA DE REDIRECCIÓN (SIMPLIFICADA)
  // ============================================

  useEffect(() => {
    if (!isReady) return; // Wait for initialization

    const currentPath = location.pathname;
    const isPublicRoute = ['/login', '/forgot-password', '/reset-password'].includes(currentPath);

    authLogger.info('App: Evaluating route protection', {
      currentPath,
      isAuthenticated,
      hasProfile,
      isPublicRoute,
      user: user?.email || 'none'
    });

    // Usuario NO autenticado en ruta protegida → Login
    if (!isAuthenticated && !isPublicRoute) {
      authLogger.info('App: Redirecting to login - unauthenticated user');
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
      return;
    }
    
    // Usuario autenticado en ruta pública → Dashboard
    if (isAuthenticated && isPublicRoute) {
      const from = (location.state as any)?.from?.pathname || '/contacts';
      authLogger.info('App: Redirecting to dashboard - authenticated user', { user: user?.email });
      navigate(from, { replace: true });
      return;
    }

    // Todo OK - usuario en la ruta correcta
    authLogger.info('App: Route access granted', {
      currentPath,
      isAuthenticated,
      user: user?.email || 'none'
    });

  }, [isAuthenticated, isReady, location, navigate, user, hasProfile]);

  // ============================================
  // 3. ERROR DISPLAY
  // ============================================

  const showGlobalError = error && location.pathname !== '/login';

  // ============================================
  // 🔧 CAMBIO 3: RENDER GUARDS Y LOADING STATES (SIMPLIFICADOS)
  // ============================================

  // ✅ Loading inicial: Esperando inicialización de sesión
  if (!isReady) {
    return (
      <AuthErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 animate-pulse">
              Inicializando aplicación...
            </p>
            {import.meta.env.DEV && (
              <p className="mt-2 text-xs text-gray-400">
                DEV: Loading Cognito session...
              </p>
            )}
          </div>
        </div>
      </AuthErrorBoundary>
    );
  }

  // ✅ Loading perfil: Usuario autenticado pero sin perfil cargado
  if (isAuthenticated && !hasProfile && isLoadingProfile) {
    return (
      <AuthErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">
              Cargando perfil de usuario...
            </p>
          </div>
        </div>
      </AuthErrorBoundary>
    );
  }

  // ============================================
  // 5. RENDER PRINCIPAL
  // ============================================

  return (
    <AuthErrorBoundary>
      <ErrorBoundary>
        <div className="min-h-screen bg-app-dark-900 text-app-gray-100">
          {/* Global Error Display */}
          {showGlobalError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Error de autenticación: {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <Outlet />

          {/* Toaster */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a1a',
                color: '#e5e5e5',
                border: '1px solid #2a2a2a',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#1a1a1a',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#1a1a1a',
                },
              },
            }}
          />

          {/* Development Info */}
          {import.meta.env.DEV && (
            <div className="fixed bottom-4 left-4 text-xs text-app-gray-500 bg-app-dark-800 px-2 py-1 rounded border border-app-dark-700">
              <div>Auth: {isAuthenticated ? 'Yes' : 'No'}</div>
              <div>User: {user?.email || 'None'}</div>
              <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
              <div className={`inline-block w-2 h-2 rounded-full mr-1 ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`} 
                   title={navigator.onLine ? 'Online' : 'Offline'}>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </AuthErrorBoundary>
  );
};

export default App;