// src/components/deals/EditDealModal.tsx
// ✅ EDIT DEAL MODAL - Replicando EditCompanyModal para deals
// Modal de edición + Form integration + Loading states

import React, { useCallback } from 'react';
import { X } from 'lucide-react';

// ============================================
// HOOKS & SERVICES
// ============================================
import { useDealOperations } from '@/hooks/useDeals';

// ============================================
// UI COMPONENTS
// ============================================
//import { Button } from '@/components/ui/Button';

// ============================================
// DEAL COMPONENTS
// ============================================
import DealForm from '@/components/deals/DealForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================
// TYPES & UTILS
// ============================================
import type { Deal, UpdateDealRequest } from '@/types/deal.types';
import { getDisplayName } from '@/types/deal.types';

// ============================================
// TYPES
// ============================================

interface EditDealModalProps {
  deal: Deal;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

const EditDealModal: React.FC<EditDealModalProps> = ({
  deal,
  isOpen,
  onClose,
  onSuccess
}) => {
  // ============================================
  // HOOKS DE ZUSTAND (Para acciones)
  // ============================================
  const { updateDeal, isUpdating } = useDealOperations();

  // ============================================
  // HANDLERS
  // ============================================
  const handleClose = useCallback(() => {
    if (isUpdating(deal.id)) return; // No permitir cerrar si está actualizando
    onClose();
  }, [isUpdating, deal.id, onClose]);

  const handleSubmit = useCallback(async (data: any) => {
    // ✅ SIGUIENDO EL PATRÓN DE COMPANIES
    // La invalidación de caché y toasts se manejan solos.
    await updateDeal(deal.id, data as UpdateDealRequest, () => {
      // Este callback se ejecuta solo si la actualización es exitosa.
      onSuccess(); // Cierra el modal, refresca la página, etc.
    });
  }, [deal.id, updateDeal, onSuccess]);

  // ============================================
  // RENDER
  // ============================================
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div 
        className="bg-app-dark-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-app-dark-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-dark-600">
          <div>
            <h2 className="text-lg font-semibold text-white">Editar Oportunidad</h2>
            <p className="text-sm text-app-gray-400">{getDisplayName(deal)}</p>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-app-dark-700 rounded-lg transition-colors"
            disabled={isUpdating(deal.id)}
          >
            <X className="h-5 w-5 text-app-gray-400" />
          </button>
        </div>
        
        {/* Form Container */}
<div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
<DealForm
  deal={deal}
  mode="edit"
  onSubmit={handleSubmit}
  onCancel={handleClose}
  loading={isUpdating(deal.id)}
  showActions={true}
/>
</div>
      </div>
    </div>
  );
};

export default EditDealModal;