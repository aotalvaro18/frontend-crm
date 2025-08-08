// src/components/ui/ErrorMessage.tsx
// ✅ CORREGIDO: Error components mobile-first siguiendo guía arquitectónica

import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { cn } from '@/utils/cn';

// ============================================
// TYPES
// ============================================

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'destructive' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  onRetry?: () => void;
  retryText?: string;
  onDismiss?: () => void;
  error?: any;
  className?: string;
  actions?: React.ReactNode;
}

// ============================================
// ERROR MESSAGE COMPONENT (✅ CORREGIDO: Mobile-First CSS)
// ============================================

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  variant = 'destructive',
  size = 'md',
  onRetry,
  retryText = 'Reintentar',
  onDismiss,
  error,
  className,
  actions,
}) => {
  const baseClasses = cn(
    // ✅ CORREGIDO: Mobile-first approach
    'w-full p-3', // Mobile: full width, padding 3
    'rounded-lg border', // Basic styling
    'flex flex-col gap-2', // Mobile: vertical layout
    'sm:flex-row sm:items-center sm:gap-3', // Desktop: horizontal layout
    
    // Size variants (mobile-first)
    {
      'p-2 text-sm': size === 'sm',
      'p-3 text-base': size === 'md', // Default
      'p-4 text-lg': size === 'lg',
    },
    
    // Color variants
    {
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200': variant === 'destructive',
      'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200': variant === 'warning',
      'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200': variant === 'info',
    },
    
    className
  );

  const iconClasses = cn(
    'h-4 w-4 flex-shrink-0', // Mobile: consistent icon size
    'sm:h-5 sm:w-5' // Desktop: slightly larger
  );

  const getIcon = () => {
    return <AlertCircle className={iconClasses} />;
  };

  return (
    <div className={baseClasses}>
      {/* Icon and content wrapper */}
      <div className="flex items-start gap-2 flex-1 min-w-0">
        {getIcon()}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn(
              'font-medium break-words', // Mobile-first: handle long titles
              'text-sm sm:text-base' // Responsive text size
            )}>
              {title}
            </h4>
          )}
          <p className={cn(
            'break-words', // Mobile: handle long messages
            'text-sm leading-relaxed', // Mobile-first: good readability
            title ? 'mt-1' : '' // Spacing when title exists
          )}>
            {message}
          </p>
          
          {/* Development error details */}
          {error && import.meta.env.DEV && (
            <details className="mt-2">
              <summary className={cn(/* ... */)}>
                Detalles técnicos (desarrollo)
              </summary>
              <pre className={cn(/* ... */)}>
                {JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>

      {/* Actions */}
      {(onRetry || onDismiss || actions) && (
        <div className={cn(
          'flex gap-2 flex-shrink-0', // Mobile: horizontal actions
          'mt-2 sm:mt-0', // Mobile: top margin, desktop: no margin
          'justify-end sm:justify-start' // Mobile: right-aligned, desktop: left-aligned
        )}>
          {actions}
          {onRetry && (
            <button
              onClick={onRetry}
              className={cn(
                // ✅ CORREGIDO: Mobile-first button styling
                'inline-flex items-center gap-1 px-3 py-1.5', // Mobile-first padding
                'text-xs font-medium rounded-md', // Mobile-first text size
                'transition-colors duration-200',
                'sm:px-4 sm:py-2 sm:text-sm', // Desktop: larger
                
                // Variant-specific colors
                {
                  'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800': variant === 'destructive',
                  'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:hover:bg-amber-800': variant === 'warning',
                  'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800': variant === 'info',
                }
              )}
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              {retryText}
            </button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={cn(
                'inline-flex items-center justify-center',
                'p-1 rounded-md', // Mobile-first: small padding
                'transition-colors duration-200',
                'hover:bg-black hover:bg-opacity-10',
                'sm:p-1.5' // Desktop: slightly larger
              )}
              aria-label="Cerrar"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// SPECIALIZED ERROR COMPONENTS (✅ CORREGIDO)
// ============================================

// Network error (specific to mobile)
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorMessage
    title="Sin conexión"
    message="Verifica tu conexión a internet e intenta nuevamente."
    variant="warning"
    onRetry={onRetry}
    retryText="Reintentar"
  />
);

// Validation error (from your backend)
export const ValidationError: React.FC<{ 
  errors: Record<string, string[]>;
  onDismiss?: () => void;
}> = ({ errors, onDismiss }) => {
  const errorCount = Object.keys(errors).length;
  const firstErrors = Object.values(errors).flat().slice(0, 3);
  
  return (
    <ErrorMessage
      title="Errores de validación"
      message={
        errorCount === 1 
          ? firstErrors[0]
          : `Se encontraron ${errorCount} errores en los datos ingresados.`
      }
      variant="warning"
      onDismiss={onDismiss}
      error={{ details: { fieldErrors: errors } }}
    />
  );
};

// Concurrency error (your OptimisticLockingFailureException)
export const ConcurrencyError: React.FC<{
  currentVersion: number;
  attemptedVersion: number;
  onRefresh?: () => void;
}> = ({ currentVersion, attemptedVersion, onRefresh }) => (
  <ErrorMessage
    title="Conflicto de versiones"
    message="Este registro fue modificado por otro usuario. Recarga para ver los cambios actuales."
    variant="warning"
    onRetry={onRefresh}
    retryText="Recargar"
    error={{
      code: 'CONCURRENT_MODIFICATION',
      currentVersion,
      attemptedVersion,
    }}
  />
);

// ============================================
// ERROR BOUNDARY COMPONENT (✅ CORREGIDO: Mobile-First)
// ============================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log to external service in production
    if (import.meta.env.PROD) {
      console.error('Production Error:', { error, errorInfo });
      // TODO: Send to your error tracking service
    }
  }

  override render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback) {
        return (
          <Fallback 
            error={this.state.error!} 
            resetError={() => this.setState({ hasError: false, error: undefined })}
          />
        );
      }

      return (
        <div className={cn(
          // ✅ CORREGIDO: Mobile-first error boundary layout
          'min-h-screen p-4', // Mobile: full viewport, padding
          'flex items-center justify-center', // Centering
          'bg-app-dark-900', // Dark background
          'sm:p-6 md:p-8' // Desktop: more padding
        )}>
          <div className={cn(
            'w-full max-w-md', // Mobile-first: full width with max constraint
            'sm:max-w-lg' // Desktop: larger max width
          )}>
            <ErrorMessage
              title="Error inesperado"
              message="Ha ocurrido un error inesperado. Por favor, intenta recargar la página."
              variant="destructive"
              size="lg"
              onRetry={() => window.location.reload()}
              retryText="Recargar página"
              error={this.state.error}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// MOBILE-SPECIFIC ERROR COMPONENTS (✅ CORREGIDO)
// ============================================

export const MobileNetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div className={cn(
    // ✅ CORREGIDO: Mobile-first positioning
    'fixed inset-x-0 bottom-0 p-4 z-50', // Mobile: bottom notification
    'sm:hidden' // Desktop: hidden (use regular error instead)
  )}>
    <ErrorMessage
      message="Sin conexión a internet"
      variant="destructive"
      size="sm"
      onRetry={onRetry}
      className="shadow-lg" // Mobile: floating shadow
    />
  </div>
);

export const InlineError: React.FC<{ message: string; className?: string }> = ({ 
  message, 
  className 
}) => (
  <div className={cn(
    // ✅ CORREGIDO: Mobile-first inline error
    'flex items-center gap-2 text-sm mt-1', // Mobile-first spacing
    'text-app-status-error', // Error color
    className
  )}>
    <AlertCircle className={cn(
      'h-4 w-4 flex-shrink-0', // Mobile: consistent icon size
      'sm:h-4 sm:w-4' // Desktop: same size
    )} />
    <span className="break-words">{message}</span>
  </div>
);

// ============================================
// TOAST CONFIGURATION (✅ CORREGIDO: Mobile-First)
// ============================================

export const toastOptions = {
  duration: 4000,
  position: 'top-center' as const,
  // ✅ CORREGIDO: Mobile-first responsive styles
  style: {
    background: '#1f2937', // app-dark-800
    color: '#f9fafb',      // app-gray-50
    fontSize: '14px',      // Mobile-first text size
    padding: '12px 16px',  // Mobile-first padding
    borderRadius: '8px',
    maxWidth: '90vw',      // Mobile-first: Don't overflow screen
    width: '100%',         // Mobile: full available width
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  success: {
    iconTheme: {
      primary: '#10b981', // app-status-success
      secondary: '#1f2937',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444', // app-status-error
      secondary: '#1f2937',
    },
    duration: 6000, // Keep error messages longer
  },
  loading: {
    iconTheme: {
      primary: '#3b82f6', // app-accent-500
      secondary: '#1f2937',
    },
  },
};

// ============================================
// ERROR BOUNDARY FALLBACK (✅ CORREGIDO)
// ============================================

export const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className={cn(
    // ✅ CORREGIDO: Mobile-first layout
    'min-h-screen p-4', // Mobile: full screen with padding
    'flex items-center justify-center',
    'bg-app-dark-900',
    'sm:p-6 md:p-8' // Desktop: more padding
  )}>
    <div className={cn(
      'w-full max-w-md text-center', // Mobile-first: full width
      'sm:max-w-lg' // Desktop: larger max width
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
          Algo salió mal
        </h1>
        <p className={cn(
          'text-app-gray-400 mb-6 text-sm', // Mobile-first text size
          'sm:text-base' // Desktop: larger
        )}>
          La aplicación encontró un error inesperado. Por favor, recarga la página.
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
            Recargar Página
            </button>
          {import.meta.env.DEV && (
            <details className="text-left">
              <summary className={cn(
                'text-app-gray-400 cursor-pointer hover:text-white',
                'text-sm transition-colors' // Mobile-first text size
              )}>
                Detalles del error (desarrollo)
              </summary>
              <pre className={cn(
                'mt-2 p-3 rounded border overflow-auto', // Mobile-first spacing
                'text-xs bg-app-dark-900 text-app-gray-500',
                'max-h-40', // Mobile: limited height
                'sm:max-h-60' // Desktop: more height
              )}>
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  </div>
);