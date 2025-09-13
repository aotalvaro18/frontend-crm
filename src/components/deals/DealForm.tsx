// src/components/deals/DealForm.tsx
// ✅ DEAL FORM DE TALLA MUNDIAL - Basado en el "Golden Standard" de CompanyForm
// Lógica de formulario robusta, validación con Zod, y componentes de UI reutilizables.

import React, { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  DollarSign, Calendar, User, Building, Target, Save, X, AlertCircle, Workflow, FileText
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

// ============================================
// UI COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FormField } from '@/components/forms/FormField';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

// ============================================
// HOOKS & SERVICES
// ============================================
import { pipelineApi } from '@/services/api/pipelineApi';
import { contactApi } from '@/services/api/contactApi';
import { companyApi } from '@/services/api/companyApi';

// ============================================
// VALIDATION SCHEMA - Adaptado para Deals
// ============================================

const dealFormSchema = z.object({
  title: z.string()
    .min(1, 'El nombre de la oportunidad es requerido')
    .max(255, 'El nombre no puede exceder los 255 caracteres'),
  
  description: z.string().max(2000).optional(),
  
  // IDs de relaciones - Requeridos
  pipelineId: z.preprocess(Number, z.number().positive('Debe seleccionar un pipeline')),
  stageId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number({ required_error: 'Debe seleccionar una etapa' })
  ).optional(),
  contactId: z.preprocess(Number, z.number().positive('Debe seleccionar un contacto')),
  companyId: z.preprocess(Number, z.number().optional()),

  // Campos financieros
  amount: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'El monto no puede ser negativo').optional()
  ),
  probability: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number({ invalid_type_error: 'Debe ser un número' }).min(0).max(100, 'La probabilidad debe ser entre 0 y 100').optional()
  ),
  expectedCloseDate: z.string().optional(),

  // Campos de clasificación
  priority: z.string().optional(),
  type: z.string().optional(),
  source: z.string().max(100).optional(),

  customFields: z.record(z.any()).optional(),
});

type DealFormData = z.infer<typeof dealFormSchema>;

// ============================================
// PROPS INTERFACE
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
    // FORM SETUP
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
          expectedCloseDate: baseValues?.expectedCloseDate?.split('T')[0] || '', // Formato YYYY-MM-DD
          priority: baseValues?.priority || 'MEDIUM',
          type: baseValues?.type,
          source: baseValues?.source || '',
          customFields: (baseValues as Deal)?.customFields || {},
        };
      }, [deal, initialValues, mode]),
    });
    
    const selectedPipelineId = watch('pipelineId');

    // ============================================
    // DATA FETCHING PARA SELECTS
    // ============================================
    const { data: pipelines, isLoading: isLoadingPipelines } = useQuery({
      queryKey: ['pipelinesForSelect'],
      queryFn: () => pipelineApi.searchPipelines({ isActive: true }, { page: 0, size: 100, sort: ['name,asc'] }),
      select: (data) => data.content,
    });

    const { data: contacts, isLoading: isLoadingContacts } = useQuery({
      queryKey: ['contactsForSelect'],
      queryFn: () => contactApi.searchContacts({ status: 'ACTIVE' }, { page: 0, size: 100, sort: ['name,asc'] }),
      select: (data) => data.content,
    });

    const { data: companies, isLoading: isLoadingCompanies } = useQuery({
        queryKey: ['companiesForSelect'],
        queryFn: () => companyApi.searchCompanies(
          { active: true }, // ✅ CORRECCIÓN: de 'isActive' a 'active'
          { page: 0, size: 1000, sort: ['name,asc'] }
        ),
        select: (data) => data.content,
      });
    
    const stageOptions = useMemo(() => {
      if (!selectedPipelineId || !pipelines) return [];
      const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
      return selectedPipeline?.stages.map(s => ({ value: s.id.toString(), label: s.name })) || [];
    }, [selectedPipelineId, pipelines]);

    // ============================================
    // HANDLERS
    // ============================================
    const handleFormSubmit = async (data: DealFormData) => {
        const payload = {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        pipelineId: data.pipelineId,
        stageId: data.stageId,
        contactId: data.contactId,
        companyId: data.companyId,
        amount: data.amount,
        probability: data.probability,
        expectedCloseDate: data.expectedCloseDate || undefined,
        priority: data.priority as DealPriority,
        type: data.type as DealType,
        source: data.source?.trim() || undefined,
        customFields: data.customFields,
      };

      if (mode === 'edit' && deal) {
        const updateData: UpdateDealRequest = {
          ...payload,
          version: deal.version,
        };
        await onSubmit(updateData);
      } else {
        if (payload.pipelineId === undefined || payload.stageId === undefined || payload.contactId === undefined) {
            console.error("Error de lógica: Faltan IDs requeridos en el formulario de creación.");
            toast.error("Faltan datos requeridos. Por favor, revisa el pipeline, la etapa y el contacto.");
            return;
          }
      
          // Ahora TypeScript sabe que pipelineId, stageId y contactId son 'number'.
          const createData: CreateDealRequest = payload as CreateDealRequest;
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
                    setValue('stageId', undefined, { shouldValidate: true }); // Reset stage on pipeline change
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
                  placeholder={!selectedPipelineId ? 'Primero elige un pipeline' : 'Seleccionar etapa...'}
                  disabled={!selectedPipelineId || stageOptions.length === 0}
                />
              </FormField>
            )}
          />

          <Controller
            name="contactId"
            control={control}
            render={({ field }) => (
              <FormField label="Contacto Principal" name="contactId" required icon={<User />} error={errors.contactId?.message}>
                <Select
                  options={contacts?.map(c => ({ value: c.id.toString(), label: `${c.firstName} ${c.lastName}` })) || []}
                  value={field.value?.toString() || ''}
                  onValueChange={field.onChange}
                  placeholder={isLoadingContacts ? 'Cargando...' : 'Seleccionar contacto...'}
                  disabled={isLoadingContacts}
                />
              </FormField>
            )}
          />

          <Controller
            name="companyId"
            control={control}
            render={({ field }) => (
              <FormField label="Empresa (Opcional)" name="companyId" icon={<Building />} error={errors.companyId?.message}>
                <Select
                  options={companies?.map(c => ({ value: c.id.toString(), label: c.name })) || []}
                  value={field.value?.toString() || ''}
                  onValueChange={field.onChange}
                  placeholder={isLoadingCompanies ? 'Cargando...' : 'Seleccionar empresa...'}
                  disabled={isLoadingCompanies}
                  clearable
                />
              </FormField>
            )}
          />
        </div>
        
        {/* --- SECCIÓN ADICIONAL --- */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-app-gray-100 border-b border-app-dark-700 pb-2">Información Adicional</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Controller
              name="expectedCloseDate"
              control={control}
              render={({ field }) => (
                <FormField label="Fecha de Cierre Esperada" name="expectedCloseDate" icon={<Calendar />} error={errors.expectedCloseDate?.message}>
                  <Input type="date" {...field} />
                </FormField>
              )}
            />
            
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <FormField label="Prioridad" name="priority" error={errors.priority?.message}>
                  <Select
                    options={Object.entries(DEAL_PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
                    value={field.value || ''}
                    onValueChange={field.onChange}
                  />
                </FormField>
              )}
            />
            
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormField label="Tipo de Oportunidad" name="type" error={errors.type?.message}>
                  <Select
                    options={Object.entries(DEAL_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    placeholder="Seleccionar tipo..."
                    clearable
                  />
                </FormField>
              )}
            />
          </div>
          <FormField label="Descripción" name="description" error={errors.description?.message}>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Añade detalles sobre la oportunidad, necesidades del cliente, próximos pasos, etc."
            />
          </FormField>
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