// src/components/pipelines/PipelineEditor.tsx
// ✅ VERSIÓN CORREGIDA - FORMULARIO FUNCIONAL
// PROBLEMA SOLUCIONADO: Removidos stopPropagation() que bloqueaban React Hook Form

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, Trash2, GripVertical, Settings, Target, 
  Save, X, CheckCircle
} from 'lucide-react';

// ============================================
// UI COMPONENTS
// ============================================
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FormField } from '@/components/forms/FormField';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

// ============================================
// HOOKS & SERVICES
// ============================================
import { 
  usePipelineOperations,
  usePipelineTypes 
} from '@/hooks/usePipelines';
import toast from 'react-hot-toast';

// ============================================
// TYPES
// ============================================
import type {
    PipelineDTO,
    UpdatePipelineRequest,
    StageCreateRequest,
    StageUpdateRequest
  } from '@/types/pipeline.types';
import { DEFAULT_STAGE_COLORS } from '@/types/pipeline.types';
import { cn } from '@/utils/cn';

// ============================================
// DEBOUNCE UTILITY
// ============================================
const debounce = <T extends (...args: any[]) => void>(func: T, wait: number): T => {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================
const StageSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'El nombre de la etapa es obligatorio').max(100),
  description: z.string().optional(),
  color: z.string().min(1, 'El color es obligatorio'),
  probability: z.number().min(0).max(100).optional(),
  isClosedWon: z.boolean().optional().default(false),
  isClosedLost: z.boolean().optional().default(false),
  orderIndex: z.number().min(0).optional().default(0),
});

const PipelineEditorSchema = z.object({
  name: z.string().min(1, 'El nombre del pipeline es obligatorio').max(255),
  description: z.string().max(1000).optional(),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  stages: z.array(StageSchema).min(1, 'Debe tener al menos una etapa'),
});

type PipelineEditorForm = z.infer<typeof PipelineEditorSchema>;

// ============================================
// COMPONENT PROPS
// ============================================
export interface PipelineEditorProps {
  pipeline: PipelineDTO;
  onSave?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  showActions?: boolean;
}

// ============================================
// CONTEXT PARA ESTADO DE EXPANSIÓN
// ============================================
interface StageExpansionContextType {
  expandedStages: Set<number>;
  toggleExpanded: (index: number) => void;
}

const StageExpansionContext = React.createContext<StageExpansionContextType>({
  expandedStages: new Set(),
  toggleExpanded: () => {}
});

// ============================================
// STAGE ITEM COMPONENT - CORREGIDO
// ============================================
// ============================================
// STAGE ITEM COMPONENT - CONECTADO DIRECTAMENTE A REACT HOOK FORM
// ============================================
interface StageItemProps {
    index: number;
    onDelete: () => void;
    control: any; // Control de React Hook Form
    isDragging?: boolean;
  }
  
  const StageItem: React.FC<StageItemProps> = React.memo(({ 
    index, 
    onDelete,
    control,
    isDragging = false 
  }) => {
    const { expandedStages, toggleExpanded } = React.useContext(StageExpansionContext);
    const isExpanded = expandedStages.has(index);
    
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
    const handleToggleExpanded = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleExpanded(index);
    }, [toggleExpanded, index]);
  
    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowDeleteConfirm(true);
    }, []);
  
    const handleConfirmDelete = useCallback(() => {
      onDelete();
      setShowDeleteConfirm(false);
    }, [onDelete]);
  
    return (
      <>
        <div className={cn(
          "border border-app-dark-600 bg-app-dark-700/50 rounded-lg transition-all duration-200",
          isDragging && "opacity-50 scale-95",
          isExpanded && "ring-2 ring-primary-500/20"
        )}>
          <div className="p-4">
            <div className="flex items-center gap-3">
              {/* Drag handle */}
              <div className="flex items-center gap-2">
                <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-app-dark-600 rounded">
                  <GripVertical className="h-4 w-4 text-app-gray-400" />
                </div>
                <Controller
                  name={`stages.${index}.color`}
                  control={control}
                  render={({ field }) => (
                    <div 
                      className="w-4 h-4 rounded border-2 border-app-dark-400"
                      style={{ backgroundColor: field.value || DEFAULT_STAGE_COLORS[index % DEFAULT_STAGE_COLORS.length] }}
                    />
                  )}
                />
              </div>
  
              {/* Stage info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  
                  {/* CAMPO NOMBRE - CONECTADO DIRECTAMENTE */}
                  <Controller
                    name={`stages.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        onFocus={(e) => e.target.select()}
                        className="font-medium bg-transparent border-none p-0 focus:bg-app-dark-600 focus:px-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        placeholder="Nombre de la etapa"
                      />
                    )}
                  />
                  
                  <Controller
                    name={`stages.${index}.probability`}
                    control={control}
                    render={({ field }) => (
                        <>
                        {field.value !== undefined && (
                            <Badge variant="outline" size="sm">
                            {field.value}%
                            </Badge>
                        )}
                        </>
                    )}
                  />
                </div>
                
                <Controller
                  name={`stages.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    field.value && (
                      <p className="text-sm text-app-gray-400 mt-1 truncate">
                        {field.value}
                      </p>
                    )
                  )}
                />
              </div>
  
              {/* Actions */}
              <div className="flex items-center gap-1">
                <Tooltip content="Configurar etapa">
                  <IconButton 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    onClick={handleToggleExpanded}
                    className={cn(
                      "transition-colors",
                      isExpanded && "bg-app-dark-600 text-primary-400"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip content="Eliminar etapa">
                  <IconButton 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    onClick={handleDeleteClick}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
  
            {/* Expanded settings */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-app-dark-600 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-app-gray-300 mb-1">
                      Descripción
                    </label>
                    <Controller
                      name={`stages.${index}.description`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="Describe esta etapa..."
                          className="text-sm"
                        />
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-app-gray-300 mb-1">
                      Probabilidad %
                    </label>
                    <Controller
                      name={`stages.${index}.probability`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          max="100"
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-sm"
                        />
                      )}
                    />
                  </div>
                </div>
  
                {/* Color picker */}
                <div>
                  <label className="block text-sm font-medium text-app-gray-300 mb-2">
                    Color de la etapa
                  </label>
                  <Controller
                    name={`stages.${index}.color`}
                    control={control}
                    render={({ field }) => (
                      <div className="flex gap-2 flex-wrap">
                        {DEFAULT_STAGE_COLORS.map((color, colorIndex) => (
                          <button
                            key={`color-${colorIndex}`}
                            type="button"
                            onClick={() => field.onChange(color)}
                            className={cn(
                              "w-8 h-8 rounded border-2 transition-all",
                              field.value === color 
                                ? "border-white scale-110" 
                                : "border-app-dark-400 hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  />
                </div>
  
                {/* Stage type flags */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Controller
                    name={`stages.${index}.isClosedWon`}
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            if (e.target.checked) {
                              // Reset isClosedLost cuando se marca isClosedWon
                              control.setValue(`stages.${index}.isClosedLost`, false);
                            }
                          }}
                          className="rounded border-app-dark-600 text-green-600 focus:ring-green-500"
                        />
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-app-gray-300">Etapa de cierre ganado</span>
                      </label>
                    )}
                  />
                  
                  <Controller
                    name={`stages.${index}.isClosedLost`}
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            if (e.target.checked) {
                              // Reset isClosedWon cuando se marca isClosedLost
                              control.setValue(`stages.${index}.isClosedWon`, false);
                            }
                          }}
                          className="rounded border-app-dark-600 text-red-600 focus:ring-red-500"
                        />
                        <X className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-app-gray-300">Etapa de cierre perdido</span>
                      </label>
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
  
        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmDelete}
          title="Eliminar Etapa"
          description="¿Estás seguro de que quieres eliminar esta etapa?"
          confirmLabel="Eliminar Etapa"
          cancelLabel="Cancelar"
        />
      </>
    );
  });

StageItem.displayName = 'StageItem';

// ============================================
// MAIN PIPELINE EDITOR COMPONENT
// ============================================
const PipelineEditor: React.FC<PipelineEditorProps> = ({
  pipeline,
  onSave,
  onCancel,
  loading = false,
  showActions = true,
}) => {
  // Estado global para expansión de etapas
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set());

  const toggleExpanded = useCallback((index: number) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const expansionContextValue = useMemo(() => ({
    expandedStages,
    toggleExpanded
  }), [expandedStages, toggleExpanded]);

  // Hooks
  const { updatePipeline, isUpdating } = usePipelineOperations();
  const { data: pipelineTypes, isLoading: isLoadingTypes } = usePipelineTypes();

  // Form setup
  const form = useForm<PipelineEditorForm>({
    resolver: zodResolver(PipelineEditorSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      name: '',
      description: '',
      isDefault: false,
      isActive: true,
      stages: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'stages',
  });

  // Cargar datos del pipeline
  useEffect(() => {
    if (pipeline) {
      console.log('Cargando pipeline en editor:', pipeline);
      
      form.reset({
        name: pipeline.name,
        description: pipeline.description || '',
        isActive: pipeline.isActive !== false,
        isDefault: pipeline.isDefault || false,
        stages: pipeline.stages?.map((stage, index) => ({
          id: stage.id,
          name: stage.name,
          description: stage.description || '',
          isClosedWon: stage.isWon || false,
          isClosedLost: stage.isLost || false,
          probability: stage.probability ?? undefined,
          orderIndex: stage.orderIndex ?? index,
          color: stage.color || DEFAULT_STAGE_COLORS[index % DEFAULT_STAGE_COLORS.length],
        })) || [],
      });
    }
  }, [pipeline, form]);

  // Handlers
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      if (typeof window !== 'undefined') {
        window.history.back();
      }
    }
  }, [onCancel]);
  
  const handleAddStage = useCallback(() => {
    const newOrder = fields.length;
    const defaultColor = DEFAULT_STAGE_COLORS[newOrder % DEFAULT_STAGE_COLORS.length];
    
    const newStage = {
      name: `Nueva Etapa ${newOrder + 1}`,
      orderIndex: newOrder,
      probability: Math.min(10 + (newOrder * 20), 90),
      color: defaultColor,
      isClosedWon: false,
      isClosedLost: false,
    };

    append(newStage);
  }, [fields.length, append]);

  const handleUpdateStage = useCallback((index: number, updates: Partial<PipelineEditorForm['stages'][0]>) => {
    const currentStage = fields[index];
    if (currentStage) {
      const newStage = { ...currentStage, ...updates };
      update(index, newStage);
    }
  }, [fields, update]);
  
  // Submit handler
  const handleSubmit = useCallback(async (data: PipelineEditorForm) => {
    console.log('Guardando pipeline con los siguientes datos del formulario:', data);
  
    try {
      if (!data.stages || data.stages.length === 0) {
        toast.error('Debe agregar al menos una etapa al pipeline');
        return;
      }
  
      // Preparar los datos para el backend
      const currentStageIds = new Set(data.stages.map(s => s.id).filter(id => id !== undefined));
      const originalStageIds = new Set(pipeline.stages.map(s => s.id));
      const stagesToDelete = [...originalStageIds].filter(id => !currentStageIds.has(id));
  
      const newStages: StageCreateRequest[] = [];
      const stageUpdates: StageUpdateRequest[] = [];

      data.stages.forEach((stage, index) => {
        const stagePayload = {
          name: stage.name,
          description: stage.description || undefined,
          position: (stage.orderIndex ?? index) + 1,
          color: stage.color,
          probability: stage.probability ?? undefined,
          isWon: stage.isClosedWon || false,
          isLost: stage.isClosedLost || false,
          active: true,
        };

        if (!stage.id) {
          newStages.push(stagePayload);
        } else {
          const originalStage = pipeline.stages.find(s => s.id === stage.id);
          stageUpdates.push({
            stageId: stage.id,
            version: originalStage?.version ?? 0,
            ...stagePayload
          });
        }
      });

      const request: UpdatePipelineRequest = {
        version: pipeline.version,
        name: data.name,
        description: data.description || undefined,
        isDefault: data.isDefault,
        active: data.isActive,
        stageUpdates: stageUpdates.length > 0 ? stageUpdates : undefined,
        newStages: newStages.length > 0 ? newStages : undefined,
        stageIdsToDelete: stagesToDelete.length > 0 ? stagesToDelete : undefined,
      };
  
      console.log('Enviando la siguiente petición de actualización:', request);
  
      await updatePipeline(pipeline.id, request, () => {
        toast.success(`Pipeline "${data.name}" actualizado exitosamente`);
        onSave?.();
      });
  
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      toast.error("Error al actualizar el pipeline. Por favor, inténtalo de nuevo.");
    }
  }, [pipeline, updatePipeline, onSave]);

  // Render
  return (
    <StageExpansionContext.Provider value={expansionContextValue}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Información básica del pipeline */}
        <div className="border border-app-dark-600 bg-app-dark-800/50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-medium text-app-gray-100 mb-4">
            Información Básica del Pipeline
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Nombre del Pipeline"
                  name="name"
                  required
                  error={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    placeholder="Ej: Pipeline de Ventas B2B"
                    className="w-full"
                  />
                </FormField>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-app-gray-300 mb-2">
                Tipo de Pipeline
              </label>
              <select
                disabled={isLoadingTypes}
                className="w-full rounded-md border-app-dark-600 bg-app-dark-700 text-app-gray-100 px-3 py-2"
              >
                <option value="SALES">Ventas</option>
                <option value="LEAD_NURTURING">Cultivo de Leads</option>
                <option value="SUPPORT">Soporte</option>
                <option value="CUSTOM">Personalizado</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Descripción (opcional)"
                  name="description"
                  error={fieldState.error?.message}
                >
                  <textarea
                    {...field}
                    placeholder="Describe el propósito y uso de este pipeline..."
                    rows={3}
                    className="w-full rounded-md border-app-dark-600 bg-app-dark-700 text-app-gray-100 px-3 py-2 resize-none"
                  />
                </FormField>
              )}
            />
          </div>

          {/* Configuración adicional */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mt-6">
            <h4 className="font-medium text-app-gray-200">Configuración</h4>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Controller
                name="isDefault"
                control={form.control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value || false}
                      onChange={field.onChange}
                      className="rounded border-app-dark-600 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-app-gray-300">Pipeline por defecto</span>
                  </label>
                )}
              />

              <Controller
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value !== false}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="rounded border-app-dark-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-app-gray-300">Pipeline activo</span>
                  </label>
                )}
              />
            </div>
          </div>
        </div>

        {/* Etapas del pipeline */}
        <div className="border border-app-dark-600 bg-app-dark-800/50 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-medium text-app-gray-100">
                Etapas del Pipeline ({fields.length})
              </h3>
              <p className="text-sm text-app-gray-400 mt-1">
                Configura las etapas por las que fluirán las oportunidades
              </p>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddStage}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Añadir Etapa
            </Button>
          </div>

          {/* Lista de etapas */}
          <div className="space-y-3">
          {fields.map((field, index) => (
  <StageItem
    key={`stage-${index}`}
    index={index}
    onDelete={() => remove(index)}
    control={form.control} // PASAR EL CONTROL
  />
))}
          </div>

          {/* Empty state */}
          {fields.length === 0 && (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-app-gray-400 mx-auto mb-3" />
              <p className="text-app-gray-400 mb-4">
                No hay etapas configuradas
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddStage}
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir Primera Etapa
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading || isUpdating(pipeline.id)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={loading || isUpdating(pipeline.id) || form.formState.isSubmitting}
              className="min-w-32 w-full sm:w-auto"
            >
              {loading || isUpdating(pipeline.id) || form.formState.isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar Cambios
            </Button>
          </div>
        )}
      </form>
    </StageExpansionContext.Provider>
  );
};

export default PipelineEditor;