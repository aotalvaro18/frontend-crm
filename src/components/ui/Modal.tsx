// src/components/ui/Modal.tsx
// Modal enterprise component siguiendo tu guía arquitectónica
// Mobile-first + TypeScript strict + Focus management + Animations

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

import { cva, type VariantProps } from 'class-variance-authority';

// ============================================
// MODAL VARIANTS
// ============================================

const modalPanelVariants = cva(
  // Base classes for the modal panel
  'relative w-full rounded-lg shadow-lg',
  {
    variants: {
      variant: {
        default: 'bg-app-dark-800 border border-app-dark-600',
        bordered: 'bg-app-dark-800 border-2 border-app-dark-500',
        elevated: 'bg-app-dark-800 border border-app-dark-600 shadow-2xl',
        glass: 'bg-app-dark-800/90 backdrop-blur-sm border border-app-dark-600',
      },
      size: {
        xs: 'max-w-xs',
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        full: 'max-w-full mx-4',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

// Mantenemos las variantes de posición separadas ya que aplican al contenedor flex
const positionVariants = {
  center: 'items-center justify-center',
  top: 'items-start justify-center pt-16',
  bottom: 'items-end justify-center pb-16',
};

// ============================================
// TYPES
// ============================================

export type ModalSize = VariantProps<typeof modalPanelVariants>['size'];

// Derivamos los tipos solo para el panel del modal
export interface ModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof modalPanelVariants> {
  
  // Control
  isOpen: boolean;
  onClose: () => void;
  
  // Content
  title?: string;
  description?: string;
  children?: React.ReactNode;
  
  // Styling
  position?: keyof typeof positionVariants;
  
  // Behavior
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventScroll?: boolean;
  
  // Mobile
  mobileDrawer?: boolean;
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  
  // Animation
  animation?: 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right';
  
  // Accessibility
  role?: 'dialog' | 'alertdialog';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  
  // Events
  onOpen?: () => void;
  onAfterOpen?: () => void;
  onAfterClose?: () => void;
  
  // Classes
  // 'className' se hereda y se aplica al panel del modal
  overlayClassName?: string;
  contentClassName?: string;
}

// ============================================
// FOCUS TRAP HOOK
// ============================================

function useFocusTrap(isOpen: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, containerRef]);
}

// ============================================
// ESCAPE KEY HOOK
// ============================================

function useEscapeKey(isOpen: boolean, onClose: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!isOpen || !enabled) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose, enabled]);
}

// ============================================
// SCROLL LOCK HOOK
// ============================================

function useScrollLock(isOpen: boolean, enabled: boolean = true) {
  useEffect(() => {
    if (!isOpen || !enabled) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen, enabled]);
}

// ============================================
// MODAL COMPONENT
// ============================================

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  variant = 'default',
  position = 'center',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  preventScroll = true,
  mobileDrawer = false,
  mobileBreakpoint = 'sm',
  animation = 'scale',
  role = 'dialog',
  ariaLabel,
  ariaDescribedBy,
  onOpen,
  onAfterOpen,
  onAfterClose,
  className,
  overlayClassName,
  contentClassName,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement>();

  // Hooks
  useFocusTrap(isOpen && isVisible, modalRef);
  useEscapeKey(isOpen && isVisible, onClose, closeOnEscape);
  useScrollLock(isOpen && isVisible, preventScroll);

  // Animation classes
  const animationClasses = {
    fade: {
      overlay: {
        enter: 'opacity-0',
        enterActive: 'opacity-100 transition-opacity duration-300',
        exit: 'opacity-100',
        exitActive: 'opacity-0 transition-opacity duration-300',
      },
      content: {
        enter: 'opacity-0',
        enterActive: 'opacity-100 transition-opacity duration-300',
        exit: 'opacity-100',
        exitActive: 'opacity-0 transition-opacity duration-300',
      },
    },
    scale: {
      overlay: {
        enter: 'opacity-0',
        enterActive: 'opacity-100 transition-opacity duration-300',
        exit: 'opacity-100',
        exitActive: 'opacity-0 transition-opacity duration-300',
      },
      content: {
        enter: 'opacity-0 scale-95',
        enterActive: 'opacity-100 scale-100 transition-all duration-300',
        exit: 'opacity-100 scale-100',
        exitActive: 'opacity-0 scale-95 transition-all duration-300',
      },
    },
    'slide-up': {
      overlay: {
        enter: 'opacity-0',
        enterActive: 'opacity-100 transition-opacity duration-300',
        exit: 'opacity-100',
        exitActive: 'opacity-0 transition-opacity duration-300',
      },
      content: {
        enter: 'opacity-0 translate-y-4',
        enterActive: 'opacity-100 translate-y-0 transition-all duration-300',
        exit: 'opacity-100 translate-y-0',
        exitActive: 'opacity-0 translate-y-4 transition-all duration-300',
      },
    },
    'slide-down': {
      overlay: {
        enter: 'opacity-0',
        enterActive: 'opacity-100 transition-opacity duration-300',
        exit: 'opacity-100',
        exitActive: 'opacity-0 transition-opacity duration-300',
      },
      content: {
        enter: 'opacity-0 -translate-y-4',
        enterActive: 'opacity-100 translate-y-0 transition-all duration-300',
        exit: 'opacity-100 translate-y-0',
        exitActive: 'opacity-0 -translate-y-4 transition-all duration-300',
      },
    },
    'slide-left': {
      overlay: {
        enter: 'opacity-0',
        enterActive: 'opacity-100 transition-opacity duration-300',
        exit: 'opacity-100',
        exitActive: 'opacity-0 transition-opacity duration-300',
      },
      content: {
        enter: 'opacity-0 translate-x-4',
        enterActive: 'opacity-100 translate-x-0 transition-all duration-300',
        exit: 'opacity-100 translate-x-0',
        exitActive: 'opacity-0 translate-x-4 transition-all duration-300',
      },
    },
    'slide-right': {
      overlay: {
        enter: 'opacity-0',
        enterActive: 'opacity-100 transition-opacity duration-300',
        exit: 'opacity-100',
        exitActive: 'opacity-0 transition-opacity duration-300',
      },
      content: {
        enter: 'opacity-0 -translate-x-4',
        enterActive: 'opacity-100 translate-x-0 transition-all duration-300',
        exit: 'opacity-100 translate-x-0',
        exitActive: 'opacity-0 -translate-x-4 transition-all duration-300',
      },
    },
  };

  // Handle open/close
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setIsVisible(true);
      setIsAnimating(true);
      onOpen?.();
      
      setTimeout(() => {
        setIsAnimating(false);
        onAfterOpen?.();
      }, 300);
    } else if (isVisible) {
      setIsAnimating(true);
      
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        previousActiveElement.current?.focus();
        onAfterClose?.();
      }, 300);
    }
  }, [isOpen, isVisible, onOpen, onAfterOpen, onAfterClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  // Don't render if not visible
  if (!isVisible) return null;

  // Get styling classes
  const positionClass = positionVariants[position];
  const currentAnimation = animationClasses[animation];

  // Portal content
  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex',
        positionClass,
        mobileDrawer && `${mobileBreakpoint}:flex`,
        mobileDrawer && `max-${mobileBreakpoint}:items-end max-${mobileBreakpoint}:justify-center`
      )}
      role="presentation"
    >
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm',
          isAnimating ? currentAnimation.overlay.enter : currentAnimation.overlay.enterActive,
          overlayClassName
        )}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={modalRef}
        className={cn(
          modalPanelVariants({ variant, size, className }),
          mobileDrawer && `max-${mobileBreakpoint}:max-w-full max-${mobileBreakpoint}:rounded-t-lg max-${mobileBreakpoint}:rounded-b-none`,
          mobileDrawer && `max-${mobileBreakpoint}:mb-0`,
          isAnimating ? currentAnimation.content.enter : currentAnimation.content.enterActive
        )}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel || title}
        aria-describedby={ariaDescribedBy}
        >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={cn(
            'flex items-center justify-between p-6 border-b border-app-dark-600',
            // Mobile drawer header
            mobileDrawer && `max-${mobileBreakpoint}:p-4`
          )}>
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-lg font-semibold text-white truncate">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-app-gray-400">
                  {description}
                </p>
              )}
            </div>
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-4 flex-shrink-0"
                onClick={onClose}
                aria-label="Cerrar modal"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'p-6',
          // Mobile drawer content
          mobileDrawer && `max-${mobileBreakpoint}:p-4`,
          contentClassName
        )}>
          {children}
        </div>
      </div>
    </div>
  );

  // Render portal
  return createPortal(modalContent, document.body);
};

// ============================================
// SPECIALIZED MODAL COMPONENTS
// ============================================

/**
 * Confirmation Modal - Para confirmaciones críticas
 */
export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "¿Estás seguro?",
  message = "Esta acción no se puede deshacer.",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = 'danger',
  loading = false,
}) => {
  const icons = {
    danger: <AlertTriangle className="h-6 w-6 text-red-500" />,
    warning: <AlertCircle className="h-6 w-6 text-yellow-500" />,
    info: <Info className="h-6 w-6 text-blue-500" />,
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
  };

  const buttonVariants = {
    danger: 'destructive',
    warning: 'warning',
    info: 'default',
    success: 'success',
  } as const;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      variant="elevated"
      role="alertdialog"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {icons[variant]}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-app-gray-400 mb-6">
            {message}
          </p>
          
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="sm:min-w-[100px]"
            >
              {cancelText}
            </Button>
            <Button
              variant={buttonVariants[variant]}
              onClick={onConfirm}
              loading={loading}
              className="sm:min-w-[100px]"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Form Modal - Para formularios con cancel/save
 */
export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  saveText?: string;
  cancelText?: string;
  saveDisabled?: boolean;
  loading?: boolean;
  size?: ModalSize;
  mobileDrawer?: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  description,
  children,
  saveText = "Guardar",
  cancelText = "Cancelar",
  saveDisabled = false,
  loading = false,
  size = 'lg',
  mobileDrawer = true,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      variant="elevated"
      mobileDrawer={mobileDrawer}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      contentClassName="pb-0"
    >
      <div className="space-y-6">
        {/* Form content */}
        <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
          {children}
        </div>
        
        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-app-dark-600">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="sm:min-w-[100px]"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onSave}
            disabled={saveDisabled}
            loading={loading}
            className="sm:min-w-[100px]"
          >
            {saveText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Drawer Modal - Para mobile-first experiences
 */
export const DrawerModal: React.FC<Omit<ModalProps, 'mobileDrawer' | 'position' | 'animation'>> = (props) => (
  <Modal
    {...props}
    mobileDrawer
    position="bottom"
    animation="slide-up"
    mobileBreakpoint="md"
  />
);

/**
 * Alert Modal - Para notificaciones importantes
 */
export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  actionText?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  actionText = "Entendido",
}) => {
  const icons = {
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    error: <AlertTriangle className="h-6 w-6 text-red-500" />,
    warning: <AlertCircle className="h-6 w-6 text-yellow-500" />,
    info: <Info className="h-6 w-6 text-blue-500" />,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      variant="elevated"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-app-gray-400 mb-6">
            {message}
          </p>
          
          <div className="flex justify-end">
            <Button onClick={onClose}>
              {actionText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default Modal; 
