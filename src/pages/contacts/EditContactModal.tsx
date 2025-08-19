// src/pages/contacts/EditContactModal.tsx
// ✅ VERSIÓN COMPLETA QUE FUNCIONA - Modal simple sin componente Modal problemático

import React from 'react';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================
// HOOKS DESACOPLADOS (Slice Vertical)
// ============================================

import { useContactOperations } from '@/hooks/useContacts';

// ============================================
// COMPONENTES REUTILIZABLES
// ============================================

import ContactForm from '@/components/contacts/ContactForm';

// ============================================
// TYPES (Props explícitas)
// ============================================

import type { 
  ContactDTO, 
  CreateContactRequest, 
  UpdateContactRequest 
} from '@/types/contact.types';

interface EditContactModalProps {
  contact: ContactDTO;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================
// MAIN COMPONENT (Solo orquestación)
// ============================================

const EditContactModal: React.FC<EditContactModalProps> = ({
  contact,
  isOpen,
  onClose,
  onSuccess
}) => {
  // ============================================
  // HOOKS DESACOPLADOS (Siguiendo el slice vertical)
  // ============================================

  const { updateContact, loading, error, clearError } = useContactOperations();

  // ============================================
  // HANDLERS SIMPLES (Sin lógica de negocio)
  // ============================================

  const handleClose = () => {
    clearError();
    onClose();
  };

  const handleSubmit = async (data: CreateContactRequest | UpdateContactRequest) => {
    try {
      // Asegurarse de que es UpdateContactRequest
      const updateData = data as UpdateContactRequest;
      
      // Llamar al hook (Slice vertical: Modal → Hook → API → Backend)
      await updateContact(contact.id, updateData);
      
      // Notificar éxito
      toast.success(`Contacto "${contact.firstName} ${contact.lastName}" actualizado exitosamente`);
      
      // Callback al padre para refrescar datos
      onSuccess();
      
    } catch (error) {
      // El error ya es manejado por el hook y se mostrará en el formulario
      console.error('Error al actualizar el contacto:', error);
    }
  };

  // ✅ EARLY RETURN - Después de todos los hooks
  if (!isOpen) return null;

  // ============================================
  // RENDER CON MODAL SIMPLE QUE FUNCIONA
  // ============================================

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-app-dark-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-app-dark-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-dark-600">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Editar Contacto
            </h2>
            <p className="text-sm text-app-gray-400">
              {contact.firstName} {contact.lastName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-app-dark-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-app-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center">
                <Save className="h-4 w-4 text-red-400 mr-2" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            </div>
          )}

          {/* ContactForm */}
          <ContactForm
            contact={contact}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            loading={loading}
            error={error}
            mode="edit"
            showActions={true}
          />
        </div>
      </div>
    </div>
  );
};

export default EditContactModal;