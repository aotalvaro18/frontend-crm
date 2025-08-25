// src/pages/companies/CompanyDetailPage.tsx
// ✅ COMPANY DETAIL PAGE - VERSIÓN FINAL CON REACT QUERY
// Obtiene los datos de la empresa con useQuery y usa el store de Zustand para las acciones.

import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// ============================================
// HOOKS & SERVICES
// ============================================
import { 
  useCompanyOperations,
  COMPANY_DETAIL_QUERY_KEY
} from '@/hooks/useCompanies';
import { companyApi } from '@/services/api/companyApi';
import { toastSuccess } from '@/services/notifications/toastService';
import { getDisplayName } from '@/types/company.types';

// ============================================
// COMPONENTES
// ============================================
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import CompanyDetailHeader from '@/components/companies/CompanyDetailHeader';
import CompanyBasicInfo from '@/components/companies/CompanyBasicInfo';
import CompanyContactInfo from '@/components/companies/CompanyContactInfo';
import CompanyBusinessInfo from '@/components/companies/CompanyBusinessInfo';
import EditCompanyModal from './EditCompanyModal'; // Asumimos que este componente existe
import Page from '@/components/layout/Page';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';

const CompanyDetailPage: React.FC = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const companyId = Number(id);

  // ============================================
  // DATA FETCHING CON REACT QUERY
  // ============================================
  const { 
    data: company, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: COMPANY_DETAIL_QUERY_KEY(companyId),
    queryFn: () => companyApi.getCompanyById(companyId),
    enabled: !!companyId, // Solo ejecuta si el ID es un número válido
    refetchInterval: 1000, // Refetch cada segundo temporalmente para debug
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  // ============================================
  // ZUSTAND STORE PARA ACCIONES
  // ============================================
  const { deleteCompany, isUpdating, isDeleting } = useCompanyOperations();

  // ============================================
  // HANDLERS
  // ============================================
  const handleBack = () => navigate('/companies');
  const handleEdit = () => setShowEditModal(true);
  const handleDelete = () => setShowDeleteDialog(true);

  const handleUpdateSuccess = useCallback(() => {
    setShowEditModal(false);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!company) return;
    deleteCompany(company.id, () => {
      toastSuccess(`La empresa "${getDisplayName(company)}" ha sido eliminada.`);
      navigate('/companies');
    });
  }, [company, deleteCompany, navigate]);

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
          title="Error al cargar empresa"
          message={(error as Error).message}
          onRetry={() => refetch()}
          actions={<Button variant="outline" onClick={handleBack}>Volver a la lista</Button>}
        />
      </Page>
    );
  }

  if (!company) {
    return (
      <Page title="Empresa no encontrada">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-app-gray-100 mb-4">Empresa no encontrada</h2>
          <Button onClick={handleBack}>Volver a la lista</Button>
        </div>
      </Page>
    );
  }

  const pageTitle = getDisplayName(company);
  //const companyIsBeingModified = isUpdating(company.id) || isDeleting(company.id);

  return (
    <Page title={pageTitle}>
      <div className="space-y-6">
        <CompanyDetailHeader
          company={company}
          onBack={handleBack}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isUpdating={isUpdating(company.id)}
          isDeleting={isDeleting(company.id)}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CompanyBasicInfo company={company} />
            <CompanyContactInfo company={company} />
            <CompanyBusinessInfo company={company} />
          </div>
          {/* Aquí irían tus componentes de sidebar como Contactos Asociados y Deals */}
          <div className="space-y-6">
            {/* Sidebar content - stats, recent activity, etc. */}
          </div>
        </div>
      </div>

      {/* Modales y Diálogos */}
      <EditCompanyModal
        company={company}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleUpdateSuccess}
      />
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title={`Eliminar empresa ${pageTitle}`}
        description="Esta acción moverá la empresa a la papelera. ¿Estás seguro?"
        confirmLabel="Sí, eliminar"
        isConfirming={isDeleting(company.id)}
      />
    </Page>
  );
};

export default CompanyDetailPage; 
