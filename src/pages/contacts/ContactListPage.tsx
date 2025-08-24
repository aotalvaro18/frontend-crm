// src/pages/contacts/ContactListPage.tsx
// ✅ CONTACT LIST PAGE - VERSIÓN FINAL CON REACT QUERY
// React Query maneja el fetching, cache y estado de los datos.
// Zustand (via hooks) maneja las acciones y el estado de la UI (selecciones, etc.).

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Filter, 
  RefreshCw,
  FileDown,
  Upload,
  Users
} from 'lucide-react';

// ============================================
// UI & LAYOUT COMPONENTS
// ============================================
import { Button, IconButton } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
//import { Badge, CountBadge } from '@/components/ui/Badge';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Dropdown from '@/components/ui/Dropdown';
import Page from '@/components/layout/Page';

// ============================================
// CONTACT COMPONENTS
// ============================================
import ContactsTable from '@/components/contacts/ContactsTable';
import ContactsFilters from '@/components/contacts/ContactsFilters';
import ContactsBulkActions from '@/components/contacts/ContactsBulkActions';
import ContactsStatsCards from '@/components/contacts/ContactsStatsCards';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

// ============================================
// HOOKS & SERVICES
// ============================================
import { 
  useBulkOperations, 
  useContactOperations,
  CONTACTS_LIST_QUERY_KEY, 
  CONTACT_STATS_QUERY_KEY 
} from '@/hooks/useContacts';
import { contactApi } from '@/services/api/contactApi';
import { useSearchDebounce } from '@/hooks/useDebounce';
import { getFullName, type ContactDTO, type ContactStatus, type ContactSearchCriteria } from '@/types/contact.types';
import { cn } from '@/utils/cn';
import { toastSuccess } from '@/services/notifications/toastService';
import { useErrorHandler } from '@/hooks/useErrorHandler'; // Asumo que aún lo usas para export

// ============================================
// MAIN COMPONENT
// ============================================
const ContactListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ============================================
  // LOCAL STATE para UI y Filtros
  // ============================================
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 0); // 0-based
  const [contactToDelete, setContactToDelete] = useState<ContactDTO | null>(null);

  const debouncedSearchTerm = useSearchDebounce(searchTerm, 300);

  const searchCriteria = useMemo((): ContactSearchCriteria => ({
    search: debouncedSearchTerm || undefined,
  }), [debouncedSearchTerm]);

  // ============================================
  // DATA FETCHING CON REACT QUERY (ÚNICA FUENTE DE VERDAD)
  // ============================================

  const { 
    data: contactsData, 
    isLoading: isLoadingContacts, 
    isFetching: isFetchingContacts,
    error: contactsError,
    refetch: refetchContacts,
  } = useQuery({
    queryKey: CONTACTS_LIST_QUERY_KEY(searchCriteria, currentPage),
    queryFn: () => contactApi.searchContacts({ ...searchCriteria }, { page: currentPage, size: 25, sort: ['updatedAt,desc'] }),
    placeholderData: (previousData) => previousData,
    refetchInterval: 1000, // Refetch cada segundo temporalmente para debug
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const contacts = contactsData?.content || [];
  const totalContacts = contactsData?.totalElements || 0;
  const totalPages = contactsData?.totalPages || 0;

  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: CONTACT_STATS_QUERY_KEY,
    queryFn: () => contactApi.getContactStats(),
  });

  // ============================================
  // HOOKS DE ZUSTAND (Para acciones y estado de UI)
  // ============================================
  const { deleteContact, deleting } = useContactOperations();
  const {
    selectedContactIds,
    hasSelection,
    selectionCount,
    bulkOperationLoading,
    selectAllContacts,
    deselectAllContacts,
    bulkUpdateContacts,
    bulkDeleteContacts
  } = useBulkOperations();
  const { handleError } = useErrorHandler(); // Mantenemos para acciones como export

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (currentPage > 0) params.set('page', String(currentPage));
    setSearchParams(params, { replace: true });
  }, [searchTerm, currentPage, setSearchParams]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleCreateContact = useCallback(() => navigate('/contacts/new'), [navigate]);
  const handleContactClick = useCallback((contact: ContactDTO) => navigate(`/contacts/${contact.id}`), [navigate]);
  const handleContactEdit = useCallback((contact: ContactDTO) => navigate(`/contacts/${contact.id}/edit`), [navigate]);
  
  const handleContactDelete = useCallback((contact: ContactDTO) => {
    setContactToDelete(contact); // Guarda el contacto que queremos borrar y abre el diálogo
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!contactToDelete) return;

    deleteContact(contactToDelete.id, () => {
      toastSuccess(`El contacto "${getFullName(contactToDelete)}" ha sido eliminado.`);
      setContactToDelete(null); // Cierra el diálogo
    });
  }, [contactToDelete, deleteContact]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchContacts(), refetchStats()]);
  }, [refetchContacts, refetchStats]);

  const handleExport = useCallback(async (format: 'csv' | 'excel') => {
    try {
      // Asumimos que contactApi tiene la lógica de export
      const blob = format === 'csv' 
        ? await contactApi.exportContactsCSV(searchCriteria)
        : await contactApi.exportContactsExcel(searchCriteria);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contactos_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toastSuccess(`Contactos exportados como ${format.toUpperCase()}`);
    } catch (error) {
      handleError(error, 'Error al exportar contactos');
    }
  }, [searchCriteria, handleError]);
  
  const handleBulkStatusUpdate = useCallback(async (status: ContactStatus) => {
    try {
      await bulkUpdateContacts({ status });
    } catch (error) {
      handleError(error, 'Error al actualizar contactos');
    }
  }, [bulkUpdateContacts, handleError]);

  const handleBulkDelete = useCallback(async () => {
    try {
      await bulkDeleteContacts();
    } catch (error) {
      handleError(error, 'Error al eliminar contactos');
    }
  }, [bulkDeleteContacts, handleError]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(0);
  }, []);

  const exportDropdownItems = [
    { id: 'export-csv', label: 'Exportar CSV', icon: FileDown, onClick: () => handleExport('csv') },
    { id: 'export-excel', label: 'Exportar Excel', icon: FileDown, onClick: () => handleExport('excel') },
    { type: 'separator' as const },
    { id: 'import', label: 'Importar contactos', icon: Upload, onClick: () => navigate('/contacts/import') }
  ];

  // ============================================
  // RENDER HELPERS
  // ============================================
  const renderHeader = () => (
    <div className="space-y-6">
      <ContactsStatsCards 
        stats={stats || { total: totalContacts, active: 0, inactive: 0, withPortal: 0, adoptionRate: 0, averageEngagementScore: 0, newContactsThisMonth: 0 }}
        isLoading={isLoadingStats}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-crm-contact-500/10 rounded-lg">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-crm-contact-500" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-app-gray-100">Contactos</h1>
            <div className="flex items-center gap-2 text-sm text-app-gray-400">
              {isLoadingContacts ? (
                <span className="h-4 bg-app-dark-700 rounded w-32 animate-pulse" />
              ) : (
                <span>{totalContacts.toLocaleString()} contactos totales</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton onClick={handleRefresh} disabled={isFetchingContacts} tooltip="Actualizar" aria-label="Actualizar contactos">
            <RefreshCw className={cn('h-4 w-4', isFetchingContacts && 'animate-spin')} />
          </IconButton>
          <Dropdown trigger={<IconButton tooltip="Exportar / Importar" aria-label="Opciones de exportación e importación"><FileDown className="h-4 w-4" /></IconButton>} items={exportDropdownItems} align="end" size="sm" />
          <Button onClick={handleCreateContact} size="sm" leftIcon={<Plus className="h-4 w-4" />} className="ml-2">
            <span className="hidden sm:inline">Nuevo Contacto</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar contactos por nombre, email o teléfono..." onClear={handleClearSearch} className="w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={cn('flex items-center gap-2')} leftIcon={<Filter className="h-4 w-4" />}>
            Filtros
          </Button>
        </div>
      </div>
      {showFilters && (
        <ContactsFilters searchCriteria={searchCriteria} onCriteriaChange={() => {}} onClose={() => setShowFilters(false)} className="border border-app-dark-600 rounded-lg p-4 bg-app-dark-800" />
      )}
      {hasSelection && (
        <ContactsBulkActions selectedCount={selectionCount} onBulkDelete={handleBulkDelete} onBulkStatusUpdate={handleBulkStatusUpdate} onDeselectAll={deselectAllContacts} isLoading={bulkOperationLoading} className="bg-app-dark-800 border border-app-dark-600 rounded-lg p-3" />
      )}
    </div>
  );

  const renderContent = () => {
    if (contactsError) {
      return (
        <ErrorMessage title="Error de conexión" message={(contactsError as Error).message} onRetry={handleRefresh} variant="destructive" />
      );
    }
    return (
      <ContactsTable
        contacts={contacts}
        isLoading={isLoadingContacts}
        totalContacts={totalContacts}
        onContactClick={handleContactClick}
        onContactEdit={handleContactEdit}
        onContactDelete={handleContactDelete}
        selectedContactIds={selectedContactIds}
        onSelectAll={() => selectAllContacts(contacts.map(c => c.id))}
        onDeselectAll={deselectAllContacts}
        pagination={{
          currentPage: currentPage + 1,
          totalPages: totalPages,
          onPageChange: (newPage) => setCurrentPage(newPage - 1),
        }}
      />
    );
  };

  return (
    <Page title="Contactos" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contactos' }]} className="space-y-6">
      {renderHeader()}
      {renderContent()}
    {/* Diálogo de Confirmación de Borrado */}
    {contactToDelete && (
        <ConfirmDialog
          isOpen={!!contactToDelete}
          onClose={() => setContactToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={`Eliminar a ${getFullName(contactToDelete)}`}
          description="Esta acción moverá el contacto a la papelera. ¿Estás seguro?"
          confirmLabel="Sí, eliminar"
          isConfirming={deleting.has(contactToDelete.id)} // Necesitamos ajustar el hook
        />
      )}
    </Page>
  );
};

export default ContactListPage;
