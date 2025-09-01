// src/components/pipelines/PipelineSelector.tsx
// ✅ PIPELINE SELECTOR - Componente dropdown reutilizable para seleccionar pipelines
// Siguiendo patrones de componentes "tontos" que reciben todo como props

import React, { useState, useRef, useEffect } from 'react';
import { 
  GitBranch, ChevronDown, Check, Star, Target, 
  BarChart3, TrendingUp, Settings, Plus 
} from 'lucide-react';

// ============================================
// UI COMPONENTS 
// ============================================
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Tooltip } from '@/components/ui/Tooltip';

// ============================================
// TYPES
// ============================================
import type { PipelineDTO } from '@/types/pipeline.types';
import { cn } from '@/utils/cn';
import { formatters } from '@/utils/formatters';

// ============================================
// COMPONENT PROPS - Siguiendo patrón de componentes reutilizables
// ============================================
export interface PipelineSelectorProps {
  // Data props
  pipelines: PipelineDTO[];
  selectedPipeline?: PipelineDTO | null;
  
  // Behavior props
  onPipelineChange?: (pipeline: PipelineDTO) => void;
  onCreateNew?: () => void;
  onManagePipelines?: () => void;
  
  // UI props
  loading?: boolean;
  disabled?: boolean;
  showCreateButton?: boolean;
  showManageButton?: boolean;
  showMetrics?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  
  // Style props
  className?: string;
}

// ============================================
// PIPELINE ITEM COMPONENT (Componente interno)
// ============================================
interface PipelineItemProps {
  pipeline: PipelineDTO;
  isSelected: boolean;
  showMetrics: boolean;
  onClick: () => void;
}

const PipelineItem: React.FC<PipelineItemProps> = ({
  pipeline,
  isSelected,
  showMetrics,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-app-dark-600 transition-colors border-l-2",
        isSelected 
          ? "bg-app-dark-600 border-primary-500" 
          : "border-transparent"
      )}
    >
      {/* Pipeline Icon & Status */}
      <div className="flex items-center gap-2">
        <div className="p-1 bg-primary-500/10 rounded">
          <GitBranch className="h-4 w-4 text-primary-400" />
        </div>
        {isSelected && <Check className="h-4 w-4 text-primary-400" />}
      </div>

      {/* Pipeline Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-app-gray-100 truncate">
            {pipeline.name}
          </h4>
          <div className="flex items-center gap-1">
            {pipeline.isDefault && (
              <Tooltip content="Pipeline por defecto">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
              </Tooltip>
            )}
            {!pipeline.isActive && (
              <Badge variant="secondary" size="sm">Inactivo</Badge>
            )}
            {pipeline.performanceStatus && (
              <Badge 
                variant={
                    pipeline.performanceStatus === 'excellent' ? 'success' :
                    pipeline.performanceStatus === 'good' ? 'info' :
                    pipeline.performanceStatus === 'warning' ? 'warning' : 'destructive' // ✅ CAMBIO: 'danger' -> 'destructive'
                }
                size="sm"
              >
                {pipeline.performanceStatus === 'excellent' ? '🔥' :
                 pipeline.performanceStatus === 'good' ? '👍' :
                 pipeline.performanceStatus === 'warning' ? '⚠️' : '🚨'}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {pipeline.description && (
          <p className="text-xs text-app-gray-400 mb-2 line-clamp-2">
            {pipeline.description}
          </p>
        )}

        {/* Metrics */}
        {showMetrics && (
          <div className="flex items-center gap-4 text-xs text-app-gray-500">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{pipeline.stages?.length || 0} etapas</span>
            </div>
            {pipeline.totalDeals !== undefined && (
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                <span>{pipeline.totalDeals} deals</span>
              </div>
            )}
            {pipeline.totalValue !== undefined && pipeline.totalValue > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{formatters.currency(pipeline.totalValue, 0)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const PipelineSelector: React.FC<PipelineSelectorProps> = ({
  pipelines = [],
  selectedPipeline,
  onPipelineChange,
  onCreateNew,
  onManagePipelines,
  loading = false,
  disabled = false,
  showCreateButton = true,
  showManageButton = true,
  showMetrics = true,
  placeholder = "Seleccionar pipeline...",
  size = 'md',
  className,
}) => {
  // ============================================
  // LOCAL STATE
  // ============================================
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleToggle = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
    }
  };

  const handlePipelineSelect = (pipeline: PipelineDTO) => {
    onPipelineChange?.(pipeline);
    setIsOpen(false);
  };

  const handleCreateNew = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onCreateNew?.();
  };

  const handleManage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onManagePipelines?.();
  };

  // ============================================
  // SIZE CONFIGURATIONS
  // ============================================
  const sizeClasses = {
    sm: "px-3 py-2 text-sm min-w-[180px]",
    md: "px-4 py-2.5 text-sm min-w-[220px]",
    lg: "px-4 py-3 text-base min-w-[280px]"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Selector Button */}
      <button
        onClick={handleToggle}
        disabled={disabled || loading}
        className={cn(
          "flex items-center justify-between gap-2 bg-app-dark-700 border border-app-dark-600 rounded-lg text-app-gray-200 hover:bg-app-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors",
          sizeClasses[size],
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "ring-2 ring-primary-500 border-primary-500/50"
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GitBranch className={cn(iconSizes[size], "text-primary-400 flex-shrink-0")} />
          
          {loading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span>Cargando...</span>
            </div>
          ) : selectedPipeline ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium truncate">{selectedPipeline.name}</span>
              <div className="flex items-center gap-1">
                {selectedPipeline.isDefault && (
                  <Star className="h-3 w-3 text-yellow-400 fill-current flex-shrink-0" />
                )}
                {!selectedPipeline.isActive && (
                  <Badge variant="secondary" size="sm">Inactivo</Badge>
                )}
              </div>
            </div>
          ) : (
            <span className="text-app-gray-400">{placeholder}</span>
          )}
        </div>

        <ChevronDown 
          className={cn(
            iconSizes[size], 
            "text-app-gray-400 transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-app-dark-700 border border-app-dark-600 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header con estadísticas */}
          {showMetrics && pipelines.length > 0 && (
            <div className="px-4 py-3 border-b border-app-dark-600 bg-app-dark-800">
              <div className="flex items-center justify-between text-xs text-app-gray-400">
                <span>{pipelines.length} pipelines disponibles</span>
                <div className="flex items-center gap-3">
                  <span>{pipelines.filter(p => p.isActive).length} activos</span>
                  <span>{pipelines.filter(p => p.isDefault).length} por defecto</span>
                </div>
              </div>
            </div>
          )}

          {/* Pipelines List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : pipelines.length === 0 ? (
              <div className="text-center py-8 px-4">
                <GitBranch className="h-8 w-8 text-app-gray-400 mx-auto mb-2" />
                <p className="text-sm text-app-gray-400 mb-4">
                  No hay pipelines disponibles
                </p>
                {showCreateButton && onCreateNew && (
                  <Button size="sm" onClick={handleCreateNew}>
                    <Plus className="h-4 w-4" />
                    Crear Primer Pipeline
                  </Button>
                )}
              </div>
            ) : (
              <>
                {pipelines
                  .sort((a, b) => {
                    // Ordenar: por defecto primero, luego por nombre
                    if (a.isDefault && !b.isDefault) return -1;
                    if (!a.isDefault && b.isDefault) return 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((pipeline) => (
                    <PipelineItem
                      key={pipeline.id}
                      pipeline={pipeline}
                      isSelected={selectedPipeline?.id === pipeline.id}
                      showMetrics={showMetrics}
                      onClick={() => handlePipelineSelect(pipeline)}
                    />
                  ))
                }
              </>
            )}
          </div>

          {/* Footer Actions */}
          {(showCreateButton || showManageButton) && (
            <div className="px-2 py-2 border-t border-app-dark-600 bg-app-dark-800">
              <div className="flex items-center gap-2">
                {showCreateButton && onCreateNew && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateNew}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Pipeline
                  </Button>
                )}
                {showManageButton && onManagePipelines && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManage}
                    className="flex-1"
                  >
                    <Settings className="h-4 w-4" />
                    Administrar
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PipelineSelector;