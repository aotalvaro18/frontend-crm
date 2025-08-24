// src/components/companies/CompaniesBulkActions.tsx
// ✅ COMPANIES BULK ACTIONS - REFACTORIZADO ENTERPRISE
// Integración completa con hooks, components UI y types exactos

import React, { useState, useCallback } from 'react';
import { 
  Trash2, 
  Download, 
  Building2, 
  X,
  Users,
  Edit3,
  AlertTriangle,
  FileDown,
  Building,
  Briefcase
} from 'lucide-react';

// ============================================
// UI COMPONENTS - REUTILIZACIÓN TOTAL
// ============================================

import { Button } from '@/components/ui/Button';
import { CountBadge } from '@/components/ui/Badge';
import Dropdown from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ===========================================
// TYPES EXACTOS - REUTILIZACIÓN DE ARQUITECTURA
// ============================================

import type { CompanyType, CompanySize } from '@/types/company.types';

// ============================================
// UTILS
// ============================================

import { cn } from '@/utils/cn';

// ============================================
// COMPONENT PROPS - ALIGNED CON HOOKS
// ============================================

export interface CompaniesBulkActionsProps {
  // Selection state (desde useBulkCompanyOperations hook)
  selectedCount: number;
  onDeselectAll: () => void;
  
  // Bulk operations (desde useBulkCompanyOperations hook)
  onBulkDelete: () => Promise<void>;
  onBulkTypeUpdate: (type: CompanyType) => Promise<void>;
  isLoading?: boolean;
  
  // Optional actions
  onBulkExport?: (format: 'csv' | 'excel') => Promise<void>;
  onBulkSizeUpdate?: (size: CompanySize) => Promise<void>;
  
  // Styling
  className?: string;
  variant?: 'default' | 'compact' | 'floating';
}

// ============================================
// BULK ACTION CONFIGURATIONS
// ============================================

const typeUpdateOptions = [
  {
    id: 'set-company',
    value: 'COMPANY' as CompanyType,
    label: 'Marcar como Empresa',
    description: 'Empresas comerciales',
    icon: Building2,
    variant: 'info' as const,
  },
  {
    id: 'set-family', 
    value: 'FAMILY' as CompanyType,
    label: 'Marcar como Familia',
    description: 'Grupos familiares',
    icon: Users,
    variant: 'success' as const,
  },
  {
    id: 'set-institution',
    value: 'INSTITUTION' as CompanyType,
    label: 'Marcar como Institución',
    description: 'Instituciones y organizaciones',
    icon: Building,
    variant: 'portal' as const,
  },
  {
    id: 'set-other',
    value: 'OTHER' as CompanyType,
    label: 'Marcar como Otro',
    description: 'Otro tipo de organización',
    icon: Briefcase,
    variant: 'secondary' as const,
  },
];

const sizeUpdateOptions = [
  {
    id: 'set-small',
    value: 'SMALL' as CompanySize,
    label: 'Pequeña (1-10)',
    description: '1-10 empleados',
    icon: Edit3,
    variant: 'secondary' as const,
  },
  {
    id: 'set-medium',
    value: 'MEDIUM' as CompanySize,
    label: 'Mediana (11-50)',
    description: '11-50 empleados',
    icon: Edit3,
    variant: 'info' as const,
  },
  {
    id: 'set-large',
    value: 'LARGE' as CompanySize,
    label: 'Grande (51-200)',
    description: '51-200 empleados',
    icon: Edit3,
    variant: 'warning' as const,
  },
  {
    id: 'set-enterprise',
    value: 'ENTERPRISE' as CompanySize,
    label: 'Corporativa (200+)',
    description: '200+ empleados',
    icon: Edit3,
    variant: 'success' as const,
  },
];

const exportOptions = [
  {
    id: 'export-csv',
    format: 'csv' as const,
    label: 'Exportar CSV',
    description: 'Archivo separado por comas',
    icon: FileDown,
  },
  {
    id: 'export-excel',
    format: 'excel' as const,
    label: 'Exportar Excel',
    description: 'Archivo .xlsx',
    icon: FileDown,
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

const CompaniesBulkActions: React.FC<CompaniesBulkActionsProps> = ({
  selectedCount,
  onDeselectAll,
  onBulkDelete,
  onBulkTypeUpdate,
  isLoading = false,
  onBulkExport,
  onBulkSizeUpdate,
  className,
  variant = 'default',
}) => {
  // ============================================
  // LOCAL STATE
  // ============================================

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [typeUpdateLoading, setTypeUpdateLoading] = useState(false);
  const [sizeUpdateLoading, setSizeUpdateLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // ============================================
  // HANDLERS
  // ============================================

  const handleBulkDelete = useCallback(async () => {
    setDeleteLoading(true);
    try {
      await onBulkDelete();
      setShowDeleteConfirm(false);
    } catch (error) {
      // Error ya manejado por el hook
    } finally {
      setDeleteLoading(false);
    }
  }, [onBulkDelete]);

  const handleTypeUpdate = useCallback(async (type: CompanyType) => {
    setTypeUpdateLoading(true);
    try {
      await onBulkTypeUpdate(type);
    } catch (error) {
      // Error ya manejado por el hook
    } finally {
      setTypeUpdateLoading(false);
    }
  }, [onBulkTypeUpdate]);

  const handleSizeUpdate = useCallback(async (size: CompanySize) => {
    if (!onBulkSizeUpdate) return;
    
    setSizeUpdateLoading(true);
    try {
      await onBulkSizeUpdate(size);
    } catch (error) {
      // Error ya manejado por el hook
    } finally {
      setSizeUpdateLoading(false);
    }
  }, [onBulkSizeUpdate]);

  const handleExport = useCallback(async (format: 'csv' | 'excel') => {
    if (!onBulkExport) return;
    
    setExportLoading(true);
    try {
      await onBulkExport(format);
    } catch (error) {
      // Error ya manejado por el hook
    } finally {
      setExportLoading(false);
    }
  }, [onBulkExport]);

  // ============================================
  // DROPDOWN ITEMS
  // ============================================

  const typeDropdownItems = typeUpdateOptions.map(option => ({
    ...option,
    onClick: () => handleTypeUpdate(option.value),
    disabled: typeUpdateLoading || isLoading,
  }));

  const sizeDropdownItems = onBulkSizeUpdate ? sizeUpdateOptions.map(option => ({
    ...option,
    onClick: () => handleSizeUpdate(option.value),
    disabled: sizeUpdateLoading || isLoading,
  })) : [];

  const exportDropdownItems = exportOptions.map(option => ({
    ...option,
    onClick: () => handleExport(option.format),
    disabled: exportLoading || isLoading,
  }));

  // ============================================
  // VARIANT STYLES
  // ============================================

  const variantStyles = {
    default: {
      container: 'bg-app-accent-500/10 border-app-accent-500/30 border',
      text: 'text-app-accent-200',
      badge: 'text-app-accent-400',
    },
    compact: {
      container: 'bg-app-dark-700 border-app-dark-600 border',
      text: 'text-app-gray-200',
      badge: 'text-app-gray-300',
    },
    floating: {
      container: 'bg-app-dark-800 border-app-dark-600 border shadow-lg',
      text: 'text-app-gray-100',
      badge: 'text-app-accent-400',
    },
  };

  const styles = variantStyles[variant];

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderSelectionInfo = () => (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4 text-app-gray-400" />
        <span className={cn('text-sm font-medium', styles.text)}>
          <CountBadge 
            count={selectedCount} 
            variant="info" 
            className="mr-2"
          />
          {selectedCount === 1 ? 'empresa seleccionada' : 'empresas seleccionadas'}
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onDeselectAll}
        disabled={isLoading}
        leftIcon={<X className="h-3 w-3" />}
        className="text-app-gray-400 hover:text-app-gray-200"
      >
        <span className="hidden sm:inline">Deseleccionar</span>
      </Button>
    </div>
  );

  const renderActions = () => (
    <div className="flex items-center gap-2">
      {/* Export Actions */}
      {onBulkExport && (
        <Dropdown
          trigger={
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || exportLoading}
              leftIcon={
                exportLoading ? 
                  <LoadingSpinner size="xs" /> : 
                  <Download className="h-4 w-4" />
              }
              className="hidden sm:flex"
            >
              Exportar
            </Button>
          }
          items={exportDropdownItems}
          align="end"
          size="sm"
        />
      )}

      {/* Size Update */}
      {onBulkSizeUpdate && (
        <Dropdown
          trigger={
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || sizeUpdateLoading}
              leftIcon={
                sizeUpdateLoading ? 
                  <LoadingSpinner size="xs" /> : 
                  <Edit3 className="h-4 w-4" />
              }
              className="hidden md:flex"
            >
              Tamaño
            </Button>
          }
          items={sizeDropdownItems}
          align="end"
          size="sm"
        />
      )}

      {/* Type Update */}
      <Dropdown
        trigger={
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || typeUpdateLoading}
            leftIcon={
              typeUpdateLoading ? 
                <LoadingSpinner size="xs" /> : 
                <Building2 className="h-4 w-4" />
            }
          >
            <span className="hidden sm:inline">Tipo</span>
          </Button>
        }
        items={typeDropdownItems}
        align="end"
        size="sm"
      />

      {/* Delete Action */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDeleteConfirm(true)}
        disabled={isLoading || deleteLoading}
        leftIcon={<Trash2 className="h-4 w-4" />}
        className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
      >
        <span className="hidden sm:inline">Eliminar</span>
      </Button>
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <>
      <div className={cn(
        'rounded-lg p-3 sm:p-4 transition-all duration-200',
        styles.container,
        variant === 'floating' && 'fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-4xl',
        className
      )}>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          {renderSelectionInfo()}
          {renderActions()}
        </div>

        {/* Loading overlay para operaciones bulk */}
        {isLoading && (
          <div className="absolute inset-0 bg-app-dark-900/50 rounded-lg flex items-center justify-center">
            <div className="flex items-center space-x-2 text-app-gray-200">
              <LoadingSpinner size="sm" />
              <span className="text-sm">Procesando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirmar eliminación"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-app-gray-300">
                ¿Estás seguro de que quieres eliminar{' '}
                <span className="font-semibold text-app-gray-100">
                  {selectedCount} {selectedCount === 1 ? 'empresa' : 'empresas'}
                </span>
                ?
              </p>
              <p className="text-sm text-app-gray-400 mt-2">
                Esta acción no se puede deshacer. Las empresas serán eliminadas permanentemente del sistema.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-app-dark-600">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={deleteLoading}
              leftIcon={deleteLoading ? <LoadingSpinner size="xs" /> : <Trash2 className="h-4 w-4" />}
            >
              {deleteLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ============================================
// SPECIALIZED VARIANTS
// ============================================

/**
 * Compact Bulk Actions - Para espacios reducidos
 */
export const CompactCompaniesBulkActions: React.FC<Omit<CompaniesBulkActionsProps, 'variant'>> = (props) => (
  <CompaniesBulkActions {...props} variant="compact" />
);

/**
 * Floating Bulk Actions - Para selecciones persistentes
 */
export const FloatingCompaniesBulkActions: React.FC<Omit<CompaniesBulkActionsProps, 'variant'>> = (props) => (
  <CompaniesBulkActions {...props} variant="floating" />
);

export { CompaniesBulkActions };
export default CompaniesBulkActions;