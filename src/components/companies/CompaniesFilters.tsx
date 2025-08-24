// src/components/companies/CompaniesFilters.tsx
// ✅ Company filters component - COMPLETADO

import React, { useState, useCallback } from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import type { 
  CompanySearchCriteria, 
  CompanyType, 
  CompanySize 
} from '@/types/company.types';
import { 
  COMPANY_TYPE_LABELS, 
  COMPANY_SIZE_LABELS,
  INDUSTRY_LABELS 
} from '@/types/company.types';

interface CompaniesFiltersProps {
  searchCriteria: CompanySearchCriteria;
  onCriteriaChange: (criteria: CompanySearchCriteria) => void;
  onClose: () => void;
  className?: string;
}

export const CompaniesFilters: React.FC<CompaniesFiltersProps> = ({
  searchCriteria,
  onCriteriaChange,
  onClose,
  className
}) => {
  // Estado interno de los filtros
  const [localFilters, setLocalFilters] = useState<CompanySearchCriteria>(searchCriteria);

  const handleFilterChange = useCallback(<K extends keyof CompanySearchCriteria>(
    key: K,
    value: CompanySearchCriteria[K]
  ) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined // Convierte strings vacíos a undefined
    }));
  }, []);

  // Helper tipado para manejar valores del Select
  const handleSelectChange = useCallback(<K extends keyof CompanySearchCriteria>(
    key: K,
    value: string | number | (string | number)[] | undefined
  ) => {
    // Solo aceptar strings para campos de texto
    const stringValue = typeof value === 'string' ? value : undefined;
    handleFilterChange(key, stringValue as CompanySearchCriteria[K]);
  }, [handleFilterChange]);

  const handleApplyFilters = useCallback(() => {
    // Limpiar valores vacíos antes de aplicar
    const cleanFilters = Object.entries(localFilters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        acc[key as keyof CompanySearchCriteria] = value;
      }
      return acc;
    }, {} as CompanySearchCriteria);

    onCriteriaChange(cleanFilters);
    onClose();
  }, [localFilters, onCriteriaChange, onClose]);

  const handleClearFilters = useCallback(() => {
    const emptyFilters: CompanySearchCriteria = {};
    setLocalFilters(emptyFilters);
    onCriteriaChange(emptyFilters);
  }, [onCriteriaChange]);

  // Opciones para los selects
  const companyTypeOptions = [
    { value: '', label: 'Todos los tipos' },
    ...Object.entries(COMPANY_TYPE_LABELS).map(([value, label]) => ({ value, label }))
  ];

  const companySizeOptions = [
    { value: '', label: 'Todos los tamaños' },
    ...Object.entries(COMPANY_SIZE_LABELS).map(([value, label]) => ({ value, label }))
  ];

  const industryOptions = [
    { value: '', label: 'Todas las industrias' },
    ...Object.entries(INDUSTRY_LABELS).map(([value, label]) => ({ value, label }))
  ];

  return (
    <div className={cn('p-4 border rounded-lg bg-app-dark-800 border-app-dark-600', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-app-gray-400" />
          <h3 className="text-lg font-semibold text-app-gray-100">Filtros</h3>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Tipo de Empresa */}
        <div>
          <label className="block text-sm font-medium text-app-gray-300 mb-1">
            Tipo
          </label>
          <Select
            value={localFilters.type || ''}
            onValueChange={(value) => handleFilterChange('type', value as CompanyType)}
            options={companyTypeOptions}
          />
        </div>

        {/* Industria */}
        <div>
          <label className="block text-sm font-medium text-app-gray-300 mb-1">
            Industria
          </label>
          <Select
            value={localFilters.industry || ''}
            onValueChange={(value) => handleSelectChange('industry', value)}
            options={industryOptions}
          />
        </div>

        {/* Tamaño */}
        <div>
          <label className="block text-sm font-medium text-app-gray-300 mb-1">
            Tamaño
          </label>
          <Select
            value={localFilters.companySize || ''}
            onValueChange={(value) => handleFilterChange('companySize', value as CompanySize)}
            options={companySizeOptions}
          />
        </div>

        {/* Ciudad */}
        <div>
          <label className="block text-sm font-medium text-app-gray-300 mb-1">
            Ciudad
          </label>
          <Input
            value={localFilters.city || ''}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            placeholder="Ej: Bogotá"
          />
        </div>
      </div>

      {/* Filtros de Revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-app-gray-300 mb-1">
            Revenue Mínimo
          </label>
          <Input
            type="number"
            value={localFilters.minRevenue || ''}
            onChange={(e) => handleFilterChange('minRevenue', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-app-gray-300 mb-1">
            Revenue Máximo
          </label>
          <Input
            type="number"
            value={localFilters.maxRevenue || ''}
            onChange={(e) => handleFilterChange('maxRevenue', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Sin límite"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localFilters.hasContacts || false}
            onChange={(e) => handleFilterChange('hasContacts', e.target.checked || undefined)}
            className="rounded border-app-dark-600 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-app-gray-300">Con contactos</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localFilters.hasActiveContacts || false}
            onChange={(e) => handleFilterChange('hasActiveContacts', e.target.checked || undefined)}
            className="rounded border-app-dark-600 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-app-gray-300">Con contactos activos</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localFilters.onlyOwned || false}
            onChange={(e) => handleFilterChange('onlyOwned', e.target.checked || undefined)}
            className="rounded border-app-dark-600 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-app-gray-300">Solo mis empresas</span>
        </label>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-between pt-4 border-t border-app-dark-600">
        <Button variant="ghost" onClick={handleClearFilters}>
          Limpiar Filtros
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleApplyFilters}>
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </div>
  );
};