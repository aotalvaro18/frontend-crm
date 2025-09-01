// src/components/pipelines/PipelineEditor.tsx
// ✅ PIPELINE EDITOR - Componente central para crear/editar pipelines con drag-and-drop
// Siguiendo los patrones de formularios existentes pero con funcionalidad avanzada

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, Trash2, GripVertical, Settings, Target, 
  Percent, Save,
  X, AlertCircle, CheckCircle, Info
} from 'lucide-react';

// ============================================
// UI COMPONENTS - Reutilizando componentes existentes
// ============================================

import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FormField } from '@/components/forms/FormField';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

// ============================================
// HOOKS - Siguiendo patrón Slice Vertical
// ============================================
import { 
  usePipelineOperations,
  usePipelineStageOperations,
  usePipelineTypes 
} from '@/hooks/usePipelines';

// ============================================
// TYPES
// ============================================
import type {
  PipelineDTO,
  CreatePipelineRequest,
  UpdatePipelineRequest,
  CreatePipelineStageRequest
} from '@/types/pipeline.types';

import { 
    DEFAULT_STAGE_COLORS // <-- Importa la constante como un VALOR
  } from '@/types/pipeline.types';

import { cn } from '@/utils/cn';

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

const StageSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'El nombre de la etapa es obligatorio').max(50, 'Máximo 50 caracteres'),
  description: z.string().max(200, 'Máximo 200 caracteres').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
  probability: z.number().min(0).max(100).optional(),
  isClosedWon: z.boolean().optional(),
  isClosedLost: z.boolean().optional(),
  order: z.number(),
});

const PipelineEditorSchema = z.object({
  name: z.string().min(2, 'El nombre del pipeline es obligatorio').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  type: z.string().optional(),
  stages: z.array(StageSchema).min(2, 'Un pipeline debe tener al menos 2 etapas').max(20, 'Máximo 20 etapas'),
});

type PipelineEditorForm = z.infer<typeof PipelineEditorSchema>;

// ============================================
// COMPONENT PROPS
// ============================================
interface PipelineEditorProps {
  pipeline?: PipelineDTO;
  mode: 'create' | 'edit';
  onSave?: (pipeline: PipelineDTO) => void;
  onCancel?: () => void;
  loading?: boolean;
  showActions?: boolean;
}

// ============================================
// STAGE ITEM COMPONENT (Componente interno para cada etapa)
// ============================================
interface StageItemProps {
  stage: PipelineEditorForm['stages'][0];
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (updates: Partial<PipelineEditorForm['stages'][0]>) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isDragging?: boolean;
}

const StageItem: React.FC<StageItemProps> = ({ 
  stage, 
  index, 
  onUpdate, 
  onDelete,
  isDragging = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleColorChange = (color: string) => {
    onUpdate({ color });
  };

  const getStageIcon = () => {
    if (stage.isClosedWon) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (stage.isClosedLost) return <X className="h-4 w-4 text-red-500" />;
    return <Target className="h-4 w-4 text-blue-500" />;
  };

  return (
    <>
      <div className={cn(
        "border-app-dark-600 bg-app-dark-700/50 transition-all duration-200",
        isDragging && "opacity-50 scale-95",
        isExpanded && "ring-2 ring-primary-500/20"
      )}>
        {/* Header de la etapa */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Drag handle */}
            <div className="flex items-center gap-2">
              <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-app-dark-600 rounded">
                <GripVertical className="h-4 w-4 text-app-gray-400" />
              </div>
              <div 
                className="w-4 h-4 rounded border-2 border-app-dark-400"
                style={{ backgroundColor: stage.color || DEFAULT_STAGE_COLORS[index % DEFAULT_STAGE_COLORS.length] }}
              />
            </div>

            {/* Stage info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {getStageIcon()}
                <Input
                  value={stage.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  className="font-medium bg-transparent border-none p-0 focus:bg-app-dark-600 focus:px-2 focus:border-primary-500"
                  placeholder="Nombre de la etapa"
                />
                {stage.probability !== undefined && (
                  <Badge variant="outline" size="sm">
                    {stage.probability}%
                  </Badge>
                )}
              </div>
              
              {stage.description && (
                <p className="text-sm text-app-gray-400 mt-1">{stage.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Tooltip content="Configurar etapa">
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <Settings className="h-4 w-4" />
                </IconButton>
              </Tooltip>
              
              <Tooltip content="Eliminar etapa">
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Panel expandido de configuración */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-app-dark-600 bg-app-dark-800/30">
            <div className="pt-4 space-y-4">
              {/* Descripción */}
              <FormField label="Descripción (opcional)" name={`stage-description-${index}`}>
                <Input
                  value={stage.description || ''}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="Descripción opcional de la etapa"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                {/* Probabilidad */}
                <FormField label="Probabilidad de Cierre (%)" name={`stage-probability-${index}`}>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={stage.probability || ''}
                      onChange={(e) => onUpdate({ probability: Number(e.target.value) || 0 })}
                      placeholder="0-100"
                      className="flex-1"
                    />
                    <Percent className="h-4 w-4 text-app-gray-400" />
                  </div>
                </FormField>

                {/* Color */}
                <FormField label="Color de la Etapa" name={`stage-color-${index}`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={stage.color || DEFAULT_STAGE_COLORS[index % DEFAULT_STAGE_COLORS.length]}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-8 h-8 border border-app-dark-600 rounded cursor-pointer"
                    />
                    <Input
                      value={stage.color || DEFAULT_STAGE_COLORS[index % DEFAULT_STAGE_COLORS.length]}
                      onChange={(e) => handleColorChange(e.target.value)}
                      placeholder="#FF5733"
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </FormField>
              </div>

              {/* Opciones de cierre */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage.isClosedWon || false}
                    onChange={(e) => onUpdate({ 
                      isClosedWon: e.target.checked,
                      // Si se marca como ganado, desmarcar perdido
                      ...(e.target.checked && { isClosedLost: false })
                    })}
                    className="rounded border-app-dark-600 text-green-600 focus:ring-green-500"
                  />
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-app-gray-300">Etapa de cierre ganado</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage.isClosedLost || false}
                    onChange={(e) => onUpdate({ 
                      isClosedLost: e.target.checked,
                      // Si se marca como perdido, desmarcar ganado
                      ...(e.target.checked && { isClosedWon: false })
                    })}
                    className="rounded border-app-dark-600 text-red-600 focus:ring-red-500"
                  />
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-app-gray-300">Etapa de cierre perdido</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete();
          setShowDeleteConfirm(false);
        }}
        title="Eliminar Etapa"
        description={`¿Estás seguro de que quieres eliminar la etapa "${stage.name}"?`}
      />
    </>
  );
};

// ============================================
// MAIN PIPELINE EDITOR COMPONENT
// ============================================
const PipelineEditor: React.FC<PipelineEditorProps> = ({
  pipeline,
  mode,
  onSave,
  onCancel,
  loading = false,
  showActions = true,
}) => {
  // ============================================
  // HOOKS
  // ============================================
  const { createPipeline, updatePipeline, isCreating } = usePipelineOperations();
  const { reorderingStages } = usePipelineStageOperations();
  const { data: pipelineTypes, isLoading: isLoadingTypes } = usePipelineTypes();

  // ============================================
  // FORM SETUP
  // ============================================
  const form = useForm<PipelineEditorForm>({
    resolver: zodResolver(PipelineEditorSchema),
    defaultValues: {
      name: '',
      description: '',
      isDefault: false,
      isActive: true,
      type: 'SALES',
      stages: [
        { name: 'Prospecto', order: 0, probability: 10, color: DEFAULT_STAGE_COLORS[0] },
        { name: 'Calificado', order: 1, probability: 25, color: DEFAULT_STAGE_COLORS[1] },
      ],
    },
  });

  const { fields, append, remove, move, update } = useFieldArray({
    control: form.control,
    name: 'stages',
  });

  // ============================================
  // EFFECTS - Sincronizar con datos del pipeline existente
  // ============================================
  useEffect(() => {
    if (pipeline && mode === 'edit') {
      form.reset({
        name: pipeline.name,
        description: pipeline.description || '',
        isDefault: pipeline.isDefault || false,
        isActive: pipeline.isActive !== false, // Default true
        type: pipeline.type || 'SALES',
        stages: pipeline.stages?.map((stage, index) => ({
          id: stage.id,
          name: stage.name,
          description: stage.description,
          color: stage.color || DEFAULT_STAGE_COLORS[index % DEFAULT_STAGE_COLORS.length],
          probability: stage.probability,
          isClosedWon: stage.isClosedWon,
          isClosedLost: stage.isClosedLost,
          order: stage.order || index,
        })) || [],
      });
    }
  }, [pipeline, mode, form]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleAddStage = () => {
    const newOrder = fields.length;
    const defaultColor = DEFAULT_STAGE_COLORS[newOrder % DEFAULT_STAGE_COLORS.length];
    
    append({
      name: `Nueva Etapa ${newOrder + 1}`,
      order: newOrder,
      probability: Math.min(10 + (newOrder * 20), 90),
      color: defaultColor,
    });
  };

  const handleUpdateStage = (index: number, updates: Partial<PipelineEditorForm['stages'][0]>) => {
    update(index, { ...fields[index], ...updates });
  };

  const handleMoveStage = (fromIndex: number, toIndex: number) => {
    move(fromIndex, toIndex);
    
    // Actualizar los orders después del movimiento
    const currentValues = form.getValues('stages');
    currentValues.forEach((stage, index) => {
      update(index, { ...stage, order: index });
    });
  };

  const handleSubmit = async (data: PipelineEditorForm) => {
    try {
      // Preparar stages con orders actualizados
      const stagesWithOrder = data.stages.map((stage, index) => ({
        ...stage,
        order: index,
      }));

      if (mode === 'create') {
        const request: CreatePipelineRequest = {
          name: data.name,
          description: data.description,
          isDefault: data.isDefault,
          isActive: data.isActive,
          stages: stagesWithOrder.map(({ id, ...stage }) => stage as CreatePipelineStageRequest),
        };

        await createPipeline(request, (newPipeline) => {
          onSave?.(newPipeline);
        });
      } else if (pipeline) {
        const request: UpdatePipelineRequest = {
          name: data.name,
          description: data.description,
          isDefault: data.isDefault,
          isActive: data.isActive,
          version: pipeline.version,
          // TODO: Manejar stages existentes vs nuevos
          stages: stagesWithOrder as any,
        };

        await updatePipeline(pipeline.id, request, () => {
          onSave?.({ ...pipeline, ...request } as PipelineDTO);
        });
      }
    } catch (error) {
      console.error('Error saving pipeline:', error);
    }
  };

  const isSubmitting = loading || isCreating || reorderingStages;

  // ============================================
  // RENDER
  // ============================================
  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* ============================================ */}
      {/* PIPELINE BASIC INFO */}
      {/* ============================================ */}
      <div className="border-app-dark-600 bg-app-dark-800/50 p-6">
        <h3 className="text-lg font-semibold text-app-gray-100 mb-4">
          Información Básica del Pipeline
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <FormField 
              label="Nombre del Pipeline" 
              name="name"
              error={form.formState.errors.name?.message}
              required
            >
              <Input
                {...form.register('name')}
                placeholder="Ej: Pipeline de Ventas B2B"
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField 
              label="Descripción (opcional)" 
              name="description"
              error={form.formState.errors.description?.message}
            >
              <textarea
                {...form.register('description')}
                rows={3}
                className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded-lg text-app-gray-200 placeholder-app-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
                placeholder="Describe el propósito y uso de este pipeline..."
              />
            </FormField>
          </div>

          <div>
            <FormField label="Tipo de Pipeline" name="type">
              <select
                {...form.register('type')}
                className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded-lg text-app-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoadingTypes}
              >
                {pipelineTypes?.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                )) || (
                  <>
                    <option value="SALES">Ventas</option>
                    <option value="LEAD_NURTURING">Cultivo de Leads</option>
                    <option value="CUSTOM">Personalizado</option>
                  </>
                )}
              </select>
            </FormField>
          </div>

          <div>
            <FormField label="Configuración" name="config">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Controller
                    name="isDefault"
                    control={form.control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border-app-dark-600 text-primary-600 focus:ring-primary-500"
                      />
                    )}
                  />
                  <span className="text-sm text-app-gray-300">Pipeline por defecto</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Controller
                    name="isActive"
                    control={form.control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border-app-dark-600 text-primary-600 focus:ring-primary-500"
                      />
                    )}
                  />
                  <span className="text-sm text-app-gray-300">Pipeline activo</span>
                </label>
              </div>
            </FormField>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* PIPELINE STAGES */}
      {/* ============================================ */}
      <div className="border-app-dark-600 bg-app-dark-800/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-app-gray-100">
            Etapas del Pipeline ({fields.length})
          </h3>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddStage}
            disabled={fields.length >= 20}
          >
            <Plus className="h-4 w-4" />
            Añadir Etapa
          </Button>
        </div>

        {/* Validation errors */}
        {form.formState.errors.stages?.root && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400">
                {form.formState.errors.stages.root.message}
              </span>
            </div>
          </div>
        )}

        {/* Stages list */}
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="relative">
              <StageItem
                stage={field}
                index={index}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
                onUpdate={(updates) => handleUpdateStage(index, updates)}
                onDelete={() => remove(index)}
                onMoveUp={() => index > 0 && handleMoveStage(index, index - 1)}
                onMoveDown={() => index < fields.length - 1 && handleMoveStage(index, index + 1)}
              />
            </div>
          ))}
        </div>

        {/* Empty state */}
        {fields.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-app-dark-600 rounded-lg">
            <Target className="h-12 w-12 text-app-gray-400 mx-auto mb-4" />
            <p className="text-app-gray-400 mb-4">No hay etapas configuradas</p>
            <Button onClick={handleAddStage}>
              <Plus className="h-4 w-4" />
              Crear Primera Etapa
            </Button>
          </div>
        )}

        {/* Info notice */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p><strong>Consejos:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-blue-300/80">
                <li>Arrastra las etapas para reordenarlas</li>
                <li>Asigna probabilidades de cierre realistas</li>
                <li>Marca etapas de cierre ganado y perdido</li>
                <li>Usa colores consistentes para facilitar la identificación</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ACTIONS */}
      {/* ============================================ */}
      {showActions && (
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {mode === 'create' ? 'Crear Pipeline' : 'Guardar Cambios'}
          </Button>
        </div>
      )}
    </form>
  );
};

export default PipelineEditor;