// src/components/ui/SearchInput.tsx
// ✅ SEARCH INPUT REFACTORIZADO - SIGUIENDO GUÍA ARQUITECTÓNICA EKLESA
// Principio: "No reinventar" - SearchInput es ESPECIALIZACIÓN de Input.tsx
// Solo añade funcionalidades específicas de búsqueda, reutiliza Input completamente

import React, { forwardRef, useState, useRef, useEffect, useImperativeHandle } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

// ============================================
// REUTILIZACIÓN TOTAL - Import Input base
// ============================================

import { Input, type InputProps } from './Input';

// ============================================
// SEARCH-SPECIFIC TYPES (Solo lo que Input no tiene)
// ============================================

interface SearchSpecificProps {
  // Search functionality
  onSearch?: (value: string) => void;
  debounceMs?: number;
  minSearchLength?: number;
  
  // Suggestions (future autocomplete)
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  showSuggestions?: boolean;
  
  // Search-specific styling
  hideSearchIcon?: boolean;
}

// ✅ SearchInput extiende Input.tsx - CERO duplicación
export interface SearchInputProps 
  extends Omit<InputProps, 'type' | 'leftIcon'>, 
          SearchSpecificProps {}

export interface SearchInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  search: (value?: string) => void;
}

// ============================================
// SEARCH INPUT COMPONENT (Solo lógica específica)
// ============================================

export const SearchInput = forwardRef<SearchInputRef, SearchInputProps>(
  ({
    // Search-specific props
    onSearch,
    debounceMs = 300,
    minSearchLength = 0,
    suggestions = [],
    onSuggestionSelect,
    showSuggestions: controlledShowSuggestions,
    hideSearchIcon = false,
    
    // Input props (pasados directamente a Input)
    placeholder = 'Buscar...',
    clearable = true,
    value,
    onChange,
    onKeyDown,
    onFocus,
    onBlur,
    className,
    
    ...inputProps
  }, ref) => {
    
    // ============================================
    // SEARCH-SPECIFIC STATE (Solo lo necesario)
    // ============================================
    
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // ============================================
    // SEARCH-SPECIFIC LOGIC (Solo debounce y suggestions)
    // ============================================

    // Debounced search effect
    useEffect(() => {
      if (!onSearch || !value) return;
      
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      if (typeof value === 'string' && value.length >= minSearchLength) {
        setIsSearching(true);
        
        debounceRef.current = setTimeout(() => {
          onSearch(value);
          setIsSearching(false);
        }, debounceMs);
      }
      
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, [value, onSearch, debounceMs, minSearchLength]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    // ============================================
    // SUGGESTIONS LOGIC (Solo para dropdown)
    // ============================================

    const filteredSuggestions = React.useMemo(() => {
      if (!suggestions.length || !value || typeof value !== 'string') return [];
      
      return suggestions
        .filter(suggestion =>
          suggestion.toLowerCase().includes(value.toLowerCase()) &&
          suggestion.toLowerCase() !== value.toLowerCase()
        )
        .slice(0, 5); // Limit to 5 suggestions
    }, [suggestions, value]);

    const shouldShowSuggestions = controlledShowSuggestions ?? 
      (showSuggestions && filteredSuggestions.length > 0);

    // ============================================
    // ENHANCED HANDLERS (Solo para funcionalidad de búsqueda)
    // ============================================

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Enter = trigger immediate search
      if (e.key === 'Enter') {
        e.preventDefault();
        if (value && typeof value === 'string') {
          // Cancel debounce and search immediately
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }
          onSearch?.(value);
          setIsSearching(false);
        }
        setShowSuggestions(false);
      }
      
      // Escape = hide suggestions
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
      
      // Forward to Input
      onKeyDown?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (filteredSuggestions.length > 0) {
        setShowSuggestions(true);
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Delay hiding to allow suggestion clicks
      setTimeout(() => {
        if (!suggestionsRef.current?.contains(document.activeElement)) {
          setShowSuggestions(false);
        }
      }, 150);
      onBlur?.(e);
    };

    const handleSuggestionSelect = (suggestion: string) => {
      // Update value through Input's onChange
      const syntheticEvent = {
        target: { value: suggestion },
        currentTarget: { value: suggestion },
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange?.(syntheticEvent);
      onSuggestionSelect?.(suggestion);
      setShowSuggestions(false);
      inputRef.current?.focus();
    };

    // ============================================
    // REF IMPERATIVES (Solo para funcionalidad de búsqueda)
    // ============================================

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        // Use Input's clear functionality
        const clearEvent = {
          target: { value: '' },
          currentTarget: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(clearEvent);
        setShowSuggestions(false);
      },
      search: (searchValue?: string) => {
        const valueToSearch = searchValue || (typeof value === 'string' ? value : '');
        if (valueToSearch && onSearch) {
          onSearch(valueToSearch);
        }
      },
    }));

    // ============================================
    // RENDER (Wrapper alrededor de Input + Suggestions)
    // ============================================

    return (
      <div className="relative w-full">
        {/* ✅ REUTILIZACIÓN TOTAL de Input.tsx */}
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          clearable={clearable}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          // ✅ Solo agregamos search icon si no está oculto
          leftIcon={hideSearchIcon ? undefined : (
            isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )
          )}
          className={className}
          {...inputProps}
        />

        {/* ✅ SOLO agregamos dropdown de suggestions */}
        {shouldShowSuggestions && (
          <div 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1"
          >
            <div className="bg-app-dark-800 border border-app-dark-600 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm',
                    'text-app-gray-200 hover:bg-app-dark-700',
                    'transition-colors duration-150',
                    'focus:outline-none focus:bg-app-dark-700'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <Search className="h-3 w-3 text-app-gray-500 flex-shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

// ============================================
// SPECIALIZED SEARCH COMPONENTS (Wrappers simples)
// ============================================

/**
 * Quick Search - Para búsquedas simples
 */
export const QuickSearch = forwardRef<SearchInputRef, {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
}>((props, ref) => (
  <SearchInput
    ref={ref}
    size="sm"
    variant="filled"
    debounceMs={150}
    {...props}
  />
));

QuickSearch.displayName = 'QuickSearch';

/**
 * Global Search - Para búsqueda global con sugerencias
 */
export const GlobalSearch = forwardRef<SearchInputRef, {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: (value: string) => void;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}>(({ loading, ...props }, ref) => (
  <SearchInput
    ref={ref}
    size="md"
    variant="default"
    debounceMs={300}
    minSearchLength={2}
    leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
    hideSearchIcon={loading}
    placeholder="Buscar en toda la aplicación..."
    {...props}
  />
));

GlobalSearch.displayName = 'GlobalSearch';

/**
 * Table Search - Para filtrado de tablas
 */
export const TableSearch = forwardRef<SearchInputRef, {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
}>(({ placeholder = "Filtrar resultados...", ...props }, ref) => (
  <SearchInput
    ref={ref}
    size="sm"
    variant="outline"
    debounceMs={200}
    minSearchLength={1}
    placeholder={placeholder}
    {...props}
  />
));

TableSearch.displayName = 'TableSearch';

/**
 * Instant Search - Para búsqueda instantánea
 */
export const InstantSearch = forwardRef<SearchInputRef, {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: (value: string) => void;
  debounceMs?: number;
  minLength?: number;
  placeholder?: string;
  className?: string;
}>(({ 
  debounceMs = 500,
  minLength = 1,
  placeholder = "Búsqueda instantánea...",
  ...props 
}, ref) => (
  <SearchInput
    ref={ref}
    size="md"
    variant="filled"
    debounceMs={debounceMs}
    minSearchLength={minLength}
    placeholder={placeholder}
    {...props}
  />
));

InstantSearch.displayName = 'InstantSearch';

export default SearchInput;