// src/pages/pipelines/PipelineCreatePage.tsx
// ✅ VERSIÓN FINAL DE TALLA MUNDIAL
// Lógica DRY, feedback al usuario con Toasts y flujo profesional robusto.

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Star, Building, ClipboardCheck, HeartHandshake, Megaphone } from 'lucide-react';

// ============================================
// UI & LAYOUT COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Page } from '@/components/layout/Page';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================
// HOOKS & SERVICES
// ============================================
import { usePipelineOperations } from '@/hooks/usePipelines';
import toast from 'react-hot-toast'; // ✅ CORREGIDO: Import correcto para toasts

// ============================================
// TYPES & CONSTANTS
// ============================================
import { 
  DEFAULT_PIPELINE_TEMPLATES,
  DEFAULT_STAGE_COLORS,
  type CreatePipelineRequest,
  type CreatePipelineStageRequest
} from '@/types/pipeline.types';

// ✅ HELPER PARA NO REPETIR CÓDIGO (DRY) - Función corregida quirúrgicamente
const createBasePipelineRequest = (): Omit<CreatePipelineRequest, 'name' | 'description' | 'stages' | 'icon' | 'category'> => ({
  // category: 'BUSINESS', // ← REMOVIDO: Ya no hardcodeamos la categoría
  color: '#3B82F6',
  active: true, // ✅ Backend field correcto (no isActive)
  isDefault: false,
  enableAutomations: false,
  enableNotifications: true,
  enableReports: true,
});

// ============================================
// MAIN COMPONENT
// ============================================
const PipelineCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { createPipeline, isCreating } = usePipelineOperations();
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null);

  const handleBack = useCallback(() => navigate('/settings/pipelines'), [navigate]);

  // ✅ HANDLER CENTRALIZADO PARA LA CREACIÓN Y NAVEGACIÓN
  const handleCreateAndNavigate = useCallback(async (request: CreatePipelineRequest) => {
    try {
      await createPipeline(request, (newPipeline) => {
        if (newPipeline?.id) {
          //toast.success(`Pipeline "${newPipeline.name}" creado. ¡Ahora puedes personalizarlo!`);
          navigate(`/settings/pipelines/${newPipeline.id}/edit`);
        } else {
          toast.error("Error: No se pudo obtener el ID del pipeline creado.");
          navigate('/settings/pipelines'); 
        }
      });
    } catch (error) {
      //toast.error("No se pudo crear el pipeline. Verifica tu conexión e inténtalo de nuevo."); //ojo
      console.error("Error al crear el pipeline:", error);
      setCreatingTemplate(null);
    }
  }, [createPipeline, navigate]);

  // ✅ HANDLER REFACTORIZADO PARA PLANTILLAS - Usa categoría de la plantilla
  const handleSelectTemplate = useCallback(async (templateKey: string) => {
    setCreatingTemplate(templateKey);
    
    const template = DEFAULT_PIPELINE_TEMPLATES[templateKey as keyof typeof DEFAULT_PIPELINE_TEMPLATES];
    if (!template) {
      toast.error("La plantilla seleccionada no es válida.");
      setCreatingTemplate(null);
      return;
    }

    const request: CreatePipelineRequest = {
      ...createBasePipelineRequest(),
      name: template.name,
      description: template.description,
      category: template.category, // ✅ CORREGIDO: Usar categoría de la plantilla
      icon: template.icon?.toLowerCase().replace(/[^a-z0-9\-_]/g, '') || 'gitbranch',
      stages: template.stages.map((stage, index): CreatePipelineStageRequest => ({
        name: stage.name,
      
        // Tus plantillas no tienen 'description', así que este campo siempre será undefined.
        // Lo dejamos por si en el futuro añades descripciones a las plantillas.
        description: (stage as any).description || undefined,
      
        // 'orderIndex' siempre existe en tus plantillas.
        position: stage.orderIndex + 1,
        
        // 'color' siempre existe en tus plantillas.
        color: stage.color,
      
        // ✅ CORRECCIÓN CLAVE: Si 'probability' no existe en la plantilla,
        // usa un valor por defecto (ej. 0) o undefined.
        probability: 'probability' in stage ? stage.probability : undefined,
      
        // Si 'isClosedWon' no existe, asume 'false'.
        isWon: 'isClosedWon' in stage ? stage.isClosedWon : false,
      
        // Si 'isClosedLost' no existe, asume 'false'.
        isLost: 'isClosedLost' in stage ? stage.isClosedLost : false,
        
        active: true,
      })),
    };
    
    await handleCreateAndNavigate(request);
  }, [handleCreateAndNavigate]);

  // ✅ HANDLER REFACTORIZADO PARA "DESDE CERO" - Usa categoría GENERAL
  const handleStartFromScratch = useCallback(async () => {
    setCreatingTemplate('scratch');
    
    const request: CreatePipelineRequest = {
      ...createBasePipelineRequest(),
      name: 'Nuevo Pipeline',
      description: 'Pipeline personalizado creado desde cero',
      category: 'GENERAL', // ✅ CORREGIDO: Categoría apropiada para pipelines desde cero
      icon: 'gitbranch',
      stages: [
        { 
          name: 'Prospecto', 
          position: 1, 
          probability: 10, 
          color: DEFAULT_STAGE_COLORS[0], 
          isWon: false, 
          isLost: false, 
          active: true 
        },
        { 
          name: 'Calificado', 
          position: 2, 
          probability: 50, 
          color: DEFAULT_STAGE_COLORS[1], 
          isWon: false, 
          isLost: false, 
          active: true 
        },
      ],
    };

    await handleCreateAndNavigate(request);
  }, [handleCreateAndNavigate]);

  // ============================================
  // TEMPLATE DATA - Mobile First & Responsive
  // ============================================
  const templateOptions = [
    {
      key: 'BUSINESS_SALES',
      name: DEFAULT_PIPELINE_TEMPLATES.BUSINESS_SALES.name,
      description: DEFAULT_PIPELINE_TEMPLATES.BUSINESS_SALES.description,
      icon: Building,
      color: 'blue',
      stages: DEFAULT_PIPELINE_TEMPLATES.BUSINESS_SALES.stages.map(s => s.name),
      popular: true,
    },
    {
      key: 'BUSINESS_SERVICE_DELIVERY',
      name: DEFAULT_PIPELINE_TEMPLATES.BUSINESS_SERVICE_DELIVERY.name,
      description: DEFAULT_PIPELINE_TEMPLATES.BUSINESS_SERVICE_DELIVERY.description,
      icon: ClipboardCheck,
      color: 'green',
      stages: DEFAULT_PIPELINE_TEMPLATES.BUSINESS_SERVICE_DELIVERY.stages.map(s => s.name),
      popular: false,
    },
    {
      key: 'CHURCH_CONSOLIDATION',
      name: DEFAULT_PIPELINE_TEMPLATES.CHURCH_CONSOLIDATION.name,
      description: DEFAULT_PIPELINE_TEMPLATES.CHURCH_CONSOLIDATION.description,
      icon: HeartHandshake,
      color: 'purple',
      stages: DEFAULT_PIPELINE_TEMPLATES.CHURCH_CONSOLIDATION.stages.map(s => s.name),
      popular: false,
    },
    {
      key: 'NONPROFIT_VOLUNTEER_MANAGEMENT',
      name: DEFAULT_PIPELINE_TEMPLATES.NONPROFIT_VOLUNTEER_MANAGEMENT.name,
      description: DEFAULT_PIPELINE_TEMPLATES.NONPROFIT_VOLUNTEER_MANAGEMENT.description,
      icon: Megaphone,
      color: 'green',
      stages: DEFAULT_PIPELINE_TEMPLATES.NONPROFIT_VOLUNTEER_MANAGEMENT.stages.map(s => s.name),
      popular: false,
    }
  ];

  // ============================================
  // RENDER - Mobile First & Responsive Design
  // ============================================
  return (
    <Page 
      title="Nuevo Pipeline" 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Pipelines', href: '/settings/pipelines' },
        { label: 'Nuevo Pipeline' }
      ]}
      className="space-y-6"
    >
      {/* ============================================ */}
      {/* HEADER - Mobile First & Responsive */}
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
            <span className="hidden sm:inline">Volver</span>
          </Button>
          
          <div className="p-2 bg-primary-500/10 rounded-lg">
            <GitBranch className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500" />
          </div>
          
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-app-gray-100">
              Nuevo Pipeline
            </h1>
            <p className="text-sm text-app-gray-400">
              Elige una plantilla para crear tu proceso de negocio
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* TEMPLATE SELECTION - Grid Responsive */}
      {/* ============================================ */}
      <div className="max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/10 rounded-full mb-4">
            <GitBranch className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-app-gray-100 mb-2">
            Elige una Plantilla
          </h1>
          <p className="text-sm text-app-gray-400">
            Selecciona una plantilla para crear tu pipeline inmediatamente
          </p>
        </div>

        {/* Grid adapta en mobile: 1 columna en mobile, 2 en desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templateOptions.map((template) => {
            const Icon = template.icon;
            const isCreatingThis = creatingTemplate === template.key;
            const colorClasses = {
              blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
              green: 'bg-green-500/10 border-green-500/30 text-green-400', 
              purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
            };

            return (
              <div
                key={template.key}
                className={`p-6 border border-app-dark-600 bg-app-dark-800/50 hover:bg-app-dark-700/50 transition-colors rounded-lg ${
                  isCreating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
                onClick={() => !isCreating && handleSelectTemplate(template.key)}
              >
                {/* Contenido con spinner condicional */}
                {isCreatingThis ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <LoadingSpinner size="lg" />
                      <p className="text-sm text-app-gray-400 mt-3">
                        Creando pipeline...
                      </p>
                    </div>
                  </div>
                ) : (
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
                )}
              </div>
            );
          })}
        </div>

        {/* Botón "Empezar desde Cero" con spinner */}
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            onClick={handleStartFromScratch}
            disabled={isCreating}
            className="flex items-center gap-2"
          >
            {creatingTemplate === 'scratch' ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Star className="h-4 w-4" />
            )}
            {creatingTemplate === 'scratch' ? 'Creando...' : 'Empezar desde Cero'}
          </Button>
        </div>
      </div>

      {/* ============================================ */}
      {/* HELPER TEXT */}
      {/* ============================================ */}
      <div className="max-w-4xl mt-8">
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <GitBranch className="h-5 w-5 text-blue-400 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-200 mb-1">
                Flujo Simplificado
              </h3>
              <div className="text-sm text-blue-300 space-y-1">
                <p><strong>1. Selecciona:</strong> Elige una plantilla que se ajuste a tu proceso</p>
                <p><strong>2. Crea:</strong> El pipeline se crea automáticamente en tu sistema</p>
                <p><strong>3. Personaliza:</strong> Edita las etapas según tus necesidades específicas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* LOADING OVERLAY GLOBAL */}
      {/* ============================================ */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-app-dark-800 border border-app-dark-600 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center space-x-3">
              <LoadingSpinner size="md" />
              <div>
                <p className="text-app-gray-100 font-medium">Creando pipeline...</p>
                <p className="text-app-gray-400 text-sm">Configurando etapas y procesos</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

export default PipelineCreatePage;