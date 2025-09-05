// src/components/pipelines/PipelinesTable.tsx
// ✅ PIPELINES TABLE - Siguiendo exactamente el patrón de CompaniesTable

import React, { useMemo, useState } from 'react';
import { 
  MoreHorizontal, Trash2, Copy, 
  GitBranch, Target, BarChart3, TrendingUp
} from 'lucide-react';

// ============================================
// UI COMPONENTS
// ============================================
import { DataTable, type Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Dropdown from '@/components/ui/Dropdown';

// ============================================
// HOOKS (Solo para estado interno de la tabla)
// ============================================
import {
  useBulkPipelineOperations,
  usePipelineOperations,
} from '@/hooks/usePipelines';

// ============================================
// TYPES
// ============================================
import type { 
  PipelineDTO
} from '@/types/pipeline.types';
import { PERFORMANCE_STATUS_LABELS } from '@/types/pipeline.types';

// ============================================
// UTILS
// ============================================
import { cn } from '@/utils/cn';
import { formatters } from '@/utils/formatters';

// ============================================
// COMPONENT PROPS - Siguiendo patrón de CompaniesTable
// ============================================
export interface PipelinesTableProps {
  pipelines: PipelineDTO[];
  isLoading: boolean;
  totalPipelines: number;
  
  onPipelineClick: (pipeline: PipelineDTO) => void;
  onPipelineEdit?: (pipeline: PipelineDTO) => void;
  onPipelineDelete?: (pipeline: PipelineDTO) => void;
  onPipelineDuplicate?: (pipeline: PipelineDTO) => void;
  
  selectedPipelineIds: Set<number>;
  onSelectAll: () => void;
  onDeselectAll: () => void;

  className?: string;
  stickyHeader?: boolean;
  mobileView?: 'cards' | 'stack' | 'table';
}

// ============================================
// PIPELINE ACTIONS DROPDOWN COMPONENT
// ============================================
const PipelineActionsDropdown: React.FC<{ 
  pipeline: PipelineDTO; 
  onView?: () => void; 
  onEdit?: () => void; 
  onDelete?: () => void;
  onDuplicate?: () => void;
  isUpdating?: boolean; 
  isDeleting?: boolean;
  isDuplicating?: boolean;
}> = ({ 
  pipeline, 
  onDelete, 
  onDuplicate,
  isUpdating = false, 
  isDeleting = false,
  isDuplicating = false 
}) => {
  const items = [
    { 
      id: 'duplicate', 
      label: 'Duplicar Pipeline', 
      icon: Copy, 
      onClick: onDuplicate, 
      disabled: isUpdating || isDeleting || isDuplicating 
    },
    { type: 'separator' as const },
    { 
      id: 'delete', 
      label: 'Eliminar Pipeline', 
      icon: Trash2, 
      onClick: onDelete, 
      disabled: isUpdating || isDeleting || isDuplicating, 
      destructive: true 
    },
  ];

  return (
    <Dropdown 
      trigger={
        <IconButton 
          variant="ghost" 
          size="sm" 
          disabled={isUpdating || isDeleting || isDuplicating} 
          aria-label={`Acciones para ${pipeline.name}`}
        >
          {(isUpdating || isDeleting || isDuplicating) ? (
            <LoadingSpinner size="xs" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </IconButton>
      } 
      items={items} 
      align="end" 
    />
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const PipelinesTable: React.FC<PipelinesTableProps> = ({
  pipelines,
  isLoading,
  totalPipelines,
  onPipelineClick,
  onPipelineEdit,
  onPipelineDelete,
  onPipelineDuplicate,
  selectedPipelineIds,
  onSelectAll,
  onDeselectAll,
  className,
  stickyHeader = false,
  mobileView = 'cards',
}) => {
  const { updating, deleting, duplicating } = usePipelineOperations();
  const { selectPipeline } = useBulkPipelineOperations();
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnId: string, direction: 'asc' | 'desc' | null) => {
    setSortColumn(direction ? columnId : 'name');
    setSortDirection(direction || 'asc');
  };

  const columns: Column<PipelineDTO>[] = useMemo(() => [
    {
        id: 'name',
        header: 'Pipeline',
        accessorKey: 'name',
        sortable: true,
        width: '300px',
        cell: ({ row }) => (
          <div 
            className="flex items-center gap-3 cursor-pointer group hover:bg-app-dark-700/50 -mx-2 px-2 py-1 rounded-md transition-colors duration-150"
            onClick={() => onPipelineClick(row)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPipelineClick(row);
              }
            }}
            aria-label={`Configurar pipeline ${row.name}`}
          >
            <div className="p-2 bg-primary-500/10 rounded-lg group-hover:bg-primary-500/20 transition-colors duration-150">
              <GitBranch className="h-4 w-4 text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-app-gray-100 group-hover:text-primary-300 transition-colors duration-150 truncate">
                  {row.name}
                </span>
                {row.isDefault && (
                  <Badge variant="success" size="sm">Por Defecto</Badge>
                )}
                {!row.isActive && (
                  <Badge variant="secondary" size="sm">Inactivo</Badge>
                )}
              </div>
              {row.description && (
                <p className="text-sm text-app-gray-400 group-hover:text-app-gray-300 mt-1 transition-colors duration-150 truncate">
                  {row.description}
                </p>
              )}
            </div>
          </div>
        ),
        mobileLabel: 'Pipeline',
      },
    {
      id: 'stageCount',
      header: 'Etapas',
      accessorKey: 'stageCount',
      sortable: true,
      width: '120px',
      hideOnMobile: true,
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
      sortable: true,
      width: '100px',
      hideOnMobile: true,
      align: 'center',
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.totalDeals !== undefined ? (
            <Badge variant="info" size="sm" icon={<BarChart3 />}>
              {row.totalDeals}
            </Badge>
          ) : (
            <span className="text-app-gray-500 text-xs">-</span>
          )}
        </div>
      ),
    },
    {
      id: 'totalValue',
      header: 'Valor Total',
      accessorKey: 'totalValue',
      sortable: true,
      width: '140px',
      hideOnMobile: true,
      align: 'right',
      cell: ({ row }) => (
        <div className="text-sm text-app-gray-200 text-right">
          {row.totalValue ? (
            <div className="flex items-center justify-end">
              <TrendingUp className="h-3 w-3 mr-1 text-green-400 flex-shrink-0" />
              <span>{formatters.currency(row.totalValue)}</span>
            </div>
          ) : (
            <span className="text-app-gray-500 italic">-</span>
          )}
        </div>
      ),
    },
    {
      id: 'performanceStatus',
      header: 'Rendimiento',
      accessorKey: 'performanceStatus',
      sortable: true,
      width: '140px',
      hideOnMobile: true,
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
      sortable: true,
      width: '160px',
      hideOnMobile: true,
      cell: ({ row }) => (
        <div className="text-sm text-app-gray-400">
          {formatters.relativeDate(row.updatedAt)}
        </div>
      ),
    },
  ], []);

  if (isLoading && pipelines.length === 0) {
    return (
      <div className={cn('bg-app-dark-800 border border-app-dark-600 rounded-lg', className)}>
        <LoadingSpinner
          size="lg"
          label="Cargando pipelines..."
          className="py-12"
        />
      </div>
    );
  }

  if (!isLoading && pipelines.length === 0) {
    return (
      <div className={cn('bg-app-dark-800 border border-app-dark-600 rounded-lg', className)}>
        <EmptyState
          icon={GitBranch}
          title="No hay pipelines configurados"
          description="Crea tu primer pipeline para empezar a gestionar procesos de negocio."
          variant="card"
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className={cn('bg-app-dark-800 border border-app-dark-600 rounded-lg overflow-hidden', className)}>
      <div className="px-4 py-3 border-b border-app-dark-600 bg-app-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-app-gray-300">
              {selectedPipelineIds.size > 0 ? (
                <span className="font-medium">
                  {selectedPipelineIds.size} pipeline{selectedPipelineIds.size !== 1 ? 's' : ''} seleccionado{selectedPipelineIds.size !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>
                  {totalPipelines.toLocaleString()} pipeline{totalPipelines !== 1 ? 's' : ''} total{totalPipelines !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
            {isLoading && (
              <div className="flex items-center space-x-2 text-app-gray-400">
                <LoadingSpinner size="xs" />
                <span className="text-xs">Actualizando...</span>
              </div>
            )}
          </div>
          {selectedPipelineIds.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeselectAll}
              className="text-app-gray-400 hover:text-white"
            >
              Deseleccionar todo
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={pipelines}
        columns={columns}
        enableSelection={true}
        selectedRows={selectedPipelineIds}
        onRowSelect={(rowId) => selectPipeline(rowId as number)}
        onSelectAll={pipelines.length > 0 && pipelines.every(p => selectedPipelineIds.has(p.id)) ? onDeselectAll : onSelectAll}
        getRowId={(row) => row.id}
        enableSorting={true}
        sortBy={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onRowClick={onPipelineClick}
        rowActions={(row) => (
          <PipelineActionsDropdown
            pipeline={row}
            onView={() => onPipelineClick(row)}
            onEdit={() => onPipelineEdit?.(row)}
            onDelete={() => onPipelineDelete?.(row)}
            onDuplicate={() => onPipelineDuplicate?.(row)}
            isUpdating={updating.has(row.id)}
            isDeleting={deleting.has(row.id)}
            isDuplicating={duplicating.has(row.id)}
          />
        )}
        variant="default"
        size="md"
        stickyHeader={stickyHeader}
        mobileView={mobileView}
        loading={isLoading}
        loadingRows={5}
        className="border-0"
      />
    </div>
  );
};

export default PipelinesTable;