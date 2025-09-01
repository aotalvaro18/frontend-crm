// src/pages/PipelineCreatePage.tsx
// ✅ PIPELINE CREATE PAGE - Siguiendo exactamente el patrón de CompanyCreatePage
// React Query maneja el fetching, Zustand maneja las acciones y estado de UI

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Zap, Star, Building } from 'lucide-react';

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
//import { useErrorHandler } from '@/hooks/useErrorHandler';

// ============================================
// TYPES
// ============================================
import type { 
  CreatePipelineRequest, 
  UpdatePipelineRequest 
} from '@/types/pipeline.types';

// ============================================
// MAIN COMPONENT
// ============================================
const PipelineCreatePage: React.FC = () => {
  const navigate = useNavigate();
  //const { handleError } = useErrorHandler();
  
  // ============================================
  // LOCAL STATE
  // ============================================
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);

  // ============================================
  // HOOKS DE ZUSTAND (Para acciones)
  // ============================================
  // ✅ USA EL HOOK PARA OBTENER LA LÓGICA DE MUTACIÓN Y EL ESTADO DE CARGA
  const { createPipeline, isCreating } = usePipelineOperations();
  //const { data: templates, isLoading: isLoadingTemplates } = usePipelineTemplates();

  // ============================================
  // HANDLERS
  // ============================================
  const handleBack = useCallback(() => {
    navigate('/pipelines');
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate('/pipelines');
  }, [navigate]);

  const handleSubmit = useCallback(async (data: CreatePipelineRequest | UpdatePipelineRequest) => {
    // Llama a la función del store. La invalidación y los toasts se manejan solos.
    createPipeline(data as CreatePipelineRequest, (newPipeline) => {
      // Este callback se ejecuta solo si la creación es exitosa.
      // Ideal para la navegación.
      navigate(`/pipelines/${newPipeline.id}`);
    });
  }, [createPipeline, navigate]);

  const handleUseTemplate = useCallback((templateKey: string) => {
    setSelectedTemplate(templateKey);
    setShowTemplates(false);
  }, []);

  const handleStartFromScratch = useCallback(() => {
    setSelectedTemplate(null);
    setShowTemplates(false);
  }, []);

  // ============================================
  // TEMPLATE DATA
  // ============================================
  const templateOptions = [
    {
      key: 'SALES',
      name: 'Pipeline de Ventas B2B',
      description: 'Proceso estándar de ventas para empresas',
      icon: Building,
      color: 'blue',
      stages: ['Prospecto', 'Calificado', 'Propuesta', 'Negociación', 'Cerrado Ganado', 'Cerrado Perdido'],
      popular: true,
    },
    {
      key: 'LEAD_NURTURING', 
      name: 'Cultivo de Leads',
      description: 'Proceso de maduración de leads hasta conversión',
      icon: Zap,
      color: 'green',
      stages: ['Lead Frío', 'Lead Interesado', 'Lead Caliente', 'MQL', 'SQL', 'Convertido'],
      popular: false,
    },
    {
      key: 'CUSTOM',
      name: 'Pipeline Personalizado',
      description: 'Crea tu propio proceso desde cero',
      icon: Star,
      color: 'purple',
      stages: ['Personalizable según tus necesidades'],
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
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Pipelines', href: '/pipelines' },
        { label: 'Nuevo Pipeline' }
      ]} 
      className="space-y-6"
    >
      {/* Header */}
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
              Crea un nuevo proceso de negocio para gestionar oportunidades
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* TEMPLATE SELECTION - Nueva funcionalidad */}
      {/* ============================================ */}
      {showTemplates && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-app-gray-100 mb-2">
              Elige una Plantilla
            </h2>
            <p className="text-sm text-app-gray-400">
              Usa una plantilla predefinida o crea tu pipeline desde cero
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="p-6 border border-app-dark-600 bg-app-dark-800/50 hover:bg-app-dark-700/50 transition-colors cursor-pointer rounded-lg" // <-- AÑADIDO: 'border' y 'rounded-lg'
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
                {selectedTemplate ? `Pipeline basado en: ${templateOptions.find(t => t.key === selectedTemplate)?.name}` : 'Pipeline Personalizado'}
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
      <div className="max-w-4xl">
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