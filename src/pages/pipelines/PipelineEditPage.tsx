// src/pages/pipelines/PipelineEditPage.tsx
// ✅ VERSIÓN FINAL DE TALLA MUNDIAL
// Orquestador robusto que gestiona la carga, los estados de error y delega la edición.

import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle, Edit3 } from 'lucide-react';

// ============================================
// UI & LAYOUT COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';
import { Page } from '@/components/layout/Page';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PipelineEditor from '@/components/pipelines/PipelineEditor';

// ============================================
// HOOKS & SERVICES
// ============================================
import { usePipelineOperations, PIPELINE_DETAIL_QUERY_KEY } from '@/hooks/usePipelines';
import { pipelineApi } from '@/services/api/pipelineApi';

// ============================================
// MAIN COMPONENT
// ============================================
const PipelineEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pipelineId = parseInt(id || '0', 10);

  // ============================================
  // DATA FETCHING with React Query
  // ============================================
  const { data: pipeline, isLoading, error, refetch } = useQuery({
    queryKey: PIPELINE_DETAIL_QUERY_KEY(pipelineId),
    queryFn: () => {
      console.log(`🔥 Fetching pipeline with ID: ${pipelineId}`);
      return pipelineApi.getPipelineById(pipelineId);
    },
    enabled: !!pipelineId && pipelineId > 0, // Solo ejecutar si el ID es válido
    retry: 1, // Reintentar una vez en caso de fallo
    refetchOnWindowFocus: false, // Evitar refetch innecesario al cambiar de pestaña
  });

  const { isUpdating } = usePipelineOperations();

  // ============================================
  // HANDLERS
  // ============================================
  const handleBack = useCallback(() => {
    navigate('/settings/pipelines');
  }, [navigate]);

  const handleSaveSuccess = useCallback(() => {
    // Al guardar con éxito, volver a la lista de pipelines
    navigate('/settings/pipelines');
  }, [navigate]);

  // ============================================
  // RENDER STATES - Gestion de Carga y Errores
  // ============================================

  if (isLoading) {
    return (
      <Page title="Cargando Pipeline...">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-app-gray-400 mt-4">Cargando datos del pipeline...</p>
          </div>
        </div>
      </Page>
    );
  }

  if (error || !pipeline) {
    return (
      <Page title="Error al Cargar Pipeline">
        <div className="text-center py-20 max-w-lg mx-auto">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-app-gray-100 mb-2">
            No se pudo cargar el pipeline
          </h2>
          <p className="text-app-gray-400 mb-6">
            {error?.message || 'El pipeline que intentas editar no existe o ocurrió un error al cargarlo.'}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" onClick={handleBack}>
              Volver a la lista
            </Button>
            <Button onClick={() => refetch()}>
              Reintentar Carga
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  const isCurrentlyUpdating = isUpdating(pipeline.id);

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <Page 
      title={`Editar: ${pipeline.name}`}
      breadcrumbs={[
        { label: 'Pipelines', href: '/settings/pipelines' },
        { label: pipeline.name },
        { label: 'Editar' }
      ]} 
      className="space-y-6"
    >
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="p-2" disabled={isCurrentlyUpdating}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div className="p-2 bg-primary-500/10 rounded-lg">
            <Edit3 className="h-6 w-6 text-primary-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-app-gray-100">Editar Pipeline</h1>
            <p className="text-sm text-app-gray-400">Modifica la configuración de "{pipeline.name}"</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          
        </div>
      </div>

      {/* WARNING CARD - Pipeline con Oportunidades Activas */}
      {pipeline.totalDeals && pipeline.totalDeals > 0 && (
        <div className="border-yellow-500/30 bg-yellow-900/20 p-4 rounded-lg">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-200 mb-1">
                Pipeline con Oportunidades Activas
              </h3>
              <p className="text-sm text-yellow-300/80 mb-2">
                Este pipeline tiene <strong>{pipeline.totalDeals} oportunidades</strong>. 
                Los cambios en las etapas podrían afectar su flujo.
              </p>
              <div className="text-xs text-yellow-400">
                <strong>Recomendación:</strong> Evita eliminar etapas que contengan oportunidades activas.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIPELINE EDITOR COMPONENT */}
      <div className="max-w-5xl">
        <PipelineEditor
          pipeline={pipeline}
          onSave={handleSaveSuccess}
          onCancel={handleBack}
          loading={isCurrentlyUpdating}
          showActions={true}
        />
      </div>

      {/* LOADING OVERLAY */}
      {isCurrentlyUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-app-dark-800 border border-app-dark-600 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center space-x-3">
              <LoadingSpinner size="md" />
              <div>
                <p className="text-app-gray-100 font-medium">Actualizando pipeline...</p>
                <p className="text-app-gray-400 text-sm">Guardando tus cambios...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

export default PipelineEditPage;