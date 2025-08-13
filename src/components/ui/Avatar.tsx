 // src/components/ui/Avatar.tsx
// Avatar enterprise component siguiendo tu guía arquitectónica
// Mobile-first + TypeScript strict + Contact-optimized

import React, { useState } from 'react';
import { User } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// ============================================
// AVATAR VARIANTS (Mobile-first sizing)
// ============================================

const avatarVariants = cva(
  // Base classes
  'relative inline-flex items-center justify-center overflow-hidden font-medium select-none',
  {
    variants: {
      variant: {
        default: 'bg-app-dark-700 text-app-gray-200',
        primary: 'bg-app-accent-500 text-white',
        secondary: 'bg-app-dark-600 text-app-gray-300',
        success: 'bg-app-status-success text-white',
        warning: 'bg-app-status-warning text-white',
        error: 'bg-app-status-error text-white',
        contact: 'bg-crm-contact-500 text-white',
        deal: 'bg-crm-deal-500 text-white',
        pipeline: 'bg-crm-pipeline-500 text-white',
        portal: 'bg-crm-portal-500 text-white',
      },
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
        '2xl': 'h-20 w-20 text-xl',
        '3xl': 'h-24 w-24 text-2xl',
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-lg',
        rounded: 'rounded-md',
      },
      border: {
        none: '',
        thin: 'ring-2 ring-white ring-offset-2 ring-offset-app-dark-900',
        thick: 'ring-4 ring-white ring-offset-2 ring-offset-app-dark-900',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      shape: 'circle',
      border: 'none',
    },
  }
);

// ============================================
// TYPES
// ============================================

// Exportamos los tipos para que puedan ser reutilizados por otros componentes.
export type AvatarSize = VariantProps<typeof avatarVariants>['size'];
export type AvatarBorder = VariantProps<typeof avatarVariants>['border'];

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  // Content props
  src?: string;
  alt?: string;
  fallback?: string;
  name?: string;
  
  // Status props
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'away' | 'busy';
  
  // Interaction props
  clickable?: boolean;
  loading?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Genera iniciales a partir del nombre completo
 */
const getInitials = (name: string): string => {
  if (!name) return '';
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return words
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();
};

/**
 * Genera un color de fondo basado en el nombre
 */
const getColorFromName = (name: string): string => {
  if (!name) return 'bg-app-dark-700';
  
  const colors = [
    'bg-red-500',
    'bg-orange-500', 
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// ============================================
// AVATAR COMPONENT
// ============================================

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    className,
    src,
    alt,
    fallback,
    name = '',
    size,
    variant,
    shape,
    border,
    showStatus = false,
    status = 'offline',
    clickable = false,
    loading = false,
    ...props 
  }, ref) => {
    const [imageError, setImageError] = useState(false);

    const showImage = src && !imageError && !loading;
    const initials = fallback || getInitials(name);
    const autoColor = variant === 'default' ? getColorFromName(name) : undefined;

    const statusClasses = { online: 'bg-green-500', offline: 'bg-gray-500', away: 'bg-yellow-500', busy: 'bg-red-500' };
    const statusSizes = { xs: 'h-1.5 w-1.5', sm: 'h-2 w-2', md: 'h-2.5 w-2.5', lg: 'h-3 w-3', xl: 'h-3.5 w-3.5', '2xl': 'h-4 w-4', '3xl': 'h-5 w-5' };

    return (
      <div
        ref={ref}
        className={cn(
          avatarVariants({ variant, size, shape, border }),
          autoColor,
          clickable && 'cursor-pointer hover:opacity-80 transition-opacity',
          loading && 'animate-pulse bg-app-dark-600',
          className
        )}
        {...props}
      >
        {showImage ? (
          <img src={src} alt={alt || name || 'Avatar'} className="h-full w-full object-cover" onError={() => setImageError(true)} loading="lazy" />
        ) : initials ? (
          <span className="font-semibold leading-none">{initials}</span>
        ) : (
          !loading && <User className={cn({ 'h-3 w-3': size === 'xs', 'h-4 w-4': size === 'sm', 'h-5 w-5': size === 'md', 'h-6 w-6': size === 'lg', 'h-8 w-8': size === 'xl', 'h-10 w-10': size === '2xl', 'h-12 w-12': size === '3xl' }, 'text-current opacity-50')} />
        )}

        {showStatus && !loading && (
          <span className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            statusClasses[status],
            statusSizes[size || 'md']
          )} />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };

// ============================================
// SPECIALIZED AVATAR COMPONENTS
// ============================================

/**
 * Contact Avatar - Optimizado para contactos
 */
export const ContactAvatar: React.FC<{
  contact: {
    firstName: string;
    lastName: string;
    email?: string;
    profilePicture?: string;
  };
  size?: AvatarSize;
  showStatus?: boolean;
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({ 
  contact, 
  size = 'md', 
  showStatus = false, 
  isOnline = false,
  className,
  onClick 
}) => {
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  
  return (
    <Avatar
      src={contact.profilePicture}
      name={fullName}
      alt={`${fullName} avatar`}
      size={size}
      showStatus={showStatus}
      status={isOnline ? 'online' : 'offline'}
      clickable={!!onClick}
      onClick={onClick}
      className={className}
    />
  );
};

/**
 * User Avatar - Para usuario actual
 */
export const UserAvatar: React.FC<{
  user: {
    nombre: string;
    email: string;
    profilePicture?: string;
  };
  size?: AvatarSize;
  border?: AvatarBorder;
  className?: string;
  onClick?: () => void;
}> = ({ user, size = 'md', border = 'thin', className, onClick }) => (
  <Avatar
    src={user.profilePicture}
    name={user.nombre}
    alt={`${user.nombre} avatar`}
    size={size}
    border={border}
    variant="primary"
    clickable={!!onClick}
    onClick={onClick}
    className={className}
  />
);

/**
 * Avatar Group - Para mostrar múltiples avatars
 */
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: AvatarSize;
  max?: number;
  spacing?: 'tight' | 'normal' | 'loose';
  showTooltip?: boolean;
}

export const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ 
    className,
    children,
    size = 'md',
    max = 3,
    spacing = 'normal',
    showTooltip = false,
    ...props 
  }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const visibleChildren = max ? childrenArray.slice(0, max) : childrenArray;
    const hiddenCount = max && childrenArray.length > max ? childrenArray.length - max : 0;

    const spacingClasses = {
      tight: '-space-x-1',
      normal: '-space-x-2',
      loose: '-space-x-1',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div
            key={index}
            className="relative ring-2 ring-white rounded-full"
            style={{ zIndex: visibleChildren.length - index }}
          >
            {child}
          </div>
        ))}
        
        {hiddenCount > 0 && (
          <Avatar
            size={size}
            variant="secondary"
            fallback={`+${hiddenCount}`}
            className="relative ring-2 ring-white"
            style={{ zIndex: 0 }}
          />
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

/**
 * Avatar with Badge - Para mostrar avatar con badge de status
 */
export const AvatarWithBadge: React.FC<{
  avatar: React.ComponentProps<typeof Avatar>;
  badge: {
    content: string | number;
    variant?: 'success' | 'warning' | 'error' | 'info';
    position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  };
  className?: string;
}> = ({ avatar, badge, className }) => {
  const badgePositions = {
    'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
    'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
    'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
  };

  const badgeColors = {
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar {...avatar} />
      <span className={cn(
        'absolute flex items-center justify-center',
        'min-w-[20px] h-5 px-1 rounded-full',
        'text-xs font-medium leading-none',
        'ring-2 ring-white',
        badgePositions[badge.position || 'top-right'],
        badgeColors[badge.variant || 'info']
      )}>
        {badge.content}
      </span>
    </div>
  );
};

export default Avatar;
