// src/components/forms/AddressForm.tsx
// AddressForm siguiendo tu guía arquitectónica
// Mobile-first + Structured data + Country-aware validation

import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Building, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import type { Address } from '@/types/common.types';

// ============================================
// COUNTRY CONFIGURATION (ORDEN CORREGIDO)
// ============================================

// 1. Definir la ESTRUCTURA (la interfaz) primero.
interface CountryConfig {
  name: string;
  code: string;
  phonePrefix: string;
  postalCodePattern: RegExp;
  postalCodePlaceholder: string;
  states: string[];
  stateLabel: string;
  cityLabel: string;
  addressFormat: Array<keyof Address>;
}

// 2. Definir los CÓDIGOS de país como un tipo literal.
type CountryCode = 'CO' | 'US' | 'MX' | 'OTHER';

// 3. Definir el OBJETO de datos, AHORA usando los tipos predefinidos.
const COUNTRIES: Record<CountryCode, CountryConfig> = {
  CO: {
    name: 'Colombia',
    code: 'CO',
    phonePrefix: '+57',
    postalCodePattern: /^\d{6}$/,
    postalCodePlaceholder: '110111',
    states: [
      'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
      'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
      'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
      'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
      'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
      'Vaupés', 'Vichada'
    ],
    stateLabel: 'Departamento',
    cityLabel: 'Ciudad/Municipio',
    addressFormat: ['addressLine1', 'addressLine2', 'city', 'state', 'postalCode'],
  },
  US: {
    name: 'Estados Unidos',
    code: 'US',
    phonePrefix: '+1',
    postalCodePattern: /^\d{5}(-\d{4})?$/,
    postalCodePlaceholder: '12345',
    states: [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
      'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
      'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
      'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
      'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
      'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
      'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
      'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
    ],
    stateLabel: 'Estado',
    cityLabel: 'Ciudad',
    addressFormat: ['addressLine1', 'addressLine2', 'city', 'state', 'postalCode'],
  },
  MX: {
    name: 'México',
    code: 'MX',
    phonePrefix: '+52',
    postalCodePattern: /^\d{5}$/,
    postalCodePlaceholder: '01000',
    states: [
      'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
      'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Estado de México',
      'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos',
      'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
      'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
      'Veracruz', 'Yucatán', 'Zacatecas'
    ],
    stateLabel: 'Estado',
    cityLabel: 'Ciudad',
    addressFormat: ['addressLine1', 'addressLine2', 'city', 'state', 'postalCode'],
  },
  OTHER: {
    name: 'Otro País',
    code: 'OTHER',
    phonePrefix: '',
    postalCodePattern: /^.+$/,
    postalCodePlaceholder: 'Código postal',
    states: [],
    stateLabel: 'Estado/Provincia',
    cityLabel: 'Ciudad',
    addressFormat: ['addressLine1', 'addressLine2', 'city', 'state', 'postalCode'],
  },
};

// ============================================
// TYPES
// ============================================

export interface AddressFormProps {
  // Data
  value: Address;
  onChange: (address: Address) => void;
  
  // Configuration
  required?: boolean;
  showCountrySelector?: boolean;
  defaultCountry?: CountryCode;
  fields?: Array<keyof Address>;
  
  // Validation
  errors?: Partial<Record<keyof Address, string>>;
  
  // Behavior
  disabled?: boolean;
  autoComplete?: boolean;
  
  // UI
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'inline';
  layout?: 'vertical' | 'horizontal' | 'grid';
  
  // Events
  onCountryChange?: (country: CountryCode) => void;
  onValidation?: (isValid: boolean, errors: Partial<Record<keyof Address, string>>) => void;
  
  // Classes
  className?: string;
  fieldClassName?: string;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

const validateAddress = (address: Address, country: CountryCode): Partial<Record<keyof Address, string>> => {
  const errors: Partial<Record<keyof Address, string>> = {};
  const countryConfig = COUNTRIES[country];
  
  // Required field validation
  if (!address.addressLine1?.trim()) {
    errors.addressLine1 = 'La dirección principal es requerida';
  }
  
  if (!address.city?.trim()) {
    errors.city = `${countryConfig.cityLabel} es requerida`;
  }
  
  if (!address.state?.trim()) {
    errors.state = `${countryConfig.stateLabel} es requerido`;
  }
  
  // Postal code validation
  if (address.postalCode && !countryConfig.postalCodePattern.test(address.postalCode)) {
    errors.postalCode = `Formato de código postal inválido para ${countryConfig.name}`;
  }
  
  // Country-specific validations
  if (country !== 'OTHER' && address.state && countryConfig.states.length > 0) {
    if (!countryConfig.states.includes(address.state)) {
      errors.state = `${countryConfig.stateLabel} no válido para ${countryConfig.name}`;
    }
  }
  
  return errors;
};

const detectCountryFromAddress = (address: Address): CountryCode => {
  if (!address.country) return 'CO'; // Default to Colombia
  
  const country = address.country.toLowerCase();
  if (country.includes('colombia') || country === 'co') return 'CO';
  if (country.includes('estados unidos') || country.includes('usa') || country === 'us') return 'US';
  if (country.includes('méxico') || country.includes('mexico') || country === 'mx') return 'MX';
  
  return 'OTHER';
};

// ============================================
// ADDRESS FORM COMPONENT
// ============================================

export const AddressForm: React.FC<AddressFormProps> = ({
  value,
  onChange,
  required = false,
  showCountrySelector = true,
  defaultCountry = 'CO',
  fields = ['addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country'],
  errors = {},
  disabled = false,
  autoComplete = true,
  size = 'md',
  variant = 'default',
  layout = 'vertical',
  onCountryChange,
  onValidation,
  className,
  fieldClassName,
}) => {
  const [currentCountry, setCurrentCountry] = useState<CountryCode>(
    value.country ? detectCountryFromAddress(value) : defaultCountry
  );
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  
  const countryConfig = COUNTRIES[currentCountry];
  
  // Update validation when address or country changes
  useEffect(() => {
    if (onValidation) {
      const errors = validateAddress(value, currentCountry);
      setValidationErrors(errors);
      onValidation(Object.keys(errors).length === 0, errors);
    }
  }, [value, currentCountry, onValidation]);
  
  // Handle field changes
  const handleFieldChange = (field: keyof Address, fieldValue: string) => {
    const newAddress = { ...value, [field]: fieldValue };
    onChange(newAddress);
  };
  
  // Handle country change
  const handleCountryChange = (country: CountryCode) => {
    setCurrentCountry(country);
    
    // Update the country field in the address
    const newAddress = { 
      ...value, 
      country: COUNTRIES[country].name,
      // Clear state if switching to a country with different states
      ...(country !== currentCountry && { state: '' })
    };
    onChange(newAddress);
    onCountryChange?.(country);
  };
  
  // Get field error (external errors take priority)
  const getFieldError = (field: keyof Address): string | undefined => {
    return errors[field] || validationErrors[field];
  };
  
  // Size configurations
  const sizeConfig = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  // Layout classes
  const layoutClasses = {
    vertical: 'space-y-4',
    horizontal: 'flex flex-wrap gap-4',
    grid: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  };
  
  // Field ordering based on country
  const fieldOrder = countryConfig.addressFormat.filter(field => fields.includes(field as keyof Address));
  
  // Render field helper
  const renderField = (field: keyof Address) => {
    const fieldError = getFieldError(field);
    const isRequired = required && ['addressLine1', 'city', 'state'].includes(field);
    
    switch (field) {
      case 'addressLine1':
        return (
          <Input
            key={field}
            label="Dirección principal"
            placeholder="Cra 7 # 19-34"
            value={value.addressLine1 || ''}
            onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
            error={fieldError}
            required={isRequired}
            disabled={disabled}
            size={size}
            leftIcon={<MapPin className="h-4 w-4" />}
            autoComplete={autoComplete ? 'address-line1' : 'off'}
            className={fieldClassName}
          />
        );
        
      case 'addressLine2':
        return (
          <Input
            key={field}
            label="Dirección complementaria"
            placeholder="Apto 301, Torre B"
            value={value.addressLine2 || ''}
            onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
            error={fieldError}
            disabled={disabled}
            size={size}
            leftIcon={<Building className="h-4 w-4" />}
            autoComplete={autoComplete ? 'address-line2' : 'off'}
            className={fieldClassName}
          />
        );
        
      case 'city':
        return (
          <Input
            key={field}
            label={countryConfig.cityLabel}
            placeholder={currentCountry === 'CO' ? 'Bogotá' : 'Ciudad'}
            value={value.city || ''}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            error={fieldError}
            required={isRequired}
            disabled={disabled}
            size={size}
            autoComplete={autoComplete ? 'address-level2' : 'off'}
            className={fieldClassName}
          />
        );
        
      case 'state':
        if (countryConfig.states.length > 0) {
          return (
            <div key={field} className="relative">
              <Input
                label={countryConfig.stateLabel}
                value={value.state || ''}
                onChange={(e) => handleFieldChange('state', e.target.value)}
                onFocus={() => setShowStateDropdown(true)}
                error={fieldError}
                required={isRequired}
                disabled={disabled}
                size={size}
                placeholder={`Seleccionar ${countryConfig.stateLabel.toLowerCase()}`}
                autoComplete={autoComplete ? 'address-level1' : 'off'}
                className={fieldClassName}
              />
              
              {/* State dropdown */}
              {showStateDropdown && !disabled && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto bg-app-dark-800 border border-app-dark-600 rounded-lg shadow-lg">
                  {countryConfig.states
                    .filter(state => 
                      !value.state || 
                      state.toLowerCase().includes(value.state.toLowerCase())
                    )
                    .slice(0, 10)
                    .map((state) => (
                      <button
                        key={state}
                        onClick={() => {
                          handleFieldChange('state', state);
                          setShowStateDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-app-dark-700 text-app-gray-200 text-sm"
                      >
                        {state}
                      </button>
                    ))}
                </div>
              )}
            </div>
          );
        } else {
          return (
            <Input
              key={field}
              label={countryConfig.stateLabel}
              placeholder="Estado/Provincia"
              value={value.state || ''}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              error={fieldError}
              required={isRequired}
              disabled={disabled}
              size={size}
              autoComplete={autoComplete ? 'address-level1' : 'off'}
              className={fieldClassName}
            />
          );
        }
        
      case 'postalCode':
        return (
          <Input
            key={field}
            label="Código postal"
            placeholder={countryConfig.postalCodePlaceholder}
            value={value.postalCode || ''}
            onChange={(e) => handleFieldChange('postalCode', e.target.value)}
            error={fieldError}
            disabled={disabled}
            size={size}
            autoComplete={autoComplete ? 'postal-code' : 'off'}
            className={fieldClassName}
          />
        );
        
      case 'country':
        if (!showCountrySelector) return null;
        
        return (
          <div key={field} className="space-y-2">
            <label className="block text-sm font-medium text-app-gray-300">
              País
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => (
                <Button
                  key={code}
                  variant={currentCountry === code ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCountryChange(code)}
                  disabled={disabled}
                  className="text-xs"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  {COUNTRIES[code].name}
                </Button>
              ))}
            </div>
            {fieldError && (
              <p className="text-xs text-red-400">{fieldError}</p>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Click outside to close state dropdown
  useEffect(() => {
    const handleClickOutside = () => setShowStateDropdown(false);
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-app-gray-400" />
          <span className="text-sm font-medium text-app-gray-300">Dirección</span>
          {required && <span className="text-red-400">*</span>}
        </div>
        
        <Input
          placeholder="Dirección completa"
          value={value.addressLine1 || ''}
          onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
          error={getFieldError('addressLine1')}
          size="sm"
          disabled={disabled}
        />
        
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder={countryConfig.cityLabel}
            value={value.city || ''}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            size="sm"
            disabled={disabled}
          />
          <Input
            placeholder="Código postal"
            value={value.postalCode || ''}
            onChange={(e) => handleFieldChange('postalCode', e.target.value)}
            size="sm"
            disabled={disabled}
          />
        </div>
      </div>
    );
  }
  
  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <Badge variant="outline" size="sm">
          <MapPin className="h-3 w-3 mr-1" />
          Dirección
        </Badge>
        <Input
          placeholder="Dirección completa..."
          value={`${value.addressLine1 || ''} ${value.city || ''} ${value.state || ''}`.trim()}
          onChange={(e) => {
            // Simple parsing for inline mode
            const parts = e.target.value.split(' ');
            handleFieldChange('addressLine1', parts[0] || '');
            handleFieldChange('city', parts[1] || '');
            handleFieldChange('state', parts.slice(2).join(' ') || '');
          }}
          size="sm"
          disabled={disabled}
          className="flex-1 min-w-[200px]"
        />
      </div>
    );
  }
  
  // Default variant
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-app-gray-400" />
        <h3 className={cn('font-medium text-app-gray-300', sizeConfig[size])}>
          Información de Dirección
        </h3>
        {required && <span className="text-red-400">*</span>}
        <Badge variant="outline" size="sm">
          {countryConfig.name}
        </Badge>
      </div>
      
      {/* Fields */}
      <div className={cn(layoutClasses[layout])}>
        {fieldOrder.map(field => renderField(field as keyof Address))}
      </div>
      
      {/* Address preview */}
      {(value.addressLine1 || value.city) && (
        <div className="mt-4 p-3 bg-app-dark-800 rounded-lg border border-app-dark-600">
          <div className="flex items-start gap-2">
            <Navigation className="h-4 w-4 text-app-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-app-gray-300">
              <div className="font-medium">Vista previa:</div>
              <div className="mt-1 space-y-1">
                {value.addressLine1 && <div>{value.addressLine1}</div>}
                {value.addressLine2 && <div>{value.addressLine2}</div>}
                <div>
                  {[value.city, value.state, value.postalCode]
                    .filter(Boolean)
                    .join(', ')}
                </div>
                {value.country && <div>{value.country}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SPECIALIZED ADDRESS COMPONENTS
// ============================================

/**
 * Simple Address Input - Una sola línea
 */
export const SimpleAddressInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}> = ({ value, onChange, placeholder = "Dirección completa", error, required, disabled, className }) => (
  <Input
    label="Dirección"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    error={error}
    required={required}
    disabled={disabled}
    leftIcon={<MapPin className="h-4 w-4" />}
    className={className}
  />
);

/**
 * Colombian Address Form - Pre-configurado para Colombia
 */
export const ColombianAddressForm: React.FC<{
  value: Address;
  onChange: (address: Address) => void;
  required?: boolean;
  errors?: Partial<Record<keyof Address, string>>;
  className?: string;
}> = ({ value, onChange, required, errors, className }) => (
  <AddressForm
    value={value}
    onChange={onChange}
    required={required}
    errors={errors}
    defaultCountry="CO"
    showCountrySelector={false}
    fields={['addressLine1', 'addressLine2', 'city', 'state', 'postalCode']}
    className={className}
  />
);

export default AddressForm;