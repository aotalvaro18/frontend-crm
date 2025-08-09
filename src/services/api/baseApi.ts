// src/services/api/baseApi.ts
// ✅ SOLUCIÓN REAL: Sin generateClient que causa excessive stack depth
// Compatible con TypeScript 5.4.5 + React 18.3.3

import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
//import toast from 'react-hot-toast';
import { env } from '@/config/environment';

// ============================================
// TIPOS SIMPLES (Sin excessive stack depth)
// ============================================

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  enableOfflineQueue?: boolean;
  enableCaching?: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, any>;
  timestamp?: string;
  path?: string;
  currentVersion?: number;
  attemptedVersion?: number;
  fieldErrors?: Record<string, string[]>;
}

interface OfflineQueueItem {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  timestamp: number;
  retries: number;
}

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

interface NetworkInfo {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  isSlowConnection?: boolean;
  isFastConnection?: boolean;
}

// ============================================
// ERROR CODES Y MESSAGES
// ============================================

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTITY: 'DUPLICATE_ENTITY',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  CONCURRENT_MODIFICATION: 'CONCURRENT_MODIFICATION',
  OPTIMISTIC_LOCKING_FAILURE: 'OPTIMISTIC_LOCKING_FAILURE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Los datos ingresados no son válidos',
  [ERROR_CODES.DUPLICATE_ENTITY]: 'Ya existe un registro con estos datos',
  [ERROR_CODES.DUPLICATE_EMAIL]: 'Este email ya está registrado',
  [ERROR_CODES.CONCURRENT_MODIFICATION]: 'Este registro fue modificado por otro usuario',
  [ERROR_CODES.OPTIMISTIC_LOCKING_FAILURE]: 'Conflicto de versiones detectado',
  [ERROR_CODES.UNAUTHORIZED]: 'No tienes permisos para realizar esta acción',
  [ERROR_CODES.FORBIDDEN]: 'Acceso denegado',
  [ERROR_CODES.NOT_FOUND]: 'El recurso solicitado no fue encontrado',
  [ERROR_CODES.NETWORK_ERROR]: 'Error de conexión. Verifica tu internet',
  [ERROR_CODES.TIMEOUT_ERROR]: 'La solicitud tardó demasiado en responder',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Error desconocido',
};

// ============================================
// NETWORK MANAGER
// ============================================

class NetworkManager {
  private isOnline: boolean = navigator.onLine;
  private connectionInfo: NetworkInfo;
  private listeners: ((info: NetworkInfo) => void)[] = [];

  constructor() {
    this.connectionInfo = this.getConnectionInfo();
    this.setupNetworkListeners();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => this.updateConnectionStatus(true));
    window.addEventListener('offline', () => this.updateConnectionStatus(false));
  }

  private updateConnectionStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    this.connectionInfo = this.getConnectionInfo();
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.connectionInfo));
  }

  getConnectionInfo(): NetworkInfo {
    return {
      isOnline: this.isOnline,
      connectionType: 'unknown',
      effectiveType: 'unknown',
    };
  }

  onNetworkChange(callback: (info: NetworkInfo) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
}

// ============================================
// CACHE MANAGER
// ============================================

class CacheManager {
  private cache = new Map<string, CacheItem>();
  private readonly maxSize = 100;

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    if (this.cache.size >= this.maxSize) {
      this.cleanExpired();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(prefix?: string): void {
    if (prefix) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.startsWith(prefix)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  private cleanExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
  }
}

// ============================================
// OFFLINE QUEUE MANAGER
// ============================================

class OfflineQueueManager {
  private queue: OfflineQueueItem[] = [];
  private readonly storageKey = 'api_offline_queue';
  private isProcessing = false;

  constructor() {
    this.loadFromStorage();
  }

  add(method: string, endpoint: string, data?: any): string {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const item: OfflineQueueItem = {
      id,
      method: method as any,
      endpoint,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(item);
    this.saveToStorage();
    return id;
  }

  async processQueue(apiClient: BaseApiClient): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    try {
      const itemsToProcess = [...this.queue];
      this.queue = [];

      for (const item of itemsToProcess) {
        try {
          await this.processItem(item, apiClient);
        } catch (error) {
          item.retries++;
          if (item.retries < 3) {
            this.queue.push(item);
          }
        }
      }

      this.saveToStorage();
    } finally {
      this.isProcessing = false;
    }
  }

  private async processItem(item: OfflineQueueItem, apiClient: BaseApiClient): Promise<void> {
    switch (item.method) {
      case 'GET':
        await apiClient.get(item.endpoint);
        break;
      case 'POST':
        await apiClient.post(item.endpoint, item.data);
        break;
      case 'PUT':
        await apiClient.put(item.endpoint, item.data);
        break;
      case 'DELETE':
        await apiClient.delete(item.endpoint);
        break;
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.warn('Failed to save offline queue:', error);
    }
  }
}

// ============================================
// BASE API CLIENT
// ============================================

export class BaseApiClient {
  private networkManager: NetworkManager;
  private cacheManager: CacheManager;
  private offlineQueue: OfflineQueueManager;
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
    this.networkManager = new NetworkManager();
    this.cacheManager = new CacheManager();
    this.offlineQueue = new OfflineQueueManager();

    this.setupNetworkManager();
    this.setupAuthListener();
  }

  private setupNetworkManager() {
    this.networkManager.onNetworkChange((info) => {
      if (info.isOnline) {
        this.offlineQueue.processQueue(this);
      }
    });
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Platform': 'web-mobile',
      'X-Client-Version': '3.0.0',
    };

    try {
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken;
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken.toString()}`;
        
        // Add organization context if available
        const payload = accessToken.payload || {};
        const organizationId = payload['custom:organizationId'] as string;
        const churchId = payload['custom:churchId'] as string;
        
        if (organizationId) {
          headers['X-Organization-Id'] = organizationId.toString();
        }
        if (churchId) {
          headers['X-Church-Id'] = churchId.toString();
        }
      }
    } catch (error) {
      console.warn('Failed to get auth session:', error);
    }

    return headers;
  }

  private setupAuthListener() {
    Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedOut':
        case 'tokenRefresh_failure':
          this.cacheManager.clear();
          break;
        case 'signedIn':
        case 'tokenRefresh':
          if (this.networkManager.getConnectionInfo().isOnline) {
            this.offlineQueue.processQueue(this);
          }
          break;
      }
    });
  }

  private createApiError(response: Response, data: any): ApiError {
    const errorData = data || {};
    
    const apiError: ApiError = {
      code: errorData.code || 'UNKNOWN_ERROR',
      message: errorData.message || ERROR_MESSAGES[errorData.code] || 'Error desconocido',
      status: response.status,
      details: errorData.details || {},
      timestamp: errorData.timestamp,
      path: errorData.path,
    };

    // Handle specific backend errors
    switch (response.status) {
      case 401:
        apiError.code = ERROR_CODES.UNAUTHORIZED;
        apiError.message = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        break;
      case 403:
        apiError.code = ERROR_CODES.FORBIDDEN;
        apiError.message = 'No tienes permisos para realizar esta acción.';
        break;
      case 404:
        apiError.code = ERROR_CODES.NOT_FOUND;
        apiError.message = 'El recurso solicitado no fue encontrado.';
        break;
      case 409:
        if (errorData.code === 'OPTIMISTIC_LOCKING_FAILURE') {
          apiError.currentVersion = errorData.details?.currentVersion;
          apiError.attemptedVersion = errorData.details?.attemptedVersion;
        }
        break;
      case 422:
        apiError.code = ERROR_CODES.VALIDATION_ERROR;
        apiError.fieldErrors = errorData.details?.fieldErrors || {};
        break;
    }

    return apiError;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = {};
      }
      
      const apiError = this.createApiError(response, errorData);
      
      if (response.status === 401 && typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      throw apiError;
    }

    let data: T;
    try {
      data = await response.json();
    } catch {
      data = null as T;
    }
    
    return data;
  }

  // ============================================
  // HTTP METHODS
  // ============================================

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const cacheKey = `GET:${endpoint}:${JSON.stringify(params || {})}`;
    
    const cached = this.cacheManager.get(cacheKey);
    if (cached && this.networkManager.getConnectionInfo().isOnline) {
      return cached;
    }

    if (!this.networkManager.getConnectionInfo().isOnline) {
      if (cached) return cached;
      const offlineError: ApiError = {
        code: ERROR_CODES.NETWORK_ERROR,
        message: 'Sin conexión a internet',
        status: 0,
        details: {},
      };
      throw offlineError;
    }

    try {
      const url = new URL(`${env.apiBaseUrl}${endpoint}`);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const headers = await this.getAuthHeaders();
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      const data = await this.handleResponse<T>(response);
      this.cacheManager.set(cacheKey, data);
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        const timeoutError: ApiError = {
          code: ERROR_CODES.TIMEOUT_ERROR,
          message: 'La solicitud tardó demasiado en responder',
          status: 0,
          details: {},
        };
        throw timeoutError;
      }
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    if (!this.networkManager.getConnectionInfo().isOnline) {
      this.offlineQueue.add('POST', endpoint, data);
      const offlineError: ApiError = {
        code: ERROR_CODES.NETWORK_ERROR,
        message: 'Sin conexión. La acción se realizará cuando recuperes la conexión.',
        status: 0,
        details: {},
      };
      throw offlineError;
    }

    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${env.apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(this.config.timeout),
    });

    const result = await this.handleResponse<T>(response);
    this.cacheManager.clear(endpoint.split('/')[1] || '');
    return result;
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    if (!this.networkManager.getConnectionInfo().isOnline) {
      this.offlineQueue.add('PUT', endpoint, data);
      const offlineError: ApiError = {
        code: ERROR_CODES.NETWORK_ERROR,
        message: 'Sin conexión. La acción se realizará cuando recuperes la conexión.',
        status: 0,
        details: {},
      };
      throw offlineError;
    }

    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${env.apiBaseUrl}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(this.config.timeout),
    });

    const result = await this.handleResponse<T>(response);
    this.cacheManager.clear(endpoint.split('/')[1] || '');
    return result;
  }

  async delete<T>(endpoint: string): Promise<T> {
    if (!this.networkManager.getConnectionInfo().isOnline) {
      this.offlineQueue.add('DELETE', endpoint);
      const offlineError: ApiError = {
        code: ERROR_CODES.NETWORK_ERROR,
        message: 'Sin conexión. La acción se realizará cuando recuperes la conexión.',
        status: 0,
        details: {},
      };
      throw offlineError;
    }

    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${env.apiBaseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
      signal: AbortSignal.timeout(this.config.timeout),
    });

    const result = await this.handleResponse<T>(response);
    this.cacheManager.clear(endpoint.split('/')[1] || '');
    return result;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  clearCache(prefix?: string): void {
    this.cacheManager.clear(prefix);
  }

  getConnectionInfo(): NetworkInfo {
    return this.networkManager.getConnectionInfo();
  }

  onNetworkChange(callback: (info: NetworkInfo) => void): () => void {
    return this.networkManager.onNetworkChange(callback);
  }
}

// ============================================
// CONFIGURATION & EXPORT
// ============================================

const apiConfig: ApiConfig = {
  baseURL: env.apiBaseUrl,
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  enableOfflineQueue: true,
  enableCaching: true,
};

export const apiClient = new BaseApiClient(apiConfig);