// src/hooks/useActivities.ts
// ✅ Enterprise activity hooks - VERSIÓN FINAL CON REACT QUERY COMO FUENTE DE VERDAD
// El store de Zustand maneja el estado de la UI y las acciones (mutaciones).
// React Query maneja los datos del servidor (fetching, caching, invalidation).
// 🔧 REPLICANDO: Estructura exacta de useCompanies.ts (GOLDEN STANDARD)

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';
import { useQuery } from '@tanstack/react-query';

import { 
  activityApi, 
  handleActivityApiError 
} from '@/services/api/activityApi';

import type {
  ActivityDTO,
  CreateActivityRequest,
  UpdateActivityRequest,
  CompleteActivityRequest,
  RescheduleActivityRequest,
  AssignActivityRequest,
  ActivitySearchCriteria
} from '@/types/activity.types';

// ============================================
// REACT QUERY KEYS (ÚNICA FUENTE DE VERDAD PARA CACHÉ)
// ============================================
// Exportamos las llaves para que los componentes puedan usarlas con useQuery.
export const ACTIVITIES_LIST_QUERY_KEY = (criteria: ActivitySearchCriteria = {}, page = 0) => 
  ['activities', 'list', { ...criteria, page }];
export const ACTIVITY_DETAIL_QUERY_KEY = (id: number | null) => ['activities', 'detail', id];
export const ACTIVITY_STATS_QUERY_KEY = ['activities', 'stats'];
export const ACTIVITIES_BY_CONTACT_QUERY_KEY = (contactId: number) => ['activities', 'by-contact', contactId];
export const ACTIVITIES_BY_COMPANY_QUERY_KEY = (companyId: number) => ['activities', 'by-company', companyId];
export const ACTIVITIES_BY_DEAL_QUERY_KEY = (dealId: number) => ['activities', 'by-deal', dealId];
export const MY_PENDING_ACTIVITIES_QUERY_KEY = ['activities', 'my-pending'];
export const OVERDUE_ACTIVITIES_QUERY_KEY = ['activities', 'overdue'];

// ============================================
// ACTIVITY STORE STATE (Simplificado: solo estado de UI y acciones)
// ============================================

interface ActivityState {
  // Estado de operaciones
  isCreating: boolean;
  updating: Set<number>;
  deleting: Set<number>;
  completing: Set<number>;
  rescheduling: Set<number>;
  assigning: Set<number>;
  
  // Estado para selecciones y operaciones en lote
  selectedActivityIds: Set<number>;
  bulkOperationLoading: boolean;
  
  // Acciones (mutaciones y manejo de estado de UI)
  createActivity: (request: CreateActivityRequest, onSuccess?: (newActivity: ActivityDTO) => void) => Promise<void>;
  updateActivity: (id: number, request: UpdateActivityRequest, onSuccess?: () => void) => Promise<void>;
  deleteActivity: (id: number, onSuccess?: () => void) => Promise<void>;
  completeActivity: (request: CompleteActivityRequest, onSuccess?: () => void) => Promise<void>;
  rescheduleActivity: (request: RescheduleActivityRequest, onSuccess?: () => void) => Promise<void>;
  assignActivity: (request: AssignActivityRequest, onSuccess?: () => void) => Promise<void>;

  selectActivity: (id: number) => void;
  selectAllActivities: (activityIds: number[]) => void;
  deselectActivity: (id: number) => void;
  deselectAllActivities: () => void;
  
  bulkUpdateActivities: (updates: Partial<Pick<ActivityDTO, 'status' | 'priority' | 'assigneeCognitoSub'>>) => Promise<void>;
  bulkDeleteActivities: () => Promise<void>;
  bulkCompleteActivities: (outcome: string, notes?: string) => Promise<void>;
}

// ============================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================

export const useActivityStore = create<ActivityState>()(
  devtools(
    (set, get) => ({
      // INITIAL STATE
      isCreating: false,
      updating: new Set(),
      deleting: new Set(),
      completing: new Set(),
      rescheduling: new Set(),
      assigning: new Set(),
      selectedActivityIds: new Set(),
      bulkOperationLoading: false,

      // ============================================
      // ACCIONES DE MUTACIÓN (CUD)
      // ============================================
      
      createActivity: async (request, onSuccess) => {
        set({ isCreating: true });
        try {
          const newActivity = await activityApi.createActivity(request);
          // Invalidar TODO lo relacionado con actividades
          await queryClient.invalidateQueries();
          // Forzar refetch inmediato
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'activities'
          });
          toast.success('Actividad creada exitosamente');
          onSuccess?.(newActivity);
        } catch (error: unknown) {
          toast.error(handleActivityApiError(error).message);
        } finally {
          set({ isCreating: false });
        }
      },

      updateActivity: async (id, request, onSuccess) => {
        set(state => ({ updating: new Set(state.updating).add(id) }));
        try {
          await activityApi.updateActivity(id, request);
          // Invalidar TODO y refetch específico
          await queryClient.invalidateQueries();
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'activities'
          });
          toast.success('Actividad actualizada exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handleActivityApiError(error).message);
          throw error; // Re-lanzar para que el componente (ej. modal) sepa que falló
        } finally {
          set(state => {
            const newUpdating = new Set(state.updating);
            newUpdating.delete(id);
            return { updating: newUpdating };
          });
        }
      },

      deleteActivity: async (id, onSuccess) => {
        set(state => ({ deleting: new Set(state.deleting).add(id) }));
        try {
          await activityApi.deleteActivity(id);
          // Invalidar TODO y refetch específico
          await queryClient.invalidateQueries();
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'activities'
          });
          toast.success('Actividad eliminada exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handleActivityApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newDeleting = new Set(state.deleting);
            newDeleting.delete(id);
            return { deleting: newDeleting };
          });
        }
      },

      completeActivity: async (request, onSuccess) => {
        set(state => ({ completing: new Set(state.completing).add(request.activityId) }));
        try {
          await activityApi.completeActivity(request);
          // Invalidar TODO y refetch específico
          await queryClient.invalidateQueries();
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'activities'
          });
          toast.success('Actividad marcada como completada');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handleActivityApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newCompleting = new Set(state.completing);
            newCompleting.delete(request.activityId);
            return { completing: newCompleting };
          });
        }
      },

      rescheduleActivity: async (request, onSuccess) => {
        set(state => ({ rescheduling: new Set(state.rescheduling).add(request.activityId) }));
        try {
          await activityApi.rescheduleActivity(request);
          // Invalidar TODO y refetch específico
          await queryClient.invalidateQueries();
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'activities'
          });
          toast.success('Actividad reagendada exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handleActivityApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newRescheduling = new Set(state.rescheduling);
            newRescheduling.delete(request.activityId);
            return { rescheduling: newRescheduling };
          });
        }
      },

      assignActivity: async (request, onSuccess) => {
        set(state => ({ assigning: new Set(state.assigning).add(request.activityId) }));
        try {
          await activityApi.assignActivity(request);
          // Invalidar TODO y refetch específico
          await queryClient.invalidateQueries();
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'activities'
          });
          toast.success('Actividad asignada exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handleActivityApiError(error).message);
          throw error;
        } finally {
          set(state => {
            const newAssigning = new Set(state.assigning);
            newAssigning.delete(request.activityId);
            return { assigning: newAssigning };
          });
        }
      },

      // ============================================
      // BULK & SELECTION ACTIONS
      // ============================================
      
      selectActivity: (id) => set(state => ({ selectedActivityIds: new Set(state.selectedActivityIds).add(id) })),
      deselectActivity: (id) => set(state => {
        const newSelection = new Set(state.selectedActivityIds);
        newSelection.delete(id);
        return { selectedActivityIds: newSelection };
      }),
      selectAllActivities: (activityIds) => set({ selectedActivityIds: new Set(activityIds) }),
      deselectAllActivities: () => set({ selectedActivityIds: new Set() }),

      bulkUpdateActivities: async (updates) => {
        const { selectedActivityIds } = get();
        if (selectedActivityIds.size === 0) return;
        set({ bulkOperationLoading: true });
        try {
          await activityApi.bulkUpdateActivities(Array.from(selectedActivityIds), updates);
          await queryClient.invalidateQueries({ queryKey: ['activities'] });
          set({ selectedActivityIds: new Set() });
          toast.success(`${selectedActivityIds.size} actividades actualizadas.`);
        } catch (error: unknown) {
          toast.error(handleActivityApiError(error).message);
        } finally {
          set({ bulkOperationLoading: false });
        }
      },

      bulkDeleteActivities: async () => {
        const { selectedActivityIds } = get();
        if (selectedActivityIds.size === 0) return;
        set({ bulkOperationLoading: true });
        try {
          await activityApi.bulkDeleteActivities(Array.from(selectedActivityIds));
          await queryClient.invalidateQueries({ queryKey: ['activities'] });
          set({ selectedActivityIds: new Set() });
          toast.success(`${selectedActivityIds.size} actividades eliminadas.`);
        } catch (error: unknown) {
          toast.error(handleActivityApiError(error).message);
        } finally {
          set({ bulkOperationLoading: false });
        }
      },

      bulkCompleteActivities: async (outcome, notes) => {
        const { selectedActivityIds } = get();
        if (selectedActivityIds.size === 0) return;
        set({ bulkOperationLoading: true });
        try {
          await activityApi.bulkCompleteActivities(Array.from(selectedActivityIds), outcome, notes);
          await queryClient.invalidateQueries({ queryKey: ['activities'] });
          set({ selectedActivityIds: new Set() });
          toast.success(`${selectedActivityIds.size} actividades completadas.`);
        } catch (error: unknown) {
          toast.error(handleActivityApiError(error).message);
        } finally {
          set({ bulkOperationLoading: false });
        }
      },
    }),
    {
      name: 'activity-ui-store',
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
export const useActivityOperations = () => {
  const operations = useActivityStore(state => ({
    createActivity: state.createActivity,
    updateActivity: state.updateActivity,
    deleteActivity: state.deleteActivity,
    completeActivity: state.completeActivity,
    rescheduleActivity: state.rescheduleActivity,
    assignActivity: state.assignActivity,
    isCreating: state.isCreating,
    updating: state.updating,
    deleting: state.deleting,
    completing: state.completing,
    rescheduling: state.rescheduling,
    assigning: state.assigning,
  }));

  // Devolvemos las operaciones y funciones para chequear el estado por ID
  return {
    ...operations,
    isUpdating: (id: number) => operations.updating.has(id),
    isDeleting: (id: number) => operations.deleting.has(id),
    isCompleting: (id: number) => operations.completing.has(id),
    isRescheduling: (id: number) => operations.rescheduling.has(id),
    isAssigning: (id: number) => operations.assigning.has(id),
  };
};

/**
 * Hook para obtener actividad por ID
 */
export const useActivityById = (id: number) => {
  return useQuery({
    queryKey: ACTIVITY_DETAIL_QUERY_KEY(id),
    queryFn: () => activityApi.getActivityById(id),
    enabled: !!id && id > 0,
  });
};

/**
 * ✅ HOOK AÑADIDO
 * Hook para obtener actividades por contacto
 */
export const useActivitiesByContact = (contactId: number) => {
    return useQuery({
      queryKey: ACTIVITIES_BY_CONTACT_QUERY_KEY(contactId),
      // Usa el método que ya creaste en la API
      queryFn: () => activityApi.getActivitiesByContact(contactId), 
      enabled: !!contactId && contactId > 0,
    });
  };
  
  /**
   * ✅ HOOK AÑADIDO
   * Hook para obtener actividades por empresa
   */
  export const useActivitiesByCompany = (companyId: number) => {
    return useQuery({
      queryKey: ACTIVITIES_BY_COMPANY_QUERY_KEY(companyId),
      // Usa el método que ya creaste en la API
      queryFn: () => activityApi.getActivitiesByCompany(companyId),
      enabled: !!companyId && companyId > 0,
    });
  };

/**
 * Hook para obtener actividades por deal
 */
export const useActivitiesByDeal = (dealId: number) => {
  return useQuery({
    queryKey: ACTIVITIES_BY_DEAL_QUERY_KEY(dealId),
    queryFn: () => activityApi.getActivitiesByDeal(dealId),
    enabled: !!dealId && dealId > 0,
  });
};

/**
 * Hook para obtener actividades pendientes del usuario
 */
export const useMyPendingActivities = () => {
  return useQuery({
    queryKey: MY_PENDING_ACTIVITIES_QUERY_KEY,
    queryFn: () => activityApi.getMyPendingActivities(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

/**
 * Hook para obtener actividades vencidas
 */
export const useOverdueActivities = () => {
  return useQuery({
    queryKey: OVERDUE_ACTIVITIES_QUERY_KEY,
    queryFn: () => activityApi.getOverdueActivities(),
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

/**
 * Hook para las operaciones en lote (Bulk) y estados de selección.
 */
export const useBulkActivityOperations = () => {
    return useActivityStore(state => ({
        selectedActivityIds: state.selectedActivityIds,
        hasSelection: state.selectedActivityIds.size > 0,
        selectionCount: state.selectedActivityIds.size,
        bulkOperationLoading: state.bulkOperationLoading,
        selectActivity: state.selectActivity,
        selectAllActivities: state.selectAllActivities,
        deselectActivity: state.deselectActivity,
        deselectAllActivities: state.deselectAllActivities,
        bulkUpdateActivities: state.bulkUpdateActivities,
        bulkDeleteActivities: state.bulkDeleteActivities,
        bulkCompleteActivities: state.bulkCompleteActivities,
    }));
}; 
