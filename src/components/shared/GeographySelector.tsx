// src/components/shared/GeographySelector.tsx
// ✅ REFACTORIZACIÓN QUIRÚRGICA - Layout flexible sin perder robustez
// Backward compatible - el uso actual sigue funcionando exactamente igual

import React, { useState, useEffect, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';

// --- UI Components ---
import { Select, type SelectOption } from '@/components/ui/Select';

// --- Lógica de Datos ---
import {
  hasGeographyData,
  getCountryName,
  getStatesByCountry,
  getCitiesByState,
} from '@/utils/geography';

// ============================================
// COMPONENT PROPS (✅ EXTENDIDAS SIN ROMPER LAS EXISTENTES)
// ============================================

interface GeographySelectorProps {
  // ✅ Props existentes - NO TOCAR
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
  
  // ✅ NUEVAS PROPS para layout flexible
  layout?: 'default' | 'separate';
  renderStateOnly?: boolean;
  renderCityOnly?: boolean;
}

// ============================================
// MAIN COMPONENT (✅ LÓGICA CONSERVADA 100%)
// ============================================

export const GeographySelector: React.FC<GeographySelectorProps> = ({
  // ✅ Props existentes
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
  
  // ✅ Nuevas props con defaults seguros
  layout = 'default',
  renderStateOnly = false,
  renderCityOnly = false,
}) => {
  // ✅ LÓGICA EXISTENTE - SIN CAMBIOS
  // Resetear selecciones cuando cambia el país
  useEffect(() => {
    onStateChange('');
    onCityChange('');
  }, [countryCode, onStateChange, onCityChange]);

  // Resetear ciudad cuando cambia el estado
  useEffect(() => {
    onCityChange('');
  }, [selectedState, onCityChange]);

  // Obtener listas de opciones
  const states = useMemo((): SelectOption[] => {
    return getStatesByCountry(countryCode).map(s => ({ value: s, label: s }));
  }, [countryCode]);

  const cities = useMemo((): SelectOption[] => {
    return selectedState ? getCitiesByState(countryCode, selectedState).map(c => ({ value: c, label: c })) : [];
  }, [countryCode, selectedState]);

  // ✅ VALIDACIÓN EXISTENTE - SIN CAMBIOS
  if (!hasGeographyData(countryCode)) {
    return (
      <div className={cn('text-sm text-app-gray-500 flex items-center', className)}>
        <MapPin className="h-4 w-4 mr-2" />
        Datos geográficos no disponibles para {getCountryName(countryCode)}
      </div>
    );
  }

  // ✅ NUEVO: Render condicional para layout 'separate'
  if (layout === 'separate') {
    // Render solo State
    if (renderStateOnly) {
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

    // Render solo City
    if (renderCityOnly) {
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
  }

  // ✅ RENDER EXISTENTE - EXACTAMENTE IGUAL (default layout)
  return (
    <div className={cn('space-y-4', className)}>
      {label && <h3 className="text-sm font-medium text-app-gray-200">{label}</h3>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State/Departamento Selector */}
        <div>
          <Select
            label={countryCode === 'CO' ? 'Departamento' : 'Estado/Provincia'}
            value={selectedState}
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
            value={selectedCity}
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