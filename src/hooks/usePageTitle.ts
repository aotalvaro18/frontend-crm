 // src/hooks/usePageTitle.ts
// ✅ Hook empresarial para manejo de títulos de página
// Mobile-first, SEO optimizado, integrado con HelmetProvider

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { env } from '@/config/environment';
import { useCurrentUser } from '@/stores/authStore';

// ============================================
// TYPES SEGUROS
// ============================================

interface PageTitleOptions {
  title?: string;
  subtitle?: string;
  showUserName?: boolean;
  showOrganization?: boolean;
  template?: 'default' | 'admin' | 'portal' | 'auth';
  appendAppName?: boolean;
  separator?: string;
}

interface RouteMapping {
  pattern: RegExp;
  title: string;
  subtitle?: string;
  template?: PageTitleOptions['template'];
}

// ============================================
// ROUTE MAPPINGS (Basado en estructura del proyecto)
// ============================================

const ROUTE_MAPPINGS: RouteMapping[] = [
  // Auth routes
  { pattern: /^\/login/, title: 'Iniciar Sesión', template: 'auth' },
  { pattern: /^\/register/, title: 'Crear Cuenta', template: 'auth' },
  { pattern: /^\/forgot-password/, title: 'Recuperar Contraseña', template: 'auth' },
  { pattern: /^\/reset-password/, title: 'Restablecer Contraseña', template: 'auth' },
  
  // Dashboard
  { pattern: /^\/dashboard$/, title: 'Dashboard', subtitle: 'Resumen General' },
  { pattern: /^\/$/, title: 'Dashboard', subtitle: 'Resumen General' },
  
  // Contacts
  { pattern: /^\/contacts$/, title: 'Contactos', subtitle: 'Gestión de Contactos' },
  { pattern: /^\/contacts\/new/, title: 'Nuevo Contacto', subtitle: 'Crear Contacto' },
  { pattern: /^\/contacts\/(\d+)\/edit/, title: 'Editar Contacto', subtitle: 'Modificar Información' },
  { pattern: /^\/contacts\/(\d+)/, title: 'Detalle Contacto', subtitle: 'Información Completa' },
  { pattern: /^\/contacts\/import/, title: 'Importar Contactos', subtitle: 'Carga Masiva' },
  { pattern: /^\/contacts\/export/, title: 'Exportar Contactos', subtitle: 'Descarga de Datos' },
  
  // Companies
  { pattern: /^\/companies$/, title: 'Empresas', subtitle: 'Gestión de Empresas' },
  { pattern: /^\/companies\/new/, title: 'Nueva Empresa', subtitle: 'Crear Empresa' },
  { pattern: /^\/companies\/(\d+)\/edit/, title: 'Editar Empresa', subtitle: 'Modificar Información' },
  { pattern: /^\/companies\/(\d+)/, title: 'Detalle Empresa', subtitle: 'Información Completa' },
  
  // Deals/Pipeline
  { pattern: /^\/deals$/, title: 'Pipeline', subtitle: 'Gestión de Oportunidades' },
  { pattern: /^\/deals\/kanban/, title: 'Kanban Board', subtitle: 'Vista de Pipeline' },
  { pattern: /^\/deals\/new/, title: 'Nueva Oportunidad', subtitle: 'Crear Deal' },
  { pattern: /^\/deals\/(\d+)\/edit/, title: 'Editar Oportunidad', subtitle: 'Modificar Deal' },
  { pattern: /^\/deals\/(\d+)/, title: 'Detalle Oportunidad', subtitle: 'Información Completa' },
  
  // Activities
  { pattern: /^\/activities$/, title: 'Actividades', subtitle: 'Registro de Actividades' },
  { pattern: /^\/activities\/calendar/, title: 'Calendario', subtitle: 'Vista de Calendario' },
  { pattern: /^\/activities\/new/, title: 'Nueva Actividad', subtitle: 'Programar Actividad' },
  
  // Reports
  { pattern: /^\/reports$/, title: 'Reportes', subtitle: 'Analytics y Métricas' },
  { pattern: /^\/reports\/contacts/, title: 'Reporte de Contactos', subtitle: 'Análisis de Contactos' },
  { pattern: /^\/reports\/deals/, title: 'Reporte de Pipeline', subtitle: 'Análisis de Ventas' },
  { pattern: /^\/reports\/activities/, title: 'Reporte de Actividades', subtitle: 'Análisis de Productividad' },
  
  // Member Portal Integration
  { pattern: /^\/portal/, title: 'Portal de Miembros', subtitle: 'Integración Digital' },
  { pattern: /^\/portal\/invitations/, title: 'Invitaciones', subtitle: 'Gestión de Accesos' },
  { pattern: /^\/portal\/engagement/, title: 'Engagement Digital', subtitle: 'Métricas de Participación' },
  
  // Settings
  { pattern: /^\/settings$/, title: 'Configuración', subtitle: 'Ajustes del Sistema', template: 'admin' },
  { pattern: /^\/settings\/profile/, title: 'Mi Perfil', subtitle: 'Información Personal' },
  { pattern: /^\/settings\/organization/, title: 'Organización', subtitle: 'Configuración Organizacional', template: 'admin' },
  { pattern: /^\/settings\/users/, title: 'Usuarios', subtitle: 'Gestión de Usuarios', template: 'admin' },
  { pattern: /^\/settings\/integrations/, title: 'Integraciones', subtitle: 'APIs y Conectores', template: 'admin' },
  
  // Error pages
  { pattern: /^\/unauthorized/, title: 'Acceso Denegado', template: 'auth' },
  { pattern: /^\/404/, title: 'Página No Encontrada', template: 'auth' },
  { pattern: /^\/500/, title: 'Error del Servidor', template: 'auth' },
];

// ============================================
// TITLE TEMPLATES
// ============================================

const buildTitle = (options: PageTitleOptions, user: any): string => {
  const {
    title = 'Página',
    subtitle,
    showUserName = false,
    showOrganization = false,
    template = 'default',
    appendAppName = true,
    separator = ' - ',
  } = options;

  const parts: string[] = [];

  // Título principal
  parts.push(title);

  // Subtítulo si existe
  if (subtitle) {
    parts.push(subtitle);
  }

  // Nombre del usuario (mobile-first: solo iniciales en mobile)
  if (showUserName && user?.nombre) {
    const userName = user.nombre;
    parts.push(`(${userName})`);
  }

  // Organización si aplica
  if (showOrganization && user?.organizationId) {
    // En una implementación real, podrías tener el nombre de la org
    parts.push('Org');
  }

  // Template-specific modifications
  switch (template) {
    case 'admin':
      parts.unshift('Admin');
      break;
    case 'portal':
      parts.unshift('Portal');
      break;
    case 'auth':
      // Auth pages no llevan info adicional
      break;
  }

  // App name
  if (appendAppName) {
    parts.push(env.appName);
  }

  return parts.join(separator);
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Encuentra el mapeo de ruta que coincide con el pathname actual
 */
const findRouteMapping = (pathname: string): RouteMapping | null => {
  for (const mapping of ROUTE_MAPPINGS) {
    if (mapping.pattern.test(pathname)) {
      return mapping;
    }
  }
  return null;
};

/**
 * Extrae parámetros de la ruta usando el patrón
 */
const extractRouteParams = (pathname: string, pattern: RegExp): string[] => {
  const match = pathname.match(pattern);
  return match ? match.slice(1) : [];
};

/**
 * Actualiza el title del documento de forma segura
 */
const updateDocumentTitle = (title: string): void => {
  try {
    if (typeof document !== 'undefined') {
      document.title = title;
    }
  } catch (error) {
    console.warn('Failed to update document title:', error);
  }
};

/**
 * Genera meta tags para SEO (mobile-first)
 */
const generateMetaTags = (title: string, description?: string) => {
  const metaDescription = description || `${title} - ${env.appDescription}`;
  
  return {
    title,
    description: metaDescription,
    'og:title': title,
    'og:description': metaDescription,
    'twitter:title': title,
    'twitter:description': metaDescription,
  };
};

// ============================================
// MAIN HOOK
// ============================================

/**
 * Hook empresarial para manejo de títulos de página
 * Mobile-first, SEO optimizado, integrado con auth
 */
export const usePageTitle = (options?: PageTitleOptions) => {
  const location = useLocation();
  const user = useCurrentUser();

  useEffect(() => {
    // Determinar el título basado en la ruta actual
    const routeMapping = findRouteMapping(location.pathname);
    
    const finalOptions: PageTitleOptions = {
      // Defaults
      appendAppName: true,
      separator: ' - ',
      template: 'default',
      
      // From route mapping
      ...(routeMapping && {
        title: routeMapping.title,
        subtitle: routeMapping.subtitle,
        template: routeMapping.template,
      }),
      
      // User provided options (highest priority)
      ...options,
    };

    // Construir el título final
    const finalTitle = buildTitle(finalOptions, user);
    
    // Actualizar el documento
    updateDocumentTitle(finalTitle);

    // Log para debugging en desarrollo
    if (env.isDev) {
      console.log(`📄 Page title updated: "${finalTitle}"`);
    }

  }, [location.pathname, options, user]);

  // Return helper functions para uso avanzado
  return {
    updateTitle: (newOptions: PageTitleOptions) => {
      const finalTitle = buildTitle({ ...options, ...newOptions }, user);
      updateDocumentTitle(finalTitle);
      return finalTitle;
    },
    
    getCurrentTitle: () => {
      return typeof document !== 'undefined' ? document.title : '';
    },
    
    generateMetaTags: (description?: string) => {
      const currentTitle = typeof document !== 'undefined' ? document.title : env.appName;
      return generateMetaTags(currentTitle, description);
    },
  };
};

// ============================================
// CONVENIENCE HOOKS
// ============================================

/**
 * Hook simple para solo actualizar el título
 */
export const useSimplePageTitle = (title: string, subtitle?: string) => {
  return usePageTitle({ title, subtitle });
};

/**
 * Hook para páginas de admin
 */
export const useAdminPageTitle = (title: string, subtitle?: string) => {
  return usePageTitle({ 
    title, 
    subtitle, 
    template: 'admin',
    showUserName: true 
  });
};

/**
 * Hook para páginas de auth
 */
export const useAuthPageTitle = (title: string) => {
  return usePageTitle({ 
    title, 
    template: 'auth',
    appendAppName: true 
  });
};

/**
 * Hook para páginas del portal de miembros
 */
export const usePortalPageTitle = (title: string, subtitle?: string) => {
  return usePageTitle({ 
    title, 
    subtitle, 
    template: 'portal',
    showOrganization: true 
  });
};

// ============================================
// EXPORT TYPES PARA USO EXTERNO
// ============================================

export type { PageTitleOptions, RouteMapping };
