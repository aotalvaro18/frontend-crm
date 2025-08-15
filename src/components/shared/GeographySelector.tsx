// src/components/shared/GeographySelector.tsx
// ✅ VERSIÓN FINAL REFACTORIZADA - SIN EFECTOS SECUNDARIOS

import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Select, type SelectOption } from '@/components/ui/Select';
import {
  hasGeographyData,
  getCountryName,
  getStatesByCountry,
  getCitiesByState,
} from '@/utils/geography';

// ============================================
// COMPONENT PROPS (Mismas props, nueva implementación)
// ============================================

interface GeographySelectorProps {
  countryCode: string;
  selectedState?: string;
  selectedCity?: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  errorState?: string;
  errorCity?: string;
  layout?: 'default' | 'separate';
  renderStateOnly?: boolean;
  renderCityOnly?: boolean;
}

// ============================================
// MAIN COMPONENT (✅ SIN useEffect - COMPONENTE "TONTO")
// ============================================

export const GeographySelector: React.FC<GeographySelectorProps> = ({
  countryCode,
  selectedState,
  selectedCity,
  onStateChange,
  onCityChange,
  disabled = false,
  className = '',
  label = 'Ubicación Geográfica',
  errorState,
  errorCity,
  layout = 'default',
  renderStateOnly = false,
  renderCityOnly = false,
}) => {
  // ✅ SOLO COMPUTACIÓN - SIN EFECTOS SECUNDARIOS
  const states = useMemo((): SelectOption[] => {
    return getStatesByCountry(countryCode).map(s => ({ value: s, label: s }));
  }, [countryCode]);

  const cities = useMemo((): SelectOption[] => {
    return selectedState ? getCitiesByState(countryCode, selectedState).map(c => ({ value: c, label: c })) : [];
  }, [countryCode, selectedState]);

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

  // ✅ RENDER SOLO CIUDAD
  if (layout === 'separate' && renderCityOnly) {
    return (
      <div className={className}>
        <Select
          value={selectedCity || ''}
          onValueChange={(newCity) => onCityChange(String(newCity || ''))}
          options={cities}
          placeholder={selectedState ? 'Seleccionar ciudad...' : 'Selecciona un estado'}
          disabled={disabled || !selectedState || cities.length === 0}
          searchable
          emptyMessage="No se encontraron ciudades"
          error={errorCity}
        />
      </div>
    );
  }

  // ✅ LAYOUT POR DEFECTO (Ambos selectores juntos)
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
            onValueChange={(newCity) => onCityChange(String(newCity || ''))}
            options={cities}
            placeholder={selectedState ? 'Seleccionar ciudad...' : 'Selecciona un estado'}
            disabled={disabled || !selectedState || cities.length === 0}
            searchable
            emptyMessage="No se encontraron ciudades"
            error={errorCity}
          />
        </div>
      </div>
    </div>
  );
};