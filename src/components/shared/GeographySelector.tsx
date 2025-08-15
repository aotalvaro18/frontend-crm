// src/components/shared/GeographySelector.tsx
// ✅ COMPONENTE GEOGRÁFICO - 100% ALINEADO CON LA ARQUITECTURA
// Reutiliza Select.tsx para consistencia visual y funcional.

import React, { useState, useEffect, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';

// --- UI Components ---
// ✅ Reutilizamos el componente Select que ya existe y es muy potente
import { Select, type SelectOption } from '@/components/ui/Select';

// --- Lógica de Datos ---
// Asumimos que has creado este archivo con los datos y funciones
import {
  hasGeographyData,
  getCountryName,
  getStatesByCountry,
  getCitiesByState,
} from '@/utils/geography';

// ============================================
// COMPONENT PROPS
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
  disabled = false,
  className = '',
  label = 'Ubicación Geográfica',
  errorState,
  errorCity,
}) => {
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

  if (!hasGeographyData(countryCode)) {
    return (
      <div className={cn('text-sm text-app-gray-500 flex items-center', className)}>
        <MapPin className="h-4 w-4 mr-2" />
        Datos geográficos no disponibles para {getCountryName(countryCode)}
      </div>
    );
  }

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