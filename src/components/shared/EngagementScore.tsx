 // src/components/shared/EngagementScore.tsx
// EngagementScore siguiendo tu guía arquitectónica
// Mobile-first + Visual indicators + Badge integration

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Heart,
  Users,
  MessageCircle,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

// ============================================
// ENGAGEMENT SCORE CONFIGURATION
// ============================================

const ENGAGEMENT_RANGES = {
  VERY_LOW: { min: 0, max: 20, label: 'Muy Bajo', color: 'text-red-500', bgColor: 'bg-red-500' },
  LOW: { min: 21, max: 40, label: 'Bajo', color: 'text-orange-500', bgColor: 'bg-orange-500' },
  MEDIUM: { min: 41, max: 60, label: 'Medio', color: 'text-yellow-500', bgColor: 'bg-yellow-500' },
  HIGH: { min: 61, max: 80, label: 'Alto', color: 'text-green-500', bgColor: 'bg-green-500' },
  VERY_HIGH: { min: 81, max: 100, label: 'Muy Alto', color: 'text-emerald-500', bgColor: 'bg-emerald-500' },
} as const;

const ENGAGEMENT_FACTORS = {
  email: { weight: 0.2, icon: Mail, label: 'Interacción por Email' },
  phone: { weight: 0.15, icon: Phone, label: 'Llamadas y SMS' },
  meetings: { weight: 0.25, icon: Calendar, label: 'Reuniones Asistidas' },
  digital: { weight: 0.2, icon: Activity, label: 'Actividad Digital' },
  events: { weight: 0.1, icon: Users, label: 'Eventos Asistidos' },
  feedback: { weight: 0.1, icon: MessageCircle, label: 'Feedback Recibido' },
} as const;

// ============================================
// TYPES
// ============================================

type EngagementRange = keyof typeof ENGAGEMENT_RANGES;
type EngagementFactor = keyof typeof ENGAGEMENT_FACTORS;

interface EngagementScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'compact' | 'detailed' | 'progress' | 'digital';
  showLabel?: boolean;
  showProgress?: boolean;
  showTrend?: boolean;
  previousScore?: number;
  breakdown?: Partial<Record<EngagementFactor, number>>;
  className?: string;
  onClick?: () => void;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

const getEngagementRange = (score: number): EngagementRange => {
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  for (const [range, config] of Object.entries(ENGAGEMENT_RANGES)) {
    if (normalizedScore >= config.min && normalizedScore <= config.max) {
      return range as EngagementRange;
    }
  }
  
  return 'VERY_LOW';
};

const getScoreConfig = (score: number) => {
  const range = getEngagementRange(score);
  return ENGAGEMENT_RANGES[range];
};

const getTrendIcon = (current: number, previous?: number) => {
  if (!previous) return null;
  
  const diff = current - previous;
  if (Math.abs(diff) < 2) return Minus; // No significant change
  return diff > 0 ? TrendingUp : TrendingDown;
};

const getTrendColor = (current: number, previous?: number) => {
  if (!previous) return 'text-app-gray-400';
  
  const diff = current - previous;
  if (Math.abs(diff) < 2) return 'text-app-gray-400';
  return diff > 0 ? 'text-green-500' : 'text-red-500';
};

// ============================================
// MAIN ENGAGEMENT SCORE COMPONENT
// ============================================

export const EngagementScore: React.FC<EngagementScoreProps> = ({
  score,
  size = 'md',
  variant = 'default',
  showLabel = true,
  showProgress = false,
  showTrend = false,
  previousScore,
  breakdown,
  className,
  onClick,
}) => {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const config = getScoreConfig(normalizedScore);
  const TrendIcon = getTrendIcon(normalizedScore, previousScore);
  const trendColor = getTrendColor(normalizedScore, previousScore);
  
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'text-xs',
      score: 'text-sm font-semibold',
      icon: 'h-3 w-3',
      progress: 'h-1',
    },
    md: {
      container: 'text-sm',
      score: 'text-base font-semibold',
      icon: 'h-4 w-4',
      progress: 'h-2',
    },
    lg: {
      container: 'text-base',
      score: 'text-lg font-bold',
      icon: 'h-5 w-5',
      progress: 'h-3',
    },
    xl: {
      container: 'text-lg',
      score: 'text-xl font-bold',
      icon: 'h-6 w-6',
      progress: 'h-4',
    },
  };
  
  const currentSize = sizeConfig[size];
  
  // Compact variant (just score with color)
  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1',
          currentSize.container,
          config.color,
          onClick && 'cursor-pointer hover:opacity-80',
          className
        )}
        onClick={onClick}
        title={`Engagement Score: ${normalizedScore}/100 (${config.label})`}
      >
        <Activity className={currentSize.icon} />
        <span className={currentSize.score}>{normalizedScore}</span>
        {showTrend && TrendIcon && (
          <TrendIcon className={cn(currentSize.icon, trendColor)} />
        )}
      </span>
    );
  }
  
  // Progress variant (progress bar style)
  if (variant === 'progress') {
    return (
      <div
        className={cn('w-full', className)}
        onClick={onClick}
        title={`Engagement Score: ${normalizedScore}/100 (${config.label})`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={cn('font-medium', currentSize.container, 'text-app-gray-300')}>
            {showLabel && 'Engagement'}
          </span>
          <span className={cn(currentSize.score, config.color)}>
            {normalizedScore}%
          </span>
        </div>
        <div className={cn('w-full bg-app-dark-600 rounded-full', currentSize.progress)}>
          <div
            className={cn('rounded-full transition-all duration-500', config.bgColor, currentSize.progress)}
            style={{ width: `${normalizedScore}%` }}
          />
        </div>
        {showTrend && TrendIcon && previousScore && (
          <div className="flex items-center mt-1 text-xs">
            <TrendIcon className={cn('h-3 w-3 mr-1', trendColor)} />
            <span className={trendColor}>
              {normalizedScore > previousScore ? '+' : ''}{normalizedScore - previousScore} vs anterior
            </span>
          </div>
        )}
      </div>
    );
  }
  
  // Digital variant (for digital engagement specifically)
  if (variant === 'digital') {
    return (
      <Badge
        variant="portal"
        size={size === 'sm' ? 'sm' : 'default'}
        className={cn('gap-1', className)}
        onClick={onClick}
      >
        <Activity className={currentSize.icon} />
        <span>Digital: {normalizedScore}</span>
        {showTrend && TrendIcon && (
          <TrendIcon className={cn(currentSize.icon, trendColor)} />
        )}
      </Badge>
    );
  }
  
  // Detailed variant (with breakdown)
  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Main score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={cn(currentSize.icon, config.color)} />
            <span className={cn('font-medium', currentSize.container, 'text-app-gray-300')}>
              Engagement Score
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(currentSize.score, config.color)}>
              {normalizedScore}
            </span>
            <Badge variant="outline" size="sm">
              {config.label}
            </Badge>
            {showTrend && TrendIcon && (
              <TrendIcon className={cn(currentSize.icon, trendColor)} />
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        {showProgress && (
          <div className={cn('w-full bg-app-dark-600 rounded-full', currentSize.progress)}>
            <div
              className={cn('rounded-full transition-all duration-500', config.bgColor, currentSize.progress)}
              style={{ width: `${normalizedScore}%` }}
            />
          </div>
        )}
        
        {/* Breakdown */}
        {breakdown && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(breakdown).map(([factor, value]) => {
              const factorConfig = ENGAGEMENT_FACTORS[factor as EngagementFactor];
              if (!factorConfig || value === undefined) return null;
              
              const IconComponent = factorConfig.icon;
              
              return (
                <div key={factor} className="flex items-center gap-1.5 text-app-gray-400">
                  <IconComponent className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{factorConfig.label}</span>
                  <span className="font-medium text-app-gray-200">{value}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  
  // Default variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        currentSize.container,
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
      title={`Engagement Score: ${normalizedScore}/100 (${config.label})`}
    >
      <Activity className={cn(currentSize.icon, config.color)} />
      <span className={cn(currentSize.score, config.color)}>
        {normalizedScore}
      </span>
      {showLabel && (
        <Badge variant="outline" size="sm">
          {config.label}
        </Badge>
      )}
      {showTrend && TrendIcon && (
        <TrendIcon className={cn(currentSize.icon, trendColor)} />
      )}
    </div>
  );
};

// ============================================
// SPECIALIZED ENGAGEMENT COMPONENTS
// ============================================

/**
 * Table Engagement Score - Optimizado para ContactsTable
 */
export const TableEngagementScore: React.FC<{
  score: number;
  previousScore?: number;
  className?: string;
}> = ({ score, previousScore, className }) => (
  <EngagementScore
    score={score}
    variant="compact"
    size="sm"
    showTrend={!!previousScore}
    previousScore={previousScore}
    className={className}
  />
);

/**
 * Card Engagement Score - Para tarjetas de contacto
 */
export const CardEngagementScore: React.FC<{
  score: number;
  showProgress?: boolean;
  className?: string;
}> = ({ score, showProgress = true, className }) => (
  <EngagementScore
    score={score}
    variant="progress"
    size="md"
    showProgress={showProgress}
    className={className}
  />
);

/**
 * Dashboard Engagement Score - Para dashboards y resúmenes
 */
export const DashboardEngagementScore: React.FC<{
  score: number;
  previousScore?: number;
  breakdown?: Partial<Record<EngagementFactor, number>>;
  onClick?: () => void;
  className?: string;
}> = ({ score, previousScore, breakdown, onClick, className }) => (
  <EngagementScore
    score={score}
    variant="detailed"
    size="lg"
    showProgress
    showTrend={!!previousScore}
    previousScore={previousScore}
    breakdown={breakdown}
    onClick={onClick}
    className={className}
  />
);

/**
 * Digital Engagement Score - Para portal digital
 */
export const DigitalEngagementScore: React.FC<{
  score: number;
  previousScore?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ score, previousScore, size = 'md', className }) => (
  <EngagementScore
    score={score}
    variant="digital"
    size={size}
    showTrend={!!previousScore}
    previousScore={previousScore}
    className={className}
  />
);

/**
 * Engagement Score Indicator - Solo icono con color
 */
export const EngagementScoreIndicator: React.FC<{
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ score, size = 'md', className }) => {
  const config = getScoreConfig(score);
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };
  
  return (
    <Heart
      className={cn(
        iconSizes[size],
        config.color,
        'transition-colors',
        className
        )}
        fill="currentColor"
      >
      <title>
        {`Engagement: ${score}/100 (${config.label})`}
      </title>
    </Heart>
  );
};

// ============================================
// ENGAGEMENT ANALYTICS COMPONENTS
// ============================================

/**
 * Engagement Trend Chart - Mini chart para tendencias
 */
export const EngagementTrend: React.FC<{
  scores: number[];
  labels?: string[];
  className?: string;
}> = ({ scores, className }) => {
  if (scores.length === 0) return null;
  
  const maxScore = Math.max(...scores, 100);
  const minScore = Math.min(...scores, 0);
  const range = maxScore - minScore || 1;
  
  return (
    <div className={cn('w-full h-16 relative', className)}>
      <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={scores
            .map((score, index) => {
              const x = (index / (scores.length - 1)) * 100;
              const y = 40 - ((score - minScore) / range) * 40;
              return `${x},${y}`;
            })
            .join(' ')}
          className="text-app-accent-500"
        />
        {scores.map((score, index) => {
          const x = (index / (scores.length - 1)) * 100;
          const y = 40 - ((score - minScore) / range) * 40;
          const config = getScoreConfig(score);
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              className={config.color}
              fill="currentColor"
            />
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Engagement Statistics - Para mostrar estadísticas generales
 */
export const EngagementStatistics: React.FC<{
  contacts: Array<{ engagementScore: number }>;
  className?: string;
}> = ({ contacts, className }) => {
  const scores = contacts.map(c => c.engagementScore);
  const average = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  
  const distribution = Object.entries(ENGAGEMENT_RANGES).map(([range, config]) => {
    const count = scores.filter(score => score >= config.min && score <= config.max).length;
    const percentage = scores.length > 0 ? Math.round((count / scores.length) * 100) : 0;
    
    return {
      range: range as EngagementRange,
      config,
      count,
      percentage,
    };
  });
  
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-app-gray-300">Engagement Overview</h3>
        <EngagementScore score={average} variant="compact" size="sm" />
      </div>
      
      <div className="space-y-2">
        {distribution.map(({ range, config, count, percentage }) => (
          <div key={range} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full', config.bgColor)} />
              <span className="text-app-gray-400">{config.label}</span>
            </div>
            <div className="flex items-center gap-2 text-app-gray-200">
              <span>{count}</span>
              <span className="text-app-gray-500">({percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// UTILITY EXPORTS
// ============================================

export {
  ENGAGEMENT_RANGES,
  ENGAGEMENT_FACTORS,
  getEngagementRange,
  getScoreConfig,
  type EngagementRange,
  type EngagementFactor,
};

export default EngagementScore;
