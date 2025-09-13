// src/components/deals/DealsBulkActions.tsx
// ✅ DEALS BULK ACTIONS - Acciones masivas para oportunidades seleccionadas
// Mobile-first + Multi-select + Confirmaciones + Feedback

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Trash2, Edit, CheckCircle, X, MoreHorizontal, FileDown, Mail, Users, Tag
} from 'lucide-react';

// ============================================
// HOOKS & SERVICES
// ============================================
import { useBulkDealOperations } from '@/hooks/useDeals';
import { useQuery } from '@tanstack/react-query';
import { pipelineApi } from '@/services/api/pipelineApi';
import { useActiveUsers } from '@/hooks/useUsers';

// ============================================
// UI COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Dropdown from '@/components/ui/Dropdown';

// ============================================
// TYPES & UTILS
// ============================================
import type { DealPriority, DealType } from '@/types/deal.types';
import { DEAL_PRIORITY_LABELS, DEAL_TYPE_LABELS } from '@/types/deal.types';
import type { UserDTO } from '@/types/user.types'; // ✅ CORRECCIÓN 1: Importar UserDTO
import { cn } from '@/utils/cn';

// ============================================
// TYPES
// ============================================

interface DealsBulkActionsProps {
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const DealsBulkActions: React.FC<DealsBulkActionsProps> = ({ className }) => {
    // ============================================
    // HOOKS
    // ============================================
    const {
    selectionCount,
    hasSelection,
    deselectAll, // ✅ CORRECCIÓN 3: Nombre correcto del hook
    bulkUpdateDeals,
    bulkDeleteDeals,
    bulkOperationLoading
  } = useBulkDealOperations();

  // ✅ RECOMENDACIÓN 1: Cargar datos para los nuevos selects
  const { data: pipelines } = useQuery({
    queryKey: ['pipelines', 'active'],
    queryFn: () => pipelineApi.searchPipelines({ isActive: true }, { page: 0, size: 50, sort: ['name,asc'] }),
    select: (data) => data.content,
  });

  const { data: users, isLoading: isLoadingUsers } = useActiveUsers();

  // ============================================
  // STATE
  // ============================================
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false); // ✅ RECOMENDACIÓN 3
  
  // ✅ RECOMENDACIÓN 1: Expandir bulkUpdateData con nuevos campos
  const [bulkUpdateData, setBulkUpdateData] = useState<{
    priority?: DealPriority;
    type?: DealType;
    stageId?: number;
    ownerCognitoSub?: string;
  }>({});

  // ============================================
  // OPTIONS PARA BULK UPDATES
  // ============================================
  const priorityOptions = Object.entries(DEAL_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const typeOptions = Object.entries(DEAL_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  // ✅ RECOMENDACIÓN 1: Opciones para stages y usuarios
  const stageOptions = pipelines?.flatMap(pipeline => 
    pipeline.stages?.map(stage => ({
      value: stage.id.toString(),
      label: `${pipeline.name}: ${stage.name}`,
      description: stage.description ?? undefined
    })) || []
  ) || [];

   const userOptions = users?.map((user: UserDTO) => ({
    value: user.cognitoSub,
    // ✅ CORRECCIÓN: Usamos 'name' que sí existe en el tipo 'User'.
    // También se puede usar el helper 'getDisplayName' para más robustez.
    label: user.displayName || user.name || user.email, 
    description: user.email
   })) || [];

  // ✅ RECOMENDACIÓN 3: Opciones para el menú "Más"
  const moreActionsOptions = [
    {
      label: 'Exportar seleccionados',
      icon: FileDown,
      onClick: () => handleBulkExport(),
    },
    {
      label: 'Enviar email masivo',
      icon: Mail,
      onClick: () => handleBulkEmail(),
    },
    {
      label: 'Asignar etiquetas',
      icon: Tag,
      onClick: () => handleBulkTags(),
    },
    {
      label: 'Transferir propiedad',
      icon: Users,
      onClick: () => handleBulkTransfer(),
    },
  ];

  // ============================================
  // HANDLERS
  // ============================================
  const handleDeselectAll = useCallback(() => {
    deselectAll();
  }, [deselectAll]);

  const handleBulkUpdate = useCallback(async () => {
    if (!hasSelection || Object.keys(bulkUpdateData).length === 0) return;

    try {
      await bulkUpdateDeals(bulkUpdateData);
      setShowBulkUpdate(false);
      setBulkUpdateData({});
    } catch (error) {
      console.error('Bulk update error:', error);
    }
  }, [hasSelection, bulkUpdateData, bulkUpdateDeals]);

  const handleBulkDelete = useCallback(async () => {
    if (!hasSelection) return;

    try {
      await bulkDeleteDeals();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  }, [hasSelection, bulkDeleteDeals]);

  const handleUpdateDataChange = useCallback((field: string, value: any) => {
    setBulkUpdateData(prev => ({
      ...prev,
      [field]: value || undefined,
    }));
  }, []);

  // ✅ RECOMENDACIÓN 3: Handlers para acciones adicionales
  const handleBulkExport = useCallback(() => {
    console.log('Exportar seleccionados');
    setShowMoreActions(false);
    // TODO: Implementar lógica de exportación
  }, []);

  const handleBulkEmail = useCallback(() => {
    console.log('Enviar email masivo');
    setShowMoreActions(false);
    // TODO: Implementar lógica de email masivo
  }, []);

  const handleBulkTags = useCallback(() => {
    console.log('Asignar etiquetas');
    setShowMoreActions(false);
    // TODO: Implementar lógica de etiquetas
  }, []);

  const handleBulkTransfer = useCallback(() => {
    console.log('Transferir propiedad');
    setShowMoreActions(false);
    // TODO: Implementar lógica de transferencia
  }, []);

  // ============================================
  // RENDER HELPERS
  // ============================================
  if (!hasSelection) {
    return null; // No mostrar el componente si no hay selección
  }

  // ✅ RECOMENDACIÓN 2: Modal usando createPortal
  const modalContent = showBulkUpdate && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-app-dark-800 rounded-lg shadow-xl w-full max-w-md border border-app-dark-600">
        <div className="flex items-center justify-between p-6 border-b border-app-dark-600">
          <h3 className="text-lg font-semibold text-white">
            Editar {selectionCount} oportunidades
          </h3>
          <button
            onClick={() => setShowBulkUpdate(false)}
            className="p-2 hover:bg-app-dark-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-app-gray-400" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-app-gray-400 mb-4">
            Los campos que modifiques se aplicarán a todas las oportunidades seleccionadas.
            Deja en blanco los campos que no quieras cambiar.
          </p>

          {/* Prioridad */}
          <Select
            label="Prioridad"
            options={priorityOptions}
            value={bulkUpdateData.priority || ''}
            onValueChange={(value) => handleUpdateDataChange('priority', value)}
            placeholder="Sin cambios"
            clearable
          />

          {/* Tipo */}
          <Select
            label="Tipo de oportunidad"
            options={typeOptions}
            value={bulkUpdateData.type || ''}
            onValueChange={(value) => handleUpdateDataChange('type', value)}
            placeholder="Sin cambios"
            clearable
          />

          {/* ✅ RECOMENDACIÓN 1: Nuevo campo - Etapa */}
          <Select
            label="Etapa del pipeline"
            options={stageOptions}
            value={bulkUpdateData.stageId?.toString() || ''}
            onValueChange={(value) => handleUpdateDataChange('stageId', value ? Number(value) : undefined)}
            placeholder="Sin cambios"
            clearable
          />

          {/* ✅ RECOMENDACIÓN 1: Nuevo campo - Propietario */}
          <Select
            label="Propietario"
            options={userOptions}
            value={bulkUpdateData.ownerCognitoSub || ''}
            onValueChange={(value) => handleUpdateDataChange('ownerCognitoSub', value)}
            placeholder="Sin cambios"
            clearable
          />
        </div>
        
        <div className="flex justify-end space-x-3 p-6 border-t border-app-dark-600">
          <Button
            variant="ghost"
            onClick={() => setShowBulkUpdate(false)}
            disabled={bulkOperationLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleBulkUpdate}
            disabled={bulkOperationLoading || Object.keys(bulkUpdateData).length === 0}
            loading={bulkOperationLoading}
          >
            Aplicar Cambios
          </Button>
        </div>
      </div>
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <>
      {/* Barra de acciones masivas */}
      <div className={cn(
        'sticky top-0 z-40 bg-app-dark-800 border border-app-dark-600 rounded-lg p-4',
        'flex items-center justify-between shadow-lg',
        'transition-all duration-200',
        className
      )}>
        {/* Información de selección */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-app-accent-500" />
            <span className="text-sm font-medium text-white">
              {selectionCount} oportunidad{selectionCount !== 1 ? 'es' : ''} seleccionada{selectionCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            icon={X}
            onClick={handleDeselectAll}
            className="text-app-gray-400 hover:text-white"
          >
            Deseleccionar
          </Button>
        </div>

        {/* Acciones */}
        <div className="flex items-center space-x-2">
          {/* Loading indicator */}
          {bulkOperationLoading && (
            <LoadingSpinner size="sm" className="mr-2" />
          )}

          {/* Editar en lote */}
          <Button
            size="sm"
            variant="outline"
            icon={Edit}
            onClick={() => setShowBulkUpdate(true)}
            disabled={bulkOperationLoading}
          >
            Editar
          </Button>

          {/* Eliminar en lote */}
          <Button
            size="sm"
            variant="destructive"
            icon={Trash2}
            onClick={() => setShowDeleteConfirm(true)}
            disabled={bulkOperationLoading}
          >
            Eliminar
          </Button>

          {/* ✅ RECOMENDACIÓN 3: Más acciones con Dropdown */}
          <Dropdown
            trigger={
                <Button
                size="sm"
                variant="ghost"
                // leftIcon={<MoreHorizontal className="h-4 w-4" />} // Es mejor poner el icono dentro
                disabled={bulkOperationLoading}
                >
                <MoreHorizontal className="h-4 w-4" /> {/* Poner el icono como children es más flexible */}
                </Button>
            }
            items={moreActionsOptions.map(action => ({ ...action, id: action.label }))} // ✅ CORREGIDO
            align="end"
            />
        </div>
      </div>

      {/* ✅ RECOMENDACIÓN 2: Modal renderizado con Portal */}
      {modalContent && createPortal(modalContent, document.body)}

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`Eliminar ${selectionCount} oportunidades`}
        description={
            selectionCount === 1
            ? "Esta acción moverá la oportunidad a la papelera. ¿Estás seguro?"
            : `Esta acción moverá ${selectionCount} oportunidades a la papelera. ¿Estás seguro?`
        }
        confirmLabel="Sí, eliminar"
        isConfirming={bulkOperationLoading}
        variant="destructive"
      />
    </>
  );
};

export default DealsBulkActions;