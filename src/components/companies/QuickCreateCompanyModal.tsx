// src/components/companies/QuickCreateCompanyModal.tsx
import React from 'react';
import { useCompanyOperations } from '@/hooks/useCompanies';
import { Modal } from '@/components/ui/Modal';
import CompanyForm from '@/components/companies/CompanyForm';
import type { CompanyDTO, CreateCompanyRequest, UpdateCompanyRequest } from '@/types/company.types';

interface QuickCreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (company: CompanyDTO) => void;
  initialName?: string;
}

const QuickCreateCompanyModal: React.FC<QuickCreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialName
}) => {
  const { createCompany, isCreating } = useCompanyOperations();

  const handleSubmit = async (data: CreateCompanyRequest | UpdateCompanyRequest) => {
    await createCompany(data as CreateCompanyRequest, (newCompany) => {
      onSuccess(newCompany);
      onClose();
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nueva Empresa"
      size="lg"
    >
    <CompanyForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={isCreating}
        company={initialName ? { name: initialName } as any : undefined}
        showActions={true}
    />
    </Modal>
  );
};

export default QuickCreateCompanyModal;