 // src/components/ui/Button.tsx
// Button enterprise-grade siguiendo tu gu铆a arquitect贸nica

import React from 'react';
import { cn } from '@/utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

import { cva, type VariantProps } from 'class-variance-authority';

import { type ElementType } from 'react';

// ============================================
// BUTTON VARIANTS (Con tus colores exactos)
// ============================================

const buttonVariants = cva(
  // Base classes
  'inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-app-dark-900 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-app-accent-500 text-white hover:bg-app-accent-600 active:bg-app-accent-700 shadow-soft',
        destructive: 'bg-app-status-error text-white hover:bg-red-600 active:bg-red-700 shadow-soft',
        outline: 'border border-app-dark-600 bg-app-dark-800 text-app-gray-200 hover:bg-app-dark-700 hover:text-white active:bg-app-dark-600',
        secondary: 'bg-app-dark-700 text-app-gray-200 hover:bg-app-dark-600 active:bg-app-dark-600',
        ghost: 'text-app-gray-300 hover:bg-app-dark-700 hover:text-white active:bg-app-dark-600',
        link: 'text-app-accent-500 underline-offset-4 hover:underline active:text-app-accent-600',
        success: 'bg-app-status-success text-white hover:bg-green-600 active:bg-green-700 shadow-soft',
        warning: 'bg-app-status-warning text-white hover:bg-yellow-600 active:bg-yellow-700 shadow-soft',
        contact: 'bg-crm-contact-500 text-white hover:bg-crm-contact-600 active:bg-crm-contact-700 shadow-soft',
        deal: 'bg-crm-deal-500 text-white hover:bg-crm-deal-600 active:bg-crm-deal-700 shadow-soft',
        pipeline: 'bg-crm-pipeline-500 text-white hover:bg-crm-pipeline-600 active:bg-crm-pipeline-700 shadow-soft',
        portal: 'bg-crm-portal-500 text-white hover:bg-crm-portal-600 active:bg-crm-portal-700 shadow-soft',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-6 text-base',
        xl: 'h-14 rounded-lg px-8 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
        'icon-xl': 'h-14 w-14',
      },
      fullWidth: {
        true: 'w-full',
      },
      rounded: {
        full: 'rounded-full',
        none: 'rounded-none',
        default: '', // Mantener para que no aplique clases extra por defecto
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
      rounded: 'default',
    },
  }
);

// ============================================
// TYPES
// ============================================



type ButtonOwnProps<E extends ElementType = ElementType> = {
  as?: E;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
} & VariantProps<typeof buttonVariants>;

export type ButtonProps<E extends ElementType> = ButtonOwnProps<E> &
  Omit<React.ComponentProps<E>, keyof ButtonOwnProps>;

// ============================================
// BUTTON COMPONENT
// ============================================

const defaultElement = 'button';

const Button = React.forwardRef(
  <E extends ElementType = typeof defaultElement>(
    {
      className,
      variant,
      size,
      fullWidth,
      rounded,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      as,
      ...props
    }: ButtonProps<E>,
    ref: React.Ref<HTMLButtonElement | HTMLAnchorElement> // Ahora puede ser un botón o un ancla
  ) => {
    const Component = as || defaultElement;
    const isDisabled = disabled || loading;

    const getSpinnerSize = (): 'xs' | 'sm' | 'md' | 'lg' => {
      // ... tu lógica de getSpinnerSize se queda igual
      switch (size) {
        case 'sm': case 'icon-sm': return 'xs';
        case 'lg': case 'icon-lg': return 'sm';
        case 'xl': case 'icon-xl': return 'md';
        default: return 'xs';
      }
    };

    return (
      <Component
        className={cn(buttonVariants({ variant, size, fullWidth, rounded, className }))}
        ref={ref as any}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <LoadingSpinner 
            size={getSpinnerSize()} 
            variant="white" 
            className="mr-2" 
            srOnly={false}
            label=""
          />
        )}
        
        {!loading && leftIcon && (
          <span className="mr-2 flex-shrink-0 flex items-center">{leftIcon}</span>
        )}
        
        <span className={cn(loading && 'opacity-70')}>
          {loading && loadingText ? loadingText : children}
        </span>
        
        {!loading && rightIcon && (
          <span className="ml-2 flex-shrink-0 flex items-center">{rightIcon}</span>
        )}
      </Component>
    );
  }
);

Button.displayName = 'Button';

export { Button };

// ============================================
// SPECIALIZED BUTTON COMPONENTS
// ============================================

type IconButtonProps = ButtonProps<'button'> & {
  tooltip?: string;
  'aria-label'?: string;
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ tooltip, children, className, ...props }, ref) => (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn('relative group', className)}
      aria-label={props['aria-label'] || tooltip}
      {...props}
    >
      {children}
      {tooltip && (
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-app-dark-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {tooltip}
        </span>
      )}
    </Button>
  )
);

IconButton.displayName = 'IconButton';

export const BackButton: React.FC<{ 
  onBack?: () => void; 
  children?: React.ReactNode;
  className?: string;
}> = ({ onBack, children = 'Volver', className }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onBack}
    className={cn('mb-4 text-app-gray-300 hover:text-white', className)}
    leftIcon={
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    }
  >
    {children}
  </Button>
);

type FloatingActionButtonProps = ButtonProps<'button'> & {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
};

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ position = 'bottom-right', className, children, ...props }, ref) => {
    const positionClasses = {
      'bottom-right': 'fixed bottom-6 right-6',
      'bottom-left': 'fixed bottom-6 left-6',
      'bottom-center': 'fixed bottom-6 left-1/2 transform -translate-x-1/2',
    };

    return (
      <Button
        ref={ref}
        className={cn(
          positionClasses[position],
          'rounded-full shadow-floating z-50 h-14 w-14',
          className
        )}
        variant="default"
        {...props}
      >
        {children}
      </Button>
    );
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';

// ============================================
// BUTTON GROUP COMPONENT
// ============================================

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  responsive?: boolean;
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ 
    className, 
    orientation = 'horizontal', 
    spacing = 'sm', 
    responsive = true,
    children, 
    ...props 
  }, ref) => {
    const spacingClasses = {
      none: '',
      sm: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1',
      md: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
      lg: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          responsive && 'flex-col space-y-2 xs:flex-row xs:space-y-0',
          !responsive && orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
          !responsive && spacingClasses[spacing],
          responsive && orientation === 'horizontal' && 'xs:space-x-2',
          className
        )}
        role="group"
        {...props}
      >
        {children}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';
