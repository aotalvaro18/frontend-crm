 // src/components/ui/Input.tsx
// Input component enterprise mobile-first siguiendo la guía arquitectónica
// Manejo completo de estados, validación y accesibilidad

import React, { forwardRef, useState, useId } from 'react';
import { 
  Eye, EyeOff, AlertCircle, CheckCircle, Search, 
  X, Calendar, Clock, Phone, Mail, User, Lock,
  Globe, MapPin, Hash, DollarSign
} from 'lucide-react';
import { cn } from '@/utils/cn';

// ============================================
// TYPES
// ============================================

interface BaseInputProps {
  /** Input label */
  label?: string;
  /** Help text shown below input */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Visual input size */
  size?: 'sm' | 'md' | 'lg';
  /** Input variant styling */
  variant?: 'default' | 'filled' | 'underlined';
  /** Icon to display on the left */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right */
  rightIcon?: React.ReactNode;
  /** Whether input is required */
  required?: boolean;
  /** Whether to show required asterisk */
  showRequiredIndicator?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Whether input spans full width */
  fullWidth?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Label CSS classes */
  labelClassName?: string;
  /** Container CSS classes */
  containerClassName?: string;
  /** Whether to show character count */
  showCharacterCount?: boolean;
  /** Maximum character length */
  maxLength?: number;
  /** Clearable input with X button */
  clearable?: boolean;
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Auto-resize for textarea variant */
  autoResize?: boolean;
}

// Standard HTML input props
type HTMLInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  keyof BaseInputProps
>;

// Textarea specific props
type HTMLTextAreaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  keyof BaseInputProps
>;

// ============================================
// INPUT VARIANTS
// ============================================

interface InputProps extends BaseInputProps, HTMLInputProps {
  /** Input type - affects icon and validation */
  type?: 
    | 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' 
    | 'search' | 'date' | 'time' | 'datetime-local';
  /** Whether to show/hide password toggle */
  showPasswordToggle?: boolean;
}

interface TextAreaProps extends BaseInputProps, HTMLTextAreaProps {
  /** Force textarea mode */
  variant: 'textarea';
  /** Minimum rows for textarea */
  minRows?: number;
  /** Maximum rows for textarea */
  maxRows?: number;
}

type CombinedInputProps = InputProps | TextAreaProps;

// ============================================
// STYLING CONFIGURATIONS
// ============================================

const inputSizes = {
  sm: {
    input: 'px-3 py-2 text-sm',
    withLeftIcon: 'pl-9',
    withRightIcon: 'pr-9',
    icon: 'h-4 w-4',
    iconContainer: 'w-8',
  },
  md: {
    input: 'px-4 py-3 text-sm sm:text-base',
    withLeftIcon: 'pl-10 sm:pl-11',
    withRightIcon: 'pr-10 sm:pr-11',
    icon: 'h-5 w-5',
    iconContainer: 'w-10 sm:w-11',
  },
  lg: {
    input: 'px-4 py-4 text-base',
    withLeftIcon: 'pl-12',
    withRightIcon: 'pr-12',
    icon: 'h-6 w-6',
    iconContainer: 'w-12',
  },
};

const inputVariants = {
  default: {
    base: 'bg-app-dark-700 border border-app-dark-600 rounded-lg focus:ring-2 focus:ring-app-accent-500 focus:border-transparent',
    normal: 'text-white placeholder-app-gray-400 hover:border-app-dark-500',
    error: 'border-red-500 focus:ring-red-500 focus:border-red-500',
    success: 'border-green-500 focus:ring-green-500 focus:border-green-500',
    disabled: 'bg-app-dark-800 border-app-dark-700 text-app-gray-500 cursor-not-allowed',
  },
  filled: {
    base: 'bg-app-dark-600 border-0 rounded-lg focus:ring-2 focus:ring-app-accent-500',
    normal: 'text-white placeholder-app-gray-400 hover:bg-app-dark-500',
    error: 'bg-red-900/20 focus:ring-red-500',
    success: 'bg-green-900/20 focus:ring-green-500',
    disabled: 'bg-app-dark-800 text-app-gray-500 cursor-not-allowed',
  },
  underlined: {
    base: 'bg-transparent border-0 border-b-2 border-app-dark-600 rounded-none focus:ring-0 focus:border-app-accent-500',
    normal: 'text-white placeholder-app-gray-400 hover:border-app-dark-500',
    error: 'border-red-500 focus:border-red-500',
    success: 'border-green-500 focus:border-green-500',
    disabled: 'border-app-dark-700 text-app-gray-500 cursor-not-allowed',
  },
};

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

export const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  CombinedInputProps
>(({
  label,
  helperText,
  error,
  success,
  size = 'md',
  variant = 'default',
  leftIcon,
  rightIcon,
  required = false,
  showRequiredIndicator = true,
  loading = false,
  fullWidth = true,
  className,
  labelClassName,
  containerClassName,
  showCharacterCount = false,
  maxLength,
  clearable = false,
  onClear,
  autoResize = false,
  disabled,
  type = 'text',
  value,
  onChange,
  placeholder,
  ...props
}, ref) => {
  const inputId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  
  // Determine if this is a textarea
  const isTextArea = 'variant' in props && props.variant === 'textarea';
  const textAreaProps = isTextArea ? props as TextAreaProps : null;

  // Handle controlled/uncontrolled state
  const currentValue = value ?? internalValue;
  const isControlled = value !== undefined;

  // Handle password visibility
  const actualType = type === 'password' && showPassword ? 'text' : type;
  const shouldShowPasswordToggle = 
    type === 'password' && 
    ('showPasswordToggle' in props ? props.showPasswordToggle : true);

  // Determine icons
  const finalLeftIcon = leftIcon || getDefaultIcon(type);
  const hasLeftIcon = !!finalLeftIcon;
  const hasRightIcon = !!rightIcon || shouldShowPasswordToggle || clearable || loading;

  // Get style configurations
  const sizeConfig = inputSizes[size];
  const variantConfig = inputVariants[variant as keyof typeof inputVariants];

  // Determine input state
  const inputState = error ? 'error' : success ? 'success' : disabled ? 'disabled' : 'normal';

  // Build input classes
  const inputClasses = cn(
    // Base styles
    variantConfig.base,
    variantConfig[inputState],
    sizeConfig.input,
    
    // Icon spacing
    hasLeftIcon && sizeConfig.withLeftIcon,
    hasRightIcon && sizeConfig.withRightIcon,
    
    // Width
    fullWidth && 'w-full',
    
    // Textarea specific
    isTextArea && 'resize-none',
    isTextArea && autoResize && 'overflow-hidden',
    
    // Transitions
    'transition-all duration-200',
    
    // Custom classes
    className
  );

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    onChange?.(e as any);
  };

  // Handle clear
  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }
    onClear?.();
    
    // Create synthetic event for controlled inputs
    if (isControlled && onChange) {
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
      onChange(syntheticEvent as any);
    }
  };

  // Auto-resize logic for textarea
  const handleTextAreaResize = (textarea: HTMLTextAreaElement) => {
    if (autoResize && isTextArea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const minHeight = (textAreaProps?.minRows || 3) * 24; // Approximate line height
      const maxHeight = textAreaProps?.maxRows ? textAreaProps.maxRows * 24 : 200;
      
      textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }
  };

  // Character count
  const characterCount = String(currentValue).length;
  const isOverLimit = maxLength ? characterCount > maxLength : false;

  return (
    <div className={cn('space-y-2', containerClassName)}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-app-gray-300',
            required && showRequiredIndicator && "after:content-['*'] after:text-red-400 after:ml-1",
            error && 'text-red-400',
            success && 'text-green-400',
            labelClassName
          )}
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {hasLeftIcon && (
          <div className={cn(
            'absolute left-0 top-0 h-full flex items-center justify-center text-app-gray-400',
            sizeConfig.iconContainer,
            error && 'text-red-400',
            success && 'text-green-400'
          )}>
            {React.cloneElement(finalLeftIcon as React.ReactElement, {
              className: cn(sizeConfig.icon, (finalLeftIcon as any)?.props?.className),
            })}
          </div>
        )}

        {/* Input Element */}
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
            className={inputClasses}
            onInput={(e) => handleTextAreaResize(e.currentTarget)}
            {...(textAreaProps || {})}
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
            className={inputClasses}
            {...(props as HTMLInputProps)}
          />
        )}

        {/* Right Icons */}
        {hasRightIcon && (
          <div className={cn(
            'absolute right-0 top-0 h-full flex items-center justify-center space-x-1 pr-3',
            error && 'text-red-400',
            success && 'text-green-400'
          )}>
            {/* Loading Spinner */}
            {loading && (
              <div className="animate-spin">
                <div className="w-4 h-4 border-2 border-app-gray-400 border-t-transparent rounded-full" />
              </div>
            )}

            {/* Clear Button */}
            {clearable && currentValue && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="text-app-gray-400 hover:text-white transition-colors duration-200 p-1"
                tabIndex={-1}
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Password Toggle */}
            {shouldShowPasswordToggle && !loading && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-app-gray-400 hover:text-white transition-colors duration-200 p-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Custom Right Icon */}
            {rightIcon && !loading && (
              <div className="text-app-gray-400">
                {React.cloneElement(rightIcon as React.ReactElement, {
                  className: cn('h-4 w-4', (rightIcon as any)?.props?.className),
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Information */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-400 flex items-center mt-1">
              <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="break-words">{error}</span>
            </p>
          )}

          {/* Success Message */}
          {success && !error && (
            <p className="text-sm text-green-400 flex items-center mt-1">
              <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="break-words">{success}</span>
            </p>
          )}

          {/* Helper Text */}
          {helperText && !error && !success && (
            <p className="text-sm text-app-gray-500 mt-1">
              {helperText}
            </p>
          )}
        </div>

        {/* Character Count */}
        {showCharacterCount && maxLength && (
          <p className={cn(
            'text-xs mt-1 ml-2 flex-shrink-0',
            isOverLimit ? 'text-red-400' : 'text-app-gray-500'
          )}>
            {characterCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

Input.displayName = 'Input';

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
