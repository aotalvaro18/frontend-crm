// src/pages/companies/EditCompanyModal.tsx

import React from 'react';
import { X } from 'lucide-react';
import { useCompanyOperations } from '@/stores/companyStore';
import CompanyForm from '@/components/companies/CompanyForm';
import { getDisplayName } from '@/types/company.types';
import type { 
  CompanyDTO, 
  CreateCompanyRequest,
  UpdateCompanyRequest 
} from '@/types/company.types';


interface EditCompanyModalProps {
  company: CompanyDTO;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  company,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { updateCompany, isUpdating } = useCompanyOperations();

const handleClose = () => {
  onClose();
};

const handleSubmit = async (data: CreateCompanyRequest | UpdateCompanyRequest) => {
  // Llama a la función del store. La invalidación de caché y toasts se manejan solos.
  await updateCompany(company.id, data as UpdateCompanyRequest, () => {
    // Este callback se ejecuta solo si la actualización es exitosa.
    onSuccess(); // Cierra el modal, refresca la página, etc.
  });
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
            <h2 className="text-lg font-semibold text-white">Editar Empresa</h2>
            <p className="text-sm text-app-gray-400">{getDisplayName(company)}</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-app-dark-700 rounded-lg transition-colors">
            <X className="h-5 w-5 text-app-gray-400" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <CompanyForm
            company={company}
            mode="edit"
            onSubmit={handleSubmit}
            onCancel={handleClose}
            loading={isUpdating(company.id)} // ✅ FUNCIÓN QUE VERIFICA SI *ESTA* EMPRESA SE ESTÁ ACTUALIZANDO
            showActions={true}
          />
        </div>
      </div>
    </div>
  );
};

export default EditCompanyModal;