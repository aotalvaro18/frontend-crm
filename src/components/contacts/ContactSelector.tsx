// src/components/contacts/ContactSelector.tsx
// ✅ CONTACT SELECTOR - Replicando exactamente CompanySelector.tsx
// Componente inteligente que maneja la lógica de búsqueda de contactos
// Siguiendo arquitectura Eklesa: UI component reutilizable con lógica de fetching encapsulada

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Plus } from 'lucide-react';

// ============================================
// COMPONENTS
// ============================================
import { ComboBox, type ComboBoxOption } from '@/components/ui/ComboBox';
import { FormField } from '@/components/forms/FormField';

// ============================================
// HOOKS & SERVICES
// ============================================
import { contactApi } from '@/services/api/contactApi';
import { useSearchDebounce } from '@/hooks/useDebounce';

// ============================================
// TYPES
// ============================================

export interface ContactSelectorProps {
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
// CONSTANTS - SIGUIENDO PATRÓN COMPANYSELECTOR
// ============================================

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;
const MAX_SUGGESTIONS = 10;

// ============================================
// MAIN COMPONENT
// ============================================

export const ContactSelector: React.FC<ContactSelectorProps> = ({
  value,
  onValueChange,
  label = 'Contacto Principal',
  name = 'contactId',
  required = false,
  error,
  description,
  placeholder = 'Buscar contacto o crear nuevo...',
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
  // CONTACTO SELECCIONADO
  // ============================================
  
  // Query para obtener el contacto seleccionado
  const { data: selectedContact } = useQuery({
    queryKey: ['contact', value],
    queryFn: () => contactApi.getContactById(value!),
    enabled: !!value && value > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // ============================================
  // BÚSQUEDA DE CONTACTOS (AUTOCOMPLETADO)
  // ============================================
  
  // Query para buscar contactos mientras el usuario tipea
  const { data: contactOptions = [], isLoading } = useQuery({
    queryKey: ['contacts', 'autocomplete', debouncedSearchTerm],
    queryFn: () => contactApi.autocompleteContacts(debouncedSearchTerm, MAX_SUGGESTIONS),
    enabled: debouncedSearchTerm.length >= MIN_SEARCH_LENGTH,
    staleTime: 2 * 60 * 1000, // 2 minutos para autocomplete
  });

  // Efecto para sincronizar el texto del input con el contacto seleccionado
  React.useEffect(() => {
    if (selectedContact) {
      setSearchTerm(`${selectedContact.firstName} ${selectedContact.lastName}`);
    }
  }, [selectedContact]);

  // ============================================
  // OPCIONES PARA EL COMBOBOX
  // ============================================

  const options: ComboBoxOption[] = useMemo(() => {
    const contactOpts: ComboBoxOption[] = contactOptions.map(contact => ({
      value: contact.id,
      label: `${contact.firstName} ${contact.lastName}`,
      description: contact.email || contact.phone || 'Sin información de contacto',
      icon: <User className="h-4 w-4" />,
    }));

    // Agregar opción de "Crear nuevo" si hay callback
    if (onCreateNew && debouncedSearchTerm.length >= MIN_SEARCH_LENGTH) {
      contactOpts.push({
        value: 'create-new',
        label: `Crear "${debouncedSearchTerm}"`,
        description: 'Crear nuevo contacto',
        icon: <Plus className="h-4 w-4" />,
        isAction: true,
      });
    }

    return contactOpts;
  }, [contactOptions, debouncedSearchTerm, onCreateNew]);

  // ============================================
  // VALOR ACTUAL PARA EL COMBOBOX
  // ============================================

  

  // ============================================
  // HANDLERS
  // ============================================

  const handleValueChange = useCallback((newValue: number | string | null) => {
    // Si seleccionó "crear nuevo"
    if (newValue === 'create-new' && onCreateNew) {
      onCreateNew();
      return;
    }
    
    // Convertir a number o null
    const contactId = typeof newValue === 'number' ? newValue : null;
    onValueChange(contactId);
  }, [onValueChange, onCreateNew]);

  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <FormField
      label={label}
      name={name}
      required={required}
      error={error}
      description={description}
      icon={<User className="h-4 w-4" />}
      className={className}
    >
      <ComboBox
        value={value} // <- CAMBIO 1: Pasamos el 'value' simple (number | null)
        options={options}
        onValueChange={handleValueChange}
        
        searchValue={searchTerm} // <- CAMBIO 2: Controlamos el texto explícitamente
        onSearchChange={handleSearchChange}

        placeholder={placeholder}
        disabled={disabled}
        allowClear={allowClear}
        loading={isLoading}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-label={ariaLabel || `${label} selector`}
        aria-describedby={ariaDescribedBy}
        searchPlaceholder="Buscar por nombre o email..."
        emptyMessage={
          debouncedSearchTerm.length < MIN_SEARCH_LENGTH
            ? `Escribe al menos ${MIN_SEARCH_LENGTH} caracteres para buscar`
            : 'No se encontraron contactos'
        }
        showSearchIcon={true}
        className="w-full"
      />
    </FormField>
  );
};

// ============================================
// DISPLAY NAME PARA DEBUGGING
// ============================================

ContactSelector.displayName = 'ContactSelector';

export default ContactSelector;