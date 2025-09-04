// src/pages/settings/PipelinesSettingsPage.tsx
// ✅ PIPELINES SETTINGS PAGE - Siguiendo exactamente los patrones de CompanyListPage
// Página de configuración de Pipelines donde los administradores definen sus procesos

import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, MoreHorizontal, Edit3, Trash2, Eye, Copy, 
  GitBranch, Target, TrendingUp, BarChart3,
  Search, Filter, X
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
import { DataTable, type Column } from '@/components/ui/Table';
import Dropdown from '@/components/ui/Dropdown';

// ============================================
// SHARED COMPONENTS - Reutilizando exactamente como Companies
// ============================================
import { StatsCards } from '@/components/shared/StatsCards';
import type { StatCardConfig } from '@/components/shared/StatsCards';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

// ============================================
// HOOKS & SERVICES - Siguiendo patrón Slice Vertical
// ============================================
import { 
  usePipelineOperations,
  useBulkPipelineOperations,
  PIPELINE_STATS_QUERY_KEY,
  PIPELINES_LIST_QUERY_KEY
} from '@/hooks/usePipelines';
import { pipelineApi } from '@/services/api/pipelineApi';
import { useSearchDebounce } from '@/hooks/useDebounce';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { toastSuccess } from '@/services/notifications/toastService';

// ============================================
// TYPES - Importando desde types como CompanyListPage
// ============================================
import type { 
  PipelineDTO, 
  PipelineSearchCriteria
} from '@/types/pipeline.types';
import { PERFORMANCE_STATUS_LABELS } from '@/types/pipeline.types';
import { cn } from '@/utils/cn';
import { formatters } from '@/utils/formatters';

// ============================================
// MAIN COMPONENT
// ============================================
const PipelinesSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ============================================
  // LOCAL STATE para UI y Filtros - Mismo patrón que CompanyListPage
  // ============================================
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 0);
  const [pipelineToDelete, setPipelineToDelete] = useState<PipelineDTO | null>(null);
  const [pipelineToDuplicate, setPipelineToDuplicate] = useState<PipelineDTO | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  
  const debouncedSearchTerm = useSearchDebounce(searchTerm, 300);

  // 🔧 Search criteria siguiendo el patrón de Companies
  const searchCriteria = useMemo((): PipelineSearchCriteria => {
    const criteria: PipelineSearchCriteria = {};
    if (debouncedSearchTerm) {
      criteria.search = debouncedSearchTerm;
    }
    // Filtros adicionales específicos de pipelines
    criteria.isActive = true; // Solo mostrar pipelines activos por defecto
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
      size: 25, 
      sort: ['isDefault,desc', 'updatedAt,desc'] 
    }),
    enabled: true,
    placeholderData: (previousData) => previousData,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const pipelines = pipelinesData?.content || [];
  const totalPipelines = pipelinesData?.totalElements || 0;
  const totalPages = pipelinesData?.totalPages || 0;

  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: PIPELINE_STATS_QUERY_KEY,
    queryFn: () => pipelineApi.getPipelineStats(),
  });

  // ============================================
  // HOOKS DE ZUSTAND - Para acciones y estado de UI
  // ============================================
  const { deletePipeline, duplicatePipeline } = usePipelineOperations();
  const {
    selectedPipelineIds,
    bulkOperationLoading,
    selectAllPipelines,
    bulkDeletePipelines
  } = useBulkPipelineOperations();
  const { handleError } = useErrorHandler();

  // ============================================
  // STATS CARDS CONFIGURATION - Adaptado para Pipelines
  // ============================================
  const pipelineStatConfigs: StatCardConfig[] = [
    { 
      key: 'total', 
      title: 'Total Pipelines', 
      description: 'Procesos de negocio configurados en el sistema.', 
      icon: GitBranch, 
      variant: 'default', 
      format: 'number' 
    },
    { 
      key: 'active', 
      title: 'Pipelines Activos', 
      description: 'Procesos actualmente en uso.', 
      icon: TrendingUp, 
      variant: 'success', 
      format: 'number' 
    },
    { 
      key: 'totalStages', 
      title: 'Total Etapas', 
      description: 'Etapas configuradas en todos los pipelines.', 
      icon: Target, 
      variant: 'info', 
      format: 'number' 
    },
    { 
      key: 'totalDealsInPipelines', 
      title: 'Oportunidades en Proceso', 
      description: 'Deals activos fluyendo por los pipelines.', 
      icon: BarChart3, 
      variant: 'warning', 
      format: 'number' 
    },
  ];

  // ============================================
  // EVENT HANDLERS - Siguiendo patrón de Companies
  // ============================================

  const handlePipelineClick = (pipeline: PipelineDTO) => {
    navigate(`/settings/pipelines/${pipeline.id}`);
  };

  const handlePipelineEdit = (pipeline: PipelineDTO) => {
    navigate(`/settings/pipelines/${pipeline.id}/edit`);
  };

  const handleDeleteClick = (pipeline: PipelineDTO) => {
    setPipelineToDelete(pipeline);
  };

  const handleConfirmDelete = async () => {
    if (!pipelineToDelete) return;
    
    try {
      await deletePipeline(pipelineToDelete.id, () => {
        setPipelineToDelete(null);
        refetchPipelines();
        refetchStats();
        toastSuccess('Pipeline eliminado exitosamente');
      });
    } catch (error) {
      handleError(error);
    }
  };

  const handleDuplicateClick = (pipeline: PipelineDTO) => {
    setPipelineToDuplicate(pipeline);
    setDuplicateName(`${pipeline.name} (Copia)`);
  };

  const handleConfirmDuplicate = async () => {
    if (!pipelineToDuplicate || !duplicateName.trim()) return;
    
    try {
      await duplicatePipeline(pipelineToDuplicate.id, duplicateName.trim(), (newPipeline) => {
        setPipelineToDuplicate(null);
        setDuplicateName('');
        refetchPipelines();
        refetchStats();
        toastSuccess(`Pipeline "${duplicateName}" duplicado exitosamente`);
      });
    } catch (error) {
      handleError(error);
    }
  };

  const handleCreateNew = () => {
    navigate('/settings/pipelines/new');
  };

  // ============================================
  // DROPDOWN ITEMS CONFIGURATION
  // ============================================
  const getActionItems = (pipeline: PipelineDTO) => [
    { id: 'view', label: 'Ver Detalles', icon: Eye, onClick: () => handlePipelineClick(pipeline) },
    { id: 'edit', label: 'Editar Pipeline', icon: Edit3, onClick: () => handlePipelineEdit(pipeline) },
    { id: 'duplicate', label: 'Duplicar Pipeline', icon: Copy, onClick: () => handleDuplicateClick(pipeline) },
    { type: 'separator' as const },
    { id: 'delete', label: 'Eliminar Pipeline', icon: Trash2, onClick: () => handleDeleteClick(pipeline), className: 'text-red-400 hover:text-red-300' },
  ];

  // ============================================
  // TABLE COLUMNS CONFIGURATION - Adaptado para Pipelines
  // ============================================
  const columns: Column<PipelineDTO>[] = [
    {
      id: 'name',
      header: 'Pipeline',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/10 rounded-lg">
            <GitBranch className="h-4 w-4 text-primary-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-app-gray-100">{row.name}</span>
              {row.isDefault && (
                <Badge variant="success" size="sm">Por Defecto</Badge>
              )}
              {!row.isActive && (
                <Badge variant="secondary" size="sm">Inactivo</Badge>
              )}
            </div>
            {row.description && (
              <p className="text-sm text-app-gray-400 mt-1">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'stageCount',
      header: 'Etapas',
      accessorKey: 'stageCount',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-app-gray-400" />
          <span className="text-app-gray-200">
            {row.stageCount || row.stages?.length || 0} etapas
          </span>
        </div>
      ),
    },
    {
      id: 'totalDeals',
      header: 'Deals',
      accessorKey: 'totalDeals',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-app-gray-400" />
          <span className="text-app-gray-200">
            {row.totalDeals || 0}
          </span>
        </div>
      ),
    },
    {
      id: 'totalValue',
      header: 'Valor Total',
      accessorKey: 'totalValue',
      cell: ({ row }) => (
        <span className="font-mono text-app-gray-200">
          {row.totalValue ? formatters.currency(row.totalValue) : '-'}
        </span>
      ),
    },
    {
      id: 'performanceStatus',
      header: 'Rendimiento',
      accessorKey: 'performanceStatus',
      cell: ({ row }) => {
        const status = row.performanceStatus;
        if (!status) return <span className="text-app-gray-400">-</span>;
        
        const variants = {
            excellent: 'success',
            good: 'info',
            warning: 'warning',
            critical: 'destructive',
          } as const;

        return (
          <Badge variant={variants[status] || 'secondary'} size="sm">
            {PERFORMANCE_STATUS_LABELS[status as keyof typeof PERFORMANCE_STATUS_LABELS]}
          </Badge>
        );
      },
    },
    {
      id: 'updatedAt',
      header: 'Última Actualización',
      accessorKey: 'updatedAt',
      cell: ({ row }) => (
        <div className="text-sm text-app-gray-400">
          {formatters.relativeDate(row.updatedAt)}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Dropdown
          trigger={
            <IconButton variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </IconButton>
          }
          items={getActionItems(row)}
        />
      ),
    },
  ];

  // ============================================
  // RENDER COMPONENT - Siguiendo estructura de CompanyListPage
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

  return (
    <Page 
      title="Gestión de Pipelines" 
      description="Configura y administra los procesos de negocio de tu organización"
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
      {/* ACTIONS BAR */}
      {/* ============================================ */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Search y filtros */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-app-gray-400" />
            <Input
              placeholder="Buscar pipelines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-primary-500/10 border-primary-500/30")}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {selectedPipelineIds.size > 0 && (
            <Button
              variant="outline"
              onClick={() => bulkDeletePipelines()}
              disabled={bulkOperationLoading}
              className="text-red-400 border-red-400/30 hover:bg-red-400/10"
            >
              {bulkOperationLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Eliminar Seleccionados ({selectedPipelineIds.size})
            </Button>
          )}
          
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4" />
            Crear Pipeline
          </Button>
        </div>
      </div>

      {/* ============================================ */}
      {/* FILTERS PANEL (Condicional) */}
      {/* 🔧 CAMBIO QUIRÚRGICO: Corregido onClick del botón X */}
      {/* ============================================ */}
      {showFilters && (
        <div className="border border-app-dark-600 bg-app-dark-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-app-gray-200">Filtros Avanzados</h3>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)} // 🔧 CORREGIDO: Removido el console.log y restaurado la funcionalidad original
            >
              <X className="h-4 w-4" />
            </IconButton>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-app-gray-300 mb-2">
                Estado
              </label>
              <select className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded-lg text-app-gray-200">
                <option value="">Todos los estados</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo inactivos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-app-gray-300 mb-2">
                Rendimiento
              </label>
              <select className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded-lg text-app-gray-200">
                <option value="">Todos</option>
                <option value="excellent">Excelente</option>
                <option value="good">Bueno</option>
                <option value="warning">Advertencia</option>
                <option value="critical">Crítico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-app-gray-300 mb-2">
                Con Deals
              </label>
              <select className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded-lg text-app-gray-200">
                <option value="">Todos</option>
                <option value="true">Con oportunidades</option>
                <option value="false">Sin oportunidades</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* PIPELINES TABLE */}
      {/* ============================================ */}
      <div className="border border-app-dark-600 bg-app-dark-800/50 rounded-lg">
        {isLoadingPipelines && pipelines.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : pipelines.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No hay pipelines configurados"
            description="Crea tu primer pipeline para empezar a gestionar procesos de negocio."
            action={
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4" />
                Crear Primer Pipeline
              </Button>
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={pipelines}
              loading={isFetchingPipelines}
              enableSelection={true}
              selectedRows={selectedPipelineIds}
              onRowSelect={(id: number | string) => {
                // Implementar selección individual si es necesario
              }}
              onSelectAll={() => selectAllPipelines(pipelines.map((p, index) => p.id || index))}
              getRowId={(row: PipelineDTO, index: number) => row.id || index}
            />
            
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-app-dark-600">
                <div className="text-sm text-app-gray-400">
                  Mostrando {pipelines.length} de {totalPipelines} pipelines
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-app-gray-300 px-3">
                    {currentPage + 1} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ============================================ */}
      {/* MODALES DE CONFIRMACIÓN - Usando componente shared */}
      {/* ============================================ */}
      
      {/* Modal eliminar pipeline */}
      <ConfirmDialog
        isOpen={!!pipelineToDelete}
        onClose={() => setPipelineToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Pipeline"
        description={`¿Estás seguro de que quieres eliminar el pipeline "${pipelineToDelete?.name}"? Esta acción no se puede deshacer.`}
      />

      {/* Modal duplicar pipeline */}
      <ConfirmDialog
        isOpen={!!pipelineToDuplicate}
        onClose={() => {
          setPipelineToDuplicate(null);
          setDuplicateName('');
        }}
        onConfirm={handleConfirmDuplicate}
        title="Duplicar Pipeline"
        description={`Se creará una copia del pipeline "${pipelineToDuplicate?.name}" con todas sus etapas.`}
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
    </Page>
  );
};

export default PipelinesSettingsPage;