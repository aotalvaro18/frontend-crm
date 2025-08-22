// src/pages/contacts/ContactDetailPage.tsx
// ✅ CONTACT DETAIL PAGE - VERSIÓN FINAL CON REACT QUERY
// Obtiene los datos del contacto con useQuery y usa el store de Zustand para las acciones.

import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// ============================================
// HOOKS & SERVICES
// ============================================
import { 
  useContactOperations,
  CONTACT_DETAIL_QUERY_KEY
} from '@/hooks/useContacts';
import { contactApi } from '@/services/api/contactApi';
import { toastSuccess } from '@/services/notifications/toastService';
import { getFullName } from '@/types/contact.types';

// ============================================
// COMPONENTES
// ============================================
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import ContactDetailHeader from '@/components/contacts/ContactDetailHeader';
import ContactBasicInfo from '@/components/contacts/ContactBasicInfo';
import ContactContactInfo from '@/components/contacts/ContactContactInfo';
import ContactPortalSection from '@/components/contacts/ContactPortalSection';
import EditContactModal from './EditContactModal'; // Asumimos que este componente existe
import Page from '@/components/layout/Page';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';

const ContactDetailPage: React.FC = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const contactId = Number(id);

  // ============================================
  // DATA FETCHING CON REACT QUERY
  // ============================================
  const { 
    data: contact, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: CONTACT_DETAIL_QUERY_KEY(contactId),
    queryFn: () => contactApi.getContactById(contactId),
    enabled: !!contactId, // Solo ejecuta si el ID es un número válido
  });

  // ============================================
  // ZUSTAND STORE PARA ACCIONES
  // ============================================
  const { deleteContact, isUpdating, isDeleting } = useContactOperations();

  // ============================================
  // HANDLERS
  // ============================================
  const handleBack = () => navigate('/contacts');
  const handleEdit = () => setShowEditModal(true);
  const handleDelete = () => setShowDeleteDialog(true);

  const handleUpdateSuccess = useCallback(() => {
    setShowEditModal(false);
    toastSuccess("Contacto actualizado con éxito.");
    // No es necesario llamar a refetch manualmente, la invalidación en el store se encarga.
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!contact) return;
    deleteContact(contact.id, () => {
      toastSuccess(`El contacto "${getFullName(contact)}" ha sido eliminado.`);
      navigate('/contacts');
    });
  }, [contact, deleteContact, navigate]);

  // ============================================
  // RENDER STATES
  // ============================================
  if (isLoading) {
    return (
      <Page title="Cargando...">
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Error">
        <ErrorMessage 
          title="Error al cargar contacto"
          message={(error as Error).message}
          onRetry={() => refetch()}
          actions={<Button variant="outline" onClick={handleBack}>Volver a la lista</Button>}
        />
      </Page>
    );
  }

  if (!contact) {
    return (
      <Page title="Contacto no encontrado">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-app-gray-100 mb-4">Contacto no encontrado</h2>
          <Button onClick={handleBack}>Volver a la lista</Button>
        </div>
      </Page>
    );
  }

  const pageTitle = getFullName(contact);
  //const contactIsBeingModified = isUpdating(contact.id) || isDeleting(contact.id);

  return (
    <Page title={pageTitle}>
      <div className="space-y-6">
        <ContactDetailHeader
          contact={contact}
          onBack={handleBack}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isUpdating={isUpdating(contact.id)}
          isDeleting={isDeleting(contact.id)}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ContactBasicInfo contact={contact} />
            <ContactContactInfo contact={contact} />
            <ContactPortalSection 
              contact={contact} 
              onGenerateInvitation={async () => {}} 
              onResendInvitation={async () => {}} 
              onRevokeAccess={async () => {}} 
            />
          </div>
          {/* Aquí irían tus componentes de sidebar como Actividades y Notas */}
        </div>
      </div>

      {/* Modales y Diálogos */}
      <EditContactModal
        contact={contact}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleUpdateSuccess}
      />
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title={`Eliminar a ${pageTitle}`}
        description="Esta acción moverá el contacto a la papelera. ¿Estás seguro?"
        confirmLabel="Sí, eliminar"
        isConfirming={isDeleting(contact.id)}
      />
    </Page>
  );
};

export default ContactDetailPage;