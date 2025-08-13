// src/services/upload/imageProcessor.ts
// ✅ IMAGE PROCESSOR ENTERPRISE - SIGUIENDO GUÍA ARQUITECTÓNICA EKLESA
// Principio: Separación de responsabilidades - Este service SOLO procesa imágenes
// No UI, no estado, solo transformaciones de imagen puras y reutilizables

import { APP_CONFIG } from '@/utils/constants';

// ============================================
// IMAGE PROCESSING TYPES (TypeScript Strict)
// ============================================

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 - 1.0
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
  backgroundColor?: string;
  removeExif?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface ProcessedImageResult {
  originalFile: File;
  processedFile: File;
  thumbnail?: File;
  metadata: ImageMetadata;
  reductionPercentage: number;
  processingTime: number;
}

export interface ImageMetadata {
  originalSize: { width: number; height: number };
  processedSize: { width: number; height: number };
  originalFileSize: number;
  processedFileSize: number;
  format: string;
  hasExifData: boolean;
  colorProfile?: string;
  compressionRatio: number;
}

export interface ResizeOptions {
  width: number;
  height: number;
  mode: 'fit' | 'fill' | 'crop' | 'pad';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

// ============================================
// PREDEFINED PROCESSING CONFIGS (Por Contexto CRM)
// ============================================

export const IMAGE_PROCESSING_CONFIGS = {
  // Para avatares de contactos - Optimizado para web y móvil
  CONTACT_AVATAR: {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.85,
    format: 'webp' as const,
    maintainAspectRatio: true,
    removeExif: true,
    generateThumbnail: true,
    thumbnailSize: 80,
  } as ImageProcessingOptions,

  // Para logos de empresas - Balance calidad/tamaño
  COMPANY_LOGO: {
    maxWidth: 500,
    maxHeight: 200,
    quality: 0.9,
    format: 'webp' as const,
    maintainAspectRatio: true,
    backgroundColor: '#ffffff',
    removeExif: true,
    generateThumbnail: true,
    thumbnailSize: 100,
  } as ImageProcessingOptions,

  // Para documentos escaneados - Preservar legibilidad
  DOCUMENT_SCAN: {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 0.8,
    format: 'jpeg' as const,
    maintainAspectRatio: true,
    removeExif: false, // Preservar metadatos para documentos
    generateThumbnail: true,
    thumbnailSize: 150,
  } as ImageProcessingOptions,

  // Para attachments generales - Compresión agresiva
  GENERAL_ATTACHMENT: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.7,
    format: 'webp' as const,
    maintainAspectRatio: true,
    removeExif: true,
    generateThumbnail: false,
  } as ImageProcessingOptions,

  // Para banners/headers - Formato específico
  BANNER_IMAGE: {
    maxWidth: 1200,
    maxHeight: 400,
    quality: 0.85,
    format: 'webp' as const,
    maintainAspectRatio: false, // Permitir crop para ratio específico
    removeExif: true,
    generateThumbnail: true,
    thumbnailSize: 200,
  } as ImageProcessingOptions,
} as const;

// ============================================
// IMAGE PROCESSOR CLASS (Singleton Pattern)
// ============================================

export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    // Crear canvas reutilizable para mejor performance
    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = context;
    
    // Configurar canvas para mejor calidad
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  // ============================================
  // MAIN PROCESSING METHOD (Entry Point)
  // ============================================

  /**
   * Procesa imagen completa con configuración específica
   * Principio: Una sola responsabilidad - solo transformar imágenes
   */
  async processImage(file: File, options: ImageProcessingOptions): Promise<ProcessedImageResult> {
    const startTime = performance.now();
    
    // Validar que es una imagen
    if (!this.isImageFile(file)) {
      throw new Error('El archivo no es una imagen válida');
    }

    // Cargar imagen
    const img = await this.loadImage(file);
    const originalMetadata = this.extractImageMetadata(img, file);

    // Calcular dimensiones optimizadas
    const targetDimensions = this.calculateOptimalDimensions(
      img.width,
      img.height,
      options
    );

    // Procesar imagen principal
    const processedFile = await this.resizeAndCompress(
      img,
      targetDimensions,
      options,
      file.name
    );

    // Generar thumbnail si se requiere
    let thumbnail: File | undefined;
    if (options.generateThumbnail && options.thumbnailSize) {
      thumbnail = await this.generateThumbnail(img, options.thumbnailSize, file.name);
    }

    // Generar metadata final
    const processedMetadata = await this.generateProcessedMetadata(
      originalMetadata,
      processedFile,
      targetDimensions
    );

    const processingTime = performance.now() - startTime;
    const reductionPercentage = this.calculateReduction(file.size, processedFile.size);

    return {
      originalFile: file,
      processedFile,
      thumbnail,
      metadata: processedMetadata,
      reductionPercentage,
      processingTime,
    };
  }

  // ============================================
  // SPECIALIZED PROCESSING METHODS
  // ============================================

  /**
   * Redimensiona imagen manteniendo aspect ratio
   */
  async resizeImage(file: File, targetWidth: number, targetHeight: number): Promise<File> {
    const img = await this.loadImage(file);
    
    const dimensions = this.calculateAspectRatioFit(
      img.width,
      img.height,
      targetWidth,
      targetHeight
    );

    return this.resizeAndCompress(
      img,
      dimensions,
      { quality: 0.9, format: 'webp', maintainAspectRatio: true },
      file.name
    );
  }

  /**
   * Comprime imagen sin cambiar dimensiones
   */
  async compressImage(file: File, quality: number = 0.8): Promise<File> {
    const img = await this.loadImage(file);
    
    return this.resizeAndCompress(
      img,
      { width: img.width, height: img.height },
      { quality, format: 'webp' },
      file.name
    );
  }

  /**
   * Genera thumbnail cuadrado centrado
   */
  async generateThumbnail(img: HTMLImageElement, size: number, originalName: string): Promise<File> {
    // Configurar canvas para thumbnail
    this.canvas.width = size;
    this.canvas.height = size;

    // Calcular crop centrado
    const sourceSize = Math.min(img.width, img.height);
    const sourceX = (img.width - sourceSize) / 2;
    const sourceY = (img.height - sourceSize) / 2;

    // Limpiar canvas
    this.ctx.clearRect(0, 0, size, size);

    // Dibujar imagen cropeada y redimensionada
    this.ctx.drawImage(
      img,
      sourceX, sourceY, sourceSize, sourceSize, // Source crop
      0, 0, size, size // Destination
    );

    // Convertir a archivo
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            const thumbnailName = this.generateThumbnailName(originalName);
            resolve(new File([blob], thumbnailName, { type: 'image/webp' }));
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        },
        'image/webp',
        0.8
      );
    });
  }

  /**
   * Remueve datos EXIF para privacidad y tamaño
   */
  async removeExifData(file: File): Promise<File> {
    // Cargar imagen (esto automáticamente remueve EXIF al redibujar)
    const img = await this.loadImage(file);
    
    return this.resizeAndCompress(
      img,
      { width: img.width, height: img.height },
      { quality: 1.0, removeExif: true },
      file.name
    );
  }

  /**
   * Convierte formato de imagen
   */
  async convertFormat(file: File, targetFormat: 'jpeg' | 'png' | 'webp', quality: number = 0.9): Promise<File> {
    const img = await this.loadImage(file);
    
    return this.resizeAndCompress(
      img,
      { width: img.width, height: img.height },
      { quality, format: targetFormat },
      file.name
    );
  }

  // ============================================
  // BATCH PROCESSING METHODS
  // ============================================

  /**
   * Procesa múltiples imágenes con la misma configuración
   */
  async processBatch(
    files: File[],
    options: ImageProcessingOptions,
    onProgress?: (completed: number, total: number) => void
  ): Promise<ProcessedImageResult[]> {
    const results: ProcessedImageResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.processImage(files[i], options);
        results.push(result);
        onProgress?.(i + 1, files.length);
      } catch (error) {
        console.error(`Error processing ${files[i].name}:`, error);
        // Continuar con el siguiente archivo
      }
    }
    
    return results;
  }

  // ============================================
  // UTILITY METHODS (Private)
  // ============================================

  private isImageFile(file: File): boolean {
    return file.type.startsWith('image/') && APP_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type);
  }

  public async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Usar object URL para mejor performance y compatibilidad
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      
      // Cleanup después de cargar
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
    });
  }

  private calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    options: ImageProcessingOptions
  ): { width: number; height: number } {
    let { maxWidth, maxHeight, maintainAspectRatio = true } = options;
    
    // Usar dimensiones originales si no se especifican límites
    maxWidth = maxWidth || originalWidth;
    maxHeight = maxHeight || originalHeight;

    if (maintainAspectRatio) {
      return this.calculateAspectRatioFit(originalWidth, originalHeight, maxWidth, maxHeight);
    }

    // Sin mantener aspect ratio, usar dimensiones exactas
    return { width: maxWidth, height: maxHeight };
  }

  private calculateAspectRatioFit(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
    
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  }

  private async resizeAndCompress(
    img: HTMLImageElement,
    dimensions: { width: number; height: number },
    options: ImageProcessingOptions,
    originalName: string
  ): Promise<File> {
    const { width, height } = dimensions;
    const { quality = 0.9, format = 'webp', backgroundColor } = options;

    // Configurar canvas
    this.canvas.width = width;
    this.canvas.height = height;

    // Limpiar canvas
    this.ctx.clearRect(0, 0, width, height);

    // Aplicar fondo si se especifica (útil para transparencias)
    if (backgroundColor) {
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(0, 0, width, height);
    }

    // Dibujar imagen redimensionada
    this.ctx.drawImage(img, 0, 0, width, height);

    // Convertir a archivo
    return new Promise((resolve, reject) => {
      const mimeType = `image/${format}`;
      
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            const processedName = this.generateProcessedName(originalName, format);
            resolve(new File([blob], processedName, { type: mimeType }));
          } else {
            reject(new Error('Failed to process image'));
          }
        },
        mimeType,
        quality
      );
    });
  }

  private extractImageMetadata(img: HTMLImageElement, file: File): ImageMetadata {
    return {
      originalSize: { width: img.width, height: img.height },
      processedSize: { width: 0, height: 0 }, // Se actualiza después
      originalFileSize: file.size,
      processedFileSize: 0, // Se actualiza después
      format: file.type,
      hasExifData: this.detectExifData(file),
      compressionRatio: 1, // Se calcula después
    };
  }

  private async generateProcessedMetadata(
    originalMetadata: ImageMetadata,
    processedFile: File,
    dimensions: { width: number; height: number }
  ): Promise<ImageMetadata> {
    return {
      ...originalMetadata,
      processedSize: dimensions,
      processedFileSize: processedFile.size,
      compressionRatio: originalMetadata.originalFileSize / processedFile.size,
    };
  }

  private detectExifData(file: File): boolean {
    // Heurística simple: archivos JPEG suelen tener EXIF
    return file.type === 'image/jpeg' && file.size > 50000; // 50KB threshold
  }

  private calculateReduction(originalSize: number, processedSize: number): number {
    return Math.round(((originalSize - processedSize) / originalSize) * 100);
  }

  private generateProcessedName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const timestamp = Date.now();
    return `${nameWithoutExt}_processed_${timestamp}.${format}`;
  }

  private generateThumbnailName(originalName: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const timestamp = Date.now();
    return `${nameWithoutExt}_thumb_${timestamp}.webp`;
  }

  // ============================================
  // ADVANCED PROCESSING METHODS
  // ============================================

  /**
   * Aplica filtros básicos a la imagen
   */
  async applyFilter(
    file: File, 
    filter: 'grayscale' | 'sepia' | 'brightness' | 'contrast',
    intensity: number = 1
  ): Promise<File> {
    const img = await this.loadImage(file);
    
    // Configurar canvas
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    
    // Aplicar filtro CSS
    this.ctx.filter = this.getFilterCSS(filter, intensity);
    this.ctx.drawImage(img, 0, 0);
    
    // Reset filtro
    this.ctx.filter = 'none';
    
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            const filteredName = this.generateFilteredName(file.name, filter);
            resolve(new File([blob], filteredName, { type: 'image/webp' }));
          } else {
            reject(new Error('Failed to apply filter'));
          }
        },
        'image/webp',
        0.9
      );
    });
  }

  private getFilterCSS(filter: string, intensity: number): string {
    switch (filter) {
      case 'grayscale':
        return `grayscale(${intensity})`;
      case 'sepia':
        return `sepia(${intensity})`;
      case 'brightness':
        return `brightness(${intensity})`;
      case 'contrast':
        return `contrast(${intensity})`;
      default:
        return 'none';
    }
  }

  private generateFilteredName(originalName: string, filter: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_${filter}.webp`;
  }

  /**
   * Optimiza imagen para web (progresive JPEG, etc.)
   */
  async optimizeForWeb(file: File): Promise<File> {
    // Para imágenes web, usar WebP con calidad optimizada
    return this.processImage(file, {
      maxWidth: 1200,
      maxHeight: 800,
      quality: 0.85,
      format: 'webp',
      maintainAspectRatio: true,
      removeExif: true,
    }).then(result => result.processedFile);
  }
}

// ============================================
// SINGLETON INSTANCE + CONVENIENCE FUNCTIONS
// ============================================

export const imageProcessor = new ImageProcessor();

/**
 * Procesamiento rápido para avatares de contactos
 */
export const processContactAvatar = (file: File): Promise<ProcessedImageResult> => {
  return imageProcessor.processImage(file, IMAGE_PROCESSING_CONFIGS.CONTACT_AVATAR);
};

/**
 * Procesamiento rápido para logos de empresas
 */
export const processCompanyLogo = (file: File): Promise<ProcessedImageResult> => {
  return imageProcessor.processImage(file, IMAGE_PROCESSING_CONFIGS.COMPANY_LOGO);
};

/**
 * Procesamiento rápido para documentos escaneados
 */
export const processDocumentScan = (file: File): Promise<ProcessedImageResult> => {
  return imageProcessor.processImage(file, IMAGE_PROCESSING_CONFIGS.DOCUMENT_SCAN);
};

/**
 * Optimización general para web
 */
export const optimizeImageForWeb = (file: File): Promise<File> => {
  return imageProcessor.optimizeForWeb(file);
};

/**
 * Generación de thumbnail únicamente
 */
export const generateImageThumbnail = async (file: File, size: number = 150): Promise<File> => {
  const img = await imageProcessor.loadImage(file);
  return imageProcessor.generateThumbnail(img, size, file.name);
};

/**
 * Helper para crear configuración personalizada
 */
export const createImageProcessingConfig = (
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.85,
  format: 'jpeg' | 'png' | 'webp' = 'webp'
): ImageProcessingOptions => ({
  maxWidth,
  maxHeight,
  quality,
  format,
  maintainAspectRatio: true,
  removeExif: true,
  generateThumbnail: false,
});

export default imageProcessor; 
