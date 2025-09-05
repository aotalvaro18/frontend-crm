// src/components/pipelines/PipelineEditor.tsx
// ✅ PIPELINE EDITOR - VERSIÓN FINAL CORREGIDA
// Funciona perfectamente con el store y PipelineCreatePage

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, Trash2, GripVertical, Settings, Target, 
  Save,
  X, CheckCircle
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
    DEFAULT_STAGE_COLORS,
    DEFAULT_PIPELINE_TEMPLATES 
  } from '@/types/pipeline.types';

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
    id: z.union([z.number(), z.string()]).optional().transform(val => val ? Number(val) : undefined),
    name: z.string().min(1, 'El nombre de la etapa es obligatorio').max(100),
    description: z.string().optional(),
    color: z.string().min(1, 'El color es obligatorio'),
    probability: z.union([z.number(), z.string()]).optional().transform(val => val ? Number(val) : undefined),
    isClosedWon: z.boolean().optional().default(false),
    isClosedLost: z.boolean().optional().default(false),
    orderIndex: z.union([z.number(), z.string()]).optional().transform(val => val ? Number(val) : 0),
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
// COMPONENT PROPS
// ============================================
export interface PipelineEditorProps {
  pipeline?: PipelineDTO;
  selectedTemplate?: string | null;
  mode: 'create' | 'edit';
  onSave?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  showActions?: boolean;
}

// ============================================
// CONTEXT PARA ESTADO DE EXPANSIÓN GLOBAL
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
// STAGE ITEM COMPONENT
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

const StageItem: React.FC<StageItemProps> = React.memo(({ 
  stage, 
  index, 
  onUpdate, 
  onDelete,
  isDragging = false 
}) => {
  const { expandedStages, toggleExpanded } = React.useContext(StageExpansionContext);
  const isExpanded = expandedStages.has(index);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localValues, setLocalValues] = useState({
    description: stage.description || '',
    probability: stage.probability || 0
  });

  // Sincronizar estado local con props
  useEffect(() => {
    setLocalValues({
      description: stage.description || '',
      probability: stage.probability || 0
    });
  }, [stage.description, stage.probability]);

  // Debounce las actualizaciones
  const debouncedUpdate = useCallback(
    debounce((updates: Partial<PipelineEditorForm['stages'][0]>) => {
      onUpdate(updates);
    }, 300),
    [onUpdate]
  );

  const handleColorChange = useCallback((color: string) => {
    onUpdate({ color });
  }, [onUpdate]);

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

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const value = e.target.value;
    onUpdate({ name: value });
  }, [onUpdate]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const value = e.target.value;
    setLocalValues(prev => ({ ...prev, description: value }));
    debouncedUpdate({ description: value });
  }, [debouncedUpdate]);

  const handleDescriptionBlur = useCallback(() => {
    if (localValues.description !== stage.description) {
      onUpdate({ description: localValues.description });
    }
  }, [localValues.description, stage.description, onUpdate]);

  const handleProbabilityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const value = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(0, Math.min(100, value));
    setLocalValues(prev => ({ ...prev, probability: clampedValue }));
    debouncedUpdate({ probability: clampedValue });
  }, [debouncedUpdate]);

  const handleProbabilityBlur = useCallback(() => {
    if (localValues.probability !== stage.probability) {
      onUpdate({ probability: localValues.probability });
    }
  }, [localValues.probability, stage.probability, onUpdate]);

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
                  value={stage.name || ''}
                  onChange={handleNameChange}
                  onFocus={(e) => e.target.select()}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-app-gray-300 mb-1">
                    Descripción
                  </label>
                  <Input
                    value={localValues.description}
                    onChange={handleDescriptionChange}
                    onBlur={handleDescriptionBlur}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
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
                    value={localValues.probability}
                    onChange={handleProbabilityChange}
                    onBlur={handleProbabilityBlur}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
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
                <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={stage.isClosedWon || false}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdate({ 
                        isClosedWon: e.target.checked,
                        isClosedLost: e.target.checked ? false : stage.isClosedLost
                      });
                    }}
                    className="rounded border-app-dark-600 text-green-600 focus:ring-green-500"
                  />
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-app-gray-300">Etapa de cierre ganado</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={stage.isClosedLost || false}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdate({ 
                        isClosedLost: e.target.checked,
                        isClosedWon: e.target.checked ? false : stage.isClosedWon
                      });
                    }}
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
});

StageItem.displayName = 'StageItem';

// ============================================
// MAIN PIPELINE EDITOR COMPONENT
// ============================================
const PipelineEditor: React.FC<PipelineEditorProps> = ({
  pipeline,
  selectedTemplate,
  mode,
  onSave,
  onCancel,
  loading = false,
  showActions = true,
}) => {
  // Estado global para expansión de etapas

// 🔥 AGREGAR ESTE LOG JUSTO DESPUÉS:
console.log('🔥 PipelineEditor - Props recibidas:');
console.log('🔥 PipelineEditor - pipeline:', pipeline);
console.log('🔥 PipelineEditor - pipeline.stages:', pipeline?.stages);
console.log('🔥 PipelineEditor - mode:', mode);
console.log('🔥 PipelineEditor - selectedTemplate:', selectedTemplate);

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
  const { createPipeline, updatePipeline, isCreating } = usePipelineOperations();
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
      type: 'SALES',
      icon: 'GitBranch',
      color: '#3B82F6',
      stages: [
        { name: 'Prospecto', orderIndex: 0, probability: 10, color: DEFAULT_STAGE_COLORS[0], isClosedWon: false, isClosedLost: false },
        { name: 'Calificado', orderIndex: 1, probability: 25, color: DEFAULT_STAGE_COLORS[1], isClosedWon: false, isClosedLost: false },
      ],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'stages',
  });

  // Effects
  const normalizeTemplateStage = useCallback((stage: any, index: number) => ({
    name: stage.name,
    order: stage.order,
    probability: stage.probability ?? 0,
    color: stage.color,
    isClosedWon: stage.isClosedWon ?? false,
    isClosedLost: stage.isClosedLost ?? false,
  }), []);

  useEffect(() => {

    console.log('🔥 PipelineEditor useEffect triggered:');
  console.log('🔥 pipeline:', pipeline);
  console.log('🔥 mode:', mode);
  console.log('🔥 pipeline?.stages:', pipeline?.stages);

    if (pipeline && mode === 'edit') {
        console.log('🔥 Entrando a modo EDIT');
    console.log('🔥 pipeline.stages antes del map:', pipeline.stages);
      form.reset({
        name: pipeline.name,
        description: pipeline.description || '',
        isDefault: pipeline.isDefault || false,
        isActive: pipeline.isActive !== false,
        type: pipeline.type || 'SALES',
        stages: pipeline.stages?.map((stage, index) => ({
          id: stage.id,
          name: stage.name,
          description: stage.description || '',
          color: stage.color || DEFAULT_STAGE_COLORS[index % DEFAULT_STAGE_COLORS.length],
          probability: stage.probability,
          isClosedWon: stage.isClosedWon,
          isClosedLost: stage.isClosedLost,
          order: stage.orderIndex || index,
        })) || [],
      });
    } else if (selectedTemplate && mode === 'create') {
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

  // Handlers
  const handleCancel = useCallback(() => {
    console.log('🔥 handleCancel llamado, onCancel prop:', !!onCancel);
    if (onCancel) {
      onCancel();
    } else {
      console.log('🔥 No onCancel prop, navegando al dashboard');
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    }
  }, [onCancel]);
  
  const handleAddStage = useCallback(() => {
    console.log('🔥 handleAddStage llamado, fields.length:', fields.length);
    
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

    console.log('🔥 Agregando etapa:', newStage);
    append(newStage);
  }, [fields.length, append]);

  const handleUpdateStage = useCallback((index: number, updates: Partial<PipelineEditorForm['stages'][0]>) => {
    console.log('🔥 handleUpdateStage llamado:', { index, updates });
    const currentStage = fields[index];
    if (currentStage) {
      update(index, { ...currentStage, ...updates });
    }
  }, [fields, update]);

  const handleSubmit = useCallback(async (data: PipelineEditorForm) => {
    console.log('🔥 handleSubmit iniciado con data:', data);
    
    // 🔥 DEBUGGING PROFUNDO - Ver qué está fallando en la validación
    console.log('🔥 Validando data manualmente con Zod...');
    const validationResult = PipelineEditorSchema.safeParse(data);
    
    if (!validationResult.success) {
      console.error('🔥 VALIDACIÓN FALLÓ:', validationResult.error);
      console.error('🔥 Errores específicos:', validationResult.error.issues);
      
      // Mostrar el error al usuario
      const firstError = validationResult.error.issues[0];
      alert(`Error de validación: ${firstError.message} en campo: ${firstError.path.join('.')}`);
      return;
    } else {
      console.log('🔥 VALIDACIÓN EXITOSA:', validationResult.data);
    }
    
    try {
      if (!data.stages || data.stages.length === 0) {
        throw new Error('Debe agregar al menos una etapa al pipeline');
      }

      // 🔥 DEBUGGING - Ver cada etapa antes de procesar
      console.log('🔥 Procesando stages:', data.stages);

      const stagesForBackend = data.stages.map((stage, index) => {
        // 🔥 Asegurar que color existe
        const finalColor = stage.color || DEFAULT_STAGE_COLORS[index % DEFAULT_STAGE_COLORS.length];
        
        const processedStage = {
          name: stage.name,
          description: stage.description || undefined,
          position: index + 1,
          color: finalColor,
          probability: stage.probability || undefined,
          isWon: stage.isClosedWon || false,
          isLost: stage.isClosedLost || false,
          autoMoveDays: undefined,
          active: true,
        };
        
        console.log(`🔥 Stage ${index} procesado:`, processedStage);
        return processedStage;
      });

      console.log('🔥 stagesForBackend preparados:', stagesForBackend);

      if (mode === 'create') {
        const request: CreatePipelineRequest = {
          name: data.name,
          description: data.description || undefined,
          category: 'BUSINESS',
          ...(data.icon && { 
            icon: data.icon.toLowerCase().replace(/[^a-z0-9\-_]/g, '') 
          }),
          ...(data.color && /^#[0-9A-Fa-f]{6}$/.test(data.color) && { color: data.color }),
          active: data.isActive !== false,
          isDefault: data.isDefault || false,
          enableAutomations: false,
          enableNotifications: true,
          enableReports: true,
          stages: stagesForBackend,
        };

        console.log('🔥 Llamando createPipeline con request:', request);
        
        await createPipeline(request, (newPipeline) => {
          console.log('🔥 Pipeline creado exitosamente:', newPipeline);
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

        console.log('🔥 Llamando updatePipeline con request:', request);
        
        await updatePipeline(pipeline.id, request, () => {
          console.log('🔥 Pipeline actualizado exitosamente');
          onSave?.();
        });
      }
    } catch (error) {
      console.error('🔥 Error en handleSubmit:', error);
      
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Error desconocido al guardar el pipeline');
      }
    }
  }, [mode, createPipeline, updatePipeline, pipeline, onSave]);

  // Render
  return (
    <StageExpansionContext.Provider value={expansionContextValue}>
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
                key={`stage-${index}`}
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
              onClick={handleCancel}
              disabled={loading || isCreating}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={loading || isCreating || form.formState.isSubmitting}
              className="min-w-32"
              onClick={(e) => {
                console.log('🔥 Submit button clicked');
                console.log('🔥 Form valid:', form.formState.isValid);
                console.log('🔥 Form errors:', form.formState.errors);
                console.log('🔥 Is creating:', isCreating);
                console.log('🔥 Loading:', loading);
              }}
            >
              {loading || isCreating || form.formState.isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {mode === 'create' ? 'Crear Pipeline' : 'Guardar Cambios'}
            </Button>
          </div>
        )}
      </form>
    </StageExpansionContext.Provider>
  );
};

export default PipelineEditor;