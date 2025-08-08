// src/main.tsx
// ✅ CORREGIDO: Entry point principal del CRM siguiendo la guía arquitectónica
// Mobile-first, enterprise-grade setup con Amplify v6
// 🔧 CORREGIDO QUIRÚRGICAMENTE: Amplify SÍNCRONO

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// 🔧 CRÍTICO: Amplify SÍNCRONO - Se configura inmediatamente al importar
import '@/lib/amplify';

// Router configuration
import router from '@/router';

// Global styles
import '@/styles/globals.css';

// ✅ CORREGIDO: Auth provider with Amplify v6
import { AuthProvider } from '@/context/AuthContext';

// ✅ CORREGIDO: Error boundary with mobile-first - MANTENIENDO TUS IMPORTS
import { ErrorBoundary, toastOptions } from '@/components/ui/ErrorMessage';

// ✅ CORREGIDO: Environment config - MANTENIENDO TU IMPORT
import { env } from '@/config/environment';

// ✅ CORREGIDO: Add missing cn utility - MANTENIENDO TU IMPORT
import { cn } from "@/utils/cn";

// ============================================
// REACT QUERY CONFIGURATION (✅ CORREGIDO: Mobile-optimized)
// ============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ CORREGIDO: Mobile-optimized cache settings
      // Cache data for 3 minutes by default (shorter for mobile)
      staleTime: 3 * 60 * 1000,
      // Keep unused data in cache for 5 minutes (shorter for mobile memory)
      gcTime: 5 * 60 * 1000,
      
      // ✅ CORREGIDO: Smart retry logic for mobile networks
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        
        // For mobile: be more conservative with retries
        return failureCount < 2; // Reduced from 3 to 2
      },
      
      // ✅ CORREGIDO: Mobile-friendly retry delay
      retryDelay: (attemptIndex) => {
        // Shorter delays for mobile
        return Math.min(500 * 2 ** attemptIndex, 15000); // Max 15s instead of 30s
      },
      
      // ✅ CORREGIDO: Mobile-optimized refetch behavior
      // Don't refetch too aggressively on mobile to save battery/data
      refetchOnWindowFocus: false, // Disabled for mobile
      refetchOnReconnect: true,    // Keep this for network recovery
      
      // ✅ CORREGIDO: Longer background refetch for mobile
      refetchInterval: false, // Disabled auto-refetch to save battery
      
      // ✅ CORREGIDO: Network mode for mobile
      networkMode: 'offlineFirst', // Better mobile experience
    },
    mutations: {
      // ✅ CORREGIDO: Conservative retry for mobile
      retry: 1, // Only retry once
      
      // ✅ CORREGIDO: Mobile-friendly mutation settings
      networkMode: 'offlineFirst',
      
      // Global error handling
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // Error will be handled by individual mutation error handlers
        // Don't show toast here to avoid duplicate errors
      },
      
      // Global success handling
      onSuccess: () => {
        // Optionally invalidate relevant queries
        // Keep this minimal for mobile performance
      },
    },
  },
});

// ============================================
// ERROR BOUNDARY FALLBACK (✅ CORREGIDO: Mobile-First)
// ============================================

const AppErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => (
  <div className={cn(
    // ✅ CORREGIDO: Mobile-first error layout
    'min-h-screen p-4', // Mobile: full screen with padding
    'flex items-center justify-center',
    'bg-app-dark-900',
    'sm:p-6' // Desktop: more padding
  )}>
    <div className={cn(
      'w-full max-w-md text-center', // Mobile-first: full width
      'sm:max-w-lg' // Desktop: larger
    )}>
      <div className={cn(
        'p-6 rounded-lg border', // Mobile-first padding
        'bg-app-dark-800 border-app-dark-600',
        'sm:p-8' // Desktop: more padding
      )}>
        <h1 className={cn(
          'text-xl font-bold text-white mb-4', // Mobile-first text size
          'sm:text-2xl' // Desktop: larger
        )}>
          Error de aplicación
        </h1>
        <p className={cn(
          'text-app-gray-400 mb-6 text-sm', // Mobile-first text size
          'sm:text-base' // Desktop: larger
        )}>
          Se produjo un error inesperado. Por favor, recarga la aplicación.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className={cn(
              // ✅ CORREGIDO: Mobile-first button
              'w-full px-4 py-2 rounded-lg', // Mobile-first sizing
              'bg-app-accent-500 hover:bg-app-accent-600',
              'text-white font-medium',
              'transition-colors duration-200',
              'sm:py-3' // Desktop: more padding
            )}
          >
            Recargar Aplicación
          </button>
          
          <button
            onClick={resetError}
            className={cn(
              'w-full px-4 py-2 rounded-lg', // Mobile-first sizing
              'bg-app-dark-700 hover:bg-app-dark-600',
              'text-app-gray-300 font-medium',
              'transition-colors duration-200',
              'sm:py-3' // Desktop: more padding
            )}
          >
            Intentar Nuevamente
          </button>
        </div>

        {env.isDev && (
          <details className="mt-6 text-left">
            <summary className={cn(
              'text-app-gray-400 cursor-pointer hover:text-white',
              'text-sm transition-colors' // Mobile-first text size
            )}>
              Detalles del error (desarrollo)
            </summary>
            <pre className={cn(
              'mt-2 p-3 rounded border overflow-auto', // Mobile-first spacing
              'text-xs bg-app-dark-900 text-app-gray-500',
              'max-h-40 whitespace-pre-wrap', // Mobile: limited height
              'sm:max-h-60' // Desktop: more height
            )}>
              {error.message}
              {'\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  </div>
);

// ============================================
// LOADING COMPONENT (✅ CORREGIDO: Mobile-First)
// ============================================

const AppLoading: React.FC = () => (
  <div className={cn(
    // ✅ CORREGIDO: Mobile-first loading layout
    'min-h-screen p-4', // Mobile: full screen
    'flex items-center justify-center',
    'bg-app-dark-900'
  )}>
    <div className="text-center">
      {/* ✅ CORREGIDO: Mobile-optimized spinner */}
      <div className={cn(
        'animate-spin rounded-full border-2 mx-auto mb-4',
        'h-8 w-8', // Mobile: smaller spinner
        'border-app-accent-500 border-t-transparent',
        'sm:h-12 sm:w-12' // Desktop: larger
      )}></div>
      
      <h2 className={cn(
        'text-lg font-semibold text-white mb-2', // Mobile-first text size
        'sm:text-xl' // Desktop: larger
      )}>
        {env.appName}
      </h2>
      
      <p className={cn(
        'text-app-gray-400 text-sm', // Mobile-first text size
        'sm:text-base' // Desktop: larger
      )}>
        Iniciando aplicación...
      </p>
      
      {env.isDev && (
        <p className="text-app-gray-500 text-xs mt-2">
          Modo desarrollo • v{env.appVersion}
        </p>
      )}
    </div>
  </div>
);

// ============================================
// 🔧 APP INITIALIZATION CHECK (CORREGIDO: ASYNC LIGERO)
// ============================================

const initializeApp = async () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element not found. Make sure you have <div id="root"></div> in your HTML.');
  }

  // 🔧 NUEVO: Verificar que Amplify esté configurado (ya no async)
  try {
    console.log('🔧 Verificando configuración de Amplify...');
    
    // 🔧 CORREGIDO: Import ES6 en lugar de require
    const { isAmplifyConfigured, validateAmplifyConfig } = await import('@/lib/amplify');
    
    if (!isAmplifyConfigured()) {
      throw new Error('Amplify no está configurado');
    }
    
    const validation = validateAmplifyConfig();
    if (!validation.isValid) {
      console.warn('⚠️ Amplify configuration issues:', validation.errors);
      if (!env.isDev) {
        throw new Error('Invalid Amplify configuration in production');
      }
    }
    
    console.log('✅ Amplify verified successfully');
  } catch (error) {
    console.error('❌ Amplify verification failed:', error);
    // En desarrollo, continuar sin Amplify para debugging
    if (!env.isDev) {
      throw new Error('Failed to verify Amplify in production');
    } else {
      console.warn('⚠️ Continuando sin Amplify en modo desarrollo');
    }
  }

  // ✅ Environment validation - USANDO TU env
  if (!env.isValid()) {
    console.error('❌ Invalid environment configuration');
    throw new Error('Invalid environment configuration. Check console for details.');
  }

  console.log('✅ App initialized successfully');
  console.log('Environment:', env.appEnvironment);
  console.log('Version:', env.appVersion);
  
  return rootElement;
};

// ============================================
// MAIN APP COMPONENT (✅ CORREGIDO - Sin cambios)
// ============================================

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ErrorBoundary fallback={AppErrorFallback}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {/* ✅ CORREGIDO: Router with loading fallback */}
            <React.Suspense fallback={<AppLoading />}>
              <RouterProvider router={router} />
            </React.Suspense>
            
            {/* ✅ CORREGIDO: Mobile-first toast configuration - USANDO TU toastOptions */}
            <Toaster {...toastOptions} />
            
            {/* ✅ CORREGIDO: Dev tools only in development - USANDO TU env */}
            {env.isDev && (
              <ReactQueryDevtools 
                initialIsOpen={false}
                position="right"
              />
            )}
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
};

// ============================================
// 🔧 APP STARTUP (CORREGIDO: ASYNC LIGERO)
// ============================================

(async () => {
  try {
    const rootElement = await initializeApp(); // 🔧 VUELVE a ser async pero ligero
    const root = ReactDOM.createRoot(rootElement);
  
  // ✅ CORREGIDO: Strict mode for development - USANDO TU env
  const AppWithStrictMode = env.isDev ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  );
  
  root.render(AppWithStrictMode);
  
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    
    // ✅ CORREGIDO: Fallback error display
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          min-height: 100vh;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #111827;
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <div style="text-align: center; max-width: 400px;">
            <h1 style="font-size: 24px; margin-bottom: 16px; color: #ef4444;">
              Error de Inicialización
            </h1>
            <p style="color: #9ca3af; margin-bottom: 24px;">
              No se pudo inicializar la aplicación. 
              ${env.isDev ? `<br><br>Error: ${error}` : ''}
            </p>
            <button 
              onclick="window.location.reload()"
              style="
                background-color: #3b82f6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
              "
            >
              Recargar
            </button>
          </div>
        </div>
      `;
    }
  }
})();

// ============================================
// HOT RELOAD (Development only) - USANDO TU env
// ============================================

if (env.isDev && import.meta.hot) {
  import.meta.hot.accept();
}