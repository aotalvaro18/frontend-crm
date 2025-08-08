// src/router.tsx
// Router principal del CRM siguiendo la guía arquitectónica
// Mobile-first, enterprise-grade routing

import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Page from '@/components/layout/Page';
import LoginPage from '@/pages/auth/LoginPage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ✅ CORRECCIÓN: Importamos el componente de protección de rutas real y reutilizable.
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// ============================================
// LAZY LOADING COMPONENTS (Performance first)
// ============================================

// --- MÓDULOS YA CREADOS ---
const ContactListPage = React.lazy(() => import('@/pages/contacts/ContactListPage'));
const ContactDetailPage = React.lazy(() => import('@/pages/contacts/ContactDetailPage'));
const ContactCreatePage = React.lazy(() => import('@/pages/contacts/ContactCreatePage'));

// --- MÓDULOS POR IMPLEMENTAR (Comentados para evitar errores) ---
// (El resto de tus imports lazy se mantienen igual)
/*
const DashboardPage = React.lazy(() => import('@/pages/dashboard/DashboardPage'));
...etc
*/

// ============================================
// ✅ CORRECCIÓN: Se eliminó la definición local de ProtectedRoute.
// Usamos la versión importada que es más completa y mantenible.
// ============================================

// ============================================
// SUSPENSE WRAPPER
// ============================================

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={
    <div className="flex-grow flex items-center justify-center p-8 bg-app-dark-900">
      <LoadingSpinner size="md" />
    </div>
  }>
    {children}
  </Suspense>
);

// ============================================
// ROUTER CONFIGURATION
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
    // El Layout ahora está protegido. Si no estás autenticado, serás redirigido a /login.
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // Si el usuario llega a '/', lo redirigimos a la página principal del CRM.
      {
        index: true,
        element: <Navigate to="/contacts" replace />,
      },

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

      // ... (Tus otras rutas comentadas se mantienen igual aquí) ...

      // CATCH-ALL DENTRO DEL ÁREA PROTEGIDA
      // Si el usuario está logueado pero va a una URL protegida que no existe (ej. /settings/typo)
      // lo redirigimos a la página principal del CRM.
      {
        path: '*',
        element: <Navigate to="/contacts" replace />,
      },
    ],
  },

  // FALLBACK GENERAL PARA CUALQUIER OTRA RUTA NO ENCONTRADA
  // Esta es la regla clave que te dirige a /login por defecto.
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;