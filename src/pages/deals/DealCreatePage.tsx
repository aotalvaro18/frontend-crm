// src/pages/deals/DealCreatePage.tsx
// ✅ DEAL CREATE PAGE - REPLICANDO EXACTAMENTE CompanyCreatePage.tsx
// React Query maneja el fetching, Zustand maneja las acciones y estado de UI
import React, { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Target } from 'lucide-react';
// ============================================
// HOOKS & SERVICES
// ============================================
import { useDealOperations } from '@/hooks/useDeals';
import { useErrorHandler } from '@/hooks/useErrorHandler';
// ============================================
// UI & LAYOUT COMPONENTS
// ============================================

import Page from '@/components/layout/Page';
// ============================================
// DEAL COMPONENTS
// ============================================
import DealForm from '@/components/deals/DealForm';
// ============================================
// TYPES
// ============================================
import type { CreateDealRequest, UpdateDealRequest } from '@/types/deal.types';
// ============================================
// MAIN COMPONENT
// ============================================
const DealCreatePage: React.FC = () => {
const navigate = useNavigate();
const [searchParams] = useSearchParams();
const { handleError } = useErrorHandler();
// Parámetros opcionales de la URL para pre-llenar el formulario
const preselectedPipelineId = searchParams.get('pipelineId');
const preselectedStageId = searchParams.get('stageId');
const preselectedContactId = searchParams.get('contactId');
const preselectedCompanyId = searchParams.get('companyId');
// ============================================
// HOOKS DE ZUSTAND (Para acciones)
// ============================================
const { createDeal, isCreating } = useDealOperations();
// ============================================
// HANDLERS
// ============================================
const handleBack = useCallback(() => {
navigate('/deals');
}, [navigate]);
const handleCancel = useCallback(() => {
navigate('/deals');
}, [navigate]);
const handleSubmit = useCallback(async (data: CreateDealRequest | UpdateDealRequest) => {
try {
// La función createDeal ya maneja la invalidación y los toasts automáticamente
await createDeal(data as CreateDealRequest, (newDeal) => {
// Callback de éxito: navegar al detalle de la nueva oportunidad
navigate(`/deals/${newDeal.id}`);
});
} catch (error) {
// El error ya se maneja en el store, pero lo loggeamos para debugging
console.error('❌ Error creating deal:', error);
handleError(error, 'Error al crear la oportunidad');
}
}, [createDeal, navigate, handleError]);
// ============================================
// VALORES INICIALES DEL FORMULARIO
// ============================================
const initialValues: Partial<CreateDealRequest> = {
// Pre-llenar con parámetros de la URL si existen
pipelineId: preselectedPipelineId ? Number(preselectedPipelineId) : undefined,
stageId: preselectedStageId ? Number(preselectedStageId) : undefined,
contactId: preselectedContactId ? Number(preselectedContactId) : undefined,
companyId: preselectedCompanyId ? Number(preselectedCompanyId) : undefined,

// Valores por defecto
title: '',
description: '',
priority: 'MEDIUM',
probability: 50,
};
// ============================================
// MAIN RENDER
// ============================================
return (
<Page 
title="Nueva Oportunidad" 
subtitle="Crear una nueva oportunidad de negocio"
showBackButton
onBack={handleBack}
>
<div className="max-w-4xl mx-auto">
{/* Información contextual */}
<div className="mb-6 p-4 bg-app-dark-800 border border-app-dark-600 rounded-lg">
<div className="flex items-start space-x-3">
<div className="flex-shrink-0">
<div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
<Target className="h-5 w-5 text-blue-400" />
</div>
</div>
<div>
<h3 className="text-sm font-medium text-white mb-1">
Crear Nueva Oportunidad
</h3>
<p className="text-sm text-app-gray-400">
Las oportunidades te permiten hacer seguimiento de posibles negocios a través de tu pipeline de ventas.
Asegúrate de asociarla al contacto principal y seleccionar el pipeline correcto.
</p>
code
Code
{/* Información de contexto si viene pre-seleccionado */}
          {(preselectedPipelineId || preselectedContactId || preselectedCompanyId) && (
            <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-sm text-blue-300 mb-2">
                <strong>Información pre-seleccionada:</strong>
              </p>
              <ul className="text-xs text-blue-200 space-y-1">
                {preselectedPipelineId && (
                  <li>• Pipeline ID: {preselectedPipelineId}</li>
                )}
                {preselectedStageId && (
                  <li>• Etapa ID: {preselectedStageId}</li>
                )}
                {preselectedContactId && (
                  <li>• Contacto ID: {preselectedContactId}</li>
                )}
                {preselectedCompanyId && (
                  <li>• Empresa ID: {preselectedCompanyId}</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Formulario de creación */}
    <div className="bg-app-dark-800 border border-app-dark-600 rounded-lg p-6">
      <DealForm
        mode="create"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={isCreating}
        showActions={true}
      />
    </div>

    {/* Información adicional */}
    <div className="mt-6 p-4 bg-app-dark-800/50 border border-app-dark-600 rounded-lg">
      <h4 className="text-sm font-medium text-white mb-2">Consejos para crear oportunidades:</h4>
      <ul className="text-sm text-app-gray-400 space-y-1">
        <li className="flex items-start">
          <span className="text-app-gray-600 mr-2 mt-0.5">•</span>
          <span><strong>Nombre descriptivo:</strong> Usa un nombre que identifique claramente la oportunidad (ej. "Implementación CRM - Empresa ABC")</span>
        </li>
        <li className="flex items-start">
          <span className="text-app-gray-600 mr-2 mt-0.5">•</span>
          <span><strong>Monto realista:</strong> Ingresa el valor estimado del negocio para un mejor seguimiento</span>
        </li>
        <li className="flex items-start">
          <span className="text-app-gray-600 mr-2 mt-0.5">•</span>
          <span><strong>Fecha de cierre:</strong> Establece una fecha esperada de cierre para mantener el foco</span>
        </li>
        <li className="flex items-start">
          <span className="text-app-gray-600 mr-2 mt-0.5">•</span>
          <span><strong>Contacto principal:</strong> Asocia siempre un contacto principal responsable de la decisión</span>
        </li>
      </ul>
    </div>
  </div>

  {/* Loading Overlay */}
  {isCreating && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-app-dark-800 border border-app-dark-600 rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <div>
            <p className="text-app-gray-100 font-medium">Creando oportunidad...</p>
            <p className="text-app-gray-400 text-sm">Por favor espera un momento</p>
          </div>
        </div>
      </div>
    </div>
  )}
</Page>
);
};
export default DealCreatePage;
