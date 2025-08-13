// src/services/upload/s3Service.ts
// ✅ S3 SERVICE ENTERPRISE - SIGUIENDO GUÍA ARQUITECTÓNICA EKLESA
// Principio: Separación de responsabilidades - Este service SOLO maneja S3
// No UI, no estado, solo operaciones de almacenamiento en la nube puras y reutilizables

import { apiClient } from '../api/baseApi';
import { APP_CONFIG, ERROR_CODES } from '@/utils/constants';
import type { ApiErrorResponse } from '@/types/common.types';

// ============================================
// S3 SERVICE TYPES (TypeScript Strict)
// ============================================

export interface S3UploadRequest {
  fileName: string;
  mimeType: string;
  size: number;
  category: S3FileCategory;
  isPublic?: boolean;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

export interface S3PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  cdnUrl?: string;
  expiresAt: string;
  uploadId?: string; // Para multipart uploads
}

export interface S3UploadResult {
  fileKey: string;
  publicUrl: string;
  cdnUrl?: string;
  etag: string;
  size: number;
  uploadedAt: string;
}

export interface S3FileMetadata {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: S3FileCategory;
  isPublic: boolean;
  organizationId: string;
  uploadedBy: string;
  uploadedAt: string;
  tags: Record<string, string>;
  customMetadata: Record<string, string>;
}

export interface S3MultipartUploadInit {
  uploadId: string;
  fileKey: string;
  parts: S3UploadPart[];
  expiresAt: string;
}

export interface S3UploadPart {
  partNumber: number;
  uploadUrl: string;
  size: number;
}

export interface S3UploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
}

// ============================================
// S3 CONFIGURATION TYPES
// ============================================

export type S3FileCategory = 
  | 'avatar' 
  | 'avatar-thumb'
  | 'company-logo' 
  | 'document' 
  | 'import' 
  | 'attachment' 
  | 'export' 
  | 'temp';

export interface S3BucketConfig {
  bucket: string;
  region: string;
  pathPrefix: string;
  publicRead: boolean;
  encryption: boolean;
  versioning: boolean;
  lifecycleRules: S3LifecycleRule[];
}

export interface S3LifecycleRule {
  id: string;
  category: S3FileCategory;
  deleteAfterDays?: number;
  transitionToIA?: number; // Days to transition to Infrequent Access
  transitionToGlacier?: number; // Days to transition to Glacier
}

// ============================================
// PREDEFINED S3 CONFIGS (Por Contexto CRM)
// ============================================

export const S3_CONFIGS = {
  // Archivos públicos (avatares, logos)
  PUBLIC_ASSETS: {
    bucket: 'eklesa-crm-public',
    region: 'us-east-1',
    pathPrefix: 'public/',
    publicRead: true,
    encryption: false,
    versioning: false,
    lifecycleRules: [
      {
        id: 'avatar-lifecycle',
        category: 'avatar' as S3FileCategory,
        transitionToIA: 30,
        deleteAfterDays: 2555, // 7 años
      },
      {
        id: 'logo-lifecycle', 
        category: 'company-logo' as S3FileCategory,
        transitionToIA: 90,
        deleteAfterDays: 3650, // 10 años
      }
    ],
  } as S3BucketConfig,

  // Archivos privados (documentos, attachments)
  PRIVATE_DOCUMENTS: {
    bucket: 'eklesa-crm-private',
    region: 'us-east-1',
    pathPrefix: 'documents/',
    publicRead: false,
    encryption: true,
    versioning: true,
    lifecycleRules: [
      {
        id: 'document-lifecycle',
        category: 'document' as S3FileCategory,
        transitionToIA: 90,
        transitionToGlacier: 365,
        deleteAfterDays: 2555, // 7 años compliance
      },
      {
        id: 'attachment-lifecycle',
        category: 'attachment' as S3FileCategory,
        transitionToIA: 60,
        deleteAfterDays: 1825, // 5 años
      }
    ],
  } as S3BucketConfig,

  // Archivos temporales (imports, exports)
  TEMPORARY_FILES: {
    bucket: 'eklesa-crm-temp',
    region: 'us-east-1',
    pathPrefix: 'temp/',
    publicRead: false,
    encryption: true,
    versioning: false,
    lifecycleRules: [
      {
        id: 'temp-cleanup',
        category: 'temp' as S3FileCategory,
        deleteAfterDays: 7, // Cleanup automático
      },
      {
        id: 'import-cleanup',
        category: 'import' as S3FileCategory,
        deleteAfterDays: 30,
      }
    ],
  } as S3BucketConfig,
} as const;

// ============================================
// S3 SERVICE CLASS (Singleton Pattern)
// ============================================

export class S3Service {
  private readonly multipartThreshold = 50 * 1024 * 1024; // 50MB
  private readonly partSize = 10 * 1024 * 1024; // 10MB per part
  private readonly maxConcurrentUploads = 3;

  // ============================================
  // MAIN UPLOAD METHODS (Entry Points)
  // ============================================

  /**
   * Upload archivo a S3 con configuración automática
   * Principio: Una sola responsabilidad - solo operaciones S3
   */
  async uploadFile(
    file: File,
    category: S3FileCategory,
    options: {
      isPublic?: boolean;
      metadata?: Record<string, string>;
      onProgress?: (progress: S3UploadProgress) => void;
      signal?: AbortSignal;
    } = {}
  ): Promise<S3UploadResult> {
    const { isPublic = this.isPublicCategory(category), metadata = {}, onProgress, signal } = options;

    // Crear request para presigned URL
    const uploadRequest: S3UploadRequest = {
      fileName: this.generateS3FileName(file.name, category),
      mimeType: file.type,
      size: file.size,
      category,
      isPublic,
      metadata: {
        ...metadata,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
      tags: this.generateDefaultTags(category),
    };

    // Decidir estrategia de upload basada en tamaño
    if (file.size > this.multipartThreshold) {
      return this.uploadMultipart(file, uploadRequest, onProgress, signal);
    } else {
      return this.uploadSingle(file, uploadRequest, onProgress, signal);
    }
  }

  /**
   * Upload directo a S3 con presigned URL (archivos pequeños)
   */
  private async uploadSingle(
    file: File,
    request: S3UploadRequest,
    onProgress?: (progress: S3UploadProgress) => void,
    signal?: AbortSignal
  ): Promise<S3UploadResult> {
    try {
      // Obtener presigned URL del backend
      const presignedData = await this.getPresignedUrl(request);
      
      // Upload directo a S3
      const uploadResult = await this.uploadToS3(
        file,
        presignedData.uploadUrl,
        onProgress,
        signal
      );

      // Confirmar upload con backend
      return this.confirmUpload(presignedData.fileKey, {
        etag: uploadResult.etag,
        size: file.size,
        metadata: request.metadata || {},
      });

    } catch (error) {
      throw this.handleS3Error(error, 'single upload');
    }
  }

  /**
   * Upload multipart para archivos grandes (>50MB)
   */
  private async uploadMultipart(
    file: File,
    request: S3UploadRequest,
    onProgress?: (progress: S3UploadProgress) => void,
    signal?: AbortSignal
  ): Promise<S3UploadResult> {
    try {
      // Inicializar multipart upload
      const multipartInit = await this.initiateMultipartUpload(request);
      
      // Dividir archivo en partes
      const parts = this.createFileParts(file, multipartInit.parts);
      
      // Upload partes concurrentemente
      const uploadedParts = await this.uploadParts(
        parts,
        multipartInit,
        onProgress,
        signal
      );

      // Completar multipart upload
      return this.completeMultipartUpload(
        multipartInit.uploadId,
        multipartInit.fileKey,
        uploadedParts
      );

    } catch (error) {
      // Abortar multipart upload en caso de error
      await this.abortMultipartUpload(request.fileName).catch(() => {
        // Ignore abortion errors
      });
      
      throw this.handleS3Error(error, 'multipart upload');
    }
  }

  // ============================================
  // FILE MANAGEMENT METHODS
  // ============================================

  /**
   * Elimina archivo de S3
   */
  async deleteFile(fileKey: string): Promise<void> {
    try {
      await apiClient.delete(`/api/s3/files/${encodeURIComponent(fileKey)}`);
    } catch (error) {
      throw this.handleS3Error(error, 'delete file');
    }
  }

  /**
   * Copia archivo dentro de S3
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<S3UploadResult> {
    try {
      return await apiClient.post<S3UploadResult>('/api/s3/copy', {
        sourceKey,
        destinationKey,
      });
    } catch (error) {
      throw this.handleS3Error(error, 'copy file');
    }
  }

  /**
   * Obtiene metadata de archivo
   */
  async getFileMetadata(fileKey: string): Promise<S3FileMetadata> {
    try {
      return await apiClient.get<S3FileMetadata>(`/api/s3/metadata/${encodeURIComponent(fileKey)}`);
    } catch (error) {
      throw this.handleS3Error(error, 'get metadata');
    }
  }

  /**
   * Genera URL de descarga temporal
   */
  async getDownloadUrl(fileKey: string, expiresIn: number = 3600): Promise<string> {
    try {
      const response = await apiClient.post<{ downloadUrl: string }>('/api/s3/download-url', {
        fileKey,
        expiresIn,
      });
      return response.downloadUrl;
    } catch (error) {
      throw this.handleS3Error(error, 'get download URL');
    }
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Upload múltiple con control de concurrencia
   */
  async uploadBatch(
    files: Array<{ file: File; category: S3FileCategory; isPublic?: boolean }>,
    onProgress?: (completed: number, total: number, currentFile?: string) => void
  ): Promise<S3UploadResult[]> {
    const results: S3UploadResult[] = [];
    const chunks = this.chunkArray(files, this.maxConcurrentUploads);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async ({ file, category, isPublic }) => {
        try {
          const result = await this.uploadFile(file, category, { isPublic });
          onProgress?.(results.length + 1, files.length, file.name);
          return result;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          throw error;
        }
      });

      const chunkResults = await Promise.allSettled(chunkPromises);
      
      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Re-throw para que el caller maneje el error
          throw result.reason;
        }
      }
    }

    return results;
  }

  /**
   * Elimina múltiples archivos
   */
  async deleteBatch(fileKeys: string[]): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    const deletePromises = fileKeys.map(async (key) => {
      try {
        await this.deleteFile(key);
        successful.push(key);
      } catch (error) {
        console.error(`Failed to delete ${key}:`, error);
        failed.push(key);
      }
    });

    await Promise.allSettled(deletePromises);

    return { successful, failed };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async getPresignedUrl(request: S3UploadRequest): Promise<S3PresignedUrlResponse> {
    return apiClient.post<S3PresignedUrlResponse>('/api/s3/presigned-url', request);
  }

  private async uploadToS3(
    file: File,
    uploadUrl: string,
    onProgress?: (progress: S3UploadProgress) => void,
    signal?: AbortSignal
  ): Promise<{ etag: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const now = Date.now();
          const elapsed = (now - startTime) / 1000; // seconds
          const speed = event.loaded / elapsed; // bytes per second
          const remaining = (event.total - event.loaded) / speed; // seconds

          onProgress({
            uploadedBytes: event.loaded,
            totalBytes: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
            speed,
            estimatedTimeRemaining: Math.round(remaining),
          });
        }
      });

      // Success handler
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader('ETag')?.replace(/"/g, '') || '';
          resolve({ etag });
        } else {
          reject(new Error(`S3 upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      // Error handler
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during S3 upload'));
      });

      // Abort handler
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload cancelled'));
        });
      }

      // Setup and send
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  private async confirmUpload(
    fileKey: string,
    uploadData: {
      etag: string;
      size: number;
      metadata: Record<string, string>;
    }
  ): Promise<S3UploadResult> {
    return apiClient.post<S3UploadResult>('/api/s3/confirm-upload', {
      fileKey,
      ...uploadData,
    });
  }

  private async initiateMultipartUpload(request: S3UploadRequest): Promise<S3MultipartUploadInit> {
    return apiClient.post<S3MultipartUploadInit>('/api/s3/multipart/initiate', request);
  }

  private createFileParts(file: File, parts: S3UploadPart[]): Array<{ part: S3UploadPart; blob: Blob }> {
    return parts.map((part) => {
      const start = (part.partNumber - 1) * this.partSize;
      const end = Math.min(start + this.partSize, file.size);
      const blob = file.slice(start, end);
      
      return { part, blob };
    });
  }

  private async uploadParts(
    parts: Array<{ part: S3UploadPart; blob: Blob }>,
    multipartInit: S3MultipartUploadInit,
    onProgress?: (progress: S3UploadProgress) => void,
    signal?: AbortSignal
  ): Promise<Array<{ partNumber: number; etag: string }>> {
    const uploadedParts: Array<{ partNumber: number; etag: string }> = [];
    let totalUploaded = 0;
    const totalSize = parts.reduce((sum, { blob }) => sum + blob.size, 0);

    // Upload partes en grupos para controlar concurrencia
    const chunks = this.chunkArray(parts, this.maxConcurrentUploads);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async ({ part, blob }) => {
        const result = await this.uploadToS3(
          blob as File,
          part.uploadUrl,
          undefined, // Progress per-part no reportado para simplificar
          signal
        );

        totalUploaded += blob.size;
        
        if (onProgress) {
          onProgress({
            uploadedBytes: totalUploaded,
            totalBytes: totalSize,
            percentage: Math.round((totalUploaded / totalSize) * 100),
            speed: 0, // Simplificado para multipart
            estimatedTimeRemaining: 0,
          });
        }

        return {
          partNumber: part.partNumber,
          etag: result.etag,
        };
      });

      const chunkResults = await Promise.all(chunkPromises);
      uploadedParts.push(...chunkResults);
    }

    return uploadedParts.sort((a, b) => a.partNumber - b.partNumber);
  }

  private async completeMultipartUpload(
    uploadId: string,
    fileKey: string,
    parts: Array<{ partNumber: number; etag: string }>
  ): Promise<S3UploadResult> {
    return apiClient.post<S3UploadResult>('/api/s3/multipart/complete', {
      uploadId,
      fileKey,
      parts,
    });
  }

  private async abortMultipartUpload(fileKey: string): Promise<void> {
    await apiClient.post('/api/s3/multipart/abort', { fileKey });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private isPublicCategory(category: S3FileCategory): boolean {
    const publicCategories: S3FileCategory[] = ['avatar', 'avatar-thumb', 'company-logo'];
    return publicCategories.includes(category);
  }

  private generateS3FileName(originalName: string, category: S3FileCategory): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = this.getFileExtension(originalName);
    const cleanName = this.sanitizeFileName(originalName);
    
    return `${category}/${timestamp}_${random}_${cleanName}${extension}`;
  }

  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? '.' + parts.pop()!.toLowerCase() : '';
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars
      .toLowerCase()
      .substring(0, 30); // Limit length
  }

  private generateDefaultTags(category: S3FileCategory): Record<string, string> {
    return {
      Category: category,
      Environment: import.meta.env.MODE || 'development',
      Service: 'eklesa-crm',
      UploadedAt: new Date().toISOString(),
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private handleS3Error(error: unknown, operation: string): Error {
    if (error instanceof Error) {
      return new Error(`S3 ${operation} failed: ${error.message}`);
    }

    if (this.isApiError(error)) {
      switch (error.code) {
        case ERROR_CODES.NETWORK_ERROR:
          return new Error(`Network error during S3 ${operation}. Please check your connection.`);
        case ERROR_CODES.FILE_TOO_LARGE:
          return new Error(`File too large for S3 ${operation}. Please use a smaller file.`);
        case 'S3_ACCESS_DENIED':
          return new Error(`Access denied for S3 ${operation}. Please check permissions.`);
        case 'S3_BUCKET_NOT_FOUND':
          return new Error(`S3 bucket not found for ${operation}. Please check configuration.`);
        default:
          return new Error(`S3 ${operation} failed: ${error.message}`);
      }
    }

    return new Error(`Unknown S3 ${operation} error`);
  }

  private isApiError(error: unknown): error is ApiErrorResponse {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error
    );
  }
}

// ============================================
// SINGLETON INSTANCE + CONVENIENCE FUNCTIONS
// ============================================

export const s3Service = new S3Service();

/**
 * Upload rápido para avatares (público)
 */
export const uploadAvatarToS3 = (
  file: File,
  onProgress?: (progress: S3UploadProgress) => void
): Promise<S3UploadResult> => {
  return s3Service.uploadFile(file, 'avatar', { isPublic: true, onProgress });
};

/**
 * Upload rápido para documentos (privado)
 */
export const uploadDocumentToS3 = (
  file: File,
  onProgress?: (progress: S3UploadProgress) => void
): Promise<S3UploadResult> => {
  return s3Service.uploadFile(file, 'document', { isPublic: false, onProgress });
};

/**
 * Upload rápido para archivos temporales
 */
export const uploadTempFileToS3 = (
  file: File,
  onProgress?: (progress: S3UploadProgress) => void
): Promise<S3UploadResult> => {
  return s3Service.uploadFile(file, 'temp', { isPublic: false, onProgress });
};

/**
 * Helper para crear configuración de upload personalizada
 */
export const createS3UploadConfig = (
  category: S3FileCategory,
  isPublic: boolean = false,
  metadata: Record<string, string> = {}
) => ({
  category,
  isPublic,
  metadata: {
    ...metadata,
    uploadedAt: new Date().toISOString(),
  },
});

export default s3Service; 
