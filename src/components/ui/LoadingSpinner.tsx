 // src/components/ui/LoadingSpinner.tsx
// Loading spinner enterprise-grade con tus colores

import React from 'react';
import { cn } from '@/utils/cn';

// ============================================
// SPINNER VARIANTS (Con tus colores exactos)
// ============================================

const spinnerVariants = {
  base: 'animate-spin rounded-full border-2 border-current border-t-transparent',
  
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
    
    variant: {
      default: 'text-app-accent-500',
      white: 'text-white',
      gray: 'text-app-gray-400',
      success: 'text-app-status-success',
      warning: 'text-app-status-warning',
      error: 'text-app-status-error',
      contact: 'text-crm-contact-500',
      deal: 'text-crm-deal-500',
      pipeline: 'text-crm-pipeline-500',
      portal: 'text-crm-portal-500',
    },
  },
  
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
};

// ============================================
// TYPES
// ============================================

type SpinnerSize = keyof typeof spinnerVariants.variants.size;
type SpinnerVariant = keyof typeof spinnerVariants.variants.variant;

export interface LoadingSpinnerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
  srOnly?: boolean;
}

// ============================================
// LOADING SPINNER COMPONENT
// ============================================

export const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ 
    className, 
    size = 'md', 
    variant = 'default', 
    label = 'Cargando...', 
    srOnly = true, 
    ...props 
  }, ref) => {
    const sizeClass = spinnerVariants.variants.size[size];
    const variantClass = spinnerVariants.variants.variant[variant];

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center justify-center', className)}
        {...props}
      >
        <div 
          className={cn(spinnerVariants.base, sizeClass, variantClass)}
          role="status"
          aria-label={label}
        />
        {!srOnly && label && (
          <span className="ml-2 text-sm text-app-gray-300">{label}</span>
        )}
        {srOnly && (
          <span className="sr-only">{label}</span>
        )}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

// ============================================
// LOADING OVERLAY COMPONENT
// ============================================

export interface LoadingOverlayProps {
  isLoading: boolean;
  label?: string;
  backdrop?: boolean;
  children?: React.ReactNode;
  className?: string;
  spinnerSize?: SpinnerSize;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  label = 'Cargando...',
  backdrop = true,
  children,
  className,
  spinnerSize = 'lg',
}) => {
  if (!isLoading && !children) return null;

  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div 
          className={cn(
            'absolute inset-0 flex items-center justify-center z-50',
            backdrop && 'bg-app-dark-900/80 backdrop-blur-sm'
          )}
        >
          <div className="flex flex-col items-center space-y-3">
            <LoadingSpinner size={spinnerSize} variant="default" />
            <span className="text-sm text-app-gray-300 font-medium">{label}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// LOADING SKELETON COMPONENTS
// ============================================

export const LoadingCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse', className)}>
    <div className="rounded-lg bg-app-dark-700 h-32 xs:h-24 sm:h-32"></div>
  </div>
);

export const LoadingTable: React.FC<{ 
  rows?: number; 
  columns?: number;
  isMobile?: boolean;
}> = ({ rows = 5, columns = 4, isMobile = false }) => (
  <div className="animate-pulse">
    {!isMobile && (
      <>
        {/* Desktop table header */}
        <div className="bg-app-dark-800 rounded-t-lg p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-4 bg-app-dark-600 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Desktop table rows */}
        <div className="bg-app-dark-750 rounded-b-lg">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="p-4 border-b border-app-dark-600 last:border-b-0">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <div key={colIndex} className="h-4 bg-app-dark-600 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    )}
    
    {isMobile && (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="bg-app-dark-800 rounded-lg p-4">
            <div className="space-y-3">
              <div className="h-5 bg-app-dark-600 rounded w-3/4"></div>
              <div className="h-4 bg-app-dark-600 rounded w-1/2"></div>
              <div className="flex space-x-2">
                <div className="h-3 bg-app-dark-600 rounded w-16"></div>
                <div className="h-3 bg-app-dark-600 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const LoadingText: React.FC<{ 
  lines?: number; 
  className?: string;
  variant?: 'paragraph' | 'title' | 'subtitle';
}> = ({ lines = 3, className, variant = 'paragraph' }) => {
  const heights = {
    paragraph: 'h-4',
    title: 'h-6',
    subtitle: 'h-5',
  };

  return (
    <div className={cn('animate-pulse space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            'bg-app-dark-600 rounded',
            heights[variant],
            i === lines - 1 && lines > 1 && 'w-3/4'
          )}
        ></div>
      ))}
    </div>
  );
};

// ============================================
// PAGE LOADING COMPONENT
// ============================================

export const PageLoading: React.FC<{ message?: string }> = ({ 
  message = 'Cargando p谩gina...' 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-app-dark-900">
    <div className="text-center">
      <LoadingSpinner size="xl" variant="default" />
      <p className="mt-4 text-app-gray-300 text-lg">{message}</p>
    </div>
  </div>
);

// ============================================
// BUTTON LOADING CONTENT
// ============================================

export const LoadingButtonContent: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  size?: SpinnerSize;
}> = ({ loading, children, loadingText, size = 'sm' }) => (
  <>
    {loading && (
      <LoadingSpinner 
        size={size} 
        variant="white" 
        className="mr-2" 
        srOnly
      />
    )}
    <span className={cn(loading && 'opacity-70')}>
      {loading && loadingText ? loadingText : children}
    </span>
  </>
);

// ============================================
// FULL SCREEN LOADING
// ============================================

export const FullScreenLoading: React.FC<{
  message?: string;
  submessage?: string;
}> = ({ 
  message = 'Inicializando aplicaci贸n...', 
  submessage = 'Por favor espera un momento' 
}) => (
  <div className="fixed inset-0 bg-app-dark-900 flex items-center justify-center z-[100]">
    <div className="text-center max-w-md px-6">
      <div className="mb-6">
        <LoadingSpinner size="xl" variant="default" />
      </div>
      <h2 className="text-xl font-semibold text-app-gray-200 mb-2">
        {message}
      </h2>
      <p className="text-app-gray-400">
        {submessage}
      </p>
    </div>
  </div>
);
