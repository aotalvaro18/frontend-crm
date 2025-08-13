 // src/components/layout/Page.tsx
// Componente declarativo para manejo del <head> siguiendo best practices
// Enterprise-grade, extensible y SSR-ready

import React from 'react';
import { Helmet } from 'react-helmet-async';

// ============================================
// TYPES
// ============================================

// ✅ Definimos el tipo para un solo breadcrumb
interface BreadcrumbItem {
  label: string;
  href?: string; // Opcional si es el último
}

interface PageProps extends React.HTMLAttributes<HTMLElement> {
  // --- TUS PROPS DE SEO (Están perfectas) ---
  children: React.ReactNode;
  title: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  noIndex?: boolean;

  // --- PROP PERSONALIZADA (También necesaria) ---
  /**
   * Controla si se muestra el header principal de la aplicación.
   */
  breadcrumbs?: BreadcrumbItem[];
  showHeader?: boolean;
}
// ============================================
// CONSTANTS
// ============================================

const DEFAULT_DESCRIPTION = 'Sistema de gestión de relaciones con clientes (CRM) para organizaciones religiosas.';
const SITE_NAME = 'Eklesa CRM';

// ============================================
// PAGE COMPONENT
// ============================================

/**
 * Componente wrapper para cada página que gestiona las etiquetas del <head>
 * de forma declarativa usando react-helmet-async.
 * 
 * @example
 * ```tsx
 * <Page title="Contactos" description="Gestiona todos tus contactos">
 *   <ContactListPage />
 * </Page>
 * ```
 */
export const Page: React.FC<PageProps> = ({ 
  children, 
  title, 
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  noIndex = false
}) => {
  const fullTitle = `${title} | ${SITE_NAME}`;

  return (
    <>
      <Helmet>
        {/* Basic meta tags */}
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        
        {/* Keywords (if provided) */}
        {keywords && <meta name="keywords" content={keywords} />}
        
        {/* Canonical URL */}
        {canonical && <link rel="canonical" href={canonical} />}
        
        {/* Robots meta (for internal pages) */}
        {noIndex && <meta name="robots" content="noindex, nofollow" />}
        
        {/* Open Graph for social sharing */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content={ogType} />
        <meta property="og:site_name" content={SITE_NAME} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        
        {/* Mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Theme colors para mobile */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-navbutton-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Helmet>
      {children}
    </>
  );
};

// ============================================
// SPECIALIZED PAGE COMPONENTS
// ============================================

/**
 * Page component especializado para contactos
 */
export const ContactPage: React.FC<{
  children: React.ReactNode;
  contactName?: string;
  action?: 'Ver' | 'Editar' | 'Crear';
}> = ({ children, contactName, action }) => {
  const title = contactName 
    ? `${contactName}${action ? ` - ${action}` : ''}`
    : action === 'Crear' 
      ? 'Nuevo Contacto' 
      : 'Contactos';
      
  const description = contactName
    ? `Información de contacto para ${contactName}`
    : 'Gestiona todos tus contactos y relaciones comerciales';

  return (
    <Page 
      title={title} 
      description={description}
      noIndex={true} // Internal CRM pages shouldn't be indexed
    >
      {children}
    </Page>
  );
};

/**
 * Page component especializado para oportunidades
 */
export const DealPage: React.FC<{
  children: React.ReactNode;
  dealName?: string;
  action?: 'Ver' | 'Editar' | 'Crear';
}> = ({ children, dealName, action }) => {
  const title = dealName 
    ? `${dealName}${action ? ` - ${action}` : ''}`
    : action === 'Crear' 
      ? 'Nueva Oportunidad' 
      : 'Oportunidades';
      
  const description = dealName
    ? `Detalles de la oportunidad: ${dealName}`
    : 'Gestiona tu pipeline de ventas y oportunidades comerciales';

  return (
    <Page 
      title={title} 
      description={description}
      noIndex={true}
    >
      {children}
    </Page>
  );
};

/**
 * Page component especializado para empresas
 */
export const CompanyPage: React.FC<{
  children: React.ReactNode;
  companyName?: string;
  action?: 'Ver' | 'Editar' | 'Crear';
}> = ({ children, companyName, action }) => {
  const title = companyName 
    ? `${companyName}${action ? ` - ${action}` : ''}`
    : action === 'Crear' 
      ? 'Nueva Empresa' 
      : 'Empresas';
      
  const description = companyName
    ? `Información corporativa de ${companyName}`
    : 'Gestiona empresas y organizaciones en tu CRM';

  return (
    <Page 
      title={title} 
      description={description}
      noIndex={true}
    >
      {children}
    </Page>
  );
};

/**
 * Page component para páginas con estados de carga
 */
export const LoadingPage: React.FC<{
  children: React.ReactNode;
  baseTitle: string;
}> = ({ children, baseTitle }) => (
  <Page title={`Cargando ${baseTitle}...`} noIndex={true}>
    {children}
  </Page>
);

/**
 * Page component para páginas con errores
 */
export const ErrorPage: React.FC<{
  children: React.ReactNode;
  baseTitle: string;
}> = ({ children, baseTitle }) => (
  <Page title={`Error - ${baseTitle}`} noIndex={true}>
    {children}
  </Page>
);

export default Page;
