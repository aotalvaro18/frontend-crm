// src/hooks/useContacts.ts
// Enterprise contact hooks - CORREGIDO TypeScript-Safe
// Mobile-first + Zustand + Optimistic Updates - Sin errores

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';

import { 
  contactApi, 
  handleContactApiError 
} from '@/services/api/contactApi';
import { APP_CONFIG } from '@/utils/constants';

import type {
  ContactDTO,
  CreateContactRequest,
  UpdateContactRequest,
  ContactSearchCriteria,
  ContactStats,
} from '@/types/contact.types';

import type { 
  BulkOperationResult 
} from '@/types/api.types';

import type { PageRequest } from '@/types/common.types';

// ✅ Definir las llaves de caché de forma centralizada
const CONTACTS_LIST_QUERY_KEY = ['contacts'];
const contactDetailQueryKey = (id: number) => ['contact', id];

// ============================================
// CONTACT STORE STATE
// ============================================

interface ContactState {
  // ============================================
  // DATA STATE (Core data)
  // ============================================
  contacts: ContactDTO[];
  selectedContact: ContactDTO | null;
  totalContacts: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  searchCriteria: ContactSearchCriteria;
  
  // ============================================
  // UI STATE (Mobile-optimized)
  // ============================================
  loading: boolean;
  error: string | null;
  lastError: unknown; // Para debugging
  
  // Operation states (granular)
  creating: boolean;
  updating: Set<number>;
  deleting: Set<number>;
  
  // ============================================
  // SELECTION & BULK OPERATIONS
  // ============================================
  selectedContactIds: Set<number>;
  bulkOperationLoading: boolean;
  lastBulkOperation: string | null;
  
  // ============================================
  // STATS & ANALYTICS
  // ============================================
  stats: ContactStats | null;
  statsLoading: boolean;
  statsLastUpdated: number | null;
  
  // ============================================
  // CONNECTION STATE (Mobile-critical)
  // ============================================
  isOffline: boolean;
  isSyncing: boolean;
  hasUnsyncedChanges: boolean;
  
  // ============================================
  // ACTIONS - SEARCH & LIST
  // ============================================
  searchContacts: (criteria?: ContactSearchCriteria, page?: number) => Promise<void>;
  refreshContacts: () => Promise<void>;
  prefetchNextPage: () => Promise<void>;
  
  // ============================================
  // ACTIONS - INDIVIDUAL OPERATIONS
  // ============================================
  getContactById: (id: number, forceRefresh?: boolean) => Promise<void>;
  createContact: (request: CreateContactRequest) => Promise<ContactDTO>;
  updateContact: (id: number, request: UpdateContactRequest) => Promise<ContactDTO>;
  deleteContact: (id: number) => Promise<void>;
  setSelectedContact: (contact: ContactDTO | null) => void;
  
  // ============================================
  // ACTIONS - PORTAL OPERATIONS
  // ============================================
  generatePortalInvitation: (contactId: number) => Promise<string>;
  resendPortalInvitation: (contactId: number) => Promise<void>;
  revokePortalAccess: (contactId: number) => Promise<void>;
  
  // ============================================
  // ACTIONS - BULK OPERATIONS
  // ============================================
  selectContact: (id: number) => void;
  selectAllContacts: () => void;
  deselectContact: (id: number) => void;
  deselectAllContacts: () => void;
  bulkUpdateContacts: (updates: Partial<Pick<ContactDTO, 'status' | 'source'>>) => Promise<void>;
  bulkDeleteContacts: () => Promise<void>;
  
  // ============================================
  // ACTIONS - EXPORT
  // ============================================
  exportContacts: (format: 'csv' | 'excel', criteria?: ContactSearchCriteria) => Promise<void>;
  
  // ============================================
  // ACTIONS - STATS
  // ============================================
  loadStats: (forceRefresh?: boolean) => Promise<void>;
  
  // ============================================
  // ACTIONS - SEARCH & FILTERS
  // ============================================
  setSearchCriteria: (criteria: ContactSearchCriteria) => void;
  clearFilters: () => void;
  
  // ============================================
  // ACTIONS - ERROR HANDLING
  // ============================================
  clearError: () => void;
  resetState: () => void;
}

// ============================================
// HELPER FUNCTIONS (TypeScript-Safe)
// ============================================

// CORREGIDO: Helper para toast warnings (no existe toast.warning)
const showWarningToast = (message: string) => {
  toast(message, {
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
    },
  });
};

// CORREGIDO: Helper para merge seguro de contactos (evita conflictos de tipos)
const safeUpdateContact = (
    contact: ContactDTO,
    updates: Record<string, unknown>
  ): ContactDTO => {
    return { ...contact, ...updates };
  };

// ============================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================

export const useContactStore = create<ContactState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // ============================================
      // INITIAL STATE
      // ============================================
      contacts: [],
      selectedContact: null,
      totalContacts: 0,
      currentPage: 0,
      pageSize: APP_CONFIG.DEFAULT_PAGE_SIZE,
      totalPages: 0,
      searchCriteria: {},
      
      // UI State
      loading: false,
      error: null,
      lastError: null,
      
      // Operation states
      creating: false,
      updating: new Set(),
      deleting: new Set(),
      
      // Selection
      selectedContactIds: new Set(),
      bulkOperationLoading: false,
      lastBulkOperation: null,
      
      // Stats
      stats: null,
      statsLoading: false,
      statsLastUpdated: null,
      
      // Connection
      isOffline: false,
      isSyncing: false,
      hasUnsyncedChanges: false,

      // ============================================
      // SEARCH & LIST ACTIONS
      // ============================================
      
      searchContacts: async (criteria = {}, page = 0) => {
        set({ loading: true, error: null });
        
        try {
          const currentCriteria = { ...get().searchCriteria, ...criteria };
          const pagination: PageRequest = {
            page,
            size: get().pageSize,
            sort: ['lastName,asc', 'firstName,asc'],
          };

          const response = await contactApi.searchContacts(currentCriteria, pagination);
          
          set({
            contacts: response.content,
            totalContacts: response.totalElements,
            currentPage: response.number,
            totalPages: response.totalPages,
            searchCriteria: currentCriteria,
            loading: false,
          });
          
        } catch (error: unknown) {
          const errorInfo = handleContactApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            loading: false,
          });
          
          // Solo mostrar toast si no es un error de red que se puede reintentar
          if (errorInfo.type !== 'network_error') {
            toast.error(errorInfo.message);
          }
        }
      },

      refreshContacts: async () => {
        const { searchCriteria, currentPage } = get();
        await get().searchContacts(searchCriteria, currentPage);
      },

      prefetchNextPage: async () => {
        const { searchCriteria, currentPage, totalPages, loading } = get();
        
        // Solo prefetch si no estamos cargando y hay más páginas
        if (loading || currentPage >= totalPages - 1) return;
        
        try {
          const nextPage = currentPage + 1;
          const pagination: PageRequest = {
            page: nextPage,
            size: get().pageSize,
            sort: ['lastName,asc', 'firstName,asc'],
          };
          
          // Prefetch silencioso (no actualizar el estado)
          await contactApi.searchContacts(searchCriteria, pagination);
        } catch {
          // Ignorar errores en prefetch
        }
      },

      // ============================================
      // INDIVIDUAL CONTACT ACTIONS
      // ============================================
      
      getContactById: async (id: number) => {
        set({ loading: true, selectedContact: null }); // Se ajusta el estado de carga
        
        try {
          const contact = await contactApi.getContactById(id);
          
          // Invalida la caché de la lista para asegurar consistencia
          await queryClient.invalidateQueries({ queryKey: CONTACTS_LIST_QUERY_KEY });
          
          // Actualización atómica del estado de Zustand
          set(state => ({
            selectedContact: contact,
            contacts: state.contacts.map(c => c.id === id ? contact : c),
            loading: false,
          }));

        } catch (error: unknown) {
          const errorInfo = handleContactApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            loading: false,
          });
          toast.error(errorInfo.message);
        }
      },

      createContact: async (request: CreateContactRequest) => {
        set({ creating: true, error: null });
        
        try {
          const newContact = await contactApi.createContact(request);

          // Invalidar la caché de la lista para que la próxima carga sea fresca
          await queryClient.invalidateQueries({ queryKey: CONTACTS_LIST_QUERY_KEY });
          
          // Opcional pero recomendado: Refrescar la lista actual para ver el cambio de inmediato
          await get().refreshContacts();

          set({ creating: false });
          
          toast.success('Contacto creado exitosamente');
          return newContact;
          
          } catch (error: unknown) {
          const errorInfo = handleContactApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            creating: false,
          });
          
          if (errorInfo.type === 'validation_error') {
            toast.error('Revisa los datos ingresados');
          } else {
            toast.error(errorInfo.message);
          }
          throw error;
        }
      },

      updateContact: async (id: number, request: UpdateContactRequest) => {
        // CORREGIDO: Optimistic update type-safe
        set(state => ({
          updating: new Set([...state.updating, id]),
          error: null,
        }));
        
        // CORREGIDO: Guardar lista original para rollback
        const originalContacts = [...get().contacts];
        
        // CORREGIDO: Actualizar optimísticamente con merge seguro
        set(state => ({
          contacts: state.contacts.map(contact =>
            contact.id === id ? safeUpdateContact(contact, request) : contact
          ),
        }));
        
        try {
          const updatedContact = await contactApi.updateContact(id, request);

          // Invalidar la caché de la lista Y del detalle
          await queryClient.invalidateQueries({ queryKey: CONTACTS_LIST_QUERY_KEY });
          await queryClient.invalidateQueries({ queryKey: contactDetailQueryKey(id) });
          
          // Actualizar con datos reales del servidor
          set(state => ({
            contacts: state.contacts.map(contact =>
              contact.id === id ? updatedContact : contact
            ),
            selectedContact: state.selectedContact?.id === id ? updatedContact : state.selectedContact,
            updating: new Set([...state.updating].filter(contactId => contactId !== id)),
          }));
          
          toast.success('Contacto actualizado exitosamente');
          return updatedContact;
          
        } catch (error: unknown) {
          // CORREGIDO: Revertir cambio optimista con datos originales
          set(state => ({
            contacts: originalContacts,
            updating: new Set([...state.updating].filter(contactId => contactId !== id)),
          }));
          
          const errorInfo = handleContactApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
          });
          
          if (errorInfo.type === 'concurrency_conflict') {
            toast.error('Este contacto fue modificado por otro usuario. Se actualizará automáticamente.');
            // Auto-refresh en conflictos de concurrencia
            setTimeout(() => get().getContactById(id, true), 1000);
          } else if (errorInfo.type === 'validation_error') {
            toast.error('Revisa los datos ingresados');
          } else {
            toast.error(errorInfo.message);
          }
          throw error;
        }
      },

      deleteContact: async (id: number) => {
        // 1. Iniciar estado de carga para este ID específico
        set(state => ({
          deleting: new Set([...state.deleting, id]),
          error: null, // Limpiar errores previos
        }));
        
        try {
          // 2. Llamar a la API para realizar la eliminación en el backend
          await contactApi.deleteContact(id);

          // Invalidar la caché de la lista Y del detalle
          await queryClient.invalidateQueries({ queryKey: CONTACTS_LIST_QUERY_KEY });
          await queryClient.invalidateQueries({ queryKey: contactDetailQueryKey(id) });
          
          // 3. Actualizar el estado local para reflejar el cambio INMEDIATAMENTE
          set(state => ({
            // ✅ FILTRAR LA LISTA: Esta es la lógica clave que actualiza la UI en ContactListPage
            contacts: state.contacts.filter(contact => contact.id !== id),
            
            // Si el contacto eliminado era el seleccionado, limpiarlo
            selectedContact: state.selectedContact?.id === id ? null : state.selectedContact,
            
            // Actualizar el conteo total de contactos
            totalContacts: Math.max(0, state.totalContacts - 1),
            
            // Limpiar el estado de carga para este ID
            deleting: new Set([...state.deleting].filter(contactId => contactId !== id)),
            
            // Si el contacto estaba seleccionado para una acción bulk, quitarlo
            selectedContactIds: new Set([...state.selectedContactIds].filter(contactId => contactId !== id)),
          }));
          
          // ✅ TOAST DE ÉXITO ELIMINADO: Ya no se muestra el toast genérico desde aquí.
          // El toast específico con el nombre del contacto se manejará en ContactDetailPage.
          
        } catch (error: unknown) {
          // 4. Manejo de errores
          // Limpiar el estado de carga para este ID aunque haya fallado
          set(state => ({
            deleting: new Set([...state.deleting].filter(contactId => contactId !== id)),
          }));
          
          // Procesar el error para obtener un mensaje amigable
          const errorInfo = handleContactApiError(error);
          
          // Actualizar el estado con la información del error
          set({
            error: errorInfo.message,
            lastError: error,
          });
          
          // ✅ MOSTRAR TOAST DE ERROR: Es importante notificar al usuario que la acción falló.
          toast.error(errorInfo.message || 'No se pudo eliminar el contacto.');
          
          // Re-lanzar el error para que el componente que llamó a la función (ContactDetailPage)
          // también pueda reaccionar si es necesario (ej. no cerrar un modal).
          throw error;
        }
      },

      setSelectedContact: (contact: ContactDTO | null) => {
        set({ selectedContact: contact });
      },

      // ============================================
      // PORTAL OPERATIONS
      // ============================================
      
      generatePortalInvitation: async (contactId: number) => {
        set({ loading: true, error: null });
        
        try {
          const result = await contactApi.generateMemberPortalInvitation(contactId);
          
          // Actualizar el contacto en la lista para mostrar que tiene portal
          set(state => ({
            contacts: state.contacts.map(contact =>
              contact.id === contactId 
                ? safeUpdateContact(contact, { 
                    hasDigitalPortal: true, 
                    portalInvitationSent: new Date().toISOString() 
                  })
                : contact
            ),
            selectedContact: state.selectedContact?.id === contactId 
              ? safeUpdateContact(state.selectedContact, { 
                  hasDigitalPortal: true, 
                  portalInvitationSent: new Date().toISOString() 
                })
              : state.selectedContact,
            loading: false,
          }));
          
          toast.success('Invitación de portal generada exitosamente');
          return result.invitationToken;
          
        } catch (error: unknown) {
          const errorInfo = handleContactApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            loading: false,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      resendPortalInvitation: async (contactId: number) => {
        set({ loading: true, error: null });
        
        try {
          await contactApi.resendPortalInvitation(contactId);
          set({ loading: false });
          toast.success('Invitación reenviada exitosamente');
          
        } catch (error: unknown) {
          const errorInfo = handleContactApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            loading: false,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      revokePortalAccess: async (contactId: number) => {
        set({ loading: true, error: null });
        
        try {
          await contactApi.revokePortalAccess(contactId);
          
          // Actualizar el contacto para remover acceso al portal
          set(state => ({
            contacts: state.contacts.map(contact =>
              contact.id === contactId 
                ? safeUpdateContact(contact, { hasDigitalPortal: false })
                : contact
            ),
            selectedContact: state.selectedContact?.id === contactId 
              ? safeUpdateContact(state.selectedContact, { hasDigitalPortal: false })
              : state.selectedContact,
            loading: false,
          }));
          
          toast.success('Acceso al portal revocado exitosamente');
          
        } catch (error: unknown) {
          const errorInfo = handleContactApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            loading: false,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      // ============================================
      // BULK OPERATIONS
      // ============================================
      
      selectContact: (id: number) => {
        set(state => ({
          selectedContactIds: new Set([...state.selectedContactIds, id]),
        }));
      },

      selectAllContacts: () => {
        const { contacts } = get();
        set({
          selectedContactIds: new Set(contacts.map(contact => contact.id)),
        });
      },

      deselectContact: (id: number) => {
        set(state => ({
          selectedContactIds: new Set([...state.selectedContactIds].filter(contactId => contactId !== id)),
        }));
      },

      deselectAllContacts: () => {
        set({ selectedContactIds: new Set() });
      },

      bulkUpdateContacts: async (updates: Partial<Pick<ContactDTO, 'status' | 'source'>>) => {
        const { selectedContactIds } = get();
        const contactIds = Array.from(selectedContactIds);
        
        if (contactIds.length === 0) return;
        
        set({ bulkOperationLoading: true, error: null, lastBulkOperation: 'update' });
        
        try {
          // CORREGIDO: Usar tipo correcto para el resultado
          const result = await contactApi.bulkUpdateContacts(contactIds, updates) as BulkOperationResult;
          
          // CORREGIDO: Actualizar contactos con merge seguro
          set(state => ({
            contacts: state.contacts.map(contact =>
              contactIds.includes(contact.id) ? safeUpdateContact(contact, updates) : contact
            ),
            selectedContactIds: new Set(), // Limpiar selección
            bulkOperationLoading: false,
          }));
          
          // CORREGIDO: Usar propiedades que existen
          const updatedCount = result.updated || contactIds.length - result.failed;
          toast.success(`${updatedCount} contactos actualizados exitosamente`);
          
          if (result.failed > 0) {
            showWarningToast(`${result.failed} contactos no pudieron ser actualizados`);
          }
          
        } catch (error: unknown) {
          const errorInfo = handleContactApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            bulkOperationLoading: false,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      bulkDeleteContacts: async () => {
        const { selectedContactIds } = get();
        const contactIds = Array.from(selectedContactIds);
        
        if (contactIds.length === 0) return;
        
        set({ bulkOperationLoading: true, error: null, lastBulkOperation: 'delete' });
        
        try {
          // CORREGIDO: Usar tipo correcto para el resultado
          const result = await contactApi.bulkDeleteContacts(contactIds) as BulkOperationResult;
          
          // CORREGIDO: Calcular cuántos se eliminaron correctamente
          const deletedCount = result.deleted || contactIds.length - result.failed;
          
          // Remover contactos de la lista
          set(state => ({
            contacts: state.contacts.filter(contact => !contactIds.includes(contact.id)),
            totalContacts: Math.max(0, state.totalContacts - deletedCount),
            selectedContactIds: new Set(),
            bulkOperationLoading: false,
          }));
          
          // CORREGIDO: Usar valores calculados
          toast.success(`${deletedCount} contactos eliminados exitosamente`);
          
          if (result.failed > 0) {
            showWarningToast(`${result.failed} contactos no pudieron ser eliminados`);
          }
          
        } catch (error: unknown) {
          const errorInfo = handleContactApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            bulkOperationLoading: false,
          });
          toast.error(errorInfo.message);
          throw error;
        }
      },

      // ============================================
      // EXPORT OPERATIONS
      // ============================================
      
      exportContacts: async (format: 'csv' | 'excel', criteria?: ContactSearchCriteria) => {
        set({ loading: true, error: null });
        
        try {
          const exportCriteria = criteria || get().searchCriteria;
          let blob: Blob;
          
          if (format === 'csv') {
            blob = await contactApi.exportContactsCSV(exportCriteria);
          } else {
            blob = await contactApi.exportContactsExcel(exportCriteria);
          }
          
          // Crear link de descarga
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `contactos_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          set({ loading: false });
          toast.success(`Contactos exportados como ${format.toUpperCase()}`);
          
        } catch (error: unknown) {
          const errorInfo = handleContactApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            loading: false,
          });
          toast.error(`Error al exportar: ${errorInfo.message}`);
          throw error;
        }
      },

      // ============================================
      // STATS OPERATIONS
      // ============================================
      
      loadStats: async (forceRefresh = false) => {
        const { statsLastUpdated, statsLoading } = get();
        
        // No recargar si ya están cargando o son recientes (menos de 5 minutos)
        const isStale = !statsLastUpdated || (Date.now() - statsLastUpdated > 5 * 60 * 1000);
        if (!forceRefresh && (!isStale || statsLoading)) return;
        
        set({ statsLoading: true, error: null });
        
        try {
          const stats = await contactApi.getContactStats();
          set({
            stats,
            statsLastUpdated: Date.now(),
            statsLoading: false,
          });
          
        } catch (error: unknown) {
          const errorInfo = handleContactApiError(error);
          set({
            error: errorInfo.message,
            lastError: error,
            statsLoading: false,
          });
          
          // No mostrar toast para errores de stats, son menos críticos
          console.warn('Failed to load contact stats:', errorInfo.message);
        }
      },

      // ============================================
      // SEARCH & FILTER ACTIONS
      // ============================================
      
      setSearchCriteria: (criteria: ContactSearchCriteria) => {
        set({ searchCriteria: criteria });
      },

      clearFilters: () => {
        set({ searchCriteria: {} });
        get().searchContacts({}, 0);
      },

      // ============================================
      // ERROR HANDLING & UTILITY
      // ============================================
      
      clearError: () => {
        set({ error: null, lastError: null });
      },

      resetState: () => {
        set({
          contacts: [],
          selectedContact: null,
          totalContacts: 0,
          currentPage: 0,
          totalPages: 0,
          searchCriteria: {},
          loading: false,
          error: null,
          lastError: null,
          creating: false,
          updating: new Set(),
          deleting: new Set(),
          selectedContactIds: new Set(),
          bulkOperationLoading: false,
          lastBulkOperation: null,
          stats: null,
          statsLoading: false,
          statsLastUpdated: null,
        });
      },
    })),
    {
      name: 'contact-store',
      // CORREGIDO: Tipado explícito del parámetro state
      partialize: (state: ContactState) => ({
        // Solo persistir datos no sensibles
        pageSize: state.pageSize,
        searchCriteria: state.searchCriteria,
      }),
    }
  )
);

// ============================================
// SPECIALIZED HOOKS (Para tu ContactListPage)
// ============================================

/**
 * Hook principal para contactos - Exactamente lo que usa tu ContactListPage
 */
export const useContacts = () => {
  return useContactStore(state => ({
    contacts: state.contacts,
    loading: state.loading,
    error: state.error,
    totalContacts: state.totalContacts,
    searchContacts: state.searchContacts,
    refreshContacts: state.refreshContacts,
  }));
};

/**
 * Hook para operaciones bulk - Para tu ContactListPage
 */
export const useBulkOperations = () => {
  return useContactStore(state => ({
    selectedContactIds: state.selectedContactIds,
    hasSelection: state.selectedContactIds.size > 0,
    selectionCount: state.selectedContactIds.size,
    bulkOperationLoading: state.bulkOperationLoading,
    selectContact: state.selectContact,
    selectAllContacts: state.selectAllContacts,
    deselectContact: state.deselectContact,
    deselectAllContacts: state.deselectAllContacts,
    bulkUpdateContacts: state.bulkUpdateContacts,
    bulkDeleteContacts: state.bulkDeleteContacts,
  }));
};

/**
 * Hook para stats - Para tu ContactListPage
 */
export const useContactStats = () => {
  return useContactStore(state => ({
    stats: state.stats,
    loadStats: state.loadStats,
  }));
};

/**
 * Hook para import/export - Para tu ContactListPage
 */
export const useImportExport = () => {
  return useContactStore(state => ({
    exportContacts: state.exportContacts,
  }));
};



/**
 * Hook para búsqueda y filtros - Para tu ContactListPage
 */
export const useContactSearch = () => {
  return useContactStore(state => ({
    searchCriteria: state.searchCriteria,
    setSearchCriteria: state.setSearchCriteria,
    hasActiveFilters: Object.keys(state.searchCriteria).some(key => {
      const value = state.searchCriteria[key as keyof ContactSearchCriteria];
      return value !== undefined && value !== null && value !== '';
    }),
  }));
};

/**
 * Hook para estados de operaciones - Para tu ContactListPage
 */
export const useOperationStates = () => {
  return useContactStore(state => ({
    updating: state.updating,
    deleting: state.deleting,
  }));
};

/**
 * Hook para estado de conexión - Para tu ContactListPage
 */
export const useConnectionStatus = () => {
  return useContactStore(state => ({
    isOnline: !state.isOffline,
  }));
};

/**
 * Hook para contacto seleccionado y operaciones individuales
 */
export const useSelectedContact = () => {
  return useContactStore(state => ({
    selectedContact: state.selectedContact,
    getContactById: state.getContactById,
    setSelectedContact: state.setSelectedContact,
    // Mobile: Include update state for selected contact
    isUpdating: state.selectedContact ? state.updating.has(state.selectedContact.id) : false,
    isDeleting: state.selectedContact ? state.deleting.has(state.selectedContact.id) : false,
  }));
};

/**
 * Hook para operaciones CRUD individuales
 */
export const useContactOperations = () => {
  return useContactStore(state => ({
    createContact: state.createContact,
    updateContact: state.updateContact,
    deleteContact: state.deleteContact,
    loading: state.loading,
    creating: state.creating,
    error: state.error,
    clearError: state.clearError,
  }));
};

/**
 * Hook para operaciones de portal
 */
export const usePortalOperations = () => {
  return useContactStore(state => ({
    generatePortalInvitation: state.generatePortalInvitation,
    resendPortalInvitation: state.resendPortalInvitation,
    revokePortalAccess: state.revokePortalAccess,
    loading: state.loading,
    error: state.error,
  }));
};

/**
 * Hook para manejo de errores de forma consistente
 */
export const useContactErrorHandler = () => {
  return useContactStore(state => ({
    error: state.error,
    lastError: state.lastError,
    clearError: state.clearError,
  }));
};

// ============================================
// EXPORT DEFAULT (El hook principal)
// ============================================

export default useContacts;