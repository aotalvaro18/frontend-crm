// src/pages/deals/DealDetailPage.tsx
// ✅ VERSIÓN FINAL Y 100% CORREGIDA
// Alineado con la variable 'dealData' y con todos los patrones de "talla mundial".

import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ============================================
// HOOKS & SERVICES
// ============================================
import { useDealOperations, useDealById, usePipelineKanbanData } from '@/hooks/useDeals';
import { toastSuccess } from '@/services/notifications/toastService';
import { getDisplayName } from '@/types/deal.types';

// ============================================
// UI COMPONENTS
// ============================================
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import Page from '@/components/layout/Page';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';

// ============================================
// DEAL COMPONENTS
// ============================================
import DealDetailHeader from '@/components/deals/DealDetailHeader';
import DealBasicInfo from '@/components/deals/DealBasicInfo';
import DealContactInfo from '@/components/deals/DealContactInfo';
import DealPipelineInfo from '@/components/deals/DealPipelineInfo';
import DealFinancialInfo from '@/components/deals/DealFinancialInfo';
import DealActivityTimeline from '@/components/deals/DealActivityTimeline';
import EditDealModal from '@/components/deals/EditDealModal';

// ============================================
// MAIN COMPONENT
// ============================================
const DealDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dealId = id ? parseInt(id, 10) : 0;

  // ============================================
  // STATE
  // ============================================
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCloseWonDialog, setShowCloseWonDialog] = useState(false);
  const [showCloseLostDialog, setShowCloseLostDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);

  // ============================================
  // DATA FETCHING - ✅ Usando 'dealData' para evitar conflicto de nombres
  // ============================================
  const {
    data: dealData,
    isLoading,
    error,
    refetch
  } = useDealById(dealId);

  const {
    data: kanbanData,
    isLoading: isLoadingKanban, // Renombrar para evitar conflictos
    error: kanbanError
  } = usePipelineKanbanData(dealData?.pipelineId || 0);

  // ============================================
  // HOOKS DE ZUSTAND (Para acciones)
  // ============================================
  const {
    deleteDeal,
    moveDealToStage,
    closeDealWon,
    closeDealLost,
    reopenDeal,
    isUpdating,
    isDeleting,
    isClosingWon,
    isClosingLost,
    isReopening
  } = useDealOperations();

  // ============================================
  // HANDLERS - ✅ Actualizados para usar 'dealData'
  // ============================================
  const handleBack = useCallback(() => navigate('/crm/deals'), [navigate]);
  const handleEdit = useCallback(() => setShowEditModal(true), []);
  const handleDelete = useCallback(() => setShowDeleteDialog(true), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!dealData) return;
    await deleteDeal(dealData.id, () => {
      toastSuccess('Oportunidad eliminada exitosamente');
      navigate('/crm/deals');
    });
  }, [dealData, deleteDeal, navigate]);

  const handleCloseWon = useCallback(() => setShowCloseWonDialog(true), []);
  const handleConfirmCloseWon = useCallback(async () => {
    if (!dealData) return;
    await closeDealWon({
      dealId: dealData.id,
      actualCloseDate: new Date().toISOString(),
    }, () => {
      toastSuccess('🎉 Oportunidad cerrada como ganada');
      setShowCloseWonDialog(false);
    });
  }, [dealData, closeDealWon]);

  const handleCloseLost = useCallback(() => setShowCloseLostDialog(true), []);
  const handleConfirmCloseLost = useCallback(async () => {
    if (!dealData) return;
    await closeDealLost({
      dealId: dealData.id,
      actualCloseDate: new Date().toISOString(),
      lostReason: 'Marcada como perdida desde detalle',
    }, () => {
      toastSuccess('Oportunidad cerrada como perdida');
      setShowCloseLostDialog(false);
    });
  }, [dealData, closeDealLost]);

  const handleReopen = useCallback(() => setShowReopenDialog(true), []);
  const handleConfirmReopen = useCallback(async () => {
    if (!dealData) return;
    await reopenDeal({
      dealId: dealData.id,
      notes: 'Reabierta desde página de detalle',
    }, () => {
      toastSuccess('Oportunidad reabierta exitosamente');
      setShowReopenDialog(false);
    });
  }, [dealData, reopenDeal]);

  const handleUpdateSuccess = useCallback(() => {
    setShowEditModal(false);
    toastSuccess('Oportunidad actualizada exitosamente');
  }, []);

  const handleStageMove = useCallback(async (newStageId: number) => {
    if (!dealData) return;
    await moveDealToStage(dealData.id, newStageId, undefined, () => {
      toastSuccess('Oportunidad movida a nueva etapa');
    });
  }, [dealData, moveDealToStage]);

  // ============================================
  // RENDER HELPERS - ✅ Usando 'dealData' y con 'actions' corregido
  // ============================================
  if (isLoading || isLoadingKanban) {
    return (
      <Page title="Cargando oportunidad..." subtitle="Por favor espera">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Page>
    );
  }
  
  if (error || kanbanError || !dealData || !kanbanData) {
    return (
      <Page title="Error" subtitle="No se pudo cargar la oportunidad">
        <ErrorMessage
          message="No se pudo cargar la oportunidad. Puede que no exista o no tengas permisos para verla."
          actions={[
            <Button key="back" onClick={handleBack}>Volver a oportunidades</Button>,
            <Button key="retry" variant="outline" onClick={() => refetch()}>Reintentar</Button>
          ]}
        />
      </Page>
    );
  }
  // ✅ Título dinámico - Usando 'dealData'
  const pageTitle = getDisplayName(dealData);
  const pageSubtitle = `${dealData.pipelineName} • ${dealData.stageName}`;

  // ============================================
  // MAIN RENDER - ✅ TODO EL JSX actualizado para usar 'dealData'
  // ============================================
  return (
    <Page 
      title={pageTitle} 
      subtitle={pageSubtitle}
      showBackButton
      onBack={handleBack}
    >
      <div className="space-y-6">
        <DealDetailHeader
          deal={dealData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCloseWon={handleCloseWon}
          onCloseLost={handleCloseLost}
          onReopen={handleReopen}
          onStageMove={handleStageMove}
          isUpdating={isUpdating(dealData.id)}
          isDeleting={isDeleting(dealData.id)}
          isClosingWon={isClosingWon(dealData.id)}
          isClosingLost={isClosingLost(dealData.id)}
          isReopening={isReopening(dealData.id)}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DealBasicInfo deal={dealData} />
            <DealContactInfo deal={dealData} />
            <DealActivityTimeline dealId={dealData.id} />
          </div>
          <div className="space-y-6">
          <DealPipelineInfo 
  deal={dealData}
  kanbanData={kanbanData}
  isOperationInProgress={
    isUpdating(dealData.id) || 
    isDeleting(dealData.id) || 
    isClosingWon(dealData.id) || 
    isClosingLost(dealData.id) || 
    isReopening(dealData.id)
  }
  onStageMove={handleStageMove}
  onCloseWon={() => setShowCloseWonDialog(true)}
  onCloseLost={() => setShowCloseLostDialog(true)}
  onReopen={() => setShowReopenDialog(true)}
/>
            <DealFinancialInfo deal={dealData} />
          </div>
        </div>
      </div>

        {/* ============================================ */}
        {/* MODALES Y DIÁLOGOS */}
        {/* ============================================ */}
        
        {/* Modal de edición */}
        <EditDealModal
        deal={dealData}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleUpdateSuccess}
        />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title={`Eliminar oportunidad "${pageTitle}"`}
        description="Esta acción moverá la oportunidad a la papelera. ¿Estás seguro?"
        confirmLabel="Sí, eliminar"
        isConfirming={isDeleting(dealData.id)}
        variant="destructive"
      />

      <ConfirmDialog
        isOpen={showCloseWonDialog}
        onClose={() => setShowCloseWonDialog(false)}
        onConfirm={handleConfirmCloseWon}
        title="Cerrar como ganada"
        description={`¿Confirmas que la oportunidad "${pageTitle}" se ha cerrado exitosamente?`}
        confirmLabel="Sí, cerrar como ganada"
        isConfirming={isClosingWon(dealData.id)}
        variant="default"
      />

      <ConfirmDialog
        isOpen={showCloseLostDialog}
        onClose={() => setShowCloseLostDialog(false)}
        onConfirm={handleConfirmCloseLost}
        title="Cerrar como perdida"
        description={`¿Confirmas que la oportunidad "${pageTitle}" se ha perdido?`}
        confirmLabel="Sí, cerrar como perdida"
        isConfirming={isClosingLost(dealData.id)}
        variant="destructive"
      />

      <ConfirmDialog
        isOpen={showReopenDialog}
        onClose={() => setShowReopenDialog(false)}
        onConfirm={handleConfirmReopen}
        title="Reabrir oportunidad"
        description={`¿Quieres reabrir la oportunidad "${pageTitle}"? Volverá al pipeline activo.`}
        confirmLabel="Sí, reabrir"
        isConfirming={isReopening(dealData.id)}
        variant="default"
      />
    </Page>
  );
};

export default DealDetailPage;