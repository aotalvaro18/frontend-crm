// src/pages/settings/SettingsPage.tsx
// ✅ SETTINGS HUB PAGE - Hub central de configuración enterprise
// Separa claramente flujos Usuario Diario vs Administrador

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  User, 
  Users, 
  Building, 
  Shield, 
  CreditCard,
  GitBranch, // Pipelines - Para ADMINISTRADORES
  SlidersHorizontal, // Campos Personalizados
  Bell, // Notificaciones
  Globe, // Integrations
  BarChart3, // Analytics
  FileText // Reports
} from 'lucide-react';

// ============================================
// UI & LAYOUT COMPONENTS
// ============================================
import Page from '@/components/layout/Page';
import { cn } from '@/utils/cn';

// ============================================
// TYPES
// ============================================
interface SettingCategoryProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

interface SettingLinkCardProps {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  isComingSoon?: boolean;
}

// ============================================
// SUB-COMPONENTES INTERNOS
// ============================================

/**
 * Agrupa visualmente las tarjetas de configuración por categoría
 */
const SettingCategory: React.FC<SettingCategoryProps> = ({ 
  title, 
  description, 
  children 
}) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-gray-500">
          {description}
        </p>
      )}
    </div>
    <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
      {children}
    </div>
  </div>
);

/**
 * Tarjeta individual de enlace a configuración
 */
const SettingLinkCard: React.FC<SettingLinkCardProps> = ({ 
  to, 
  icon: Icon, 
  title, 
  description, 
  badge,
  isComingSoon = false 
}) => (
  <Link 
    to={to}
    className={cn(
      "group relative flex items-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200",
      isComingSoon 
        ? "cursor-not-allowed opacity-60" 
        : "hover:shadow-md hover:border-gray-300 hover:bg-gray-50"
    )}
    onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
  >
    {/* Icon Container */}
    <div className={cn(
      "flex-shrink-0 p-3 rounded-lg mr-4",
      isComingSoon 
        ? "bg-gray-100" 
        : "bg-blue-50 group-hover:bg-blue-100"
    )}>
      <Icon className={cn(
        "h-6 w-6",
        isComingSoon 
          ? "text-gray-400" 
          : "text-blue-600 group-hover:text-blue-700"
      )} />
    </div>
    
    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <h3 className={cn(
          "font-medium",
          isComingSoon 
            ? "text-gray-500" 
            : "text-gray-900 group-hover:text-gray-900"
        )}>
          {title}
        </h3>
        {badge && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <p className={cn(
        "text-sm",
        isComingSoon 
          ? "text-gray-400" 
          : "text-gray-500"
      )}>
        {description}
      </p>
      {isComingSoon && (
        <p className="text-xs text-orange-600 mt-1 font-medium">
          Próximamente
        </p>
      )}
    </div>
    
    {/* Arrow Icon */}
    {!isComingSoon && (
      <ChevronRight className="flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
    )}
  </Link>
);

// ============================================
// MAIN COMPONENT
// ============================================
const SettingsPage: React.FC = () => {
  return (
    <Page
      title="Configuración"
      description="Administra tu cuenta, equipo y personaliza tu CRM."
      breadcrumbs={[
        { label: 'Dashboard', href: '/contacts' },
        { label: 'Configuración' }
      ]}
    >
      <div className="max-w-6xl mx-auto">
        <div className="space-y-10">

          {/* ======================= */}
          {/* CATEGORÍA: CUENTA Y PERFIL */}
          {/* ======================= */}
          <SettingCategory 
            title="Mi Cuenta"
            description="Gestiona tu información personal y preferencias"
          >
            <SettingLinkCard
              to="/settings/profile"
              icon={User}
              title="Mi Perfil"
              description="Actualiza tu nombre, email y preferencias de notificación"
              isComingSoon
            />
            <SettingLinkCard
              to="/settings/notifications"
              icon={Bell}
              title="Notificaciones"
              description="Configura cuándo y cómo recibir alertas del sistema"
              isComingSoon
            />
          </SettingCategory>

          {/* ======================= */}
          {/* CATEGORÍA: ADMINISTRACIÓN DEL CRM */}
          {/* ======================= */}
          <SettingCategory 
            title="Administración del CRM"
            description="Configura y personaliza los procesos de negocio"
          >
            <SettingLinkCard
              to="/settings/pipelines"
              icon={GitBranch}
              title="Gestión de Pipelines"
              description="Define etapas, configura flujos de trabajo y automatizaciones"
              badge="Admin"
            />
            <SettingLinkCard
              to="/settings/custom-fields"
              icon={SlidersHorizontal}
              title="Campos Personalizados"
              description="Añade campos únicos a contactos, empresas y oportunidades"
              isComingSoon
            />
          </SettingCategory>

          {/* ======================= */}
          {/* CATEGORÍA: ORGANIZACIÓN */}
          {/* ======================= */}
          <SettingCategory 
            title="Organización"
            description="Gestiona tu equipo y estructura organizacional"
          >
            <SettingLinkCard
              to="/settings/organization"
              icon={Building}
              title="Datos de la Organización"
              description="Información de tu empresa, logos y configuración regional"
              isComingSoon
            />
            <SettingLinkCard
              to="/settings/team"
              icon={Users}
              title="Gestión de Equipo"
              description="Invita usuarios, administra roles y permisos de acceso"
              isComingSoon
            />
            <SettingLinkCard
              to="/settings/security"
              icon={Shield}
              title="Seguridad y Acceso"
              description="Autenticación de dos factores, registros y políticas"
              isComingSoon
            />
          </SettingCategory>

          {/* ======================= */}
          {/* CATEGORÍA: INTEGRACIONES Y DATOS */}
          {/* ======================= */}
          <SettingCategory 
            title="Integraciones y Datos"
            description="Conecta con servicios externos y gestiona datos"
          >
            <SettingLinkCard
              to="/settings/integrations"
              icon={Globe}
              title="Integraciones"
              description="Conecta con herramientas de email, calendario y más"
              isComingSoon
            />
            <SettingLinkCard
              to="/settings/reports"
              icon={FileText}
              title="Configuración de Reportes"
              description="Personaliza dashboards y automatiza informes periódicos"
              isComingSoon
            />
            <SettingLinkCard
              to="/settings/analytics"
              icon={BarChart3}
              title="Analytics Avanzados"
              description="Configura métricas personalizadas y KPIs del negocio"
              isComingSoon
            />
          </SettingCategory>

          {/* ======================= */}
          {/* CATEGORÍA: FACTURACIÓN */}
          {/* ======================= */}
          <SettingCategory 
            title="Suscripción y Facturación"
            description="Gestiona tu plan y métodos de pago"
          >
            <SettingLinkCard
              to="/settings/billing"
              icon={CreditCard}
              title="Facturación y Suscripción"
              description="Revisa tu plan actual, facturas y actualiza métodos de pago"
              isComingSoon
            />
          </SettingCategory>

        </div>

        {/* ======================= */}
        {/* FOOTER INFO */}
        {/* ======================= */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              ¿Necesitas ayuda?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Si no encuentras lo que buscas o tienes alguna pregunta, nuestro equipo de soporte está aquí para ayudarte.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                Contactar Soporte
              </button>
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Ver Documentación
              </button>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default SettingsPage;
