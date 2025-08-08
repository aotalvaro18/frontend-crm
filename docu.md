// src/router.tsx
// Router principal del CRM siguiendo la guía arquitectónica
// Mobile-first, enterprise-grade routing

import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Layout from '@/components/layout/Layout';
import Page from '@/components/layout/Page';
import LoginPage from '@/pages/auth/LoginPage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================
// LAZY LOADING COMPONENTS (Performance first)
// ============================================

// --- MÓDULOS YA CREADOS ---
// Contact Management
const ContactListPage = React.lazy(() => import('@/pages/contacts/ContactListPage'));
const ContactDetailPage = React.lazy(() => import('@/pages/contacts/ContactDetailPage'));
const ContactCreatePage = React.lazy(() => import('@/pages/contacts/ContactCreatePage'));

// --- MÓDULOS POR IMPLEMENTAR (COMENTADOS PARA EVITAR ERRORES) ---
/*
// Dashboard
const DashboardPage = React.lazy(() => import('@/pages/dashboard/DashboardPage'));

// Deal Management
const DealListPage = React.lazy(() => import('@/pages/deals/DealListPage'));
const DealDetailPage = React.lazy(() => import('@/pages/deals/DealDetailPage'));
const DealKanbanPage = React.lazy(() => import('@/pages/deals/DealKanbanPage'));

// Companies
const CompanyListPage = React.lazy(() => import('@/pages/companies/CompanyListPage'));
const CompanyDetailPage = React.lazy(() => import('@/pages/companies/CompanyDetailPage'));

// Reports & Analytics
const ReportsPage = React.lazy(() => import('@/pages/reports/ReportsPage'));

// Settings
const SettingsPage = React.lazy(() => import('@/pages/settings/SettingsPage'));
const ProfilePage = React.lazy(() => import('@/pages/settings/ProfilePage'));

// Member Portal Integration
const PortalStatsPage = React.lazy(() => import('@/pages/portal/PortalStatsPage'));
*/

// ============================================
// ROUTE PROTECTION COMPONENT
// ============================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = [] 
}) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-dark-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole.length > 0 && user) {
    const hasRequiredRole = requiredRole.some(role => 
      user.roles.includes(role)
    );
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

// ============================================
// SUSPENSE WRAPPER (Sin cambios)
// ============================================

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="md" />
    </div>
  }>
    {children}
  </Suspense>
);

// ============================================
// ROUTER CONFIGURATION (✅ AJUSTADO Y COMENTADO)
// ============================================

export const router = createBrowserRouter([
  // PUBLIC ROUTES
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: (
      <div className="min-h-screen bg-app-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Acceso Denegado</h1>
          <p className="text-app-gray-400 mb-6">No tienes permisos para acceder a esta página.</p>
          <a href="/" className="text-app-accent-500 hover:underline">Volver al inicio</a>
        </div>
      </div>
    ),
  },

  // PROTECTED ROUTES
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // ✅ Ruta por defecto ahora apunta a 'contacts' para que funcione
      {
        index: true,
        element: <Navigate to="/contacts" replace />,
      },

      /*
      // --- DASHBOARD (COMENTADO HASTA QUE SE CREE 'DashboardPage') ---
      {
        path: 'dashboard',
        element: (
          <SuspenseWrapper>
            <Page title="Dashboard">
              <DashboardPage />
            </Page>
          </SuspenseWrapper>
        ),
      },
      */

      // --- CONTACT MANAGEMENT ROUTES (ACTIVAS) ---
      {
        path: 'contacts',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <Page title="Contactos">
                  <ContactListPage />
                </Page>
              </SuspenseWrapper>
            ),
          },
          {
            path: 'new',
            element: (
              <SuspenseWrapper>
                <Page title="Nuevo Contacto">
                  <ContactCreatePage />
                </Page>
              </SuspenseWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <SuspenseWrapper>
                <Page title="Detalle del Contacto">
                  <ContactDetailPage />
                </Page>
              </SuspenseWrapper>
            ),
          },
        ],
      },

      /*
      // --- DEAL MANAGEMENT (COMENTADO HASTA QUE SE CREEN LAS PÁGINAS) ---
      {
        path: 'deals',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <Page title="Oportunidades">
                  <DealListPage />
                </Page>
              </SuspenseWrapper>
            ),
          },
          {
            path: 'kanban',
            element: (
              <SuspenseWrapper>
                <Page title="Pipeline">
                  <DealKanbanPage />
                </Page>
              </SuspenseWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <SuspenseWrapper>
                <Page title="Detalle de Oportunidad">
                  <DealDetailPage />
                </Page>
              </SuspenseWrapper>
            ),
          },
        ],
      },
      */

      /*
      // --- COMPANY MANAGEMENT (COMENTADO HASTA QUE SE CREEN LAS PÁGINAS) ---
      {
        path: 'companies',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <Page title="Empresas">
                  <CompanyListPage />
                </Page>
              </SuspenseWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <SuspenseWrapper>
                <Page title="Detalle de Empresa">
                  <CompanyDetailPage />
                </Page>
              </SuspenseWrapper>
            ),
          },
        ],
      },
      */

      /*
      // --- OTRAS SECCIONES (COMENTADAS) ---
      {
        path: 'reports',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'MANAGER']}>
            <SuspenseWrapper>
              <Page title="Reportes">
                <ReportsPage />
              </Page>
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'portal/stats',
        element: (
          <SuspenseWrapper>
            <Page title="Portal Digital">
              <PortalStatsPage />
            </Page>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'settings',
        element: (
          <SuspenseWrapper>
            <Page title="Configuración">
              <SettingsPage />
            </Page>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'profile',
        element: (
          <SuspenseWrapper>
            <Page title="Mi Perfil">
              <ProfilePage />
            </Page>
          </SuspenseWrapper>
        ),
      },
      */

      // CATCH-ALL REDIRECT (Para rutas protegidas no encontradas)
      {
        path: '*',
        element: <Navigate to="/contacts" replace />, // Apunta a una ruta que sabes que existe
      },
    ],
  },

  // FALLBACK GENERAL (Para rutas públicas no encontradas)
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;