// src/components/deals/DealForm.tsx
// ✅ DEAL FORM DE TALLA MUNDIAL - Con ContactSelector inteligente y tipos de oportunidad
// Cambio quirúrgico: Agregado campo type con validación robusta para pipelines BUSINESS

import React, { useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  DollarSign, Calendar, Building, Target, Save, X, AlertCircle, Workflow, FileText
} from 'lucide-react';

// ============================================
// TYPES - Importados desde la fuente de verdad
// ============================================
import type {
  Deal,
  DealDTO,
  CreateDealRequest,
  UpdateDealRequest,
  DealPriority,
  DealType
} from '@/types/deal.types';
import { DEAL_PRIORITY_LABELS, DEAL_TYPE_LABELS } from '@/types/deal.types';

// ✅ IMPORTS PARA TIPOS DE OPORTUNIDAD
import { getDealTypesForCategory, isValidDealType, categoryRequiresDealTypes } from '@/types/pipeline.types';

// ============================================
// UI COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FormField } from '@/components/forms/FormField';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

// ✅ CAMBIO QUIRÚRGICO: Importar el nuevo ContactSelector
import { ContactSelector } from '@/components/contacts/ContactSelector';

// ============================================
// HOOKS & SERVICES
// ============================================
import { pipelineApi } from '@/services/api/pipelineApi';

// import { contactApi } from '@/services/api/contactApi';
import { companyApi } from '@/services/api/companyApi';
import type { Contact } from '@/types/contact.types';

// ============================================
// VALIDATION SCHEMA - ✅ CORREGIDO CON PREPROCESSING
// ============================================

// ============================================
// VALIDATION SCHEMA - ✅ CORRECCIÓN FINAL
// ============================================

const dealFormSchema = z.object({
  // CAMPOS REQUERIDOS (matching CreateDealRequest)
  title: z.string()
    .min(1, 'El nombre de la oportunidad es requerido')
    .max(255, 'El nombre no puede exceder los 255 caracteres'),
  
  // ✅ PREPROCESSING: Los selects devuelven strings, convertimos a number
  pipelineId: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().positive('Debe seleccionar un pipeline')
  ),
  stageId: z.preprocess(
    // Si el valor es "falsy" (vacío, nulo, etc.), lo convertimos a null.
    (val) => (val === '' || val === null || val === undefined) ? null : Number(val),
    // Hacemos que Zod acepte explícitamente el tipo null.
    z.number({ required_error: 'Debe seleccionar una etapa' })
  ).nullable().optional(),
  contactId: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().positive('Debe seleccionar un contacto')
  ),
  
  // CAMPOS OPCIONALES (matching DealEditableFields)
  description: z.string().max(2000).optional(),
  
  // ✅ CAMPOS NUMÉRICOS: Preprocessing para manejar strings vacíos
  amount: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number().min(0, 'El monto no puede ser negativo').optional()
  ),
  probability: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number().min(0).max(100, 'La probabilidad debe ser entre 0 y 100').optional()
  ),
  companyId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number().optional()
  ),
  
  // CAMPOS DE TEXTO - ✅ CORRECCIÓN: Tipos exactos del backend
  expectedCloseDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).optional(),
  
  // ✅ CORRECCIÓN CRÍTICA: type debe ser DealType, no string genérico
  type: z.enum(['NEW_BUSINESS', 'EXISTING_BUSINESS', 'RENEWAL', 'UPSELL', 'CROSS_SELL'] as const).optional(),
  
  source: z.string().max(100).optional(),
  
  // CUSTOM FIELDS
  customFields: z.record(z.any()).optional(),
});

type DealFormData = z.infer<typeof dealFormSchema>;

// ============================================
// PROPS INTERFACE - Sin cambios
// ============================================

interface DealFormProps {
  deal?: DealDTO;
  initialValues?: Partial<CreateDealRequest>; // Para pre-llenar desde la URL
  onSubmit: (data: CreateDealRequest | UpdateDealRequest) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error?: string | null;
  mode: 'create' | 'edit';
  showActions?: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

const DealForm = React.forwardRef<HTMLFormElement, DealFormProps>(
  ({
    deal,
    initialValues,
    onSubmit,
    onCancel,
    loading,
    error,
    mode,
    showActions = true,
  }, ref) => {

    // ============================================
    // FORM SETUP - Sin cambios
    // ============================================
    const {
      register, control, handleSubmit,
      formState: { errors },
      watch, setValue,
    } = useForm<DealFormData>({
      resolver: zodResolver(dealFormSchema),
      defaultValues: useMemo(() => {
        const baseValues = mode === 'edit' ? deal : initialValues;
        return {
          title: baseValues?.title || '',
          description: baseValues?.description || '',
          pipelineId: baseValues?.pipelineId,
          stageId: baseValues?.stageId,
          contactId: baseValues?.contactId,
          companyId: baseValues?.companyId,
          amount: baseValues?.amount,
          probability: baseValues?.probability,
          expectedCloseDate: baseValues?.expectedCloseDate?.split('T')[0] || '',
          priority: baseValues?.priority || 'MEDIUM',
          // ✅ CAMBIO QUIRÚRGICO: Asegura que el valor por defecto sea 'undefined' si no hay tipo.
          type: baseValues?.type || undefined,
          source: baseValues?.source || '',
          customFields: (baseValues as Deal)?.customFields || {},
        };
      }, [deal, initialValues, mode]),
    });
    
    const selectedPipelineId = watch('pipelineId');

    // ============================================
    // DATA FETCHING PARA SELECTS
    // ✅ CAMBIO QUIRÚRGICO: Removido contactApi query, ahora ContactSelector maneja su propia lógica
    // ============================================
    const { data: pipelines, isLoading: isLoadingPipelines } = useQuery({
      queryKey: ['pipelinesForSelect'],
      queryFn: () => pipelineApi.searchPipelines({ isActive: true }, { page: 0, size: 100, sort: ['name,asc'] }),
      select: (data) => data.content,
    });

    {/* COMENTAR TEMPORALMENTE PARA PROBAR HERENCIA AUTOMÁTICA: Se guarda la empresa
      desde el Backend con la misma empresa del contact
    const { data: companies, isLoading: isLoadingCompanies } = useQuery({
        queryKey: ['companiesForSelect'],
        queryFn: () => companyApi.searchCompanies(
          { active: true }, // ✅ CORRECCIÓN: de 'isActive' a 'active'
          { page: 0, size: 1000, sort: ['name,asc'] }
        ),
        select: (data) => data.content,
      });
    */}
    
    const stageOptions = useMemo(() => {
      if (!selectedPipelineId || !pipelines) return [];
      const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
      return selectedPipeline?.stages.map(s => ({ value: s.id.toString(), label: s.name })) || [];
    }, [selectedPipelineId, pipelines]);

    // ✅ NUEVO: Opciones de tipo de oportunidad según pipeline seleccionado
    const dealTypeOptions = useMemo(() => {
      if (!selectedPipelineId || !pipelines) return [];
      
      const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
      if (!selectedPipeline) return [];
      
      const availableTypes = getDealTypesForCategory(selectedPipeline.category);
      return availableTypes.map(type => ({ value: type, label: type }));
    }, [selectedPipelineId, pipelines]);

    // ✅ NUEVO: useEffect para sincronizar el tipo en modo edición
    useEffect(() => {
      // Sync form values when editing and data loads
      if (mode === 'edit' && deal && pipelines) {
        const dealPipeline = pipelines.find(p => p.id === deal.pipelineId);
        if (dealPipeline && deal.type) {
          setValue('type', deal.type, { shouldValidate: true });
        }
      }
    }, [deal, pipelines, mode, setValue]);

    // ✅ NUEVO: Reset del tipo cuando cambia el pipeline
    useEffect(() => {
      if (selectedPipelineId) {
        // ✅ CORRECCIÓN QUIRÚRGICA: Resetea el valor a 'undefined' en lugar de ''.
        setValue('type', undefined, { shouldValidate: true });
      }
    }, [selectedPipelineId, setValue]);

    // ============================================
    // HANDLERS - ✅ VERSIÓN FINAL ROBUSTA
    // ============================================
    const handleFormSubmit = async (data: DealFormData) => {
      // Validaciones de negocio (perfectas como están)
      const selectedPipeline = pipelines?.find(p => p.id === data.pipelineId);
      if (selectedPipeline && categoryRequiresDealTypes(selectedPipeline.category) && !data.type) {
        toast.error('Debe seleccionar un Tipo de Oportunidad para este pipeline.');
        return;
      }
      // ...
  
      // ✅ PASO 1: Construir un payload base con los campos comunes.
      // TypeScript puede inferir este tipo correctamente.
      const payload = {
          title: data.title,
          description: data.description,
          pipelineId: data.pipelineId,
          stageId: data.stageId,
          contactId: data.contactId,
          companyId: data.companyId,
          amount: data.amount,
          probability: data.probability,
          expectedCloseDate: data.expectedCloseDate,
          priority: data.priority,
          type: data.type,
          source: data.source,
          customFields: data.customFields,
      };
  
      if (mode === 'edit' && deal) {
          // ✅ PASO 2: Crear el objeto final para 'update' y asegurar su tipo.
          const updateData: UpdateDealRequest = {
            ...payload,
            version: deal.version,
          };
          await onSubmit(updateData);
      } else {
          // ✅ PASO 3: Crear el objeto final para 'create' y asegurar su tipo.
          const createData: CreateDealRequest = payload;
          await onSubmit(createData);
      }
    };

    return (
      <form ref={ref} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center">
            <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {/* --- SECCIÓN PRINCIPAL --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Nombre de la Oportunidad" name="title" required icon={<Target />} error={errors.title?.message}>
            <Input {...register('title')} placeholder="Ej: Desarrollo de nuevo website" />
          </FormField>
          
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <FormField label="Monto Estimado" name="amount" icon={<DollarSign />} error={errors.amount?.message}>
                <Input type="number" placeholder="1000000" {...field} value={field.value || ''} />
              </FormField>
            )}
          />

          <Controller
            name="pipelineId"
            control={control}
            render={({ field }) => (
              <FormField label="Pipeline" name="pipelineId" required icon={<Workflow />} error={errors.pipelineId?.message}>
                <Select
                  options={pipelines?.map(p => ({ value: p.id.toString(), label: p.name })) || []}
                  value={field.value?.toString() || ''}
                  onValueChange={(val) => {
                    field.onChange(val);
                    setValue('stageId', null); // Reset stage on pipeline change
                  }}
                  placeholder={isLoadingPipelines ? 'Cargando...' : 'Seleccionar pipeline...'}
                  disabled={isLoadingPipelines}
                />
              </FormField>
            )}
          />

          <Controller
            name="stageId"
            control={control}
            render={({ field }) => (
              <FormField label="Etapa" name="stageId" required icon={<FileText />} error={errors.stageId?.message}>
                <Select
                  options={stageOptions}
                  value={field.value?.toString() || ''}
                  onValueChange={field.onChange}
                  placeholder={!selectedPipelineId ? 
                    'Primero selecciona un pipeline' : 
                    stageOptions.length === 0 ? 'No hay etapas disponibles' : 'Seleccionar etapa...'
                  }
                  disabled={!selectedPipelineId || stageOptions.length === 0}
                />
              </FormField>
            )}
          />

          {/* ✅ NUEVO CAMPO: Tipo de Oportunidad (solo para pipelines BUSINESS) */}
          {dealTypeOptions.length > 0 && (
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormField 
                  label="Tipo de Oportunidad" 
                  name="type" 
                  error={errors.type?.message}
                  helpText="Define la naturaleza comercial de esta oportunidad"
                >
                  <Select
                    options={dealTypeOptions}
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    placeholder="Seleccionar tipo..."
                    clearable
                  />
                </FormField>
              )}
            />
          )}

          <Controller
            name="contactId"
            control={control}
            render={({ field }) => (
              <FormField label="Contacto Principal" name="contactId" required error={errors.contactId?.message}>
                <ContactSelector
                  // ✅ Usa la prop 'value' para el ID
                  value={field.value || null}
                  
                  // ✅ Usa 'onValueChange' para actualizar el formulario
                  onValueChange={field.onChange}
                  
                  // ✅ Usa la nueva 'onContactSelect' para la lógica de herencia
                  onContactSelect={(contact: Contact) => {
                    // La herencia automática ahora funciona perfectamente
                    if (contact.companyId && !watch('companyId')) {
                      setValue('companyId', contact.companyId, { shouldValidate: true });
                    }
                  }}
                  
                  placeholder="Buscar contacto por nombre..."
                  className="w-full"
                  
                  // ✅ Pasa el mensaje de error, no un booleano
                  error={errors.contactId?.message}
                  
                  disabled={loading}
                  allowClear={false}
                  onCreateNew={() => {
                    console.log('TODO: Abrir modal crear contacto');
                  }}
                />
              </FormField>
            )}
          />

          <Controller
            name="probability"
            control={control}
            render={({ field }) => (
              <FormField label="Probabilidad %" name="probability" error={errors.probability?.message}>
                <Input type="number" min="0" max="100" placeholder="50" {...field} value={field.value || ''} />
              </FormField>
            )}
          />

          <Controller
            name="expectedCloseDate"
            control={control}
            render={({ field }) => (
              <FormField label="Fecha de Cierre Esperada" name="expectedCloseDate" icon={<Calendar />} error={errors.expectedCloseDate?.message}>
                <Input type="date" {...field} />
              </FormField>
            )}
          />
        </div>

        {/* --- SECCIÓN DE DETALLES --- */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-app-gray-100">Detalles Adicionales</h3>
          
          <FormField label="Descripción" name="description" error={errors.description?.message}>
            <textarea 
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 border border-app-gray-600 rounded-lg bg-app-dark-800 text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Describe los detalles de esta oportunidad..."
            />
          </FormField>

          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <FormField label="Fuente" name="source" error={errors.source?.message}>
                <Input {...field} placeholder="Ej: Website, Referido, Evento..." />
              </FormField>
            )}
          />
        </div>

        {showActions && (
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-app-dark-700">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="min-w-32">
              {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {mode === 'create' ? 'Crear Oportunidad' : 'Actualizar Oportunidad'}
            </Button>
          </div>
        )}
      </form>
    );
  }
);

DealForm.displayName = 'DealForm';

export default DealForm;