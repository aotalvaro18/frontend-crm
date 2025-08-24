// src/pages/companies/CompanyCreatePage.tsx
// ✅ COMPANY CREATE PAGE - Siguiendo exactamente el patrón de ContactCreatePage
// React Query maneja el fetching, Zustand maneja las acciones y estado de UI

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';

// ============================================
// UI & LAYOUT COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';
import Page from '@/components/layout/Page';

// ============================================
// COMPANY COMPONENTS
// ============================================
import CompanyForm from '@/components/companies/CompanyForm';

// ============================================
// HOOKS & SERVICES
// ============================================
import { useCompanyOperations } from '@/hooks/useCompanies';
import { useErrorHandler } from '@/hooks/useErrorHandler';

// ============================================
// TYPES
// ============================================
import type { CreateCompanyRequest, UpdateCompanyRequest } from '@/types/company.types';

// ============================================
// UTILS
// ============================================

import { toastSuccess } from '@/services/notifications/toastService';

// ============================================
// MAIN COMPONENT
// ============================================
const CompanyCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  
  // ============================================
  // HOOKS DE ZUSTAND (Para acciones)
  // ============================================
  const { createCompany, isCreating } = useCompanyOperations();

  // ============================================
  // HANDLERS
  // ============================================
  const handleBack = useCallback(() => {
    navigate('/companies');
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate('/companies');
  }, [navigate]);

  const handleSubmit = useCallback(async (data: CreateCompanyRequest | UpdateCompanyRequest) => {
    try {
      // Le decimos a TypeScript: "Confía en mí, en esta página, 'data' siempre será de este tipo"
      await createCompany(data as CreateCompanyRequest, (newCompany) => {
        toastSuccess(`Empresa "${newCompany.name}" creada exitosamente`);
        navigate(`/companies/${newCompany.id}`);
      });
    } catch (error: unknown) {
      console.error('Error creating company:', error);
      handleError(error, 'Error al crear la empresa');
    }
  }, [createCompany, navigate, handleError]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <Page 
      title="Nueva Empresa" 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Empresas', href: '/companies' },
        { label: 'Nueva Empresa' }
      ]} 
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
            disabled={isCreating}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          
          <div className="p-2 bg-crm-company-500/10 rounded-lg">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-crm-company-500" />
          </div>
          
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-app-gray-100">
              Nueva Empresa
            </h1>
            <p className="text-sm text-app-gray-400">
              Crea una nueva empresa, familia o institución en el sistema
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl">
        <div className="bg-app-dark-800 border border-app-dark-600 rounded-lg p-6">
          <CompanyForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={isCreating}
            showActions={true}
          />
        </div>
      </div>

      {/* Helper Text */}
      <div className="max-w-4xl">
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Building2 className="h-5 w-5 text-blue-400 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-200 mb-1">
                Tipos de Organización
              </h3>
              <div className="text-sm text-blue-300 space-y-1">
                <p><strong>Empresa:</strong> Organizaciones comerciales y de negocios</p>
                <p><strong>Familia:</strong> Grupos familiares (especialmente útil en contexto religioso)</p>
                <p><strong>Institución:</strong> Entidades educativas, ONGs, organismos gubernamentales</p>
                <p><strong>Otro:</strong> Cualquier otro tipo de agrupación u organización</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-app-dark-800 border border-app-dark-600 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <div>
                <p className="text-app-gray-100 font-medium">Creando empresa...</p>
                <p className="text-app-gray-400 text-sm">Por favor espera un momento</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

export default CompanyCreatePage;