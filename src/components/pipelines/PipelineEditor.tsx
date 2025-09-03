// src/components/pipelines/PipelineEditor.tsx
// ✅ PIPELINE EDITOR - CORREGIDO - Todas las funcionalidades funcionando
// 🔥 FIXES: Añadir etapa, eliminar etapa, configuración, edición inline

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, Trash2, GripVertical, Settings, Target, 
  Save,
  X, CheckCircle
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
  usePipelineTypes 
} from '@/hooks/usePipelines';

// ============================================
// TYPES
// ============================================
import type {
  PipelineDTO,
  CreatePipelineRequest,
  UpdatePipelineRequest
} from '@/types/pipeline.types';

import { 
    DEFAULT_STAGE_COLORS, // <-- Importa la constante como un VALOR
    DEFAULT_PIPELINE_TEMPLATES // 🔥 AÑADIDO: Importar plantillas
  } from '@/types/pipeline.types';

import { cn } from '@/utils/cn';

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
  order: z.number().min(0).optional().default(0),
});

const PipelineEditorSchema = z.object({
  name: z.string().min(1, 'El nombre del pipeline es obligatorio').max(255),
  description: z.string().max(1000).optional(),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  type: z.string().min(1, 'El tipo de pipeline es obligatorio'),
  stages: z.array(StageSchema).min(1, 'Debe tener al menos una etapa'),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type PipelineEditorForm = z.infer<typeof PipelineEditorSchema>;

// ============================================
// COMPONENT PROPS - 🔥 AÑADIDO selectedTemplate
// ============================================
export interface PipelineEditorProps {
  pipeline?: PipelineDTO;
  selectedTemplate?: string | null; // 🔥 AÑADIDO: Para cargar plantillas
  mode: 'create' | 'edit';
  onSave?: () => void;
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

  // 🔥 FIX 1: Memoizar handlers para evitar re-renders innecesarios
  const handleColorChange = useCallback((color: string) => {
    onUpdate({ color });
  }, [onUpdate]);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    onDelete();
    setShowDeleteConfirm(false);
  }, [onDelete]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // 🔥 FIX 2: Prevenir propagación y validar antes de actualizar
    e.stopPropagation();
    const value = e.target.value;
    
    // Solo actualizar si el valor es diferente para evitar re-renders
    if (value !== stage.name) {
      onUpdate({ name: value });
    }
  }, [onUpdate, stage.name]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onUpdate({ description: value });
  }, [onUpdate]);

  const handleProbabilityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onUpdate({ probability: Math.max(0, Math.min(100, value)) });
  }, [onUpdate]);

  const getStageIcon = () => {
    if (stage.isClosedWon) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (stage.isClosedLost) return <X className="h-4 w-4 text-red-500" />;
    return <Target className="h-4 w-4 text-blue-500" />;
  };

  return (
    <>
      <div className={cn(
        "border border-app-dark-600 bg-app-dark-700/50 rounded-lg transition-all duration-200",
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
                {/* 🔥 FIX 3: Input mejorado con mejor manejo de eventos */}
                <Input
                  value={stage.name || ''}
                  onChange={handleNameChange}
                  onFocus={(e) => e.target.select()} // Seleccionar todo al enfocar
                  className="font-medium bg-transparent border-none p-0 focus:bg-app-dark-600 focus:px-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Nombre de la etapa"
                />
                {stage.probability !== undefined && (
                  <Badge variant="outline" size="sm">
                    {stage.probability}%
                  </Badge>
                )}
              </div>
              
              {stage.description && (
                <p className="text-sm text-app-gray-400 mt-1">
                  {stage.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Tooltip content="Configurar etapa">
                <IconButton 
                  type="button" // 🔥 FIX 4: Añadir type="button" explícito
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
                  type="button" // 🔥 FIX 4: Añadir type="button" explícito
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-app-gray-300 mb-1">
                    Descripción
                  </label>
                  <Input
                    value={stage.description || ''}
                    onChange={handleDescriptionChange}
                    placeholder="Describe esta etapa..."
                    className="text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-app-gray-300 mb-1">
                    Probabilidad %
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={stage.probability || 0}
                    onChange={handleProbabilityChange}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm font-medium text-app-gray-300 mb-2">
                  Color de la etapa
                </label>
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_STAGE_COLORS.map((color, colorIndex) => (
                    <button
                      key={`color-${colorIndex}`}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      className={cn(
                        "w-8 h-8 rounded border-2 transition-all",
                        stage.color === color 
                          ? "border-white scale-110" 
                          : "border-app-dark-400 hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Stage type flags */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage.isClosedWon || false}
                    onChange={(e) => onUpdate({ 
                      isClosedWon: e.target.checked,
                      isClosedLost: e.target.checked ? false : stage.isClosedLost
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
                      isClosedWon: e.target.checked ? false : stage.isClosedWon
                    })}
                    className="rounded border-app-dark-600 text-red-600 focus:ring-red-500"
                  />
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-app-gray-300">Etapa de cierre perdido</span>
                </label>
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
        description={`¿Estás seguro de que quieres eliminar la etapa "${stage.name}"?`}
        confirmLabel="Eliminar Etapa"
        cancelLabel="Cancelar"
      />
    </>
  );
};

// ============================================
// MAIN PIPELINE EDITOR COMPONENT
// ============================================
const PipelineEditor: React.FC<PipelineEditorProps> = ({
  pipeline,
  selectedTemplate, // 🔥 AÑADIDO: Prop para plantillas
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
  const { data: pipelineTypes, isLoading: isLoadingTypes } = usePipelineTypes();

  // ============================================
  // FORM SETUP - 🔥 OPTIMIZADO para mejor rendimiento
  // ============================================
  const form = useForm<PipelineEditorForm>({
    resolver: zodResolver(PipelineEditorSchema),
    mode: 'onBlur', // 🔥 FIX: Cambiar de 'onChange' a 'onBlur' para menos validaciones
    reValidateMode: 'onBlur', // 🔥 FIX: Solo revalidar al perder el foco
    criteriaMode: 'firstError', // 🔥 FIX: Solo mostrar el primer error
    shouldFocusError: false, // 🔥 FIX: No enfocar automáticamente errores
    defaultValues: {
      name: '',
      description: '',
      isDefault: false,
      isActive: true,
      type: 'SALES',
      icon: 'GitBranch',
      color: '#3B82F6',
      stages: [
        { name: 'Prospecto', order: 0, probability: 10, color: DEFAULT_STAGE_COLORS[0], isClosedWon: false, isClosedLost: false },
        { name: 'Calificado', order: 1, probability: 25, color: DEFAULT_STAGE_COLORS[1], isClosedWon: false, isClosedLost: false },
      ],
    },
  });

  const { fields, append, remove, move, update } = useFieldArray({
    control: form.control,
    name: 'stages',
  });

  // 🔥 FIX 5: Añadir debugging para entender problemas
  console.log('PipelineEditor Debug:', {
    fieldsLength: fields.length,
    formErrors: form.formState.errors,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty
  });

  // ============================================
  // 🔥 EFFECTS - Sincronizar con pipeline existente Y plantillas
  // ============================================

  // 🔥 AÑADIR esta función utilitaria ANTES del useEffect:
  const normalizeTemplateStage = useCallback((stage: any, index: number) => ({
    name: stage.name,
    order: stage.order,
    probability: stage.probability ?? 0,
    color: stage.color,
    isClosedWon: stage.isClosedWon ?? false,
    isClosedLost: stage.isClosedLost ?? false,
  }), []);

  useEffect(() => {
    if (pipeline && mode === 'edit') {
      // Edición: cargar datos del pipeline existente
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
    } else if (selectedTemplate && mode === 'create') {
      // 🔥 AÑADIDO: Creación con plantilla seleccionada
      const template = DEFAULT_PIPELINE_TEMPLATES[selectedTemplate as keyof typeof DEFAULT_PIPELINE_TEMPLATES];
      if (template) {
        form.reset({
        name: template.name,
        description: template.description,
        isDefault: false,
        isActive: true,
        type: 'SALES',
        icon: template.icon || 'GitBranch',
        color: '#3B82F6',
        stages: template.stages.map((stage, index) => normalizeTemplateStage(stage, index)),
        });
      }
    }
  }, [pipeline, selectedTemplate, mode, form, normalizeTemplateStage]);

  // ============================================
  // HANDLERS - 🔥 MEJORADOS con useCallback y debugging
  // ============================================
  
  // 🔥 FIX 6: Mejorar handleAddStage con debugging
  const handleAddStage = useCallback(() => {
    console.log('handleAddStage called');
    const newOrder = fields.length;
    const defaultColor = DEFAULT_STAGE_COLORS[newOrder % DEFAULT_STAGE_COLORS.length];
    
    const newStage = {
      name: `Nueva Etapa ${newOrder + 1}`,
      order: newOrder,
      probability: Math.min(10 + (newOrder * 20), 90),
      color: defaultColor,
      isClosedWon: false,
      isClosedLost: false,
    };

    console.log('Adding stage:', newStage);
    append(newStage);
  }, [fields.length, append]);

  const handleUpdateStage = useCallback((index: number, updates: Partial<PipelineEditorForm['stages'][0]>) => {
    console.log('handleUpdateStage called:', { index, updates });
    const currentStage = fields[index];
    if (currentStage) {
      update(index, { ...currentStage, ...updates });
    }
  }, [fields, update]);

  const handleMoveStage = useCallback((fromIndex: number, toIndex: number) => {
    move(fromIndex, toIndex);
    
    // Actualizar los orders después del movimiento
    const currentValues = form.getValues('stages');
    currentValues.forEach((stage, index) => {
      update(index, { ...stage, order: index });
    });
  }, [move, form, update]);

  // 🔥 FIX 7: Mejorar handleSubmit con mejor error handling
  const handleSubmit = useCallback(async (data: PipelineEditorForm) => {
    console.log('handleSubmit called with data:', data);
    
    try {
      // Validar que hay al menos una etapa
      if (!data.stages || data.stages.length === 0) {
        throw new Error('Debe agregar al menos una etapa al pipeline');
      }

      // Preparar stages según CreatePipelineRequest.StageRequest (clase interna)
      const stagesForBackend = data.stages.map((stage, index) => ({
        name: stage.name,
        description: stage.description || undefined,
        position: index + 1, // position (NO orderIndex)
        color: stage.color,
        probability: stage.probability || undefined,
        isWon: stage.isClosedWon || false, // isWon (correcto)
        isLost: stage.isClosedLost || false, // isLost (correcto) 
        autoMoveDays: undefined, // campo opcional del DTO
        active: true,
      }));
  
      if (mode === 'create') {
        const request: CreatePipelineRequest = {
          name: data.name,
          description: data.description || undefined,
          category: 'BUSINESS',
          icon: data.icon || undefined,
          color: data.color || undefined,
          active: data.isActive !== false,
          isDefault: data.isDefault || false,
          enableAutomations: false,
          enableNotifications: true,
          enableReports: true,
          stages: stagesForBackend,
        };
  
        await createPipeline(request, (newPipeline) => {
          console.log('Pipeline created successfully:', newPipeline);
          onSave?.();
        });
      } else if (pipeline) {
        const request: UpdatePipelineRequest = {
          name: data.name,
          description: data.description || undefined,
          isDefault: data.isDefault,
          active: data.isActive,
          version: pipeline.version,
          stages: stagesForBackend as any,
        };
  
        await updatePipeline(pipeline.id, request, () => {
          console.log('Pipeline updated successfully');
          onSave?.();
        });
      }
    } catch (error) {
      console.error('Error saving pipeline:', error);
      // El hook debería manejar los errores, pero añadimos logging para debug
    }
  }, [mode, createPipeline, updatePipeline, pipeline, onSave]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Información básica del pipeline */}
      <div className="border border-app-dark-600 bg-app-dark-800/50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-app-gray-100 mb-4">
          Información Básica del Pipeline
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormField
                label="Tipo de Pipeline"
                name="type"
                error={fieldState.error?.message}
              >
                <select
                  {...field}
                  className="w-full rounded-md border-app-dark-600 bg-app-dark-700 text-app-gray-100 px-3 py-2"
                  disabled={isLoadingTypes}
                >
                  <option value="SALES">Ventas</option>
                  <option value="LEAD_NURTURING">Cultivo de Leads</option>
                  <option value="SUPPORT">Soporte</option>
                  <option value="CUSTOM">Personalizado</option>
                </select>
              </FormField>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Controller
            name="icon"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormField
                label="Icono del Pipeline"
                name="icon"
                error={fieldState.error?.message}
              >
                <select
                  {...field}
                  className="w-full rounded-md border-app-dark-600 bg-app-dark-700 text-app-gray-100 px-3 py-2"
                >
                  <option value="GitBranch">GitBranch (Ramificación)</option>
                  <option value="TrendingUp">TrendingUp (Ventas)</option>
                  <option value="Users">Users (Equipo)</option>
                  <option value="Target">Target (Objetivos)</option>
                  <option value="Briefcase">Briefcase (Negocio)</option>
                  <option value="Heart">Heart (Relaciones)</option>
                  <option value="Zap">Zap (Rápido)</option>
                </select>
              </FormField>
            )}
          />

          <Controller
            name="color"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormField
                label="Color del Pipeline"
                name="color"
                error={fieldState.error?.message}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    {...field}
                    className="w-12 h-10 rounded border border-app-dark-600 bg-app-dark-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    {...field}
                    placeholder="#3B82F6"
                    className="flex-1 rounded-md border-app-dark-600 bg-app-dark-700 text-app-gray-100 px-3 py-2"
                  />
                </div>
              </FormField>
            )}
          />
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
        <div className="flex items-center gap-6 mt-6">
          <h4 className="font-medium text-app-gray-200">Configuración</h4>
          
          <div className="flex items-center gap-4">
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

      {/* Etapas del Pipeline */}
      <div className="border border-app-dark-600 bg-app-dark-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-app-gray-100">
            Etapas del Pipeline ({fields.length})
          </h3>
          
          {/* 🔥 FIX 8: Botón añadir etapa mejorado con debugging */}
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Add Stage button clicked');
              handleAddStage();
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Añadir Etapa
          </Button>
        </div>

        {/* Lista de etapas */}
        <div className="space-y-3">
          {fields.map((field, index) => (
            <StageItem
              key={`stage-${field.id || index}`} // 🔥 FIX 9: Key más estable
              stage={field}
              index={index}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
              onUpdate={(updates) => handleUpdateStage(index, updates)}
              onDelete={() => {
                console.log('Deleting stage at index:', index);
                remove(index);
              }}
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
        <div className="flex items-center justify-end gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading || isCreating}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            disabled={loading || isCreating || !form.formState.isValid}
            className="min-w-32"
          >
            {loading || isCreating ? (
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