// src/components/contacts/ContactsFilters.tsx
// Filters component especializado para contactos

import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ContactSearchCriteria, ContactStatus } from '@/types/contact.types';

// ============================================
// CONSTANTS
// ============================================

const CONTACT_SOURCES = {
  'WEBSITE': 'Sitio Web',
  'MANUAL': 'Manual',
  'IMPORT': 'Importación',
  'REFERRAL': 'Referido',
  'SOCIAL_MEDIA': 'Redes Sociales',
  'EMAIL_CAMPAIGN': 'Campaña Email',
  'EVENT': 'Evento',
  'OTHER': 'Otro'
};

const CONTACT_STATUSES = {
  'ACTIVE': 'Activo',
  'INACTIVE': 'Inactivo',
  'DO_NOT_CONTACT': 'No Contactar',
  'DUPLICATE': 'Duplicado',
  'ARCHIVED': 'Archivado',
  'PROSPECT': 'Prospecto',
  'LEAD': 'Lead',
  'MEMBER': 'Miembro',
  'VISITOR': 'Visitante',
  'FORMER_MEMBER': 'Ex-miembro',
  'DECEASED': 'Fallecido',
  'MOVED': 'Se mudó',
  'BOUNCED': 'Rebotado',
  'BLOCKED': 'Bloqueado'
};

// ============================================
// TYPES
// ============================================

interface ContactsFiltersProps {
  searchCriteria: ContactSearchCriteria;
  onApplyFilters: (filters: ContactSearchCriteria) => void;
  hasActiveFilters: boolean;
}

// ============================================
// FILTER PANEL COMPONENT
// ============================================

interface FilterPanelProps {
  searchCriteria: ContactSearchCriteria;
  onApplyFilters: (filters: ContactSearchCriteria) => void;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  searchCriteria,
  onApplyFilters,
  onClose
}) => {
  const [localFilters, setLocalFilters] = useState<ContactSearchCriteria>(searchCriteria);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: ContactSearchCriteria = {};
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };

  const updateFilter = (key: keyof ContactSearchCriteria, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  return (
    <div className="bg-app-dark-700 p-4 rounded-lg border border-app-dark-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-app-gray-100">Filtros</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-app-gray-300 mb-1">
            Estado
          </label>
          <select
            value={localFilters.status || ''}
            onChange={(e) => updateFilter('status', e.target.value as ContactStatus)}
            className="w-full px-3 py-2 border border-app-dark-600 rounded-md bg-app-dark-800 text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(CONTACT_STATUSES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        
        {/* Fuente */}
        <div>
          <label className="block text-sm font-medium text-app-gray-300 mb-1">
            Fuente
          </label>
          <select
            value={localFilters.source || ''}
            onChange={(e) => updateFilter('source', e.target.value)}
            className="w-full px-3 py-2 border border-app-dark-600 rounded-md bg-app-dark-800 text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todas las fuentes</option>
            {Object.entries(CONTACT_SOURCES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Portal Digital */}
        <div>
          <label className="block text-sm font-medium text-app-gray-300 mb-1">
            Portal Digital
          </label>
          <select
            value={
              localFilters.onlySystemUsers === true ? 'with_portal' :
              localFilters.onlySystemUsers === false ? 'without_portal' : ''
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'with_portal') {
                updateFilter('onlySystemUsers', true);
              } else if (value === 'without_portal') {
                updateFilter('onlySystemUsers', false);
              } else {
                updateFilter('onlySystemUsers', undefined);
              }
            }}
            className="w-full px-3 py-2 border border-app-dark-600 rounded-md bg-app-dark-800 text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todos</option>
            <option value="with_portal">Con Portal</option>
            <option value="without_portal">Sin Portal</option>
          </select>
        </div>

        {/* Solo Propios */}
        <div>
          <label className="block text-sm font-medium text-app-gray-300 mb-1">
            Propietario
          </label>
          <select
            value={localFilters.onlyOwned === true ? 'owned' : ''}
            onChange={(e) => {
              updateFilter('onlyOwned', e.target.value === 'owned' ? true : undefined);
            }}
            className="w-full px-3 py-2 border border-app-dark-600 rounded-md bg-app-dark-800 text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todos</option>
            <option value="owned">Solo mis contactos</option>
          </select>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 mt-6">
        <Button
          variant="outline"
          onClick={handleReset}
        >
          Limpiar
        </Button>
        <Button onClick={handleApply}>
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const ContactsFilters: React.FC<ContactsFiltersProps> = ({
  searchCriteria,
  onApplyFilters,
  hasActiveFilters
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = Object.keys(searchCriteria).filter(
    key => searchCriteria[key as keyof ContactSearchCriteria] !== undefined && 
           searchCriteria[key as keyof ContactSearchCriteria] !== ''
  ).length;

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className={hasActiveFilters ? 'border-primary-500 text-primary-400' : ''}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filtros
        {activeFilterCount > 0 && (
          <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-primary-900/50 text-primary-400">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-app-gray-400">Filtros activos:</span>
          {Object.entries(searchCriteria).map(([key, value]) => {
            if (!value && value !== false) return null;
            
            let displayValue = String(value);
            if (key === 'status' && CONTACT_STATUSES[value as ContactStatus]) {
              displayValue = CONTACT_STATUSES[value as ContactStatus];
            } else if (key === 'source' && CONTACT_SOURCES[value as keyof typeof CONTACT_SOURCES]) {
              displayValue = CONTACT_SOURCES[value as keyof typeof CONTACT_SOURCES];
            } else if (key === 'onlySystemUsers') {
              displayValue = value ? 'Con Portal' : 'Sin Portal';
            } else if (key === 'onlyOwned' && value) {
              displayValue = 'Mis contactos';
            }
            
            return (
              <span 
                key={key}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-900/50 text-primary-400"
              >
                {displayValue}
                <button
                  onClick={() => {
                    const newCriteria = { ...searchCriteria };
                    delete newCriteria[key as keyof ContactSearchCriteria];
                    onApplyFilters(newCriteria);
                  }}
                  className="ml-1 text-primary-300 hover:text-primary-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onApplyFilters({})}
            className="text-xs text-app-gray-400 hover:text-app-gray-200"
          >
            Limpiar todos
          </Button>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          searchCriteria={searchCriteria}
          onApplyFilters={onApplyFilters}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
};

export default ContactsFilters;