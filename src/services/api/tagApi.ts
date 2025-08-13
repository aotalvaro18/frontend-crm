// src/services/api/tag.api.ts
// Servicio de API para gestionar Tags, 100% alineado con la arquitectura existente.

import { apiClient } from './baseApi';
import { API_ENDPOINTS } from '@/utils/constants';

// --- Tipos ---
// ✅ CORRECTO: Importamos todos los tipos desde la única fuente de verdad.
import type { 
  PageRequest, 
  PageResponse, 
  Tag, 
  CreateTagRequest, // Ya existe en common.types.ts
  UpdateEntityRequest 
} from '@/types/common.types';

// ============================================
// TIPOS ESPECÍFICOS DE ESTE SERVICIO
// ============================================

// ✅ CORRECTO: Creamos tipos para las operaciones que no son genéricas.
// UpdateTagRequest extiende el tipo genérico para asegurar la consistencia.
export type UpdateTagRequest = UpdateEntityRequest<Tag>;

export interface BulkAssignTagsRequest {
  entityType: 'CONTACT' | 'DEAL' | 'COMPANY';
  entityIds: number[];
  tagIds: number[];
}

// ============================================
// CLASE DEL SERVICIO DE API PARA TAGS
// ============================================

export class TagApiService {

  /**
   * Búsqueda y paginación de tags.
   * Matches: GET /api/crm/tags
   */
  async searchTags(pagination: PageRequest): Promise<PageResponse<Tag>> {
    const params = {
      page: pagination.page,
      size: pagination.size,
      sort: pagination.sort.join(','),
    };
    return apiClient.get<PageResponse<Tag>>(API_ENDPOINTS.TAGS, params);
  }

  /**
   * Obtener un tag por su ID.
   * Matches: GET /api/crm/tags/{id}
   */
  async getTagById(id: number): Promise<Tag> {
    return apiClient.get<Tag>(API_ENDPOINTS.TAG_BY_ID(id));
  }

  /**
   * Crear un nuevo tag.
   * Matches: POST /api/crm/tags
   */
  async createTag(request: CreateTagRequest): Promise<Tag> {
    return apiClient.post<Tag>(API_ENDPOINTS.TAGS, request);
  }

  /**
   * Actualizar un tag existente.
   * Matches: PUT /api/crm/tags/{id}
   */
  async updateTag(id: number, request: UpdateTagRequest): Promise<Tag> {
    return apiClient.put<Tag>(API_ENDPOINTS.TAG_BY_ID(id), request);
  }

  /**
   * Eliminar un tag.
   * Matches: DELETE /api/crm/tags/{id}
   */
  async deleteTag(id: number): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.TAG_BY_ID(id));
  }

  /**
   * Autocompletar tags basado en un término de búsqueda.
   * Matches: GET /api/crm/tags/autocomplete
   */
  async autocompleteTags(term: string, limit: number = 10): Promise<Tag[]> {
    const params = { term, limit };
    return apiClient.get<Tag[]>(API_ENDPOINTS.TAG_AUTOCOMPLETE, params);
  }

  /**
   * Asignar tags en lote a múltiples entidades.
   * Matches: POST /api/crm/tags/bulk-assign
   */
  async bulkAssignTags(request: BulkAssignTagsRequest): Promise<void> {
    return apiClient.post<void>(API_ENDPOINTS.TAG_BULK_ASSIGN, request);
  }

  /**
   * Obtener estadísticas de uso de los tags.
   * Matches: GET /api/crm/tags/usage-stats
   * El tipo de retorno puede variar, usamos un genérico Record<string, any>.
   */
  async getTagUsageStats(): Promise<Record<string, any>> {
    return apiClient.get<Record<string, any>>(API_ENDPOINTS.TAG_USAGE_STATS);
  }
}

// ============================================
// INSTANCIA SINGLETON DEL SERVICIO
// ============================================

export const tagApi = new TagApiService();