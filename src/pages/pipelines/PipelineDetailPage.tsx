// src/pages/pipelines/PipelineDetailPage.tsx
// ✅ PIPELINE DETAIL PAGE - Siguiendo exactamente el patrón de CompanyDetailPage
// Obtiene los datos del pipeline con useQuery y usa el store de Zustand para las acciones.

import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Edit3, Trash2, Copy, Settings, Eye, MoreHorizontal,
  GitBranch, Target, BarChart3, TrendingUp, Clock,
  CheckCircle, X, AlertCircle
} from 'lucide-react';

// ============================================
// UI COMPONENTS
// ============================================
import { Page } from '@/components/layout/Page';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

import Dropdown from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';

// ============================================
// SHARED COMPONENTS
// ============================================
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatsCards } from '@/components/shared/StatsCards';
import type { StatCardConfig } from '@/components/shared/StatsCards';

// ============================================
// HOOKS & SERVICES - Siguiendo patrón Slice Vertical
// ============================================
import { 
  usePipelineOperations,
  PIPELINE_DETAIL_QUERY_KEY
} from '@/hooks/usePipelines';
import { pipelineApi } from '@/services/api/pipelineApi';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { toastSuccess } from '@/services/notifications/toastService';

// ============================================
// TYPES
// ============================================
import type { 
  PipelineDTO,
  PipelineStageDTO
  
} from '@/types/pipeline.types';

import { 
    DEFAULT_STAGE_COLORS // <-- Importa la constante como un VALOR
  } from '@/types/pipeline.types';

import { 
    PERFORMANCE_STATUS_LABELS // <-- Importa la constante como un VALOR
  } from '@/types/pipeline.types';


import { formatters } from '@/utils/formatters';

// ============================================
// PIPELINE STAGE ITEM COMPONENT
// ============================================
interface PipelineStageItemProps {
  stage: PipelineStageDTO;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit?: (stage: PipelineStageDTO) => void;
  onDelete?: (stage: PipelineStageDTO) => void;
}

const PipelineStageItem: React.FC<PipelineStageItemProps> = ({
  stage,
  index,
  onEdit,
  onDelete
}) => {
  const getStageIcon = () => {
    if (stage.isClosedWon) return <CheckCircle className="h-4 w-4 text-green-400" />;
    if (stage.isClosedLost) return <X className="h-4 w-4 text-red-400" />;
    return <Target className="h-4 w-4 text-blue-400" />;
  };

  const stageColor = stage.color || DEFAULT_STAGE_COLORS[index % DEFAULT_STAGE_COLORS.length];

  // Stage dropdown items
  const stageActionItems = [
    { id: 'edit', label: 'Editar Etapa', icon: Edit3, onClick: () => onEdit?.(stage) },
    { type: 'separator' as const },
    { id: 'delete', label: 'Eliminar Etapa', icon: Trash2, onClick: () => onDelete?.(stage), className: 'text-red-400 hover:text-red-300' },
  ];

  return (
    <div className="border border-app-dark-600 bg-app-dark-700/50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Order indicator */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-app-dark-600 flex items-center justify-center text-xs font-medium text-app-gray-300">
            {(stage.orderIndex || index) + 1}
            </div>
            <div 
              className="w-4 h-4 rounded border-2 border-app-dark-400"
              style={{ backgroundColor: stageColor }}
            />
          </div>

          {/* Stage info */}
          <div>
            <div className="flex items-center gap-2">
              {getStageIcon()}
              <h3 className="font-medium text-app-gray-100">{stage.name}</h3>
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
        </div>

        {/* Stage metrics */}
        <div className="flex items-center gap-4 text-sm text-app-gray-400">
          {stage.dealCount !== undefined && (
            <div className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>{stage.dealCount} deals</span>
            </div>
          )}
          {stage.totalValue !== undefined && stage.totalValue > 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{formatters.currency(stage.totalValue)}</span>
            </div>
          )}
          {stage.averageTimeInStage !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{stage.averageTimeInStage} días</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Dropdown
            trigger={
              <IconButton variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </IconButton>
            }
            items={stageActionItems}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const PipelineDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();

  // ============================================
  // LOCAL STATE
  // ============================================
  const [pipelineToDelete, setPipelineToDelete] = useState<PipelineDTO | null>(null);
  const [stageToDelete, setStageToDelete] = useState<PipelineStageDTO | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');

  // ============================================
  // DATA FETCHING CON REACT QUERY (ÚNICA FUENTE DE VERDAD)
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
  const { deletePipeline, duplicatePipeline, isDeleting, isDuplicating } = usePipelineOperations();

  // ============================================
  // HANDLERS
  // ============================================
  const handleBack = useCallback(() => {
    navigate('/settings/pipelines');
  }, [navigate]);

  const handleEdit = useCallback(() => {
    navigate(`/settings/pipelines/${pipelineId}/edit`);
  }, [navigate, pipelineId]);

  const handleDeleteClick = useCallback(() => {
    if (pipeline) {
      setPipelineToDelete(pipeline);
    }
  }, [pipeline]);

  const handleConfirmDelete = useCallback(async () => {
    if (!pipelineToDelete) return;
    
    try {
      await deletePipeline(pipelineToDelete.id, () => {
        setPipelineToDelete(null);
        navigate('/pipelines');
        toastSuccess('Pipeline eliminado exitosamente');
      });
    } catch (error) {
      handleError(error);
    }
  }, [pipelineToDelete, deletePipeline, navigate, handleError]);

  const handleDuplicateClick = useCallback(() => {
    if (pipeline) {
      setDuplicateName(`${pipeline.name} (Copia)`);
      setShowDuplicateDialog(true);
    }
  }, [pipeline]);

  const handleConfirmDuplicate = useCallback(async () => {
    if (!pipeline || !duplicateName.trim()) return;
    
    try {
      await duplicatePipeline(pipeline.id, duplicateName.trim(), (newPipeline) => {
        setShowDuplicateDialog(false);
        setDuplicateName('');
        navigate(`/pipelines/${newPipeline.id}`);
        toastSuccess(`Pipeline "${duplicateName}" duplicado exitosamente`);
      });
    } catch (error) {
      handleError(error);
    }
  }, [pipeline, duplicateName, duplicatePipeline, navigate, handleError]);

  const handleStageEdit = useCallback((stage: PipelineStageDTO) => {
    // TODO: Implementar edición de etapa individual o abrir modal
    console.log('Edit stage:', stage);
  }, []);

  const handleStageDelete = useCallback((stage: PipelineStageDTO) => {
    setStageToDelete(stage);
  }, []);

  // ============================================
  // DROPDOWN ITEMS CONFIGURATION
  // ============================================
  const mainActionItems = [
    { id: 'duplicate', label: 'Duplicar Pipeline', icon: Copy, onClick: handleDuplicateClick },
    { id: 'kanban', label: 'Ver en Kanban', icon: Eye, onClick: () => navigate(`/deals?pipeline=${pipeline?.id}`) },
    { type: 'separator' as const },
    { id: 'delete', label: 'Eliminar Pipeline', icon: Trash2, onClick: handleDeleteClick, className: 'text-red-400 hover:text-red-300' },
  ];

  // ============================================
  // STATS CARDS CONFIGURATION
  // ============================================
  const pipelineStatConfigs: StatCardConfig[] = [
    { 
      key: 'stageCount', 
      title: 'Etapas', 
      description: 'Número de etapas en este pipeline', 
      icon: Target, 
      variant: 'default', 
      format: 'number' 
    },
    { 
      key: 'totalDeals', 
      title: 'Oportunidades', 
      description: 'Deals activos en el pipeline', 
      icon: BarChart3, 
      variant: 'info', 
      format: 'number' 
    },
    { 
      key: 'totalValue', 
      title: 'Valor Total', 
      description: 'Valor total de las oportunidades', 
      icon: TrendingUp, 
      variant: 'success', 
      format: 'currency' 
    },
    { 
      key: 'averageCloseTime', 
      title: 'Tiempo Promedio', 
      description: 'Días promedio para cerrar', 
      icon: Clock, 
      variant: 'warning', 
      format: 'number',
      suffix: ' días'
    },
  ];

  // ============================================
  // RENDER STATES
  // ============================================
  if (error) {
    return (
      <Page title="Error al cargar Pipeline">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-app-gray-100 mb-2">Error al cargar pipeline</h2>
          <p className="text-app-gray-400 mb-4">
            {error.message || 'No se pudo cargar la información del pipeline.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={handleBack}>
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
      <Page title="Cargando...">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Page>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <Page 
      title={pipeline.name}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Pipelines', href: '/pipelines' },
        { label: pipeline.name }
      ]}
      className="space-y-6"
    >
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          
          <div className="p-2 bg-primary-500/10 rounded-lg">
            <GitBranch className="h-6 w-6 text-primary-500" />
          </div>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-app-gray-100">
                {pipeline.name}
              </h1>
              {pipeline.isDefault && (
                <Badge variant="success">Por Defecto</Badge>
              )}
              {!pipeline.isActive && (
                <Badge variant="secondary">Inactivo</Badge>
              )}
              {pipeline.performanceStatus && (
                <Badge 
                variant={
                    pipeline.performanceStatus === 'excellent' ? 'success' :
                    pipeline.performanceStatus === 'good' ? 'info' :
                    pipeline.performanceStatus === 'warning' ? 'warning' : 'destructive' // ✅ CAMBIO: 'danger' -> 'destructive'
                }
                >
                  {PERFORMANCE_STATUS_LABELS[pipeline.performanceStatus]}
                </Badge>
              )}
            </div>
            {pipeline.description && (
              <p className="text-app-gray-400">
                {pipeline.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-app-gray-500">
              <span>ID: {pipeline.id}</span>
              <span>Versión: {pipeline.version}</span>
              {pipeline.ownerName && (
                <span>Propietario: {pipeline.ownerName}</span>
              )}
              {pipeline.updatedAt && (
                <span>Actualizado: {formatters.relativeDate(pipeline.updatedAt)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleEdit}>
            <Edit3 className="h-4 w-4" />
            Editar
          </Button>
          
          <Dropdown
            trigger={
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
            items={mainActionItems}
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* STATS CARDS */}
      {/* ============================================ */}
      <StatsCards
        configs={pipelineStatConfigs}
        stats={{
          stageCount: pipeline.stages?.length || 0,
          totalDeals: pipeline.totalDeals || 0,
          totalValue: pipeline.totalValue || 0,
          averageCloseTime: pipeline.averageCloseTime || 0,
        }}
        
      />

      {/* ============================================ */}
      {/* PIPELINE STAGES - LA PARTE MÁS IMPORTANTE */}
      {/* ============================================ */}
      <div className="border border-app-dark-600 bg-app-dark-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-app-gray-100">
              Etapas del Pipeline ({pipeline.stages?.length || 0})
            </h2>
            <p className="text-sm text-app-gray-400">
              Configuración actual de las etapas del proceso de negocio
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={handleEdit}
          >
            <Settings className="h-4 w-4" />
            Configurar Etapas
          </Button>
        </div>

        {/* Stages list */}
        {pipeline.stages && pipeline.stages.length > 0 ? (
          <div className="space-y-4">
            {pipeline.stages
              .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
              .map((stage, index) => (
                <PipelineStageItem
                  key={stage.id}
                  stage={stage}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === (pipeline.stages?.length || 0) - 1}
                  onEdit={handleStageEdit}
                  onDelete={handleStageDelete}
                />
              ))
            }
          </div>
        ) : (
          <EmptyState
            icon={Target}
            title="No hay etapas configuradas"
            description="Este pipeline no tiene etapas definidas. Edita el pipeline para añadir etapas."
            action={
              <Button onClick={handleEdit}>
                <Settings className="h-4 w-4" />
                Configurar Etapas
              </Button>
            }
          />
        )}
      </div>

      {/* ============================================ */}
      {/* ADDITIONAL INFO */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Configuration */}
        <div className="border border-app-dark-600 bg-app-dark-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-app-gray-100 mb-4">
            Configuración
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-app-gray-400">Estado:</span>
              <Badge variant={pipeline.isActive ? 'success' : 'secondary'}>
                {pipeline.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-app-gray-400">Pipeline por defecto:</span>
              <Badge variant={pipeline.isDefault ? 'success' : 'outline'}>
                {pipeline.isDefault ? 'Sí' : 'No'}
              </Badge>
            </div>
            {pipeline.conversionRate !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-app-gray-400">Tasa de conversión:</span>
                <span className="text-app-gray-200 font-mono">
                  {pipeline.conversionRate}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border border-app-dark-600 bg-app-dark-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-app-gray-100 mb-4">
            Actividad Reciente
          </h3>
          <div className="text-center py-8 text-app-gray-400">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Función de actividad reciente próximamente</p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODALES DE CONFIRMACIÓN */}
      {/* ============================================ */}

      {/* Delete Pipeline Confirmation */}
      <ConfirmDialog
        isOpen={!!pipelineToDelete}
        onClose={() => setPipelineToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Pipeline"
        description={`¿Estás seguro de que quieres eliminar el pipeline "${pipelineToDelete?.name}"? Esta acción no se puede deshacer y se eliminarán todas las etapas asociadas.`}
        confirmLabel="Eliminar Pipeline"
        isConfirming={pipelineToDelete ? isDeleting(pipelineToDelete.id) : false}
      />

      {/* Duplicate Pipeline Confirmation */}
      <ConfirmDialog
        isOpen={showDuplicateDialog}
        onClose={() => {
          setShowDuplicateDialog(false);
          setDuplicateName('');
        }}
        onConfirm={handleConfirmDuplicate}
        title="Duplicar Pipeline"
        description={`Se creará una copia del pipeline "${pipeline?.name}" con todas sus etapas.`}
        confirmLabel="Duplicar Pipeline"
        
        isConfirming={pipeline ? isDuplicating(pipeline.id) : false}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-app-gray-300 mb-2">
            Nombre del nuevo pipeline
          </label>
          <Input
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
            placeholder="Ingresa el nombre del nuevo pipeline"
            className="w-full"
          />
        </div>
      </ConfirmDialog>

      {/* Delete Stage Confirmation */}
      {stageToDelete && (
        <ConfirmDialog
          isOpen={!!stageToDelete}
          onClose={() => setStageToDelete(null)}
          onConfirm={() => {
            // TODO: Implementar eliminación de etapa
            setStageToDelete(null);
          }}
          title="Eliminar Etapa"
          description={`¿Estás seguro de que quieres eliminar la etapa "${stageToDelete.name}"?`}
          confirmLabel="Eliminar Etapa"
          />
      )}
    </Page>
  );
};

export default PipelineDetailPage;