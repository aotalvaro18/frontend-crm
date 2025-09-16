// src/components/activities/ActivityFormModal.tsx
// ✅ CORRECCIÓN QUIRÚRGICA: Mapeo correcto de campos para backend
// ✅ VALIDADO: Schema y request alineados con ActivityController.java

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
// ✅ CORRECCIÓN 1: VALIDATION SCHEMA con nombres correctos del backend
// ============================================
const activityFormSchema = z.object({
  type: z.string().min(1, 'El tipo de actividad es requerido'),
  subject: z.string().min(1, 'El asunto es requerido').max(255),              // ✅ 'subject' no 'title'
  scheduledAt: z.string().min(1, 'La fecha es requerida'),                   // ✅ 'scheduledAt' no 'activityDate'
  description: z.string().max(2000).optional(),
  dealId: z.preprocess((val) => val ? Number(val) : undefined, z.number().optional()),
  assigneeCognitoSub: z.string().optional(),                                 // ✅ 'assigneeCognitoSub' no 'assignedToCognitoSub'
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

  // ✅ CORRECCIÓN 2: Reset con nombres correctos de campos
  useEffect(() => {
    if (isOpen) {
      // ✅ Generar fecha por defecto en formato correcto
      const defaultScheduledAt = activityToEdit?.scheduledAt 
        ? new Date(activityToEdit.scheduledAt).toISOString().slice(0, 16) 
        : new Date().toISOString().slice(0, 16);

      const defaultValues = {
        type: activityToEdit?.type || DEFAULT_ACTIVITY_TYPE,
        subject: activityToEdit?.subject || '',                              // ✅ 'subject'
        scheduledAt: defaultScheduledAt,                                     // ✅ 'scheduledAt'
        description: activityToEdit?.description || '',
        contactId: contactId,
        dealId: activityToEdit?.dealId || dealId,
        assigneeCognitoSub: activityToEdit?.assigneeCognitoSub || '',        // ✅ 'assigneeCognitoSub'
      };
      reset(defaultValues);
    }
  }, [isOpen, activityToEdit, contactId, dealId, reset]);

  // ============================================
  // DATA FETCHING PARA SELECTS
  // ============================================
  const { data: users, isLoading: isLoadingUsers } = useActiveUsers();
  const { data: deals, isLoading: isLoadingDeals } = useDealsByContact(
    contactId!,
    {
      enabled: !!contactId, 
    }
  );

  const { data: companyContacts, isLoading: isLoadingCompanyContacts } = useContactsByCompany(
    companyId,
    { enabled: !!companyId && !contactId } 
  );

  const activityTypeOptions = Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  const userOptions = useMemo(() => users?.map(u => ({ value: u.cognitoSub, label: u.displayName || u.name || u.email })) || [], [users]);
  const dealOptions = useMemo(() => deals?.map(d => ({ value: d.id.toString(), label: d.title })) || [], [deals]);

  // ============================================
  // ✅ CORRECCIÓN 3: HANDLERS con mapeo correcto
  // ============================================
  const handleFormSubmit = async (data: ActivityFormData) => {
    try {
      if (mode === 'create') {
        // Validación: Al menos uno de los IDs de contexto debe estar presente
        if (!contactId && !dealId && !companyId) {
            toast.error("No se puede crear una actividad sin un contexto (Contacto, Oportunidad o Empresa).");
            return;
        }

        // ✅ CORRECCIÓN CRÍTICA: Mapear campos correctamente para el backend
        const request: CreateActivityRequest = {
          type: data.type as ActivityType,
          subject: data.subject,                    // ✅ Mapeo correcto
          scheduledAt: data.scheduledAt,            // ✅ Mapeo correcto
          description: data.description,
          contactId: contactId,
          dealId: data.dealId || dealId,
          companyId: companyId,
          assigneeCognitoSub: data.assigneeCognitoSub || undefined,  // ✅ Mapeo correcto
        };
        
        console.log('🚀 Enviando request de actividad:', request); // Debug log
        await createActivity(request, onSuccess);
        
      } else if (activityToEdit) {
        const request: UpdateActivityRequest = {
          type: data.type as ActivityType,
          subject: data.subject,                    // ✅ Mapeo correcto
          scheduledAt: data.scheduledAt,            // ✅ Mapeo correcto  
          description: data.description,
          dealId: data.dealId,
          assigneeCognitoSub: data.assigneeCognitoSub || undefined, // ✅ Mapeo correcto
          version: activityToEdit.version,
        };
        await updateActivity(activityToEdit.id, request, onSuccess);
      }
    } catch (error) {
      console.error('❌ Error en handleFormSubmit:', error);
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

            {/* ✅ CORRECCIÓN 4: Campo scheduledAt con nombre correcto */}
            <Controller
              name="scheduledAt"
              control={control}
              render={({ field }) => (
                <FormField label="Fecha y Hora" name="scheduledAt" required error={errors.scheduledAt?.message}>
                  <Input type="datetime-local" {...field} />
                </FormField>
              )}
            />
          </div>

          {/* ✅ CORRECCIÓN 5: Campo subject con nombre correcto */}
          <FormField label="Asunto" name="subject" required error={errors.subject?.message}>
            <Input {...register('subject')} placeholder="Ej: Llamada de seguimiento sobre propuesta" />
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

            {/* ✅ CORRECCIÓN 6: Campo assigneeCognitoSub con nombre correcto */}
            <Controller
              name="assigneeCognitoSub"
              control={control}
              render={({ field }) => (
                <FormField label="Asignado a (Opcional)" name="assigneeCognitoSub" icon={<User />} error={errors.assigneeCognitoSub?.message}>
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