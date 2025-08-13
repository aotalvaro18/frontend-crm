// src/services/upload/uploadService.ts
// ✅ UPLOAD SERVICE REFACTORIZADO - SIGUIENDO GUÍA ARQUITECTÓNICA EKLESA
// Principio: ORQUESTADOR PURO - Coordina fileValidator + imageProcessor + s3Service
// No duplica lógica, solo orquesta los services especializados

import { apiClient } from '../api/baseApi';
import { APP_CONFIG } from '@/utils/constants';

// ============================================
// IMPORT SPECIALIZED SERVICES (Stack Completo)
// ============================================

import { 
  validateContactAvatar, 
  validateCSVImport, 
  validateDocumentAttachment,
  type ValidationResult 
} from './fileValidator';

import { 
  processContactAvatar, 
  processDocumentScan,
  type ProcessedImageResult 
} from './imageProcessor';

import { 
  uploadAvatarToS3, 
  uploadDocumentToS3, 
  uploadTempFileToS3,
  type S3UploadResult,
  type S3UploadProgress 
} from './s3Service';

// Types from your project
import type {
  FileInfo,
  FileUploadResponse
} from '@/types/common.types';

// ============================================
// UPLOAD SERVICE TYPES (Solo Orquestación)
// ============================================

export interface UploadWorkflowResult {
  originalFile: File;
  processedFile?: File;
  thumbnail?: File;
  validation: ValidationResult;
  processing?: ProcessedImageResult;
  s3Upload: S3UploadResult;
  backendConfirmation: FileInfo;
  workflowMetadata: {
    totalTime: number;
    validationTime: number;
    processingTime: number;
    uploadTime: number;
    reductionPercentage?: number;
  };
}

export interface UploadWorkflowOptions {
  validateOnly?: boolean;
  skipProcessing?: boolean;
  onValidationComplete?: (result: ValidationResult) => void;
  onProcessingComplete?: (result: ProcessedImageResult) => void;
  onUploadProgress?: (progress: S3UploadProgress & { stage: 'main' | 'thumbnail' }) => void;
  onUploadComplete?: (result: S3UploadResult) => void;
  signal?: AbortSignal;
}

export interface BulkUploadResult {
  successful: UploadWorkflowResult[];
  failed: Array<{ file: File; error: string; stage: string }>;
  summary: {
    totalFiles: number;
    successCount: number;
    failureCount: number;
    totalSizeOriginal: number;
    totalSizeProcessed: number;
    averageReduction: number;
    totalTime: number;
  };
}

// ============================================
// UPLOAD SERVICE CLASS (Orquestador Puro)
// ============================================

export class UploadService {
  
  // ============================================
  // SPECIALIZED UPLOAD WORKFLOWS (Por Contexto CRM)
  // ============================================

  /**
   * Workflow completo para avatares de contactos
   * Validate → Process → Upload to S3 → Confirm with Backend
   */
  async uploadContactAvatar(
    contactId: number,
    file: File,
    options: UploadWorkflowOptions = {}
  ): Promise<UploadWorkflowResult> {
    const workflowStart = performance.now();
    
    try {
      // ✅ STAGE 1: VALIDATE (delega a fileValidator)
      const validationStart = performance.now();
      const validation = await validateContactAvatar(file);
      const validationTime = performance.now() - validationStart;
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors[0]?.message}`);
      }
      
      options.onValidationComplete?.(validation);
      
      if (options.validateOnly) {
        return this.createPartialResult(file, validation, { validationTime });
      }

      // ✅ STAGE 2: PROCESS (delega a imageProcessor)
      let processing: ProcessedImageResult | undefined;
      let processedFile = file;
      let thumbnail: File | undefined;
      
      if (!options.skipProcessing) {
        processing = await processContactAvatar(file);
        processedFile = processing.processedFile;
        thumbnail = processing.thumbnail;
        
        options.onProcessingComplete?.(processing);
      }

      // ✅ STAGE 3: UPLOAD TO S3 (delega a s3Service)
      const uploadStart = performance.now();
      
      // Upload main image
      const mainUpload = await uploadAvatarToS3(processedFile, (progress) => {
        options.onUploadProgress?.({ ...progress, stage: 'main' });
      });
      
      // Upload thumbnail if exists
      let thumbnailUpload: S3UploadResult | undefined;
      if (thumbnail) {
        thumbnailUpload = await uploadAvatarToS3(thumbnail, (progress) => {
          options.onUploadProgress?.({ ...progress, stage: 'thumbnail' });
        });
      }
      
      const uploadTime = performance.now() - uploadStart;
      options.onUploadComplete?.(mainUpload);

      // ✅ STAGE 4: CONFIRM WITH BACKEND
      const backendConfirmation = await this.confirmContactAvatarUpload(contactId, {
        mainImage: mainUpload,
        thumbnail: thumbnailUpload,
        originalFile: file,
        processedFile,
        processing,
      });

      // ✅ RETURN COMPLETE WORKFLOW RESULT
      const totalTime = performance.now() - workflowStart;
      
      return {
        originalFile: file,
        processedFile,
        thumbnail,
        validation,
        processing,
        s3Upload: mainUpload,
        backendConfirmation,
        workflowMetadata: {
          totalTime,
          validationTime,
          processingTime: processing?.processingTime || 0,
          uploadTime,
          reductionPercentage: processing?.reductionPercentage,
        },
      };

    } catch (error) {
      throw this.handleWorkflowError(error, 'avatar upload', file.name);
    }
  }

  /**
   * Workflow para importación CSV
   * Validate → Upload to S3 → Process in Backend
   */
  async uploadCSVImport(
    file: File,
    options: UploadWorkflowOptions = {}
  ): Promise<UploadWorkflowResult> {
    const workflowStart = performance.now();

    try {
      // ✅ STAGE 1: VALIDATE CSV (delega a fileValidator)
      const validationStart = performance.now();
      const validation = await validateCSVImport(file);
      const validationTime = performance.now() - validationStart;
      
      if (!validation.isValid) {
        throw new Error(`CSV validation failed: ${validation.errors[0]?.message}`);
      }
      
      options.onValidationComplete?.(validation);

      // ✅ STAGE 2: UPLOAD TO S3 TEMP (delega a s3Service)
      const uploadStart = performance.now();
      const s3Upload = await uploadTempFileToS3(file, (progress) => {
        options.onUploadProgress?.({ ...progress, stage: 'main' });
      });
      const uploadTime = performance.now() - uploadStart;
      
      options.onUploadComplete?.(s3Upload);

      // ✅ STAGE 3: TRIGGER BACKEND PROCESSING
      const backendConfirmation = await this.triggerCSVProcessing(s3Upload.fileKey, {
        originalFileName: file.name,
        fileSize: file.size,
      });

      const totalTime = performance.now() - workflowStart;
      
      return {
        originalFile: file,
        validation,
        s3Upload,
        backendConfirmation,
        workflowMetadata: {
          totalTime,
          validationTime,
          processingTime: 0,
          uploadTime,
        },
      };

    } catch (error) {
      throw this.handleWorkflowError(error, 'CSV import', file.name);
    }
  }

  /**
   * Workflow para documentos adjuntos
   * Validate → Process (if image) → Upload to S3 → Confirm
   */
  async uploadDocumentAttachment(
    entityType: 'contact' | 'deal' | 'company',
    entityId: number,
    file: File,
    description?: string,
    options: UploadWorkflowOptions = {}
  ): Promise<UploadWorkflowResult> {
    const workflowStart = performance.now();

    try {
      // ✅ STAGE 1: VALIDATE (delega a fileValidator)
      const validationStart = performance.now();
      const validation = await validateDocumentAttachment(file);
      const validationTime = performance.now() - validationStart;
      
      if (!validation.isValid) {
        throw new Error(`Document validation failed: ${validation.errors[0]?.message}`);
      }
      
      options.onValidationComplete?.(validation);

      // ✅ STAGE 2: PROCESS IF IMAGE (delega a imageProcessor)
      let processing: ProcessedImageResult | undefined;
      let processedFile = file;
      
      if (this.isImageFile(file) && !options.skipProcessing) {
        processing = await processDocumentScan(file);
        processedFile = processing.processedFile;
        options.onProcessingComplete?.(processing);
      }

      // ✅ STAGE 3: UPLOAD TO S3 (delega a s3Service)
      const uploadStart = performance.now();
      const s3Upload = await uploadDocumentToS3(processedFile, (progress) => {
        options.onUploadProgress?.({ ...progress, stage: 'main' });
      });
      const uploadTime = performance.now() - uploadStart;
      
      options.onUploadComplete?.(s3Upload);

      // ✅ STAGE 4: CONFIRM WITH BACKEND
      const backendConfirmation = await this.confirmDocumentAttachment(entityType, entityId, {
        s3Data: s3Upload,
        originalFile: file,
        processedFile,
        description,
        processing,
      });

      const totalTime = performance.now() - workflowStart;
      
      return {
        originalFile: file,
        processedFile,
        validation,
        processing,
        s3Upload,
        backendConfirmation,
        workflowMetadata: {
          totalTime,
          validationTime,
          processingTime: processing?.processingTime || 0,
          uploadTime,
          reductionPercentage: processing?.reductionPercentage,
        },
      };

    } catch (error) {
      throw this.handleWorkflowError(error, 'document attachment', file.name);
    }
  }

  // ============================================
  // BATCH UPLOAD WORKFLOWS
  // ============================================

  /**
   * Upload múltiple con workflow completo por archivo
   */
  async uploadBatch(
    files: Array<{
      file: File;
      type: 'avatar' | 'csv' | 'document';
      entityType?: 'contact' | 'deal' | 'company';
      entityId?: number;
      description?: string;
    }>,
    options: {
      maxConcurrency?: number;
      stopOnFirstError?: boolean;
      onFileProgress?: (fileName: string, progress: number) => void;
      onFileComplete?: (fileName: string, result: UploadWorkflowResult) => void;
      onFileError?: (fileName: string, error: string) => void;
    } = {}
  ): Promise<BulkUploadResult> {
    const { maxConcurrency = 3, stopOnFirstError = false } = options;
    
    const successful: UploadWorkflowResult[] = [];
    const failed: Array<{ file: File; error: string; stage: string }> = [];
    const batchStart = performance.now();
    
    // Process in chunks for concurrency control
    const chunks = this.chunkArray(files, maxConcurrency);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (item) => {
        try {
          let result: UploadWorkflowResult;
          
          // Route to appropriate workflow
          switch (item.type) {
            case 'avatar':
              if (!item.entityId) throw new Error('Entity ID required for avatar upload');
              result = await this.uploadContactAvatar(item.entityId, item.file, {
                onUploadProgress: (progress) => {
                  options.onFileProgress?.(item.file.name, progress.percentage);
                }
              });
              break;
              
            case 'csv':
              result = await this.uploadCSVImport(item.file, {
                onUploadProgress: (progress) => {
                  options.onFileProgress?.(item.file.name, progress.percentage);
                }
              });
              break;
              
            case 'document':
              if (!item.entityType || !item.entityId) {
                throw new Error('Entity type and ID required for document upload');
              }
              result = await this.uploadDocumentAttachment(
                item.entityType,
                item.entityId,
                item.file,
                item.description,
                {
                  onUploadProgress: (progress) => {
                    options.onFileProgress?.(item.file.name, progress.percentage);
                  }
                }
              );
              break;
              
            default:
              throw new Error(`Unknown upload type: ${item.type}`);
          }
          
          successful.push(result);
          options.onFileComplete?.(item.file.name, result);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failed.push({
            file: item.file,
            error: errorMessage,
            stage: this.extractErrorStage(error),
          });
          
          options.onFileError?.(item.file.name, errorMessage);
          
          if (stopOnFirstError) {
            throw error;
          }
        }
      });

      if (stopOnFirstError) {
        await Promise.all(chunkPromises);
      } else {
        await Promise.allSettled(chunkPromises);
      }
    }

    // Generate summary
    const totalTime = performance.now() - batchStart;
    const summary = this.generateBatchSummary(successful, failed, totalTime);

    return {
      successful,
      failed,
      summary,
    };
  }

  // ============================================
  // BACKEND CONFIRMATION METHODS
  // ============================================

  private async confirmContactAvatarUpload(
    contactId: number,
    data: {
      mainImage: S3UploadResult;
      thumbnail?: S3UploadResult;
      originalFile: File;
      processedFile: File;
      processing?: ProcessedImageResult;
    }
  ): Promise<FileInfo> {
    return apiClient.post<FileInfo>(`/api/crm/contacts/${contactId}/avatar`, {
      mainImageKey: data.mainImage.fileKey,
      mainImageUrl: data.mainImage.cdnUrl || data.mainImage.publicUrl,
      thumbnailKey: data.thumbnail?.fileKey,
      thumbnailUrl: data.thumbnail?.publicUrl,
      originalFileName: data.originalFile.name,
      originalSize: data.originalFile.size,
      processedSize: data.processedFile.size,
      reductionPercentage: data.processing?.reductionPercentage,
      processingMetadata: data.processing?.metadata,
    });
  }

  private async triggerCSVProcessing(
    s3FileKey: string,
    metadata: {
      originalFileName: string;
      fileSize: number;
    }
  ): Promise<FileInfo> {
    return apiClient.post<FileInfo>('/api/crm/import/csv/process', {
      s3FileKey,
      originalFileName: metadata.originalFileName,
      fileSize: metadata.fileSize,
    });
  }

  private async confirmDocumentAttachment(
    entityType: 'contact' | 'deal' | 'company',
    entityId: number,
    data: {
      s3Data: S3UploadResult;
      originalFile: File;
      processedFile: File;
      description?: string;
      processing?: ProcessedImageResult;
    }
  ): Promise<FileInfo> {
    return apiClient.post<FileInfo>(`/api/crm/${entityType}s/${entityId}/attachments`, {
      fileKey: data.s3Data.fileKey,
      fileUrl: data.s3Data.publicUrl,
      fileName: data.originalFile.name,
      originalSize: data.originalFile.size,
      processedSize: data.processedFile.size,
      mimeType: data.originalFile.type,
      description: data.description,
      reductionPercentage: data.processing?.reductionPercentage,
    });
  }

  // ============================================
  // UTILITY METHODS (Private Helpers)
  // ============================================

  private isImageFile(file: File): boolean {
    return file.type.startsWith('image/') && APP_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type);
  }

  private createPartialResult(
    file: File,
    validation: ValidationResult,
    timing: { validationTime: number }
  ): UploadWorkflowResult {
    // Para validateOnly mode
    return {
      originalFile: file,
      validation,
      s3Upload: {} as S3UploadResult, // Empty placeholder
      backendConfirmation: {} as FileInfo, // Empty placeholder
      workflowMetadata: {
        totalTime: timing.validationTime,
        validationTime: timing.validationTime,
        processingTime: 0,
        uploadTime: 0,
      },
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private generateBatchSummary(
    successful: UploadWorkflowResult[],
    failed: Array<{ file: File; error: string; stage: string }>,
    totalTime: number
  ) {
    const totalSizeOriginal = [...successful, ...failed].reduce(
      (sum, item) => sum + ('originalFile' in item ? item.originalFile : item.file).size,
      0
    );
    
    const totalSizeProcessed = successful.reduce(
      (sum, result) => sum + (result.processedFile?.size || result.originalFile.size),
      0
    );
    
    const reductions = successful
      .map(r => r.workflowMetadata.reductionPercentage)
      .filter(r => r !== undefined) as number[];
    
    const averageReduction = reductions.length > 0 
      ? reductions.reduce((sum, r) => sum + r, 0) / reductions.length 
      : 0;

    return {
      totalFiles: successful.length + failed.length,
      successCount: successful.length,
      failureCount: failed.length,
      totalSizeOriginal,
      totalSizeProcessed,
      averageReduction,
      totalTime,
    };
  }

  private extractErrorStage(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('validation')) return 'validation';
      if (message.includes('processing')) return 'processing';
      if (message.includes('upload') || message.includes('s3')) return 'upload';
      if (message.includes('backend') || message.includes('confirm')) return 'confirmation';
    }
    return 'unknown';
  }

  private handleWorkflowError(error: unknown, workflow: string, fileName: string): Error {
    if (error instanceof Error) {
      return new Error(`${workflow} workflow failed for ${fileName}: ${error.message}`);
    }
    
    return new Error(`${workflow} workflow failed for ${fileName}: Unknown error`);
  }
}

// ============================================
// SINGLETON INSTANCE + CONVENIENCE FUNCTIONS
// ============================================

export const uploadService = new UploadService();

/**
 * Upload rápido de avatar con workflow completo
 */
export const uploadAvatar = (
  contactId: number,
  file: File,
  onProgress?: (progress: S3UploadProgress & { stage: 'main' | 'thumbnail' }) => void
): Promise<UploadWorkflowResult> => {
  return uploadService.uploadContactAvatar(contactId, file, {
    onUploadProgress: onProgress,
  });
};

/**
 * Upload rápido de CSV con workflow completo
 */
export const uploadCSV = (
  file: File,
  onProgress?: (progress: S3UploadProgress) => void
): Promise<UploadWorkflowResult> => {
  return uploadService.uploadCSVImport(file, {
    onUploadProgress: (progress) => onProgress?.(progress),
  });
};

/**
 * Upload rápido de documento con workflow completo
 */
export const uploadDocument = (
  entityType: 'contact' | 'deal' | 'company',
  entityId: number,
  file: File,
  description?: string,
  onProgress?: (progress: S3UploadProgress) => void
): Promise<UploadWorkflowResult> => {
  return uploadService.uploadDocumentAttachment(entityType, entityId, file, description, {
    onUploadProgress: (progress) => onProgress?.(progress),
  });
};

/**
 * Custom upload function para usar con FileUpload component
 */
export const createUploadWorkflowFn = (
  type: 'avatar' | 'csv' | 'document',
  options: {
    entityType?: 'contact' | 'deal' | 'company';
    entityId?: number;
    description?: string;
  } = {}
) => {
  return (file: File, onProgress: (progress: number) => void): Promise<FileUploadResponse> => {
    const progressHandler = (s3Progress: S3UploadProgress) => {
      onProgress(s3Progress.percentage);
    };

    let workflowPromise: Promise<UploadWorkflowResult>;

    switch (type) {
      case 'avatar':
        if (!options.entityId) throw new Error('Entity ID required for avatar upload');
        workflowPromise = uploadService.uploadContactAvatar(options.entityId, file, {
          onUploadProgress: progressHandler,
        });
        break;
        
      case 'csv':
        workflowPromise = uploadService.uploadCSVImport(file, {
          onUploadProgress: progressHandler,
        });
        break;
        
      case 'document':
        if (!options.entityType || !options.entityId) {
          throw new Error('Entity type and ID required for document upload');
        }
        workflowPromise = uploadService.uploadDocumentAttachment(
          options.entityType,
          options.entityId,
          file,
          options.description,
          {
            onUploadProgress: progressHandler,
          }
        );
        break;
        
      default:
        throw new Error(`Unknown upload type: ${type}`);
    }

    // Convert UploadWorkflowResult to FileUploadResponse for FileUpload component compatibility
    return workflowPromise.then(result => ({
      fileInfo: result.backendConfirmation,
      uploadUrl: result.s3Upload.publicUrl,
    }));
  };
};

export default uploadService;