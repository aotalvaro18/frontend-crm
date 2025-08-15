// src/components/ui/Tooltip.tsx
// ✅ TOOLTIP ENTERPRISE COMPONENT - VERSIÓN FINAL CORREGIDA Y COMPLETA
// Mobile-first + TypeScript strict + Performance optimized + Accessibility

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// ============================================
// TOOLTIP VARIANTS
// ============================================

const tooltipVariants = cva(
  // Base classes
  'absolute z-50 px-2 py-1 text-xs font-medium rounded-md shadow-lg transition-all duration-200 pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-app-dark-900 text-app-gray-100 border border-app-dark-700',
        dark: 'bg-black text-white',
        light: 'bg-white text-gray-900 border border-gray-200 shadow-sm',
        accent: 'bg-app-accent-500 text-white',
        success: 'bg-green-600 text-white',
        warning: 'bg-yellow-600 text-white',
        error: 'bg-red-600 text-white',
        info: 'bg-blue-600 text-white',
      },
      size: {
        sm: 'px-2 py-1 text-xs max-w-xs',
        md: 'px-3 py-1.5 text-sm max-w-md',
        lg: 'px-4 py-2 text-base max-w-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
);

const arrowVariants = cva(
  'absolute w-2 h-2 transform rotate-45',
  {
    variants: {
      variant: {
        default: 'bg-app-dark-900 border-app-dark-700',
        dark: 'bg-black',
        light: 'bg-white border-gray-200',
        accent: 'bg-app-accent-500',
        success: 'bg-green-600',
        warning: 'bg-yellow-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
      },
      side: {
        top: '-top-1 border-b border-r',
        bottom: '-bottom-1 border-t border-l',
        left: '-left-1 border-t border-r',
        right: '-right-1 border-b border-l',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// ============================================
// TYPES
// ============================================

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';
export type TooltipAlign = 'start' | 'center' | 'end';

export interface TooltipProps extends VariantProps<typeof tooltipVariants> {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: TooltipSide;
  align?: TooltipAlign;
  offset?: number;
  disabled?: boolean;
  delayDuration?: number;
  closeDelay?: number;
  showArrow?: boolean;
  portal?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
  arrowClassName?: string;
}

// ============================================
// POSITION UTILITIES
// ============================================

interface TooltipPosition {
  x: number;
  y: number;
  arrowX?: number;
  arrowY?: number;
}

function calculateTooltipPosition(
  triggerRect: DOMRect,
  tooltipSize: { width: number; height: number },
  side: TooltipSide,
  align: TooltipAlign,
  offset: number
): TooltipPosition {
    const { width: tooltipWidth, height: tooltipHeight } = tooltipSize;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let x = 0, y = 0;
    let arrowX: number | undefined, arrowY: number | undefined;

    switch (side) {
        case 'top':
            y = triggerRect.top + scrollY - tooltipHeight - offset;
            break;
        case 'bottom':
            y = triggerRect.bottom + scrollY + offset;
            break;
        case 'left':
            x = triggerRect.left + scrollX - tooltipWidth - offset;
            break;
        case 'right':
            x = triggerRect.right + scrollX + offset;
            break;
    }

    if (side === 'top' || side === 'bottom') {
        switch (align) {
            case 'start':
                x = triggerRect.left + scrollX;
                arrowX = triggerRect.width / 2 - 4;
                break;
            case 'center':
                x = triggerRect.left + scrollX + (triggerRect.width - tooltipWidth) / 2;
                arrowX = tooltipWidth / 2 - 4;
                break;
            case 'end':
                x = triggerRect.right + scrollX - tooltipWidth;
                arrowX = tooltipWidth - triggerRect.width / 2 - 4;
                break;
        }
        if (side === 'top') arrowY = tooltipHeight - 4;
        else arrowY = -4;
    } else {
        switch (align) {
            case 'start':
                y = triggerRect.top + scrollY;
                arrowY = triggerRect.height / 2 - 4;
                break;
            case 'center':
                y = triggerRect.top + scrollY + (triggerRect.height - tooltipHeight) / 2;
                arrowY = tooltipHeight / 2 - 4;
                break;
            case 'end':
                y = triggerRect.bottom + scrollY - tooltipHeight;
                arrowY = tooltipHeight - triggerRect.height / 2 - 4;
                break;
        }
        if (side === 'left') arrowX = tooltipWidth - 4;
        else arrowX = -4;
    }
    
    return { x, y, arrowX, arrowY };
}


function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const onTouch = () => {
      setIsTouch(true);
      window.removeEventListener('touchstart', onTouch);
    };
    window.addEventListener('touchstart', onTouch, { passive: true });
    return () => window.removeEventListener('touchstart', onTouch);
  }, []);
  return isTouch;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  variant,
  size,
  side = 'top',
  align = 'center',
  offset = 8,
  disabled = false,
  delayDuration = 300,
  closeDelay = 150,
  showArrow = true,
  portal = true,
  onOpenChange,
  className,
  contentClassName,
  arrowClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ x: 0, y: 0 });
  
  const tooltipId = `tooltip-${React.useId()}`;
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const openTimeoutRef = useRef<NodeJS.Timeout>();
  const closeTimeoutRef = useRef<NodeJS.Timeout>();
  
  const isTouch = useIsTouch();

  const updatePosition = useCallback(() => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipSize = { width: tooltipRef.current.offsetWidth, height: tooltipRef.current.offsetHeight };
      setPosition(calculateTooltipPosition(triggerRect, tooltipSize, side, align, offset));
    }
  }, [side, align, offset]);

  useEffect(() => {
    // Si el tooltip no está abierto, no hacemos nada.
    if (!isOpen) {
      return; // Salimos temprano, no hay listeners que añadir.
    }
  
    // Si está abierto, definimos el handler y añadimos los listeners.
    const handlePositionUpdate = () => updatePosition();
    
    window.addEventListener('scroll', handlePositionUpdate, { passive: true });
    window.addEventListener('resize', handlePositionUpdate, { passive: true });
    
    // ✅ CORRECCIÓN: La función de limpieza ahora se devuelve siempre
    // que se añaden los listeners.
    return () => {
      window.removeEventListener('scroll', handlePositionUpdate);
      window.removeEventListener('resize', handlePositionUpdate);
    };
  }, [isOpen, updatePosition]); // Las dependencias son correctas

  const handleOpen = useCallback(() => {
    if (disabled || (!content && content !== 0)) return;
    clearTimeout(closeTimeoutRef.current);
    openTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
      onOpenChange?.(true);
    }, delayDuration);
  }, [disabled, content, delayDuration, onOpenChange]);

  const handleClose = useCallback(() => {
    clearTimeout(openTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      onOpenChange?.(false);
    }, closeDelay);
  }, [closeDelay, onOpenChange]);

  const triggerProps = {
    ref: triggerRef,
    onMouseEnter: isTouch ? undefined : handleOpen,
    onMouseLeave: isTouch ? undefined : handleClose,
    onFocus: handleOpen,
    onBlur: handleClose,
    onClick: isTouch ? () => (isOpen ? handleClose() : handleOpen()) : undefined,
    'aria-describedby': isOpen ? tooltipId : undefined,
  };

  const renderTooltipContent = () => {
    if (!isOpen) return null;

    const tooltipElement = (
      <div
      id={tooltipId}  
      ref={tooltipRef}
        role="tooltip"
        className={cn(tooltipVariants({ variant, size, className: contentClassName }))}
        style={{ position: 'fixed', top: position.y, left: position.x, zIndex: 9999 }}
      >
        {content}
        {showArrow && (
          <div
            className={cn(arrowVariants({ variant, side }), variant === 'light' && 'border', arrowClassName)}
            style={{ left: position.arrowX, top: position.arrowY }}
          />
        )}
      </div>
    );
    return portal ? createPortal(tooltipElement, document.body) : tooltipElement;
  };
  
  return (
    <>
      <div {...triggerProps} className={cn('inline-block', className)}>
        {children}
      </div>
      {renderTooltipContent()}
    </>
  );
};

// ============================================
// SPECIALIZED COMPONENTS
// ============================================

/**
 * Help Tooltip - Para textos de ayuda
 */
export const HelpTooltip: React.FC<{
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string;
  }> = ({ content, children, className }) => (
    <Tooltip
      content={content}
      side="top"
      align="center"
      variant="default"
      size="md"
      delayDuration={500}
      className={className}
    >
      {children}
    </Tooltip>
  );
  
/**
 * Error Tooltip - Para errores de validación
 */
export const ErrorTooltip: React.FC<{
  content: React.ReactNode;
  children: React.ReactNode;
  show?: boolean;
  className?: string;
}> = ({ content, children, show = true, className }) => (
  <Tooltip
    content={content}
    disabled={!show}
    side="top"
    variant="error"
    size="md"
    delayDuration={100}
    closeDelay={300}
    className={className}
  >
    {children}
  </Tooltip>
);

/**
 * Quick Tooltip - Para tooltips simples con delay corto
 */
export const QuickTooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  side?: TooltipSide;
}> = ({ content, children, side = 'top' }) => (
  <Tooltip
    content={content}
    side={side}
    variant="dark"
    size="sm"
    delayDuration={200}
    closeDelay={100}
    showArrow={false}
  >
    {children}
  </Tooltip>
);
  
/**
 * Rich Tooltip - Para contenido complejo
 */
export const RichTooltip: React.FC<{
  title?: string;
  content: React.ReactNode;
  children: React.ReactNode;
  side?: TooltipSide;
  variant?: VariantProps<typeof tooltipVariants>['variant'];
}> = ({ title, content, children, side = 'top', variant = 'default' }) => (
  <Tooltip
    content={
      <div className="space-y-1">
        {title && (
          <div className="font-semibold text-xs">{title}</div>
        )}
        <div className="text-xs opacity-90">{content}</div>
      </div>
    }
    side={side}
    variant={variant}
    size="lg"
    delayDuration={400}
  >
    {children}
  </Tooltip>
);

/**
 * Status Tooltip - Para indicadores de estado
 */
export const StatusTooltip: React.FC<{
  status: 'success' | 'warning' | 'error' | 'info';
  content: React.ReactNode;
  children: React.ReactNode;
}> = ({ status, content, children }) => (
  <Tooltip
    content={content}
    variant={status}
    size="sm"
    delayDuration={300}
    showArrow={true}
  >
    {children}
  </Tooltip>
);
  
export default Tooltip;