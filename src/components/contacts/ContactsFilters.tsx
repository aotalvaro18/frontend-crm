// src/components/contacts/ContactsFilters.tsx
// ✅ CONTACTS FILTERS - ENTERPRISE FILTER PANEL
// Smart component con todos los filtros de ContactSearchCriteria + Mobile-first

import React, { useState, useCallback } from 'react';
import { 
  X, 
  Filter, 
  RotateCcw, 
  Calendar,
  Building2,
  User,
  Target,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ============================================
// UI COMPONENTS
// ============================================

import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ContactStatusBadge } from '@/components/shared/ContactStatusBadge';
import { SelectDropdown } from '@/components/ui/Dropdown';
import { Checkbox, CheckboxGroup } from '@/components/ui/Checkbox';
import { QuickSearch } from '@/components/ui/SearchInput';
import { DatePicker } from '@/components/ui/DatePicker';

// ============================================
// TYPES
// ============================================

import type { 
  ContactSearchCriteria,
  ContactStatus,
  ContactSource,
  Gender,
  LifecycleStage,
  ContactPriority,
  DigitalPortalStatus
} from '@/types/contact.types';

import { 
  CONTACT_STATUS_LABELS,
  CONTACT_SOURCE_LABELS,
  GENDER_LABELS
} from '@/types/contact.types';

// ============================================
// UTILS
// ============================================

import { cn } from '@/utils/cn';

// ============================================
// COMPONENT PROPS
// ============================================

export interface ContactsFiltersProps {
  searchCriteria: ContactSearchCriteria;
  onCriteriaChange: (criteria: ContactSearchCriteria) => void;
  onClose?: () => void;
  className?: string;
  collapsible?: boolean;
  showActiveCount?: boolean;
}

// ============================================
// FILTER CONFIGURATIONS
// ============================================

const statusOptions = Object.entries(CONTACT_STATUS_LABELS).map(([value, label]) => ({
  value: value as ContactStatus,
  label,
}));

const sourceOptions = Object.entries(CONTACT_SOURCE_LABELS).map(([value, label]) => ({
  value: value as ContactSource,
  label,
}));

const genderOptions = Object.entries(GENDER_LABELS).map(([value, label]) => ({
  value: value as Gender,
  label,
}));

const lifecycleStageOptions = [
  { value: 'SUBSCRIBER' as LifecycleStage, label: 'Suscriptor' },
  { value: 'LEAD' as LifecycleStage, label: 'Lead' },
  { value: 'MARKETING_QUALIFIED_LEAD' as LifecycleStage, label: 'MQL' },
  { value: 'SALES_QUALIFIED_LEAD' as LifecycleStage, label: 'SQL' },
  { value: 'OPPORTUNITY' as LifecycleStage, label: 'Oportunidad' },
  { value: 'CUSTOMER' as LifecycleStage, label: 'Cliente' },
  { value: 'EVANGELIST' as LifecycleStage, label: 'Evangelista' },
  { value: 'OTHER' as LifecycleStage, label: 'Otro' },
];

const priorityOptions = [
  { value: 'URGENT' as ContactPriority, label: 'Urgente' },
  { value: 'HIGH' as ContactPriority, label: 'Alta' },
  { value: 'MEDIUM' as ContactPriority, label: 'Media' },
  { value: 'LOW' as ContactPriority, label: 'Baja' },
];

const portalStatusOptions = [
  { value: 'NOT_INVITED' as DigitalPortalStatus, label: 'No invitado' },
  { value: 'INVITATION_SENT' as DigitalPortalStatus, label: 'Invitación enviada' },
  { value: 'REGISTERED' as DigitalPortalStatus, label: 'Registrado' },
  { value: 'ACTIVE' as DigitalPortalStatus, label: 'Activo' },
  { value: 'INACTIVE' as DigitalPortalStatus, label: 'Inactivo' },
  { value: 'BLOCKED' as DigitalPortalStatus, label: 'Bloqueado' },
];

const engagementRanges = [
  { value: 'very_high', label: 'Muy Alto (80-100)', min: 80, max: 100 },
  { value: 'high', label: 'Alto (60-79)', min: 60, max: 79 },
  { value: 'medium', label: 'Medio (40-59)', min: 40, max: 59 },
  { value: 'low', label: 'Bajo (20-39)', min: 20, max: 39 },
  { value: 'very_low', label: 'Muy Bajo (0-19)', min: 0, max: 19 },
];

// ============================================
// FILTER SECTIONS CONFIGURATION
// ============================================

interface FilterSection {
  id: string;
  title: string;
  icon: React.ElementType;
  defaultExpanded?: boolean;
  priority: number; // Para ordenamiento
}

const filterSections: FilterSection[] = [
  { 
    id: 'basic', 
    title: 'Filtros Básicos', 
    icon: Filter, 
    defaultExpanded: true, 
    priority: 1 
  },
  { 
    id: 'demographic', 
    title: 'Demográficos', 
    icon: User, 
    defaultExpanded: false, 
    priority: 2 
  },
  { 
    id: 'engagement', 
    title: 'Engagement', 
    icon: Target, 
    defaultExpanded: false, 
    priority: 3 
  },
  { 
    id: 'portal', 
    title: 'Portal Digital', 
    icon: Globe, 
    defaultExpanded: false, 
    priority: 4 
  },
  { 
    id: 'dates', 
    title: 'Fechas', 
    icon: Calendar, 
    defaultExpanded: false, 
    priority: 5 
  },
  { 
    id: 'organization', 
    title: 'Organización', 
    icon: Building2, 
    defaultExpanded: false, 
    priority: 6 
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

const ContactsFilters: React.FC<ContactsFiltersProps> = ({
  searchCriteria,
  onCriteriaChange,
  onClose,
  className,
  collapsible = true,
  showActiveCount = true,
}) => {
  // ============================================
  // LOCAL STATE
  // ============================================

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(filterSections.filter(section => section.defaultExpanded).map(s => s.id))
  );

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const activeFiltersCount = Object.keys(searchCriteria).filter(key => {
    const value = searchCriteria[key as keyof ContactSearchCriteria];
    return value !== undefined && value !== null && value !== '';
  }).length;

  const hasActiveFilters = activeFiltersCount > 0;

  // ============================================
  // HANDLERS
  // ============================================

  const updateCriteria = useCallback((updates: Partial<ContactSearchCriteria>) => {
    onCriteriaChange({ ...searchCriteria, ...updates });
  }, [searchCriteria, onCriteriaChange]);

  const clearAllFilters = useCallback(() => {
    onCriteriaChange({});
  }, [onCriteriaChange]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleEngagementRangeSelect = useCallback((range: typeof engagementRanges[0]) => {
    updateCriteria({
      minEngagementScore: range.min,
      maxEngagementScore: range.max,
    });
  }, [updateCriteria]);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderSectionHeader = (section: FilterSection) => (
    <button
      type="button"
      onClick={() => toggleSection(section.id)}
      className={cn(
        'flex items-center justify-between w-full p-3',
        'text-left font-medium text-app-gray-200',
        'hover:bg-app-dark-700 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-app-accent-500 rounded-md'
      )}
    >
      <div className="flex items-center space-x-2">
        <section.icon className="h-4 w-4 text-app-gray-400" />
        <span>{section.title}</span>
      </div>
      {collapsible && (
        expandedSections.has(section.id) ? 
          <ChevronUp className="h-4 w-4 text-app-gray-400" /> : 
          <ChevronDown className="h-4 w-4 text-app-gray-400" />
      )}
    </button>
  );

  const renderBasicFilters = () => (
    <div className="space-y-4 p-3">
      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          Estado
        </label>
        <SelectDropdown
          value={searchCriteria.status || ''}
          placeholder="Todos los estados"
          options={statusOptions}
          onChange={(value) => updateCriteria({ status: value as ContactStatus })}
          fullWidth
        />
      </div>

      {/* Source */}
      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          Origen
        </label>
        <SelectDropdown
          value={searchCriteria.source || ''}
          placeholder="Todos los orígenes"
          options={sourceOptions}
          onChange={(value) => updateCriteria({ source: value as ContactSource })}
          fullWidth
        />
      </div>

      {/* Lifecycle Stage */}
      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          Etapa del Ciclo
        </label>
        <SelectDropdown
          value={searchCriteria.lifecycleStage || ''}
          placeholder="Todas las etapas"
          options={lifecycleStageOptions}
          onChange={(value) => updateCriteria({ lifecycleStage: value as LifecycleStage })}
          fullWidth
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          Prioridad
        </label>
        <SelectDropdown
          value={searchCriteria.priority || ''}
          placeholder="Todas las prioridades"
          options={priorityOptions}
          onChange={(value) => updateCriteria({ priority: value as ContactPriority })}
          fullWidth
        />
      </div>
    </div>
  );

  const renderDemographicFilters = () => (
    <div className="space-y-4 p-3">
      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          Género
        </label>
        <SelectDropdown
          value={searchCriteria.gender || ''}
          placeholder="Todos los géneros"
          options={genderOptions}
          onChange={(value) => updateCriteria({ gender: value as Gender })}
          fullWidth
        />
      </div>

      {/* Location filters */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-app-gray-300 mb-2">
            Ciudad
          </label>
          <QuickSearch
            value={searchCriteria.city || ''}
            onChange={(e) => updateCriteria({ city: e.target.value })}
            placeholder="Ciudad..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-app-gray-300 mb-2">
            Estado/Provincia
          </label>
          <QuickSearch
            value={searchCriteria.state || ''}
            onChange={(e) => updateCriteria({ state: e.target.value })}
            placeholder="Estado..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          País
        </label>
        <QuickSearch
          value={searchCriteria.country || ''}
          onChange={(e) => updateCriteria({ country: e.target.value })}
          placeholder="País..."
        />
      </div>
    </div>
  );

  const renderEngagementFilters = () => (
    <div className="space-y-4 p-3">
      {/* Engagement Score Ranges */}
      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          Nivel de Engagement
        </label>
        <div className="space-y-2">
          {engagementRanges.map((range) => {
            const isSelected = searchCriteria.minEngagementScore === range.min && 
                             searchCriteria.maxEngagementScore === range.max;
            
            return (
              <button
                key={range.value}
                type="button"
                onClick={() => handleEngagementRangeSelect(range)}
                className={cn(
                  'w-full text-left p-2 rounded-md transition-colors',
                  'border border-app-dark-600',
                  isSelected 
                    ? 'bg-app-accent-500/10 border-app-accent-500 text-app-accent-400'
                    : 'hover:bg-app-dark-700 text-app-gray-300'
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          Actividad Reciente
        </label>
        <Checkbox
          checked={searchCriteria.hasRecentActivity || false}
          onChange={(checked) => updateCriteria({ hasRecentActivity: checked })}
          label="Con actividad en los últimos 30 días"
        />
      </div>
    </div>
  );

  const renderPortalFilters = () => (
    <div className="space-y-4 p-3">
      {/* Has Digital Portal */}
      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          Acceso al Portal
        </label>
        <CheckboxGroup
          options={[
            { value: 'has_portal', label: 'Tiene acceso al portal' },
            { value: 'no_portal', label: 'Sin acceso al portal' },
          ]}
          value={
            searchCriteria.hasDigitalPortal === true ? ['has_portal'] :
            searchCriteria.hasDigitalPortal === false ? ['no_portal'] : []
          }
          onChange={(values) => {
            if (values.includes('has_portal')) {
              updateCriteria({ hasDigitalPortal: true });
            } else if (values.includes('no_portal')) {
              updateCriteria({ hasDigitalPortal: false });
            } else {
              updateCriteria({ hasDigitalPortal: undefined });
            }
          }}
          orientation="vertical"
        />
      </div>

      {/* Portal Status */}
      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          Estado del Portal
        </label>
        <SelectDropdown
          value={searchCriteria.digitalPortalStatus || ''}
          placeholder="Todos los estados"
          options={portalStatusOptions}
          onChange={(value) => updateCriteria({ digitalPortalStatus: value as DigitalPortalStatus })}
          fullWidth
        />
      </div>
    </div>
  );

  const renderDateFilters = () => (
    <div className="space-y-4 p-3">
      {/* Created Date Range */}
      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          Fecha de Creación
        </label>
        <div className="grid grid-cols-2 gap-2">
          <DatePicker
            value={searchCriteria.createdFrom || ''}
            onChange={(value) => updateCriteria({ createdFrom: value })}
            placeholder="Desde..."
            size="sm"
          />
          <DatePicker
            value={searchCriteria.createdTo || ''}
            onChange={(value) => updateCriteria({ createdTo: value })}
            placeholder="Hasta..."
            size="sm"
          />
        </div>
      </div>

      {/* Last Activity Date Range */}
      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          Última Actividad
        </label>
        <div className="grid grid-cols-2 gap-2">
          <DatePicker
            value={searchCriteria.lastActivityFrom || ''}
            onChange={(value) => updateCriteria({ lastActivityFrom: value })}
            placeholder="Desde..."
            size="sm"
          />
          <DatePicker
            value={searchCriteria.lastActivityTo || ''}
            onChange={(value) => updateCriteria({ lastActivityTo: value })}
            placeholder="Hasta..."
            size="sm"
          />
        </div>
      </div>
    </div>
  );

  const renderOrganizationFilters = () => (
    <div className="space-y-4 p-3">
      {/* Company Filter */}
      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          Empresa
        </label>
        <div className="space-y-2">
          <Checkbox
            checked={searchCriteria.hasCompany || false}
            onChange={(checked) => updateCriteria({ hasCompany: checked })}
            label="Contactos con empresa asignada"
          />
        </div>
      </div>

      {/* Owner/Assignment */}
      <div>
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          Asignación
        </label>
        <CheckboxGroup
          options={[
            { value: 'only_owned', label: 'Solo mis contactos' },
            { value: 'only_assigned', label: 'Solo asignados a mí' },
            { value: 'only_system_users', label: 'Solo usuarios del sistema' },
          ]}
          value={[
            ...(searchCriteria.onlyOwned ? ['only_owned'] : []),
            ...(searchCriteria.onlyAssigned ? ['only_assigned'] : []),
            ...(searchCriteria.onlySystemUsers ? ['only_system_users'] : []),
          ]}
          onChange={(values) => {
            updateCriteria({
              onlyOwned: values.includes('only_owned'),
              onlyAssigned: values.includes('only_assigned'),
              onlySystemUsers: values.includes('only_system_users'),
            });
          }}
          orientation="vertical"
        />
      </div>
    </div>
  );

  const renderSectionContent = (section: FilterSection) => {
    switch (section.id) {
      case 'basic': return renderBasicFilters();
      case 'demographic': return renderDemographicFilters();
      case 'engagement': return renderEngagementFilters();
      case 'portal': return renderPortalFilters();
      case 'dates': return renderDateFilters();
      case 'organization': return renderOrganizationFilters();
      default: return null;
    }
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className={cn(
      'bg-app-dark-800 border border-app-dark-600 rounded-lg overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-app-dark-600 bg-app-dark-750">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-app-gray-400" />
          <h3 className="font-medium text-app-gray-200">Filtros</h3>
          {showActiveCount && hasActiveFilters && (
            <Badge variant="info" size="sm">
              {activeFiltersCount} activo{activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Clear all filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              leftIcon={<RotateCcw className="h-3 w-3" />}
              className="text-app-gray-400 hover:text-white"
            >
              Limpiar
            </Button>
          )}

          {/* Close button */}
          {onClose && (
            <IconButton
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Cerrar filtros"
            >
              <X className="h-4 w-4" />
            </IconButton>
          )}
        </div>
      </div>

      {/* Filter Sections */}
      <div className="max-h-96 overflow-y-auto">
        {filterSections
          .sort((a, b) => a.priority - b.priority)
          .map((section) => {
            const isExpanded = !collapsible || expandedSections.has(section.id);
            
            return (
              <div key={section.id} className="border-b border-app-dark-600 last:border-b-0">
                {renderSectionHeader(section)}
                
                {isExpanded && (
                  <div className="border-t border-app-dark-700">
                    {renderSectionContent(section)}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="p-3 border-t border-app-dark-600 bg-app-dark-750">
          <div className="text-xs text-app-gray-400 mb-2">Filtros activos:</div>
          <div className="flex flex-wrap gap-1">
            {searchCriteria.status && (
              <ContactStatusBadge status={searchCriteria.status} />
            )}
            {searchCriteria.source && (
              <Badge variant="secondary" size="sm">
                {CONTACT_SOURCE_LABELS[searchCriteria.source]}
              </Badge>
            )}
            {searchCriteria.hasDigitalPortal !== undefined && (
              <Badge variant="portal" size="sm">
                {searchCriteria.hasDigitalPortal ? 'Con Portal' : 'Sin Portal'}
              </Badge>
            )}
            {(searchCriteria.minEngagementScore !== undefined || searchCriteria.maxEngagementScore !== undefined) && (
              <Badge variant="info" size="sm">
                Engagement: {searchCriteria.minEngagementScore}-{searchCriteria.maxEngagementScore}
              </Badge>
            )}
            {/* Agregar más badges según sea necesario */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsFilters;