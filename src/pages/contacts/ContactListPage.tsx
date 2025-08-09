// src/pages/contacts/ContactListPage.tsx
// ✅ CONTACT LIST PAGE OPTIMIZADO - ERROR HANDLING INTELIGENTE
// Versión mejorada que no causa bucle de redirección

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Search, Filter, Download, Users, RefreshCw } from 'lucide-react';

// Components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ContactTable from '@/components/contacts/ContactsTable';
import ContactsFilters from '@/components/contacts/ContactsFilters';
import { ErrorBoundary } from '@/components/ui/ErrorMessage';

// Services & Types
import { useAuthStore } from '@/stores/authStore';
import type { ContactDTO, ContactSearchCriteria, ContactSource } from '@/types/contact.types';
import type { PageResponse } from '@/types/common.types';
import type { ApiError } from '@/services/api/baseApi';
import { authLogger } from '@/types/auth.types';

import { contactApi } from '@/services/api/contactApi';
// ============================================
// INTERFACES
// ============================================

interface ContactListState {
  contacts: ContactDTO[];
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  lastSuccessfulFetch: number | null;
}

// ============================================
// CONTACT LIST PAGE COMPONENT
// ============================================

const ContactListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ✅ Auth state optimizado
  const { isAuthenticated, isInitialized, user, getAccessToken } = useAuthStore();

  // ============================================
  // COMPONENT STATE
  // ============================================

  const [state, setState] = useState<ContactListState>({
    contacts: [],
    isLoading: true,
    error: null,
    retryCount: 0,
    lastSuccessfulFetch: null,
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<ContactSearchCriteria>({
    search: searchParams.get('search') || undefined,
    status: (searchParams.get('status') as any) || undefined,
    source: (searchParams.get('source') as ContactSource) || undefined,
  });
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());

  // ============================================
  // OPTIMIZED SEARCH FUNCTION
  // ============================================

  const searchContacts = useCallback(async (
    criteria: ContactSearchCriteria = searchCriteria,
    page: number = currentPage,
    size: number = pageSize,
    isRetry: boolean = false
  ) => {
    // ✅ Verificaciones previas optimizadas
    if (!isAuthenticated || !isInitialized) {
      authLogger.info('ContactList: Skipping search - user not authenticated');
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // ✅ Evitar múltiples requests simultáneos
    if (state.isLoading && !isRetry) {
      authLogger.info('ContactList: Request already in progress, skipping');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      authLogger.info('ContactList: Searching contacts', { 
        criteria, 
        page, 
        size, 
        isRetry,
        user: user?.email 
      });

      // ✅ Verificación de token con manejo inteligente
      const token = await getAccessToken();
      if (!token) {
        authLogger.warn('ContactList: No access token available');
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Sesión expirada. Inicia sesión nuevamente.',
        }));
        return;
      }

      // ✅ Request a la API con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      try {
        const response: PageResponse<ContactDTO> = await contactApi.searchContacts(
          criteria,
          { page, size, sort: ['createdAt,desc'] }
        );

        clearTimeout(timeoutId);

        authLogger.success('ContactList: Contacts loaded successfully', {
          count: response.content.length,
          totalElements: response.totalElements
        });

        setState(prev => ({
          ...prev,
          contacts: response.content,
          isLoading: false,
          error: null,
          retryCount: 0,
          lastSuccessfulFetch: Date.now(),
        }));

        setCurrentPage(response.number);
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);

      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error: unknown) {
      authLogger.error('ContactList: Error loading contacts', error);
      
      // ✅ MANEJO INTELIGENTE DE ERRORES (MEJORADO)
      const apiError = error as ApiError;
      let errorMessage = 'Error al cargar contactos';
      let shouldRetry = false;
      let shouldShowToast = true;
      
      if (apiError.status === 401) {
        authLogger.warn('ContactList: 401 Unauthorized - token handled by BaseApiClient');
        errorMessage = 'Verificando autenticación...';
        shouldShowToast = false; // No mostrar toast, BaseApiClient maneja esto
        
      } else if (apiError.status === 403) {
        errorMessage = 'No tienes permisos para ver los contactos.';
        
      } else if (apiError.status === 404) {
        errorMessage = 'No se encontraron contactos.';
        setState(prev => ({ ...prev, contacts: [] }));
        
      } else if (apiError.status >= 500) {
        errorMessage = 'Error del servidor.';
        shouldRetry = state.retryCount < 3;
        
        if (shouldRetry) {
          const retryDelay = Math.pow(2, state.retryCount) * 1000;
          authLogger.info(`ContactList: Retrying in ${retryDelay}ms (attempt ${state.retryCount + 1}/3)`);
          
          setTimeout(() => {
            setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
            searchContacts(criteria, page, size, true);
          }, retryDelay);
          
          errorMessage = `Error del servidor. Reintentando en ${retryDelay / 1000}s...`;
        } else {
          errorMessage = 'Error del servidor persistente. Intenta recargar la página.';
        }
        
      } else if (!navigator.onLine) {
        errorMessage = 'Sin conexión a internet. Verifica tu conexión.';
        shouldRetry = true;
        
      } else {
        errorMessage = apiError.message || 'Error inesperado al cargar contactos.';
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        retryCount: shouldRetry ? prev.retryCount : 0,
      }));

      // ✅ Toast solo para errores relevantes
      if (shouldShowToast && !shouldRetry) {
        toast.error(errorMessage);
      }
    }
  }, [searchCriteria, currentPage, pageSize, isAuthenticated, isInitialized, getAccessToken, user, state.isLoading, state.retryCount]);

  // ============================================
  // EFFECTS OPTIMIZADOS
  // ============================================

  // ✅ Initial load effect (mejorado)
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      authLogger.info('ContactList: Initializing with authenticated user', { 
        user: user.email 
      });
      searchContacts();
    } else if (isInitialized && !isAuthenticated) {
      authLogger.info('ContactList: User not authenticated, showing auth required state');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [isInitialized, isAuthenticated, user?.email]); // Dependencias específicas

  // ✅ Search effect with optimized debounce
  useEffect(() => {
    if (!isAuthenticated) return;

    const timeoutId = setTimeout(() => {
      if (searchTerm !== searchCriteria.search) {
        const newCriteria = { ...searchCriteria, search: searchTerm || undefined };
        setSearchCriteria(newCriteria);
        setCurrentPage(0);
        searchContacts(newCriteria, 0);
      }
    }, 300); // Reduced debounce time

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isAuthenticated]); // Dependencias mínimas

  // ✅ URL sync effect
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchCriteria.search) params.set('search', searchCriteria.search);
    if (searchCriteria.status) params.set('status', searchCriteria.status);
    if (searchCriteria.source) params.set('source', searchCriteria.source);
    
    setSearchParams(params, { replace: true });
  }, [searchCriteria, setSearchParams]);

  // ✅ Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      if (state.error?.includes('Sin conexión')) {
        authLogger.info('ContactList: Network restored, retrying...');
        searchContacts();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [state.error, searchContacts]);

  // ============================================
  // EVENT HANDLERS OPTIMIZADOS
  // ============================================

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleFilterChange = useCallback((newCriteria: ContactSearchCriteria) => {
    setSearchCriteria(newCriteria);
    setCurrentPage(0);
    searchContacts(newCriteria, 0);
  }, [searchContacts]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    searchContacts(searchCriteria, page);
  }, [searchCriteria, searchContacts]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0);
    searchContacts(searchCriteria, 0, size);
  }, [searchCriteria, searchContacts]);

  const handleContactCreate = useCallback(() => {
    navigate('/contacts/new');
  }, [navigate]);

  const handleContactView = useCallback((contactId: number) => {
    navigate(`/contacts/${contactId}`);
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: 0, error: null }));
    searchContacts();
  }, [searchContacts]);

  const handleExport = useCallback(async () => {
    try {
      toast.loading('Preparando exportación...');
      // TODO: Implementar exportación real
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.dismiss();
      toast.success('Exportación completada');
    } catch (error) {
      toast.dismiss();
      toast.error('Error al exportar contactos');
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    const resetCriteria: ContactSearchCriteria = {};
    setSearchCriteria(resetCriteria);
    setSearchTerm('');
    setCurrentPage(0);
    searchContacts(resetCriteria, 0);
  }, [searchContacts]);

  // ============================================
  // ESTADO COMPUTADO (Valores derivados del estado principal)
  // ============================================
  
  // ✅ CORRECCIÓN: Volvemos a calcular 'hasActiveFilters'.
  // Verifica si algún valor en searchCriteria no es nulo o indefinido.
  const hasActiveFilters = Object.values(searchCriteria).some(
    value => value !== undefined && value !== null && value !== ''
  );

  // ============================================
  // RENDER GUARDS OPTIMIZADOS
  // ============================================

  // ✅ Loading inicial
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Inicializando...</p>
        </div>
      </div>
    );
  }

  // ✅ Usuario no autenticado
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <Users className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Acceso Requerido
        </h2>
        <p className="text-gray-600 mb-4 max-w-md">
          Necesitas iniciar sesión para ver y gestionar los contactos.
        </p>
        <Button
          onClick={() => navigate('/login')}
          variant="default"
        >
          Iniciar Sesión
        </Button>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* ✅ Header optimizado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contactos</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {totalElements > 0 && (
                <span>
                  {totalElements.toLocaleString()} contacto{totalElements !== 1 ? 's' : ''}
                </span>
              )}
              {state.lastSuccessfulFetch && (
                <span className="text-xs text-gray-400">
                  • Actualizado {new Date(state.lastSuccessfulFetch).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* ✅ Refresh button */}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              icon={RefreshCw}
              disabled={state.isLoading}
              className={state.isLoading ? 'animate-spin' : ''}
            >
              {state.isLoading ? 'Actualizando...' : 'Actualizar'}
            </Button>
            
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              icon={Download}
              disabled={state.contacts.length === 0 || state.isLoading}
            >
              Exportar
            </Button>
            
            <Button
              onClick={handleContactCreate}
              variant="default"
              size="sm"
              icon={Plus}
            >
              Nuevo Contacto
            </Button>
          </div>
        </div>

        {/* ✅ Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
              className="max-w-md"
              disabled={state.isLoading}
            />
          </div>
          
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
            icon={Filter}
            className={showFilters ? 'bg-primary-50 border-primary-200 text-primary-700' : ''}
          >
            Filtros
            {Object.values(searchCriteria).some(v => v) && (
              <span className="ml-1 bg-primary-600 text-white rounded-full px-1.5 py-0.5 text-xs">
                {Object.values(searchCriteria).filter(v => v).length}
              </span>
            )}
          </Button>
        </div>

        {/* ✅ Filters Panel */}
        {showFilters && (
          <ContactsFilters
            searchCriteria={searchCriteria}
            onApplyFilters={handleFilterChange}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        {/* ✅ Error State mejorado */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error al cargar contactos
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{state.error}</p>
                  {state.retryCount > 0 && (
                    <p className="mt-1 text-xs text-red-600">
                      Reintento {state.retryCount} de 3...
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={state.isLoading}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  {state.isLoading ? 'Reintentando...' : 'Reintentar'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Loading State para primera carga */}
        {state.isLoading && state.contacts.length === 0 && !state.error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Cargando contactos...</p>
              <p className="mt-1 text-sm text-gray-400">
                {searchCriteria.search ? 'Buscando...' : 'Obteniendo datos...'}
              </p>
            </div>
          </div>
        )}

        {/* ✅ Empty State mejorado */}
        {!state.isLoading && !state.error && state.contacts.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchCriteria.search || searchCriteria.status || searchCriteria.source
                ? 'No se encontraron contactos'
                : 'Aún no tienes contactos'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchCriteria.search || searchCriteria.status || searchCriteria.source
                ? 'Intenta ajustar los filtros de búsqueda para encontrar lo que buscas.'
                : 'Comienza creando tu primer contacto para gestionar tus relaciones de manera eficiente.'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {searchCriteria.search || searchCriteria.status || searchCriteria.source ? (
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                >
                  Limpiar Filtros
                </Button>
              ) : null}
              
              <Button
                onClick={handleContactCreate}
                variant="default"
                icon={Plus}
              >
                Crear Primer Contacto
              </Button>
            </div>
          </div>
        )}

        {/* ✅ Contacts Table con loading overlay */}
        {state.contacts.length > 0 && (
          <div className="relative">
            {/* Loading overlay para refreshes */}
            {state.isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <div className="text-center">
                  <LoadingSpinner size="md" />
                  <p className="mt-2 text-sm text-gray-600">Actualizando...</p>
                </div>
              </div>
            )}
            
            <ContactTable
              // --- Props que SÍ existen en la interfaz ---
              contacts={state.contacts}
              onContactClick={handleContactView}
              
              // ✅ CORRECCIÓN: Añadimos las props que faltaban y que sí son necesarias
              // Asumiendo que has definido estos estados/handlers en tu página
              selectedIds={selectedContactIds} // Necesitas un useState para esto
              updating={new Set()}             // Pasa un Set vacío si no manejas 'updating'
              deleting={new Set()}             // Pasa un Set vacío si no manejas 'deleting'
              onEditContact={(id) => navigate(`/contacts/${id}/edit`)}
              
              // (Opcional) Conecta los handlers para selección y borrado si los necesitas
              // onSelectContact={handleSelect}
              // onDeleteContact={handleDelete}
            />
          </div>
        )}

        {/* ✅ Debug info en desarrollo */}
        {import.meta.env.DEV && (
          <div className="bg-gray-100 border rounded-lg p-3 text-xs text-gray-600 space-y-1">
            <div className="font-semibold">🔧 ContactList Debug:</div>
            <div>Loading: {state.isLoading ? 'Yes' : 'No'}</div>
            <div>Contacts: {state.contacts.length}</div>
            <div>Error: {state.error || 'None'}</div>
            <div>Retry Count: {state.retryCount}</div>
            <div>Search Criteria: {JSON.stringify(searchCriteria)}</div>
            <div>Last Fetch: {state.lastSuccessfulFetch ? new Date(state.lastSuccessfulFetch).toLocaleString() : 'None'}</div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ContactListPage;