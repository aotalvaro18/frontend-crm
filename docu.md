// src/router.tsx
// ✅ ROUTER QUIRÚRGICO - Solo páginas que existen

import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { authLogger } from '@/types/auth.types';

// ============================================
// LAZY IMPORTS - SOLO PÁGINAS EXISTENTES
// ============================================

// ✅ Auth pages (solo las que necesitas)
const LoginPage = lazy(() => {
  authLogger.info('Loading LoginPage...');
  return import('@/pages/auth/LoginPage');
});

// ✅ CRM pages (solo las que existen)
const ContactListPage = lazy(() => {
  authLogger.info('Loading ContactListPage...');
  return import('@/pages/contacts/ContactListPage');
});

const ContactDetailPage = lazy(() => {
  authLogger.info('Loading ContactDetailPage...');
  return import('@/pages/contacts/ContactDetailPage').catch(() => {
    // Fallback si no existe
    return { default: () => <div>ContactDetailPage - En desarrollo</div> };
  });
});

const ContactCreatePage = lazy(() => {
  authLogger.info('Loading ContactCreatePage...');
  return import('@/pages/contacts/ContactCreatePage').catch(() => {
    return { default: () => <div>ContactCreatePage - En desarrollo</div> };
  });
});

// ✅ COMPANY pages (las que ya existen)
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

const MainLayout = lazy(() => {
  return import('@/components/layout/Layout').catch(() => {
    // Simple fallback layout
    const FallbackMainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">{children}</div>
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
// ROUTER CONFIGURATION
// ============================================

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouterErrorElement />,
    children: [
      // ============================================
      // AUTH ROUTES
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
      // CONTACTS ROUTES (EXISTENTES)
      // ============================================
      {
        path: 'contacts',
        element: (
          <SuspenseWrapper fallbackText="Cargando contactos...">
            <MainLayout>
              <ContactListPage />
            </MainLayout>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'contacts/new',
        element: (
          <SuspenseWrapper fallbackText="Cargando formulario...">
            <MainLayout>
              <ContactCreatePage />
            </MainLayout>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'contacts/:id',
        element: (
          <SuspenseWrapper fallbackText="Cargando contacto...">
            <MainLayout>
              <ContactDetailPage />
            </MainLayout>
          </SuspenseWrapper>
        ),
      },

      // ============================================
      // PLACEHOLDER ROUTES (PARA DESARROLLO)
      // ============================================
      {
        path: 'deals',
        element: (
          <MainLayout>
            <PlaceholderPage title="Gestión de Oportunidades" />
          </MainLayout>
        ),
      },
      {
        path: 'deals/:id',
        element: (
          <MainLayout>
            <PlaceholderPage title="Detalle de Oportunidad" />
          </MainLayout>
        ),
      },
      // ============================================
      // COMPANIES ROUTES (ACTIVADAS)
      // ============================================
      {
        path: 'companies',
        element: (
          <SuspenseWrapper fallbackText="Cargando empresas...">
            <MainLayout>
              <CompanyListPage />
            </MainLayout>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'companies/new',
        element: (
          <SuspenseWrapper fallbackText="Cargando formulario...">
            <MainLayout>
              <CompanyCreatePage />
            </MainLayout>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'companies/:id',
        element: (
          <SuspenseWrapper fallbackText="Cargando empresa...">
            <MainLayout>
              <CompanyDetailPage />
            </MainLayout>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'reports',
        element: (
          <MainLayout>
            <PlaceholderPage title="Reportes y Analytics" />
          </MainLayout>
        ),
      },
      {
        path: 'settings',
        element: (
          <MainLayout>
            <PlaceholderPage title="Configuración" />
          </MainLayout>
        ),
      },

      // ============================================
      // ROOT REDIRECT
      // ============================================
      {
        index: true,
        element: <Navigate to="/contacts" replace />,
      },

      // ============================================
      // CATCH-ALL ROUTE
      // ============================================
      {
        path: '*',
        element: <RouterErrorElement />,
      },
    ],
  },
]);

export default router;