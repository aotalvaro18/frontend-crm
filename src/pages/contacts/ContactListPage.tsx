// src/pages/contacts/ContactListPage.tsx
// ✅ CONTACT LIST PAGE - VERSIÓN EXCEPCIONAL
// Refinamientos arquitectónicos para código extraordinario

import React, { useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Filter, 
  RefreshCw, 
  X,
  FileDown,
  Upload,
  Users
} from 'lucide-react';

// ============================================
// UI COMPONENTS
// ============================================

import { Button, IconButton } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge, CountBadge } from '@/components/ui/Badge';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Dropdown from '@/components/ui/Dropdown';

// ============================================
// CONTACT COMPONENTS
// ============================================

import ContactsTable from '@/components/contacts/ContactsTable';
import ContactsFilters from '@/components/contacts/ContactsFilters';
import ContactsBulkActions from '@/components/contacts/ContactsBulkActions';
import ContactsStatsCards from '@/components/contacts/ContactsStatsCards';

// ============================================
// LAYOUT
// ============================================

import Page from '@/components/layout/Page';

// ============================================
// HOOKS - ÚNICA FUENTE DE VERDAD
// ============================================

import {
  useContacts,
  useBulkOperations,
  useContactStats,
  useImportExport,
  useContactSearch,
  useConnectionStatus
} from '@/hooks/useContacts';

import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination'; // ✅ ÚNICA fuente de verdad para paginación
import { useErrorHandler } from '@/hooks/useErrorHandler';

// ============================================
// TYPES
// ============================================

import type { ContactDTO, ContactStatus } from '@/types/contact.types';

// ============================================
// UTILS
// ============================================

import { cn } from '@/utils/cn';

// ============================================
// MAIN COMPONENT
// ============================================

const ContactListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ============================================
  // HOOKS - RESPONSABILIDAD ÚNICA
  // ============================================

  // Core contact data
  const {
    totalContacts,
    searchContacts,
    refreshContacts,
    error: contactsError // Solo errores catastróficos de red
  } = useContacts();

  // Search state
  const {
    searchCriteria,
    setSearchCriteria,
    hasActiveFilters
  } = useContactSearch();

  // Bulk operations
  const {
    hasSelection,
    selectionCount,
    bulkOperationLoading,
    deselectAllContacts,
    bulkUpdateContacts,
    bulkDeleteContacts
  } = useBulkOperations();

  // Stats
  const { stats, loadStats } = useContactStats();

  // Import/Export
  const { exportContacts } = useImportExport();

  // Connection status
  const { isOnline } = useConnectionStatus();

  // Error handling
  const { handleError } = useErrorHandler();

  // ✅ REFINAMIENTO 1: usePagination como ÚNICA fuente de verdad
  const {
    currentPage,
    setCurrentPage,
    resetToFirstPage
  } = usePagination({
    totalItems: totalContacts,
    defaultPageSize: 25
  });

  // ============================================
  // LOCAL STATE - SOLO UI SIMPLE
  // ============================================

  const [searchTerm, setSearchTerm] = React.useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Debounced search
  const { debouncedValue: debouncedSearchTerm } = useDebounce(searchTerm, 300);

  // ============================================
  // EFFECTS - RESPONSABILIDAD ÚNICA
  // ============================================

  // ✅ CORRECCIÓN: Un único effect para la lógica de búsqueda.
  // Se dispara SOLO cuando el término de búsqueda (debounced) o la página cambian.
  useEffect(() => {
    // Construimos los criterios aquí dentro, usando los últimos valores
    const criteria = {
      search: debouncedSearchTerm || undefined,
    };
    
    // Llamamos a la API con los criterios actuales
    searchContacts(criteria, currentPage);

    // Sincronizamos el estado de los filtros
    setSearchCriteria(criteria);

  }, [debouncedSearchTerm, currentPage, searchContacts, setSearchCriteria]);

  // Effect para stats (solo stats)
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Effect para URL sync (solo URL)
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (currentPage > 0) params.set('page', currentPage.toString());
    
    setSearchParams(params, { replace: true });
  }, [searchTerm, currentPage, setSearchParams]);

  // ============================================
  // HANDLERS - CLEAN & FOCUSED
  // ============================================

  const handleCreateContact = useCallback(() => {
    navigate('/contacts/create');
  }, [navigate]);

  const handleContactClick = useCallback((contact: ContactDTO) => {
    navigate(`/contacts/${contact.id}`);
  }, [navigate]);

  const handleContactEdit = useCallback((contact: ContactDTO) => {
    navigate(`/contacts/${contact.id}/edit`);
  }, [navigate]);

  const handleContactDelete = useCallback((contact: ContactDTO) => {
    // TODO: Implement delete confirmation modal
    console.log('Delete contact:', contact.id);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshContacts(),
        loadStats()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshContacts, loadStats]);

  const handleExport = useCallback(async (format: 'csv' | 'excel') => {
    try {
      await exportContacts(format, searchCriteria);
    } catch (error) {
      handleError(error, 'Error al exportar contactos');
    }
  }, [exportContacts, searchCriteria, handleError]);

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
    resetToFirstPage();
  }, [resetToFirstPage]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSearchCriteria({});
    resetToFirstPage();
    setShowFilters(false);
  }, [setSearchCriteria, resetToFirstPage]);

  // ============================================
  // DROPDOWN ITEMS
  // ============================================

  const exportDropdownItems = [
    {
      id: 'export-csv',
      label: 'Exportar CSV',
      icon: FileDown,
      onClick: () => handleExport('csv'),
    },
    {
      id: 'export-excel', 
      label: 'Exportar Excel',
      icon: FileDown,
      onClick: () => handleExport('excel'),
    },
    {
      type: 'separator' as const
    },
    {
      id: 'import',
      label: 'Importar contactos',
      icon: Upload,
      onClick: () => navigate('/contacts/import'),
    }
  ];

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderHeader = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      {/* ✅ CORRECCIÓN: Renderizamos siempre. El componente interno maneja su propio estado de carga. */}
      <ContactsStatsCards 
        stats={stats}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      />
  
      {/* Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-crm-contact-500/10 rounded-lg">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-crm-contact-500" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-app-gray-100">
              Contactos
            </h1>
            <div className="flex items-center gap-2 text-sm text-app-gray-400">
              {/* ✅ CORRECCIÓN CLAVE: Guardia añadido para el contador, previene el crash. */}
              {/* Muestra un esqueleto de carga mientras los datos no están listos. */}
              {typeof totalContacts === 'number' ? (
                <span>{totalContacts.toLocaleString()} contactos totales</span>
              ) : (
                <span className="h-4 bg-app-dark-700 rounded w-32 animate-pulse" />
              )}
              {!isOnline && (
                <Badge variant="warning" size="sm">Sin conexión</Badge>
              )}
            </div>
          </div>
        </div>
  
        <div className="flex items-center gap-1">
          {/* Refresh */}
          <IconButton
            variant="ghost"
            onClick={handleRefresh}
            disabled={isRefreshing}
            tooltip="Actualizar"
            aria-label="Actualizar contactos"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </IconButton>
  
          {/* Export */}
          <Dropdown
            trigger={
              <IconButton
                variant="ghost"
                tooltip="Exportar / Importar"
                aria-label="Opciones de exportación e importación"
              >
                <FileDown className="h-4 w-4" />
              </IconButton>
            }
            items={exportDropdownItems}
            align="end"
            size="sm"
          />
  
          {/* Create - Único botón con texto */}
          <Button
            onClick={handleCreateContact}
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            className="ml-2"
          >
            <span className="hidden sm:inline">Nuevo Contacto</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>
  
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar contactos por nombre, email o teléfono..."
            onClear={handleClearSearch}
            className="w-full"
          />
        </div>
  
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2',
              hasActiveFilters && 'border-app-accent-500 text-app-accent-500'
            )}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filtros
            {hasActiveFilters && (
              <CountBadge count={Object.keys(searchCriteria).length} variant="info" />
            )}
          </Button>
  
          {hasActiveFilters && (
            <IconButton
              variant="ghost"
              onClick={handleClearFilters}
              tooltip="Limpiar filtros"
              aria-label="Limpiar todos los filtros"
            >
              <X className="h-4 w-4" />
            </IconButton>
          )}
        </div>
      </div>
  
      {/* Filters Panel */}
      {showFilters && (
        <ContactsFilters
          searchCriteria={searchCriteria}
          onCriteriaChange={setSearchCriteria}
          onClose={() => setShowFilters(false)}
          className="border border-app-dark-600 rounded-lg p-4 bg-app-dark-800"
        />
      )}
  
      {/* Bulk Actions */}
      {hasSelection && (
        <ContactsBulkActions
          selectedCount={selectionCount}
          onBulkDelete={handleBulkDelete}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onDeselectAll={deselectAllContacts}
          isLoading={bulkOperationLoading}
          className="bg-app-dark-800 border border-app-dark-600 rounded-lg p-3"
        />
      )}
    </div>
  );

  // ✅ REFINAMIENTO 3: renderContent simplificado - SOLO errores catastróficos
  const renderContent = () => {
    // Solo manejamos errores de red catastróficos
    // ContactsTable maneja sus propios estados (loading, empty, search results, etc.)
    if (contactsError) {
      return (
        <ErrorMessage
          title="Error de conexión"
          message="No se pudo conectar con el servidor. Verifica tu conexión a internet."
          onRetry={handleRefresh}
          className="bg-app-dark-800 border border-app-dark-600 rounded-lg"
          variant="destructive"
        />
      );
    }

    // ✅ ContactsTable maneja TODO su estado internamente
    return (
      <ContactsTable
        onContactClick={handleContactClick}
        onContactEdit={handleContactEdit}
        onContactDelete={handleContactDelete}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        stickyHeader={false}
        mobileView="cards"
      />
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <Page
      title="Contactos"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Contactos' }
      ]}
      className="space-y-6"
    >
      {renderHeader()}
      {renderContent()}

      {/* Development Debug Panel */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 bg-app-dark-900 border border-app-dark-700 rounded-lg text-xs text-app-gray-500">
          <div className="font-medium mb-2 text-app-gray-400">🔧 Debug Info:</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>Online: {isOnline ? '✅' : '❌'}</div>
            <div>Total: {totalContacts.toLocaleString()}</div>
            <div>Selected: {selectionCount}</div>
            <div>Page: {currentPage + 1}</div>
            <div>Error: {contactsError || 'None'}</div>
            <div>Search: {searchTerm || 'None'}</div>
            <div>Filters: {hasActiveFilters ? '✅' : '❌'}</div>
            <div>Refreshing: {isRefreshing ? '✅' : '❌'}</div>
            <div>Stats: {stats ? '✅' : '❌'}</div>
            <div>Bulk: {hasSelection ? `${selectionCount} selected` : 'None'}</div>
          </div>
        </div>
      )}
    </Page>
  );
};

export default ContactListPage;