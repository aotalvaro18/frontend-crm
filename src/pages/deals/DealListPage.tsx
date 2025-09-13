// src/pages/deals/DealListPage.tsx
// ✅ DEAL LIST PAGE - ORQUESTADOR DEL KANBAN
// Replicando estructura de CompanyListPage pero especializado para gestión de Oportunidades
import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
Plus,
Filter,
RefreshCw,
Users as UsersIcon,
Target,
TrendingUp,
Workflow
} from 'lucide-react';
// ============================================
// UI & LAYOUT COMPONENTS
// ============================================
import { Button, IconButton } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Page from '@/components/layout/Page';
// ============================================
// DEAL COMPONENTS
// ============================================
import { DealsFilters } from '@/components/deals/DealsFilters';
import { DealsBulkActions } from '@/components/deals/DealsBulkActions';
import { StatsCards } from '@/components/shared/StatsCards';
import DealKanbanView from '@/components/deals/DealKanbanView';
import type { StatCardConfig } from '@/components/shared/StatsCards';
// ============================================
// HOOKS & SERVICES
// ============================================
import {
DEAL_STATS_QUERY_KEY
} from '@/hooks/useDeals';
import { dealApi } from '@/services/api/dealApi';
import { pipelineApi } from '@/services/api/pipelineApi';
import { useSearchDebounce } from '@/hooks/useDebounce';
import { toastSuccess } from '@/services/notifications/toastService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
// ============================================
// 🔧 CONFIGURACIÓN DE ESTADÍSTICAS CORREGIDA - Siguiendo exactamente el patrón de Companies
// ============================================
const DEAL_STAT_CONFIGS: StatCardConfig[] = [
{
key: 'totalDeals',
title: 'Total Oportunidades',
description: 'Número total de oportunidades en el sistema',
icon: Target,
variant: 'default',
format: 'number'
},
{
key: 'openDeals',
title: 'Oportunidades Abiertas',
description: 'Oportunidades actualmente en proceso',
icon: TrendingUp,
variant: 'info',
format: 'number'
},
{
key: 'wonDeals',
title: 'Ganadas',
description: 'Oportunidades cerradas exitosamente',
icon: UsersIcon,
variant: 'success',
format: 'number'
},
{
key: 'totalValue',
title: 'Valor Total',
description: 'Valor acumulado de todas las oportunidades',
icon: Workflow,
variant: 'accent',
format: 'currency'
}
];
// ============================================
// MAIN COMPONENT
// ============================================
const DealListPage: React.FC = () => {
const navigate = useNavigate();
const [searchParams, setSearchParams] = useSearchParams();
const { handleError } = useErrorHandler();
// ============================================
// LOCAL STATE para UI y Filtros
// ============================================
const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
const [showFilters, setShowFilters] = useState(false);
// ✅ RECOMENDACIÓN 4: Inicializar selectedPipelineId desde URL
const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(
searchParams.get('pipeline') ? Number(searchParams.get('pipeline')) : null
);
const debouncedSearchTerm = useSearchDebounce(searchTerm, 300);
// ============================================
// DATA FETCHING - PIPELINES (Para el selector)
// ============================================
const { 
    data: pipelines, 
    isLoading: isLoadingPipelines, 
    error: pipelinesError,
    // ✅ 1. Extraemos 'refetch' y le damos un alias para evitar conflictos
    refetch: refetchPipelines 
  } = useQuery({
    queryKey: ['pipelines', 'active'],
    queryFn: () => pipelineApi.searchPipelines({ isActive: true }, { page: 0, size: 50, sort: ['name,asc'] }),
    staleTime: 5 * 60 * 1000,
    select: (data) => data.content,
  });
// Seleccionar pipeline por defecto
useEffect(() => {
if (pipelines && pipelines.length > 0 && !selectedPipelineId) {
const defaultPipeline = pipelines.find(p => p.isDefault) || pipelines[0];
setSelectedPipelineId(defaultPipeline.id);

// ✅ RECOMENDACIÓN 4: Sincronizar con URL al seleccionar por defecto
  const newParams = new URLSearchParams(searchParams);
  newParams.set('pipeline', defaultPipeline.id.toString());
  setSearchParams(newParams, { replace: true });
}
}, [pipelines, selectedPipelineId, searchParams, setSearchParams]);
// ============================================
// DATA FETCHING - ESTADÍSTICAS DE DEALS
// ============================================
const {
data: dealStats,
isLoading: isLoadingStats,
error: statsError,
refetch: refetchStats,
} = useQuery({
    queryKey: DEAL_STATS_QUERY_KEY(),
queryFn: () => dealApi.getDealStats(),
staleTime: 2 * 60 * 1000, // 2 minutos - stats más frecuentes
});
// ============================================
// 🔧 MAPEO DE STATS - Siguiendo el patrón de Companies
// ============================================
const mappedStats = useMemo(() => {
if (!dealStats) return undefined;

return {
  totalDeals: dealStats.totalDeals || 0,
  openDeals: dealStats.openDeals || 0,
  wonDeals: dealStats.wonDeals || 0,
  totalValue: dealStats.totalValue || 0,
};
}, [dealStats]);
// ============================================
// HANDLERS
// ============================================
const handleCreateDeal = useCallback(() => {
navigate('/crm/deals/create');
}, [navigate]);
const handleRefresh = useCallback(async () => {
try {
await refetchStats();
toastSuccess('Datos actualizados exitosamente');
} catch (error) {
handleError(error, 'Error al actualizar los datos');
}
}, [refetchStats, handleError]);
// ✅ RECOMENDACIÓN 4: Handler mejorado con sincronización de URL
const handlePipelineChange = useCallback((value: string | number | (string | number)[] | undefined) => {
    // Asegurarnos de que tenemos un valor de tipo string antes de continuar
    if (typeof value === 'string' && value) {
      const id = Number(value);
      setSelectedPipelineId(id);
      
      const newParams = new URLSearchParams(searchParams);
      newParams.set('pipeline', id.toString());
      setSearchParams(newParams, { replace: true });
    } else {
      // Si el valor se limpia (es undefined) o es un tipo inesperado,
      // quitamos el pipeline seleccionado.
      setSelectedPipelineId(null);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('pipeline');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

const handleSearch = useCallback((value: string) => {
setSearchTerm(value);
// Actualizar URL sin recargar
const newParams = new URLSearchParams(searchParams);
if (value) {
newParams.set('search', value);
} else {
newParams.delete('search');
}
setSearchParams(newParams);
}, [searchParams, setSearchParams]);
const handleToggleFilters = useCallback(() => {
setShowFilters(prev => !prev);
}, []);
// ============================================
// BUSCAR PIPELINE SELECCIONADO
// ============================================
const selectedPipeline = useMemo(() => {
if (!pipelines || !selectedPipelineId) return null;
return pipelines.find(p => p.id === selectedPipelineId) || null;
}, [pipelines, selectedPipelineId]);
// ============================================
// RENDER HELPERS
// ============================================
if (pipelinesError) {
    return (
      <Page 
        title="Oportunidades" 
      >
        <ErrorMessage
          title="Error al Cargar los Procesos"
          message="No se pudieron cargar los pipelines de negocio. Por favor, intenta nuevamente."
          // ✅ CORRECCIÓN: 'actions' en plural y como array de botones
          actions={[
            <Button key="retry" onClick={() => refetchPipelines()}> 
              Reintentar
            </Button>
          ]}
        />
      </Page>
    );
  }
// ============================================
// MAIN RENDER
// ============================================
return (
<Page 
title="Oportunidades" 
subtitle="Gestión de oportunidades y pipeline de ventas"
>
<div className="space-y-6">
{/* ============================================ /}
{/ 🔧 ESTADÍSTICAS CORREGIDAS - Siguiendo exactamente el patrón de Companies /}
{/ ============================================ */}
<StatsCards 
configs={DEAL_STAT_CONFIGS}
stats={mappedStats}
isLoading={isLoadingStats}
className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
/>

{/* ============================================ */}
    {/* HEADER CON CONTROLES */}
    {/* ============================================ */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      {/* Lado izquierdo: Selector de Pipeline */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-app-gray-300 mb-2">Pipeline Activo:</h3>
          {isLoadingPipelines ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-app-gray-400">Cargando pipelines...</span>
            </div>
          ) : (
            <Select
              value={selectedPipelineId?.toString() || ''}
              onValueChange={handlePipelineChange}
              options={pipelines?.map(pipeline => ({
                value: pipeline.id.toString(),
                label: `${pipeline.name} ${pipeline.isDefault ? '(Principal)' : ''}`,
                description: `${pipeline.totalDeals || 0} oportunidades`
              })) || []}
              placeholder="Seleccionar pipeline..."
              className="w-full sm:w-80"
            />
          )}
        </div>
      </div>

      {/* Lado derecho: Acciones */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        <SearchInput
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar oportunidades..."
          className="w-full sm:w-64"
        />
        
        <div className="flex items-center space-x-3">
          <IconButton
            onClick={handleToggleFilters}
            variant={showFilters ? "default" : "secondary"}
            size="sm"
            tooltip="Filtros"
          >
            {/* ✅ CORRECCIÓN: El icono va como children */}
            <Filter className="h-4 w-4" />
          </IconButton>
          
          <IconButton
            onClick={handleRefresh}
            variant="secondary"
            size="sm"
            tooltip="Actualizar"
          >
            {/* ✅ CORRECCIÓN: El icono va como children */}
            <RefreshCw className="h-4 w-4" />
          </IconButton>
          
          <Button 
            leftIcon={<Plus className="h-4 w-4" />} // ✅ CORRECCIÓN: de 'icon' a 'leftIcon'
            onClick={handleCreateDeal}
            size="sm"
            className="w-full sm:w-auto"
          >
            Nueva Oportunidad
          </Button>
        </div>
      </div>
    </div>

    {/* ============================================ */}
    {/* FILTROS (Colapsible) */}
    {/* ============================================ */}
    {showFilters && (
    <div className="border border-app-dark-600 rounded-lg p-4 bg-app-dark-800/50">
        <DealsFilters 
        onFiltersChange={(criteria) => {
            // Aquí conectarías los filtros con tu estado o búsqueda.
            // Por ahora, un console.log es suficiente para ver que funciona.
            console.log('Filtros cambiados:', criteria);
            // TODO: Implementar la lógica de búsqueda con estos criterios.
        }}
        // Pasa los filtros iniciales si los tienes en la URL
        initialFilters={{ search: searchTerm }}
        />
    </div>
    )}

    {/* ============================================ */}
    {/* BULK ACTIONS (Para operaciones masivas) */}
    {/* ============================================ */}
    <DealsBulkActions />

    {/* ============================================ */}
    {/* KANBAN VIEW - EL CORAZÓN DE LA FUNCIONALIDAD */}
    {/* ============================================ */}
    {selectedPipeline ? (
      <div className="min-h-[600px]">
        <DealKanbanView 
          pipeline={selectedPipeline}
          searchTerm={debouncedSearchTerm}
        />
      </div>
    ) : (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-app-dark-600 rounded-lg">
        <div className="text-center">
          <Workflow className="h-12 w-12 text-app-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-app-gray-300 mb-2">
            Selecciona un Pipeline
          </h3>
          <p className="text-app-gray-400">
            Elige un pipeline para ver las oportunidades en formato Kanban
          </p>
        </div>
      </div>
    )}
  </div>
</Page>
);
};
export default DealListPage;