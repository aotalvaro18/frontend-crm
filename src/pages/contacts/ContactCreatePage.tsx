// src/pages/contacts/ContactCreatePage.tsx
// Contact create page enterprise - Arquitectura limpia y desacoplada

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
// ✅ SOLUCIÓN:

// ============================================
// HOOKS DESACOPLADOS
// ============================================

import { useContactOperations } from '@/hooks/useContacts';

// ============================================
// COMPONENTES ESPECIALIZADOS
// ============================================

import ContactForm from '../../components/contacts/ContactForm';

// UI Components
import { Button } from '@/components/ui/Button';
import Page from '@/components/layout/Page';

// Types
import type { CreateContactRequest, UpdateContactRequest } from '@/types/contact.types';

// ============================================
// PÁGINA PRINCIPAL - SOLO ORQUESTACIÓN
// ============================================

const ContactCreatePage: React.FC = () => {
  const navigate = useNavigate();

  // ============================================
  // HOOKS DESACOPLADOS
  // ============================================

  const { createContact, isCreating } = useContactOperations();
  
  // ============================================
  // HANDLERS SIMPLES
  // ============================================

  const handleBack = () => {
    navigate('/contacts');
  };

  const handleSubmit = async (data: CreateContactRequest | UpdateContactRequest) => {
    // Usamos el callback onSuccess para manejar la navegación después de que
    // la creación y la invalidación de caché en el store hayan terminado.
    createContact(data as CreateContactRequest, (newContact) => {
      // Navegar al detalle del nuevo contacto creado
      navigate(`/contacts/${newContact.id}`);
    });
  };

  const handleCancel = () => {
    navigate('/contacts');
  };

  // ============================================
  // RENDERIZADO PRINCIPAL - SOLO COMPOSICIÓN
  // ============================================

  return (
    <Page title="Crear Contacto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-app-gray-100">
              Crear Nuevo Contacto
            </h1>
            <p className="text-app-gray-400 mt-1">
              Completa la información básica para crear un nuevo contacto
            </p>
          </div>
        </div>

        {/* Form container */}
        <div className="max-w-4xl">
          <div className="bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700">
            <div className="px-6 py-6">
              <ContactForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={isCreating}
                mode="create"
              />
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default ContactCreatePage;