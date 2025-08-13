// src/components/ui/Badge.tsx
// Badge enterprise component siguiendo tu guía arquitectónica
// Mobile-first + TypeScript strict + Variants system

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';


// ============================================
// BADGE VARIANTS (Con tus colores exactos)
// ============================================

const badgeVariants = cva(
  // Base classes
  'inline-flex items-center text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-app-dark-700 text-app-gray-200 hover:bg-app-dark-600',
        secondary: 'bg-app-dark-600 text-app-gray-300 hover:bg-app-dark-500',
        destructive: 'bg-app-status-error text-white hover:bg-red-600',
        success: 'bg-app-status-success text-white hover:bg-green-600',
        warning: 'bg-app-status-warning text-white hover:bg-yellow-600',
        info: 'bg-app-accent-500 text-white hover:bg-app-accent-600',
        outline: 'border border-app-dark-600 text-app-gray-300 hover:bg-app-dark-700',
        contact: 'bg-crm-contact-500 text-white hover:bg-crm-contact-600',
        deal: 'bg-crm-deal-500 text-white hover:bg-crm-deal-600',
        pipeline: 'bg-crm-pipeline-500 text-white hover:bg-crm-pipeline-600',
        portal: 'bg-crm-portal-500 text-white hover:bg-crm-portal-600',
        active: 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
        inactive: 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700',
        archived: 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
        do_not_contact: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
        duplicate: 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
        prospect: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
        lead: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700',
        member: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-700',
        visitor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700',
        former_member: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
        deceased: 'bg-black text-white border border-gray-600 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
        moved: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
        bounced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
        blocked: 'bg-gray-800 text-gray-300 border border-gray-600 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
        xl: 'px-4 py-1.5 text-base',
      },
      rounded: {
        default: 'rounded-full',
        md: 'rounded-md',
        lg: 'rounded-lg',
        none: 'rounded-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'default',
    },
  }
);

// ============================================
// TYPES
// ============================================

// Exportamos los tipos para que puedan ser reutilizados por otros componentes.
export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
export type BadgeSize = VariantProps<typeof badgeVariants>['size'];
export type BadgeRounded = VariantProps<typeof badgeVariants>['rounded'];

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  removable?: boolean;
  onRemove?: () => void;
  icon?: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
}

// ============================================
// BADGE COMPONENT
// ============================================

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    rounded,
    removable = false,
    onRemove,
    icon,
    dot = false,
    pulse = false,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, rounded, className }), pulse && 'animate-pulse')}
        {...props}
      >
        {dot && (
          <span className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0 bg-current opacity-75" />
        )}
        
        {icon && (
          <span className={cn(
            'flex-shrink-0 flex items-center',
            children ? 'mr-1.5' : '',
            size === 'sm' && 'mr-1',
            size === 'lg' && 'mr-2',
            size === 'xl' && 'mr-2'
          )}>
            {React.cloneElement(icon as React.ReactElement, {
              className: cn(
                {
                  'h-3 w-3': size === 'sm' || size === 'default',
                  'h-4 w-4': size === 'lg',
                  'h-5 w-5': size === 'xl',
                },
                (icon as any)?.props?.className
              ),
            })}
          </span>
        )}
        
        {children && (
          <span className="truncate">{children}</span>
        )}
        
        {removable && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-1.5 flex-shrink-0 rounded-full p-0.5 hover:bg-black/20 focus:outline-none focus:ring-1 focus:ring-white transition-colors"
            aria-label="Remover"
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };

// ============================================
// SPECIALIZED BADGE COMPONENTS
// ============================================

/**
 * Status Badge - Para ContactStatusBadge
 */
export interface StatusBadgeProps extends BadgeProps {
  status:
  | 'active' | 'inactive' | 'archived' | 'do_not_contact' | 'duplicate' | 'prospect' | 'lead'
  | 'member' | 'visitor' | 'former_member' | 'deceased' | 'moved' | 'bounced' | 'blocked';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  children, 
  className, 
  ...props // ✅ CORRECCIÓN: Capturamos todas las demás props (incluyendo onClick, title, etc.)
}) => (
  <Badge
    variant={status}
    size="default"
    className={className}
    {...props} // ✅ CORRECCIÓN: Pasamos todas las props adicionales al Badge base.
  >
    {children}
  </Badge>
);

/**
 * Count Badge - Para mostrar números
 */
export const CountBadge: React.FC<{
  count: number;
  max?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}> = ({ count, max = 99, variant = 'info', size = 'sm', className }) => {
  const displayCount = count > max ? `${max}+` : count.toString();
  
  return (
    <Badge
      variant={variant}
      size={size}
      className={cn('tabular-nums', className)}
    >
      {displayCount}
    </Badge>
  );
};

/**
 * Notification Badge - Para notificaciones
 */
export const NotificationBadge: React.FC<{
  count?: number;
  dot?: boolean;
  variant?: 'info' | 'success' | 'warning' | 'destructive';
  className?: string;
}> = ({ count, dot = false, variant = 'destructive', className }) => {
  if (dot) {
    return (
      <Badge
        variant={variant}
        size="sm"
        className={cn('p-0 h-2 w-2 min-w-0', className)}
        aria-label="Nueva notificación"
      />
    );
  }
  
  if (!count || count <= 0) return null;
  
  return (
    <CountBadge
      count={count}
      variant={variant}
      size="sm"
      className={className}
    />
  );
};

/**
 * Priority Badge - Para deals y actividades
 */
export const PriorityBadge: React.FC<{
  priority: 'low' | 'medium' | 'high' | 'urgent';
  showIcon?: boolean;
  className?: string;
}> = ({ priority, showIcon = false, className }) => {
  const priorityConfig = {
    low: { variant: 'secondary' as BadgeVariant, label: 'Baja', icon: '⬇️' },
    medium: { variant: 'warning' as BadgeVariant, label: 'Media', icon: '➡️' },
    high: { variant: 'info' as BadgeVariant, label: 'Alta', icon: '⬆️' },
    urgent: { variant: 'destructive' as BadgeVariant, label: 'Urgente', icon: '🔥' },
  };
  
  const config = priorityConfig[priority];
  
  return (
    <Badge
      variant={config.variant}
      size="default"
      className={className}
    >
      {showIcon && (
        <span className="mr-1">{config.icon}</span>
      )}
      {config.label}
    </Badge>
  );
};

/**
 * Tag Badge - Para tags de contactos
 */
export const TagBadge: React.FC<{
  tag: string;
  color?: string;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}> = ({ tag, color, removable = false, onRemove, className }) => {
  const customStyle = color ? {
    backgroundColor: color,
    color: '#ffffff',
    borderColor: color,
  } : undefined;
  
  return (
    <Badge
      variant="outline"
      size="sm"
      removable={removable}
      onRemove={onRemove}
      className={className}
      style={customStyle}
    >
      {tag}
    </Badge>
  );
};

/**
 * Progress Badge - Para mostrar progreso
 */
export const ProgressBadge: React.FC<{
  current: number;
  total: number;
  variant?: BadgeVariant;
  showPercentage?: boolean;
  className?: string;
}> = ({ current, total, variant = 'info', showPercentage = false, className }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  return (
    <Badge
      variant={variant}
      size="default"
      className={cn('tabular-nums', className)}
    >
      {showPercentage ? `${percentage}%` : `${current}/${total}`}
    </Badge>
  );
};

// ============================================
// BADGE GROUP COMPONENT
// ============================================

export interface BadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  wrap?: boolean;
  maxVisible?: number;
  onShowMore?: () => void;
}

export const BadgeGroup = React.forwardRef<HTMLDivElement, BadgeGroupProps>(
  ({ 
    className, 
    orientation = 'horizontal', 
    spacing = 'sm', 
    wrap = true,
    maxVisible,
    onShowMore,
    children, 
    ...props 
  }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const hasMore = maxVisible && childrenArray.length > maxVisible;
    const visibleChildren = maxVisible ? childrenArray.slice(0, maxVisible) : childrenArray;
    const hiddenCount = hasMore ? childrenArray.length - maxVisible : 0;

    const spacingClasses = {
      none: '',
      sm: orientation === 'horizontal' ? 'gap-1' : 'gap-1',
      md: orientation === 'horizontal' ? 'gap-2' : 'gap-2',
      lg: orientation === 'horizontal' ? 'gap-3' : 'gap-3',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col items-start',
          wrap && 'flex-wrap',
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {visibleChildren}
        {hasMore && (
          <Badge
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={onShowMore}
          >
            +{hiddenCount} más
          </Badge>
        )}
      </div>
    );
  }
);

BadgeGroup.displayName = 'BadgeGroup';

export default Badge;
