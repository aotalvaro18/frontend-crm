// src/components/ui/FileUpload.tsx
// ✅ FILE UPLOAD ENTERPRISE COMPONENT - 100% ACOPLADO
// Mobile-first + TypeScript strict + CSV/Images focus + Drag & Drop + Progress tracking

import React, { forwardRef, useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Download,
  Eye,
  Trash2
} from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Button } from './Button';

// Types from your project
import type { 
  FileInfo, 
  FileUploadResponse 
} from '@/types/common.types';
import { 
  APP_CONFIG 
} from '@/utils/constants';

// ============================================
// FILE UPLOAD VARIANTS (Alineado con tu arquitectura)
// ============================================

const uploadVariants = cva(
  'relative w-full rounded-lg border-2 border-dashed transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-app-dark-600 bg-app-dark-800 hover:border-app-dark-500',
        active: 'border-app-accent-500 bg-app-accent-500/10',
        success: 'border-green-500 bg-green-500/10',
        error: 'border-red-500 bg-red-500/10',
        disabled: 'border-app-dark-700 bg-app-dark-900 opacity-50 cursor-not-allowed',
      },
      
      size: {
        sm: 'p-4 min-h-[120px]',
        md: 'p-6 min-h-[160px]',
        lg: 'p-8 min-h-[200px]',
        xl: 'p-10 min-h-[240px]',
      },
      
      dragOver: {
        true: 'border-app-accent-500 bg-app-accent-500/20 scale-[1.02]',
        false: '',
      },
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'md',
      dragOver: false,
    },
  }
);

const fileItemVariants = cva(
  'flex items-center justify-between p-3 rounded-lg border transition-all duration-200',
  {
    variants: {
      status: {
        pending: 'border-app-dark-600 bg-app-dark-700',
        uploading: 'border-app-accent-500 bg-app-accent-500/10',
        success: 'border-green-500 bg-green-500/10',
        error: 'border-red-500 bg-red-500/10',
      },
    },
  }
);

// ============================================
// TYPES
// ============================================

export type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface UploadFile extends File {
  id: string;
  status: FileUploadStatus;
  progress: number;
  error?: string;
  preview?: string;
  uploadedInfo?: FileInfo;
}

export interface FileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange'> {
  // Styling
  variant?: VariantProps<typeof uploadVariants>['variant'];
  size?: VariantProps<typeof uploadVariants>['size'];
  className?: string;
  
  // File Configuration
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  allowedTypes?: string[];
  
  // Upload Configuration
  uploadUrl?: string;
  uploadMethod?: 'POST' | 'PUT';
  uploadHeaders?: Record<string, string>;
  
  // Labels & Messages
  label?: string;
  description?: string;
  helperText?: string;
  error?: string;
  placeholder?: string;
  dragActiveText?: string;
  
  // File Type Specific
  imagePreview?: boolean;
  showFileList?: boolean;
  showProgress?: boolean;
  
  // Callbacks
  onFilesChange?: (files: UploadFile[]) => void;
  onUploadStart?: (file: UploadFile) => void;
  onUploadProgress?: (file: UploadFile, progress: number) => void;
  onUploadComplete?: (file: UploadFile, response: FileUploadResponse) => void;
  onUploadError?: (file: UploadFile, error: string) => void;
  onRemoveFile?: (fileId: string) => void;
  
  // Custom upload function
  customUploadFn?: (file: File, onProgress: (progress: number) => void) => Promise<FileUploadResponse>;
  
  // Validation
  validateFile?: (file: File) => string | null;
}

// ============================================
// MAIN FILE UPLOAD COMPONENT
// ============================================

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(({
  // Styling
  variant = 'default',
  size = 'md',
  className,
  
  // File Configuration
  accept,
  multiple = false,
  maxSize = APP_CONFIG.MAX_FILE_SIZE,
  maxFiles = multiple ? 10 : 1,
  allowedTypes,
  
  // Upload Configuration
  uploadUrl,
  uploadMethod = 'POST',
  uploadHeaders = {},
  
  // Labels
  label,
  description,
  helperText,
  error,
  placeholder = 'Arrastra archivos aquí o haz clic para seleccionar',
  dragActiveText = 'Suelta los archivos aquí...',
  
  // Features
  imagePreview = true,
  showFileList = true,
  showProgress = true,
  
  // Callbacks
  onFilesChange,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onRemoveFile,
  
  // Custom
  customUploadFn,
  validateFile,
  
  // Native props
  disabled,
  id,
  name,
  ...props
}, ref) => {
  // ============================================
  // STATE
  // ============================================
  
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  const finalVariant = error ? 'error' : variant;
  const isDisabled = disabled;
  //const hasFiles = files.length > 0;
  const canAddMore = files.length < maxFiles;
  
  const acceptTypes = accept || (allowedTypes ? allowedTypes.join(',') : '*/*');
  
  // ============================================
  // FILE VALIDATION
  // ============================================
  
  const validateFileInternal = useCallback((file: File): string | null => {
    // Custom validation first
    if (validateFile) {
      const customError = validateFile(file);
      if (customError) return customError;
    }
    
    // Size validation
    if (file.size > maxSize) {
      return `El archivo es demasiado grande. Máximo ${formatFileSize(maxSize)}.`;
    }
    
    // Type validation
    if (allowedTypes && allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some(type => {
        if (type.includes('/')) {
          return file.type === type;
        } else {
          return file.type.startsWith(type + '/');
        }
      });
      
      if (!isAllowed) {
        return `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`;
      }
    }
    
    // Check for common invalid types for your use case
    const invalidTypes = ['application/x-msdownload', 'application/x-executable'];
    if (invalidTypes.includes(file.type)) {
      return 'Tipo de archivo no permitido por seguridad.';
    }
    
    return null;
  }, [maxSize, allowedTypes, validateFile]);
  
  // ============================================
  // FILE PROCESSING
  // ============================================
  
  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const filesToProcess = Array.from(fileList);
    const newFiles: UploadFile[] = [];
    
    for (const file of filesToProcess) {
      // Check file limit
      if (!canAddMore && newFiles.length >= maxFiles - files.length) {
        break;
      }
      
      // Validate file
      const validationError = validateFileInternal(file);
      
      const uploadFile: UploadFile = {
        ...file,
        id: generateFileId(),
        status: validationError ? 'error' : 'pending',
        progress: 0,
        error: validationError || undefined,
      };
      
      // Generate preview for images
      if (imagePreview && file.type.startsWith('image/') && !validationError) {
        try {
          uploadFile.preview = await generateImagePreview(file);
        } catch (error) {
          console.warn('Failed to generate image preview:', error);
        }
      }
      
      newFiles.push(uploadFile);
    }
    
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
    
    // Auto-upload if upload URL is provided
    if (uploadUrl || customUploadFn) {
      for (const file of newFiles) {
        if (file.status === 'pending') {
          uploadFile(file);
        }
      }
    }
  }, [files, canAddMore, maxFiles, validateFileInternal, imagePreview, uploadUrl, customUploadFn, onFilesChange]);
  
  // ============================================
  // UPLOAD LOGIC
  // ============================================
  
  const uploadFile = useCallback(async (file: UploadFile) => {
    // Update status to uploading
    const updateFileStatus = (updates: Partial<UploadFile>) => {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, ...updates } : f
      ));
    };
    
    updateFileStatus({ status: 'uploading', progress: 0 });
    onUploadStart?.(file);
    
    try {
      let response: FileUploadResponse;
      
      if (customUploadFn) {
        // Use custom upload function
        response = await customUploadFn(file, (progress) => {
          updateFileStatus({ progress });
          onUploadProgress?.(file, progress);
        });
      } else if (uploadUrl) {
        // Use default upload
        response = await defaultUpload(file, uploadUrl, uploadMethod, uploadHeaders, (progress) => {
          updateFileStatus({ progress });
          onUploadProgress?.(file, progress);
        });
      } else {
        throw new Error('No upload URL or custom upload function provided');
      }
      
      updateFileStatus({ 
        status: 'success', 
        progress: 100,
        uploadedInfo: response.fileInfo 
      });
      
      onUploadComplete?.(file, response);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error durante la carga';
      
      updateFileStatus({ 
        status: 'error', 
        error: errorMessage,
        progress: 0 
      });
      
      onUploadError?.(file, errorMessage);
    }
  }, [uploadUrl, uploadMethod, uploadHeaders, customUploadFn, onUploadStart, onUploadProgress, onUploadComplete, onUploadError]);
  
  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      processFiles(fileList);
    }
    // Clear input value to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);
  
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragCounter(prev => prev + 1);
    setDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setDragOver(false);
      }
      return newCounter;
    });
  }, []);
  
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    setDragCounter(0);
    
    if (isDisabled) return;
    
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [isDisabled, processFiles]);
  
  const handleRemoveFile = useCallback((fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
    onRemoveFile?.(fileId);
  }, [files, onFilesChange, onRemoveFile]);
  
  const handleRetryUpload = useCallback((file: UploadFile) => {
    uploadFile(file);
  }, [uploadFile]);
  
  const handleOpenFilePicker = useCallback(() => {
    if (!isDisabled) {
      fileInputRef.current?.click();
    }
  }, [isDisabled]);
  
  // ============================================
  // RENDER HELPERS
  // ============================================
  
  const renderUploadArea = () => (
    <div
      className={cn(
        uploadVariants({ variant: finalVariant, size, dragOver }),
        isDisabled && 'cursor-not-allowed',
        !isDisabled && 'cursor-pointer',
        className
      )}
      onClick={handleOpenFilePicker}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-4">
          <Upload className={cn(
            'h-12 w-12 mx-auto transition-colors duration-200',
            dragOver ? 'text-app-accent-500' : 'text-app-gray-400'
          )} />
        </div>
        
        <div className="space-y-2">
          <p className={cn(
            'text-lg font-medium transition-colors duration-200',
            dragOver ? 'text-app-accent-500' : 'text-app-gray-200'
          )}>
            {dragOver ? dragActiveText : placeholder}
          </p>
          
          {description && (
            <p className="text-sm text-app-gray-400">
              {description}
            </p>
          )}
          
          <div className="flex flex-wrap justify-center gap-2 text-xs text-app-gray-500">
            {allowedTypes && (
              <span>Tipos: {allowedTypes.join(', ')}</span>
            )}
            <span>Máximo: {formatFileSize(maxSize)}</span>
            {multiple && (
              <span>Hasta {maxFiles} archivos</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderFileList = () => {
    if (!showFileList || files.length === 0) return null;
    
    return (
      <div className="mt-4 space-y-2">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            showProgress={showProgress}
            onRemove={() => handleRemoveFile(file.id)}
            onRetry={() => handleRetryUpload(file)}
          />
        ))}
      </div>
    );
  };
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label 
          htmlFor={id}
          className={cn(
            'block text-sm font-medium mb-2',
            error ? 'text-red-400' : 'text-app-gray-300'
          )}
        >
          {label}
        </label>
      )}
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isDisabled}
        id={id}
        name={name}
        {...props}
      />
      
      {/* Upload Area */}
      {renderUploadArea()}
      
      {/* File List */}
      {renderFileList()}
      
      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
      
      {/* Helper Text */}
      {helperText && !error && (
        <p className="mt-2 text-sm text-app-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';

// ============================================
// FILE ITEM COMPONENT
// ============================================

interface FileItemProps {
  file: UploadFile;
  showProgress: boolean;
  onRemove: () => void;
  onRetry: () => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, showProgress, onRemove, onRetry }) => {
  const getFileIcon = () => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      return <FileText className="h-5 w-5 text-green-500" />;
    } else if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx')) {
      return <FileText className="h-5 w-5 text-green-600" />;
    } else {
      return <FileText className="h-5 w-5 text-app-gray-400" />;
    }
  };
  
  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-app-accent-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className={fileItemVariants({ status: file.status })}>
      <div className="flex items-center flex-1 min-w-0">
        {/* File Icon/Preview */}
        <div className="flex-shrink-0 mr-3">
          {file.preview ? (
            <img 
              src={file.preview} 
              alt={file.name}
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            getFileIcon()
          )}
        </div>
        
        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-app-gray-200 truncate">
            {file.name}
          </p>
          <div className="flex items-center space-x-2 text-xs text-app-gray-400">
            <span>{formatFileSize(file.size)}</span>
            {file.status === 'success' && file.uploadedInfo && (
              <>
                <span>•</span>
                <span className="text-green-400">Subido exitosamente</span>
              </>
            )}
            {file.status === 'error' && file.error && (
              <>
                <span>•</span>
                <span className="text-red-400">{file.error}</span>
              </>
            )}
          </div>
          
          {/* Progress Bar */}
          {showProgress && file.status === 'uploading' && (
            <div className="mt-1 w-full bg-app-dark-600 rounded-full h-1">
              <div 
                className="bg-app-accent-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${file.progress}%` }}
              />
            </div>
          )}
        </div>
        
        {/* Status Icon */}
        <div className="flex-shrink-0 ml-3">
          {getStatusIcon()}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center space-x-1 ml-3">
        {file.status === 'success' && file.uploadedInfo?.url && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(file.uploadedInfo!.url, '_blank')}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        
        {file.status === 'error' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ============================================
// SPECIALIZED FILE UPLOAD COMPONENTS
// ============================================

/**
 * CSV Upload - Optimizado para importación de contactos
 */
export const CSVUpload = forwardRef<HTMLInputElement, Omit<FileUploadProps, 'accept' | 'allowedTypes' | 'multiple'>>(
  (props, ref) => (
    <FileUpload
      ref={ref}
      accept=".csv,text/csv,application/vnd.ms-excel"
      allowedTypes={['text/csv', 'application/vnd.ms-excel']}
      multiple={false}
      placeholder="Arrastra tu archivo CSV aquí o haz clic para seleccionar"
      description="Archivo CSV con contactos para importar"
      imagePreview={false}
      {...props}
    />
  )
);

CSVUpload.displayName = 'CSVUpload';

/**
 * Image Upload - Para fotos de perfil
 */
export const ImageUpload = forwardRef<HTMLInputElement, Omit<FileUploadProps, 'accept' | 'allowedTypes'>>(
  (props, ref) => (
    <FileUpload
      ref={ref}
      accept="image/*"
      allowedTypes={[...APP_CONFIG.ALLOWED_IMAGE_TYPES]}
      placeholder="Arrastra una imagen aquí o haz clic para seleccionar"
      description="Formatos soportados: JPEG, PNG, WebP"
      imagePreview={true}
      {...props}
    />
  )
);

ImageUpload.displayName = 'ImageUpload';

/**
 * Document Upload - Para documentos generales
 */
export const DocumentUpload = forwardRef<HTMLInputElement, Omit<FileUploadProps, 'accept' | 'allowedTypes'>>(
  (props, ref) => (
    <FileUpload
      ref={ref}
      accept=".pdf,.csv,.xlsx,.xls"
      allowedTypes={[...APP_CONFIG.ALLOWED_DOCUMENT_TYPES, ...APP_CONFIG.ALLOWED_IMAGE_TYPES]}
      placeholder="Arrastra documentos aquí o haz clic para seleccionar"
      description="PDF, CSV, Excel e imágenes permitidos"
      {...props}
    />
  )
);

DocumentUpload.displayName = 'DocumentUpload';

/**
 * Avatar Upload - Para fotos de perfil específicamente
 */
export const AvatarUpload = forwardRef<HTMLInputElement, Omit<FileUploadProps, 'accept' | 'allowedTypes' | 'multiple' | 'size'>>(
  (props, ref) => (
    <FileUpload
      ref={ref}
      accept="image/*"
      allowedTypes={[...APP_CONFIG.ALLOWED_IMAGE_TYPES]}
      multiple={false}
      size="sm"
      maxSize={2 * 1024 * 1024} // 2MB for avatars
      placeholder="Foto de perfil"
      description="Máximo 2MB"
      imagePreview={true}
      {...props}
    />
  )
);

AvatarUpload.displayName = 'AvatarUpload';

// ============================================
// UTILITY FUNCTIONS
// ============================================

const generateFileId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const generateImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const defaultUpload = async (
  file: File,
  uploadUrl: string,
  method: 'POST' | 'PUT',
  headers: Record<string, string>,
  onProgress: (progress: number) => void
): Promise<FileUploadResponse> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    
    // Progress tracking
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });
    
    // Success handler
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid response format'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });
    
    // Error handler
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    // Setup and send
    xhr.open(method, uploadUrl);
    
    // Set headers
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    
    xhr.send(formData);
  });
};

export default FileUpload; 
