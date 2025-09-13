 // src/components/layout/Page.tsx
// Componente declarativo para manejo del <head> siguiendo best practices
// Enterprise-grade, extensible y SSR-ready

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

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
  subtitle?: string;
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
  showBackButton?: boolean;
  onBack?: () => void;
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
// ============================================
// PAGE COMPONENT
// ============================================
export const Page: React.FC<PageProps> = ({ 
  children, 
  title, 
  subtitle, // Añadido
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  noIndex = false,
  breadcrumbs, // Añadido
  showHeader = true, // Añadido
  showBackButton = false, // Añadido
  onBack, // Añadido
  className, // Añadido
  ...props // Añadido
}) => {
  const fullTitle = `${title} | ${SITE_NAME}`;

  return (
    <>
      <Helmet>
        {/* Tu código de Helmet se queda exactamente igual */}
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords} />}
        {canonical && <link rel="canonical" href={canonical} />}
        {noIndex && <meta name="robots" content="noindex, nofollow" />}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content={ogType} />
        <meta property="og:site_name" content={SITE_NAME} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-navbutton-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Helmet>
      
      {/* ✅ 2. ENVOLVEMOS EL CONTENIDO EN UN <main> Y AÑADIMOS EL HEADER */}
      <main className={cn("p-4 sm:p-6", className)} {...props}>
        {showHeader && (
          <header className="mb-6">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav aria-label="Breadcrumb" className="mb-2">
                {/* ... (lógica de breadcrumbs si la necesitas) ... */}
              </nav>
            )}
            
            <div className="flex items-center gap-3">
              {showBackButton && onBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="flex-shrink-0 -ml-2 text-app-gray-400 hover:text-white"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-app-gray-100">{title}</h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-app-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </header>
        )}
        
        {children}
      </main>
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
