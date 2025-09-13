// src/hooks/useUsers.ts
// ✅ USER HOOKS SIMPLIFICADOS PARA EL CRM
// Responsabilidad única: Obtener datos de usuarios del auth-service para mostrarlos en la UI del CRM.
// NO contiene lógica de gestión, filtros complejos, o paginación.

import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/services/api/userApi';
import type { UserDTO } from '@/types/user.types';
import { useCurrentUser } from '@/stores/authStore';

// ============================================
// REACT QUERY KEYS (Solo las necesarias para el CRM)
// ============================================

export const USER_QUERY_KEYS = {
  all: ['users'] as const,
  details: () => [...USER_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...USER_QUERY_KEYS.details(), id] as const,
  byCognitoSub: (cognitoSub: string) => [...USER_QUERY_KEYS.all, 'cognito', cognitoSub] as const,
  
  // ✅ LA MÁS IMPORTANTE PARA EL CRM: Una única lista de usuarios activos para los selectores
  activeList: () => [...USER_QUERY_KEYS.all, 'list', 'active'] as const,
} as const;

// ============================================
// HOOKS DE FETCHING (Solo los necesarios para el CRM)
// ============================================

/**
 * Hook para obtener un usuario por su ID numérico.
 * Útil si alguna entidad del CRM guarda el ID numérico del usuario.
 */
export const useUserById = (id: number | null) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.detail(id!), // El '!' es seguro por `enabled`
    queryFn: () => userApi.getUserById(id!),
    enabled: !!id && id > 0, // Solo se ejecuta si hay un ID válido
    staleTime: 1000 * 60 * 5, // Cachear por 5 minutos
  });
};

/**
 * Hook para obtener un usuario por su CognitoSub.
 * Muy útil para mostrar el nombre del 'owner' de un Deal o Contacto.
 */
export const useUserByCognitoSub = (cognitoSub: string | null) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.byCognitoSub(cognitoSub!),
    queryFn: () => userApi.getUserByCognitoSub(cognitoSub!),
    enabled: !!cognitoSub,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * ✅ HOOK PRINCIPAL PARA EL CRM
 * Hook para obtener la lista completa de usuarios activos de la organización.
 * Perfecto para poblar los selectores de "Asignar a" o "Propietario".
 */
export const useActiveUsers = () => {
    // 2. Obtén el objeto 'user' del store de autenticación.
    const user = useCurrentUser();
  
    // 3. LA RUTA CORRECTA: Accede a 'churchId' directamente desde el objeto 'user'.
    const churchId = user?.churchId;
  
    return useQuery({
      queryKey: USER_QUERY_KEYS.activeList(),
      
      // 4. Llama al método que SÍ existe en tu userApi.ts
      // El '!' es seguro porque 'enabled' nos protege.
      queryFn: () => userApi.getActiveUsersByChurch(churchId!),
  
      // 5. `enabled` previene la llamada si el usuario no ha cargado o no tiene un churchId
      enabled: !!churchId, 
  
      staleTime: 1000 * 60 * 5, // Se cachea por 5 minutos
    });
  };