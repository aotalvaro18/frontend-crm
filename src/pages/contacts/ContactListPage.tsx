// src/pages/contacts/ContactListPage.tsx
// Contact list page enterprise - Arquitectura limpia y desacoplada

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Download, RefreshCw } from 'lucide-react';

// ============================================
// HOOKS DESACOPLADOS (siguiendo tu arquitectura)
// ============================================

// Store hooks
import { 
  useContacts,
  useBulkOperations,
  useContactStats,
  useImportExport,
  useContactErrorHandler,
  useContactSearch,
  useOperationStates,
  useConnectionStatus,
} from '@/stores/contactStore';

// Custom hooks
import { useTablePagination } from '@/hooks/usePagination';
import { useSearchDebounce } from '@/hooks/useDebounce';
import { useAutoSync } from '@/hooks/useOfflineSync';

// ============================================
// COMPONENTES DESACOPLADOS
// ============================================

// Components especializados (deberían estar en archivos separados)
import ContactsHeader from '../../components/contacts/ContactsHeader';
import ContactsSearchBar from '../../components/contacts/ContactsSearchBar';
import ContactsFilters from '../../components/contacts/ContactsFilters';
import ContactsStatsCards from '../../components/contacts/ContactsStatsCards';
import ContactsBulkActions from '../../components/contacts/ContactsBulkActions';
import ContactsTable from '../../components/contacts/ContactsTable';
import ContactsEmptyState from '../../components/contacts/ContactsEmptyState';
import ContactsPagination from '../../components/contacts/ContactsPagination';

// UI Components
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Page from '@/components/layout/Page';

// Types
import type { ContactSearchCriteria } from '@/types/contact.types';

// ============================================
// PÁGINA PRINCIPAL - SOLO ORQUESTACIÓN
// ============================================

const ContactListPage: React.FC = () => {
  const navigate = useNavigate();

  // ============================================
  // HOOKS DESACOPLADOS (Estado distribuido)
  // ============================================

  // Data hooks
  const { 
    contacts, 
    loading, 
    error, 
    totalContacts,
    searchContacts,
    refreshContacts 
  } = useContacts();

  // Selection hooks
  const { 
    selectedContactIds,
    hasSelection,
    selectionCount,
    bulkOperationLoading
  } = useBulkOperations();

  // Stats hooks
  const { stats, loadStats } = useContactStats();

  // Search hooks
  const { 
    searchCriteria, 
    setSearchCriteria, 
    hasActiveFilters 
  } = useContactSearch();

  // Operation state hooks
  const { updating, deleting } = useOperationStates();

  // Connection hooks
  const { isOnline } = useConnectionStatus();

  // Error handling hooks
  const { clearError } = useContactErrorHandler();

  // Import/Export hooks
  const { exportContacts } = useImportExport();

  // Custom pagination hook
  const pagination = useTablePagination(totalContacts);

  // Auto-sync hook
  useAutoSync();

  // Search debounce hook
  const { debouncedSearch, isSearching } = useSearchDebounce();

  // ============================================
  // EFECTOS SIMPLES
  // ============================================

  // Cargar datos iniciales
  useEffect(() => {
    searchContacts();
    loadStats();
  }, [searchContacts, loadStats]);

  // Actualizar paginación cuando cambien los totales
  useEffect(() => {
    pagination.setTotalItems(totalContacts);
  }, [totalContacts, pagination.setTotalItems]);

  // ============================================
  // HANDLERS SIMPLES (Delegar a hooks)
  // ============================================

  const handleSearch = (criteria: ContactSearchCriteria) => {
    debouncedSearch(criteria);
  };

  const handleFilter = (filters: ContactSearchCriteria) => {
    setSearchCriteria(filters);
    searchContacts(filters, 0);
  };

  const handlePageChange = (page: number) => {
    searchContacts(searchCriteria, page);
    pagination.goToPage(page);
  };

  const handleRefresh = () => {
    refreshContacts();
    loadStats();
  };

  const handleExport = (format: 'csv' | 'excel') => {
    exportContacts(format, searchCriteria);
  };

  const handleCreateContact = () => {
    navigate('/contacts/create');
  };

  // ============================================
  // ESTADO COMPUTADO SIMPLE
  // ============================================

  const isEmpty = !loading && contacts.length === 0 && !hasActiveFilters;
  const isFiltered = hasActiveFilters && contacts.length === 0;
  const hasResults = contacts.length > 0;

  // ============================================
  // RENDERIZADO CONDICIONAL LIMPIO
  // ============================================

  // Error state
  if (error) {
    return (
      <Page title="Contactos">
        <ErrorMessage 
          title="Error al cargar contactos"
          message={error}
          onRetry={() => {
            clearError();
            searchContacts();
          }}
        />
      </Page>
    );
  }

  // ============================================
  // RENDERIZADO PRINCIPAL - SOLO COMPOSICIÓN
  // ============================================

  return (
    <Page title="Contactos">
      <div className="space-y-6">
        {/* Header con acciones principales */}
        <ContactsHeader
          totalContacts={totalContacts}
          isOnline={isOnline}
          onCreateContact={handleCreateContact}
          onExport={handleExport}
          loading={loading}
        />

        {/* Stats cards */}
        {stats && (
          <ContactsStatsCards stats={stats} />
        )}

        {/* Search y filtros */}
        <div className="space-y-4">
          <ContactsSearchBar
            onSearch={handleSearch}
            isSearching={isSearching}
            searchCriteria={searchCriteria}
          />

          <div className="flex items-center justify-between">
            <ContactsFilters
              searchCriteria={searchCriteria}
              onApplyFilters={handleFilter}
              hasActiveFilters={hasActiveFilters}
            />

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Bulk actions */}
        {hasSelection && (
          <ContactsBulkActions
            selectedCount={selectionCount}
            selectedIds={selectedContactIds}
            loading={bulkOperationLoading}
          />
        )}

        {/* Contenido principal */}
        {loading && contacts.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : isEmpty ? (
          <ContactsEmptyState onCreateContact={handleCreateContact} />
        ) : isFiltered ? (
          <ContactsEmptyState 
            type="filtered"
            onClearFilters={() => handleFilter({})}
          />
        ) : hasResults ? (
          <>
            <ContactsTable
              contacts={contacts}
              selectedIds={selectedContactIds}
              updating={updating}
              deleting={deleting}
              onContactClick={(id) => navigate(`/contacts/${id}`)}
              onEditContact={(id) => navigate(`/contacts/${id}/edit`)}
            />

            {pagination.totalPages > 1 && (
              <ContactsPagination
                pagination={pagination}
                onPageChange={handlePageChange}
                totalContacts={totalContacts}
              />
            )}
          </>
        ) : null}
      </div>
    </Page>
  );
};

export default ContactListPage;