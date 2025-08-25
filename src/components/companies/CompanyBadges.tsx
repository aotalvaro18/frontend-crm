// src/components/companies/CompanyBadges.tsx
// Badges reutilizables para empresas

import React from 'react';
import { Building2, Users, Landmark, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { CompanyType, CompanySize } from '@/types/company.types';
import { 
  COMPANY_TYPE_LABELS,
  COMPANY_SIZE_LABELS 
} from '@/types/company.types';

// ============================================
// COMPANY TYPE BADGE
// ============================================

export interface CompanyTypeBadgeProps {
  type: CompanyType;
  className?: string;
  showIcon?: boolean;
}

export const CompanyTypeBadge: React.FC<CompanyTypeBadgeProps> = ({ 
  type, 
  className,
  showIcon = false 
}) => {
  const typeConfig = {
    COMPANY: { variant: 'info' as const, icon: Building2, tooltip: 'Empresa comercial' },
    FAMILY: { variant: 'success' as const, icon: Users, tooltip: 'Grupo familiar' },
    INSTITUTION: { variant: 'portal' as const, icon: Landmark, tooltip: 'Institución' },
    OTHER: { variant: 'secondary' as const, icon: Briefcase, tooltip: 'Otro tipo' }
  };
  
  const config = typeConfig[type] || typeConfig.OTHER;
  const IconComponent = config.icon;
  
  return (
    <Badge 
      variant={config.variant} 
      size="sm" 
      title={config.tooltip} 
      className={className}
      icon={showIcon ? <IconComponent className="h-3 w-3" /> : undefined}
    >
      {COMPANY_TYPE_LABELS[type]}
    </Badge>
  );
};

// ============================================
// COMPANY SIZE BADGE - Unchanged
// ============================================

export interface CompanySizeBadgeProps {
  size?: CompanySize;
  className?: string;
}

export const CompanySizeBadge: React.FC<CompanySizeBadgeProps> = ({ 
  size, 
  className 
}) => {
  if (!size) {
    return <span className="text-app-gray-500 text-xs italic">Sin especificar</span>;
  }
  
  const sizeConfig = {
    SMALL: { variant: 'secondary' as const, tooltip: '1-10 empleados' },
    MEDIUM: { variant: 'info' as const, tooltip: '11-50 empleados' },
    LARGE: { variant: 'warning' as const, tooltip: '51-200 empleados' },
    ENTERPRISE: { variant: 'success' as const, tooltip: '200+ empleados' }
  };
  
  const config = sizeConfig[size];
  
  return (
    <Badge 
      variant={config.variant} 
      size="sm" 
      title={config.tooltip} 
      className={className}
    >
      {COMPANY_SIZE_LABELS[size]}
    </Badge>
  );
};