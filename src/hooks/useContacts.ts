// src/hooks/useContacts.ts
// ✅ Enterprise contact hooks - VERSIÓN FINAL CON REACT QUERY COMO FUENTE DE VERDAD
// El store de Zustand maneja el estado de la UI y las acciones (mutaciones).
// React Query maneja los datos del servidor (fetching, caching, invalidation).

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';

import { 
  contactApi, 
  handleContactApiError 
} from '@/services/api/contactApi';

import type {
  ContactDTO,
  CreateContactRequest,
  UpdateContactRequest,
  ContactSearchCriteria
} from '@/types/contact.types';

// ============================================
// REACT QUERY KEYS (ÚNICA FUENTE DE VERDAD PARA CACHÉ)
// ============================================
// Exportamos las llaves para que los componentes puedan usarlas con useQuery.
export const CONTACTS_LIST_QUERY_KEY = (criteria: ContactSearchCriteria = {}, page = 0) => 
  ['contacts', 'list', { ...criteria, page }];
export const CONTACT_DETAIL_QUERY_KEY = (id: number | null) => ['contacts', 'detail', id];
export const CONTACT_STATS_QUERY_KEY = ['contacts', 'stats'];

// ============================================
// CONTACT STORE STATE (Simplificado: solo estado de UI y acciones)
// ============================================

interface ContactState {
  // Estado de operaciones
  isCreating: boolean;
  updating: Set<number>;
  deleting: Set<number>;
  
  // Estado para selecciones y operaciones en lote
  selectedContactIds: Set<number>;
  bulkOperationLoading: boolean;
  
  // Acciones (mutaciones y manejo de estado de UI)
  createContact: (request: CreateContactRequest, onSuccess?: (newContact: ContactDTO) => void) => Promise<void>;
  updateContact: (id: number, request: UpdateContactRequest, onSuccess?: () => void) => Promise<void>;
  deleteContact: (id: number, onSuccess?: () => void) => Promise<void>;

  selectContact: (id: number) => void;
  selectAllContacts: (contactIds: number[]) => void;
  deselectContact: (id: number) => void;
  deselectAllContacts: () => void;
  
  bulkUpdateContacts: (updates: Partial<Pick<ContactDTO, 'status' | 'source'>>) => Promise<void>;
  bulkDeleteContacts: () => Promise<void>;
}

// ============================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================

export const useContactStore = create<ContactState>()(
  devtools(
    (set, get) => ({
      // INITIAL STATE
      isCreating: false,
      updating: new Set(),
      deleting: new Set(),
      selectedContactIds: new Set(),
      bulkOperationLoading: false,

      // ============================================
      // ACCIONES DE MUTACIÓN (CUD)
      // ============================================
      
      createContact: async (request, onSuccess) => {
        set({ isCreating: true });
        try {
          const newContact = await contactApi.createContact(request);
          // Invalidar TODO lo relacionado con contactos
          await queryClient.invalidateQueries();
          console.log('🔄 INVALIDATING ALL QUERIES');
console.log('📊 Current queries:', queryClient.getQueryCache().getAll().map(q => q.queryKey));
          // Forzar refetch inmediato
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'contacts'
          });
          
          await queryClient.invalidateQueries();
          console.log('🔄 INVALIDATING ALL QUERIES');
console.log('📊 Current queries:', queryClient.getQueryCache().getAll().map(q => q.queryKey));
          // Forzar refetch inmediato
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'contacts'
          });
          console.log('✅ Queries after en create refetch:', queryClient.getQueryCache().getAll().map(q => ({
            key: q.queryKey,
            state: q.state.status
          })));
          toast.success('Contacto creado exitosamente');
          onSuccess?.(newContact);
        } catch (error: unknown) {
          toast.error(handleContactApiError(error).message);
        } finally {
          set({ isCreating: false });
        }
      },

      updateContact: async (id, request, onSuccess) => {
        set(state => ({ updating: new Set(state.updating).add(id) }));
        try {
          await contactApi.updateContact(id, request);
          // Invalida la lista Y el detalle específico para una actualización completa
          // Invalidar TODO y refetch específico
          await queryClient.invalidateQueries();
          console.log('🔄 INVALIDATING ALL QUERIES');
console.log('📊 Current queries:', queryClient.getQueryCache().getAll().map(q => q.queryKey));
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'contacts'
          });
          console.log('✅ Queries after en update refetch:', queryClient.getQueryCache().getAll().map(q => ({
            key: q.queryKey,
            state: q.state.status
          })));
          toast.success('Contacto actualizado exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handleContactApiError(error).message);
          throw error; // Re-lanzar para que el componente (ej. modal) sepa que falló
        } finally {
          set(state => {
            const newUpdating = new Set(state.updating);
            newUpdating.delete(id);
            return { updating: newUpdating };
          });
        }
      },

      deleteContact: async (id, onSuccess) => {
        set(state => ({ deleting: new Set(state.deleting).add(id) }));
        try {
          await contactApi.deleteContact(id);
          // Invalida la lista Y el detalle específico
          // Invalidar TODO y refetch específico
          await queryClient.invalidateQueries();
          console.log('🔄 INVALIDATING ALL QUERIES');
console.log('📊 Current queries:', queryClient.getQueryCache().getAll().map(q => q.queryKey));
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'contacts'
          });
          console.log('✅ Queries after en delete refetch:', queryClient.getQueryCache().getAll().map(q => ({
            key: q.queryKey,
            state: q.state.status
          })));
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handleContactApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newDeleting = new Set(state.deleting);
            newDeleting.delete(id);
            return { deleting: newDeleting };
          });
        }
      },

      // ============================================
      // BULK & SELECTION ACTIONS
      // ============================================
      
      selectContact: (id) => set(state => ({ selectedContactIds: new Set(state.selectedContactIds).add(id) })),
      deselectContact: (id) => set(state => {
        const newSelection = new Set(state.selectedContactIds);
        newSelection.delete(id);
        return { selectedContactIds: newSelection };
      }),
      selectAllContacts: (contactIds) => set({ selectedContactIds: new Set(contactIds) }),
      deselectAllContacts: () => set({ selectedContactIds: new Set() }),

      bulkUpdateContacts: async (updates) => {
        const { selectedContactIds } = get();
        if (selectedContactIds.size === 0) return;
        set({ bulkOperationLoading: true });
        try {
          await contactApi.bulkUpdateContacts(Array.from(selectedContactIds), updates);
          await queryClient.invalidateQueries({ queryKey: ['contacts'] });
          set({ selectedContactIds: new Set() });
          toast.success(`${selectedContactIds.size} contactos actualizados.`);
        } catch (error: unknown) {
          toast.error(handleContactApiError(error).message);
        } finally {
          set({ bulkOperationLoading: false });
        }
      },

      bulkDeleteContacts: async () => {
        const { selectedContactIds } = get();
        if (selectedContactIds.size === 0) return;
        set({ bulkOperationLoading: true });
        try {
          await contactApi.bulkDeleteContacts(Array.from(selectedContactIds));
          await queryClient.invalidateQueries({ queryKey: ['contacts'] });
          set({ selectedContactIds: new Set() });
          toast.success(`${selectedContactIds.size} contactos eliminados.`);
        } catch (error: unknown) {
          toast.error(handleContactApiError(error).message);
        } finally {
          set({ bulkOperationLoading: false });
        }
      },
    }),
    {
      name: 'contact-ui-store',
    }
  )
);

// ============================================
// HOOKS ESPECIALIZADOS (Exportados para uso en componentes)
// ============================================

/**
 * Hook para las operaciones de CUD (Create, Update, Delete) y estados relacionados.
 * Los componentes usarán este hook para MODIFICAR datos.
 */
export const useContactOperations = () => {
  const operations = useContactStore(state => ({
    createContact: state.createContact,
    updateContact: state.updateContact,
    deleteContact: state.deleteContact,
    isCreating: state.isCreating,
    updating: state.updating,
    deleting: state.deleting,
  }));

  // Devolvemos las operaciones y funciones para chequear el estado por ID
  return {
    ...operations,
    isUpdating: (id: number) => operations.updating.has(id),
    isDeleting: (id: number) => operations.deleting.has(id),
  };
};

/**
 * Hook para las operaciones en lote (Bulk) y estados de selección.
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