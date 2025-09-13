// src/hooks/useDeals.ts
// ✅ Enterprise deal hooks - VERSIÓN FINAL CON REACT QUERY COMO FUENTE DE VERDAD
// El store de Zustand maneja el estado de la UI y las acciones (mutaciones).
// React Query maneja los datos del servidor (fetching, caching, invalidation).

//import { useQuery } from '@tanstack/react-query';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { 
  dealApi 
} from '@/services/api/dealApi';

import type {
  DealDTO,
  DealSearchCriteria
} from '@/types/deal.types';

import type { PageRequest, PageResponse } from '@/types/common.types';


// ============================================
// RE-EXPORTAR HOOKS DEL STORE (para consistencia de imports)
// ============================================
export {
  useDealOperations,
  useDealFilters,
  //useDealSelection,
  useDealPagination,
  useDealView,
  useDealQueryParams,
  useBulkDealOperations // <-- ✅ AÑADE ESTE
} from '@/stores/dealStore';

// ============================================
// REACT QUERY KEYS (ÚNICA FUENTE DE VERDAD PARA CACHÉ)
// ============================================

export const DEALS_LIST_QUERY_KEY = (criteria: DealSearchCriteria, page: number, pageSize: number) => 
  ['deals', 'list', criteria, page, pageSize] as const;

export const DEAL_DETAIL_QUERY_KEY = (id: number) => 
  ['deals', 'detail', id] as const;

export const DEAL_STATS_QUERY_KEY = () => 
  ['deals', 'stats'] as const;

export const DEALS_AUTOCOMPLETE_QUERY_KEY = (term: string) => 
  ['deals', 'autocomplete', term] as const;

export const DEALS_BY_CONTACT_QUERY_KEY = (contactId: number) => 
  ['deals', 'by-contact', contactId] as const;

export const DEALS_BY_COMPANY_QUERY_KEY = (companyId: number) => 
  ['deals', 'by-company', companyId] as const;

export const DEALS_BY_STAGE_QUERY_KEY = (stageId: number) => 
  ['deals', 'by-stage', stageId] as const;

export const DEALS_BY_PIPELINE_QUERY_KEY = (pipelineId: number) => 
  ['deals', 'by-pipeline', pipelineId] as const;

export const DEAL_PIPELINE_KANBAN_QUERY_KEY = (pipelineId: number) => 
  ['deals', 'pipeline', 'kanban', pipelineId] as const;

// ============================================
// HOOKS DE REACT QUERY (SOLO DATOS DEL SERVIDOR)
// ============================================

/**
 * Hook para obtener deal por ID
 */
export const useDealById = (id: number) => {
  return useQuery({
    queryKey: DEAL_DETAIL_QUERY_KEY(id),
    queryFn: () => dealApi.getDealById(id),
    enabled: !!id && id > 0,
  });
};

/**
 * Hook para obtener deals con búsqueda y paginación
 */
export const useDealsSearch = (
  criteria: DealSearchCriteria = {},
  pagination: PageRequest = { page: 0, size: 25, sort: ['name,asc'] }
) => {
  return useQuery({
    queryKey: DEALS_LIST_QUERY_KEY(criteria, pagination.page, pagination.size),
    queryFn: () => dealApi.searchDeals(criteria, pagination),
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook para autocompletar deals
 */
export const useDealsAutocomplete = (query: string, limit: number = 10) => {
  return useQuery({
    queryKey: DEALS_AUTOCOMPLETE_QUERY_KEY(query),
    queryFn: () => dealApi.autocompleteDeal(query, limit),
    enabled: !!query && query.length >= 2,
    staleTime: 30 * 1000, // 30 segundos
  });
};

/**
 * Hook para estadísticas de deals
 */
export const useDealStats = () => {
  return useQuery({
    queryKey: DEAL_STATS_QUERY_KEY(),
    queryFn: () => dealApi.getDealStats(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener datos del Kanban de un pipeline específico
 */
export const usePipelineKanbanData = (pipelineId: number) => {
  return useQuery({
    queryKey: DEAL_PIPELINE_KANBAN_QUERY_KEY(pipelineId),
    queryFn: () => dealApi.getPipelineKanbanData(pipelineId),
    enabled: !!pipelineId && pipelineId > 0,
    staleTime: 30 * 1000, // 30 segundos - datos más frescos para Kanban
  });
};

// ============================================
// HOOKS ESPECIALIZADOS PARA QUERIES ESPECÍFICAS
// ============================================

/**
 * Hook para obtener deals de un contacto específico
 */
export const useDealsByContact = (
    contactId: number,
    // Opciones genéricas para máxima flexibilidad
    options?: Omit<
      // 1. TData: El tipo de dato que devuelve la queryFn
      // 2. TError: El tipo del error
      // 3. TSelectData: El tipo de dato DESPUÉS de aplicar 'select'
      // 4. TQueryKey: El tipo de la query key
      UseQueryOptions<PageResponse<DealDTO>, Error, DealDTO[]>, 
      'queryKey' | 'queryFn'
    >
  ) => {
    return useQuery({
      queryKey: DEALS_BY_CONTACT_QUERY_KEY(contactId),
      // Esta función devuelve Promise<PageResponse<DealDTO>>
      queryFn: () => dealApi.searchDeals({ contactId }, { page: 0, size: 100, sort: ['name,asc'] }),
      
      // Esta función transforma PageResponse<DealDTO> en DealDTO[]
      select: (data) => data.content,
      
      enabled: !!contactId && contactId > 0,
      ...options,
    });
  };

/**
 * Hook para obtener deals de una empresa específica
 */
export const useDealsByCompany = (companyId: number) => {
  return useQuery({
    queryKey: DEALS_BY_COMPANY_QUERY_KEY(companyId),
    queryFn: () => dealApi.searchDeals({ companyId }, { page: 0, size: 100, sort: ['name,asc'] }),
    enabled: !!companyId && companyId > 0,
    select: (data: PageResponse<DealDTO>) => data.content,
  });
};

/**
 * Hook para obtener deals de una etapa específica
 */
export const useDealsByStage = (stageId: number) => {
  return useQuery({
    queryKey: DEALS_BY_STAGE_QUERY_KEY(stageId),
    queryFn: () => dealApi.searchDeals({ stageId }, { page: 0, size: 100, sort: ['name,asc'] }),
    enabled: !!stageId && stageId > 0,
    select: (data: PageResponse<DealDTO>) => data.content,
  });
};

/**
 * Hook para obtener deals de un pipeline específico
 */
export const useDealsByPipeline = (pipelineId: number) => {
  return useQuery({
    queryKey: DEALS_BY_PIPELINE_QUERY_KEY(pipelineId),
    queryFn: () => dealApi.searchDeals({ pipelineId }, { page: 0, size: 100, sort: ['name,asc'] }),
    enabled: !!pipelineId && pipelineId > 0,
    select: (data: PageResponse<DealDTO>) => data.content,
  });
};