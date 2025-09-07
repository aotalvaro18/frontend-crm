// src/router.tsx
// ✅ ROUTER FINAL - Estrategia UX consolidada: /deals para usuarios, /settings/pipelines para admins

import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { authLogger } from '@/types/auth.types';

// ============================================
// LAZY IMPORTS - ARQUITECTURA FINAL
// ============================================

// ✅ Auth pages
const LoginPage = lazy(() => {
  authLogger.info('Loading LoginPage...');
  return import('@/pages/auth/LoginPage');
});

// ✅ Contact pages
const ContactListPage = lazy(() => {
  authLogger.info('Loading ContactListPage...');
  return import('@/pages/contacts/ContactListPage');
});

const ContactDetailPage = lazy(() => {
  authLogger.info('Loading ContactDetailPage...');
  return import('@/pages/contacts/ContactDetailPage').catch(() => {
    return { default: () => <div>ContactDetailPage - En desarrollo</div> };
  });
});

const ContactCreatePage = lazy(() => {
  authLogger.info('Loading ContactCreatePage...');
  return import('@/pages/contacts/ContactCreatePage').catch(() => {
    return { default: () => <div>ContactCreatePage - En desarrollo</div> };
  });
});

// ✅ Company pages
const CompanyListPage = lazy(() => {
  authLogger.info('Loading CompanyListPage...');
  return import('@/pages/companies/CompanyListPage');
});

const CompanyDetailPage = lazy(() => {
  authLogger.info('Loading CompanyDetailPage...');
  return import('@/pages/companies/CompanyDetailPage');
});

const CompanyCreatePage = lazy(() => {
  authLogger.info('Loading CompanyCreatePage...');
  return import('@/pages/companies/CompanyCreatePage');
});

// ✅ Pipeline pages (para /deals = usuario diario)
const PipelineListPage = lazy(() => {
  authLogger.info('Loading PipelineListPage...');
  return import('@/pages/pipelines/PipelineListPage');
});

const PipelineDetailPage = lazy(() => {
  authLogger.info('Loading PipelineDetailPage...');
  return import('@/pages/pipelines/PipelineDetailPage');
});

// ✅ Settings pages (hub + pipeline admin)
const SettingsPage = lazy(() => {
  authLogger.info('Loading SettingsPage...');
  return import('@/pages/settings/SettingsPage');
});

const PipelinesSettingsPage = lazy(() => {
  authLogger.info('Loading PipelinesSettingsPage...');
  return import('@/pages/settings/PipelinesSettingsPage');
});

const PipelineCreatePage = lazy(() => {
  authLogger.info('Loading PipelineCreatePage...');
  return import('@/pages/pipelines/PipelineCreatePage');
});

const PipelineEditPage = lazy(() => {
  authLogger.info('Loading PipelineEditPage...');
  return import('@/pages/pipelines/PipelineEditPage');
});

// ✅ Layout
const MainLayout = lazy(() => {
  authLogger.info('Loading MainLayout...');
  return import('@/components/layout/Layout').catch(() => {
    const FallbackMainLayout: React.FC = () => (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div>Layout fallback - Error cargando Layout principal</div>
        </div>
      </div>
    );
    return { default: FallbackMainLayout };
  });
});

// ============================================
// SUSPENSE WRAPPER
// ============================================

const SuspenseWrapper: React.FC<{ 
  children: React.ReactNode; 
  fallbackText?: string; 
}> = ({ children, fallbackText = 'Cargando...' }) => (
  <Suspense 
    fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">{fallbackText}</p>
        </div>
      </div>
    }
  >
    {children}
  </Suspense>
);

// ============================================
// ERROR ELEMENT
// ============================================

const RouterErrorElement: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center p-8 max-w-md">
      <div className="text-red-500 text-6xl mb-4">🚫</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Página No Encontrada
      </h1>
      <p className="text-gray-600 mb-6">
        La página que buscas no existe o ha sido movida.
      </p>
      <div className="space-y-3">
        <button
          onClick={() => window.location.href = '/contacts'}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Ir al Dashboard
        </button>
        <button
          onClick={() => window.history.back()}
          className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
        >
          Volver Atrás
        </button>
      </div>
    </div>
  </div>
);

// ============================================
// PÁGINAS PLACEHOLDER PARA DESARROLLO
// ============================================

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center p-8">
      <div className="text-gray-400 text-6xl mb-4">🚧</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600 mb-6">Esta página está en desarrollo</p>
      <button
        onClick={() => window.location.href = '/contacts'}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Volver al Dashboard
      </button>
    </div>
  </div>
);

// ============================================
// ROUTER CONFIGURATION - VERSIÓN FINAL
// ============================================

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouterErrorElement />,
    children: [
      // ============================================
      // RUTAS PÚBLICAS
      // ============================================
      {
        path: 'login',
        element: (
          <SuspenseWrapper fallbackText="Cargando login...">
            <LoginPage />
          </SuspenseWrapper>
        ),
      },
      
      // ============================================
      // RUTAS PROTEGIDAS (DENTRO DEL LAYOUT)
      // ============================================
      {
        path: '',
        element: (
          <SuspenseWrapper fallbackText="Cargando aplicación...">
            <MainLayout />
          </SuspenseWrapper>
        ),
        children: [
          // --- ROOT REDIRECT ---
          {
            index: true,
            element: <Navigate to="/contacts" replace />,
          },

          // ============================================
          // MÓDULO DE CONTACTOS
          // ============================================
          {
            path: 'contacts',
            element: (
              <SuspenseWrapper fallbackText="Cargando contactos...">
                <ContactListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'contacts/new',
            element: (
              <SuspenseWrapper fallbackText="Cargando formulario...">
                <ContactCreatePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'contacts/:id',
            element: (
              <SuspenseWrapper fallbackText="Cargando contacto...">
                <ContactDetailPage />
              </SuspenseWrapper>
            ),
          },

          // ============================================
          // MÓDULO DE EMPRESAS
          // ============================================
          {
            path: 'companies',
            element: (
              <SuspenseWrapper fallbackText="Cargando empresas...">
                <CompanyListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'companies/new',
            element: (
              <SuspenseWrapper fallbackText="Cargando formulario...">
                <CompanyCreatePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'companies/:id',
            element: (
              <SuspenseWrapper fallbackText="Cargando empresa...">
                <CompanyDetailPage />
              </SuspenseWrapper>
            ),
          },

          // ============================================
          // MÓDULO DE OPORTUNIDADES (USUARIO DIARIO)
          // URL: /deals → Renderiza PipelineListPage (Kanban)
          // ============================================
          {
            path: 'deals',
            element: (
              <SuspenseWrapper fallbackText="Cargando oportunidades...">
                <PipelineListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'deals/:id',
            element: (
              <SuspenseWrapper fallbackText="Cargando oportunidad...">
                <PipelineDetailPage />
              </SuspenseWrapper>
            ),
          },

          // ============================================
          // MÓDULO DE REPORTES (PLACEHOLDER)
          // ============================================
          {
            path: 'reports',
            element: <PlaceholderPage title="Reportes y Analytics" />,
          },

          // ============================================
          // MÓDULO DE CONFIGURACIÓN (ADMINISTRADOR)
          // ============================================
          {
            path: 'settings',
            children: [
              // --- HUB DE CONFIGURACIÓN ---
              {
                index: true,
                element: (
                  <SuspenseWrapper fallbackText="Cargando configuración...">
                    <SettingsPage />
                  </SuspenseWrapper>
                ),
              },
              // --- GESTIÓN DE PIPELINES (ADMIN) ---
              {
                path: 'pipelines',
                element: (
                  <SuspenseWrapper fallbackText="Cargando configuración de pipelines...">
                    <PipelinesSettingsPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'pipelines/new',
                element: (
                  <SuspenseWrapper fallbackText="Cargando formulario...">
                    <PipelineCreatePage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'pipelines/:id/edit',
                element: (
                  <SuspenseWrapper fallbackText="Cargando editor...">
                    <PipelineEditPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: 'pipelines/:id',
                element: (
                  <SuspenseWrapper fallbackText="Cargando configuración...">
                    <PipelineEditPage />
                  </SuspenseWrapper>
                ),
              },
              // --- OTROS PLACEHOLDERS DE CONFIGURACIÓN ---
              { 
                path: 'billing', 
                element: <PlaceholderPage title="Facturación y Suscripción" /> 
              },
              { 
                path: 'team', 
                element: <PlaceholderPage title="Gestión de Equipo" /> 
              },
              { 
                path: 'profile', 
                element: <PlaceholderPage title="Mi Perfil" /> 
              },
              { 
                path: 'notifications', 
                element: <PlaceholderPage title="Notificaciones" /> 
              },
              { 
                path: 'organization', 
                element: <PlaceholderPage title="Datos de la Organización" /> 
              },
              { 
                path: 'security', 
                element: <PlaceholderPage title="Seguridad y Acceso" /> 
              },
              { 
                path: 'integrations', 
                element: <PlaceholderPage title="Integraciones" /> 
              },
              { 
                path: 'custom-fields', 
                element: <PlaceholderPage title="Campos Personalizados" /> 
              },
              { 
                path: 'reports', 
                element: <PlaceholderPage title="Configuración de Reportes" /> 
              },
              { 
                path: 'analytics', 
                element: <PlaceholderPage title="Analytics Avanzados" /> 
              },
            ],
          },
        ],
      },

      // ============================================
      // CATCH-ALL ROUTE / 404
      // ============================================
      {
        path: '*',
        element: <RouterErrorElement />,
      },
    ],
  },
]);

export default router;