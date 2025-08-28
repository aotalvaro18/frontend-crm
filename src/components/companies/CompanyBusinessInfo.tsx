// src/components/companies/CompanyBusinessInfo.tsx
// Business info component - Dashboard de salud y valor comercial de clase mundial
// ✅ CORREGIDO: Usa solo campos que existen en CompanyDTO del backend

import React from 'react';
import { 
  Briefcase, Users, DollarSign, TrendingUp, Calendar, 
  ArrowUp, ArrowDown, Minus, Target, AlertTriangle, 
  CheckCircle, Clock, Zap, Award, BarChart3
} from 'lucide-react';
import type { CompanyDTO } from '@/types/company.types';
import { formatters } from '@/utils/formatters';
import { isLargeCompany } from '@/types/company.types';
import { CompanySizeBadge } from './CompanyBadges';
import { cn } from '@/utils/cn';

// ============================================
// ADVANCED UI COMPONENTS
// ============================================

interface HealthScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const HealthScore: React.FC<HealthScoreProps> = ({ score, size = 'md' }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 border-green-500/30 bg-green-900/20';
    if (score >= 60) return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20';
    if (score >= 40) return 'text-orange-400 border-orange-500/30 bg-orange-900/20';
    return 'text-red-400 border-red-500/30 bg-red-900/20';
  };

  const sizeClasses = {
    sm: 'h-12 w-12 text-xs',
    md: 'h-16 w-16 text-sm',
    lg: 'h-20 w-20 text-base'
  };

  return (
    <div className={cn(
      'rounded-full border-2 flex items-center justify-center font-bold',
      getScoreColor(score),
      sizeClasses[size]
    )}>
      {score}
    </div>
  );
};

interface MetricFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const MetricField: React.FC<MetricFieldProps> = ({ 
  icon, 
  label, 
  value, 
  description, 
  trend,
  variant = 'default',
  className 
}) => {
  const variantClasses = {
    default: 'text-app-gray-100',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400'
  };

  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-app-gray-500';

  return (
    <div className={cn('relative', className)}>
      <dt className="flex items-center justify-between text-sm font-medium text-app-gray-400">
        <div className="flex items-center">
          <div className="text-app-gray-400">{icon}</div>
          <span className="ml-2">{label}</span>
        </div>
        {trend && (
          <div className={cn('flex items-center', trendColor)}>
            <TrendIcon className="h-3 w-3" />
          </div>
        )}
      </dt>
      <dd className={cn('mt-1 text-2xl font-bold tracking-tight', variantClasses[variant])}>
        {value}
      </dd>
      {description && (
        <p className="text-xs text-app-gray-500 mt-1 leading-relaxed">{description}</p>
      )}
    </div>
  );
};

interface StatusBadgeProps {
  status: string;
  variant: 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant, icon }) => {
  const variantClasses = {
    success: 'bg-green-900/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30',
    danger: 'bg-red-900/20 text-red-400 border-red-500/30',
    info: 'bg-blue-900/20 text-blue-400 border-blue-500/30'
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
      variantClasses[variant]
    )}>
      {icon && <span className="mr-1.5">{icon}</span>}
      {status}
    </span>
  );
};

// ============================================
// MAIN COMPONENT - USANDO SOLO CAMPOS REALES DEL BACKEND
// ============================================

interface CompanyBusinessInfoProps {
  company: CompanyDTO;
}

const CompanyBusinessInfo: React.FC<CompanyBusinessInfoProps> = ({ company }) => {
  // Smart descriptions based on data
  const getPipelineDescription = () => {
    const totalValue = company.totalDealValue || 0;
    const dealCount = company.dealCount || 0;
    
    if (dealCount === 0) return 'Sin oportunidades activas';
    if (totalValue > 0 && dealCount > 0) {
      const avgDealSize = totalValue / dealCount;
      return `Promedio de ${formatters.currency(avgDealSize, 0)} por deal`;
    }
    return `${dealCount} oportunidades en progreso`;
  };

  const getEngagementDescription = () => {
    if (!company.lastActivityAt) return 'Sin actividad registrada';
    
    const days = Math.floor((Date.now() - new Date(company.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Actividad hoy';
    if (days === 1) return 'Actividad ayer';
    if (days <= 7) return `Actividad hace ${days} días`;
    if (days <= 30) return `Actividad hace ${Math.floor(days/7)} semanas`;
    return `Actividad hace ${Math.floor(days/30)} meses`;
  };

  // ✅ CORREGIDO: Usa campos reales del backend
  const getHealthStatusBadge = () => {
    const score = company.overallHealthScore || 0;
    if (score >= 80) return <StatusBadge status="Cuenta Premium" variant="success" icon={<Award className="h-3 w-3" />} />;
    if (score >= 60) return <StatusBadge status="Cuenta Saludable" variant="info" icon={<CheckCircle className="h-3 w-3" />} />;
    if (score >= 40) return <StatusBadge status="Requiere Atención" variant="warning" icon={<Clock className="h-3 w-3" />} />;
    return <StatusBadge status="Alto Riesgo" variant="danger" icon={<AlertTriangle className="h-3 w-3" />} />;
  };

  // ✅ CORREGIDO: Usa engagementHealthStatus del backend
  const getEngagementBadgeInfo = () => {
    const engagementHealth = company.engagementHealthStatus;
    
    switch (engagementHealth) {
      case 'hot': 
        return { text: '🔥 Muy Activa', variant: 'success' as const, icon: <Zap className="h-3 w-3" /> };
      case 'warm': 
        return { text: '⚡ Activa', variant: 'info' as const };
      case 'cold': 
        return { text: '❄️ Fría', variant: 'warning' as const };
      case 'dormant': 
      default:
        return { text: '😴 Inactiva', variant: 'danger' as const };
    }
  };

  // ✅ CORREGIDO: Usa pipelineHealthStatus del backend
  const getPipelineVariant = () => {
    const pipelineHealth = company.pipelineHealthStatus;
    if (pipelineHealth === 'excellent') return 'success';
    if (pipelineHealth === 'good') return 'default';
    return 'warning';
  };

  // ✅ CORREGIDO: Usa revenueCategory del backend
  const getRevenueVariant = () => {
    const revenueCategory = company.revenueCategory;
    if (revenueCategory === 'enterprise') return 'success';
    if (revenueCategory === 'mid-market') return 'default';
    return 'warning';
  };

  // ✅ CORREGIDO: Usa engagementHealthStatus del backend
  const getEngagementVariant = () => {
    const engagementHealth = company.engagementHealthStatus;
    if (engagementHealth === 'hot') return 'success';
    if (engagementHealth === 'warm') return 'default';
    if (engagementHealth === 'cold') return 'warning';
    return 'danger';
  };

  const engagementBadgeInfo = getEngagementBadgeInfo();

  return (
    <div className="bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700">
      {/* Header con Health Score */}
      <div className="px-6 py-4 border-b border-app-dark-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-app-gray-100 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary-400" />
            Inteligencia de Negocio
          </h3>
          <div className="flex items-center space-x-3">
            {getHealthStatusBadge()}
            <HealthScore score={company.overallHealthScore || 0} size="sm" />
          </div>
        </div>
      </div>
      
      <div className="px-6 py-6">
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 mb-8">
          {/* Pipeline Value */}
          <MetricField
            icon={<DollarSign className="h-4 w-4" />}
            label="Valor del Pipeline"
            value={company.totalDealValue ? formatters.currency(company.totalDealValue, 0) : '$0'}
            description={getPipelineDescription()}
            variant={getPipelineVariant()}
            trend={company.totalDealValue && company.totalDealValue > 50000 ? 'up' : company.totalDealValue && company.totalDealValue > 0 ? 'stable' : undefined}
          />

          {/* Annual Revenue */}
          <MetricField
            icon={<TrendingUp className="h-4 w-4" />}
            label="Ingresos Anuales"
            value={company.annualRevenue ? formatters.currency(company.annualRevenue, 0) : 'No reportado'}
            description={`Empresa ${company.revenueCategory === 'enterprise' ? 'Enterprise' : company.revenueCategory === 'mid-market' ? 'Mid-Market' : company.revenueCategory === 'smb' ? 'SMB' : 'Startup'}`}
            variant={getRevenueVariant()}
          />

          {/* Last Activity */}
          <MetricField
            icon={<Calendar className="h-4 w-4" />}
            label="Última Interacción"
            value={company.lastActivityAt ? formatters.relativeDate(company.lastActivityAt) : 'Nunca'}
            description={getEngagementDescription()}
            variant={getEngagementVariant()}
          />
        </div>

        {/* Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div>
            <dt className="text-sm font-medium text-app-gray-400 mb-2">Estado de Engagement</dt>
            <dd><StatusBadge status={engagementBadgeInfo.text} variant={engagementBadgeInfo.variant} icon={engagementBadgeInfo.icon} /></dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-app-gray-400 mb-2">Tamaño de Empresa</dt>
            <dd>
              {/* ✅ CORRECCIÓN: Usar la propiedad 'size' que ahora es la fuente de verdad */}
              {company.size ? (
                <CompanySizeBadge size={company.size} />
              ) : (
                <span className="text-sm text-app-gray-500">No especificado</span>
              )}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-app-gray-400 mb-2">Industria</dt>
            <dd className="text-sm text-app-gray-100">
              {company.industry ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-app-dark-600 text-app-gray-300">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {company.industry}
                </span>
              ) : (
                <span className="text-app-gray-500">No especificada</span>
              )}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-app-gray-400 mb-2">ID de Cuenta</dt>
            <dd className="text-sm text-app-gray-100 font-mono">
              #{company.id}
            </dd>
          </div>
        </div>

        {/* Advanced Insights */}
        {(company.contactCount || company.activeContactsCount || isLargeCompany(company)) && (
          <div className="pt-6 border-t border-app-dark-700">
            <h4 className="text-sm font-medium text-app-gray-300 mb-3 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Insights Avanzados
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {/* ✅ CORREGIDO: Usa campos reales del backend */}
              {company.contactCount !== undefined && (
                <div className="bg-app-dark-700 p-3 rounded-lg">
                  <div className="flex items-center text-app-gray-400 mb-1">
                    <Users className="h-4 w-4 mr-1" />
                    Red de Contactos
                  </div>
                  <div className="text-lg font-semibold text-app-gray-100">
                    {company.contactCount} contactos
                  </div>
                  <div className="text-xs text-app-gray-500">
                    {company.activeContactsCount || 0} activos
                  </div>
                </div>
              )}
              
              {isLargeCompany(company) && (
                <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 p-3 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center text-yellow-400 mb-1">
                    <Award className="h-4 w-4 mr-1" />
                    Cuenta Estratégica
                  </div>
                  <div className="text-xs text-yellow-300">
                    Empresa de gran tamaño con alto potencial
                  </div>
                </div>
              )}

              <div className="bg-app-dark-700 p-3 rounded-lg">
                <div className="flex items-center text-app-gray-400 mb-1">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Score Global
                </div>
                <div className="text-lg font-semibold text-app-gray-100">
                  {company.overallHealthScore || 0}/100
                </div>
                <div className="text-xs text-app-gray-500">
                  Salud de la relación
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyBusinessInfo;