 // src/App.tsx
// Componente principal del CRM siguiendo la guía arquitectónica
// Mobile-first, enterprise-grade application shell

import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================
// APP COMPONENT (Enterprise-grade shell)
// ============================================

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    isAuthenticated, 
    isLoading, 
    initializeAuth, 
    user,
    checkAuthState 
  } = useAuthStore();

  // ============================================
  // INITIALIZATION EFFECT
  // ============================================

  useEffect(() => {
    // Initialize auth state on app start
    initializeAuth();
  }, [initializeAuth]);

  // ============================================
  // AUTH STATE MONITORING
  // ============================================

  useEffect(() => {
    // Periodically check auth state (every 5 minutes)
    const authCheckInterval = setInterval(() => {
      if (isAuthenticated) {
        checkAuthState();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(authCheckInterval);
  }, [isAuthenticated, checkAuthState]);

  // ============================================
  // ROUTE PROTECTION LOGIC
  // ============================================

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return;

    const isLoginPage = location.pathname === '/login';
    const isPublicRoute = ['/login', '/unauthorized'].includes(location.pathname);

    if (!isAuthenticated && !isPublicRoute) {
      // Redirect to login if not authenticated and not on a public route
      navigate('/login', { 
        replace: true,
        state: { from: location.pathname } // Remember where they were trying to go
      });
    } else if (isAuthenticated && isLoginPage) {
      // Redirect authenticated users away from login page
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  // ============================================
  // ORGANIZATION CONTEXT SETUP
  // ============================================

  useEffect(() => {
    if (user && isAuthenticated) {
      // Set organization context in document for CSS custom properties
      const root = document.documentElement;
      
      if (user.organizationId) {
        root.setAttribute('data-organization-id', user.organizationId.toString());
      }
      
      if (user.churchId) {
        root.setAttribute('data-church-id', user.churchId.toString());
      }

      // Set user role for conditional styling
      if (user.roles.length > 0) {
        root.setAttribute('data-user-roles', user.roles.join(','));
      }
    }
  }, [user, isAuthenticated]);

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-dark-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-app-gray-400 mt-4 text-sm">
            Iniciando CRM...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN APP RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-app-dark-900">
      {/* Global app styles and classes */}
      <div 
        className="app-container"
        data-authenticated={isAuthenticated}
        data-loading={isLoading}
      >
        {/* Main application outlet */}
        <Outlet />

        {/* Background elements for mobile experience */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-app-dark-900 via-app-dark-900 to-app-dark-800 opacity-50" />
          
          {/* Mobile-friendly decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-app-accent-500/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-app-accent-500/3 rounded-full blur-3xl transform -translate-x-32 translate-y-32" />
        </div>

        {/* Development indicators */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-50 opacity-75 pointer-events-none">
            <div className="bg-app-dark-800 border border-app-dark-600 rounded-lg px-3 py-2 text-xs">
              <div className="text-app-gray-400">
                <div>ENV: {process.env.NODE_ENV}</div>
                <div>Route: {location.pathname}</div>
                {user && (
                  <>
                    <div>User: {user.email}</div>
                    <div>Roles: {user.roles.join(', ')}</div>
                    {user.organizationId && (
                      <div>Org: {user.organizationId}</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
