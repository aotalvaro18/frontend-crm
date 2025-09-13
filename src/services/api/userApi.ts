// src/services/api/userApi.ts
// ✅ USER API SERVICE - SIGUIENDO GOLDEN STANDARD COMPANIES
// Servicio para interactuar con el AuthService UserController
// Maneja usuarios, perfiles, búsquedas y operaciones de administración

import { apiClient } from './baseApi';
import { ERROR_CODES } from '@/utils/constants';
import type { PageResponse } from '@/types/common.types';

//import { ERROR_CODES }
import type { 
  PagedResponse
} from '@/types/api.types';

import type { 
  UserDTO, 
  UserUpdateDTO,
  MessageResponseDTO 
} from '@/types/user.types';

// ============================================
// CONSTANTS
// ============================================
const USER_ENDPOINTS = {
  BASE: '/api/users',
  ME: '/api/users/me',
  BY_ID: (id: number) => `/api/users/${id}`,
  BY_CHURCH: (churchId: number) => `/api/users/church/${churchId}`,
  BY_COGNITO_SUB: (cognitoSub: string) => `/api/users/cognito/${cognitoSub}`,
  DEACTIVATE: (userId: number) => `/api/users/${userId}/deactivate`,
  ACTIVATE: (userId: number) => `/api/users/${userId}/activate`,
  SYNC_COGNITO: '/api/users/sync-from-cognito',
  SEARCH: '/api/users/search',
} as const;

// ============================================
// USER API SERVICE CLASS
// ============================================
export class UserApiService {
  
  // ============================================
  // PROFILE OPERATIONS
  // ============================================
  
  /**
   * Obtiene el perfil del usuario autenticado actualmente.
   * 
   * @returns UserDTO con la información completa del usuario actual
   * @throws {ApiError} Si no hay usuario autenticado o error de servidor
   */
  async getCurrentUser(): Promise<UserDTO> {
    console.log('🔍 Obteniendo perfil del usuario actual...');
    
    try {
      const user = await apiClient.get<UserDTO>(USER_ENDPOINTS.ME);
      console.log('✅ Perfil del usuario actual obtenido:', user.email);
      return user;
    } catch (error) {
      console.error('❌ Error al obtener perfil del usuario actual:', error);
      throw error;
    }
  }
  
  /**
   * Actualiza el perfil del usuario actual.
   * Solo actualiza información en la base de datos local, no en Cognito.
   * 
   * @param updateData - Datos a actualizar en el perfil
   * @returns UserDTO con la información actualizada
   * @throws {ApiError} Para errores de validación o servidor
   */
  async updateCurrentUserProfile(updateData: UserUpdateDTO): Promise<UserDTO> {
    console.log('🔄 Actualizando perfil del usuario actual...');
    
    try {
      const updatedUser = await apiClient.put<UserDTO>(
        USER_ENDPOINTS.ME, 
        updateData
      );
      console.log('✅ Perfil actualizado exitosamente:', updatedUser.email);
      return updatedUser;
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      throw error;
    }
  }
  
  /**
   * Sincroniza los datos del usuario actual desde Cognito hacia la base de datos local.
   * Útil cuando se han realizado cambios en Cognito que deben reflejarse localmente.
   * 
   * @returns Mensaje de confirmación de la sincronización
   * @throws {ApiError} Si hay problemas de conectividad con Cognito
   */
  async syncCurrentUserFromCognito(): Promise<MessageResponseDTO> {
    console.log('🔄 Sincronizando datos del usuario desde Cognito...');
    
    try {
      const response = await apiClient.post<MessageResponseDTO>(
        USER_ENDPOINTS.SYNC_COGNITO,
        {}
      );
      console.log('✅ Sincronización completada:', response.message);
      return response;
    } catch (error) {
      console.error('❌ Error al sincronizar desde Cognito:', error);
      throw error;
    }
  }
  
  // ============================================
  // USER LOOKUP OPERATIONS  
  // ============================================
  
  /**
   * Obtiene un usuario específico por su ID.
   * Requiere permisos administrativos o ser el propio usuario.
   * 
   * @param id - ID del usuario a obtener
   * @returns UserDTO con la información del usuario
   * @throws {ApiError} Si no se tiene permisos o el usuario no existe
   */
  async getUserById(id: number): Promise<UserDTO> {
    console.log(`🔍 Obteniendo usuario por ID: ${id}`);
    
    try {
      const user = await apiClient.get<UserDTO>(USER_ENDPOINTS.BY_ID(id));
      console.log('✅ Usuario obtenido:', user.email);
      return user;
    } catch (error) {
      console.error(`❌ Error al obtener usuario ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtiene un usuario por su CognitoSub.
   * Endpoint usado principalmente por otros servicios para validar usuarios.
   * 
   * @param cognitoSub - Identificador único de Cognito del usuario
   * @returns UserDTO si se encuentra el usuario
   * @throws {ApiError} Si el usuario no existe en la base de datos local
   */
  async getUserByCognitoSub(cognitoSub: string): Promise<UserDTO> {
    console.log(`🔍 Obteniendo usuario por CognitoSub: ${cognitoSub}`);
    
    try {
      const user = await apiClient.get<UserDTO>(
        USER_ENDPOINTS.BY_COGNITO_SUB(cognitoSub)
      );
      console.log('✅ Usuario encontrado por CognitoSub:', user.email);
      return user;
    } catch (error) {
      console.error(`❌ Error al obtener usuario por CognitoSub ${cognitoSub}:`, error);
      throw error;
    }
  }
  
  // ============================================
  // SEARCH & FILTERING OPERATIONS
  // ============================================
  
  /**
   * Busca usuarios pertenecientes a una iglesia específica con paginación.
   * Requiere permisos administrativos o acceso a esa iglesia.
   * 
   * @param churchId - ID de la iglesia
   * @param searchTerm - Término de búsqueda opcional para filtrar por nombre
   * @param page - Número de página (base 0)
   * @param size - Tamaño de página
   * @returns Respuesta paginada con los usuarios encontrados
   * @throws {ApiError} Si no se tienen permisos para acceder a la iglesia
   */
  async getUsersByChurch(
    churchId: number,
    searchTerm?: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<UserDTO>> { // <-- 1. CAMBIO: El tipo de retorno ahora es PageResponse
    console.log(`🔍 Buscando usuarios en iglesia ${churchId}, página ${page}, término: "${searchTerm || 'todos'}"`);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });
      
      if (searchTerm?.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      const url = `${USER_ENDPOINTS.BY_CHURCH(churchId)}?${params}`;
      
      // Hacemos el get y esperamos el wrapper PagedResponse
      const pagedResponseWrapper = await apiClient.get<PagedResponse<UserDTO>>(url);
      
      // Desempaquetamos la data
      const pageData = pagedResponseWrapper.data;
  
      // ✅ 2. CAMBIO: Logueamos usando la data desempaquetada
      console.log(`✅ Encontrados ${pageData.content.length} usuarios de ${pageData.totalElements} total`);
      
      // ✅ 3. CAMBIO: Retornamos solo la data, que es del tipo PageResponse<UserDTO>
      return pageData;
  
    } catch (error) {
      console.error(`❌ Error al buscar usuarios en iglesia ${churchId}:`, error);
      throw error;
    }
  }
  
  /**
   * Busca usuarios que pueden ser asignados como líderes de ministerios.
   * Filtra por organización e iglesia para mantener la seguridad.
   * 
   * @param query - Término de búsqueda para filtrar usuarios por nombre
   * @param organizationId - ID de la organización
   * @param churchId - ID de la iglesia
   * @returns Lista de usuarios que pueden ser líderes
   * @throws {ApiError} Si no se tienen permisos para la organización
   */
  async searchUsersForLeadership(
    query: string,
    organizationId: number,
    churchId: number
  ): Promise<UserDTO[]> {
    console.log(`🔍 Buscando usuarios para liderazgo: "${query}" en org ${organizationId}, iglesia ${churchId}`);
    
    try {
      const params = new URLSearchParams({
        query: query.trim(),
        organizationId: organizationId.toString(),
        churchId: churchId.toString(),
      });
      
      const url = `${USER_ENDPOINTS.SEARCH}?${params}`;
      const users = await apiClient.get<UserDTO[]>(url);
      
      console.log(`✅ Encontrados ${users.length} usuarios candidatos para liderazgo`);
      return users;
    } catch (error) {
      console.error('❌ Error al buscar usuarios para liderazgo:', error);
      // En caso de error, devolver lista vacía para no romper la UI
      return [];
    }
  }
  
  // ============================================
  // ADMIN OPERATIONS
  // ============================================
  
  /**
   * Desactiva un usuario tanto en la base de datos local como en Cognito.
   * Requiere permisos administrativos o gestión de usuarios de la iglesia.
   * 
   * @param userId - ID del usuario a desactivar
   * @returns Mensaje de confirmación de la operación
   * @throws {ApiError} Si no se tienen permisos o el usuario no existe
   */
  async deactivateUser(userId: number): Promise<MessageResponseDTO> {
    console.log(`🔒 Desactivando usuario ID: ${userId}`);
    
    try {
      const response = await apiClient.post<MessageResponseDTO>(
        USER_ENDPOINTS.DEACTIVATE(userId),
        {}
      );
      console.log('✅ Usuario desactivado exitosamente:', response.message);
      return response;
    } catch (error) {
      console.error(`❌ Error al desactivar usuario ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Activa un usuario tanto en la base de datos local como en Cognito.
   * Requiere permisos administrativos o gestión de usuarios de la iglesia.
   * 
   * @param userId - ID del usuario a activar
   * @returns Mensaje de confirmación de la operación
   * @throws {ApiError} Si no se tienen permisos o el usuario no existe
   */
  async activateUser(userId: number): Promise<MessageResponseDTO> {
    console.log(`🔓 Activando usuario ID: ${userId}`);
    
    try {
      const response = await apiClient.post<MessageResponseDTO>(
        USER_ENDPOINTS.ACTIVATE(userId),
        {}
      );
      console.log('✅ Usuario activado exitosamente:', response.message);
      return response;
    } catch (error) {
      console.error(`❌ Error al activar usuario ${userId}:`, error);
      throw error;
    }
  }
  
  // ============================================
  // CONVENIENCE METHODS
  // ============================================
  
  /**
   * Obtiene usuarios activos de una iglesia (sin paginación).
   * Útil para selectores y componentes que necesitan todos los usuarios.
   * 
   * @param churchId - ID de la iglesia
   * @returns Lista completa de usuarios activos
   */
  async getActiveUsersByChurch(churchId: number): Promise<UserDTO[]> {
    console.log(`🔍 Obteniendo todos los usuarios activos de iglesia ${churchId}`);
    
    try {
      // Hacer múltiples llamadas si es necesario para obtener todos los usuarios
      let allUsers: UserDTO[] = [];
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        const response = await this.getUsersByChurch(churchId, undefined, page, 100);
        allUsers = [...allUsers, ...response.content];
        hasMore = !response.last;
        page++;
        
        // Protección contra loops infinitos
        if (page > 50) break;
      }
      
      console.log(`✅ Total de usuarios activos obtenidos: ${allUsers.length}`);
      return allUsers;
    } catch (error) {
      console.error(`❌ Error al obtener usuarios activos de iglesia ${churchId}:`, error);
      throw error;
    }
  }
}

// ============================================
// ERROR HANDLING HELPER
// ============================================

/**
 * Procesa errores específicos de la API de usuarios y devuelve un formato consistente.
 * Sigue el mismo patrón que companyApi para mantener consistencia.
 * 
 * @param error - Error capturado de la API
 * @returns Objeto de error procesado con información para la UI
 */
export const handleUserApiError = (error: any): {
  type: 'validation_error' | 'not_found' | 'forbidden' | 'network_error' | 'unknown_error';
  message: string;
  action?: 'retry' | 'redirect_to_list' | 'retry_when_online' | 'contact_admin';
  fieldErrors?: Record<string, string>;
} => {
  console.error('🔥 Error en UserAPI:', error);

  if (error.status === 400) {
    return {
      type: 'validation_error' as const,
      message: 'Los datos proporcionados no son válidos.',
      fieldErrors: error.details || {},
    };
  }

  if (error.status === 403) {
    return {
      type: 'forbidden' as const,
      message: 'No tienes permisos para realizar esta acción.',
      action: 'contact_admin',
    };
  }

  if (error.status === 404) {
    return {
      type: 'not_found' as const,
      message: 'El usuario no fue encontrado.',
      action: 'redirect_to_list',
    };
  }

  if (error.code === ERROR_CODES.NETWORK_ERROR) {
    return {
      type: 'network_error' as const,
      message: 'Sin conexión a internet.',
      action: 'retry_when_online',
    };
  }

  return {
    type: 'unknown_error' as const,
    message: error.message || 'Error desconocido.',
    action: 'retry',
  };
};

// ============================================
// SINGLETON INSTANCE
// ============================================
// Creamos y exportamos una única instancia del servicio para usar en toda la aplicación.
export const userApi = new UserApiService();

export default userApi;