// src/pages/contacts/ContactDetailPage.tsx
// Contact detail page enterprise - Arquitectura limpia y desacoplada

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Loader2
} from 'lucide-react';

// ============================================
// HOOKS DESACOPLADOS OJO
// ============================================

import { 
  useSelectedContact,
  useContactOperations,
  usePortalOperations,
  useContactErrorHandler
} from '@/hooks/useContacts';

// ============================================
// COMPONENTES ESPECIALIZADOS
// ============================================

import ContactDetailHeader from '../../components/contacts/ContactDetailHeader';
import ContactBasicInfo from '../../components/contacts/ContactBasicInfo';
import ContactContactInfo from '../../components/contacts/ContactContactInfo';
import ContactPortalSection from '../../components/contacts/ContactPortalSection';
import ContactActivityTimeline from '../../components/contacts/ContactActivityTimeline';
import ContactCustomFields from '../../components/contacts/ContactCustomFields';
import ContactNotes from '../../components/contacts/ContactNotes';
import EditContactModal from './EditContactModal';

// UI Components
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Page from '@/components/layout/Page';

// ============================================
// PÁGINA PRINCIPAL - SOLO ORQUESTACIÓN
// ============================================

const ContactDetailPage: React.FC = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Validar que el ID sea un número válido
  const contactId = React.useMemo(() => {
    if (!id) return null;
    const numericId = parseInt(id, 10);
    return isNaN(numericId) || numericId <= 0 ? null : numericId;
  }, [id]);

  // ============================================
  // HOOKS DESACOPLADOS
  // ============================================

  // Contact data hooks
  const {
    selectedContact: contact,
    getContactById,
    isUpdating,
    isDeleting
  } = useSelectedContact();

  // Operations hooks
  const { deleteContact } = useContactOperations();

  // Portal hooks
  const {
    generatePortalInvitation,
    resendPortalInvitation,
    revokePortalAccess
  } = usePortalOperations();

  // Error handling
  const { error, clearError } = useContactErrorHandler();

  // ============================================
  // EFECTOS
  // ============================================

  // Cargar contacto al montar
  useEffect(() => {
    if (contactId) {
      getContactById(contactId);
    }
  }, [contactId, getContactById]);

  // ============================================
  // HANDLERS SIMPLES
  // ============================================

  const handleBack = () => {
    navigate('/contacts');
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (!contact) return;
    
    const contactName = `${contact.firstName} ${contact.lastName}`;
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${contactName}?`)) {
      try {
        await deleteContact(contact.id);
        navigate('/contacts');
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    }
  };

  const handleGeneratePortalInvitation = async () => {
    if (contact) {
      await generatePortalInvitation(contact.id);
    }
  };

  const handleResendInvitation = async () => {
    if (contact) {
      await resendPortalInvitation(contact.id);
    }
  };

  const handleRevokeAccess = async () => {
    if (contact) {
      await revokePortalAccess(contact.id);
    }
  };

  // ✅ CORRECCIÓN: Handler para el evento de éxito del modal de edición
  const handleUpdateSuccess = useCallback(() => {
    setShowEditModal(false);
    
    // ✅ NO hacer nada más - El store ya tiene los datos actualizados
    // El updateContact() del store ya actualizó selectedContact con los datos del servidor
  }, []);

  // ============================================
  // ESTADOS CONDICIONALES
  // ============================================

  // Loading state
  if (!contact && !error) {
    return (
      <Page title="Cargando...">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Page>
    );
  }

  // Error state
  if (error) {
    return (
      <Page title="Error">
        <ErrorMessage 
          title="Error al cargar contacto"
          message={error}
          onRetry={() => {
            clearError();
            if (id) getContactById(Number(id));
          }}
          actions={
            <Button variant="outline" onClick={handleBack}>
              Volver a la lista
            </Button>
          }
        />
      </Page>
    );
  }

  // Contact not found
  if (!contact) {
    return (
      <Page title="Contacto no encontrado">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-app-gray-100 mb-4">
            Contacto no encontrado
          </h2>
          <Button onClick={handleBack}>
            Volver a la lista
          </Button>
        </div>
      </Page>
    );
  }

  // ============================================
  // RENDERIZADO PRINCIPAL - SOLO COMPOSICIÓN
  // ============================================

  const pageTitle = `${contact.firstName} ${contact.lastName}`;

  return (
    <Page title={pageTitle}>
      <div className="space-y-6">
        {/* Header con acciones */}
        <ContactDetailHeader
          contact={contact}
          onBack={handleBack}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info */}
            <ContactBasicInfo contact={contact} />

            {/* Contact info */}
            <ContactContactInfo contact={contact} />

            {/* Portal section */}
            <ContactPortalSection
              contact={contact}
              onGenerateInvitation={handleGeneratePortalInvitation}
              onResendInvitation={handleResendInvitation}
              onRevokeAccess={handleRevokeAccess}
            />

            {/* Custom fields */}
            {contact.customFields && Object.keys(contact.customFields).length > 0 && (
              <ContactCustomFields
                customFields={contact.customFields}
                contactId={contact.id}
              />
            )}
          </div>

          {/* Sidebar - Right column */}
          <div className="space-y-6">
            {/* Activity timeline */}
            <ContactActivityTimeline contactId={contact.id} />

            {/* Notes */}
            <ContactNotes contactId={contact.id} />
          </div>
        </div>
      </div>
      {/* Edit Modal */}
      {contact && (
        <EditContactModal
          contact={contact}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </Page>
  );
};

export default ContactDetailPage;