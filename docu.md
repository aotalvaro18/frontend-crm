EDITOR CON OPCION GUARDAR CORRECTA

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
// ZOD VALIDATION SCHEMAS AAA
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
      probability: stage.probability || 0,
      name: stage.name || '' // ✅ AGREGADO
    });
  
    // Sincronizar estado local con props
    useEffect(() => {
      setLocalValues({
        description: stage.description || '',
        probability: stage.probability || 0,
        name: stage.name || '' // ✅ AGREGADO
      });
    }, [stage.description, stage.probability, stage.name]); // ✅ AGREGADO stage.name
  
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
      setLocalValues(prev => ({ ...prev, name: value })); // ✅ CAMBIADO: Solo estado local
    }, []);
  
    // ✅ AGREGADO: Nuevo handler para blur
    const handleNameBlur = useCallback(() => {
      if (localValues.name !== stage.name) {
        onUpdate({ name: localValues.name });
      }
    }, [localValues.name, stage.name, onUpdate]);
  
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
                    value={localValues.name} // ✅ CAMBIADO: de stage.name a localValues.name
                    onChange={handleNameChange}
                    onBlur={handleNameBlur} // ✅ AGREGADO
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
    orderIndex: stage.orderIndex || stage.order || index,
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
          orderIndex: stage.orderIndex ?? index,
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
    console.log('🔥 Current stage antes:', fields[index]);
    
    const currentStage = fields[index];
    if (currentStage) {
      const newStage = { ...currentStage, ...updates };
      console.log('🔥 New stage después:', newStage);
      update(index, newStage);
      
      // Verificar que se aplicó correctamente
      setTimeout(() => {
        console.log('🔥 Stage después del update:', fields[index]);
        console.log('🔥 Todos los fields después del update:', fields);
      }, 10);
    } else {
      console.log('🔥 ERROR: currentStage es undefined para index:', index);
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













// src/pages/pipelines/PipelineCreatePage.tsx
// ✅ PIPELINE CREATE PAGE - Siguiendo exactamente el patrón de CompanyCreatePage
// 🔥 ACTUALIZADO: Uso correcto de DEFAULT_PIPELINE_TEMPLATES y selectedTemplate

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Star, Building, ClipboardCheck, HeartHandshake, Megaphone } from 'lucide-react';

// ============================================
// UI & LAYOUT COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Page } from '@/components/layout/Page';

// ============================================
// PIPELINE COMPONENTS
// ============================================
import PipelineEditor from '@/components/pipelines/PipelineEditor';

// ============================================
// HOOKS & SERVICES - Siguiendo patrón Slice Vertical
// ============================================
import { usePipelineOperations } from '@/hooks/usePipelines';

import { DEFAULT_PIPELINE_TEMPLATES } from '@/types/pipeline.types'; // 🔥 AÑADIDO

// ============================================
// MAIN COMPONENT
// ============================================
const PipelineCreatePage: React.FC = () => {
  const navigate = useNavigate();
  
  // ============================================
  // LOCAL STATE
  // ============================================
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);

  // ============================================
  // HOOKS DE ZUSTAND (Para acciones)
  // ============================================
  const { createPipeline, isCreating } = usePipelineOperations();

  // ============================================
// HANDLERS
// ============================================
const handleBack = useCallback(() => {
    navigate('/settings/pipelines');
  }, [navigate]);
  
  const handleCancel = useCallback(() => {
    navigate('/settings/pipelines');
  }, [navigate]);
  
  const handleSubmit = useCallback(() => {
    // Navegar de vuelta a la configuración de pipelines después del éxito
    navigate('/settings/pipelines');
  }, [navigate]);

  const handleUseTemplate = useCallback((templateKey: string) => {
    setSelectedTemplate(templateKey);
    setShowTemplates(false);
  }, []);

  const handleStartFromScratch = useCallback(() => {
    setSelectedTemplate(null);
    setShowTemplates(false);
  }, []);

  // ============================================
  // 🔥 TEMPLATE DATA - Usando plantillas reales de DEFAULT_PIPELINE_TEMPLATES
  // ============================================
  const templateOptions = [
    {
      key: 'BUSINESS_SALES', // 🔥 CORREGIDO: key correcto
      name: DEFAULT_PIPELINE_TEMPLATES.BUSINESS_SALES.name,
      description: DEFAULT_PIPELINE_TEMPLATES.BUSINESS_SALES.description,
      icon: Building,
      color: 'blue',
      stages: DEFAULT_PIPELINE_TEMPLATES.BUSINESS_SALES.stages.map(s => s.name), // 🔥 USANDO stages reales
      popular: true,
    },
    {
      key: 'BUSINESS_SERVICE_DELIVERY', // 🔥 AÑADIDO: Nueva plantilla
      name: DEFAULT_PIPELINE_TEMPLATES.BUSINESS_SERVICE_DELIVERY.name,
      description: DEFAULT_PIPELINE_TEMPLATES.BUSINESS_SERVICE_DELIVERY.description,
      icon: ClipboardCheck,
      color: 'green',
      stages: DEFAULT_PIPELINE_TEMPLATES.BUSINESS_SERVICE_DELIVERY.stages.map(s => s.name),
      popular: false,
    },
    {
      key: 'CHURCH_CONSOLIDATION', // 🔥 AÑADIDO: Plantilla de iglesia
      name: DEFAULT_PIPELINE_TEMPLATES.CHURCH_CONSOLIDATION.name,
      description: DEFAULT_PIPELINE_TEMPLATES.CHURCH_CONSOLIDATION.description,
      icon: HeartHandshake,
      color: 'purple',
      stages: DEFAULT_PIPELINE_TEMPLATES.CHURCH_CONSOLIDATION.stages.map(s => s.name),
      popular: false,
    },
    {
        key: 'NONPROFIT_VOLUNTEER_MANAGEMENT',  // 🔥 CAMBIO: era CIVIC_VOLUNTEER_MANAGEMENT
        name: DEFAULT_PIPELINE_TEMPLATES.NONPROFIT_VOLUNTEER_MANAGEMENT.name,
        description: DEFAULT_PIPELINE_TEMPLATES.NONPROFIT_VOLUNTEER_MANAGEMENT.description,
        icon: Megaphone,
        color: 'green',
        stages: DEFAULT_PIPELINE_TEMPLATES.NONPROFIT_VOLUNTEER_MANAGEMENT.stages.map(s => s.name),
        popular: false,
    }
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <Page 
      title="Nuevo Pipeline" 
      breadcrumbs={[
        { label: 'Pipelines', href: '/pipelines' }, // Asumiendo que /pipelines es la lista Kanban
        { label: 'Configuración', href: '/settings/pipelines' }, // Enlace a la administración
        { label: 'Nuevo Pipeline' }
      ]}
      className="space-y-6"
    >
      {/* ============================================ */}
      {/* HEADER - SEPARADO DEL COMPONENTE PAGE */}
      {/* ============================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
            disabled={isCreating}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Volver a Configuración</span>
          </Button>
          
          <div className="p-2 bg-primary-500/10 rounded-lg">
            <GitBranch className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500" />
          </div>
          
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-app-gray-100">
              Nuevo Pipeline
            </h1>
            <p className="text-sm text-app-gray-400">
              Crea un nuevo proceso de negocio para gestionar oportunidades
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* TEMPLATE SELECTION - Cuando se muestran plantillas */}
      {/* ============================================ */}
      {showTemplates && (
        <div className="max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/10 rounded-full mb-4">
              <GitBranch className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-app-gray-100 mb-2">
              Elige una Plantilla
            </h1>
            <p className="text-sm text-app-gray-400">
              Usa una plantilla predefinida o crea tu pipeline desde cero
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templateOptions.map((template) => {
              const Icon = template.icon;
              const colorClasses = {
                blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
                green: 'bg-green-500/10 border-green-500/30 text-green-400', 
                purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
              };

              return (
                <div
                  key={template.key}
                  className="p-6 border border-app-dark-600 bg-app-dark-800/50 hover:bg-app-dark-700/50 transition-colors cursor-pointer rounded-lg"
                  onClick={() => handleUseTemplate(template.key)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colorClasses[template.color as keyof typeof colorClasses]}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-app-gray-100">
                          {template.name}
                        </h3>
                        {template.popular && (
                          <Badge variant="info" size="sm">Más usado</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-app-gray-400 mb-3">
                        {template.description}
                      </p>
                      
                      <div className="text-xs text-app-gray-500">
                        <p className="mb-1">Incluye {template.stages.length} etapas:</p>
                        <p className="truncate">
                          {template.stages.slice(0, 3).join(', ')}
                          {template.stages.length > 3 && '...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={handleStartFromScratch}
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              Empezar desde Cero
            </Button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* PIPELINE EDITOR - Cuando no se muestran plantillas */}
      {/* ============================================ */}
      {!showTemplates && (
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-app-gray-100">
                {selectedTemplate ?
                  `Pipeline basado en: ${templateOptions.find(t => t.key === selectedTemplate)?.name}` : 'Pipeline Personalizado'}
              </h2>
              <p className="text-sm text-app-gray-400">
                Configura los detalles y etapas de tu nuevo pipeline
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowTemplates(true)}
              disabled={isCreating}
            >
              Cambiar Plantilla
            </Button>
          </div>

          <PipelineEditor
            mode="create"
            selectedTemplate={selectedTemplate}
            onSave={handleSubmit}
            onCancel={handleCancel}
            loading={isCreating}
            showActions={true}
          />
        </div>
      )}

      {/* ============================================ */}
      {/* HELPER TEXT - Información adicional */}
      {/* ============================================ */}
      <div className="max-w-4xl mt-8"> {/* Añadido margen superior para separación */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <GitBranch className="h-5 w-5 text-blue-400 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-200 mb-1">
                ¿Qué es un Pipeline?
              </h3>
              <div className="text-sm text-blue-300 space-y-1">
                <p><strong>Pipeline de Ventas:</strong> Proceso estructurado para gestionar oportunidades comerciales</p>
                <p><strong>Cultivo de Leads:</strong> Proceso de maduración de prospectos hasta convertirse en clientes</p>
                <p><strong>Personalizado:</strong> Define tu propio proceso según las necesidades específicas de tu negocio</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* LOADING OVERLAY - Igual que CompanyCreatePage */}
      {/* ============================================ */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-app-dark-800 border border-app-dark-600 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <div>
                <p className="text-app-gray-100 font-medium">Creando pipeline...</p>
                <p className="text-app-gray-400 text-sm">Por favor espera un momento</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

export default PipelineCreatePage;


// src/components/pipelines/PipelineEditor.tsx
// ✅ PIPELINE EDITOR - VERSIÓN CORREGIDA - Modal persistente sin re-mounts
// 🔥 SOLUCIÓN RADICAL: Estado de expansión independiente del formulario

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
// ZOD VALIDATION SCHEMAS - TOLERANTES
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
// 🔥 CONTEXT PARA ESTADO DE EXPANSIÓN GLOBAL
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
// STAGE ITEM COMPONENT - 🔥 CON ESTADO PERSISTENTE
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
  // 🔥 USAR CONTEXTO PARA ESTADO PERSISTENTE
  const { expandedStages, toggleExpanded } = React.useContext(StageExpansionContext);
  const isExpanded = expandedStages.has(index);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 🔥 REFS PARA VALORES QUE NO DEBEN CAUSAR RE-RENDERS
  const descriptionRef = useRef<HTMLInputElement>(null);
  const probabilityRef = useRef<HTMLInputElement>(null);

  // 🔥 HANDLERS MEMOIZADOS Y OPTIMIZADOS
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

  // 🔥 HANDLERS PARA DESCRIPCIÓN CON REFS
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    // Actualizar solo cuando termine de escribir (onBlur)
  }, []);

  const handleDescriptionBlur = useCallback(() => {
    if (descriptionRef.current) {
      onUpdate({ description: descriptionRef.current.value });
    }
  }, [onUpdate]);

  const handleProbabilityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    // Actualizar solo cuando termine de escribir (onBlur)
  }, []);

  const handleProbabilityBlur = useCallback(() => {
    if (probabilityRef.current) {
      const value = parseInt(probabilityRef.current.value) || 0;
      const clampedValue = Math.max(0, Math.min(100, value));
      onUpdate({ probability: clampedValue });
    }
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

          {/* 🔥 EXPANDED SETTINGS - COMPLETAMENTE SEPARADO DEL FORM STATE */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-app-dark-600 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-app-gray-300 mb-1">
                    Descripción
                  </label>
                  <Input
                    ref={descriptionRef}
                    defaultValue={stage.description || ''}
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
                    ref={probabilityRef}
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={stage.probability || 0}
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
  // ============================================
  // 🔥 ESTADO GLOBAL PARA EXPANSIÓN DE ETAPAS
  // ============================================
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

  // ============================================
  // HOOKS
  // ============================================
  const { createPipeline, updatePipeline, isCreating } = usePipelineOperations();
  const { data: pipelineTypes, isLoading: isLoadingTypes } = usePipelineTypes();

  // ============================================
  // FORM SETUP - OPTIMIZADO PARA MENOS RE-RENDERS
  // ============================================
  const form = useForm<PipelineEditorForm>({
    resolver: zodResolver(PipelineEditorSchema),
    mode: 'onSubmit', // 🔥 SOLO VALIDAR AL ENVIAR
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
        { name: 'Prospecto', order: 0, probability: 10, color: DEFAULT_STAGE_COLORS[0], isClosedWon: false, isClosedLost: false },
        { name: 'Calificado', order: 1, probability: 25, color: DEFAULT_STAGE_COLORS[1], isClosedWon: false, isClosedLost: false },
      ],
    },
  });

  const { fields, append, remove, move, update } = useFieldArray({
    control: form.control,
    name: 'stages',
  });

  // ============================================
  // EFFECTS
  // ============================================
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
      form.reset({
        name: pipeline.name,
        description: pipeline.description || '',
        isDefault: pipeline.isDefault || false,
        isActive: pipeline.isActive !== false,
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
  // HANDLERS
  // ============================================
  const handleAddStage = useCallback(() => {
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

    append(newStage);
  }, [fields.length, append]);

  const handleUpdateStage = useCallback((index: number, updates: Partial<PipelineEditorForm['stages'][0]>) => {
    const currentStage = fields[index];
    if (currentStage) {
      update(index, { ...currentStage, ...updates });
    }
  }, [fields, update]);

  const handleSubmit = useCallback(async (data: PipelineEditorForm) => {
    try {
      if (!data.stages || data.stages.length === 0) {
        throw new Error('Debe agregar al menos una etapa al pipeline');
      }

      const stagesForBackend = data.stages.map((stage, index) => ({
        name: stage.name,
        description: stage.description || undefined,
        position: index + 1,
        color: stage.color,
        probability: stage.probability || undefined,
        isWon: stage.isClosedWon || false,
        isLost: stage.isClosedLost || false,
        autoMoveDays: undefined,
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
          onSave?.();
        });
      }
    } catch (error) {
      console.error('Error saving pipeline:', error);
    }
  }, [mode, createPipeline, updatePipeline, pipeline, onSave]);

  // ============================================
  // RENDER
  // ============================================
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
              onClick={handleAddStage}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Añadir Etapa
            </Button>
          </div>

          {/* Lista de etapas - 🔥 KEYS ESTABLES BASADOS EN INDEX */}
          <div className="space-y-3">
            {fields.map((field, index) => (
              <StageItem
                key={`stage-${index}`} // 🔥 KEY ESTABLE BASADO EN POSICIÓN
                stage={field}
                index={index}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
                onUpdate={(updates) => handleUpdateStage(index, updates)}
                onDelete={() => remove(index)}
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
              disabled={loading || isCreating}
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
    </StageExpansionContext.Provider>
  );
};

export default PipelineEditor;



// src/hooks/usePipelines.ts
// ✅ Enterprise pipeline hooks - VERSIÓN FINAL CON REACT QUERY COMO FUENTE DE VERDAD
// El store de Zustand maneja el estado de la UI y las acciones (mutaciones).
// React Query maneja los datos del servidor (fetching, caching, invalidation).

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';
import { useQuery } from '@tanstack/react-query';

import { 
  pipelineApi,
  handlePipelineApiError  
} from '@/services/api/pipelineApi';

import type {
  PipelineDTO,
  PipelineStageDTO,
  CreatePipelineRequest,
  UpdatePipelineRequest,
  CreatePipelineStageRequest,
  UpdatePipelineStageRequest,
  ReorderPipelineStagesRequest,
  PipelineSearchCriteria,
  PipelineStageSearchCriteria,
} from '@/types/pipeline.types';

// ============================================
// REACT QUERY KEYS (ÚNICA FUENTE DE VERDAD PARA CACHÉ)
// ============================================
// Exportamos las llaves para que los componentes puedan usarlas con useQuery.

export const PIPELINES_LIST_QUERY_KEY = (criteria: PipelineSearchCriteria = {}, page = 0) => 
  ['pipelines', 'list', { ...criteria, page }];
export const PIPELINE_DETAIL_QUERY_KEY = (id: number | null) => ['pipelines', 'detail', id];
export const PIPELINE_STATS_QUERY_KEY = ['pipelines', 'stats'];
export const PIPELINE_METRICS_QUERY_KEY = (startDate?: string, endDate?: string) => 
  ['pipelines', 'metrics', { startDate, endDate }];

// Keys para Pipeline Stages
export const PIPELINE_STAGES_LIST_QUERY_KEY = (criteria: PipelineStageSearchCriteria = {}, page = 0) => 
  ['pipeline-stages', 'list', { ...criteria, page }];
export const PIPELINE_STAGE_DETAIL_QUERY_KEY = (id: number | null) => ['pipeline-stages', 'detail', id];

// Keys para tipos y templates
export const PIPELINE_TYPES_QUERY_KEY = ['pipelines', 'types'];
export const PIPELINE_TEMPLATES_QUERY_KEY = ['pipelines', 'templates'];

// ============================================
// PIPELINE STORE STATE (Simplificado: solo estado de UI y acciones)
// ============================================

interface PipelineState {
  // Estado de operaciones - Pipelines
  isCreating: boolean;
  updating: Set<number>;
  deleting: Set<number>;
  duplicating: Set<number>;
  
  // Estado de operaciones - Stages
  isCreatingStage: boolean;
  updatingStages: Set<number>;
  deletingStages: Set<number>;
  reorderingStages: boolean;
  
  // Estado para selecciones y operaciones en lote
  selectedPipelineIds: Set<number>;
  selectedStageIds: Set<number>;
  bulkOperationLoading: boolean;
  
  // Acciones de Pipeline (mutaciones y manejo de estado de UI)
  createPipeline: (request: CreatePipelineRequest, onSuccess?: (newPipeline: PipelineDTO) => void) => Promise<void>;
  updatePipeline: (id: number, request: UpdatePipelineRequest, onSuccess?: () => void) => Promise<void>;
  deletePipeline: (id: number, onSuccess?: () => void) => Promise<void>;
  duplicatePipeline: (id: number, newName: string, onSuccess?: (newPipeline: PipelineDTO) => void) => Promise<void>;

  // Acciones de Pipeline Stage
  createStage: (request: CreatePipelineStageRequest, onSuccess?: (newStage: PipelineStageDTO) => void) => Promise<void>;
  updateStage: (id: number, request: UpdatePipelineStageRequest, onSuccess?: () => void) => Promise<void>;
  deleteStage: (id: number, onSuccess?: () => void) => Promise<void>;
  reorderStages: (request: ReorderPipelineStagesRequest, onSuccess?: () => void) => Promise<void>;

  // Selección - Pipelines
  selectPipeline: (id: number) => void;
  selectAllPipelines: (pipelineIds: number[]) => void;
  deselectPipeline: (id: number) => void;
  deselectAllPipelines: () => void;
  
  // Selección - Stages
  selectStage: (id: number) => void;
  selectAllStages: (stageIds: number[]) => void;
  deselectStage: (id: number) => void;
  deselectAllStages: () => void;
  
  // Operaciones masivas
  bulkDeletePipelines: () => Promise<void>;
  bulkDeleteStages: () => Promise<void>;
}

// ============================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================

export const usePipelineStore = create<PipelineState>()(
  devtools(
    (set, get) => ({
      // INITIAL STATE
      isCreating: false,
      updating: new Set(),
      deleting: new Set(),
      duplicating: new Set(),
      isCreatingStage: false,
      updatingStages: new Set(),
      deletingStages: new Set(),
      reorderingStages: false,
      selectedPipelineIds: new Set(),
      selectedStageIds: new Set(),
      bulkOperationLoading: false,

      // ============================================
      // ACCIONES DE MUTACIÓN - PIPELINES (CUD)
      // ============================================
      
      createPipeline: async (request, onSuccess) => {
        set({ isCreating: true });
        try {
          const newPipeline = await pipelineApi.createPipeline(request);
          // Invalidar TODO lo relacionado con pipelines
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          // Forzar refetch inmediato
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'pipelines'
          });
          toast.success('Pipeline creado exitosamente');
          onSuccess?.(newPipeline);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set({ isCreating: false });
        }
      },

      updatePipeline: async (id, request, onSuccess) => {
        set(state => ({ updating: new Set(state.updating).add(id) }));
        try {
          const updatedPipeline = await pipelineApi.updatePipeline(id, request);
          // Invalidar caché de lista y detalle específico
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          await queryClient.invalidateQueries({ queryKey: PIPELINE_DETAIL_QUERY_KEY(id) });
          toast.success('Pipeline actualizado exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newUpdating = new Set(state.updating);
            newUpdating.delete(id);
            return { updating: newUpdating };
          });
        }
      },

      deletePipeline: async (id, onSuccess) => {
        set(state => ({ deleting: new Set(state.deleting).add(id) }));
        try {
          await pipelineApi.deletePipeline(id);
          // Invalidar caché
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          // Remover caché específica del pipeline eliminado
          queryClient.removeQueries({ queryKey: PIPELINE_DETAIL_QUERY_KEY(id) });
          toast.success('Pipeline eliminado exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newDeleting = new Set(state.deleting);
            newDeleting.delete(id);
            return { deleting: newDeleting };
          });
        }
      },

      duplicatePipeline: async (id, newName, onSuccess) => {
        set(state => ({ duplicating: new Set(state.duplicating).add(id) }));
        try {
          const newPipeline = await pipelineApi.duplicatePipeline(id, newName);
          // Invalidar caché
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          toast.success(`Pipeline "${newName}" duplicado exitosamente`);
          onSuccess?.(newPipeline);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newDuplicating = new Set(state.duplicating);
            newDuplicating.delete(id);
            return { duplicating: newDuplicating };
          });
        }
      },

      // ============================================
      // ACCIONES DE MUTACIÓN - PIPELINE STAGES (CUD)
      // ============================================

      createStage: async (request, onSuccess) => {
        set({ isCreatingStage: true });
        try {
          const newStage = await pipelineApi.createStage(request);
          // Invalidar caché de stages y pipeline padre
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          
          toast.success('Etapa creada exitosamente');
          onSuccess?.(newStage);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set({ isCreatingStage: false });
        }
      },

      updateStage: async (id, request, onSuccess) => {
        set(state => ({ updatingStages: new Set(state.updatingStages).add(id) }));
        try {
          // 1. Llama a la API. La respuesta 'updatedStage' SÍ contiene el pipelineId
          const updatedStage = await pipelineApi.updateStage(id, request);
          
          // 2. Invalida las cachés relacionadas con la etapa misma
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: PIPELINE_STAGE_DETAIL_QUERY_KEY(id) });

          // 3. ✅ LA SOLUCIÓN: Usa el pipelineId de la RESPUESTA para invalidar al padre
          if (updatedStage.pipelineId) {
            await queryClient.invalidateQueries({ queryKey: PIPELINE_DETAIL_QUERY_KEY(updatedStage.pipelineId) });
          }
          
          toast.success('Etapa actualizada exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newUpdating = new Set(state.updatingStages);
            newUpdating.delete(id);
            return { updatingStages: newUpdating };
          });
        }
      },

      deleteStage: async (id, onSuccess) => {
        set(state => ({ deletingStages: new Set(state.deletingStages).add(id) }));
        try {
          await pipelineApi.deleteStage(id);
          // Invalidar caché
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          queryClient.removeQueries({ queryKey: PIPELINE_STAGE_DETAIL_QUERY_KEY(id) });
          toast.success('Etapa eliminada exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newDeleting = new Set(state.deletingStages);
            newDeleting.delete(id);
            return { deletingStages: newDeleting };
          });
        }
      },

      reorderStages: async (request, onSuccess) => {
        set({ reorderingStages: true });
        try {
          const updatedPipeline = await pipelineApi.reorderStages(request);
          // Invalidar caché del pipeline y sus etapas
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: PIPELINE_DETAIL_QUERY_KEY(request.pipelineId) });
          toast.success('Etapas reordenadas exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
          throw error;
        } finally {
          set({ reorderingStages: false });
        }
      },

      // ============================================
      // BULK & SELECTION ACTIONS - PIPELINES
      // ============================================
      
      selectPipeline: (id) => set(state => ({ selectedPipelineIds: new Set(state.selectedPipelineIds).add(id) })),
      deselectPipeline: (id) => set(state => {
        const newSelection = new Set(state.selectedPipelineIds);
        newSelection.delete(id);
        return { selectedPipelineIds: newSelection };
      }),
      selectAllPipelines: (pipelineIds) => set({ selectedPipelineIds: new Set(pipelineIds) }),
      deselectAllPipelines: () => set({ selectedPipelineIds: new Set() }),

      // ============================================
      // BULK & SELECTION ACTIONS - STAGES
      // ============================================

      selectStage: (id) => set(state => ({ selectedStageIds: new Set(state.selectedStageIds).add(id) })),
      deselectStage: (id) => set(state => {
        const newSelection = new Set(state.selectedStageIds);
        newSelection.delete(id);
        return { selectedStageIds: newSelection };
      }),
      selectAllStages: (stageIds) => set({ selectedStageIds: new Set(stageIds) }),
      deselectAllStages: () => set({ selectedStageIds: new Set() }),

      // ============================================
      // BULK OPERATIONS
      // ============================================

      bulkDeletePipelines: async () => {
        const { selectedPipelineIds } = get();
        if (selectedPipelineIds.size === 0) return;
        set({ bulkOperationLoading: true });
        try {
          await pipelineApi.bulkDeletePipelines(Array.from(selectedPipelineIds));
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          set({ selectedPipelineIds: new Set() });
          toast.success(`${selectedPipelineIds.size} pipelines eliminados.`);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
        } finally {
          set({ bulkOperationLoading: false });
        }
      },

      bulkDeleteStages: async () => {
        const { selectedStageIds } = get();
        if (selectedStageIds.size === 0) return;
        set({ bulkOperationLoading: true });
        try {
          // Eliminar etapas una por una (el API no tiene bulk delete para stages)
          const promises = Array.from(selectedStageIds).map(id => pipelineApi.deleteStage(id));
          await Promise.all(promises);
          await queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
          await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          set({ selectedStageIds: new Set() });
          toast.success(`${selectedStageIds.size} etapas eliminadas.`);
        } catch (error: unknown) {
          toast.error(handlePipelineApiError(error).message);
        } finally {
          set({ bulkOperationLoading: false });
        }
      },
    }),
    {
      name: 'pipeline-store',
    }
  )
);

// ============================================
// HOOKS ESPECIALIZADOS (Exportados para uso en componentes)
// ============================================

/**
 * Hook para las operaciones de CUD (Create, Update, Delete) y estados relacionados.
 * Los componentes usarán este hook para MODIFICAR datos.
 */
export const usePipelineOperations = () => {
  const operations = usePipelineStore(state => ({
    createPipeline: state.createPipeline,
    updatePipeline: state.updatePipeline,
    deletePipeline: state.deletePipeline,
    duplicatePipeline: state.duplicatePipeline,
    isCreating: state.isCreating,
    updating: state.updating,
    deleting: state.deleting,
    duplicating: state.duplicating,
  }));

  // Devolvemos las operaciones y funciones para chequear el estado por ID
  return {
    ...operations,
    isUpdating: (id: number) => operations.updating.has(id),
    isDeleting: (id: number) => operations.deleting.has(id),
    isDuplicating: (id: number) => operations.duplicating.has(id),
  };
};

/**
 * Hook para las operaciones de etapas (stages)
 */
export const usePipelineStageOperations = () => {
  const operations = usePipelineStore(state => ({
    createStage: state.createStage,
    updateStage: state.updateStage,
    deleteStage: state.deleteStage,
    reorderStages: state.reorderStages,
    isCreatingStage: state.isCreatingStage,
    updatingStages: state.updatingStages,
    deletingStages: state.deletingStages,
    reorderingStages: state.reorderingStages,
  }));

  return {
    ...operations,
    isUpdatingStage: (id: number) => operations.updatingStages.has(id),
    isDeletingStage: (id: number) => operations.deletingStages.has(id),
  };
};

/**
 * Hook para obtener pipeline por ID
 */
export const usePipelineById = (id: number) => {
  return useQuery({
    queryKey: PIPELINE_DETAIL_QUERY_KEY(id),
    queryFn: () => pipelineApi.getPipelineById(id),
    enabled: !!id && id > 0,
  });
};

/**
 * Hook para obtener etapa por ID
 */
export const usePipelineStageById = (id: number) => {
  return useQuery({
    queryKey: PIPELINE_STAGE_DETAIL_QUERY_KEY(id),
    queryFn: () => pipelineApi.getStageById(id),
    enabled: !!id && id > 0,
  });
};

/**
 * Hook para las operaciones en lote (Bulk) y estados de selección.
 * Los componentes usarán este hook para seleccionar múltiples pipelines y hacer operaciones masivas.
 */
export const useBulkPipelineOperations = () => {
  return usePipelineStore(state => ({
    selectedPipelineIds: state.selectedPipelineIds,
    selectedStageIds: state.selectedStageIds,
    bulkOperationLoading: state.bulkOperationLoading,
    selectPipeline: state.selectPipeline,
    deselectPipeline: state.deselectPipeline,
    selectAllPipelines: state.selectAllPipelines,
    deselectAllPipelines: state.deselectAllPipelines,
    selectStage: state.selectStage,
    deselectStage: state.deselectStage,
    selectAllStages: state.selectAllStages,
    deselectAllStages: state.deselectAllStages,
    bulkDeletePipelines: state.bulkDeletePipelines,
    bulkDeleteStages: state.bulkDeleteStages,
  }));
};

// ============================================
// HOOKS DE CONSULTA (REACT QUERY)
// ============================================

/**
 * Hook para obtener estadísticas de pipelines
 */
export const usePipelineStats = () => {
  return useQuery({
    queryKey: PIPELINE_STATS_QUERY_KEY,
    queryFn: () => pipelineApi.getPipelineStats(),
  });
};

/**
 * Hook para obtener métricas detalladas de pipelines
 */
export const usePipelineMetrics = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: PIPELINE_METRICS_QUERY_KEY(startDate, endDate),
    queryFn: () => pipelineApi.getPipelineMetrics(startDate, endDate),
  });
};

/**
 * Hook para obtener tipos de pipeline
 */
export const usePipelineTypes = () => {
  return useQuery({
    queryKey: PIPELINE_TYPES_QUERY_KEY,
    queryFn: () => pipelineApi.getActivePipelineTypes(),
    staleTime: 1000 * 60 * 5, // 5 minutos - los tipos no cambian frecuentemente
  });
};

/**
 * Hook para obtener templates de pipeline
 */
export const usePipelineTemplates = () => {
  return useQuery({
    queryKey: PIPELINE_TEMPLATES_QUERY_KEY,
    queryFn: () => pipelineApi.getPipelineTemplates(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
