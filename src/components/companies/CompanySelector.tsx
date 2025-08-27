// src/components/companies/CompanySelector.tsx
// ✅ SELECTOR ESPECÍFICO DE EMPRESAS - Usando ComboBox genérico
// Componente inteligente que maneja la lógica de búsqueda de empresas

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';

// ============================================
// COMPONENTS
// ============================================
import { ComboBox, type ComboBoxOption } from '@/components/ui/ComboBox';
import { FormField } from '@/components/forms/FormField';

// ============================================
// HOOKS & SERVICES
// ============================================
import { companyApi } from '@/services/api/companyApi';
import { useSearchDebounce } from '@/hooks/useDebounce';

// ============================================
// TYPES
// ============================================
import type { CompanyDTO } from '@/types/company.types';

export interface CompanySelectorProps {
  // Valor y cambio
  value?: number | null;
  onValueChange: (value: number | null) => void;
  
  // FormField props
  label?: string;
  name?: string;
  required?: boolean;
  error?: string;
  description?: string;
  
  // ComboBox props
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  
  // Callbacks
  onCreateNew?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  
  // Styling
  className?: string;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// ============================================
// CONSTANTS
// ============================================

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;
const MAX_SUGGESTIONS = 10;

// ============================================
// MAIN COMPONENT
// ============================================

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  value,
  onValueChange,
  label = 'Empresa',
  name = 'companyId',
  required = false,
  error,
  description,
  placeholder = 'Buscar empresa o crear nueva...',
  disabled = false,
  allowClear = true,
  onCreateNew,
  onFocus,
  onBlur,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useSearchDebounce(searchTerm, SEARCH_DEBOUNCE_MS);

  // ============================================
  // EMPRESA SELECCIONADA
  // ============================================
  
  // Query para obtener la empresa seleccionada
  const { data: selectedCompany } = useQuery({
    queryKey: ['company', value],
    queryFn: () => companyApi.getCompanyById(value!),
    enabled: !!value,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // ============================================
  // AUTOCOMPLETE DE EMPRESAS
  // ============================================
  
  // Query para autocompletar empresas
  const { 
    data: suggestions = [], 
    isLoading: isSearching,
    error: searchError 
  } = useQuery({
    queryKey: ['companies', 'autocomplete', debouncedSearchTerm],
    queryFn: () => companyApi.autocompleteCompanies(debouncedSearchTerm, MAX_SUGGESTIONS),
    enabled: debouncedSearchTerm.length >= MIN_SEARCH_LENGTH,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 1,
  });

  // ============================================
  // COMPUTED VALUES
  // ============================================

  // Opciones para el ComboBox
  const options: ComboBoxOption[] = useMemo(() => {
    if (!suggestions.length) return [];
    
    return suggestions.map((company: CompanyDTO) => ({
      value: company.id,
      label: company.name,
      description: company.email || company.phone || undefined,
    }));
  }, [suggestions]);

  // Mensaje cuando no hay resultados
  const emptyMessage = useMemo(() => {
    if (searchError) {
      return 'Error al buscar empresas';
    }
    if (debouncedSearchTerm.length > 0 && debouncedSearchTerm.length < MIN_SEARCH_LENGTH) {
      return `Escribe al menos ${MIN_SEARCH_LENGTH} caracteres`;
    }
    if (debouncedSearchTerm.length >= MIN_SEARCH_LENGTH && !isSearching) {
      return 'No se encontraron empresas';
    }
    return 'Empieza a escribir para buscar empresas';
  }, [debouncedSearchTerm, isSearching, searchError]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleValueChange = useCallback((newValue: string | number | null) => {
    if (newValue === null) {
      onValueChange(null);
      setSearchTerm('');
    } else {
      onValueChange(Number(newValue));
      // Mantener el término de búsqueda para mostrar la empresa seleccionada
      const selectedOption = options.find(opt => opt.value === newValue);
      if (selectedOption) {
        setSearchTerm(selectedOption.label);
      }
    }
  }, [onValueChange, options]);

  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
    
    // Si se borra el texto y había una empresa seleccionada, deseleccionar
    if (!search && value) {
      onValueChange(null);
    }
  }, [value, onValueChange]);

  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    // Si hay una empresa seleccionada, restaurar su nombre en el input
    if (selectedCompany && !searchTerm) {
      setSearchTerm(selectedCompany.name);
    }
    onBlur?.();
  }, [selectedCompany, searchTerm, onBlur]);

  // ============================================
  // EFFECTS
  // ============================================

  // Actualizar el término de búsqueda cuando cambia la empresa seleccionada
  React.useEffect(() => {
    if (selectedCompany && (!searchTerm || searchTerm !== selectedCompany.name)) {
      setSearchTerm(selectedCompany.name);
    } else if (!selectedCompany && !searchTerm) {
      setSearchTerm('');
    }
  }, [selectedCompany, searchTerm]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <FormField
      label={label}
      name={name}
      required={required}
      icon={<Building2 className="h-4 w-4" />}
      error={error}
      description={description}
      className={className}
    >
      <ComboBox
        value={value}
        options={options}
        onValueChange={handleValueChange}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
        loadingMessage="Buscando empresas..."
        loading={isSearching}
        disabled={disabled}
        allowClear={allowClear}
        allowCustomValue={true}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onCreate={onCreateNew}
        createLabel="+ Nueva empresa"
        name={name}
        aria-label={ariaLabel || label}
        aria-describedby={ariaDescribedBy}
      />
    </FormField>
  );
};

export default CompanySelector;