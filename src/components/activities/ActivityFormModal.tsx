// src/components/activities/ActivityFormModal.tsx
// ✅ ACTIVITY FORM MODAL DE TALLA MUNDIAL
// Reutilizable, contextual, y alineado con la arquitectura existente.

import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { X, Save, Activity as ActivityIcon, User, Target } from 'lucide-react';

// ============================================
// TYPES & CONSTANTS
// ============================================
import type { ActivityDTO, ActivityType, CreateActivityRequest, UpdateActivityRequest } from '@/types/activity.types';
import { ACTIVITY_TYPE_LABELS, DEFAULT_ACTIVITY_TYPE } from '@/types/activity.types';

// ============================================
// HOOKS & SERVICES
// ============================================
import { useActivityOperations } from '@/hooks/useActivities';
import { useActiveUsers } from '@/hooks/useUsers';
import { useDealsByContact } from '@/hooks/useDeals'; // Para el selector de deals
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useContactsByCompany } from '@/hooks/useContacts';

// ============================================
// UI COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/forms/FormField';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

// ============================================
// VALIDATION SCHEMA
// ============================================
const activityFormSchema = z.object({
  type: z.string().min(1, 'El tipo de actividad es requerido'),
  title: z.string().min(1, 'El asunto es requerido').max(255),
  activityDate: z.string().min(1, 'La fecha es requerida'),
  description: z.string().max(2000).optional(),
  dealId: z.preprocess((val) => val ? Number(val) : undefined, z.number().optional()),
  assignedToCognitoSub: z.string().optional(),
  contactId: z.preprocess((val) => val ? Number(val) : undefined, z.number().optional()),
});

type ActivityFormData = z.infer<typeof activityFormSchema>;

// ============================================
// PROPS INTERFACE
// ============================================
interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  
  // Contexto para pre-llenar
  contactId?: number;
  dealId?: number;
  companyId?: number;
  
  // Para modo edición
  activityToEdit?: ActivityDTO | null;
}

// ============================================
// MAIN COMPONENT
// ============================================
const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contactId,
  dealId,
  companyId,
  activityToEdit,
}) => {
  const { createActivity, updateActivity, isCreating, isUpdating } = useActivityOperations();
  const { handleError } = useErrorHandler();

  const mode = activityToEdit ? 'edit' : 'create';
  const isLoading = isCreating || (activityToEdit ? isUpdating(activityToEdit.id) : false);

  // ============================================
  // FORM SETUP
  // ============================================
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
  });

  // Resetear el formulario cuando el modal se abre o cambia la actividad a editar
  useEffect(() => {
    if (isOpen) {
      const defaultValues = {
        type: activityToEdit?.type || DEFAULT_ACTIVITY_TYPE,
        title: activityToEdit?.title || '',
        activityDate: (activityToEdit?.activityDate || new Date().toISOString()).split('T')[0],
        description: activityToEdit?.description || '',
        contactId: contactId,
        dealId: activityToEdit?.dealId || dealId,
        assignedToCognitoSub: activityToEdit?.assignedToCognitoSub,
      };
      reset(defaultValues);
    }
  }, [isOpen, activityToEdit, contactId, dealId, reset]);

  // ============================================
  // DATA FETCHING PARA SELECTS
  // ============================================
  const { data: users, isLoading: isLoadingUsers } = useActiveUsers();
  const { data: deals, isLoading: isLoadingDeals } = useDealsByContact(
    contactId!, // 1. El '!' le dice a TypeScript: "Confía en mí, no será nulo aquí"
    {
      // 2. 'enabled' es la barrera de seguridad. La query solo se ejecuta si contactId es un número válido.
      enabled: !!contactId, 
    }
  );

  const { data: companyContacts, isLoading: isLoadingCompanyContacts } = useContactsByCompany(
    companyId,
    // Solo ejecuta esta query si estamos en el contexto de una compañía y NO tenemos un contacto predefinido
    { enabled: !!companyId && !contactId } 
  );

  const activityTypeOptions = Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  const userOptions = useMemo(() => users?.map(u => ({ value: u.cognitoSub, label: u.displayName || u.name || u.email })) || [], [users]);
  const dealOptions = useMemo(() => deals?.map(d => ({ value: d.id.toString(), label: d.title })) || [], [deals]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleFormSubmit = async (data: ActivityFormData) => {
    try {
      if (mode === 'create') {
        // Validación: Al menos uno de los IDs de contexto debe estar presente
        if (!contactId && !dealId && !companyId) {
            toast.error("No se puede crear una actividad sin un contexto (Contacto, Oportunidad o Empresa).");
            return;
        }

        const request: CreateActivityRequest = {
          ...data,
          contactId,
          dealId,
          companyId,
          type: data.type as ActivityType,
        };
        await createActivity(request, onSuccess);
      } else if (activityToEdit) {
        const request: UpdateActivityRequest = {
          ...data,
          version: activityToEdit.version,
          type: data.type as ActivityType,
        };
        await updateActivity(activityToEdit.id, request, onSuccess);
      }
    } catch (error) {
      handleError(error, `Error al ${mode === 'create' ? 'crear' : 'actualizar'} la actividad`);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-app-dark-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-app-dark-600 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-dark-600 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <ActivityIcon className="h-5 w-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">
              {mode === 'create' ? 'Nueva Actividad' : 'Editar Actividad'}
            </h2>
          </div>
          <button onClick={onClose} disabled={isLoading} className="p-2 hover:bg-app-dark-700 rounded-full">
            <X className="h-5 w-5 text-app-gray-400" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {!contactId && companyId && (
                <Controller
                name="contactId"
                control={control}
                render={({ field }) => (
                    <FormField label="Asociar a Contacto" name="contactId" required error={errors.contactId?.message}>
                    <Select
                        options={companyContacts?.map(c => ({ value: c.id.toString(), label: `${c.firstName} ${c.lastName}` })) || []}
                        value={field.value?.toString() || ''}
                        onValue-Change={field.onChange}
                        placeholder={isLoadingCompanyContacts ? 'Cargando contactos...' : 'Seleccionar un contacto...'}
                        disabled={isLoadingCompanyContacts}
                    />
                    </FormField>
                )}
                />
            )}

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormField label="Tipo" name="type" required error={errors.type?.message}>
                  <Select
                    options={activityTypeOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormField>
              )}
            />

            <Controller
              name="activityDate"
              control={control}
              render={({ field }) => (
                <FormField label="Fecha y Hora" name="activityDate" required error={errors.activityDate?.message}>
                  <Input type="datetime-local" {...field} />
                </FormField>
              )}
            />
          </div>

          <FormField label="Asunto" name="title" required error={errors.title?.message}>
            <Input {...register('title')} placeholder="Ej: Llamada de seguimiento sobre propuesta" />
          </FormField>

          <FormField label="Descripción / Notas" name="description" error={errors.description?.message}>
            <Input
                {...register('description')}
                variant="textarea"
                rows={5}
                placeholder="Añade detalles, resultados o próximos pasos..."
            />
          </FormField>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Controller
              name="dealId"
              control={control}
              render={({ field }) => (
                <FormField label="Oportunidad Asociada (Opcional)" name="dealId" icon={<Target />} error={errors.dealId?.message}>
                  <Select
                    options={dealOptions}
                    value={field.value?.toString() || ''}
                    onValueChange={field.onChange}
                    placeholder={isLoadingDeals ? 'Cargando...' : 'Ninguna'}
                    disabled={isLoadingDeals}
                    clearable
                  />
                </FormField>
              )}
            />

            <Controller
              name="assignedToCognitoSub"
              control={control}
              render={({ field }) => (
                <FormField label="Asignado a (Opcional)" name="assignedToCognitoSub" icon={<User />} error={errors.assignedToCognitoSub?.message}>
                  <Select
                    options={userOptions}
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    placeholder={isLoadingUsers ? 'Cargando...' : 'Usuario actual'}
                    disabled={isLoadingUsers}
                    clearable
                  />
                </FormField>
              )}
            />
          </div>

          {/* Botones de acción dentro del formulario */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-app-dark-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} loading={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Guardar Actividad' : 'Actualizar Actividad'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ActivityFormModal;