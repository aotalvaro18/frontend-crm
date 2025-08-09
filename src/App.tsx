// src/App.tsx
// ✅ ORQUESTADOR PRINCIPAL OPTIMIZADO - SIN BUCLE DE REDIRECCIÓN
// Versión mejorada con error boundaries y logging granular

import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorMessage';
import { Toaster } from 'react-hot-toast';
import { authLogger } from '@/types/auth.types';

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
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// MAIN APP COMPONENT
// ============================================

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { isAuthenticated, isLoading, isInitialized, initialize, user, error } = useAuthStore();

  // ✅ Estado local para evitar múltiples inicializaciones
  const [initStarted, setInitStarted] = useState(false);
  
  // ✅ Estado para tracking de redirecciones (evitar bucles)
  const [lastRedirect, setLastRedirect] = useState<{ path: string; timestamp: number } | null>(null);

  // ============================================
  // 1. INICIALIZACIÓN (UNA SOLA VEZ)
  // ============================================

  useEffect(() => {
    if (!isInitialized && !initStarted) {
      authLogger.info('App: Starting auth initialization...');
      setInitStarted(true);
      initialize().catch((error) => {
        authLogger.error('App: Auth initialization failed', error);
        setInitStarted(false); // Permitir retry
      });
    }
  }, [isInitialized, initStarted, initialize]);

  // ============================================
  // 2. LÓGICA DE REDIRECCIÓN INTELIGENTE
  // ============================================

  useEffect(() => {
    // ✅ No hacer nada hasta que la inicialización termine
    if (!isInitialized) {
      authLogger.info('App: Waiting for auth initialization...');
      return;
    }

    const currentPath = location.pathname;
    const isPublicRoute = ['/login', '/forgot-password', '/reset-password'].includes(currentPath);
    const now = Date.now();

    // ✅ Prevenir bucle de redirecciones (cooldown de 1 segundo)
    if (lastRedirect && (now - lastRedirect.timestamp) < 1000) {
      authLogger.warn('App: Redirect cooldown active, skipping redirect');
      return;
    }

    authLogger.info('App: Evaluating route protection', {
      currentPath,
      isAuthenticated,
      isPublicRoute,
      user: user?.email || 'none'
    });

    // ✅ Usuario NO autenticado en ruta protegida → Login
    if (!isAuthenticated && !isPublicRoute) {
      authLogger.info('App: Redirecting to login - unauthenticated user on protected route');
      
      setLastRedirect({ path: '/login', timestamp: now });
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
      return;
    }
    
    // ✅ Usuario autenticado en ruta pública → Dashboard
    if (isAuthenticated && isPublicRoute) {
      const from = (location.state as any)?.from?.pathname || '/contacts';
      
      authLogger.info('App: Redirecting to dashboard - authenticated user on public route', { 
        from,
        user: user?.email 
      });
      
      setLastRedirect({ path: from, timestamp: now });
      navigate(from, { replace: true });
      return;
    }

    // ✅ Todo OK - usuario en la ruta correcta
    authLogger.info('App: Route access granted', {
      currentPath,
      isAuthenticated,
      user: user?.email || 'none'
    });

  }, [isAuthenticated, isInitialized, location, navigate, user, lastRedirect]);

  // ============================================
  // 3. MANEJO DE ERRORES CRÍTICOS
  // ============================================

  useEffect(() => {
    if (error && isInitialized) {
      authLogger.error('App: Auth error detected', error);
      
      // ✅ Solo redirigir en errores críticos específicos
      const criticalErrors = [
        'Token refresh failed',
        'Invalid session',
        'Authentication required'
      ];
      
      const isCritical = criticalErrors.some(criticalError => 
        error.toLowerCase().includes(criticalError.toLowerCase())
      );
      
      if (isCritical && isAuthenticated) {
        authLogger.error('App: Critical auth error, forcing re-authentication');
        navigate('/login', { replace: true });
      }
    }
  }, [error, isInitialized, isAuthenticated, navigate]);

  // ============================================
  // 4. RENDER GUARDS Y LOADING STATES
  // ============================================

  // ✅ Loading inicial: Esperando inicialización
  if (!isInitialized) {
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
                DEV: Checking auth state...
              </p>
            )}
          </div>
        </div>
      </AuthErrorBoundary>
    );
  }

  // ✅ Loading secundario: Procesando autenticación
  if (isLoading) {
    return (
      <AuthErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">
              {isAuthenticated ? 'Cargando perfil...' : 'Verificando credenciales...'}
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
        <div className="min-h-screen bg-gray-50">
          {/* ✅ OUTLET PARA LAS RUTAS */}
          <Outlet />
          
          {/* ✅ Toast notifications con configuración optimizada */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                fontSize: '14px',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 6000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#3B82F6',
                  secondary: '#fff',
                },
              },
            }}
          />
          
          {/* ✅ Debug panel mejorado (solo en desarrollo) */}
          {import.meta.env.DEV && (
            <div className="fixed bottom-4 left-4 z-50">
              <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 shadow-lg">
                <div className="space-y-1 font-mono">
                  <div className="text-blue-400 font-semibold">🔧 DEBUG INFO</div>
                  <div>ENV: {import.meta.env.MODE}</div>
                  <div>Route: {location.pathname}</div>
                  <div>Auth: {isAuthenticated ? '✅' : '❌'}</div>
                  <div>Init: {isInitialized ? '✅' : '❌'}</div>
                  <div>Loading: {isLoading ? '⏳' : '✅'}</div>
                  
                  {user && (
                    <>
                      <div className="border-t border-gray-700 pt-1 mt-1"></div>
                      <div>User: {user.email}</div>
                      <div>Name: {user.nombre}</div>
                      <div>Roles: {user.roles.length > 0 ? user.roles.join(', ') : 'None'}</div>
                      {user.organizationId && (
                        <div>Org: {user.organizationId}</div>
                      )}
                      {user.churchId && (
                        <div>Church: {user.churchId}</div>
                      )}
                    </>
                  )}
                  
                  {error && (
                    <>
                      <div className="border-t border-gray-700 pt-1 mt-1"></div>
                      <div className="text-red-400">Error: {error}</div>
                    </>
                  )}
                  
                  {lastRedirect && (
                    <>
                      <div className="border-t border-gray-700 pt-1 mt-1"></div>
                      <div className="text-yellow-400">
                        Last redirect: {lastRedirect.path}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(lastRedirect.timestamp).toLocaleTimeString()}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* ✅ Network status indicator (solo en desarrollo) */}
          {import.meta.env.DEV && (
            <div className="fixed bottom-4 right-4 z-50">
              <div className={`w-3 h-3 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`} 
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