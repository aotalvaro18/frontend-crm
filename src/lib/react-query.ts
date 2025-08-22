import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Datos siempre stale
      gcTime: 0,    // Sin caché
      
      // ✅ CRÍTICO: Desactivar structural sharing
      structuralSharing: false,
      
      // ✅ CRÍTICO: Forzar datos frescos inmediatamente
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: 'always',
      notifyOnChangeProps: 'all',
      
      retry: 1,
      retryDelay: 1000,
      
      refetchInterval: false,
      networkMode: 'online',
    },
    mutations: {
      retry: 0,
      networkMode: 'online',
    },
  },
});