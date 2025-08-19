// En: src/pages/contacts/EditContactModal.tsx

import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useContactOperations } from '@/hooks/useContacts';
import ContactForm from '@/components/contacts/ContactForm';
import type { 
  ContactDTO, 
  UpdateContactRequest 
} from '@/types/contact.types';

interface EditContactModalProps {
  contact: ContactDTO;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditContactModal: React.FC<EditContactModalProps> = ({
  contact,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { updateContact, loading, error, clearError } = useContactOperations();

  // ✅ 1. PRE-PROCESAMIENTO: Este componente prepara los datos para el formulario.
  const formDefaultValues = useMemo(() => {
    // Si el modal está abierto pero no hay contacto, devuelve un objeto vacío para seguridad.
    if (!contact) return {};

    // "Traduce" la estructura de la API a la estructura que el formulario necesita.
    const formCommPrefs = {
      ...(contact.communicationPreferences ?? {}),
      marketingConsent: contact.marketingConsent ?? false,
    };
    const formTagIds = contact.tags?.map(tag => tag.id) || [];

    return {
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: '', // SmartPhoneInput se encarga de esto
      companyId: contact.companyId,
      address: contact.address,
      birthDate: contact.birthDate ? contact.birthDate.split('T')[0] : '',
      gender: contact.gender,
      source: contact.source || 'MANUAL_ENTRY',
      sourceDetails: contact.sourceDetails,
      customFields: contact.customFields,
      communicationPreferences: formCommPrefs,
      tags: formTagIds,
    };
  }, [contact]);

  const handleClose = () => {
    clearError();
    onClose();
  };

  const handleSubmit = async (data: UpdateContactRequest) => {
    try {
      await updateContact(contact.id, data);
      toast.success(`Contacto "${contact.firstName}" actualizado.`);
      onSuccess();
    } catch (err) {
      console.error('Error al actualizar el contacto:', err);
    }
  };

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
        <div className="flex items-center justify-between p-6 border-b border-app-dark-600">
          <div>
            <h2 className="text-lg font-semibold text-white">Editar Contacto</h2>
            <p className="text-sm text-app-gray-400">{contact.firstName} {contact.lastName}</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-app-dark-700 rounded-lg transition-colors">
            <X className="h-5 w-5 text-app-gray-400" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center">
                <X className="h-4 w-4 text-red-400 mr-2" /> 
                <span className="text-sm text-red-300">{error}</span>
              </div>
            </div>
          )}
          
          {/* ✅ 2. PASAMOS LAS PROPS CORRECTAS: `initialContactForEdit` y los `defaultValues` ya limpios. */}
          <ContactForm
            mode="edit"
            initialContactForEdit={contact}
            defaultValues={formDefaultValues}
            onSubmit={handleSubmit as any}
            onCancel={handleClose}
            loading={loading}
            error={error}
            showActions={true}
          />
        </div>
      </div>
    </div>
  );
};

export default EditContactModal;