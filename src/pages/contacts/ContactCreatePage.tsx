// src/pages/contacts/ContactCreatePage.tsx
// Contact create page enterprise - Arquitectura limpia y desacoplada

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
// ✅ SOLUCIÓN:
import toast from 'react-hot-toast';

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

  const { createContact, creating, error } = useContactOperations();

  // ============================================
  // HANDLERS SIMPLES
  // ============================================

  const handleBack = () => {
    navigate('/contacts');
  };

  const handleSubmit = async (data: CreateContactRequest | UpdateContactRequest) => {
    try {
      // A pesar de que 'data' puede ser de dos tipos, en esta página
      // sabemos que siempre será un 'CreateContactRequest'.
      // Lo confirmamos y le damos una pista a TypeScript.
      const newContact = await createContact(data as CreateContactRequest);
      
      // Opcional: un type guard para más seguridad en runtime
      if ('version' in data) {
        console.error("Error lógico: Se intentó actualizar un contacto desde la página de creación.");
        return; // No continuar si algo está mal
      }

      toast.success(`Contacto "${newContact.firstName} ${newContact.lastName}" creado exitosamente.`);
      
      // Navegar al detalle del contacto creado
      navigate(`/contacts/${newContact.id}`);

    } catch (error) {
      // El error ya es manejado por el store y se mostrará en el formulario
      // a través de la prop 'error'. No es necesario mostrar otro toast aquí.
      console.error('Error al crear el contacto:', error);
    }
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
                loading={creating}
                error={error}
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