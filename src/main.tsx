// src/main.tsx
// ✅ CORREGIDO QUIRÚRGICAMENTE: Sin advertencias, listo para deploy

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// 🔧 CRÍTICO: Amplify SÍNCRONO - Se configura inmediatamente al importar
import '@/lib/amplify';

// Router configuration
import router from '@/router';

// Global styles
import '@/styles/globals.css';

// ✅ CORREGIDO: Error boundary with mobile-first
import { ErrorBoundary } from '@/components/ui/ErrorMessage';

// ✅ CORREGIDO: Environment config
//import { env } from '@/config/environment';

// ✅ CORREGIDO: Add missing cn utility
import { cn } from "@/utils/cn";

// ============================================
// REACT QUERY CONFIGURATION
// ============================================



// ============================================
// ERROR BOUNDARY FALLBACK
// ============================================

const AppErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => (
  <div className={cn(
    'min-h-screen p-4',
    'flex items-center justify-center',
    'bg-app-dark-900',
    'sm:p-6'
  )}>
    <div className={cn(
      'w-full max-w-md text-center',
      'sm:max-w-lg'
    )}>
      <div className={cn(
        'p-6 rounded-lg border',
        'bg-app-dark-800 border-app-dark-600',
        'sm:p-8'
      )}>
        <h1 className={cn(
          'text-xl font-bold text-white mb-4',
          'sm:text-2xl'
        )}>
          Error de aplicación
        </h1>
        <p className={cn(
          'text-app-gray-400 mb-6 text-sm',
          'sm:text-base'
        )}>
          Se produjo un error inesperado. Por favor, recarga la aplicación.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className={cn(
              'w-full px-4 py-2 rounded-lg',
              'bg-app-accent-500 hover:bg-app-accent-600',
              'text-white font-medium',
              'transition-colors duration-200',
              'sm:py-3'
            )}
          >
            Recargar Aplicación
          </button>
          
          <button
            onClick={resetError}
            className={cn(
              'w-full px-4 py-2 rounded-lg',
              'bg-app-dark-700 hover:bg-app-dark-600',
              'text-app-gray-300 font-medium',
              'transition-colors duration-200',
              'sm:py-3'
            )}
          >
            Intentar Nuevamente
          </button>
        </div>

        {import.meta.env.DEV && (
          <details className="mt-6 text-left">
            <summary className={cn(
              'text-app-gray-400 cursor-pointer hover:text-white',
              'text-sm transition-colors'
            )}>
              Detalles del error (desarrollo)
            </summary>
            <pre className={cn(
              'mt-2 p-3 rounded border overflow-auto',
              'text-xs bg-app-dark-900 text-app-gray-500',
              'max-h-40 whitespace-pre-wrap',
              'sm:max-h-60'
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
// LOADING COMPONENT
// ============================================

// ============================================
// MAIN APP COMPONENT
// ============================================

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ErrorBoundary fallback={AppErrorFallback}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          
          {/* Toaster para notificaciones */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          
          {/* React Query Devtools solo en desarrollo */}
          {import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
};

// ============================================
// APP STARTUP
// ============================================

const initializeApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element not found. Make sure you have <div id="root"></div> in your HTML.');
  }

  console.log('✅ App initialized successfully');
  console.log('Environment:', import.meta.env.MODE);
  console.log('Version:', import.meta.env['VITE_APP_VERSION'] || '1.0.0');
  
  return rootElement;
};

// ============================================
// RENDER APP
// ============================================

try {
  const rootElement = initializeApp();
  const root = ReactDOM.createRoot(rootElement);

  // Strict mode solo en desarrollo
  const AppWithStrictMode = import.meta.env.DEV ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  );

  root.render(AppWithStrictMode);

} catch (error) {
  console.error('❌ Failed to initialize app:', error);
  
  // Fallback error display
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
            ${import.meta.env.DEV ? `<br><br>Error: ${error}` : ''}
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

// Hot reload en desarrollo
if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.accept();
}