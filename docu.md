// src/hooks/useContacts.ts
// Enterprise contact hooks - CORREGIDO TypeScript-Safe
// Mobile-first + Zustand + Optimistic Updates - Sin errores

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import toast from 'react-hot-toast';

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
          set({
            selectedContact: contact,
            loading: false,
          });
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
          
          // Agregar optimísticamente a la lista si está en la primera página
          const { currentPage } = get();
          if (currentPage === 0) {
            set(state => ({
              contacts: [newContact, ...state.contacts.slice(0, state.pageSize - 1)],
              totalContacts: state.totalContacts + 1,
              creating: false,
            }));
          } else {
            set({ creating: false });
          }
          
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









// src/components/contacts/ContactForm.tsx
// ✅ VERSIÓN FINAL: Contact form enterprise - E164 estándar y limpio

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { 
  User, Mail, Phone, MapPin, 
  Save, X, AlertCircle, Check, Globe, CheckCircle2, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { COUNTRY_CODES } from '@/utils/constants';
import { GeographySelector } from '@/components/shared/GeographySelector';
import { getCountryName } from '@/utils/geography';
import type { 
    ContactDTO,               // <-- Este es el alias correcto para 'Contact'
    CreateContactRequest, 
    UpdateContactRequest, 
    ContactSource,
    Gender,
    CommunicationPreferences
  } from '@/types/contact.types';

// ============================================
// E164 PHONE UTILITIES (Mejorado con libphonenumber-js)
// ============================================

interface PhoneValidationResult {
  isValid: boolean;
  e164Phone?: string;
  formattedDisplay?: string;
  errorMessage?: string;
}

/**
 * Extrae la región/país de un número E164 usando libphonenumber-js
 */
const getRegionFromE164 = (e164Phone?: string): string => {
  if (!e164Phone) return 'CO';
  
  try {
    const phoneNumber = parsePhoneNumber(e164Phone);
    return phoneNumber?.country || 'CO';
  } catch {
    return 'CO';
  }
};

/**
 * Formatea un número E164 para display amigable usando libphonenumber-js
 */
const formatPhoneForDisplay = (e164Phone: string): string => {
  if (!e164Phone || !e164Phone.startsWith('+')) return e164Phone;
  
  try {
    const phoneNumber = parsePhoneNumber(e164Phone);
    if (phoneNumber) {
      const country = COUNTRY_CODES.find(c => c.code === phoneNumber.country);
      const flag = country?.flag || '';
      return `${flag} ${phoneNumber.formatInternational()}`;
    }
  } catch (error) {
    console.warn('Error formatting phone:', error);
  }
  
  return e164Phone;
};

/**
 * Valida teléfono con libphonenumber-js - VALIDACIÓN PRECISA
 */
const validatePhoneWithLibphonenumber = async (phone: string, region: string): Promise<PhoneValidationResult> => {
  const trimmedPhone = phone.trim();
  
  // ✅ FIX: Campo vacío es válido
  if (!trimmedPhone) {
    return { isValid: true };
  }
  
  try {
    const country = COUNTRY_CODES.find(c => c.code === region);
    if (!country) {
      return { isValid: false, errorMessage: 'País no soportado' };
    }
    
    // Construir número completo
    const fullNumber = `${country.dialCode}${trimmedPhone}`;
    
    // ✅ FIX: Validación precisa con libphonenumber-js
    const isValid = isValidPhoneNumber(fullNumber, region as any);
    
    if (isValid) {
      const phoneNumber = parsePhoneNumber(fullNumber, region as any);
      return {
        isValid: true,
        e164Phone: phoneNumber?.number,
        formattedDisplay: formatPhoneForDisplay(phoneNumber?.number || fullNumber)
      };
    } else {
      // ✅ FIX: Validación de longitud más precisa
      if (trimmedPhone.length < country.minLength) {
        return { 
          isValid: false, 
          errorMessage: `Mínimo ${country.minLength} dígitos para ${country.name}`
        };
      }
      return { 
        isValid: false, 
        errorMessage: 'Formato de teléfono inválido'
      };
    }
  } catch (error) {
    console.error('Phone validation error:', error);
    return { 
      isValid: false, 
      errorMessage: 'Error al validar teléfono'
    };
  }
};

// ============================================
// VALIDATION SCHEMAS (🔥 AJUSTADO)
// ============================================

const addressSchema = z.object({
  addressLine1: z.string().max(100).optional().or(z.literal('')),
  addressLine2: z.string().max(100).optional().or(z.literal('')),
  city: z.string().max(50).optional().or(z.literal('')),
  state: z.string().max(50).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(50).optional().or(z.literal('')),
});

// ✅ NUEVO ESQUEMA ESPECÍFICO
const communicationPreferencesSchema = z.object({
    allowEmail: z.boolean().optional(),
    allowSms: z.boolean().optional(),
    allowPhone: z.boolean().optional(),
    allowWhatsapp: z.boolean().optional(),
    marketingConsent: z.boolean().optional(),
    // Añade aquí cualquier otra propiedad de tu interfaz CommunicationPreferences
  }).optional();

// 🔥 phoneRegion ELIMINADO del esquema. Ahora es estado de UI.
const contactFormSchema = z.object({
  firstName: z.string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres'),
  
  lastName: z.string()
    .min(1, 'El apellido es requerido')
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede tener más de 50 caracteres'),
  
  email: z.string()
    .email('Formato de email inválido')
    .optional()
    .or(z.literal('')),
  
  phone: z.string().optional(), // Este es el número LOCAL, no el E164
  
  companyId: z.number().optional(),
  
  address: addressSchema.optional(),
  
  birthDate: z.string().optional().or(z.literal('')),
  
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional().or(z.literal('')),
  
  source: z.string()
    .min(1, 'La fuente es requerida'),
  
  sourceDetails: z.string().optional(),
  
  customFields: z.record(z.any()).optional(),
  
  communicationPreferences: communicationPreferencesSchema,
  
  tags: z.array(z.number()).optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

// ============================================
// TYPES
// ============================================

interface ContactFormProps {
  contact?: ContactDTO;
  onSubmit: (data: CreateContactRequest | UpdateContactRequest) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error?: string | null;
  mode: 'create' | 'edit';
  showActions?: boolean; // Para controlar la visibilidad de los botones
}

// ============================================
// FORM FIELD COMPONENT
// ============================================

interface FormFieldProps {
    label: string;
    name: string;
    error?: string;
    required?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
    description?: string;
  }
  
  const FormField: React.FC<FormFieldProps> = ({
    label,
    name,
    error,
    required,
    icon,
    children,
    description
  }) => (
    <div className="space-y-1">
      <label htmlFor={name} className="flex items-center text-sm font-medium text-app-gray-300">
        {icon && <span className="mr-2 text-app-gray-400">{icon}</span>}
        {label}
        {required && <span className="text-red-400 ml-1 text-lg font-bold">*</span>}
      </label>
      {children}
      {description && (
        <p className="text-xs text-app-gray-500">{description}</p>
      )}
      {error && (
        <div className="flex items-center text-xs text-red-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </div>
      )}
    </div>
  );

interface SmartPhoneInputProps {
  value: string; // Valor local del input
  onChange: (phone: string) => void;
  onValidationChange: (result: PhoneValidationResult) => void;
  disabled?: boolean;
  initialE164?: string; // E164 inicial del contacto
}

const SmartPhoneInput: React.FC<SmartPhoneInputProps> = ({
  value,
  onChange,
  onValidationChange,
  disabled,
  initialE164
 }) => {
  const [selectedRegion, setSelectedRegion] = useState(() => getRegionFromE164(initialE164));
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<PhoneValidationResult | null>(null);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
 
  const validatePhone = useCallback(async (phone: string, region: string) => {
    setIsValidating(true);
    try {
      const result = await validatePhoneWithLibphonenumber(phone, region);
      setValidationResult(result);
      onValidationChange(result);
    } catch (error) {
      const errorResult = { isValid: false, errorMessage: 'Error de validación' };
      setValidationResult(errorResult);
      onValidationChange(errorResult);
    } finally {
      setIsValidating(false);
    }
  }, [onValidationChange]);
 
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRY_CODES;
    const search = countrySearch.toLowerCase();
    return COUNTRY_CODES.filter(country => 
      country.name.toLowerCase().includes(search) ||
      country.code.toLowerCase().includes(search) ||
      country.dialCode.includes(search)
    );
  }, [countrySearch]);
  
  const handleCountrySelect = (countryCode: string) => {
    setSelectedRegion(countryCode);
    setIsCountryDropdownOpen(false);
    setCountrySearch('');
    validatePhone(value, countryCode);
  };
 
  const selectedCountry = COUNTRY_CODES.find(c => c.code === selectedRegion);
 
  // Efecto para inicializar el valor del input si estamos en modo edición
  useEffect(() => {
    if (initialE164) {
      const region = getRegionFromE164(initialE164);
      setSelectedRegion(region);
      const country = COUNTRY_CODES.find(c => c.code === region);
      if (country) {
        const localNumber = initialE164.replace(country.dialCode, '');
        onChange(localNumber);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialE164]); // <-- LA CLAVE: El array de dependencias solo tiene `initialE164`
 
  // Debounce validation
  useEffect(() => {
    const timer = setTimeout(() => {
      validatePhone(value, selectedRegion);
    }, 500);
 
    return () => clearTimeout(timer);
  }, [value, selectedRegion, validatePhone]);
 
  // useEffect para cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        setIsCountryDropdownOpen(false);
      }
    };
    
    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCountryDropdownOpen]);
 
  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        {/* Country Selector personalizado */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
            disabled={disabled}
            className="flex items-center space-x-2 px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:bg-app-dark-600 min-w-[200px]"
          >
            <span className="text-lg">{selectedCountry?.flag}</span>
            <span className="text-sm font-mono">{selectedCountry?.dialCode}</span>
            <span className="text-sm truncate flex-1 text-left">{selectedCountry?.name}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown personalizado */}
          {isCountryDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-app-dark-700 border border-app-dark-600 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
              {/* Campo de búsqueda */}
              <div className="p-2 border-b border-app-dark-600">
                <input
                  type="text"
                  placeholder="Buscar país..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-500 rounded text-app-gray-100 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
              </div>
              
              {/* Lista de países */}
              <div className="overflow-y-auto max-h-48">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country.code)}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-app-dark-600 ${
                      selectedCountry?.code === country.code ? 'bg-app-dark-600' : ''
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-mono text-sm w-12">{country.dialCode}</span>
                    <span className="text-sm text-app-gray-200 truncate flex-1">{country.name}</span>
                  </button>
                ))}
                
                {filteredCountries.length === 0 && (
                  <div className="px-4 py-2 text-sm text-app-gray-500">
                    No se encontraron países
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="relative flex-1">
          <input
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 pr-10 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={selectedCountry?.format.replace(/#/g, '0') || '3001234567'}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValidating ? (
              <LoadingSpinner size="xs" />
            ) : validationResult?.isValid && value ? (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            ) : validationResult && !validationResult.isValid && value ? (
              <AlertCircle className="h-4 w-4 text-red-400" />
            ) : null}
          </div>
        </div>
      </div>
      
      {validationResult && !validationResult.isValid && value && (
        <div className="text-xs text-red-400 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {validationResult.errorMessage}
        </div>
      )}
      
      {validationResult?.isValid && validationResult.e164Phone && (
        <div className="text-xs text-green-400 flex items-center">
          <Check className="h-3 w-3 mr-1" />
          Validado como: {validationResult.formattedDisplay}
        </div>
      )}
    </div>
  );
 };
 
 // ============================================
 // CONSTANTS (Sin cambios)
 // ============================================
 
 const CONTACT_SOURCES = [
    { value: 'WEBSITE', label: 'Sitio Web' },
    { value: 'MANUAL_ENTRY', label: 'Entrada Manual' },
    { value: 'IMPORT', label: 'Importación' },
    { value: 'REFERRAL', label: 'Referido' },
    { value: 'SOCIAL_MEDIA', label: 'Redes Sociales' },
    { value: 'EMAIL_CAMPAIGN', label: 'Campaña de Email' },
    { value: 'CHURCH_SERVICE', label: 'Servicio Religioso' },
    { value: 'CHURCH_EVENT', label: 'Evento de Iglesia' },
    { value: 'VOLUNTEER', label: 'Voluntariado' },
    { value: 'OTHER', label: 'Otro' },
  ];
  
  const GENDERS = [
    { value: 'MALE', label: 'Masculino' },
    { value: 'FEMALE', label: 'Femenino' },
    { value: 'OTHER', label: 'Otro' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefiero no decir' },
  ];
  
  // ============================================
  // COMMUNICATION PREFERENCES COMPONENT
  // ============================================
  
  interface CommunicationPreferencesProps {
    value: Record<string, boolean>;
    onChange: (value: Record<string, boolean>) => void;
  }
  
  const CommunicationPreferences: React.FC<CommunicationPreferencesProps> = ({
    value,
    onChange
  }) => {
    const preferences = [
      { key: 'allowEmail', label: 'Correo electrónico' },
      { key: 'allowSms', label: 'SMS' },
      { key: 'allowPhone', label: 'Llamadas telefónicas' },
      { key: 'allowWhatsapp', label: 'WhatsApp' },
      { key: 'marketingConsent', label: 'Material de marketing' },
    ];
  
    const handleChange = (key: string, checked: boolean) => {
      onChange({ ...value, [key]: checked });
    };
  
    return (
      <div className="space-y-3">
        {preferences.map(({ key, label }) => (
          <label key={key} className="flex items-center">
            <input
              type="checkbox"
              checked={value[key] || false}
              onChange={(e) => handleChange(key, e.target.checked)}
              className="rounded border-app-dark-600 bg-app-dark-700 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-app-gray-300">{label}</span>
          </label>
        ))}
      </div>
    );
  };
 
 // ============================================
 // MAIN COMPONENT (🔥 COMPLETADO Y AJUSTADO)
 // ============================================
 
 const ContactForm = React.forwardRef<HTMLFormElement, ContactFormProps>(
  ({
    contact,
    onSubmit,
    onCancel,
    loading,
    error,
    mode,
    showActions = true,
  }, ref) => { // <-- Se añade 'ref' aquí
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<PhoneValidationResult>({ isValid: true });
  const [selectedCountryFromPhone, setSelectedCountryFromPhone] = useState<string>('');
 
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
    clearErrors
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    // 🔥 Lógica de defaultValues mejorada
    defaultValues: useMemo(() => {
      // Si no hay `contact` (modo crear), devuelve un objeto casi vacío.
      if (!contact) {
        return { source: 'MANUAL_ENTRY' }; // Devuelve solo lo mínimo necesario
      }

      // Si hay `contact` (modo editar), construye los valores por defecto.
      return {
        // --- ESTAS LÍNEAS SON EXACTAMENTE LAS MISMAS QUE YA TENÍAS ---
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        phone: '', 
        companyId: contact.companyId,
        address: contact.address,
        birthDate: contact.birthDate ? contact.birthDate.split('T')[0] : '',
        gender: contact.gender,
        source: contact.source || 'MANUAL_ENTRY',
        sourceDetails: contact.sourceDetails,
        customFields: contact.customFields,

        // --- AQUÍ ESTÁ EL ÚNICO CAMBIO REAL ---
        // 1. "Traducimos" la estructura de communicationPreferences
        communicationPreferences: {
          ...(contact.communicationPreferences ?? {}),
          marketingConsent: contact.marketingConsent ?? false,
        },
        // 2. "Traducimos" la estructura de tags
        tags: contact.tags?.map(tag => tag.id) || [],
      };
    }, [contact])
  });

  // ✅ NUEVO: Lógica de reseteo ahora vive en el formulario, no en el selector
  useEffect(() => {
    // Cuando el país del teléfono cambia, resetea el estado y la ciudad
    setValue('address.state', '');
    setValue('address.city', '');
  }, [selectedCountryFromPhone, setValue]);

  const watchedState = watch('address.state');
  useEffect(() => {
    // Cuando el estado/departamento cambia, resetea solo la ciudad
    setValue('address.city', '');
  }, [watchedState, setValue]);
 
  const currentPhone = watch('phone');
 
  const handleFormSubmit = async (data: ContactFormData) => {
    if (data.phone && !phoneValidation.isValid) {
      setError('phone', { message: 'El teléfono debe ser válido antes de guardar' });
      return;
    }

    // ✅ DEBUG: Ver qué datos del formulario tenemos
    console.log('🔍 Datos del formulario:', data);
    console.log('🔍 Validación del teléfono:', phoneValidation);
 
    // ✅ Crear datos según el DTO exacto del backend
    const cleanedData: any = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      source: data.source as ContactSource, // Backend valida que sea string válido
    };

    // ✅ OBLIGATORIO: email O teléfono (validación isValidContactInfo del backend)
    if (data.email && data.email.trim()) {
      cleanedData.email = data.email.trim();
    }
    
    if (phoneValidation.e164Phone) {
      cleanedData.phone = phoneValidation.e164Phone;
    }

    // ✅ Verificar que cumple validación del backend
    if (!cleanedData.email && !cleanedData.phone) {
      setError('email', { message: 'Debe proporcionar al menos email o teléfono' });
      setError('phone', { message: 'Debe proporcionar al menos email o teléfono' });
      return;
    }
    
    // ✅ Campos opcionales - solo si tienen valores
    if (data.companyId) {
      cleanedData.companyId = data.companyId;
    }
    
    if (data.sourceDetails && data.sourceDetails.trim()) {
      cleanedData.sourceDetails = data.sourceDetails.trim();
    }
    
    if (data.birthDate && data.birthDate.trim()) {
      cleanedData.birthDate = data.birthDate; // LocalDate en backend
    }
    
    if (data.gender && data.gender.trim()) {
      cleanedData.gender = data.gender as Gender;
    }

    // ✅ Address - solo si tiene datos (hasAnyField del backend)
    if (data.address) {
      const hasAddressData = Object.values(data.address).some(value => value && value.trim());
      if (hasAddressData) {
        const cleanAddress: any = {};
        Object.entries(data.address).forEach(([key, value]) => {
          if (value && value.trim()) {
            cleanAddress[key] = value.trim();
          }
        });
        cleanedData.address = cleanAddress;
      }
    }

    // ✅ CommunicationPreferences - Map<String, Object> según backend
    if (data.communicationPreferences && Object.keys(data.communicationPreferences).length > 0) {
      const cleanPrefs: Record<string, any> = {};
      Object.entries(data.communicationPreferences).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          cleanPrefs[key] = value;
        }
      });
      if (Object.keys(cleanPrefs).length > 0) {
        cleanedData.communicationPreferences = cleanPrefs;
      }
    }

    // ✅ IMPORTANTE: Backend espera tagNames (strings), no tags (numbers)
    if (data.tags && data.tags.length > 0) {
      // Necesitarías convertir IDs a nombres, o mejor cambiar el formulario
      // Por ahora lo omitimos hasta que tengas la conversión
      console.warn('⚠️ Tags omitidos - backend espera tagNames (strings), no IDs');
    }

    // ✅ CustomFields - Map<String, Object> según backend
    if (data.customFields && Object.keys(data.customFields).length > 0) {
      cleanedData.customFields = data.customFields;
    }

    const baseSubmitData = cleanedData;
 
    // ✅ SOLUCIÓN: Llamar a onSubmit de forma condicional y explícita
    if (mode === 'edit' && contact) {
      // En esta rama, TypeScript sabe que el objeto debe ser un UpdateContactRequest
      const updateData: UpdateContactRequest = {
        ...baseSubmitData,
        version: contact.version,
      };
      console.log('🚀 Enviando UPDATE al backend:', JSON.stringify(updateData, null, 2));
      await onSubmit(updateData);
    } else {
      // En esta rama, TypeScript sabe que el objeto debe ser un CreateContactRequest
      const createData: CreateContactRequest = baseSubmitData;
      await onSubmit(createData);
    }
  };
 
  const handlePhoneValidation = useCallback((result: PhoneValidationResult) => {
    setPhoneValidation(result);
    
    // ✅ NUEVO: Extraer país del teléfono para geografía
    if (result.isValid && result.e164Phone) {
      const region = getRegionFromE164(result.e164Phone);
      setSelectedCountryFromPhone(region);
      
      // Auto-llenar campo país
      setValue('address.country', getCountryName(region));
    }
    
    if (currentPhone && !result.isValid) {
      setError('phone', { message: result.errorMessage || 'Formato de teléfono inválido' });
    } else {
      clearErrors('phone');
    }
  }, [currentPhone, setError, clearErrors, setValue]);

  //finalmente
  const handlePhoneChange = useCallback((phone: string) => {
    setValue('phone', phone, { shouldValidate: true, shouldDirty: true });
}, [setValue]);
 
  return (
    <form ref={ref} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        </div>
      )}
 
      {/* Basic Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-app-gray-100 border-b border-app-dark-700 pb-2">
          Información Básica
        </h3>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Nombre"
            name="firstName"
            required={true}
            icon={<User className="h-4 w-4" />}
            error={errors.firstName?.message}
          >
            <input
              {...register('firstName')}
              type="text"
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ingresa el nombre"
            />
          </FormField>
 
          <FormField
            label="Apellido"
            name="lastName"
            required={true}
            icon={<User className="h-4 w-4" />}
            error={errors.lastName?.message}
          >
            <input
              {...register('lastName')}
              type="text"
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ingresa el apellido"
            />
          </FormField>
        </div>
      </div>
 
      {/* Contact Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-app-gray-100 border-b border-app-dark-700 pb-2">
          Información de Contacto
        </h3>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Correo electrónico"
            name="email"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            description="Opcional, pero requerido para acceso al portal"
          >
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="ejemplo@correo.com"
            />
          </FormField>
 
      {/* 🔥 La única parte del JSX que cambia es el FormField del Teléfono */}
      
      <FormField
        label="Teléfono"
        name="phone"
        icon={<Phone className="h-4 w-4" />}
        error={errors.phone?.message}
        description="Validación automática con formato E164 estándar"
      >
        <SmartPhoneInput
          value={currentPhone || ''}
          onChange={handlePhoneChange}
          onValidationChange={handlePhoneValidation}
          disabled={loading}
          initialE164={contact?.phone} // 🔥 Pasamos el E164 del contacto existente aquí
        />
      </FormField>
      
      </div>
      </div>
 
      {/* Source Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-app-gray-100 border-b border-app-dark-700 pb-2">
          Origen del Contacto
        </h3>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Fuente"
            name="source"
            required={true}
            icon={<Globe className="h-4 w-4" />}
            error={errors.source?.message}
          >
            <select
              {...register('source')}
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {CONTACT_SOURCES.map(source => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </FormField>
 
          <FormField
            label="Detalles de la fuente"
            name="sourceDetails"
            error={errors.sourceDetails?.message}
            description="Información adicional sobre cómo se obtuvo este contacto"
          >
            <input
              {...register('sourceDetails')}
              type="text"
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ej: Formulario de contacto, referido por Juan"
            />
          </FormField>
        </div>
      </div>
 
      {/* Advanced Information */}
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-app-gray-300 hover:text-app-gray-100 transition-colors"
         >
          <span className="text-lg font-medium">Información Adicional</span>
          <span className="ml-2 text-sm text-app-gray-500">
            {showAdvanced ? '(ocultar)' : '(mostrar)'}
          </span>
        </button>
 
        {showAdvanced && (
          <div className="space-y-6 p-4 bg-app-dark-700/50 rounded-lg border border-app-dark-600">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Fecha de nacimiento"
                name="birthDate"
                icon={<User className="h-4 w-4" />}
                error={errors.birthDate?.message}
              >
                <input
                  {...register('birthDate')}
                  type="date"
                  className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </FormField>
 
              <FormField
                label="Género"
                name="gender"
                icon={<User className="h-4 w-4" />}
                error={errors.gender?.message}
              >
                <select
                  {...register('gender')}
                  className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Seleccionar...</option>
                  {GENDERS.map(gender => (
                    <option key={gender.value} value={gender.value}>
                      {gender.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
 
            {/* Address - ✅ LAYOUT CORREGIDO Y SIN BUCLES */}
<div className="space-y-4">
  <h4 className="text-md font-medium text-app-gray-200 flex items-center">
    <MapPin className="h-4 w-4 mr-2" />
    Dirección
  </h4>
  
  {selectedCountryFromPhone && (
    <>
      <h5 className="text-sm font-medium text-app-gray-300 pt-2">
        Ubicación Geográfica
      </h5>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        
        {/* --- Fila 1: País y Departamento/Estado --- */}
        <div className="col-span-1">
          <FormField 
            label="País" 
            name="address.country" 
            error={errors.address?.country?.message}
          >
            <input 
              {...register('address.country')} 
              type="text" 
              readOnly 
              className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-600 rounded text-app-gray-400 cursor-not-allowed" 
              placeholder="Automático desde teléfono"
            />
          </FormField>
        </div>
        
        <div className="col-span-1">
          <FormField 
            label={selectedCountryFromPhone === 'CO' ? 'Departamento' : 'Estado/Provincia'} 
            name="address.state" 
            error={errors.address?.state?.message}
          >
            <GeographySelector
              countryCode={selectedCountryFromPhone}
              selectedState={watch('address.state') || ''}
              onStateChange={(state) => setValue('address.state', state, { shouldValidate: true })}
              onCityChange={() => {}} // No hace nada aquí
              disabled={loading || !selectedCountryFromPhone}
              layout="separate"
              renderStateOnly
              errorState={errors.address?.state?.message}
            />
          </FormField>
        </div>

        {/* --- Fila 2: Ciudad y Código Postal --- */}
        <div className="col-span-1">
          <FormField 
            label="Ciudad" 
            name="address.city" 
            error={errors.address?.city?.message}
          >
            <GeographySelector
              countryCode={selectedCountryFromPhone}
              selectedState={watch('address.state') || ''}
              selectedCity={watch('address.city') || ''}
              onCityChange={(city) => setValue('address.city', city, { shouldValidate: true })}
              onStateChange={() => {}} // No hace nada aquí
              // ✅ NUEVO: Auto-llenar código postal
              onPostalCodeAutoFill={(postalCode) => {
                setValue('address.postalCode', postalCode, { shouldValidate: true });
              }}
              disabled={loading || !watch('address.state')}
              layout="separate"
              renderCityOnly
              errorCity={errors.address?.city?.message}
              showPostalCodeHint={true}
            />
          </FormField>
        </div>

        <div className="col-span-1">
          <FormField 
            label="Código postal" 
            name="address.postalCode" 
            error={errors.address?.postalCode?.message}
          >
            <input 
              {...register('address.postalCode')} 
              type="text" 
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
              placeholder="760001"
            />
          </FormField>
        </div>

        {/* --- Fila 3: Direcciones --- */}
        <div className="col-span-1">
          <FormField 
            label="Dirección principal" 
            name="address.addressLine1" 
            error={errors.address?.addressLine1?.message}
          >
            <input 
              {...register('address.addressLine1')} 
              type="text" 
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
              placeholder="Calle 123 #45-67"
            />
          </FormField>
        </div>

        <div className="col-span-1">
          <FormField 
            label="Dirección secundaria" 
            name="address.addressLine2" 
            error={errors.address?.addressLine2?.message}
          >
            <input 
              {...register('address.addressLine2')} 
              type="text" 
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
              placeholder="Apartamento, suite, etc."
            />
          </FormField>
        </div>
      </div>
    </>
  )}
</div>
 
            {/* Communication Preferences */}
            <FormField
              label="Preferencias de comunicación"
              name="communicationPreferences"
              description="Selecciona los métodos de comunicación preferidos"
            >
              <Controller
                name="communicationPreferences"
                control={control}
                render={({ field }) => (
                  <CommunicationPreferences
                    value={field.value || {}}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormField>
          </div>
        )}
      </div>
 
      {showActions && (
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-app-dark-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          
          <Button
            type="submit"
            disabled={loading || (!!currentPhone && !phoneValidation.isValid)}
            className="min-w-32"
          >
            {loading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === 'create' ? 'Crear Contacto' : 'Actualizar Contacto'}
          </Button>
        </div>
      )}
 
    </form>
  );
});
 
export default ContactForm;