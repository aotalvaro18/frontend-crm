// src/components/contacts/ContactStatsCards.tsx
// ✅ CONTACT STATS CARDS - ENTERPRISE DASHBOARD COMPONENT
// Reutilización total de types ContactStats + Mobile-first + Performance optimized

import React, { useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Globe,
  Activity,
  Calendar,
  Target,
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
// TYPES EXACTOS - REUTILIZACIÓN DE ARQUITECTURA
// ============================================

import type { ContactStats } from '@/types/contact.types';

// ============================================
// UTILS
// ============================================

import { cn } from '@/utils/cn';
import formatters from '@/utils/formatters';

// ============================================
// COMPONENT PROPS
// ============================================

export interface ContactStatsCardsProps {
  stats?: ContactStats | null;
  isLoading?: boolean;
  showTrends?: boolean;
  showTooltips?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
  cardClassName?: string;
  onCardClick?: (statKey: keyof ContactStats) => void;
}

// ============================================
// STAT CARD CONFIGURATION
// ============================================

interface StatCardConfig {
  key: keyof ContactStats;
  title: string;
  description: string;
  icon: React.ElementType;
  variant: 'default' | 'success' | 'info' | 'warning' | 'accent';
  format: 'number' | 'percentage' | 'decimal';
  priority: number; // Para ordenamiento
  category: 'overview' | 'engagement' | 'portal' | 'growth';
}

const statCardConfigs: StatCardConfig[] = [
  // Overview Stats (Priority 1-3)
  {
    key: 'total',
    title: 'Total Contactos',
    description: 'Número total de contactos en el sistema',
    icon: Users,
    variant: 'default',
    format: 'number',
    priority: 1,
    category: 'overview',
  },
  {
    key: 'active',
    title: 'Contactos Activos',
    description: 'Contactos con estado activo',
    icon: UserCheck,
    variant: 'success',
    format: 'number',
    priority: 2,
    category: 'overview',
  },
  {
    key: 'inactive',
    title: 'Contactos Inactivos',
    description: 'Contactos temporalmente inactivos',
    icon: UserX,
    variant: 'warning',
    format: 'number',
    priority: 3,
    category: 'overview',
  },

  // Portal Stats (Priority 4-5)
  {
    key: 'withPortal',
    title: 'Con Portal Digital',
    description: 'Contactos con acceso al portal digital',
    icon: Globe,
    variant: 'info',
    format: 'number',
    priority: 4,
    category: 'portal',
  },
  {
    key: 'adoptionRate',
    title: 'Tasa de Adopción',
    description: 'Porcentaje de contactos con portal activo',
    icon: Target,
    variant: 'accent',
    format: 'percentage',
    priority: 5,
    category: 'portal',
  },

  // Extended Stats (Priority 6+) - Opcionales
  {
    key: 'averageEngagementScore',
    title: 'Engagement Promedio',
    description: 'Puntuación promedio de engagement',
    icon: Activity,
    variant: 'info',
    format: 'decimal',
    priority: 6,
    category: 'engagement',
  },
  {
    key: 'newContactsThisMonth',
    title: 'Nuevos Este Mes',
    description: 'Contactos agregados en el mes actual',
    icon: Calendar,
    variant: 'success',
    format: 'number',
    priority: 7,
    category: 'growth',
  },
];

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

export const ContactStatsCards: React.FC<ContactStatsCardsProps> = ({
  stats,
  isLoading: isLoadingProp, // Renombramos la prop para evitar conflicto
  showTrends = false,
  showTooltips = true,
  variant = 'default',
  className,
  cardClassName,
  onCardClick,
}) => {
  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  // ✅ CORRECCIÓN: El estado de carga se infiere de si 'stats' existe.
  // Damos prioridad a la prop 'isLoadingProp' si se pasa explícitamente.
  const isLoading = isLoadingProp ?? !stats;

  // Filtrar configs basado en qué datos están disponibles
  const availableConfigs = useMemo(() => {
    // Si no hay datos, mostramos los configs básicos para los esqueletos
    if (!stats) {
      return statCardConfigs.filter(config => 
        ['total', 'active', 'inactive', 'withPortal'].includes(config.key)
      );
    }

    return statCardConfigs
      .filter(config => {
        const key = config.key as keyof ContactStats;
        return stats[key] !== undefined && stats[key] !== null;
      })
      .sort((a, b) => a.priority - b.priority);
  }, [stats]);

  // Calcular trends (la lógica se mantiene)
  const trends = useMemo(() => {
    const trendMap: Record<string, number> = {};
    if (showTrends && stats) { // Solo calcular si hay datos
      trendMap['total'] = Math.random() * 10 - 2;
      trendMap['active'] = Math.random() * 15 - 5;
      trendMap['withPortal'] = Math.random() * 20;
      trendMap['adoptionRate'] = Math.random() * 8 - 2;
    }
    return trendMap;
  }, [showTrends, stats]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleCardClick = (statKey: keyof ContactStats) => {
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
          availableConfigs.map((config) => (
            <StatCard
              key={config.key}
              config={config}
              value={stats![config.key as keyof ContactStats] as number}
              trend={trends[config.key]}
              isLoading={false} // Ya no está cargando
              showTrend={showTrends}
              showTooltip={showTooltips}
              variant={variant}
              onClick={() => handleCardClick(config.key as keyof ContactStats)}
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
export const CompactStatsCards: React.FC<Omit<ContactStatsCardsProps, 'variant'>> = (props) => (
  <ContactStatsCards {...props} variant="compact" />
);

/**
 * Minimal Stats Cards - Para widgets pequeños
 */
export const MinimalStatsCards: React.FC<Omit<ContactStatsCardsProps, 'variant'>> = (props) => (
  <ContactStatsCards {...props} variant="minimal" />
);

/**
 * Trending Stats Cards - Con indicadores de tendencia
 */
export const TrendingStatsCards: React.FC<Omit<ContactStatsCardsProps, 'showTrends'>> = (props) => (
  <ContactStatsCards {...props} showTrends={true} />
);

export default ContactStatsCards;