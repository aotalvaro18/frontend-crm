// src/components/companies/CompaniesTable.tsx
// ✅ COMPANIES TABLE - Sin paginación (ahora vive en CompanyListPage)

import React, { useMemo, useState } from 'react';
import { 
  Mail, Phone, Building2, Calendar, MoreHorizontal, Edit3, Trash2, Eye, Globe, 
  Users, Briefcase, Building, Star, TrendingUp
} from 'lucide-react';
//import { type VariantProps } from 'class-variance-authority';

// ============================================
// UI COMPONENTS
// ============================================
import { DataTable, type Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Dropdown from '@/components/ui/Dropdown';
import { Tooltip } from '@/components/ui/Tooltip';

// ============================================
// HOOKS (Solo para estado interno de la tabla)
// ============================================
import {
  useBulkCompanyOperations,
  useCompanyOperations,
} from '@/hooks/useCompanies';

// ============================================
// TYPES
// ============================================
import type { 
  CompanyDTO, 
  CompanyType, 
  CompanySize 
} from '@/types/company.types';
import { 
  COMPANY_TYPE_LABELS, 
  COMPANY_SIZE_LABELS, 
  getDisplayName,
  getPreferredContactMethod,
  getSuggestedIcon,
  hasCompleteContactInfo,
  isLargeCompany
} from '@/types/company.types';

// ============================================
// UTILS
// ============================================
import { cn } from '@/utils/cn';
import { formatters } from '@/utils/formatters';

// ============================================
// COMPONENT PROPS - ✅ REMOVIDA PAGINACIÓN
// ============================================
export interface CompaniesTableProps {
  companies: CompanyDTO[];
  isLoading: boolean;
  totalCompanies: number;
  
  onCompanyClick: (company: CompanyDTO) => void;
  onCompanyEdit?: (company: CompanyDTO) => void;
  onCompanyDelete?: (company: CompanyDTO) => void;
  
  selectedCompanyIds: Set<number>;
  onSelectAll: () => void;
  onDeselectAll: () => void;

  className?: string;
  stickyHeader?: boolean;
  mobileView?: 'cards' | 'stack' | 'table';
}

// ============================================
// COMPONENTES INTERNOS
// ============================================
const CompanyTypeBadge: React.FC<{ type: CompanyType; className?: string; }> = ({ type, className }) => {
  const typeConfig = {
    COMPANY: { variant: 'info' as const, icon: Building2, tooltip: 'Empresa comercial' },
    FAMILY: { variant: 'success' as const, icon: Users, tooltip: 'Grupo familiar' },
    INSTITUTION: { variant: 'portal' as const, icon: Building, tooltip: 'Institución' },
    OTHER: { variant: 'secondary' as const, icon: Briefcase, tooltip: 'Otro tipo' }
  };
  const config = typeConfig[type] || typeConfig.OTHER;
  const IconComponent = config.icon;
  return (
    <Badge variant={config.variant} size="sm" title={config.tooltip} className={className} icon={<IconComponent />}>
      <span className="hidden sm:inline">{COMPANY_TYPE_LABELS[type]}</span>
    </Badge>
  );
};

const CompanySizeBadge: React.FC<{ size?: CompanySize; className?: string; }> = ({ size, className }) => {
  if (!size) return <span className="text-app-gray-500 text-xs italic">Sin especificar</span>;
  
  const sizeConfig = {
    SMALL: { variant: 'secondary' as const, tooltip: '1-10 empleados' },
    MEDIUM: { variant: 'info' as const, tooltip: '11-50 empleados' },
    LARGE: { variant: 'warning' as const, tooltip: '51-200 empleados' },
    ENTERPRISE: { variant: 'success' as const, tooltip: '200+ empleados' }
  };
  const config = sizeConfig[size];
  return (
    <Badge variant={config.variant} size="sm" title={config.tooltip} className={className}>
      {COMPANY_SIZE_LABELS[size]}
    </Badge>
  );
};

const CompanyAvatar: React.FC<{ company: CompanyDTO; size?: 'sm' | 'md' | 'lg'; }> = ({ 
  company, 
  size = 'md' 
}) => {
  const iconName = getSuggestedIcon(company);
  const IconComponent = iconName === 'building' ? Building2 : 
                       iconName === 'users' ? Users :
                       iconName === 'bank' ? Building : Briefcase;
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className={cn(
      'rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0',
      sizeClasses[size]
    )}>
      <IconComponent className={cn('text-white', iconSizes[size])} />
    </div>
  );
};

const CompanyContactInfo: React.FC<{ company: CompanyDTO; }> = ({ company }) => {
  const hasContact = hasCompleteContactInfo(company);
  const preferredMethod = getPreferredContactMethod(company);
  
  if (!hasContact) {
    return <span className="text-app-gray-500 italic text-xs">Sin contacto</span>;
  }

  return (
    <div className="flex items-center space-x-1 text-xs text-app-gray-400">
      {preferredMethod === 'email' && company.email && (
        <div className="flex items-center">
          <Mail className="h-3 w-3 mr-1" />
          <span className="truncate max-w-[120px]">{company.email}</span>
        </div>
      )}
      {preferredMethod === 'phone' && company.phone && (
        <div className="flex items-center">
          <Phone className="h-3 w-3 mr-1" />
          <span>{formatters.phone(company.phone)}</span>
        </div>
      )}
      {preferredMethod === 'website' && company.website && (
        <div className="flex items-center">
          <Globe className="h-3 w-3 mr-1" />
          <span className="truncate max-w-[120px]">Web</span>
        </div>
      )}
    </div>
  );
};

const CompanyActionsDropdown: React.FC<{ 
  company: CompanyDTO; 
  onView?: () => void; 
  onEdit?: () => void; 
  onDelete?: () => void; 
  isUpdating?: boolean; 
  isDeleting?: boolean; 
}> = ({ company, onView, onEdit, onDelete, isUpdating = false, isDeleting = false }) => {
  const items = [
    { label: 'Ver detalles', icon: Eye, onClick: onView, disabled: false },
    { label: 'Editar', icon: Edit3, onClick: onEdit, disabled: isUpdating || isDeleting },
    { type: 'separator' as const },
    { label: 'Eliminar', icon: Trash2, onClick: onDelete, disabled: isUpdating || isDeleting, destructive: true }
  ];

  return (
    <Dropdown 
      trigger={
        <IconButton 
          variant="ghost" 
          size="icon-sm" 
          disabled={isUpdating || isDeleting} 
          aria-label={`Acciones para ${getDisplayName(company)}`}
        >
          {(isUpdating || isDeleting) ? (
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
const CompaniesTable: React.FC<CompaniesTableProps> = ({
  companies,
  isLoading,
  totalCompanies,
  onCompanyClick,
  onCompanyEdit,
  onCompanyDelete,
  selectedCompanyIds,
  onSelectAll,
  onDeselectAll,
  className,
  stickyHeader = false,
  mobileView = 'cards',
}) => {
  const { updating, deleting } = useCompanyOperations();
  const { selectCompany } = useBulkCompanyOperations();
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnId: string, direction: 'asc' | 'desc' | null) => {
    setSortColumn(direction ? columnId : 'name');
    setSortDirection(direction || 'asc');
  };

  const columns: Column<CompanyDTO>[] = useMemo(() => [
    { 
      id: 'company', 
      header: 'Empresa', 
      accessorKey: 'name', 
      sortable: true, 
      width: '300px', 
      cell: ({ row }) => ( 
        <div className="flex items-center space-x-3"> 
          <CompanyAvatar company={row} size="sm" /> 
          <div className="min-w-0 flex-1"> 
            <div className="font-medium text-app-gray-100 truncate flex items-center gap-2">
              {getDisplayName(row)}
              {isLargeCompany(row) && (
                <Tooltip content="Empresa grande">
                  <Star className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                </Tooltip>
              )}
            </div> 
            <CompanyContactInfo company={row} />
          </div> 
        </div> 
      ), 
      mobileLabel: 'Empresa', 
    },
    { 
      id: 'type', 
      header: 'Tipo', 
      accessorKey: 'type', 
      sortable: true, 
      width: '120px', 
      hideOnMobile: true, 
      cell: ({ row }) => ( 
        <CompanyTypeBadge type={row.type} /> 
      ), 
    },
    { 
      id: 'industry', 
      header: 'Industria', 
      accessorKey: 'industry', 
      sortable: true, 
      width: '140px', 
      hideOnMobile: true, 
      cell: ({ row }) => ( 
        <div className="text-sm text-app-gray-200"> 
          {row.industry ? ( 
            <span className="truncate">{row.industry}</span> 
          ) : ( 
            <span className="text-app-gray-500 italic">Sin especificar</span> 
          )} 
        </div> 
      ), 
    },
    { 
      id: 'size', 
      header: 'Tamaño', 
      accessorKey: 'size', 
      sortable: true, 
      width: '120px', 
      hideOnMobile: true, 
      align: 'center', 
      cell: ({ row }) => ( 
        <CompanySizeBadge size={row.size} /> 
      ), 
    },
    { 
      id: 'contacts', 
      header: 'Contactos', 
      accessorKey: 'contactCount', 
      sortable: true, 
      width: '100px', 
      hideOnMobile: true, 
      align: 'center', 
      cell: ({ row }) => ( 
        <div className="flex justify-center"> 
          {row.contactCount !== undefined ? (
            <Badge variant="info" size="sm" icon={<Users />}>
              {row.contactCount}
            </Badge>
          ) : (
            <span className="text-app-gray-500 text-xs">-</span>
          )}
        </div> 
      ), 
    },
    { 
      id: 'revenue', 
      header: 'Revenue', 
      accessorKey: 'annualRevenue', 
      sortable: true, 
      width: '120px', 
      hideOnMobile: true, 
      align: 'right',
      cell: ({ row }) => ( 
        <div className="text-sm text-app-gray-200 text-right"> 
          {row.annualRevenue ? ( 
            <div className="flex items-center justify-end">
              <TrendingUp className="h-3 w-3 mr-1 text-green-400 flex-shrink-0" />
              <span>{formatters.currency(row.annualRevenue)}</span>
            </div>
          ) : ( 
            <span className="text-app-gray-500 italic">-</span> 
          )} 
        </div> 
      ), 
    },
    { 
      id: 'lastActivity', 
      header: 'Última Actividad', 
      accessorKey: 'updatedAt', 
      sortable: true, 
      width: '140px', 
      hideOnMobile: true, 
      cell: ({ row }) => ( 
        <div className="text-sm text-app-gray-400"> 
          {row.updatedAt ? ( 
            <div className="flex items-center"> 
              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" /> 
              {formatters.relativeDate(row.updatedAt)} 
            </div> 
          ) : ( 
            <span className="italic">-</span> 
          )} 
        </div> 
      ), 
    },
  ], []);

  if (isLoading && companies.length === 0) {
    return (
      <div className={cn('bg-app-dark-800 border border-app-dark-600 rounded-lg', className)}>
        <LoadingSpinner
          size="lg"
          label="Cargando empresas..."
          className="py-12"
        />
      </div>
    );
  }

  if (!isLoading && companies.length === 0) {
    return (
      <div className={cn('bg-app-dark-800 border border-app-dark-600 rounded-lg', className)}>
        <EmptyState
          preset="no-companies"
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
              {selectedCompanyIds.size > 0 ? (
                <span className="font-medium">
                  {selectedCompanyIds.size} empresa{selectedCompanyIds.size !== 1 ? 's' : ''} seleccionada{selectedCompanyIds.size !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>
                  {totalCompanies.toLocaleString()} empresa{totalCompanies !== 1 ? 's' : ''} total{totalCompanies !== 1 ? 'es' : ''}
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
          {selectedCompanyIds.size > 0 && (
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
        data={companies}
        columns={columns}
        enableSelection={true}
        selectedRows={selectedCompanyIds}
        onRowSelect={(rowId) => selectCompany(rowId as number)}
        onSelectAll={companies.length > 0 && companies.every(c => selectedCompanyIds.has(c.id)) ? onDeselectAll : onSelectAll}
        getRowId={(row) => row.id}
        enableSorting={true}
        sortBy={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onRowClick={onCompanyClick}
        rowActions={(row) => (
          <CompanyActionsDropdown
            company={row}
            onView={() => onCompanyClick(row)}
            onEdit={() => onCompanyEdit?.(row)}
            onDelete={() => onCompanyDelete?.(row)}
            isUpdating={updating.has(row.id)}
            isDeleting={deleting.has(row.id)}
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

export default CompaniesTable;