// src/components/companies/QuickCreateCompanyModal.tsx
// ✅ REFACTORIZADO: Modal mobile-first siguiendo la propuesta
// Mobile drawer + campos mínimos + auto-selección

import React, { useRef } from 'react';
import { useCompanyOperations } from '@/hooks/useCompanies';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { FormModal } from '@/components/ui/Modal';
import QuickCompanyForm from '@/components/companies/QuickCompanyForm';
import type { CompanyDTO, CreateCompanyRequest } from '@/types/company.types';

// ============================================
// PROPS INTERFACE
// ============================================

interface QuickCreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (company: CompanyDTO) => void;
  initialName?: string;
}

// ============================================
// COMPONENTE PRINCIPAL - Mobile-first + UX pulida
// ============================================

const QuickCreateCompanyModal: React.FC<QuickCreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialName
}) => {
  const { createCompany, isCreating } = useCompanyOperations();
  const { handleError } = useErrorHandler();
  const formRef = useRef<HTMLFormElement>(null);

  // ============================================
  // SUBMIT HANDLER - Siguiendo patrón exacto del proyecto
  // ============================================
  const handleSubmit = async (data: CreateCompanyRequest) => {
    try {
      await createCompany(data, (newCompany) => {
        // ✅ AUTO-SELECCIÓN: La nueva empresa se selecciona automáticamente
        onSuccess(newCompany);
        onClose();
      });
    } catch (error: unknown) {
      console.error('Error creating company:', error);
      handleError(error, 'Error al crear la empresa');
    }
  };

  // ============================================
  // SAVE HANDLER para FormModal
  // ============================================
  const handleSave = () => {
    // Trigger form submission programmatically
    formRef.current?.dispatchEvent(
      new Event('submit', { cancelable: true, bubbles: true })
    );
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="Crear Nueva Empresa"
      description="Completa la información básica. Podrás añadir más detalles después."
      saveText="Crear Empresa"
      cancelText="Cancelar"
      saveDisabled={isCreating}
      loading={isCreating}
      size="md"
      mobileDrawer={true} // ✅ Mobile-first con drawer
    >
      <QuickCompanyForm
        ref={formRef}
        onSubmit={handleSubmit}
        loading={isCreating}
        initialName={initialName}
      />
    </FormModal>
  );
};

export default QuickCreateCompanyModal;