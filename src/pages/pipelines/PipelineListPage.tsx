// src/pages/pipelines/PipelineListPage.tsx
// ✅ PIPELINE LIST PAGE - Replicando exactamente CompanyListPage.tsx
// EL KANBAN PRINCIPAL - Donde se muestran los deals fluyendo por las etapas
// 🔧 ACTUALIZADO: Con dropdown de acciones estilo Salesforce

import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, Settings, Filter, Search, X,
  Target, BarChart3, TrendingUp,
  RefreshCw, GitBranch,
  // 🔧 NUEVOS IMPORTS: Para dropdown de acciones
  MoreHorizontal, Eye, Edit3
} from 'lucide-react';

// ============================================
// UI COMPONENTS - Siguiendo patrón de CompanyListPage
// ============================================
import { Page } from '@/components/layout/Page';
import { Input } from '@/components/ui/Input';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
// 🔧 NUEVO IMPORT: Dropdown component
import Dropdown from '@/components/ui/Dropdown';

// ============================================
// SHARED COMPONENTS - Reutilizando exactamente como Companies
// ============================================
import { StatsCards } from '@/components/shared/StatsCards';
import type { StatCardConfig } from '@/components/shared/StatsCards';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

// ============================================
// PIPELINE COMPONENTS - Componentes específicos
// ============================================
import PipelineSelector from '@/components/pipelines/PipelineSelector';
// import { DealKanbanView } from '@/components/deals/DealKanbanView'; // TODO: Crear después

// ============================================
// HOOKS & SERVICES - Siguiendo patrón Slice Vertical
// ============================================
import { 
  usePipelineOperations,
  PIPELINE_STATS_QUERY_KEY,
  PIPELINES_LIST_QUERY_KEY
} from '@/hooks/usePipelines';
import { pipelineApi } from '@/services/api/pipelineApi';
import { useSearchDebounce } from '@/hooks/useDebounce';
import { useErrorHandler } from '@/hooks/useErrorHandler';
//import { toastSuccess } from '@/services/notifications/toastService';

// ============================================
// TYPES - Importando desde types como CompanyListPage
// ============================================
import type { 
  PipelineDTO, 
  PipelineSearchCriteria
} from '@/types/pipeline.types';
import { cn } from '@/utils/cn';
import { formatters } from '@/utils/formatters';

// ============================================
// MAIN COMPONENT
// ============================================
const PipelineListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ============================================
  // LOCAL STATE para UI y Filtros - Mismo patrón que CompanyListPage
  // ============================================
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage] = useState(Number(searchParams.get('page')) || 0);
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(
    searchParams.get('pipeline') ? Number(searchParams.get('pipeline')) : null
  );
  // 🔧 NUEVO STATE: Para modal de confirmación de eliminación
  const [pipelineToDelete, setPipelineToDelete] = useState<PipelineDTO | null>(null);

  const debouncedSearchTerm = useSearchDebounce(searchTerm, 300);

  // 🔧 Search criteria siguiendo el patrón de Companies
  const searchCriteria = useMemo((): PipelineSearchCriteria => {
    const criteria: PipelineSearchCriteria = {};
    if (debouncedSearchTerm) {
      criteria.search = debouncedSearchTerm;
    }
    // Solo pipelines activos por defecto para el Kanban
    criteria.isActive = true;
    return criteria;
  }, [debouncedSearchTerm]);

  // ============================================
  // DATA FETCHING CON REACT QUERY - Mismo patrón que Companies
  // ============================================

  const { 
    data: pipelinesData, 
    isLoading: isLoadingPipelines, 
    isFetching: isFetchingPipelines,
    error: pipelinesError,
    refetch: refetchPipelines,
  } = useQuery({
    queryKey: PIPELINES_LIST_QUERY_KEY(searchCriteria, currentPage),
    queryFn: () => pipelineApi.searchPipelines(searchCriteria, { 
      page: currentPage, 
      size: 100, // Más pipelines para el selector
      sort: ['isDefault,desc', 'updatedAt,desc'] 
    }),
    enabled: true,
    placeholderData: (previousData) => previousData,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const pipelines = pipelinesData?.content || [];
  //const totalPipelines = pipelinesData?.totalElements || 0;

  // ✅ PASO 1: AÑADIR VARIABLE DE ESTADO UX
  const hasPipelines = pipelines.length > 0;

  // Obtener el pipeline seleccionado (el primero por defecto si no hay uno específico)
  const currentPipeline = useMemo(() => {
    if (selectedPipelineId) {
      return pipelines.find(p => p.id === selectedPipelineId);
    }
    // Priorizar pipeline por defecto, luego el primero
    return pipelines.find(p => p.isDefault) || pipelines[0];
  }, [pipelines, selectedPipelineId]);

  // Stats query
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: PIPELINE_STATS_QUERY_KEY,
    queryFn: () => pipelineApi.getPipelineStats(),
  });

  // ============================================
  // HOOKS DE ZUSTAND - Para acciones y estado de UI
  // ============================================
  const { deletePipeline } = usePipelineOperations();
  const { handleError } = useErrorHandler();

  // ============================================
  // STATS CARDS CONFIGURATION - Adaptado para Pipeline Kanban
  // ============================================
  const pipelineStatConfigs: StatCardConfig[] = [
    { 
      key: 'total', 
      title: 'Pipelines Activos', 
      description: 'Procesos de negocio disponibles para gestionar deals.', 
      icon: GitBranch, 
      variant: 'default', 
      format: 'number' 
    },
    { 
      key: 'totalDealsInPipelines', 
      title: 'Oportunidades Activas', 
      description: 'Deals fluyendo actualmente por todos los pipelines.', 
      icon: BarChart3, 
      variant: 'info', 
      format: 'number' 
    },
    { 
      key: 'totalValueInPipelines', 
      title: 'Valor en Pipeline', 
      description: 'Valor total de todas las oportunidades en proceso.', 
      icon: TrendingUp, 
      variant: 'success', 
      format: 'currency' 
    },
    { 
      key: 'averageConversionRate', 
      title: 'Tasa de Conversión', 
      description: 'Promedio de deals cerrados como ganados.', 
      icon: Target, 
      variant: 'warning', 
      format: 'percentage' 
    },
  ];

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handlePipelineChange = (pipelineId: number) => {
    setSelectedPipelineId(pipelineId);
    // Actualizar URL para mantener el estado
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('pipeline', pipelineId.toString());
    setSearchParams(newSearchParams);
  };

  const handleCreateNewPipeline = () => {
    navigate('/settings/pipelines/new');
  };

  const handleManagePipelines = () => {
    navigate('/settings/pipelines');
  };

  // ✅ NUEVO HANDLER: Para crear nueva oportunidad cuando hay pipelines
  const handleCreateNewDeal = () => {
    // TODO: Implementar cuando tengamos el formulario de deals
    console.log('Crear nueva oportunidad en pipeline:', currentPipeline?.id);
    // navigate('/deals/new?pipeline=' + currentPipeline?.id);
  };

  // 🔧 NUEVOS HANDLERS: Para acciones del dropdown estilo Salesforce
  const handleViewPipelineDeals = (pipeline: PipelineDTO) => {
    // Mantener el pipeline seleccionado y enfocarse en el Kanban
    setSelectedPipelineId(pipeline.id);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('pipeline', pipeline.id.toString());
    setSearchParams(newSearchParams);
    
    // Scroll al kanban si está fuera de vista
    document.getElementById('kanban-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleConfigurePipeline = (pipeline: PipelineDTO) => {
    navigate(`/settings/pipelines/${pipeline.id}/edit`);
  };

  const handleDeletePipeline = (pipeline: PipelineDTO) => {
    setPipelineToDelete(pipeline);
  };

  const handleConfirmDelete = async () => {
    if (!pipelineToDelete) return;
    
    try {
      await deletePipeline(pipelineToDelete.id, () => {
        setPipelineToDelete(null);
        // Si se elimina el pipeline actual, seleccionar otro
        if (selectedPipelineId === pipelineToDelete.id) {
          setSelectedPipelineId(null);
        }
      });
    } catch (error) {
      handleError(error);
    }
  };

  const handleRefresh = () => {
    refetchPipelines();
    refetchStats();
  };

  // 🔧 NUEVA FUNCIÓN: Configurar items del dropdown estilo Salesforce
  const getPipelineActionItems = (pipeline: PipelineDTO) => [
    { 
      id: 'view-deals', 
      label: 'Ver Oportunidades', 
      icon: Eye,
      onClick: () => handleViewPipelineDeals(pipeline)
    },
    { 
      id: 'configure', 
      label: 'Configurar Pipeline', 
      icon: Edit3,
      onClick: () => handleConfigurePipeline(pipeline)
    },
    { type: 'separator' as const },
    { 
      id: 'manage-all', 
      label: 'Ir a Administración', 
      icon: Settings,
      onClick: () => handleManagePipelines()
    },
    { type: 'separator' as const },
    { 
      id: 'delete', 
      label: 'Eliminar Pipeline', 
      icon: X,
      onClick: () => handleDeletePipeline(pipeline),
      className: 'text-red-400 hover:text-red-300'
    }
  ];

  // ============================================
  // RENDER STATES
  // ============================================

  if (pipelinesError) {
    return (
      <Page 
        title="Error al cargar Pipelines" 
        description="Ha ocurrido un error al cargar los pipelines."
      >
        <div className="text-center py-12">
          <p className="text-app-gray-400 mb-4">Error: {pipelinesError.message}</p>
          <Button onClick={() => refetchPipelines()}>
            Reintentar
          </Button>
        </div>
      </Page>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <Page 
      title="Gestión de Oportunidades" 
      description="Visualiza y gestiona el flujo de oportunidades a través de tus pipelines de negocio"
    >
      {/* ============================================ */}
      {/* STATS CARDS - Usando componente shared */}
      {/* ============================================ */}
      <StatsCards
        configs={pipelineStatConfigs}
        stats={stats}
        isLoading={isLoadingStats}
      />

      {/* ============================================ */}
      {/* ACTIONS BAR - ✅ PASO 2: AHORA ADAPTATIVA */}
      {/* ============================================ */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {hasPipelines ? (
          // === VISTA CUANDO SÍ HAY PIPELINES ===
          <>
            {/* --- Lado Izquierdo: Controles de Vista --- */}
            <div className="flex items-stretch gap-3 flex-1">
              {/* Pipeline Selector - Usando componente reutilizable */}
              <PipelineSelector
                pipelines={pipelines}
                selectedPipeline={currentPipeline}
                onPipelineChange={(pipeline) => handlePipelineChange(pipeline.id)}
                onCreateNew={handleCreateNewPipeline}
                onManagePipelines={handleManagePipelines}
                loading={isLoadingPipelines}
                showCreateButton={true}
                showManageButton={true}
                showMetrics={true}
                size="md"
                placeholder="Seleccionar pipeline..."
              />
              
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-app-gray-400" />
                <Input
                  placeholder="Buscar en deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn("h-10", showFilters && "bg-primary-500/10 border-primary-500/30")}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* --- Lado Derecho: Acciones --- */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isFetchingPipelines}
              >
                <RefreshCw className={cn("h-4 w-4", isFetchingPipelines && "animate-spin")} />
              </Button>
                         
              <Button onClick={handleCreateNewDeal}>
                <Plus className="h-4 w-4" />
                Nueva Oportunidad
              </Button>
            </div>
          </>
        ) : (
          // === VISTA CUANDO NO HAY PIPELINES (ESTADO INICIAL) ===
          <div className="w-full flex justify-end">
            <Button onClick={() => navigate('/settings/pipelines')}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar Pipelines
            </Button>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* FILTERS PANEL (Condicional) - Mismo patrón que Companies */}
      {/* Solo se muestra cuando HAY pipelines */}
      {/* ============================================ */}
      {showFilters && hasPipelines && (
        <div className="p-4 mb-6 border-app-dark-600 bg-app-dark-800/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-app-gray-200">Filtros de Oportunidades</h3>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
            >
              <X className="h-4 w-4" />
            </IconButton>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-app-gray-300 mb-2">
                Estado
              </label>
              <select className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded-lg text-app-gray-200">
                <option value="">Todos</option>
                <option value="OPEN">Abiertos</option>
                <option value="WON">Ganados</option>
                <option value="LOST">Perdidos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-app-gray-300 mb-2">
                Propietario
              </label>
              <select className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded-lg text-app-gray-200">
                <option value="">Todos</option>
                <option value="me">Mis oportunidades</option>
                <option value="team">Mi equipo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-app-gray-300 mb-2">
                Valor mínimo
              </label>
              <Input
                type="number"
                placeholder="0"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-app-gray-300 mb-2">
                Empresa
              </label>
              <select className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded-lg text-app-gray-200">
                <option value="">Todas</option>
                {/* TODO: Cargar empresas dinámicamente */}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* KANBAN VIEW - EL CORAZÓN DE LA PÁGINA */}
      {/* 🔧 ACTUALIZADO: Con dropdown de acciones estilo Salesforce */}
      {/* ============================================ */}
      {isLoadingPipelines && !currentPipeline ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : !currentPipeline ? (
        <EmptyState
          icon={GitBranch}
          title="No hay pipelines disponibles"
          description="Crea tu primer pipeline para empezar a gestionar oportunidades."
          action={
            // ✅ PASO 3: CAMBIAR BOTÓN DEL EMPTY STATE
            <Button onClick={() => navigate('/settings/pipelines')}>
              <Settings className="h-4 w-4 mr-2" />
              Ir a Configuración
            </Button>
          }
        />
      ) : (
        <div id="kanban-section" className="border-app-dark-600 bg-app-dark-800/50 p-6">
          {/* 🔧 PIPELINE HEADER - ACTUALIZADO CON DROPDOWN ESTILO SALESFORCE */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500/10 rounded-lg">
                <GitBranch className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-app-gray-100">
                  {currentPipeline.name}
                </h2>
                {currentPipeline.description && (
                  <p className="text-sm text-app-gray-400">
                    {currentPipeline.description}
                  </p>
                )}
              </div>
              {currentPipeline.isDefault && (
                <Badge variant="success" size="sm">Por Defecto</Badge>
              )}
            </div>

            {/* 🔧 NUEVA SECCIÓN: Stats + Dropdown de acciones */}
            <div className="flex items-center gap-4">
              {/* Pipeline stats */}
              <div className="flex items-center gap-4 text-sm text-app-gray-400">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>{currentPipeline.stages?.length || 0} etapas</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span>{currentPipeline.totalDeals || 0} oportunidades</span>
                </div>
                {currentPipeline.totalValue && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{formatters.currency(currentPipeline.totalValue)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* 🔧 DROPDOWN DE ACCIONES ESTILO SALESFORCE */}
              <Dropdown
                trigger={
                  <IconButton variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </IconButton>
                }
                items={getPipelineActionItems(currentPipeline)}
                align="end"
                side="top" 
                offset={12}
                className="z-50"
              />
            </div>
          </div>

          {/* TODO: Aquí irá el DealKanbanView cuando lo creemos */}
          <div className="text-center py-16 border-2 border-dashed border-app-dark-600 rounded-lg">
            <BarChart3 className="h-16 w-16 text-app-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-app-gray-100 mb-2">
              Vista Kanban en Desarrollo
            </h3>
            <p className="text-app-gray-400 mb-6">
              El componente DealKanbanView se integrará aquí para mostrar las oportunidades fluyendo por las etapas del pipeline.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={handleCreateNewDeal}>
                <Plus className="h-4 w-4" />
                Crear Nueva Oportunidad
              </Button>
              <Button variant="outline" onClick={() => navigate('/settings/pipelines')}>
                <Settings className="h-4 w-4" />
                Configurar Pipelines
              </Button>
            </div>

            {/* Preview de las etapas */}
            {currentPipeline.stages && currentPipeline.stages.length > 0 && (
              <div className="mt-8">
                <p className="text-sm text-app-gray-500 mb-4">
                  Etapas de este pipeline:
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {currentPipeline.stages
                    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                    .map((stage, index) => (
                      <Badge 
                        key={stage.id}
                        variant="outline" 
                        className="text-xs"
                      >
                        {index + 1}. {stage.name}
                      </Badge>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODALES DE CONFIRMACIÓN - Usando componente shared */}
      {/* 🔧 ACTUALIZADO: Modal para eliminar desde el dropdown */}
      {/* ============================================ */}
      
      <ConfirmDialog
        isOpen={!!pipelineToDelete}
        onClose={() => setPipelineToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Pipeline"
        description={`¿Estás seguro de que quieres eliminar el pipeline "${pipelineToDelete?.name}"? Esta acción también eliminará todas las oportunidades asociadas y no se puede deshacer.`}
      />
    </Page>
  );
};

export default PipelineListPage;