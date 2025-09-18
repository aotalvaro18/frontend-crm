// src/components/deals/KanbanColumnHeader.tsx
// ✅ KANBAN COLUMN HEADER - Cabecera rica para columnas del Kanban
// Siguiendo arquitectura Eklesa: componente reutilizable y "tonto"
// 🔧 NIVEL SALESFORCE: Indicadores de color, alertas de cuello de botella, métricas avanzadas

import React, { useMemo } from 'react';
import { 
  Clock, 
  TrendingUp, 
  Flame,
  Target,
  DollarSign
} from 'lucide-react';

// ============================================
// UI COMPONENTS - Reutilizando componentes shared
// ============================================
import { IconButton } from '@/components/ui/Button';

import { Tooltip } from '@/components/ui/Tooltip';

// ============================================
// TYPES
// ============================================
import type { StageMetrics } from '@/types/deal.types';

// ============================================
// UTILS
// ============================================
import { cn } from '@/utils/cn';
import { formatters } from '@/utils/formatters';

// ============================================
// COMPONENT PROPS
// ============================================
interface KanbanColumnHeaderProps {
  stage: StageMetrics;
  onCreateDeal: (stageId: number) => void;
  className?: string;
  
  // Configuración visual
  showMetrics?: boolean;
  showBottleneckAlerts?: boolean;
  showStageColor?: boolean;
  compactMode?: boolean;
}

// ============================================
// BUSINESS LOGIC HELPERS
// ============================================

/**
 * Obtiene el color de la etapa basado en su posición en el pipeline
 * Simula colores progresivos como Salesforce
 */
const getStageColor = (stageName: string, stageId: number): string => {
  // Colores progresivos del pipeline (del frío al caliente)
  const colors = [
    'bg-blue-500',      // Etapas iniciales (contacto, prospección)
    'bg-indigo-500',    // Calificación
    'bg-purple-500',    // Presentación
    'bg-pink-500',      // Propuesta
    'bg-orange-500',    // Negociación
    'bg-red-500',       // Cierre
  ];
  
  // Si hay un patrón en el nombre, usar eso
  const lowerName = (stageName || '').toLowerCase();
  
  if (lowerName.includes('contacto') || lowerName.includes('lead')) return 'bg-blue-500';
  if (lowerName.includes('calificad') || lowerName.includes('seguimiento')) return 'bg-indigo-500';
  if (lowerName.includes('presentación') || lowerName.includes('demo')) return 'bg-purple-500';
  if (lowerName.includes('propuesta') || lowerName.includes('cotización')) return 'bg-pink-500';
  if (lowerName.includes('negociación') || lowerName.includes('revisión')) return 'bg-orange-500';
  if (lowerName.includes('cierre') || lowerName.includes('firma')) return 'bg-red-500';
  
  // Fallback: usar stageId para distribuir colores
  return colors[stageId % colors.length];
};

/**
 * Detecta si hay un cuello de botella en la etapa
 */
const getBottleneckAlert = (stage: StageMetrics): {
  hasBottleneck: boolean;
  alertType: 'warning' | 'danger';
  message: string;
} | null => {
  const deals = stage.deals || [];
  const avgDaysInStage = stage.averageDaysInStage || 0;
  
  // No hay deals = no hay cuello de botella
  if (deals.length === 0) {
    return null;
  }
  
  // Criterio 1: Más de 30 días promedio en la etapa
  if (avgDaysInStage > 30) {
    return {
      hasBottleneck: true,
      alertType: 'danger',
      message: `${Math.round(avgDaysInStage)} días promedio en etapa`
    };
  }
  
  // Criterio 2: Más de 21 días promedio = warning
  if (avgDaysInStage > 21) {
    return {
      hasBottleneck: true,
      alertType: 'warning',
      message: `${Math.round(avgDaysInStage)} días promedio`
    };
  }
  
  // Criterio 3: Deals específicos estancados (más de 14 días sin actividad)
  const stalledDeals = deals.filter(deal => {
    if (!deal.lastActivityAt) return true; // Sin actividad = estancado
    
    const lastActivity = new Date(deal.lastActivityAt);
    const today = new Date();
    const daysSinceActivity = Math.ceil((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceActivity > 14;
  });
  
  if (stalledDeals.length > 0) {
    return {
      hasBottleneck: true,
      alertType: stalledDeals.length > deals.length / 2 ? 'danger' : 'warning',
      message: `${stalledDeals.length} deals sin actividad reciente`
    };
  }
  
  return null;
};

/**
 * Calcula métricas avanzadas para la etapa
 */
const getAdvancedMetrics = (stage: StageMetrics) => {
  const deals = stage.deals || [];
  const totalValue = stage.totalValue || 0;
  const dealCount = stage.dealCount || deals.length;
  
  // Valor promedio por deal
  const avgDealValue = dealCount > 0 ? totalValue / dealCount : 0;
  
  // Valor ponderado (suma de valor * probabilidad)
  const weightedValue = deals.reduce((sum, deal) => {
    const value = deal.amount || 0;
    const probability = (deal.probability || 0) / 100;
    return sum + (value * probability);
  }, 0);
  
  // Distribución de prioridades
  const highPriorityCount = deals.filter(d => d.priority === 'HIGH' || d.priority === 'URGENT').length;
  
  return {
    avgDealValue,
    weightedValue,
    highPriorityCount,
    conversionRate: 0, // Se podría calcular con datos históricos
  };
};

// ============================================
// MAIN COMPONENT
// ============================================

const KanbanColumnHeader: React.FC<KanbanColumnHeaderProps> = ({
  stage,
  onCreateDeal,
  className,
  showMetrics = true,
  showBottleneckAlerts = true,
  showStageColor = true,
  compactMode = false,
}) => {
  
  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  const stageColor = showStageColor ? getStageColor(stage.stageName || '', stage.stageId) : null;
  const bottleneckAlert = showBottleneckAlerts ? getBottleneckAlert(stage) : null;
  const metrics = useMemo(() => getAdvancedMetrics(stage), [stage]);
  
  const dealCount = stage.dealCount || (stage.deals || []).length;
  const totalValue = stage.totalValue || 0;
  
  // ============================================
  // RENDER HELPERS
  // ============================================
  
  const renderStageIndicator = () => {
    if (!showStageColor || !stageColor) return null;
    
    return (
      <div className={cn(
        'w-3 h-3 rounded-full flex-shrink-0',
        stageColor,
        'shadow-sm ring-1 ring-white/20'
      )} />
    );
  };
  
  const renderBottleneckAlert = () => {
    if (!bottleneckAlert?.hasBottleneck) return null;
    
    const { alertType, message } = bottleneckAlert;
    
    return (
      <Tooltip content={`Cuello de botella detectado: ${message}`}>
        <div className={cn(
          'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
          alertType === 'danger' 
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        )}>
          <Flame className="h-3 w-3" />
          <span>{message}</span>
        </div>
      </Tooltip>
    );
  };
  
  const renderMetrics = () => {
    if (!showMetrics) return null;
    
    return (
      <div className="flex items-center space-x-4 mt-1 text-xs text-app-gray-400">
        {/* Contador de deals */}
        <div className="flex items-center space-x-1">
          <Target className="h-3 w-3" />
          <span>{dealCount} deals</span>
        </div>
        
        {/* Valor total */}
        <div className="flex items-center space-x-1">
          <DollarSign className="h-3 w-3" />
          <span>
            {totalValue > 0 
              ? formatters.currency(totalValue, 0)
              : '$0'
            }
          </span>
        </div>
        
        {/* Valor ponderado (si es diferente del total) */}
        {metrics.weightedValue > 0 && metrics.weightedValue !== totalValue && (
          <Tooltip content="Valor ponderado (valor × probabilidad)">
            <div className="flex items-center space-x-1 text-green-400">
              <TrendingUp className="h-3 w-3" />
              <span>{formatters.currency(metrics.weightedValue, 0)}</span>
            </div>
          </Tooltip>
        )}
        
        {/* Deals de alta prioridad */}
        {metrics.highPriorityCount > 0 && (
          <Tooltip content={`${metrics.highPriorityCount} deals de alta prioridad`}>
            <div className="flex items-center space-x-1 text-orange-400">
              <Flame className="h-3 w-3" />
              <span>{metrics.highPriorityCount}</span>
            </div>
          </Tooltip>
        )}
        
        {/* Tiempo promedio en etapa */}
        {stage.averageDaysInStage && stage.averageDaysInStage > 0 && (
          <Tooltip content="Tiempo promedio en esta etapa">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{Math.round(stage.averageDaysInStage)}d</span>
            </div>
          </Tooltip>
        )}
      </div>
    );
  };
  
  // ============================================
  // MAIN RENDER
  // ============================================
  
  return (
    <div className={cn(
      'mb-4 p-3 rounded-lg border transition-all duration-200',
      // Color dinámico del background según el estado de la etapa
      bottleneckAlert?.hasBottleneck
        ? bottleneckAlert.alertType === 'danger'
          ? 'bg-red-500/10 border-red-500/30 shadow-sm shadow-red-500/20'
          : 'bg-yellow-500/10 border-yellow-500/30 shadow-sm shadow-yellow-500/20'
        : 'bg-app-dark-700 border-app-dark-600 hover:border-app-dark-500',
      
      // Modo compacto
      compactMode && 'p-2',
      
      className
    )}>
      <div className="flex items-start justify-between">
        {/* Lado izquierdo: Información de la etapa */}
        <div className="flex-1 min-w-0">
          {/* Título de la etapa con indicador de color */}
          <div className="flex items-center space-x-2 mb-1">
            {renderStageIndicator()}
            <h3 className={cn(
              'font-medium text-white truncate',
              compactMode ? 'text-sm' : 'text-base'
            )}>
              {stage.stageName}
            </h3>
          </div>
          
          {/* Alerta de cuello de botella */}
          {!compactMode && bottleneckAlert?.hasBottleneck && (
            <div className="mb-2">
              {renderBottleneckAlert()}
            </div>
          )}
          
          {/* Métricas */}
          {renderMetrics()}
        </div>

        {/* Lado derecho: Acciones */}
        <div className="flex items-center space-x-2 ml-3">
          {/* Alerta compacta en modo compacto */}
          {compactMode && bottleneckAlert?.hasBottleneck && (
            <Tooltip content={`Cuello de botella: ${bottleneckAlert.message}`}>
              <div className={cn(
                'w-2 h-2 rounded-full',
                bottleneckAlert.alertType === 'danger' ? 'bg-red-500' : 'bg-yellow-500'
              )} />
            </Tooltip>
          )}
          
          {/* Botón para agregar deal */}
          <Tooltip content="Crear nueva oportunidad">
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => onCreateDeal(stage.stageId)}
              className="text-app-gray-400 hover:text-white hover:bg-app-dark-600"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default KanbanColumnHeader;