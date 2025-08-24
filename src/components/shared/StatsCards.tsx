// src/shared/StatsCards.tsx
// ✅ STATS CARDS - ENTERPRISE DASHBOARD COMPONENT
// Reutilización total de types ContactStats + Mobile-first + Performance optimized
//OJO: ESTE STATS CARD ES USADO EN TODOS LOS MODUOLOS EXCEPTO EN CONTACTS QUE TOCA REFACTORIZAR DESPUES

import React, { useMemo } from 'react';
import { 
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

// ============================================
// UI COMPONENTS - REUTILIZACIÓN TOTAL
// ============================================

import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Tooltip } from '@/components/ui/Tooltip';

// ============================================
// UTILS
// ============================================

import { cn } from '@/utils/cn';
import formatters from '@/utils/formatters';

// ============================================
// COMPONENT PROPS
// ============================================

export interface StatCardConfig {
    key: string;
    title: string;
    description: string;
    icon: React.ElementType;
    variant: 'default' | 'success' | 'info' | 'warning' | 'accent';
    format: 'number' | 'percentage' | 'decimal';
  }
  
  export interface StatsCardsProps {
    stats?: Record<string, number | undefined> | null;
    configs: StatCardConfig[];
    isLoading?: boolean;
    showTrends?: boolean;
    showTooltips?: boolean;
    variant?: 'default' | 'compact' | 'minimal';
    className?: string;
    cardClassName?: string;
    onCardClick?: (statKey: string) => void;
  }

// ============================================
// STAT CARD CONFIGURATION
// ============================================


// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  config: StatCardConfig;
  value: number | undefined;
  trend?: number; // Cambio porcentual respecto al período anterior
  isLoading?: boolean;
  showTrend?: boolean;
  showTooltip?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  onClick?: () => void;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  config,
  value,
  trend,
  isLoading = false,
  showTrend = false,
  showTooltip = true,
  variant = 'default',
  onClick,
  className,
}) => {
  // ============================================
  // COMPUTED VALUES
  // ============================================

  const formattedValue = useMemo(() => {
    if (value === undefined || value === null) return '-';
    
    switch (config.format) {
      case 'percentage':
        return formatters.percentage(value / 100); // ContactStats viene en formato 0-100
      case 'decimal':
        return formatters.decimal(value, 1);
      case 'number':
      default:
        return formatters.number(value);
    }
  }, [value, config.format]);

  const trendIcon = useMemo(() => {
    if (!trend || trend === 0) return Minus;
    return trend > 0 ? ArrowUpRight : ArrowDownRight;
  }, [trend]);

  const trendColor = useMemo(() => {
    if (!trend || trend === 0) return 'text-app-gray-400';
    return trend > 0 ? 'text-green-400' : 'text-red-400';
  }, [trend]);

  const isClickable = !!onClick;

  // ============================================
  // VARIANT STYLES
  // ============================================

  const variantStyles = {
    default: {
      card: 'p-4 sm:p-6',
      icon: 'h-6 w-6 sm:h-8 sm:w-8',
      title: 'text-xs sm:text-sm',
      value: 'text-lg sm:text-2xl lg:text-3xl',
      trend: 'text-xs sm:text-sm',
    },
    compact: {
      card: 'p-3 sm:p-4',
      icon: 'h-5 w-5 sm:h-6 sm:w-6',
      title: 'text-xs',
      value: 'text-base sm:text-lg lg:text-xl',
      trend: 'text-xs',
    },
    minimal: {
      card: 'p-2 sm:p-3',
      icon: 'h-4 w-4 sm:h-5 sm:w-5',
      title: 'text-xs',
      value: 'text-sm sm:text-base lg:text-lg',
      trend: 'text-xs',
    },
  };

  const styles = variantStyles[variant];

  // ============================================
  // ICON COLORS BY VARIANT
  // ============================================

  const iconColors = {
    default: 'text-app-gray-400',
    success: 'text-green-400',
    info: 'text-blue-400',
    warning: 'text-yellow-400',
    accent: 'text-app-accent-400',
  };

  // ============================================
  // RENDER
  // ============================================

  const cardContent = (
    <div className={cn(
      'bg-app-dark-800 border border-app-dark-600 rounded-lg transition-all duration-200',
      'hover:border-app-dark-500',
      isClickable && 'cursor-pointer hover:bg-app-dark-750 active:scale-[0.98]',
      styles.card,
      className
    )}
    onClick={onClick}
    role={isClickable ? 'button' : undefined}
    tabIndex={isClickable ? 0 : undefined}
    >
      {/* Header con icono y título */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium text-app-gray-300 truncate',
            styles.title
          )}>
            {config.title}
          </p>
        </div>
        
        <div className={cn(
          'flex-shrink-0 ml-2',
          iconColors[config.variant]
        )}>
          <config.icon className={styles.icon} />
        </div>
      </div>

      {/* Valor principal */}
      <div className="mb-2">
        {isLoading ? (
          <div className="flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
            <div className={cn('h-6 bg-app-dark-600 rounded animate-pulse', styles.value.includes('text-lg') ? 'w-16' : 'w-12')} />
          </div>
        ) : (
          <p className={cn(
            'font-bold text-app-gray-100 tabular-nums',
            styles.value
          )}>
            {formattedValue}
          </p>
        )}
      </div>

      {/* Trend indicator */}
      {showTrend && !isLoading && trend !== undefined && (
        <div className="flex items-center space-x-1">
          <div className={cn('flex items-center space-x-1', trendColor)}>
            {React.createElement(trendIcon, { 
              className: cn('h-3 w-3', trendColor) 
            })}
            <span className={cn('font-medium tabular-nums', styles.trend)}>
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
          <span className={cn('text-app-gray-500', styles.trend)}>
            vs mes anterior
          </span>
        </div>
      )}

      {/* Badge indicator para valores especiales */}
      {!isLoading && value !== undefined && (
        <>
          {config.key === 'adoptionRate' && value >= 80 && (
            <Badge variant="success" size="sm" className="mt-2">
              <Award className="h-3 w-3 mr-1" />
              Excelente
            </Badge>
          )}
          {config.key === 'averageEngagementScore' && value >= 70 && (
            <Badge variant="success" size="sm" className="mt-2">
              Alto Engagement
            </Badge>
          )}
        </>
      )}
    </div>
  );

  // Con tooltip si está habilitado
  if (showTooltip) {
    return (
      <Tooltip content={config.description}>
        {cardContent}
      </Tooltip>
    );
  }

  return cardContent;
};

// ============================================
// MAIN COMPONENT
// ============================================

export const StatsCards: React.FC<StatsCardsProps> = ({
    stats,
    configs, // <-- Nueva prop
    isLoading: isLoadingProp,
    showTrends = false,
    showTooltips = true,
    variant = 'default',
    className,
    cardClassName,
    onCardClick,
  }) => {
    const isLoading = isLoadingProp ?? !stats;
  
    // La lógica de trends y handleCardClick se puede mantener o simplificar
    // Por ahora, la mantenemos simple.
    const handleCardClick = (statKey: string) => {
      onCardClick?.(statKey);
    };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={cn(
      'grid gap-3 sm:gap-4',
      // Usamos un número fijo de columnas para evitar saltos en la UI durante la carga
      'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {/* ✅ CORRECCIÓN: Si está cargando, mostramos N esqueletos.
          Si hay datos, mostramos las tarjetas con los datos. */}
      {isLoading 
        ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className={cn(
                'bg-app-dark-800 border border-app-dark-600 rounded-lg animate-pulse',
                variant === 'compact' ? 'p-3 sm:p-4' : 'p-4 sm:p-6'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-4 bg-app-dark-600 rounded w-20" />
                <div className="h-6 w-6 bg-app-dark-600 rounded-full" />
              </div>
              <div className="h-8 bg-app-dark-600 rounded w-16 mb-2" />
              <div className="h-3 bg-app-dark-600 rounded w-24" />
            </div>
          ))
        ) 
        : (
          configs.map((config) => (
            <StatCard
            key={config.key}
            config={config}
            value={stats?.[config.key]}
            // Trend se puede añadir después si es necesario
            isLoading={false} 
            showTrend={showTrends}
            showTooltip={showTooltips}
            variant={variant}
            onClick={() => handleCardClick(config.key)}
            className={cardClassName}
            />
        ))
        )
      }
    </div>
  );
};

// ============================================
// SPECIALIZED VARIANTS
// ============================================

/**
 * Compact Stats Cards - Para dashboards densos
 */
export const CompactStatsCards: React.FC<Omit<StatsCardsProps, 'variant'>> = (props) => (
    <StatsCards {...props} variant="compact" />
  );
  
  export const MinimalStatsCards: React.FC<Omit<StatsCardsProps, 'variant'>> = (props) => (
    <StatsCards {...props} variant="minimal" />
  );
  
  export const TrendingStatsCards: React.FC<Omit<StatsCardsProps, 'showTrends'>> = (props) => (
    <StatsCards {...props} showTrends={true} />
  );
  
  export default StatsCards;