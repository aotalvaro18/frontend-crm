 // src/hooks/useCompanies.ts
// ✅ Enterprise company hooks - VERSIÓN FINAL CON REACT QUERY COMO FUENTE DE VERDAD
// El store de Zustand maneja el estado de la UI y las acciones (mutaciones).
// React Query maneja los datos del servidor (fetching, caching, invalidation).

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';

import { 
  companyApi, 
  handleCompanyApiError 
} from '@/services/api/companyApi';

import type {
  CompanyDTO,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanySearchCriteria
} from '@/types/company.types';

// ============================================
// REACT QUERY KEYS (ÚNICA FUENTE DE VERDAD PARA CACHÉ)
// ============================================
// Exportamos las llaves para que los componentes puedan usarlas con useQuery.
export const COMPANIES_LIST_QUERY_KEY = (criteria: CompanySearchCriteria = {}, page = 0) => 
  ['companies', 'list', { ...criteria, page }];
export const COMPANY_DETAIL_QUERY_KEY = (id: number | null) => ['companies', 'detail', id];
export const COMPANY_STATS_QUERY_KEY = ['companies', 'stats'];

// ============================================
// COMPANY STORE STATE (Simplificado: solo estado de UI y acciones)
// ============================================

interface CompanyState {
  // Estado de operaciones
  isCreating: boolean;
  updating: Set<number>;
  deleting: Set<number>;
  
  // Estado para selecciones y operaciones en lote
  selectedCompanyIds: Set<number>;
  bulkOperationLoading: boolean;
  
  // Acciones (mutaciones y manejo de estado de UI)
  createCompany: (request: CreateCompanyRequest, onSuccess?: (newCompany: CompanyDTO) => void) => Promise<void>;
  updateCompany: (id: number, request: UpdateCompanyRequest, onSuccess?: () => void) => Promise<void>;
  deleteCompany: (id: number, onSuccess?: () => void) => Promise<void>;

  selectCompany: (id: number) => void;
  selectAllCompanies: (companyIds: number[]) => void;
  deselectCompany: (id: number) => void;
  deselectAllCompanies: () => void;
  
  bulkUpdateCompanies: (updates: Partial<Pick<CompanyDTO, 'type' | 'industry' | 'size'>>) => Promise<void>;
  bulkDeleteCompanies: () => Promise<void>;
}

// ============================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================

export const useCompanyStore = create<CompanyState>()(
  devtools(
    (set, get) => ({
      // INITIAL STATE
      isCreating: false,
      updating: new Set(),
      deleting: new Set(),
      selectedCompanyIds: new Set(),
      bulkOperationLoading: false,

      // ============================================
      // ACCIONES DE MUTACIÓN (CUD)
      // ============================================
      
      createCompany: async (request, onSuccess) => {
        set({ isCreating: true });
        try {
          const newCompany = await companyApi.createCompany(request);
          // Invalidar TODO lo relacionado con empresas
          await queryClient.invalidateQueries();
          // Forzar refetch inmediato
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'companies'
          });
          toast.success('Empresa creada exitosamente');
          onSuccess?.(newCompany);
        } catch (error: unknown) {
          toast.error(handleCompanyApiError(error).message);
        } finally {
          set({ isCreating: false });
        }
      },

      updateCompany: async (id, request, onSuccess) => {
        set(state => ({ updating: new Set(state.updating).add(id) }));
        try {
          await companyApi.updateCompany(id, request);
          // Invalidar TODO y refetch específico
          await queryClient.invalidateQueries();
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'companies'
          });
          toast.success('Empresa actualizada exitosamente');
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handleCompanyApiError(error).message);
          throw error; // Re-lanzar para que el componente (ej. modal) sepa que falló
        } finally {
          set(state => {
            const newUpdating = new Set(state.updating);
            newUpdating.delete(id);
            return { updating: newUpdating };
          });
        }
      },

      deleteCompany: async (id, onSuccess) => {
        set(state => ({ deleting: new Set(state.deleting).add(id) }));
        try {
          await companyApi.deleteCompany(id);
          // Invalidar TODO y refetch específico
          await queryClient.invalidateQueries();
          await queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'companies'
          });
          onSuccess?.();
        } catch (error: unknown) {
          toast.error(handleCompanyApiError(error).message);
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
      
      selectCompany: (id) => set(state => ({ selectedCompanyIds: new Set(state.selectedCompanyIds).add(id) })),
      deselectCompany: (id) => set(state => {
        const newSelection = new Set(state.selectedCompanyIds);
        newSelection.delete(id);
        return { selectedCompanyIds: newSelection };
      }),
      selectAllCompanies: (companyIds) => set({ selectedCompanyIds: new Set(companyIds) }),
      deselectAllCompanies: () => set({ selectedCompanyIds: new Set() }),

      bulkUpdateCompanies: async (updates) => {
        const { selectedCompanyIds } = get();
        if (selectedCompanyIds.size === 0) return;
        set({ bulkOperationLoading: true });
        try {
          await companyApi.bulkUpdateCompanies(Array.from(selectedCompanyIds), updates);
          await queryClient.invalidateQueries({ queryKey: ['companies'] });
          set({ selectedCompanyIds: new Set() });
          toast.success(`${selectedCompanyIds.size} empresas actualizadas.`);
        } catch (error: unknown) {
          toast.error(handleCompanyApiError(error).message);
        } finally {
          set({ bulkOperationLoading: false });
        }
      },

      bulkDeleteCompanies: async () => {
        const { selectedCompanyIds } = get();
        if (selectedCompanyIds.size === 0) return;
        set({ bulkOperationLoading: true });
        try {
          await companyApi.bulkDeleteCompanies(Array.from(selectedCompanyIds));
          await queryClient.invalidateQueries({ queryKey: ['companies'] });
          set({ selectedCompanyIds: new Set() });
          toast.success(`${selectedCompanyIds.size} empresas eliminadas.`);
        } catch (error: unknown) {
          toast.error(handleCompanyApiError(error).message);
        } finally {
          set({ bulkOperationLoading: false });
        }
      },
    }),
    {
      name: 'company-ui-store',
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
export const useCompanyOperations = () => {
  const operations = useCompanyStore(state => ({
    createCompany: state.createCompany,
    updateCompany: state.updateCompany,
    deleteCompany: state.deleteCompany,
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
export const useBulkCompanyOperations = () => {
    return useCompanyStore(state => ({
        selectedCompanyIds: state.selectedCompanyIds,
        hasSelection: state.selectedCompanyIds.size > 0,
        selectionCount: state.selectedCompanyIds.size,
        bulkOperationLoading: state.bulkOperationLoading,
        selectCompany: state.selectCompany,
        selectAllCompanies: state.selectAllCompanies,
        deselectCompany: state.deselectCompany,
        deselectAllCompanies: state.deselectAllCompanies,
        bulkUpdateCompanies: state.bulkUpdateCompanies,
        bulkDeleteCompanies: state.bulkDeleteCompanies,
    }));
};
