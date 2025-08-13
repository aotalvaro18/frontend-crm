// src/components/ui/EmptyState.tsx
// EmptyState enterprise component siguiendo tu guía arquitectónica
// Mobile-first + TypeScript strict + Multiple contexts

import React from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  FileText, 
  Target, 
  Building2, 
  Filter,
  Database,
  Wifi,
  AlertCircle,
  RefreshCw,
  Upload,
  UserPlus,
  Globe
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

import { cva, type VariantProps } from 'class-variance-authority';

// ============================================
// EMPTY STATE VARIANTS
// ============================================

const emptyStateVariants = cva(
  // Base classes
  'flex flex-col items-center justify-center text-center',
  {
    variants: {
      variant: {
        default: '',
        bordered: 'border-2 border-dashed border-app-dark-600 rounded-lg',
        card: 'bg-app-dark-800 border border-app-dark-600 rounded-lg shadow-sm',
      },
      size: {
        sm: 'py-8 px-4',
        md: 'py-12 px-6',
        lg: 'py-16 px-8',
        xl: 'py-20 px-12',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

// ============================================
// PREDEFINED ICONS & MESSAGES
// ============================================

const emptyStatePresets = {
  // Contact related
  'no-contacts': {
    icon: Users,
    title: 'No hay contactos',
    description: 'Aún no tienes contactos en tu CRM. Comienza agregando tu primer contacto.',
    action: 'Agregar Contacto',
    actionIcon: UserPlus,
  },
  'contacts-search': {
    icon: Search,
    title: 'No se encontraron contactos',
    description: 'No hay contactos que coincidan con tu búsqueda. Intenta ajustar los filtros.',
    action: 'Limpiar Filtros',
    actionIcon: Filter,
  },
  'contacts-filtered': {
    icon: Filter,
    title: 'Sin resultados con estos filtros',
    description: 'No hay contactos que cumplan con los criterios seleccionados.',
    action: 'Limpiar Filtros',
    actionIcon: RefreshCw,
  },
  
  // Deal related
  'no-deals': {
    icon: Target,
    title: 'No hay oportunidades',
    description: 'Comienza tu pipeline de ventas creando tu primera oportunidad.',
    action: 'Crear Oportunidad',
    actionIcon: Plus,
  },
  'deals-search': {
    icon: Search,
    title: 'No se encontraron oportunidades',
    description: 'Ajusta tu búsqueda o filtros para encontrar las oportunidades que buscas.',
    action: 'Limpiar Búsqueda',
    actionIcon: RefreshCw,
  },
  
  // Company related
  'no-companies': {
    icon: Building2,
    title: 'No hay empresas',
    description: 'Organiza mejor tus contactos agregando las empresas con las que trabajas.',
    action: 'Agregar Empresa',
    actionIcon: Plus,
  },
  
  // Data states
  'no-data': {
    icon: Database,
    title: 'No hay datos disponibles',
    description: 'Los datos solicitados no están disponibles en este momento.',
    action: 'Recargar',
    actionIcon: RefreshCw,
  },
  'loading-failed': {
    icon: AlertCircle,
    title: 'Error al cargar datos',
    description: 'Hubo un problema al obtener la información. Por favor, intenta nuevamente.',
    action: 'Reintentar',
    actionIcon: RefreshCw,
  },
  'no-connection': {
    icon: Wifi,
    title: 'Sin conexión',
    description: 'Verifica tu conexión a internet e intenta nuevamente.',
    action: 'Reintentar',
    actionIcon: RefreshCw,
  },
  
  // Import/Export states
  'import-ready': {
    icon: Upload,
    title: 'Importar contactos',
    description: 'Sube un archivo CSV o Excel para importar tus contactos existentes.',
    action: 'Seleccionar Archivo',
    actionIcon: Upload,
  },
  'export-empty': {
    icon: FileText,
    title: 'No hay datos para exportar',
    description: 'No hay información disponible con los filtros actuales.',
    action: 'Ajustar Filtros',
    actionIcon: Filter,
  },
  
  // Portal related
  'no-portal-users': {
    icon: Globe,
    title: 'No hay usuarios con portal',
    description: 'Ningún contacto tiene acceso al portal de miembros aún.',
    action: 'Enviar Invitaciones',
    actionIcon: UserPlus,
  },
  'portal-invitations': {
    icon: Globe,
    title: 'Invitaciones pendientes',
    description: 'Los contactos invitados aún no han activado su portal personal.',
    action: 'Reenviar Invitaciones',
    actionIcon: RefreshCw,
  },
  
  // Generic states
  'coming-soon': {
    icon: AlertCircle,
    title: 'Próximamente',
    description: 'Esta funcionalidad estará disponible en una próxima actualización.',
    action: null,
    actionIcon: null,
  },
  'under-construction': {
    icon: AlertCircle,
    title: 'En construcción',
    description: 'Estamos trabajando en esta sección. Estará disponible pronto.',
    action: null,
    actionIcon: null,
  },
};

// ============================================
// TYPES
// ============================================

export type EmptyStateSize = VariantProps<typeof emptyStateVariants>['size'];
type EmptyStatePreset = keyof typeof emptyStatePresets;

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  // Content props
  preset?: EmptyStatePreset;
  icon?: React.ElementType;
  title?: string;
  description?: string;
  
  // Action props
  action?: string | React.ReactNode;
  actionIcon?: React.ElementType;
  onAction?: () => void;
  secondaryAction?: string;
  onSecondaryAction?: () => void;
  
  // State props
  loading?: boolean;
  
  // Illustration props
  showIllustration?: boolean;
  illustrationColor?: string;
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ 
    className,
    preset,
    icon: IconProp,
    title: titleProp,
    description: descriptionProp,
    action: actionProp,
    actionIcon: ActionIconProp,
    onAction,
    secondaryAction,
    onSecondaryAction,
    size,
    variant,
    loading = false,
    showIllustration = true,
    illustrationColor = 'text-app-gray-500',
    ...props 
  }, ref) => {
    const presetData = preset ? emptyStatePresets[preset] : null;
    
    const Icon = IconProp || presetData?.icon || Users;
    const title = titleProp || presetData?.title || 'No hay elementos';
    const description = descriptionProp || presetData?.description || 'No se encontraron elementos para mostrar.';
    const action = actionProp || presetData?.action;
    const ActionIcon = ActionIconProp || presetData?.actionIcon;

    const effectiveSize = size || 'md';
    const iconSizes = { sm: 'h-12 w-12', md: 'h-16 w-16', lg: 'h-20 w-20', xl: 'h-24 w-24' };
    const textSizes = {
      sm: { title: 'text-lg', description: 'text-sm' },
      md: { title: 'text-xl', description: 'text-base' },
      lg: { title: 'text-2xl', description: 'text-lg' },
      xl: { title: 'text-3xl', description: 'text-xl' },
    };

    if (loading) {
      return (
        <div ref={ref} className={cn(emptyStateVariants({ variant, size, className }))} {...props}>
          <div className="animate-pulse space-y-4">
            <div className={cn('rounded-full bg-app-dark-600 mx-auto', iconSizes[effectiveSize])} />
            <div className="space-y-2">
              <div className="h-6 bg-app-dark-600 rounded w-48 mx-auto" />
              <div className="h-4 bg-app-dark-600 rounded w-64 mx-auto" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn(emptyStateVariants({ variant, size, className }))} {...props}>
        {showIllustration && (
          <div className="mb-6">
            <Icon className={cn(iconSizes[effectiveSize], illustrationColor, 'mx-auto')} />
          </div>
        )}
        <div className="space-y-3 max-w-md mx-auto">
          <h3 className={cn('font-semibold text-app-gray-200', textSizes[effectiveSize].title)}>
            {title}
          </h3>
          <p className={cn('text-app-gray-400 leading-relaxed', textSizes[effectiveSize].description)}>
            {description}
          </p>
        </div>
        {(action || secondaryAction) && (
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {action && onAction && (
              <Button
                onClick={onAction}
                size={effectiveSize === 'sm' ? 'sm' : effectiveSize === 'xl' ? 'lg' : 'default'}
                className="min-w-[140px]"
              >
                {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                {typeof action === 'string' ? action : action}
              </Button>
            )}
            {secondaryAction && onSecondaryAction && (
              <Button
                variant="outline"
                onClick={onSecondaryAction}
                size={effectiveSize === 'sm' ? 'sm' : effectiveSize === 'xl' ? 'lg' : 'default'}
                className="min-w-[140px]"
              >
                {secondaryAction}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export { EmptyState };

// ============================================
// SPECIALIZED EMPTY STATE COMPONENTS
// ============================================

/**
 * Contact Empty States
 */
export const ContactEmptyState: React.FC<{
  type: 'no-contacts' | 'contacts-search' | 'contacts-filtered';
  onAction?: () => void;
  onSecondaryAction?: () => void;
  className?: string;
}> = ({ type, onAction, onSecondaryAction, className }) => (
  <EmptyState
    preset={type}
    onAction={onAction}
    onSecondaryAction={onSecondaryAction}
    className={className}
  />
);

/**
 * Search Empty State - Genérico para búsquedas
 */
export const SearchEmptyState: React.FC<{
  searchTerm?: string;
  entity?: string;
  onClearSearch?: () => void;
  onCreateNew?: () => void;
  className?: string;
}> = ({ 
  searchTerm, 
  entity = 'elementos', 
  onClearSearch, 
  onCreateNew,
  className 
}) => (
  <EmptyState
    icon={Search}
    title={`No se encontraron ${entity}`}
    description={
      searchTerm 
        ? `No hay ${entity} que coincidan con "${searchTerm}". Intenta con otros términos.`
        : `No se encontraron ${entity} con los filtros aplicados.`
    }
    action={onClearSearch ? "Limpiar Búsqueda" : undefined}
    onAction={onClearSearch}
    secondaryAction={onCreateNew ? `Crear ${entity.slice(0, -1)}` : undefined}
    onSecondaryAction={onCreateNew}
    className={className}
  />
);

/**
 * Error Empty State - Para errores de carga
 */
export const ErrorEmptyState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
}> = ({ 
  title = "Error al cargar datos",
  message = "Hubo un problema al obtener la información. Por favor, intenta nuevamente.",
  onRetry,
  onGoBack,
  className 
}) => (
  <EmptyState
    icon={AlertCircle}
    title={title}
    description={message}
    action={onRetry ? "Reintentar" : undefined}
    actionIcon={RefreshCw}
    onAction={onRetry}
    secondaryAction={onGoBack ? "Volver" : undefined}
    onSecondaryAction={onGoBack}
    variant="card"
    illustrationColor="text-red-400"
    className={className}
  />
);

/**
 * Loading Empty State - Para estados de carga
 */
export const LoadingEmptyState: React.FC<{
  message?: string;
  size?: EmptyStateSize;
  className?: string;
}> = ({ 
  //message = "Cargando datos...",
  size = 'md',
  className 
}) => (
  <EmptyState
    loading
    size={size}
    className={className}
  />
);

/**
 * Import Empty State - Para páginas de importación
 */
export const ImportEmptyState: React.FC<{
  onSelectFile?: () => void;
  onDownloadTemplate?: () => void;
  acceptedFormats?: string[];
  className?: string;
}> = ({ 
  onSelectFile, 
  onDownloadTemplate,
  acceptedFormats = ['CSV', 'Excel'],
  className 
}) => (
  <EmptyState
    preset="import-ready"
    description={`Sube un archivo ${acceptedFormats.join(' o ')} para importar tus contactos existentes.`}
    onAction={onSelectFile}
    secondaryAction={onDownloadTemplate ? "Descargar Plantilla" : undefined}
    onSecondaryAction={onDownloadTemplate}
    variant="bordered"
    className={className}
  />
);

/**
 * Portal Empty State - Para secciones del portal
 */
export const PortalEmptyState: React.FC<{
  type: 'no-portal-users' | 'portal-invitations';
  onAction?: () => void;
  className?: string;
}> = ({ type, onAction, className }) => (
  <EmptyState
    preset={type}
    onAction={onAction}
    className={className}
  />
);

/**
 * Feature Coming Soon - Para funcionalidades en desarrollo
 */
export const ComingSoonEmptyState: React.FC<{
  feature?: string;
  expectedDate?: string;
  className?: string;
}> = ({ 
  feature = "Esta funcionalidad",
  expectedDate,
  className 
}) => (
  <EmptyState
    preset="coming-soon"
    title={`${feature} - Próximamente`}
    description={
      expectedDate 
        ? `${feature} estará disponible ${expectedDate}.`
        : `${feature} estará disponible en una próxima actualización.`
    }
    variant="card"
    illustrationColor="text-app-accent-500"
    className={className}
  />
);

export default EmptyState;
