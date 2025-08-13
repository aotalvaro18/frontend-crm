// src/components/ui/Checkbox.tsx
// Checkbox enterprise component siguiendo tu guía arquitectónica
// Mobile-first + TypeScript strict + Indeterminate support + Touch-friendly

import React, { forwardRef } from 'react';
import { Check, Minus } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// ============================================
// CHECKBOX VARIANTS
// ============================================

const checkboxVariants = cva(
  // Base classes for the visible checkbox element
  'relative flex items-center justify-center shrink-0 transition-all duration-200 border border-app-dark-500 ring-offset-app-dark-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 peer-focus-visible:ring-2 peer-focus-visible:ring-app-accent-500 peer-focus-visible:ring-offset-2 hover:border-app-dark-400',
  {
    variants: {
      variant: {
        default: 'data-[state=checked]:bg-app-accent-500 data-[state=checked]:border-app-accent-500 data-[state=checked]:text-white',
        secondary: 'data-[state=checked]:bg-app-dark-600 data-[state=checked]:border-app-dark-400 data-[state=checked]:text-app-gray-200',
        success: 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:text-white',
        warning: 'data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500 data-[state=checked]:text-white',
        error: 'data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500 data-[state=checked]:text-white',
        contact: 'data-[state=checked]:bg-crm-contact-500 data-[state=checked]:border-crm-contact-500 data-[state=checked]:text-white',
        deal: 'data-[state=checked]:bg-crm-deal-500 data-[state=checked]:border-crm-deal-500 data-[state=checked]:text-white',
      },
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
        xl: 'h-6 w-6',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      rounded: 'sm',
    },
  }
);

// ============================================
// TYPES
// ============================================

export type CheckboxVariant = VariantProps<typeof checkboxVariants>['variant'];
export type CheckboxSize = VariantProps<typeof checkboxVariants>['size'];

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'>,
    VariantProps<typeof checkboxVariants> {
  
  // State
  checked?: boolean;
  indeterminate?: boolean;
  
  // Label & Description
  label?: string;
  description?: string;
  
  // Error state
  error?: string;
  
  // Touch-friendly (mobile)
  touchFriendly?: boolean;
  
  // Events
  onChange?: (checked: boolean) => void;
  
  // Classes
  labelClassName?: string;
  containerClassName?: string;
}

// ============================================
// CHECKBOX COMPONENT
// ============================================

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({
    className,
    size,
    variant,
    rounded,
    checked = false,
    indeterminate = false,
    label,
    description,
    error,
    touchFriendly = false,
    onChange,
    disabled,
    id,
    labelClassName,
    containerClassName,
    ...props
  }, ref) => {
    const checkboxId = id || `checkbox-${React.useId()}`;
    const state = indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked);
    };

    const iconSizes = { sm: 'h-2 w-2', md: 'h-3 w-3', lg: 'h-4 w-4', xl: 'h-5 w-5' };
    
    const checkboxElement = (
      <div className={cn("relative inline-flex items-center", touchFriendly && "p-2")}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer" // 'peer' es clave para el focus
          data-state={state}
          {...props}
        />
        
        <div
          className={cn(
            checkboxVariants({ variant, size, rounded }),
            (checked || indeterminate) && 'bg-current border-current',
            error && 'border-red-500 focus-visible:ring-red-500'
          )}
          data-state={state}
        >
          {checked && !indeterminate && (
            <Check className={cn(iconSizes[size || 'md'], 'text-current')} strokeWidth={3} />
          )}
          {indeterminate && (
            <Minus className={cn(iconSizes[size || 'md'], 'text-current')} strokeWidth={3} />
          )}
        </div>
      </div>
    );
    
    if (!label && !description && !error) {
      return checkboxElement;
    }
    
    return (
      <div className={cn('flex items-start space-x-3', containerClassName)}>
        {checkboxElement}
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                'text-sm font-medium leading-none cursor-pointer text-app-gray-200',
                disabled && 'opacity-50 cursor-not-allowed',
                error && 'text-red-400',
                labelClassName
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={cn('text-xs text-app-gray-500 mt-1', disabled && 'opacity-50')}>
              {description}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// ============================================
// SPECIALIZED CHECKBOX COMPONENTS
// ============================================

/**
 * Table Checkbox - Optimizado para uso en tablas
 */
export const TableCheckbox: React.FC<{
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}> = ({ 
  checked, 
  indeterminate, 
  onChange, 
  disabled, 
  'aria-label': ariaLabel,
  className 
}) => (
  <Checkbox
    checked={checked}
    indeterminate={indeterminate}
    onChange={onChange}
    disabled={disabled}
    aria-label={ariaLabel}
    size="sm"
    touchFriendly
    className={className}
  />
);

/**
 * Form Checkbox - Para formularios con validación
 */
export interface FormCheckboxProps extends CheckboxProps {
  name: string;
  required?: boolean;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ required, label, ...props }, ref) => (
    <Checkbox
      ref={ref}
      label={required && label ? `${label} *` : label}
      {...props}
    />
  )
);

FormCheckbox.displayName = 'FormCheckbox';

/**
 * Checkbox Group - Para múltiples opciones
 */
export interface CheckboxGroupProps {
  name?: string;
  label?: string;
  description?: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  error?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: CheckboxSize;
  variant?: CheckboxVariant;
  className?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  name,
  label,
  description,
  options,
  value = [],
  onChange,
  disabled = false,
  error,
  orientation = 'vertical',
  size = 'md',
  variant = 'default',
  className,
}) => {
  const handleOptionChange = (optionValue: string, checked: boolean) => {
    if (!onChange) return;
    
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter(v => v !== optionValue));
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Group label */}
      {label && (
        <div>
          <label className={cn(
            'text-sm font-medium text-app-gray-200',
            disabled && 'opacity-50'
          )}>
            {label}
          </label>
          {description && (
            <p className={cn(
              'text-xs text-app-gray-500 mt-1',
              disabled && 'opacity-50'
            )}>
              {description}
            </p>
          )}
        </div>
      )}

      {/* Options */}
      <div className={cn(
        'space-y-3',
        orientation === 'horizontal' && 'flex flex-wrap gap-4 space-y-0'
      )}>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            name={name}
            label={option.label}
            description={option.description}
            checked={value.includes(option.value)}
            onChange={(checked) => handleOptionChange(option.value, checked)}
            disabled={disabled || option.disabled}
            size={size}
            variant={variant}
            error={error && value.length === 0 ? error : undefined}
          />
        ))}
      </div>

      {/* Group error */}
      {error && value.length === 0 && (
        <p className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Agreement Checkbox - Para términos y condiciones
 */
export const AgreementCheckbox: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  className?: string;
}> = ({ checked, onChange, children, required, error, className }) => (
  <Checkbox
    checked={checked}
    onChange={onChange}
    label=""
    error={error}
    className={className}
    containerClassName="items-start"
    labelClassName="text-sm leading-relaxed"
  >
    <div className="flex-1 min-w-0">
      <div className={cn(
        'text-sm leading-relaxed text-app-gray-300',
        required && 'after:content-["*"] after:text-red-400 after:ml-1'
      )}>
        {children}
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  </Checkbox>
);

/**
 * Toggle Checkbox - Estilo switch
 */
export const ToggleCheckbox: React.FC<CheckboxProps> = (props) => (
  <Checkbox
    {...props}
    rounded="full"
    className={cn(
      'w-11 h-6 bg-app-dark-600',
      'data-[state=checked]:bg-app-accent-500',
      'relative transition-colors',
      'before:content-[""] before:absolute before:top-0.5 before:left-0.5',
      'before:bg-white before:w-5 before:h-5 before:rounded-full',
      'before:transition-transform before:duration-200',
      'data-[state=checked]:before:translate-x-5',
      props.className
    )}
  />
);

/**
 * Card Checkbox - Para selección de cards
 */
export interface CardCheckboxProps extends Omit<CheckboxProps, 'content'> {
  title: string;
  content?: React.ReactNode;
  icon?: React.ReactNode;
}

export const CardCheckbox: React.FC<CardCheckboxProps> = ({
  title,
  content,
  icon,
  checked,
  onChange,
  disabled,
  className,
  ...props
}) => (
  <label className={cn(
    'relative flex cursor-pointer rounded-lg border p-4 transition-all',
    'border-app-dark-600 bg-app-dark-800',
    'hover:border-app-dark-500',
    checked && 'border-app-accent-500 bg-app-dark-700',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  )}>
    <Checkbox
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="sr-only"
      {...props}
    />
    
    <div className="flex w-full items-start space-x-3">
      {icon && (
        <div className="flex-shrink-0">
          {icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-app-gray-200">
          {title}
        </div>
        {content && (
          <div className="mt-1 text-xs text-app-gray-400">
            {content}
          </div>
        )}
      </div>
      
      <div className="flex-shrink-0">
        <div className={cn(
          'h-4 w-4 rounded-sm border border-app-dark-500 transition-all',
          checked && 'bg-app-accent-500 border-app-accent-500',
          'flex items-center justify-center'
        )}>
          {checked && (
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          )}
        </div>
      </div>
    </div>
  </label>
);

export default Checkbox; 
