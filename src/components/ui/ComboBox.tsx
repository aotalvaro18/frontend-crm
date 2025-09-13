// src/components/ui/ComboBox.tsx
// ✅ COMPONENTE UI GENÉRICO - ComboBox reutilizable
// Componente "tonto" - solo recibe props, emite eventos

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

// ============================================
// TYPES
// ============================================

export interface ComboBoxOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
  isAction?: boolean;
}

export interface ComboBoxProps {
  // Valor y opciones
  value?: string | number | null;
  options: ComboBoxOption[];
  onValueChange: (value: string | number | null) => void;
  
  // Input behavior
  searchValue?: string;
  onSearchChange: (search: string) => void;
  
  // Placeholder y estados
  placeholder?: string;
  searchPlaceholder?: string;
  showSearchIcon?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  
  // Estados
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  
  // Personalización
  allowClear?: boolean;
  allowCustomValue?: boolean;
  
  // Callbacks adicionales
  onFocus?: () => void;
  onBlur?: () => void;
  onCreate?: () => void;
  createLabel?: string;
  
  // Styling
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  
  // Accessibility
  id?: string;
  name?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// ============================================
// HOOKS
// ============================================

function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, handler, enabled]);
}

// ============================================
// MAIN COMPONENT
// ============================================

export const ComboBox: React.FC<ComboBoxProps> = ({
  value,
  options,
  onValueChange,
  searchValue = '',
  onSearchChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder,
  showSearchIcon,
  emptyMessage = 'No se encontraron opciones',
  loadingMessage = 'Cargando...',
  loading = false,
  disabled = false,
  error,
  allowClear = true,
  allowCustomValue = false,
  onFocus,
  onBlur,
  onCreate,
  createLabel = '+ Crear nuevo',
  className,
  inputClassName,
  dropdownClassName,
  id,
  name,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption?.label || searchValue;
  
  const filteredOptions = options.filter(option => 
    !option.disabled && 
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const showCreateOption = onCreate && searchValue && !selectedOption && allowCustomValue;
  const totalOptions = filteredOptions.length + (showCreateOption ? 1 : 0);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onSearchChange(newValue);
    
    if (!isOpen) setIsOpen(true);
    setFocusedIndex(-1);
  }, [onSearchChange, isOpen]);

  const handleInputFocus = useCallback(() => {
    setIsOpen(true);
    onFocus?.();
  }, [onFocus]);

  const handleInputBlur = useCallback(() => {
    // Delay para permitir click en opciones
    setTimeout(() => {
      onBlur?.();
    }, 150);
  }, [onBlur]);

  const handleOptionSelect = useCallback((optionValue: string | number) => {
    onValueChange(optionValue);
    setIsOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  }, [onValueChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(null);
    onSearchChange('');
    inputRef.current?.focus();
  }, [onValueChange, onSearchChange]);

  const handleCreate = useCallback(() => {
    onCreate?.();
    setIsOpen(false);
  }, [onCreate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < totalOptions - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : totalOptions - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0) {
          if (focusedIndex === filteredOptions.length && showCreateOption) {
            handleCreate();
          } else {
            const option = filteredOptions[focusedIndex];
            if (option) handleOptionSelect(option.value);
          }
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  }, [isOpen, focusedIndex, totalOptions, filteredOptions, showCreateOption, handleOptionSelect, handleCreate]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full', className)}
    >
      {/* Input */}
      <div className="relative">
        {/* V--- INICIO DEL CAMBIO QUIRÚRGICO ---V */}
        {/* 1. Renderizar el ícono de búsqueda si showSearchIcon es true */}
        {showSearchIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="h-4 w-4 text-app-gray-400" />
          </div>
        )}
        {/* ^--- FIN DEL CAMBIO QUIRÚRGICO ---^ */}

        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={searchPlaceholder || placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          className={cn(
            'w-full px-3 py-2 pr-10 text-left bg-app-dark-700 border border-app-dark-600 rounded-md text-app-gray-100 placeholder-app-gray-500',
            'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            // V--- INICIO DEL CAMBIO QUIRÚRGICO ---V
            // 2. Añadir padding a la izquierda solo si el ícono está visible
            showSearchIcon && 'pl-10',
            // ^--- FIN DEL CAMBIO QUIRÚRGICO ---^
            inputClassName
          )}
        />

        {/* Clear Button */}
        {allowClear && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-app-gray-400 hover:text-app-gray-300 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Dropdown Arrow */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-app-gray-400 hover:text-app-gray-300 transition-colors disabled:cursor-not-allowed"
        >
          <ChevronDown className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={cn(
          'absolute z-50 w-full mt-1 bg-app-dark-800 border border-app-dark-600 rounded-md shadow-lg max-h-60 overflow-auto',
          dropdownClassName
        )}>
          <ul
            ref={listRef}
            role="listbox"
            className="py-1"
          >
            {loading ? (
              <li className="px-3 py-2 text-app-gray-400 text-sm">
                {loadingMessage}
              </li>
            ) : filteredOptions.length === 0 && !showCreateOption ? (
              <li className="px-3 py-2 text-app-gray-400 text-sm">
                {emptyMessage}
              </li>
            ) : (
              <>
                {/* Options */}
                {filteredOptions.map((option, index) => (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={option.value === value && !option.isAction}
                    className={cn(
                      'px-3 py-2 cursor-pointer flex items-center justify-between',
                      'hover:bg-app-dark-700 transition-colors',
                      focusedIndex === index && 'bg-app-dark-700'
                      // El color del texto se maneja dentro para más control
                    )}
                    onClick={() => handleOptionSelect(option.value)}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      {/* 1. Renderizar el Ícono si existe */}
                      {option.icon && (
                        <div className={cn(
                          "mr-3 flex-shrink-0",
                          option.isAction ? "text-blue-400" : "text-app-gray-400"
                        )}>
                          {option.icon}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {/* 2. Aplicar estilo especial al Label si es una acción */}
                        <div className={cn(
                          "text-sm font-medium",
                          option.isAction ? "text-blue-400" : "text-app-gray-100",
                          option.value === value && !option.isAction && "text-primary-400"
                        )}>
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-xs text-app-gray-400 mt-1">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 3. Mostrar el check solo si es una selección activa Y NO es una acción */}
                    {option.value === value && !option.isAction && (
                      <Check className="h-4 w-4 text-primary-400 ml-2 flex-shrink-0" />
                    )}
                  </li>
                ))}

                {/* Create Option */}
                {showCreateOption && (
                  <li
                    role="option"
                    className={cn(
                      'px-3 py-2 cursor-pointer border-t border-app-dark-600',
                      'hover:bg-app-dark-700 transition-colors text-primary-400',
                      focusedIndex === filteredOptions.length && 'bg-app-dark-700'
                    )}
                    onClick={handleCreate}
                  >
                    <div className="text-sm font-medium">
                      {createLabel}
                    </div>
                    <div className="text-xs text-app-gray-400 mt-1">
                      Crear "{searchValue}"
                    </div>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};