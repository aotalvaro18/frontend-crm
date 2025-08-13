// src/components/contacts/ContactsBulkActions.tsx
// ✅ CONTACTS BULK ACTIONS - REFACTORIZADO ENTERPRISE
// Integración completa con hooks, components UI y types exactos

import React, { useState, useCallback } from 'react';
import { 
  Trash2, 
  Download, 
  UserCheck, 
  X,
  Users,
  Edit3,
  Archive,
  AlertTriangle,
  FileDown,
  Send
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

import type { ContactStatus } from '@/types/contact.types';

// ============================================
// UTILS
// ============================================

import { cn } from '@/utils/cn';

// ============================================
// COMPONENT PROPS - ALIGNED CON HOOKS
// ============================================

export interface ContactsBulkActionsProps {
  // Selection state (desde useBulkOperations hook)
  selectedCount: number;
  onDeselectAll: () => void;
  
  // Bulk operations (desde useBulkOperations hook)
  onBulkDelete: () => Promise<void>;
  onBulkStatusUpdate: (status: ContactStatus) => Promise<void>;
  isLoading?: boolean;
  
  // Optional actions
  onBulkExport?: (format: 'csv' | 'excel') => Promise<void>;
  onBulkSendEmail?: () => Promise<void>;
  
  // Styling
  className?: string;
  variant?: 'default' | 'compact' | 'floating';
}

// ============================================
// BULK ACTION CONFIGURATIONS
// ============================================

const statusUpdateOptions = [
  {
    id: 'set-active',
    value: 'ACTIVE' as ContactStatus,
    label: 'Marcar como Activo',
    description: 'Contactos activos en el sistema',
    icon: UserCheck,
    variant: 'success' as const,
  },
  {
    id: 'set-inactive', 
    value: 'INACTIVE' as ContactStatus,
    label: 'Marcar como Inactivo',
    description: 'Contactos temporalmente inactivos',
    icon: Users,
    variant: 'secondary' as const,
  },
  {
    type: 'separator' as const,
  },
  {
    id: 'set-prospect',
    value: 'PROSPECT' as ContactStatus,
    label: 'Marcar como Prospecto',
    description: 'Prospectos potenciales',
    icon: Edit3,
    variant: 'info' as const,
  },
  {
    id: 'set-lead',
    value: 'LEAD' as ContactStatus,
    label: 'Marcar como Lead',
    description: 'Leads cualificados',
    icon: Edit3,
    variant: 'info' as const,
  },
  {
    type: 'separator' as const,
  },
  {
    id: 'set-archived',
    value: 'ARCHIVED' as ContactStatus,
    label: 'Archivar Contactos',
    description: 'Mover a archivo',
    icon: Archive,
    variant: 'warning' as const,
  },
  {
    id: 'set-do-not-contact',
    value: 'DO_NOT_CONTACT' as ContactStatus,
    label: 'No Contactar',
    description: 'Marcar como no contactar',
    icon: AlertTriangle,
    variant: 'destructive' as const,
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

const ContactsBulkActions: React.FC<ContactsBulkActionsProps> = ({
  selectedCount,
  onDeselectAll,
  onBulkDelete,
  onBulkStatusUpdate,
  isLoading = false,
  onBulkExport,
  onBulkSendEmail,
  className,
  variant = 'default',
}) => {
  // ============================================
  // LOCAL STATE
  // ============================================

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
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

  const handleStatusUpdate = useCallback(async (status: ContactStatus) => {
    setStatusUpdateLoading(true);
    try {
      await onBulkStatusUpdate(status);
    } catch (error) {
      // Error ya manejado por el hook
    } finally {
      setStatusUpdateLoading(false);
    }
  }, [onBulkStatusUpdate]);

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

  const handleSendEmail = useCallback(async () => {
    if (!onBulkSendEmail) return;
    
    try {
      await onBulkSendEmail();
    } catch (error) {
      // Error ya manejado por el hook
    }
  }, [onBulkSendEmail]);

  // ============================================
  // DROPDOWN ITEMS
  // ============================================

  const statusDropdownItems = statusUpdateOptions.map(option => {
    if ('type' in option) return option;
    
    return {
      ...option,
      onClick: () => handleStatusUpdate(option.value),
      disabled: statusUpdateLoading || isLoading,
    };
  });

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
        <Users className="h-4 w-4 text-app-gray-400" />
        <span className={cn('text-sm font-medium', styles.text)}>
          <CountBadge 
            count={selectedCount} 
            variant="info" 
            className="mr-2"
          />
          {selectedCount === 1 ? 'contacto seleccionado' : 'contactos seleccionados'}
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

      {/* Email Action */}
      {onBulkSendEmail && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendEmail}
          disabled={isLoading}
          leftIcon={<Send className="h-4 w-4" />}
          className="hidden md:flex"
        >
          Email
        </Button>
      )}

      {/* Status Update */}
      <Dropdown
        trigger={
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || statusUpdateLoading}
            leftIcon={
              statusUpdateLoading ? 
                <LoadingSpinner size="xs" /> : 
                <UserCheck className="h-4 w-4" />
            }
          >
            <span className="hidden sm:inline">Estado</span>
          </Button>
        }
        items={statusDropdownItems}
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
                  {selectedCount} {selectedCount === 1 ? 'contacto' : 'contactos'}
                </span>
                ?
              </p>
              <p className="text-sm text-app-gray-400 mt-2">
                Esta acción no se puede deshacer. Los contactos serán eliminados permanentemente del sistema.
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
export const CompactBulkActions: React.FC<Omit<ContactsBulkActionsProps, 'variant'>> = (props) => (
  <ContactsBulkActions {...props} variant="compact" />
);

/**
 * Floating Bulk Actions - Para selecciones persistentes
 */
export const FloatingBulkActions: React.FC<Omit<ContactsBulkActionsProps, 'variant'>> = (props) => (
  <ContactsBulkActions {...props} variant="floating" />
);

export default ContactsBulkActions;