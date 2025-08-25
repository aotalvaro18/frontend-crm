// src/components/companies/CompanyAvatar.tsx
// Avatar reutilizable para empresas

import React from 'react';
import { Building, Users, Landmark, Briefcase } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CompanyDTO } from '@/types/company.types';
import { getSuggestedIcon } from '@/types/company.types';

// ============================================
// TYPES
// ============================================

export interface CompanyAvatarProps {
  company: CompanyDTO;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const CompanyAvatar: React.FC<CompanyAvatarProps> = ({ 
  company, 
  size = 'md',
  className 
}) => {
  const iconName = getSuggestedIcon(company);
  
  // Map icon names to components
  const IconComponent = iconName === 'building' ? Building : 
                       iconName === 'users' ? Users :
                       iconName === 'bank' ? Landmark : 
                       Briefcase; // default fallback to match helper
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-16 w-16'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn(
      'rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0',
      sizeClasses[size],
      className
    )}>
      <IconComponent className={cn('text-white', iconSizes[size])} />
    </div>
  );
};