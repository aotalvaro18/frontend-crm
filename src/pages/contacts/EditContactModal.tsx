// src/pages/contacts/EditContactModal.tsx
// ✅ SIGUIENDO "LA FORMA EKLESA" - Modal enterprise usando componente Modal reutilizable
// Componente "tonto" que orquesta, ContactForm construye, Hook maneja lógica

import React from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================
// HOOKS DESACOPLADOS (Slice Vertical)
// ============================================

import { useContactOperations } from '@/hooks/useContacts';

// ============================================
// COMPONENTES REUTILIZABLES
// ============================================

import ContactForm from '@/components/contacts/ContactForm';
import { FormModal } from '@/components/ui/Modal';

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

  // ============================================
  // RENDER USANDO COMPONENTE REUTILIZABLE
  // ============================================

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      onSave={() => {
        // El save se maneja desde el ContactForm directamente
        // Este modal no necesita manejar el save porque ContactForm
        // ya tiene su propio botón de submit
      }}
      title="Editar Contacto"
      description={`${contact.firstName} ${contact.lastName}`}
      size="4xl"
      mobileDrawer={true}
      loading={loading}
      saveText="Actualizar Contacto"
      cancelText="Cancelar"
      // Ocultamos los botones del FormModal porque ContactForm maneja sus propios botones
      contentClassName="pb-6"
    >
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center">
            <Save className="h-4 w-4 text-red-400 mr-2" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* ✅ REUTILIZACIÓN DE COMPONENTE: ContactForm hace todo el trabajo */}
      <ContactForm
        contact={contact}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        loading={loading}
        error={error}
        mode="edit"
      />
    </FormModal>
  );
};

export default EditContactModal;