// src/components/shared/GeographySelector.tsx
// ✅ VERSIÓN CON AUTO-LLENADO DE CÓDIGOS POSTALES

import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Select, type SelectOption } from '@/components/ui/Select';
import {
  hasGeographyData,
  getCountryName,
  getStatesByCountry,
  getCitiesByState,
  getMainPostalCode,
  hasCityPostalCodes,
} from '@/utils/geography';

// ============================================
// COMPONENT PROPS (Extendidas para código postal)
// ============================================

interface GeographySelectorProps {
  countryCode: string;
  selectedState?: string;
  selectedCity?: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  // ✅ NUEVO: Callback para auto-llenar código postal
  onPostalCodeAutoFill?: (postalCode: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  errorState?: string;
  errorCity?: string;
  layout?: 'default' | 'separate';
  renderStateOnly?: boolean;
  renderCityOnly?: boolean;
  // ✅ NUEVO: Opción para mostrar ayuda de código postal
  showPostalCodeHint?: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const GeographySelector: React.FC<GeographySelectorProps> = ({
  countryCode,
  selectedState,
  selectedCity,
  onStateChange,
  onCityChange,
  onPostalCodeAutoFill,
  disabled = false,
  className = '',
  label = 'Ubicación Geográfica',
  errorState,
  errorCity,
  layout = 'default',
  renderStateOnly = false,
  renderCityOnly = false,
  showPostalCodeHint = true,
}) => {
  // ✅ COMPUTACIÓN DE OPCIONES
  const states = useMemo((): SelectOption[] => {
    return getStatesByCountry(countryCode).map(s => ({ value: s, label: s }));
  }, [countryCode]);

  const cities = useMemo((): SelectOption[] => {
    if (!selectedState) return [];
    
    return getCitiesByState(countryCode, selectedState).map(cityName => {
      const hasPostal = hasCityPostalCodes(countryCode, selectedState, cityName);
      const mainPostal = hasPostal ? getMainPostalCode(countryCode, selectedState, cityName) : '';
      
      return {
        value: cityName,
        label: cityName,
        description: hasPostal ? `📮 CP: ${mainPostal}` : undefined
      };
    });
  }, [countryCode, selectedState]);

  // ✅ HANDLER MEJORADO PARA CIUDAD CON AUTO-LLENADO
  const handleCityChange = (city: string) => {
    onCityChange(city);
    
    // Auto-llenar código postal si está disponible
    if (city && selectedState && onPostalCodeAutoFill) {
      const mainPostalCode = getMainPostalCode(countryCode, selectedState, city);
      if (mainPostalCode) {
        onPostalCodeAutoFill(mainPostalCode);
      }
    }
  };

  // ✅ VALIDACIÓN SIN CAMBIOS
  if (!hasGeographyData(countryCode)) {
    return (
      <div className={cn('text-sm text-app-gray-500 flex items-center', className)}>
        <MapPin className="h-4 w-4 mr-2" />
        Datos geográficos no disponibles para {getCountryName(countryCode)}
      </div>
    );
  }

  // ✅ RENDER SOLO ESTADO
  if (layout === 'separate' && renderStateOnly) {
    return (
      <div className={className}>
        <Select
          value={selectedState || ''}
          onValueChange={(newState) => onStateChange(String(newState || ''))}
          options={states}
          placeholder="Seleccionar..."
          disabled={disabled || states.length === 0}
          searchable
          emptyMessage="No se encontraron estados"
          error={errorState}
        />
      </div>
    );
  }

  // ✅ RENDER SOLO CIUDAD (Con auto-llenado de código postal)
  if (layout === 'separate' && renderCityOnly) {
    const hasAnyPostalCodes = cities.some(city => city.description);
    
    return (
      <div className={className}>
        <Select
          value={selectedCity || ''}
          onValueChange={(newCity) => handleCityChange(String(newCity || ''))}
          options={cities}
          placeholder={selectedState ? 'Seleccionar ciudad...' : 'Selecciona un estado'}
          disabled={disabled || !selectedState || cities.length === 0}
          searchable
          emptyMessage="No se encontraron ciudades"
          error={errorCity}
        />
        
        {/* ✅ NUEVO: Hint sobre código postal automático */}
        {showPostalCodeHint && hasAnyPostalCodes && selectedState && (
          <p className="text-xs text-app-gray-500 mt-1 flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            El código postal se llenará automáticamente
          </p>
        )}
      </div>
    );
  }

  // ✅ LAYOUT POR DEFECTO (Ambos selectores con auto-llenado)
  return (
    <div className={cn('space-y-4', className)}>
      {label && <h3 className="text-sm font-medium text-app-gray-200">{label}</h3>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State/Departamento Selector */}
        <div>
          <Select
            label={countryCode === 'CO' ? 'Departamento' : 'Estado/Provincia'}
            value={selectedState || ''}
            onValueChange={(newState) => onStateChange(String(newState || ''))}
            options={states}
            placeholder="Seleccionar..."
            disabled={disabled || states.length === 0}
            searchable
            emptyMessage="No se encontraron estados"
            error={errorState}
          />
        </div>

        {/* City Selector */}
        <div>
          <Select
            label="Ciudad"
            value={selectedCity || ''}
            onValueChange={(newCity) => handleCityChange(String(newCity || ''))}
            options={cities}
            placeholder={selectedState ? 'Seleccionar ciudad...' : 'Selecciona un estado'}
            disabled={disabled || !selectedState || cities.length === 0}
            searchable
            emptyMessage="No se encontraron ciudades"
            error={errorCity}
          />
          
          {/* Hint sobre código postal */}
          {showPostalCodeHint && cities.some(city => city.description) && selectedState && (
            <p className="text-xs text-app-gray-500 mt-1 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              El código postal se llenará automáticamente al seleccionar ciudad
            </p>
          )}
        </div>
      </div>
    </div>
  );
};