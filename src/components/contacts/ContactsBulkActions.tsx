// src/components/contacts/ContactsBulkActions.tsx
// Bulk actions component especializado para contactos

import React, { useState } from 'react';
import { Trash2, Download, Mail, UserCheck, X, Archive } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================
// TYPES
// ============================================

interface ContactsBulkActionsProps {
  selectedCount: number;
  selectedIds: Set<number>;
  loading: boolean;
  onBulkDelete?: () => void;
  onBulkExport?: (format: 'csv' | 'excel') => void;
  onBulkUpdateStatus?: (status: string) => void;
  onBulkSendEmail?: () => void;
  onDeselectAll?: () => void;
}

// ============================================
// CONFIRMATION MODAL COMPONENT
// ============================================

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  loading = false,
  variant = 'info'
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onCancel}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-app-dark-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-app-dark-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-app-gray-100" id="modal-title">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-app-gray-400">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-app-dark-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              onClick={onConfirm}
              disabled={loading}
              className={`w-full justify-center sm:ml-3 sm:w-auto ${variantStyles[variant]}`}
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {confirmText}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="mt-3 w-full justify-center sm:mt-0 sm:w-auto"
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const ContactsBulkActions: React.FC<ContactsBulkActionsProps> = ({
  selectedCount,
  selectedIds,
  loading,
  onBulkDelete,
  onBulkExport,
  onBulkUpdateStatus,
  onBulkSendEmail,
  onDeselectAll
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  const handleBulkDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onBulkDelete?.();
    setShowDeleteConfirm(false);
  };

  const handleStatusUpdate = (status: string) => {
    onBulkUpdateStatus?.(status);
    setShowStatusUpdate(false);
  };

  return (
    <>
      <div className="bg-primary-900/20 border border-primary-500/30 rounded-lg p-3 sm:p-4">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-primary-200">
              {selectedCount} {selectedCount === 1 ? 'contacto seleccionado' : 'contactos seleccionados'}
            </span>
            {onDeselectAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeselectAll}
                className="text-primary-300 hover:text-primary-200"
              >
                <X className="h-4 w-4 mr-1" />
                Deseleccionar
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Export Actions */}
            {onBulkExport && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkExport('csv')}
                  disabled={loading}
                  className="text-app-gray-300 border-app-dark-600 hover:bg-app-dark-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkExport('excel')}
                  disabled={loading}
                  className="text-app-gray-300 border-app-dark-600 hover:bg-app-dark-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </>
            )}

            {/* Email Action */}
            {onBulkSendEmail && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkSendEmail}
                disabled={loading}
                className="text-app-gray-300 border-app-dark-600 hover:bg-app-dark-700"
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            )}

            {/* Status Update */}
            {onBulkUpdateStatus && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStatusUpdate(!showStatusUpdate)}
                  disabled={loading}
                  className="text-app-gray-300 border-app-dark-600 hover:bg-app-dark-700"
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Estado
                </Button>
                
                {showStatusUpdate && (
                  <div className="absolute right-0 mt-2 w-48 bg-app-dark-800 border border-app-dark-600 rounded-md shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleStatusUpdate('ACTIVE')}
                        className="block w-full text-left px-4 py-2 text-sm text-app-gray-300 hover:bg-app-dark-700"
                      >
                        Marcar como Activo
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('INACTIVE')}
                        className="block w-full text-left px-4 py-2 text-sm text-app-gray-300 hover:bg-app-dark-700"
                      >
                        Marcar como Inactivo
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('ARCHIVED')}
                        className="block w-full text-left px-4 py-2 text-sm text-app-gray-300 hover:bg-app-dark-700"
                      >
                        Archivar
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('DO_NOT_CONTACT')}
                        className="block w-full text-left px-4 py-2 text-sm text-app-gray-300 hover:bg-app-dark-700"
                      >
                        No Contactar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delete Action */}
            {onBulkDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={loading}
                className="text-red-400 border-red-500/30 hover:bg-red-900/20"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-1" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que quieres eliminar ${selectedCount} ${selectedCount === 1 ? 'contacto' : 'contactos'}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={loading}
        variant="danger"
      />
    </>
  );
};

export default ContactsBulkActions;