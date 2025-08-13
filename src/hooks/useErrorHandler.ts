// src/hooks/useErrorHandler.ts
// ✅ USE ERROR HANDLER HOOK - ENTERPRISE GRADE
// Type-safe + Toast integration + Retry logic + Error categorization + Analytics

import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

// ============================================
// TYPES - REUTILIZACIÓN DE ARQUITECTURA
// ============================================

import { ERROR_MESSAGES } from '@/utils/constants';

/**
 * Categorías de errores para manejo diferenciado
 */
export type ErrorCategory = 
  | 'network'           // Errores de conectividad
  | 'authentication'    // Errores de auth (401, 403)
  | 'authorization'     // Errores de permisos
  | 'validation'        // Errores de validación (400, 422)
  | 'not_found'         // Recursos no encontrados (404)
  | 'conflict'          // Conflictos de datos (409)
  | 'server_error'      // Errores del servidor (500+)
  | 'timeout'           // Timeouts
  | 'unknown';          // Errores no categorizados

/**
 * Severidad del error
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Estrategia de retry
 */
export type RetryStrategy = 'none' | 'immediate' | 'exponential' | 'linear' | 'custom';

/**
 * Información procesada del error
 */
export interface ErrorInfo {
  // Identificación
  id: string;
  timestamp: number;
  
  // Categorización
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  
  // Mensajes
  message: string;           // Para mostrar al usuario
  technicalMessage: string; // Para logs/debugging
  
  // Contexto
  context?: Record<string, any>;
  stack?: string;
  url?: string;
  userAgent?: string;
  
  // Retry info
  canRetry: boolean;
  retryStrategy: RetryStrategy;
  retryAttempts: number;
  maxRetries: number;
  
  // Referencias
  originalError: unknown;
  correlationId?: string;
}

/**
 * Configuración del error handler
 */
export interface ErrorHandlerConfig {
  /**
   * Si debe mostrar toasts automáticamente
   * @default true
   */
  showToasts?: boolean;
  
  /**
   * Si debe loggear errores automáticamente
   * @default true
   */
  logErrors?: boolean;
  
  /**
   * Máximo número de reintentos por defecto
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Categorías que deben ser reportadas a analytics
   * @default ['server_error', 'unknown']
   */
  reportCategories?: ErrorCategory[];
  
  /**
   * Callback personalizado para logging
   */
  onError?: (errorInfo: ErrorInfo) => void;
  
  /**
   * Callback para analytics/monitoring
   */
  onReport?: (errorInfo: ErrorInfo) => void;
  
  /**
   * Context adicional para todos los errores
   */
  globalContext?: Record<string, any>;
}

/**
 * Acciones del error handler
 */
export interface ErrorHandlerActions {
  /**
   * Procesa y maneja un error
   */
  handleError: (error: unknown, context?: string | Record<string, any>) => ErrorInfo;
  
  /**
   * Maneja error con retry automático
   */
  handleErrorWithRetry: <T>(
    operation: () => Promise<T>, 
    context?: string | Record<string, any>
  ) => Promise<T>;
  
  /**
   * Limpia el último error
   */
  clearError: () => void;
  
  /**
   * Limpia todos los errores
   */
  clearAllErrors: () => void;
  
  /**
   * Reintenta la última operación fallida
   */
  retryLastOperation: () => Promise<void>;
  
  /**
   * Reporta error manualmente a analytics
   */
  reportError: (errorInfo: ErrorInfo) => void;
}

/**
 * Estado del error handler
 */
export interface ErrorHandlerState {
  /**
   * Último error procesado
   */
  lastError: ErrorInfo | null;
  
  /**
   * Historial de errores (últimos 10)
   */
  errorHistory: ErrorInfo[];
  
  /**
   * Si hay una operación de retry en progreso
   */
  isRetrying: boolean;
  
  /**
   * Contador de errores por categoría
   */
  errorCounts: Record<ErrorCategory, number>;
}

/**
 * Return del hook
 */
export interface UseErrorHandlerReturn extends ErrorHandlerState, ErrorHandlerActions {}

// ============================================
// ERROR CATEGORIZATION LOGIC
// ============================================

/**
 * Categoriza un error basado en su tipo y contenido
 */
function categorizeError(error: unknown): ErrorCategory {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'network';
  }
  
  // API errors con status code
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    
    if (status === 401) return 'authentication';
    if (status === 403) return 'authorization';
    if (status === 404) return 'not_found';
    if (status === 409) return 'conflict';
    if (status >= 400 && status < 500) return 'validation';
    if (status >= 500) return 'server_error';
  }
  
  // API errors con código
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as any).code;
    
    if (code === 'NETWORK_ERROR' || code === 'TIMEOUT_ERROR') return 'network';
    if (code === 'UNAUTHORIZED' || code === 'TOKEN_EXPIRED') return 'authentication';
    if (code === 'FORBIDDEN') return 'authorization';
    if (code === 'NOT_FOUND') return 'not_found';
    if (code === 'VALIDATION_ERROR') return 'validation';
    if (code === 'OPTIMISTIC_LOCKING_FAILURE') return 'conflict';
  }
  
  // Timeout errors
  if (error instanceof Error && error.name === 'TimeoutError') {
    return 'timeout';
  }
  
  return 'unknown';
}

/**
 * Determina la severidad basada en la categoría
 */
function determineSeverity(category: ErrorCategory): ErrorSeverity {
  switch (category) {
    case 'network':
    case 'timeout':
      return 'medium';
    
    case 'authentication':
    case 'authorization':
      return 'high';
    
    case 'validation':
    case 'not_found':
      return 'low';
    
    case 'conflict':
      return 'medium';
    
    case 'server_error':
      return 'critical';
    
    case 'unknown':
    default:
      return 'medium';
  }
}

/**
 * Extrae mensaje de error user-friendly
 */
function extractUserMessage(error: unknown, category: ErrorCategory): string {
  // API errors con mensaje
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as any).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  
  // Error codes conocidos
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as any).code;
    if (code in ERROR_MESSAGES) {
      return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES];
    }
  }
  
  // Mensajes por categoría
  switch (category) {
    case 'network':
      return 'Error de conexión. Verifica tu conexión a internet.';
    case 'authentication':
      return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    case 'authorization':
      return 'No tienes permisos para realizar esta acción.';
    case 'validation':
      return 'Los datos ingresados no son válidos. Revisa la información.';
    case 'not_found':
      return 'El recurso solicitado no fue encontrado.';
    case 'conflict':
      return 'Conflicto de datos. Otro usuario pudo haber modificado la información.';
    case 'server_error':
      return 'Error del servidor. Inténtalo nuevamente en unos momentos.';
    case 'timeout':
      return 'La operación tardó demasiado tiempo. Inténtalo nuevamente.';
    default:
      return 'Ocurrió un error inesperado. Inténtalo nuevamente.';
  }
}

/**
 * Determina la estrategia de retry
 */
function determineRetryStrategy(category: ErrorCategory): { canRetry: boolean; strategy: RetryStrategy; maxRetries: number } {
  switch (category) {
    case 'network':
    case 'timeout':
      return { canRetry: true, strategy: 'exponential', maxRetries: 3 };
    
    case 'server_error':
      return { canRetry: true, strategy: 'linear', maxRetries: 2 };
    
    case 'conflict':
      return { canRetry: true, strategy: 'immediate', maxRetries: 1 };
    
    case 'authentication':
    case 'authorization':
    case 'validation':
    case 'not_found':
      return { canRetry: false, strategy: 'none', maxRetries: 0 };
    
    case 'unknown':
    default:
      return { canRetry: true, strategy: 'linear', maxRetries: 1 };
  }
}

/**
 * Genera ID único para el error
 */
function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// MAIN HOOK
// ============================================

/**
 * Hook enterprise para manejo de errores
 * Categorización automática + Retry logic + Toast integration + Analytics
 */
export function useErrorHandler(config: ErrorHandlerConfig = {}): UseErrorHandlerReturn {
  // ============================================
  // CONFIGURATION
  // ============================================
  
  const {
    showToasts = true,
    logErrors = true,
    maxRetries = 3,
    reportCategories = ['server_error', 'unknown'],
    onError,
    onReport,
    globalContext = {},
  } = config;

  // ============================================
  // STATE
  // ============================================
  
  const [lastError, setLastError] = useState<ErrorInfo | null>(null);
  const [errorHistory, setErrorHistory] = useState<ErrorInfo[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorCounts, setErrorCounts] = useState<Record<ErrorCategory, number>>({
    network: 0,
    authentication: 0,
    authorization: 0,
    validation: 0,
    not_found: 0,
    conflict: 0,
    server_error: 0,
    timeout: 0,
    unknown: 0,
  });

  // ============================================
  // REFS
  // ============================================
  
  const lastOperationRef = useRef<(() => Promise<any>) | null>(null);

  // ============================================
  // ACTIONS
  // ============================================
  
  const handleError = useCallback((
    error: unknown, 
    context?: string | Record<string, any>
  ): ErrorInfo => {
    const category = categorizeError(error);
    const severity = determineSeverity(category);
    const retryInfo = determineRetryStrategy(category);
    
    // Procesar contexto
    const processedContext = typeof context === 'string' 
      ? { operation: context, ...globalContext }
      : { ...globalContext, ...context };

    // Extraer información técnica
    const technicalMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'Unknown error';

    const stack = error instanceof Error ? error.stack : undefined;

    // Crear ErrorInfo
    const errorInfo: ErrorInfo = {
      id: generateErrorId(),
      timestamp: Date.now(),
      category,
      severity,
      code: (error as any)?.code || category.toUpperCase(),
      message: extractUserMessage(error, category),
      technicalMessage,
      context: processedContext,
      stack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      canRetry: retryInfo.canRetry,
      retryStrategy: retryInfo.strategy,
      retryAttempts: 0,
      maxRetries: Math.min(retryInfo.maxRetries, maxRetries),
      originalError: error,
      correlationId: (error as any)?.correlationId,
    };

    // Actualizar estado
    setLastError(errorInfo);
    setErrorHistory(prev => [errorInfo, ...prev.slice(0, 9)]); // Mantener últimos 10
    setErrorCounts(prev => ({
      ...prev,
      [category]: prev[category] + 1,
    }));

    // Logging
    if (logErrors) {
      console.error(`[ErrorHandler] ${category.toUpperCase()}:`, {
        id: errorInfo.id,
        message: errorInfo.message,
        technical: errorInfo.technicalMessage,
        context: errorInfo.context,
        originalError: error,
      });
    }

    // Toast notification
    if (showToasts) {
      const toastOptions = {
        id: errorInfo.id,
        duration: severity === 'critical' ? 8000 : severity === 'high' ? 6000 : 4000,
      };

      switch (severity) {
        case 'critical':
          toast.error(errorInfo.message, toastOptions);
          break;
        case 'high':
          toast.error(errorInfo.message, toastOptions);
          break;
        case 'medium':
          toast(errorInfo.message, { 
            ...toastOptions,
            icon: '⚠️',
            style: { background: '#f59e0b', color: '#fff' }
          });
          break;
        case 'low':
          toast(errorInfo.message, {
            ...toastOptions,
            icon: 'ℹ️',
            style: { background: '#3b82f6', color: '#fff' }
          });
          break;
      }
    }

    // Callbacks
    onError?.(errorInfo);

    // Analytics reporting
    if (reportCategories.includes(category)) {
      onReport?.(errorInfo);
    }

    return errorInfo;
  }, [showToasts, logErrors, maxRetries, reportCategories, onError, onReport, globalContext]);

  const handleErrorWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string | Record<string, any>
  ): Promise<T> => {
    lastOperationRef.current = operation;
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setIsRetrying(attempt > 0);
        const result = await operation();
        setIsRetrying(false);
        return result;
      } catch (error) {
        lastError = error;
        
        const errorInfo = handleError(error, {
          ...typeof context === 'object' ? context : { operation: context },
          attempt: attempt + 1,
          maxAttempts: maxRetries + 1,
        });

        // Si no se puede reintentar o ya agotamos los intentos
        if (!errorInfo.canRetry || attempt >= maxRetries) {
          setIsRetrying(false);
          throw error;
        }

        // Delay antes del siguiente intento
        const delay = errorInfo.retryStrategy === 'exponential' 
          ? Math.min(1000 * Math.pow(2, attempt), 10000)
          : errorInfo.retryStrategy === 'linear'
            ? 1000 * (attempt + 1)
            : 0;

        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    setIsRetrying(false);
    throw lastError;
  }, [maxRetries, handleError]);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const clearAllErrors = useCallback(() => {
    setLastError(null);
    setErrorHistory([]);
    setErrorCounts({
      network: 0,
      authentication: 0,
      authorization: 0,
      validation: 0,
      not_found: 0,
      conflict: 0,
      server_error: 0,
      timeout: 0,
      unknown: 0,
    });
  }, []);

  const retryLastOperation = useCallback(async () => {
    if (lastOperationRef.current) {
      await handleErrorWithRetry(lastOperationRef.current, 'retry_last_operation');
    }
  }, [handleErrorWithRetry]);

  const reportError = useCallback((errorInfo: ErrorInfo) => {
    onReport?.(errorInfo);
  }, [onReport]);

  // ============================================
  // RETURN
  // ============================================
  
  return {
    // State
    lastError,
    errorHistory,
    isRetrying,
    errorCounts,
    
    // Actions
    handleError,
    handleErrorWithRetry,
    clearError,
    clearAllErrors,
    retryLastOperation,
    reportError,
  };
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Hook para manejo de errores de API específicamente
 */
export function useApiErrorHandler(config?: ErrorHandlerConfig) {
  return useErrorHandler({
    ...config,
    reportCategories: ['server_error', 'authentication', 'unknown'],
    globalContext: {
      ...config?.globalContext,
      type: 'api_error',
    },
  });
}

/**
 * Hook para manejo de errores de formularios
 */
export function useFormErrorHandler(config?: ErrorHandlerConfig) {
  return useErrorHandler({
    ...config,
    showToasts: false, // Los formularios manejan sus propios errores
    reportCategories: ['validation'],
    globalContext: {
      ...config?.globalContext,
      type: 'form_error',
    },
  });
}

/**
 * Hook para errores críticos de aplicación
 */
export function useCriticalErrorHandler(config?: ErrorHandlerConfig) {
  return useErrorHandler({
    ...config,
    reportCategories: ['server_error', 'authentication', 'unknown'],
    onError: (errorInfo) => {
      // Reportar inmediatamente errores críticos
      if (errorInfo.severity === 'critical') {
        console.error('CRITICAL ERROR:', errorInfo);
        // Aquí podrías integrar con Sentry, LogRocket, etc.
      }
      config?.onError?.(errorInfo);
    },
    globalContext: {
      ...config?.globalContext,
      type: 'critical_error',
    },
  });
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default useErrorHandler;
