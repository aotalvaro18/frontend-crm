// src/pages/pipelines/PipelineEditPage.tsx
// ✅ PIPELINE EDIT PAGE - Página dedicada para editar pipelines
// Siguiendo patrones de layout de CompanyCreatePage pero para edición

import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, GitBranch, AlertCircle, Edit3, Eye } from 'lucide-react';

// ============================================
// UI & LAYOUT COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';
import { Page } from '@/components/layout/Page';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================
// PIPELINE COMPONENTS
// ============================================
import PipelineEditor from '@/components/pipelines/PipelineEditor';

// ============================================
// HOOKS & SERVICES - Siguiendo patrón Slice Vertical
// ============================================
import { 
  usePipelineOperations,
  PIPELINE_DETAIL_QUERY_KEY 
} from '@/hooks/usePipelines';
import { pipelineApi } from '@/services/api/pipelineApi';
import { useErrorHandler } from '@/hooks/useErrorHandler';

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
const PipelineEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  
  // ============================================
  // DATA FETCHING
  // ============================================
  const pipelineId = parseInt(id || '0', 10);
  
  const { 
    data: pipeline, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: PIPELINE_DETAIL_QUERY_KEY(pipelineId),
    queryFn: () => pipelineApi.getPipelineById(pipelineId),
    enabled: !!pipelineId && pipelineId > 0,
  });

  // ============================================
  // HOOKS DE ZUSTAND (Para acciones)
  // ============================================
  const { updatePipeline, isUpdating } = usePipelineOperations();

  // ============================================
  // HANDLERS
  // ============================================
  const handleBack = useCallback(() => {
    navigate(`/pipelines/${pipelineId}`);
  }, [navigate, pipelineId]);

  const handleCancel = useCallback(() => {
    navigate(`/pipelines/${pipelineId}`);
  }, [navigate, pipelineId]);

  const handleSubmit = useCallback(async (data: CreatePipelineRequest | UpdatePipelineRequest) => {
    if (!pipeline) return;
    
    // Llama a la función del store. La invalidación y los toasts se manejan solos.
    updatePipeline(pipelineId, data as UpdatePipelineRequest, () => {
      // Este callback se ejecuta solo si la actualización es exitosa.
      // Navegar de vuelta al detalle.
      navigate(`/pipelines/${pipelineId}`);
    });
  }, [updatePipeline, pipelineId, navigate, pipeline]);

  // ============================================
  // RENDER STATES
  // ============================================
  
  if (error) {
    return (
      <Page 
        title="Error al cargar Pipeline"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pipelines', href: '/pipelines' },
          { label: 'Error' }
        ]}
      >
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-app-gray-100 mb-2">Error al cargar pipeline</h2>
          <p className="text-app-gray-400 mb-4">
            {error.message || 'No se pudo cargar la información del pipeline para editarlo.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/pipelines')}>
              Volver a Pipelines
            </Button>
            <Button onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  if (isLoading || !pipeline) {
    return (
      <Page 
        title="Cargando Pipeline..."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pipelines', href: '/pipelines' },
          { label: 'Editando...' }
        ]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-app-gray-400 mt-4">Cargando información del pipeline...</p>
          </div>
        </div>
      </Page>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <Page 
      title={`Editar: ${pipeline.name}`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Pipelines', href: '/pipelines' },
        { label: pipeline.name, href: `/pipelines/${pipeline.id}` },
        { label: 'Editar' }
      ]} 
      className="space-y-6"
    >
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
            disabled={isUpdating(pipeline.id)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          
          <div className="p-2 bg-primary-500/10 rounded-lg">
            <GitBranch className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500" />
          </div>
          
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-app-gray-100">
              Editar Pipeline
            </h1>
            <p className="text-sm text-app-gray-400">
              Modifica la configuración y etapas del pipeline "{pipeline.name}"
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/pipelines/${pipeline.id}`)}
            disabled={isUpdating(pipeline.id)}
          >
            <Eye className="h-4 w-4" />
            Ver Detalles
          </Button>
        </div>
      </div>

      {/* ============================================ */}
      {/* PIPELINE INFO SUMMARY */}
      {/* ============================================ */}
      <div className="border-app-dark-600 bg-app-dark-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-app-gray-400" />
              <span className="text-sm font-medium text-app-gray-300">Editando Pipeline</span>
            </div>
            <div className="h-4 w-px bg-app-dark-600"></div>
            <div className="flex items-center gap-4 text-sm text-app-gray-400">
              <span>ID: {pipeline.id}</span>
              <span>Versión: {pipeline.version}</span>
              <span>Etapas: {pipeline.stages?.length || 0}</span>
              {pipeline.totalDeals !== undefined && (
                <span>Oportunidades: {pipeline.totalDeals}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pipeline.isDefault && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                Pipeline por Defecto
              </span>
            )}
            {!pipeline.isActive && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                Inactivo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* WARNING CARD - Información importante */}
      {/* ============================================ */}
      {pipeline.totalDeals && pipeline.totalDeals > 0 && (
        <div className="border-yellow-500/30 bg-yellow-900/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-200 mb-1">
                Pipeline con Oportunidades Activas
              </h3>
              <p className="text-sm text-yellow-300/80 mb-2">
                Este pipeline tiene <strong>{pipeline.totalDeals} oportunidades activas</strong>. 
                Los cambios en las etapas pueden afectar el flujo de deals existentes.
              </p>
              <div className="text-xs text-yellow-400">
                <strong>Recomendaciones:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Evita eliminar etapas que contengan oportunidades</li>
                  <li>Si cambias el orden, verifica que el flujo siga siendo lógico</li>
                  <li>Considera comunicar los cambios a tu equipo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* PIPELINE EDITOR - EL COMPONENTE PRINCIPAL */}
      {/* ============================================ */}
      <div className="max-w-4xl">
        <PipelineEditor
          pipeline={pipeline}
          mode="edit"
          onSave={handleSubmit}
          onCancel={handleCancel}
          loading={isUpdating(pipeline.id)}
          showActions={true}
        />
      </div>

      {/* ============================================ */}
      {/* HELP INFO - Información adicional */}
      {/* ============================================ */}
      <div className="max-w-4xl">
        <div className="border-blue-500/30 bg-blue-900/20 p-4">
          <div className="flex items-start gap-3">
            <GitBranch className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-200 mb-1">
                Consejos para Editar Pipelines
              </h3>
              <div className="text-sm text-blue-300 space-y-1">
                <p><strong>Etapas:</strong> Arrastra las etapas para reordenarlas. Asegúrate de que el flujo sea lógico.</p>
                <p><strong>Probabilidades:</strong> Asigna probabilidades realistas que reflejen las posibilidades de cierre.</p>
                <p><strong>Colores:</strong> Usa colores consistentes para facilitar la identificación en el Kanban.</p>
                <p><strong>Cierre:</strong> Marca claramente las etapas de "Ganado" y "Perdido" para el seguimiento correcto.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* LOADING OVERLAY - Igual que otros páginas de creación */}
      {/* ============================================ */}
      {isUpdating(pipeline.id) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-app-dark-800 border border-app-dark-600 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <div>
                <p className="text-app-gray-100 font-medium">Actualizando pipeline...</p>
                <p className="text-app-gray-400 text-sm">Por favor espera un momento</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

export default PipelineEditPage;