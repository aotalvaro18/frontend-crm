 // src/components/ui/Input.tsx
// Input component enterprise mobile-first siguiendo la guía arquitectónica
// Manejo completo de estados, validación y accesibilidad

import React, { forwardRef, useState, useId } from 'react';
import { 
  Eye, EyeOff, AlertCircle, CheckCircle, Search, 
  X, Calendar, Clock, Phone, Mail, Lock,
  Globe, Hash
} from 'lucide-react';
import { cn } from '@/utils/cn';

import { cva, type VariantProps } from 'class-variance-authority';

// ============================================
// TYPES
// ============================================

// Derivamos los tipos de las variantes para usarlos
type InputVariantProps = VariantProps<typeof inputVariants>;

interface BaseInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  size?: InputVariantProps['inputSize']; // Usamos el tipo derivado
  variant?: InputVariantProps['variant'];
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
  showRequiredIndicator?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  labelClassName?: string;
  containerClassName?: string;
  showCharacterCount?: boolean;
  maxLength?: number;
  clearable?: boolean;
  onClear?: () => void;
  autoResize?: boolean;
}

type HTMLInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof BaseInputProps | 'size'>;
type HTMLTextAreaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof BaseInputProps>;

export interface InputProps extends BaseInputProps, HTMLInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
  showPasswordToggle?: boolean;
}

interface TextAreaProps extends Omit<BaseInputProps, 'variant'>, HTMLTextAreaProps {
  variant: 'textarea';
  minRows?: number;
  maxRows?: number;
}

type CombinedInputProps = InputProps | TextAreaProps;


// ============================================
// STYLING CONFIGURATIONS (con cva)
// ============================================

const inputVariants = cva(
  // Base classes for the input element
  'w-full rounded-lg transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-app-dark-700 border border-app-dark-600 focus:ring-2 focus:ring-app-accent-500 focus:border-transparent text-white placeholder-app-gray-400 hover:border-app-dark-500',
        filled: 'bg-app-dark-600 border-0 rounded-lg focus:ring-2 focus:ring-app-accent-500 text-white placeholder-app-gray-400 hover:bg-app-dark-500',
        underlined: 'bg-transparent border-0 border-b-2 border-app-dark-600 rounded-none focus:ring-0 focus:border-app-accent-500 text-white placeholder-app-gray-400 hover:border-app-dark-500',
        outline: 'border-app-dark-500 bg-app-dark-800 text-app-gray-100 placeholder-app-gray-500 focus:border-app-accent-400',
      },
      inputSize: { // Renombramos 'size' a 'inputSize' para evitar conflicto con prop de HTML
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-3 text-sm sm:text-base',
        lg: 'px-4 py-4 text-base',
      },
      hasLeftIcon: {
        true: '', // El padding se aplica en compound variants
      },
      hasRightIcon: {
        true: '', // El padding se aplica en compound variants
      },
      state: {
        normal: '',
        error: '', // El borde se aplica en compound variants
        success: '', // El borde se aplica en compound variants
        disabled: 'bg-app-dark-800 border-app-dark-700 text-app-gray-500 cursor-not-allowed',
      }
    },
    compoundVariants: [
      // Paddings con iconos
      { inputSize: 'sm', hasLeftIcon: true, className: 'pl-9' },
      { inputSize: 'sm', hasRightIcon: true, className: 'pr-9' },
      { inputSize: 'md', hasLeftIcon: true, className: 'pl-10 sm:pl-11' },
      { inputSize: 'md', hasRightIcon: true, className: 'pr-10 sm:pr-11' },
      { inputSize: 'lg', hasLeftIcon: true, className: 'pl-12' },
      { inputSize: 'lg', hasRightIcon: true, className: 'pr-12' },
      // Colores de borde por estado y variante
      { variant: 'default', state: 'error', className: 'border-red-500 focus:ring-red-500 focus:border-red-500' },
      { variant: 'default', state: 'success', className: 'border-green-500 focus:ring-green-500 focus:border-green-500' },
      { variant: 'filled', state: 'error', className: 'bg-red-900/20 focus:ring-red-500' },
      { variant: 'filled', state: 'success', className: 'bg-green-900/20 focus:ring-green-500' },
      { variant: 'underlined', state: 'error', className: 'border-red-500 focus:border-red-500' },
      { variant: 'underlined', state: 'success', className: 'border-green-500 focus:border-green-500' },
    ],
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
      state: 'normal',
    },
  }
);

// ============================================
// ICON MAPPING BY INPUT TYPE
// ============================================

const getDefaultIcon = (type: string): React.ReactNode | null => {
  const iconMap: Record<string, React.ReactNode> = {
    email: <Mail className="h-5 w-5" />,
    password: <Lock className="h-5 w-5" />,
    tel: <Phone className="h-5 w-5" />,
    url: <Globe className="h-5 w-5" />,
    search: <Search className="h-5 w-5" />,
    date: <Calendar className="h-5 w-5" />,
    time: <Clock className="h-5 w-5" />,
    number: <Hash className="h-5 w-5" />,
  };
  
  return iconMap[type] || null;
};

// ============================================
// MAIN INPUT COMPONENT
// ============================================

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, CombinedInputProps>(
  ({
    label, helperText, error, success, size = 'md', variant = 'default', leftIcon, rightIcon,
    required = false, showRequiredIndicator = true, loading = false, fullWidth = true,
    className, labelClassName, containerClassName, showCharacterCount = false, maxLength,
    clearable = false, onClear, autoResize = false, disabled, value, onChange, placeholder,
    ...props
  }, ref) => {
    const inputId = useId();
    const [showPassword, setShowPassword] = useState(false);
    // ✅ CORRECCIÓN: Restaurar el estado interno para componentes no controlados
    const [internalValue, setInternalValue] = useState(value || '');

    const type = 'type' in props ? props.type : 'text';
    const isTextArea = 'variant' in props && props.variant === 'textarea';
    const textAreaProps = isTextArea ? props as TextAreaProps : null;

    // ✅ CORRECCIÓN: Restaurar lógica para manejar estado controlado vs. no controlado
    const currentValue = value ?? internalValue;
    const isControlled = value !== undefined;

    const actualType = type === 'password' && showPassword ? 'text' : type;
    const shouldShowPasswordToggle = type === 'password' && ('showPasswordToggle' in props ? props.showPasswordToggle : true);

    const finalLeftIcon = leftIcon || getDefaultIcon(type || '');
    const hasLeftIcon = !!finalLeftIcon;
    const hasRightIcon = !!rightIcon || shouldShowPasswordToggle || clearable || loading;
    const inputState = error ? 'error' : success ? 'success' : disabled ? 'disabled' : 'normal';

    // Icon Sizing
    const iconContainerSizes = { sm: 'w-8', md: 'w-10 sm:w-11', lg: 'w-12' };
    const iconSizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };
    
    // ✅ CORRECCIÓN: Restaurar la lógica completa de handleChange
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      // El 'onChange' que viene de las props de un input SIEMPRE es de este tipo.
      // Los componentes especializados deben adaptarse a esto.
      (onChange as React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>)?.(e);
    };

    // ✅ CORRECCIÓN: Restaurar la lógica completa de handleClear
    const handleClear = () => {
      if (!isControlled) {
        setInternalValue('');
      }
      onClear?.();

      if (isControlled && onChange) {
        const syntheticEvent = {
          target: { value: '' },
          currentTarget: { value: '' },
        } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
        (onChange as React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>)?.(syntheticEvent);
      }
    };

    const handleTextAreaResize = (textarea: HTMLTextAreaElement) => {
        if (autoResize && isTextArea) {
          textarea.style.height = 'auto';
          const scrollHeight = textarea.scrollHeight;
          const minHeight = (textAreaProps?.minRows || 3) * 24;
          const maxHeight = textAreaProps?.maxRows ? textAreaProps.maxRows * 24 : 200;
          textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
        }
    };

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className={cn('block text-sm font-medium text-app-gray-300', required && showRequiredIndicator && "after:content-['*'] after:text-red-400 after:ml-1", error && 'text-red-400', success && 'text-green-400', labelClassName)}>
            {label}
          </label>
        )}

        <div className="relative">
            {hasLeftIcon && (
              <div className={cn(
                'absolute left-0 top-0 h-full flex items-center justify-center text-app-gray-400', 
                // ✅ CORRECCIÓN: Usar 'md' si size es nulo/undefined
                iconContainerSizes[size || 'md'], 
                error && 'text-red-400', 
                success && 'text-green-400'
              )}>
                {React.cloneElement(finalLeftIcon as React.ReactElement, { 
                  className: cn(
                    // ✅ CORRECCIÓN: Usar 'md' si size es nulo/undefined
                    iconSizes[size || 'md'], 
                    (finalLeftIcon as any)?.props?.className
                  ) 
                })}
              </div>
            )}

          {isTextArea ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={inputId}
              value={currentValue}
              onChange={handleChange}
              disabled={disabled || loading}
              placeholder={placeholder}
              maxLength={maxLength}
              rows={textAreaProps?.minRows || 3}
              className={cn(
                inputVariants({ variant: 'default', inputSize: size, hasLeftIcon, hasRightIcon, state: inputState }), 
                'resize-none', 
                autoResize && 'overflow-hidden', 
                className
              )}
              onInput={(e) => handleTextAreaResize(e.currentTarget)}
              {...textAreaProps}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              id={inputId}
              type={actualType}
              value={currentValue}
              onChange={handleChange}
              disabled={disabled || loading}
              placeholder={placeholder}
              maxLength={maxLength}
              className={cn(
                inputVariants({ variant: 'default', inputSize: size, hasLeftIcon, hasRightIcon, state: inputState }), 
                'resize-none', 
                autoResize && 'overflow-hidden', 
                className
              )}
              {...(props as HTMLInputProps)}
            />
          )}

          {hasRightIcon && (
            <div className={cn('absolute right-0 top-0 h-full flex items-center justify-center space-x-1 pr-3', error && 'text-red-400', success && 'text-green-400')}>
              {loading && <div className="animate-spin"><div className="w-4 h-4 border-2 border-app-gray-400 border-t-transparent rounded-full" /></div>}
              {clearable && currentValue && !loading && (
                <button type="button" onClick={handleClear} className="text-app-gray-400 hover:text-white transition-colors duration-200 p-1" tabIndex={-1}><X className="h-4 w-4" /></button>
              )}
              {shouldShowPasswordToggle && !loading && (
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-app-gray-400 hover:text-white transition-colors duration-200 p-1" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
              {rightIcon && !loading && (
                <div className="text-app-gray-400">{React.cloneElement(rightIcon as React.ReactElement, { className: cn('h-4 w-4', (rightIcon as any)?.props?.className) })}</div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            {error && <p className="text-sm text-red-400 flex items-center mt-1"><AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" /><span className="break-words">{error}</span></p>}
            {success && !error && <p className="text-sm text-green-400 flex items-center mt-1"><CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" /><span className="break-words">{success}</span></p>}
            {helperText && !error && !success && <p className="text-sm text-app-gray-500 mt-1">{helperText}</p>}
          </div>
          {showCharacterCount && maxLength && (
            <p className={cn('text-xs mt-1 ml-2 flex-shrink-0', String(currentValue).length > maxLength ? 'text-red-400' : 'text-app-gray-500')}>{`${String(currentValue).length}/${maxLength}`}</p>
          )}
        </div>
      </div>
    );
  }
);

// ============================================
// SPECIALIZED INPUT COMPONENTS
// ============================================

export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ placeholder = 'Buscar...', clearable = true, ...props }, ref) => (
    <Input
      ref={ref}
      type="search"
      placeholder={placeholder}
      clearable={clearable}
      {...props}
    />
  )
);

SearchInput.displayName = 'SearchInput';

export const EmailInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ placeholder = 'correo@ejemplo.com', ...props }, ref) => (
    <Input
      ref={ref}
      type="email"
      placeholder={placeholder}
      {...props}
    />
  )
);

EmailInput.displayName = 'EmailInput';

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ placeholder = '????????', ...props }, ref) => (
    <Input
      ref={ref}
      type="password"
      placeholder={placeholder}
      {...props}
    />
  )
);

PasswordInput.displayName = 'PasswordInput';

export const PhoneInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ placeholder = '+57 300 123 4567', ...props }, ref) => (
    <Input
      ref={ref}
      type="tel"
      placeholder={placeholder}
      {...props}
    />
  )
);

PhoneInput.displayName = 'PhoneInput';

export const TextArea = forwardRef<HTMLTextAreaElement, Omit<TextAreaProps, 'variant'>>(
  ({ placeholder = 'Escribe aquí...', minRows = 3, ...props }, ref) => (
    <Input
      ref={ref}
      variant="textarea"
      placeholder={placeholder}
      minRows={minRows}
      {...props}
    />
  )
);

TextArea.displayName = 'TextArea';

export default Input;
