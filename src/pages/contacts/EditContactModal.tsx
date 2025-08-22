// En: src/pages/contacts/EditContactModal.tsx

import React from 'react';
import { X } from 'lucide-react';
import { useContactOperations } from '@/hooks/useContacts';
import ContactForm from '@/components/contacts/ContactForm';
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

const EditContactModal: React.FC<EditContactModalProps> = ({
  contact,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { updateContact, isUpdating: isUpdatingById } = useContactOperations();
// El estado de error general del store ya no es necesario aquí, 
// porque el store ahora muestra toasts directamente.

const handleClose = () => {
  onClose();
};

const handleSubmit = async (data: CreateContactRequest | UpdateContactRequest) => {
  // La función updateContact del store ya devuelve una Promise.
  // Al usar await, nos aseguramos de que handleSubmit también devuelva una Promise.
  await updateContact(contact.id, data as UpdateContactRequest, onSuccess);
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
          
          
          {/* ✅ SOLUCIÓN: Pasar solo las props que ContactForm espera */}
          <ContactForm
            contact={contact}
            mode="edit"
            onSubmit={handleSubmit}
            onCancel={handleClose}
            loading={isUpdatingById(contact.id)}
            showActions={true}
          />
        </div>
      </div>
    </div>
  );
};

export default EditContactModal;