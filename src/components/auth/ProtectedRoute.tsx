// src/components/auth/ProtectedRoute.tsx
// Guardián de seguridad enterprise para rutas protegidas
// Mobile-first, role-based access control with comprehensive auth checks

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useAuth } from '@/context/AuthContext';
//import { cn } from '@/utils/cn';
// 🧹 LIMPIEZA: Se eliminó el self-import de ProtectedRouteProps, ya que se define a continuación.

// ============================================
// TYPES
// ============================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required roles to access this route */
  requiredRoles?: string[];
  /** Required permissions to access this route */
  requiredPermissions?: string[];
  /** Fallback component for unauthorized access */
  fallback?: React.ComponentType<{ reason: string }>;
  /** Custom authorization check function */
  customAuthCheck?: (user: any) => boolean | Promise<boolean>;
  /** Whether to require email verification */
  requireEmailVerification?: boolean;
  /** Whether to require organization context */
  requireOrganization?: boolean;
  /** Redirect path for unauthorized users */
  unauthorizedRedirect?: string;
  /** Show detailed error messages (dev mode) */
  showDetailedErrors?: boolean;
}

interface AuthCheckResult {
  isAuthorized: boolean;
  reason?: string;
  redirectTo?: string;
}

// Este tipo es "ProtectedRouteProps" pero sin la propiedad 'children',
// ideal para la lógica de autorización pura.
type AuthCheckProps = Omit<ProtectedRouteProps, 'children'>;

// ============================================
// AUTHORIZATION UTILITIES
// ============================================

/**
 * Comprehensive authorization check
 */
const checkAuthorization = async (
  user: any, // 💡 OPORTUNIDAD: Definir un tipo 'User' estricto mejoraría la seguridad.
  isAuthenticated: boolean,
  // ✅ CORRECCIÓN 1: La función ahora espera 'AuthCheckProps' en lugar del 'ProtectedRouteProps' completo.
  // Esto resuelve el error principal, ya que ahora coincide con el objeto 'authProps' que se le pasa.
  props: AuthCheckProps
): Promise<AuthCheckResult> => {
  const {
    requiredRoles = [],
    requiredPermissions = [],
    customAuthCheck,
    requireEmailVerification = false,
    requireOrganization = false,
  } = props;

  // 1. Basic authentication check
  if (!isAuthenticated || !user) {
    return {
      isAuthorized: false,
      reason: 'Usuario no autenticado',
      redirectTo: '/login',
    };
  }

  // 2. Account status check
  if (!user.isActive) {
    return {
      isAuthorized: false,
      reason: 'Cuenta desactivada. Contacta al administrador.',
    };
  }

  // 3. Email verification check
  if (requireEmailVerification && !user.emailVerified) {
    return {
      isAuthorized: false,
      reason: 'Debes verificar tu email antes de continuar.',
      redirectTo: '/verify-email',
    };
  }

  // 4. Organization context check
  if (requireOrganization && !user.organizationId) {
    return {
      isAuthorized: false,
      reason: 'No tienes una organización asignada. Contacta al administrador.',
    };
  }

  // 5. Role-based check
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role =>
      user.roles?.includes(role)
    );

    if (!hasRequiredRole) {
      return {
        isAuthorized: false,
        reason: `Acceso denegado. Roles requeridos: ${requiredRoles.join(', ')}`,
      };
    }
  }

  // 6. Permission-based check
  if (requiredPermissions.length > 0) {
    // This would integrate with your permission system
    const hasRequiredPermissions = requiredPermissions.every(permission => {
      // TODO: Implement with your permission checking logic
      return user.permissions?.includes(permission) ||
             user.roles?.includes('ADMIN'); // Admin bypass
    });

    if (!hasRequiredPermissions) {
      return {
        isAuthorized: false,
        reason: `Permisos insuficientes. Se requiere: ${requiredPermissions.join(', ')}`,
      };
    }
  }

  // 7. Custom authorization check
  if (customAuthCheck) {
    try {
      const customResult = await customAuthCheck(user);
      if (!customResult) {
        return {
          isAuthorized: false,
          reason: 'Acceso denegado por validación personalizada',
        };
      }
    } catch (error) {
      console.error('Custom auth check failed:', error);
      return {
        isAuthorized: false,
        reason: 'Error en validación de acceso',
      };
    }
  }

  return { isAuthorized: true };
};

// ============================================
// UNAUTHORIZED ACCESS COMPONENT
// ============================================

const UnauthorizedAccess: React.FC<{
  reason: string;
  user?: any;
  showDetailedErrors?: boolean;
  onRetry?: () => void;
}> = ({ reason, user, showDetailedErrors = false, onRetry }) => (
  <div className="min-h-screen bg-app-dark-900 flex items-center justify-center p-4">
    <div className="max-w-md w-full">
      <ErrorMessage
        title="Acceso Denegado"
        message={reason}
        variant="warning"
        size="lg"
        onRetry={onRetry}
        retryText="Verificar Acceso"
        className="mb-6"
      />

      {/* Development info */}
      {/* ✅ CORRECCIÓN 2: Se usa la sintaxis de corchetes para acceder a la variable de entorno,
          cumpliendo con la regla de TypeScript para propiedades de firmas de índice. */}
      {showDetailedErrors && import.meta.env['DEV'] && user && (
        <div className="bg-app-dark-800 border border-app-dark-600 rounded-lg p-4">
          <h3 className="text-sm font-medium text-app-gray-300 mb-2">
            Información de Usuario (Desarrollo)
          </h3>
          <pre className="text-xs text-app-gray-400 overflow-auto">
            {JSON.stringify({
              id: user.id,
              email: user.email,
              roles: user.roles,
              organizationId: user.organizationId,
              isActive: user.isActive,
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  </div>
);

// ============================================
// LOADING COMPONENT
// ============================================

const AuthLoadingScreen: React.FC<{
  message?: string;
}> = ({ message = 'Verificando permisos...' }) => (
  <div className="min-h-screen bg-app-dark-900 flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="text-app-gray-400 mt-4 text-sm">
        {message}
      </p>
    </div>
  </div>
);

// ============================================
// MAIN PROTECTED ROUTE COMPONENT
// ============================================

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback: FallbackComponent,
  unauthorizedRedirect = '/login',
  showDetailedErrors = import.meta.env['DEV'],
  ...authProps // 'authProps' es de tipo 'AuthCheckProps' gracias a la sintaxis rest
}) => {
  const location = useLocation();
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    refreshUser,
    isTokenValid
  } = useAuth();

  // Local state for authorization check
  const [authCheck, setAuthCheck] = useState<{
    isChecking: boolean;
    result?: AuthCheckResult;
  }>({ isChecking: true });

  // ============================================
  // AUTHORIZATION CHECK EFFECT
  // ============================================

  useEffect(() => {
    let mounted = true;

    const performAuthCheck = async () => {
      if (!isInitialized) return;

      setAuthCheck({ isChecking: true });

      try {
        // Check if token is still valid
        if (isAuthenticated && user) {
          const tokenIsValid = await isTokenValid();
          if (!tokenIsValid) {
            // Token expired, redirect to login
            setAuthCheck({
              isChecking: false,
              result: {
                isAuthorized: false,
                reason: 'Sesión expirada',
                redirectTo: '/login',
              },
            });
            return;
          }
        }

        // Perform comprehensive authorization check. Ahora esta llamada es 100% válida.
        const result = await checkAuthorization(user, isAuthenticated, authProps);

        if (mounted) {
          setAuthCheck({
            isChecking: false,
            result,
          });
        }
      } catch (error) {
        console.error('Authorization check failed:', error);
        if (mounted) {
          setAuthCheck({
            isChecking: false,
            result: {
              isAuthorized: false,
              reason: 'Error al verificar permisos',
            },
          });
        }
      }
    };

    performAuthCheck();

    return () => {
      mounted = false;
    };
  }, [
    user,
    isAuthenticated,
    isInitialized,
    isTokenValid,
    // La serialización es una forma de detectar cambios en el objeto de props de autorización.
    // Es una técnica pragmática y válida.
    JSON.stringify(authProps) 
  ]);

  // ============================================
  // RETRY HANDLER
  // ============================================

  const handleRetry = async () => {
    setAuthCheck({ isChecking: true });
    try {
      await refreshUser();
      // The effect will re-run due to user state change
    } catch (error) {
      console.error('Retry failed:', error);
      setAuthCheck({
        isChecking: false,
        result: {
          isAuthorized: false,
          reason: 'Error al actualizar información de usuario',
        },
      });
    }
  };

  // ============================================
  // RENDER LOGIC
  // ============================================

  // Show loading while auth is initializing or checking
  if (isLoading || !isInitialized || authCheck.isChecking) {
    return <AuthLoadingScreen />;
  }

  // Handle authorization result
  const { result } = authCheck;

  if (!result?.isAuthorized) {
    // Redirect if specified
    if (result?.redirectTo) {
      return (
        <Navigate
          to={result.redirectTo}
          state={{ from: location.pathname }}
          replace
        />
      );
    }

    // Show custom fallback component
    if (FallbackComponent) {
      return <FallbackComponent reason={result?.reason || 'Acceso denegado'} />;
    }

    // Show default unauthorized screen
    return (
      <UnauthorizedAccess
        reason={result?.reason || 'No tienes permisos para acceder a esta página'}
        user={user}
        showDetailedErrors={showDetailedErrors}
        onRetry={handleRetry}
      />
    );
  }

  // User is authorized, render children
  return <>{children}</>;
};

// ============================================
// CONVENIENCE WRAPPERS
// ============================================

/**
 * HOC for creating role-protected routes
 */
export const withRoleProtection = (
  requiredRoles: string[]
) => (Component: React.ComponentType) => {
  return function ProtectedComponent(props: any) {
    return (
      <ProtectedRoute requiredRoles={requiredRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

/**
 * Admin-only route wrapper
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['ADMIN']}>
    {children}
  </ProtectedRoute>
);

/**
 * Manager+ route wrapper
 */
export const ManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
    {children}
  </ProtectedRoute>
);

/**
 * Organization-required route wrapper
 */
export const OrganizationRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireOrganization>
    {children}
  </ProtectedRoute>
);

// ============================================
// HOOK FOR COMPONENT-LEVEL AUTH CHECKS
// ============================================

export const useRouteAuth = (authProps: Omit<ProtectedRouteProps, 'children'>) => {
  const { user, isAuthenticated } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authReason, setAuthReason] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      // Esta llamada también se beneficia de la corrección en 'checkAuthorization'
      const result = await checkAuthorization(user, isAuthenticated, authProps);
      setIsAuthorized(result.isAuthorized);
      setAuthReason(result.reason || '');
    };

    checkAuth();
  }, [user, isAuthenticated, JSON.stringify(authProps)]);

  return { isAuthorized, authReason };
};

export default ProtectedRoute;