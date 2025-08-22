import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000, // 3 minutos (coherente con main.tsx)
      gcTime: 5 * 60 * 1000,
      
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      
      retryDelay: (attemptIndex) => {
        return Math.min(500 * 2 ** attemptIndex, 15000);
      },
      
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchInterval: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
      
      onError: (error: any) => {
        console.error('Mutation error:', error);
      },
    },
  },
});