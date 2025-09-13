// src/components/deals/DealsFilters.tsx
// ✅ DEALS FILTERS - Filtros avanzados para oportunidades
// Mobile-first + Formulario colapsible + Múltiples criterios

import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Filter, 
  Calendar, 
  DollarSign, 
  Target,
  RotateCcw
} from 'lucide-react';

// ============================================
// UI COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/forms/FormField';

// ============================================
// HOOKS & UTILS
// ============================================
import { useDebounce } from '@/hooks/useDebounce'; // ✅ RECOMENDACIÓN 1
import { cn } from '@/utils/cn';

// ============================================
// TYPES & UTILS
// ============================================
import type { 
    DealSearchCriteria
  } from '@/types/deal.types';
  
  // Segundo, importa los VALORES (las constantes)
  import { 
    DEAL_STATUS_LABELS,
    DEAL_PRIORITY_LABELS,
    DEAL_TYPE_LABELS 
  } from '@/types/deal.types';

// ============================================
// VALIDATION SCHEMA
// ============================================

const dealFiltersSchema = z.object({
  status: z.enum(['OPEN', 'WON', 'LOST']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  type: z.enum(['NEW_BUSINESS', 'EXISTING_BUSINESS', 'RENEWAL', 'UPSELL', 'CROSS_SELL']).optional(),
  source: z.string().optional(),
  
  // Filtros de relaciones
  pipelineId: z.number().optional(),
  stageId: z.number().optional(),
  contactId: z.number().optional(),
  companyId: z.number().optional(),
  
  // Filtros de ownership
  onlyOwned: z.boolean().optional(),
  ownerCognitoSub: z.string().optional(),
  
  // Filtros de fechas
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  expectedCloseFrom: z.string().optional(),
  expectedCloseTo: z.string().optional(),
  
  // Filtros de montos
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  
  // Filtros de probabilidad
  minProbability: z.number().min(0).max(100).optional(),
  maxProbability: z.number().min(0).max(100).optional(),
  
  // Filtros de actividad
  hasActivities: z.boolean().optional(),
  
  // Filtros de health y risk
  minHealthScore: z.number().min(0).max(100).optional(),
  maxHealthScore: z.number().min(0).max(100).optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
});

type DealFiltersForm = z.infer<typeof dealFiltersSchema>;

// ============================================
// TYPES
// ============================================

interface DealsFiltersProps {
  onFiltersChange: (criteria: DealSearchCriteria) => void;
  initialFilters?: Partial<DealSearchCriteria>;
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const DealsFilters: React.FC<DealsFiltersProps> = ({
  onFiltersChange,
  initialFilters = {},
  className,
}) => {
  // ============================================
  // STATE
  // ============================================
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // ============================================
  // FORM SETUP
  // ============================================
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty }
  } = useForm<DealFiltersForm>({
    resolver: zodResolver(dealFiltersSchema),
    defaultValues: {
      status: initialFilters.status,
      priority: initialFilters.priority,
      type: initialFilters.type,
      source: initialFilters.source,
      onlyOwned: initialFilters.onlyOwned || false,
      hasActivities: initialFilters.hasActivities,
      minAmount: initialFilters.minAmount,
      maxAmount: initialFilters.maxAmount,
      minProbability: initialFilters.minProbability,
      maxProbability: initialFilters.maxProbability,
      minHealthScore: initialFilters.minHealthScore,
      maxHealthScore: initialFilters.maxHealthScore,
      riskLevel: initialFilters.riskLevel,
      createdFrom: initialFilters.createdFrom,
      createdTo: initialFilters.createdTo,
      expectedCloseFrom: initialFilters.expectedCloseFrom,
      expectedCloseTo: initialFilters.expectedCloseTo,
    }
  });

  // Watch all form values para aplicar filtros en tiempo real
  const watchedValues = watch();

  // ✅ RECOMENDACIÓN 1: Debounce para filtros
  const debouncedFilters = useDebounce(watchedValues, 500);

  // ============================================
  // OPTIONS PARA SELECTS
  // ============================================
  const statusOptions = Object.entries(DEAL_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const priorityOptions = Object.entries(DEAL_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const typeOptions = Object.entries(DEAL_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const riskLevelOptions = [
    { value: 'low', label: 'Bajo' },
    { value: 'medium', label: 'Medio' },
    { value: 'high', label: 'Alto' },
  ];

  // ============================================
  // HANDLERS
  // ============================================
  const handleApplyFilters = useCallback((data: DealFiltersForm) => {
    // Convertir form data a DealSearchCriteria
    const criteria: DealSearchCriteria = {
      ...data,
      // Remover valores undefined/null/empty
      ...Object.fromEntries(
        Object.entries(data).filter(([_, value]) => 
          value !== undefined && value !== null && value !== ''
        )
      )
    };
    
    onFiltersChange(criteria);
  }, [onFiltersChange]);

  const handleReset = useCallback(() => {
    reset();
    onFiltersChange({});
  }, [reset, onFiltersChange]);

  const handleToggleAdvanced = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  // ✅ RECOMENDACIÓN 1: Aplicar filtros con debounce
  React.useEffect(() => {
    if (isDirty) {
      handleSubmit(handleApplyFilters)();
    }
  }, [debouncedFilters, handleSubmit, handleApplyFilters, isDirty]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={cn('bg-app-dark-800 border border-app-dark-600 rounded-lg p-4', className)}>
      <form onSubmit={handleSubmit(handleApplyFilters)} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-app-gray-400" />
            <h3 className="text-sm font-medium text-white">Filtros de Oportunidades</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleToggleAdvanced}
            >
              {showAdvanced ? 'Menos filtros' : 'Más filtros'}
            </Button>
            
            {isDirty && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={RotateCcw}
                onClick={handleReset}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Filtros básicos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Estado */}
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Estado"
                options={statusOptions}
                value={field.value || ''}
                onValueChange={field.onChange}
                placeholder="Todos los estados"
                clearable
                size="sm"
              />
            )}
          />

          {/* Prioridad */}
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select
                label="Prioridad"
                options={priorityOptions}
                value={field.value || ''}
                onValueChange={field.onChange}
                placeholder="Todas las prioridades"
                clearable
                size="sm"
              />
            )}
          />

          {/* Tipo */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                label="Tipo"
                options={typeOptions}
                value={field.value || ''}
                onValueChange={field.onChange}
                placeholder="Todos los tipos"
                clearable
                size="sm"
              />
            )}
          />

          {/* Solo mis oportunidades */}
          <Controller
            name="onlyOwned"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="onlyOwned"
                  checked={field.value || false}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="rounded border-app-dark-600 bg-app-dark-700 text-app-accent-500 focus:ring-app-accent-500"
                />
                <label htmlFor="onlyOwned" className="text-sm text-app-gray-300">
                  Solo mis oportunidades
                </label>
              </div>
            )}
          />
        </div>

        {/* Filtros avanzados */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-app-dark-600">
            {/* Filtros de montos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="minAmount"
                control={control}
                render={({ field, fieldState }) => ( // ✅ CORREGIDO: Extraer fieldState
                  <FormField
                    label="Monto mínimo"
                    name="minAmount"
                    icon={<DollarSign className="h-4 w-4" />}
                    error={fieldState.error?.message} // ✅ CORREGIDO: Usar fieldState.error
                  >
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numberValue = parseInt(value, 10);
                        field.onChange(isNaN(numberValue) ? undefined : numberValue);
                      }}
                      size="sm"
                    />
                  </FormField>
                )}
              />

              <Controller
                name="maxAmount"
                control={control}
                render={({ field, fieldState }) => ( // ✅ CORREGIDO: Extraer fieldState
                  <FormField
                    label="Monto máximo"
                    name="maxAmount"
                    icon={<DollarSign className="h-4 w-4" />}
                    error={fieldState.error?.message} // ✅ CORREGIDO: Usar fieldState.error
                  >
                    <Input
                      type="number"
                      placeholder="Sin límite"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numberValue = parseInt(value, 10);
                        field.onChange(isNaN(numberValue) ? undefined : numberValue);
                      }}
                      size="sm"
                    />
                  </FormField>
                )}
              />
            </div>

            {/* Filtros de probabilidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="minProbability"
                control={control}
                render={({ field, fieldState }) => ( // ✅ CORREGIDO: Extraer fieldState
                  <FormField
                    label="Probabilidad mínima (%)"
                    name="minProbability"
                    icon={<Target className="h-4 w-4" />}
                    error={fieldState.error?.message} // ✅ CORREGIDO: Usar fieldState.error
                  >
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numberValue = parseInt(value, 10);
                        field.onChange(isNaN(numberValue) ? undefined : numberValue);
                      }}
                      size="sm"
                    />
                  </FormField>
                )}
              />

              <Controller
                name="maxProbability"
                control={control}
                render={({ field, fieldState }) => ( // ✅ CORREGIDO: Extraer fieldState
                  <FormField
                    label="Probabilidad máxima (%)"
                    name="maxProbability"
                    icon={<Target className="h-4 w-4" />}
                    error={fieldState.error?.message} // ✅ CORREGIDO: Usar fieldState.error
                  >
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="100"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numberValue = parseInt(value, 10);
                        field.onChange(isNaN(numberValue) ? undefined : numberValue);
                      }}
                      size="sm"
                    />
                  </FormField>
                )}
              />
            </div>

            {/* Filtros de fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="expectedCloseFrom"
                control={control}
                render={({ field, fieldState }) => ( // ✅ CORREGIDO: Extraer fieldState
                  <FormField
                    label="Cierre esperado desde"
                    name="expectedCloseFrom"
                    icon={<Calendar className="h-4 w-4" />}
                    error={fieldState.error?.message} // ✅ CORREGIDO: Usar fieldState.error
                  >
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                      onChange={field.onChange}
                      size="sm"
                    />
                  </FormField>
                )}
              />

              <Controller
                name="expectedCloseTo"
                control={control}
                render={({ field, fieldState }) => ( // ✅ CORREGIDO: Extraer fieldState
                  <FormField
                    label="Cierre esperado hasta"
                    name="expectedCloseTo"
                    icon={<Calendar className="h-4 w-4" />}
                    error={fieldState.error?.message} // ✅ CORREGIDO: Usar fieldState.error
                  >
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                      onChange={field.onChange}
                      size="sm"
                    />
                  </FormField>
                )}
              />
            </div>

            {/* Filtros adicionales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Controller
                name="riskLevel"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Nivel de riesgo"
                    options={riskLevelOptions}
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    placeholder="Todos los niveles"
                    clearable
                    size="sm"
                  />
                )}
              />

              <Controller
                name="hasActivities"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="hasActivities"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="rounded border-app-dark-600 bg-app-dark-700 text-app-accent-500 focus:ring-app-accent-500"
                    />
                    <label htmlFor="hasActivities" className="text-sm text-app-gray-300">
                      Con actividades
                    </label>
                  </div>
                )}
              />

              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Fuente"
                    placeholder="Ej: Website, Referido..."
                    value={field.value || ''}
                    onChange={field.onChange}
                    size="sm"
                  />
                )}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default DealsFilters;