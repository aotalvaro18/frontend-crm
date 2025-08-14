// src/components/ui/Select.tsx
// ✅ SELECT ENTERPRISE COMPONENT - 100% ACOPLADO
// Mobile-first + TypeScript strict + Variants system + Multi-select support

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

// ============================================
// SELECT VARIANTS (Alineado con Button.tsx, Input.tsx)
// ============================================

const selectVariants = cva(
  'flex w-full items-center justify-between rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-app-accent-500 focus:ring-offset-2 focus:ring-offset-app-dark-900 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-app-dark-600 bg-app-dark-700 text-app-gray-100 hover:border-app-dark-500',
        outline: 'border-app-dark-500 bg-app-dark-800 text-app-gray-100 hover:border-app-dark-400',
        filled: 'border-transparent bg-app-dark-600 text-app-gray-100 hover:bg-app-dark-500',
        ghost: 'border-transparent bg-transparent text-app-gray-100 hover:bg-app-dark-700',
      },
      
      size: {
        sm: 'h-8 px-3 py-1.5 text-xs',
        md: 'h-10 px-3 py-2 text-sm',
        lg: 'h-12 px-4 py-3 text-base',
        xl: 'h-14 px-5 py-3.5 text-lg',
      },
      
      state: {
        default: '',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
        success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
        warning: 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500',
      },
      
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
      fullWidth: true,
    },
  }
);

const dropdownVariants = cva(
  'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-app-dark-600 bg-app-dark-800 py-1 shadow-lg',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg',
      },
    },
  }
);

const optionVariants = cva(
  'relative cursor-pointer px-3 py-2 transition-colors duration-150',
  {
    variants: {
      state: {
        default: 'text-app-gray-200 hover:bg-app-dark-700',
        selected: 'bg-app-accent-500 text-white',
        highlighted: 'bg-app-dark-600 text-app-gray-100',
        disabled: 'cursor-not-allowed opacity-50 text-app-gray-500',
      },
      
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-3 text-base',
        xl: 'px-5 py-3 text-lg',
      },
    },
    
    defaultVariants: {
      state: 'default',
      size: 'md',
    },
  }
);

// ============================================
// TYPES
// ============================================

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
  group?: string;
}

export interface SelectProps extends Omit<
  // Heredamos de un <select> nativo...
  React.SelectHTMLAttributes<HTMLSelectElement>, 
  // ...pero OMITIMOS estas 3 props que vamos a redefinir nosotros:
  'size' | 'value' | 'onChange' | 'defaultValue' 
> {
  // --- Styling (Derivadas de cva) ---
  variant?: VariantProps<typeof selectVariants>['variant'];
  size?: VariantProps<typeof selectVariants>['size']; // Nuestro 'size' de estilo
  state?: VariantProps<typeof selectVariants>['state'];
  fullWidth?: boolean;
  
  // --- Data & State ---
  options: SelectOption[];
  // ✅ CORRECCIÓN: Nuestro 'value' que acepta un array para el caso 'multiple'
  value?: string | number | (string | number)[];
  defaultValue?: string | number | (string | number)[];
  
  // --- Behavior ---
  // 'multiple' se hereda directamente de React.SelectHTMLAttributes, no necesitamos redefinirlo
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  closeOnSelect?: boolean;
  
  // --- Labels & Messages ---
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  error?: string;
  helperText?: string;
  
  // --- Callbacks (con nombres semánticos) ---
  // ✅ CORRECCIÓN: Usamos onValueChange para nuestra lógica, liberando onChange para el uso nativo
  onValueChange?: (value: string | number | (string | number)[] | undefined) => void;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  
  // --- Layout ---
  dropdownAlign?: 'start' | 'end';
  maxHeight?: number;
  
  // --- Advanced Rendering ---
  renderOption?: (option: SelectOption, isSelected: boolean) => React.ReactNode;
  renderValue?: (value: string | number | (string | number)[], options: SelectOption[]) => React.ReactNode;
}

// ============================================
// MAIN SELECT COMPONENT
// ============================================

export const Select = forwardRef<HTMLDivElement, SelectProps>(({
  // Styling
  variant = 'default',
  size = 'md',
  state = 'default',
  fullWidth = true,
  className,
  
  // Options & Values
  options = [],
  value,
  defaultValue,
  
  // Behavior
  multiple = false,
  searchable = false,
  clearable = false,
  loading = false,
  closeOnSelect = true,
  
  // Labels
  label,
  placeholder = 'Seleccionar...',
  emptyMessage = 'No hay opciones disponibles',
  loadingMessage = 'Cargando...',
  error,
  helperText,
  
  // Callbacks
  onValueChange,
  onSearch,
  onClear,
  
  // Layout
  dropdownAlign = 'start',
  maxHeight = 240,
  
  // Advanced
  renderOption,
  renderValue,
  
  // Native props
  disabled,
  required,
  id,
  name,
  ...props
}, ref) => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [internalValue, setInternalValue] = useState<string | number | (string | number)[]>(() => {
    if (value !== undefined) return value;
    if (defaultValue !== undefined) return defaultValue;
    return multiple ? [] : '';
  });
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  
  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  const currentValue = value !== undefined ? value : internalValue;
  const finalState = error ? 'error' : state;
  
  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;
  
  const selectedOptions = Array.isArray(currentValue)
    ? options.filter(option => currentValue.includes(option.value))
    : options.filter(option => option.value === currentValue);
  
  const hasValue = Array.isArray(currentValue) 
    ? currentValue.length > 0 
    : currentValue !== '' && currentValue !== null && currentValue !== undefined;
  
  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen && searchable) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  };
  
  const handleOptionSelect = (option: SelectOption) => {
    if (option.disabled) return;
    
    let newValue: string | number | (string | number)[];
    
    if (multiple) {
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      if (currentArray.includes(option.value)) {
        newValue = currentArray.filter(v => v !== option.value);
      } else {
        newValue = [...currentArray, option.value];
      }
    } else {
      newValue = option.value;
      if (closeOnSelect) {
        setIsOpen(false);
      }
    }
    
    if (value === undefined) {
      setInternalValue(newValue);
    }
    
    onValueChange?.(newValue);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = multiple ? [] : '';
    
    if (value === undefined) {
      setInternalValue(newValue);
    }
    
    onValueChange?.(newValue);
    onClear?.();
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setHighlightedIndex(-1);
    onSearch?.(query);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        } else if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          e.preventDefault();
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
        
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery('');
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
    }
  };
  
  // ============================================
  // EFFECTS
  // ============================================
  
  // Close dropdown on outside click
  useEffect(() => {
    // 1. La función que maneja el evento se mantiene igual.
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
  
    // 2. Añadimos el listener INCONDICIONALMENTE.
    document.addEventListener('mousedown', handleClickOutside);
  
    // 3. Devolvemos la función de limpieza INCONDICIONALMENTE.
    // React se encargará de llamarla solo cuando sea necesario (al desmontar).
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // ✅ CORRECCIÓN: El array de dependencias debe estar vacío.
          // Este efecto solo debe correr una vez (al montar) y limpiarse una vez (al desmontar).
  
  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredOptions]);
  
  // ============================================
  // RENDER HELPERS
  // ============================================
  
  const renderSelectedValue = () => {
    if (loading) {
      return (
        <span className="flex items-center">
          <LoadingSpinner size="xs" className="mr-2" />
          {loadingMessage}
        </span>
      );
    }
    
    if (!hasValue) {
      return (
        <span className="text-app-gray-500">
          {placeholder}
        </span>
      );
    }
    
    if (renderValue) {
      return renderValue(currentValue, selectedOptions);
    }
    
    if (multiple && Array.isArray(currentValue)) {
      if (selectedOptions.length === 0) {
        return <span className="text-app-gray-500">{placeholder}</span>;
      }
      
      if (selectedOptions.length === 1) {
        return selectedOptions[0].label;
      }
      
      return `${selectedOptions.length} seleccionados`;
    }
    
    return selectedOptions[0]?.label || placeholder;
  };
  
  const renderOptionContent = (option: SelectOption, isSelected: boolean) => {
    if (renderOption) {
      return renderOption(option, isSelected);
    }
    
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          {option.icon && (
            <span className="mr-2 flex-shrink-0">
              {option.icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="truncate">{option.label}</div>
            {option.description && (
              <div className="text-xs text-app-gray-400 truncate mt-0.5">
                {option.description}
              </div>
            )}
          </div>
        </div>
        {isSelected && (
          <Check className="h-4 w-4 flex-shrink-0 ml-2" />
        )}
      </div>
    );
  };
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className={cn('relative', fullWidth && 'w-full')} ref={containerRef}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={id}
          className={cn(
            'block text-sm font-medium mb-1.5',
            finalState === 'error' ? 'text-red-400' : 'text-app-gray-300',
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}
        >
          {label}
        </label>
      )}
      
      {/* Select Trigger */}
      <div
        ref={ref}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-help` : undefined}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          selectVariants({ variant, size, state: finalState, fullWidth }),
          isOpen && 'ring-2 ring-app-accent-500',
          className
        )}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <div className="flex-1 min-w-0 mr-2">
          {renderSelectedValue()}
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Clear Button */}
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center w-5 h-5 rounded hover:bg-app-dark-600 transition-colors"
              tabIndex={-1}
            >
              <X className="h-3 w-3" />
            </button>
          )}
          
          {/* Dropdown Icon */}
          <ChevronDown 
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isOpen && 'rotate-180'
            )} 
          />
        </div>
      </div>
      
      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            dropdownVariants({ size }),
            dropdownAlign === 'end' && 'right-0'
          )}
          style={{ maxHeight }}
        >
          {/* Search Input */}
          {searchable && (
            <div className="sticky top-0 bg-app-dark-800 border-b border-app-dark-600 p-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-app-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-app-dark-700 border border-app-dark-600 rounded focus:outline-none focus:border-app-accent-500 text-app-gray-100"
                />
              </div>
            </div>
          )}
          
          {/* Options List */}
          <div role="listbox" aria-multiselectable={multiple}>
            {loading ? (
              <div className="px-3 py-8 text-center">
                <LoadingSpinner size="sm" className="mx-auto mb-2" />
                <div className="text-sm text-app-gray-400">{loadingMessage}</div>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-app-gray-400">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = Array.isArray(currentValue)
                  ? currentValue.includes(option.value)
                  : currentValue === option.value;
                const isHighlighted = index === highlightedIndex;
                
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      optionVariants({ 
                        size,
                        state: option.disabled 
                          ? 'disabled' 
                          : isSelected 
                            ? 'selected' 
                            : isHighlighted 
                              ? 'highlighted' 
                              : 'default'
                      })
                    )}
                    onClick={() => !option.disabled && handleOptionSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {renderOptionContent(option, isSelected)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-400">
          {error}
        </p>
      )}
      
      {/* Helper Text */}
      {helperText && !error && (
        <p id={`${id}-help`} className="mt-1.5 text-sm text-app-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// ============================================
// SPECIALIZED SELECT COMPONENTS
// ============================================

/**
 * Simple Select - Para casos básicos
 */
export const SimpleSelect = forwardRef<HTMLDivElement, Omit<SelectProps, 'multiple' | 'searchable' | 'clearable'>>(
  (props, ref) => (
    <Select
      ref={ref}
      multiple={false}
      searchable={false}
      clearable={false}
      closeOnSelect={true}
      {...props}
    />
  )
);

SimpleSelect.displayName = 'SimpleSelect';

/**
 * Multi Select - Para selección múltiple
 */
export const MultiSelect = forwardRef<HTMLDivElement, Omit<SelectProps, 'multiple'>>(
  (props, ref) => (
    <Select
      ref={ref}
      multiple={true}
      clearable={true}
      closeOnSelect={false}
      {...props}
    />
  )
);

MultiSelect.displayName = 'MultiSelect';

/**
 * Searchable Select - Para listas largas
 */
export const SearchableSelect = forwardRef<HTMLDivElement, Omit<SelectProps, 'searchable'>>(
  (props, ref) => (
    <Select
      ref={ref}
      searchable={true}
      clearable={true}
      {...props}
    />
  )
);

SearchableSelect.displayName = 'SearchableSelect';

/**
 * Status Select - Para ContactStatus específicamente  
 */
export const ContactStatusSelect = forwardRef<HTMLDivElement, Omit<SelectProps, 'options'>>(
  (props, ref) => {
    const statusOptions: SelectOption[] = [
      { value: 'ACTIVE', label: 'Activo', description: 'Contacto activo en el sistema' },
      { value: 'INACTIVE', label: 'Inactivo', description: 'Contacto temporalmente inactivo' },
      { value: 'DO_NOT_CONTACT', label: 'No Contactar', description: 'No enviar comunicaciones' },
      { value: 'DUPLICATE', label: 'Duplicado', description: 'Registro duplicado' },
      { value: 'ARCHIVED', label: 'Archivado', description: 'Contacto archivado' },
    ];
    
    return (
      <Select
        ref={ref}
        options={statusOptions}
        placeholder="Seleccionar estado..."
        {...props}
      />
    );
  }
);

ContactStatusSelect.displayName = 'ContactStatusSelect';

/**
 * Source Select - Para ContactSource específicamente
 */
export const ContactSourceSelect = forwardRef<HTMLDivElement, Omit<SelectProps, 'options'>>(
  (props, ref) => {
    const sourceOptions: SelectOption[] = [
      { value: 'DIRECT_REGISTRATION', label: 'Registro Directo', description: 'Registro desde formulario web' },
      { value: 'ADMIN_CREATED', label: 'Creado por Admin', description: 'Creado manualmente por administrador' },
      { value: 'IMPORT', label: 'Importación', description: 'Importado desde archivo' },
      { value: 'API', label: 'API', description: 'Creado vía API externa' },
      { value: 'MIGRATION', label: 'Migración', description: 'Migrado desde sistema anterior' },
    ];
    
    return (
      <Select
        ref={ref}
        options={sourceOptions}
        placeholder="Seleccionar origen..."
        {...props}
      />
    );
  }
);

ContactSourceSelect.displayName = 'ContactSourceSelect';

export default Select;
