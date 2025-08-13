// src/services/upload/fileValidator.ts
// ✅ FILE VALIDATOR ENTERPRISE - SIGUIENDO GUÍA ARQUITECTÓNICA EKLESA
// Principio: Separación de responsabilidades - Este service SOLO valida archivos
// No UI, no estado, solo lógica de validación pura y reutilizable

import { APP_CONFIG, ERROR_CODES } from '@/utils/constants';

// ============================================
// VALIDATION RESULT TYPES (TypeScript Strict)
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: FileMetadata;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'critical' | 'high' | 'medium';
}

export interface ValidationWarning {
  code: string;
  message: string;
  recommendation?: string;
}

export interface FileMetadata {
  actualMimeType: string;
  estimatedType: string;
  hasValidExtension: boolean;
  securityRisk: 'none' | 'low' | 'medium' | 'high';
  qualityScore: number; // 0-100
}

// ============================================
// VALIDATION CONFIGURATION TYPES
// ============================================

export interface FileValidationConfig {
  maxSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  strictTypeChecking: boolean;
  scanForMalware: boolean;
  requireSecureHeaders: boolean;
  customRules?: CustomValidationRule[];
}

export interface CustomValidationRule {
  name: string;
  validator: (file: File) => ValidationError | null;
  category: 'security' | 'business' | 'technical';
}

// ============================================
// PREDEFINED VALIDATION CONFIGS (Por Módulo CRM)
// ============================================

export const VALIDATION_CONFIGS = {
  // Para avatares de contactos - Estricto y optimizado
  CONTACT_AVATAR: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: APP_CONFIG.ALLOWED_IMAGE_TYPES,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    strictTypeChecking: true,
    scanForMalware: true,
    requireSecureHeaders: true,
  } as FileValidationConfig,

  // Para importación CSV - Foco en integridad de datos
  CSV_IMPORT: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['text/csv', 'application/vnd.ms-excel'],
    allowedExtensions: ['.csv'],
    strictTypeChecking: true,
    scanForMalware: false, // CSV no puede contener ejecutables
    requireSecureHeaders: false,
  } as FileValidationConfig,

  // Para documentos adjuntos - Balance seguridad/flexibilidad
  DOCUMENT_ATTACHMENT: {
    maxSize: APP_CONFIG.MAX_FILE_SIZE,
    allowedTypes: [...APP_CONFIG.ALLOWED_DOCUMENT_TYPES, ...APP_CONFIG.ALLOWED_IMAGE_TYPES],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.csv', '.xlsx', '.jpg', '.png'],
    strictTypeChecking: true,
    scanForMalware: true,
    requireSecureHeaders: true,
  } as FileValidationConfig,

  // Para archivos de perfil de empresa - Flexible pero seguro
  COMPANY_PROFILE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: APP_CONFIG.ALLOWED_IMAGE_TYPES,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
    strictTypeChecking: false, // Más flexible para logos
    scanForMalware: true,
    requireSecureHeaders: false,
  } as FileValidationConfig,
} as const;

// ============================================
// FILE VALIDATOR CLASS (Singleton Pattern)
// ============================================

export class FileValidator {
  private readonly maliciousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.scr', '.pif',
    '.vbs', '.js', '.jar', '.app', '.deb', '.pkg',
    '.dmg', '.iso', '.msi', '.sh', '.ps1', '.php'
  ];

  private readonly suspiciousPatterns = [
    /script\s*:/i,
    /javascript\s*:/i,
    /data\s*:/i,
    /vbscript\s*:/i,
    /%3Cscript/i,
    /&lt;script/i,
  ];

  // ============================================
  // MAIN VALIDATION METHOD (Entry Point)
  // ============================================

  /**
   * Valida archivo completo con configuración específica
   * Principio: Una sola responsabilidad - solo validar, no procesar
   */
  async validateFile(file: File, config: FileValidationConfig): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Validaciones básicas (siempre ejecutar)
    errors.push(...this.validateBasicProperties(file));
    errors.push(...this.validateFileSize(file, config.maxSize));
    errors.push(...this.validateFileName(file));
    
    // Validaciones de tipo y extensión
    const typeValidation = await this.validateFileType(file, config);
    errors.push(...typeValidation.errors);
    warnings.push(...typeValidation.warnings);
    
    // Validaciones de seguridad (críticas)
    if (config.scanForMalware) {
      errors.push(...await this.validateSecurity(file));
    }
    
    // Validaciones de cabeceras
    if (config.requireSecureHeaders) {
      const headerValidation = await this.validateFileHeaders(file);
      errors.push(...headerValidation.errors);
      warnings.push(...headerValidation.warnings);
    }
    
    // Validaciones personalizadas
    if (config.customRules) {
      errors.push(...this.validateCustomRules(file, config.customRules));
    }
    
    // Generar metadata
    const metadata = await this.generateFileMetadata(file, errors.length);
    
    return {
      isValid: errors.length === 0,
      errors: this.sortErrorsBySeverity(errors),
      warnings,
      metadata,
    };
  }

  // ============================================
  // VALIDATION METHODS (Separadas por responsabilidad)
  // ============================================

  /**
   * Validaciones básicas del archivo
   */
  private validateBasicProperties(file: File): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Archivo vacío
    if (file.size === 0) {
      errors.push({
        code: 'EMPTY_FILE',
        message: 'El archivo está vacío',
        severity: 'critical',
      });
    }
    
    // Nombre vacío o inválido
    if (!file.name || file.name.trim() === '') {
      errors.push({
        code: 'INVALID_FILENAME',
        message: 'El archivo debe tener un nombre válido',
        field: 'name',
        severity: 'critical',
      });
    }
    
    // Nombre demasiado largo (filesystem limits)
    if (file.name && file.name.length > 255) {
      errors.push({
        code: 'FILENAME_TOO_LONG',
        message: 'El nombre del archivo es demasiado largo (máximo 255 caracteres)',
        field: 'name',
        severity: 'high',
      });
    }
    
    return errors;
  }

  /**
   * Validación de tamaño con contexto de negocio
   */
  private validateFileSize(file: File, maxSize: number): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (file.size > maxSize) {
      errors.push({
        code: ERROR_CODES.FILE_TOO_LARGE,
        message: `El archivo es demasiado grande. Máximo permitido: ${this.formatFileSize(maxSize)}`,
        field: 'size',
        severity: 'critical',
      });
    }
    
    // Archivo excesivamente grande para el contexto
    if (file.size > 100 * 1024 * 1024) { // 100MB
      errors.push({
        code: 'FILE_EXCEPTIONALLY_LARGE',
        message: 'El archivo es excepcionalmente grande. Considera comprimirlo',
        field: 'size',
        severity: 'medium',
      });
    }
    
    return errors;
  }

  /**
   * Validación de nombre de archivo (seguridad y compatibilidad)
   */
  private validateFileName(file: File): ValidationError[] {
    const errors: ValidationError[] = [];
    const name = file.name;
    
    // Caracteres peligrosos
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(name)) {
      errors.push({
        code: 'DANGEROUS_FILENAME',
        message: 'El nombre contiene caracteres no permitidos',
        field: 'name',
        severity: 'high',
      });
    }
    
    // Nombres reservados del sistema
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    const nameWithoutExt = name.split('.')[0].toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) {
      errors.push({
        code: 'RESERVED_FILENAME',
        message: 'El nombre del archivo está reservado por el sistema',
        field: 'name',
        severity: 'high',
      });
    }
    
    return errors;
  }

  /**
   * Validación de tipo MIME y extensión (con detección inteligente)
   */
  private async validateFileType(file: File, config: FileValidationConfig): Promise<{errors: ValidationError[], warnings: ValidationWarning[]}> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const extension = this.getFileExtension(file.name);
    const declaredType = file.type;
    
    // Validar extensión permitida
    if (config.allowedExtensions.length > 0 && !config.allowedExtensions.includes(extension)) {
      errors.push({
        code: ERROR_CODES.INVALID_FILE_TYPE,
        message: `Extensión de archivo no permitida. Permitidas: ${config.allowedExtensions.join(', ')}`,
        field: 'extension',
        severity: 'critical',
      });
    }
    
    // Validar tipo MIME declarado
    if (config.allowedTypes.length > 0) {
      const isTypeAllowed = config.allowedTypes.some(allowedType => {
        if (allowedType.includes('/')) {
          return declaredType === allowedType;
        } else {
          return declaredType.startsWith(allowedType + '/');
        }
      });
      
      if (!isTypeAllowed) {
        errors.push({
          code: ERROR_CODES.INVALID_FILE_TYPE,
          message: `Tipo de archivo no permitido. Tipos permitidos: ${config.allowedTypes.join(', ')}`,
          field: 'mimeType',
          severity: 'critical',
        });
      }
    }
    
    // Validación estricta: verificar que extensión coincida con tipo MIME
    if (config.strictTypeChecking) {
      const typeExtensionMismatch = await this.detectTypeMismatch(file);
      if (typeExtensionMismatch) {
        errors.push({
          code: 'TYPE_EXTENSION_MISMATCH',
          message: 'La extensión del archivo no coincide con su contenido real',
          field: 'mimeType',
          severity: 'high',
        });
      }
    }
    
    // Warning para tipos potencialmente problemáticos
    if (declaredType === 'application/octet-stream') {
      warnings.push({
        code: 'GENERIC_BINARY_TYPE',
        message: 'Tipo MIME genérico detectado',
        recommendation: 'Considera especificar un tipo más específico',
      });
    }
    
    return { errors, warnings };
  }

  /**
   * Validaciones de seguridad (malware, scripts, etc.)
   */
  private async validateSecurity(file: File): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // Extensiones peligrosas
    const extension = this.getFileExtension(file.name);
    if (this.maliciousExtensions.includes(extension.toLowerCase())) {
      errors.push({
        code: 'DANGEROUS_FILE_EXTENSION',
        message: 'Extensión de archivo potencialmente peligrosa',
        field: 'extension',
        severity: 'critical',
      });
    }
    
    // Doble extensión (técnica de ofuscación)
    const parts = file.name.split('.');
    if (parts.length > 2) {
      const secondLastExt = '.' + parts[parts.length - 2];
      if (this.maliciousExtensions.includes(secondLastExt.toLowerCase())) {
        errors.push({
          code: 'DOUBLE_EXTENSION_ATTACK',
          message: 'Posible ataque de doble extensión detectado',
          field: 'name',
          severity: 'critical',
        });
      }
    }
    
    // Escanear contenido inicial para patrones sospechosos
    try {
      const content = await this.readFileHead(file, 1024); // Primeros 1KB
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(content)) {
          errors.push({
            code: 'SUSPICIOUS_CONTENT',
            message: 'Contenido potencialmente malicioso detectado',
            field: 'content',
            severity: 'critical',
          });
          break;
        }
      }
    } catch (error) {
      // Si no se puede leer, es sospechoso
      errors.push({
        code: 'UNREADABLE_FILE',
        message: 'No se puede leer el contenido del archivo',
        field: 'content',
        severity: 'high',
      });
    }
    
    return errors;
  }

  /**
   * Validación de cabeceras de archivo (magic numbers)
   */
  private async validateFileHeaders(file: File): Promise<{errors: ValidationError[], warnings: ValidationWarning[]}> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      const header = await this.readFileHead(file, 8);
      const actualType = this.detectFileTypeFromHeader(header);
      
      if (actualType && actualType !== file.type) {
        if (this.isTypeMismatchCritical(file.type, actualType)) {
          errors.push({
            code: 'HEADER_TYPE_MISMATCH',
            message: `El contenido real (${actualType}) no coincide con el tipo declarado (${file.type})`,
            field: 'mimeType',
            severity: 'high',
          });
        } else {
          warnings.push({
            code: 'MINOR_TYPE_MISMATCH',
            message: `Discrepancia menor entre tipo declarado y detectado`,
            recommendation: 'Verificar que el archivo no esté corrupto',
          });
        }
      }
    } catch (error) {
      warnings.push({
        code: 'HEADER_READ_FAILED',
        message: 'No se pudieron leer las cabeceras del archivo',
        recommendation: 'El archivo podría estar corrupto',
      });
    }
    
    return { errors, warnings };
  }

  /**
   * Validaciones personalizadas (extensibilidad para reglas de negocio)
   */
  private validateCustomRules(file: File, rules: CustomValidationRule[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const rule of rules) {
      try {
        const result = rule.validator(file);
        if (result) {
          errors.push({
            ...result,
            code: `CUSTOM_${result.code}`,
          });
        }
      } catch (error) {
        // Log error pero no fallar validación
        console.warn(`Custom validation rule '${rule.name}' failed:`, error);
      }
    }
    
    return errors;
  }

  // ============================================
  // UTILITY METHODS (Helpers para validación)
  // ============================================

  /**
   * Genera metadata completa del archivo
   */
  private async generateFileMetadata(file: File, errorCount: number): Promise<FileMetadata> {
    const extension = this.getFileExtension(file.name);
    
    let actualMimeType = file.type;
    let estimatedType = file.type;
    
    try {
      const header = await this.readFileHead(file, 8);
      const detectedType = this.detectFileTypeFromHeader(header);
      if (detectedType) {
        actualMimeType = detectedType;
        estimatedType = detectedType;
      }
    } catch {
      // Si no se puede detectar, usar el declarado
    }
    
    return {
      actualMimeType,
      estimatedType,
      hasValidExtension: this.isValidExtension(extension),
      securityRisk: this.calculateSecurityRisk(file, errorCount),
      qualityScore: this.calculateQualityScore(file, errorCount),
    };
  }

  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? '.' + parts.pop()!.toLowerCase() : '';
  }

  private isValidExtension(extension: string): boolean {
    const validExtensions = [
      '.jpg', '.jpeg', '.png', '.webp', '.gif', // Images
      '.pdf', '.doc', '.docx', '.txt', // Documents
      '.csv', '.xlsx', '.xls', // Spreadsheets
      '.zip', '.rar', '.7z', // Archives (if allowed)
    ];
    
    return validExtensions.includes(extension.toLowerCase());
  }

  private async readFileHead(file: File, bytes: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const slice = file.slice(0, bytes);
      
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result.toString());
        } else {
          reject(new Error('Could not read file'));
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsText(slice);
    });
  }

  private detectFileTypeFromHeader(header: string): string | null {
    // Magic numbers para detección de tipo real
    const magicNumbers: Record<string, string> = {
      '\x89PNG': 'image/png',
      '\xFF\xD8\xFF': 'image/jpeg',
      'GIF87a': 'image/gif',
      'GIF89a': 'image/gif',
      '%PDF': 'application/pdf',
      'PK\x03\x04': 'application/zip',
    };
    
    for (const [magic, type] of Object.entries(magicNumbers)) {
      if (header.startsWith(magic)) {
        return type;
      }
    }
    
    return null;
  }

  private async detectTypeMismatch(file: File): Promise<boolean> {
    try {
      const header = await this.readFileHead(file, 8);
      const detectedType = this.detectFileTypeFromHeader(header);
      
      if (detectedType && detectedType !== file.type) {
        return this.isTypeMismatchCritical(file.type, detectedType);
      }
    } catch {
      // Si no se puede leer, asumir que no hay mismatch
    }
    
    return false;
  }

  private isTypeMismatchCritical(declaredType: string, actualType: string): boolean {
    // Casos donde el mismatch es crítico (seguridad)
    const criticalMismatches = [
      { declared: 'image/', actual: 'application/' },
      { declared: 'text/', actual: 'application/' },
      { declared: 'image/', actual: 'text/' },
    ];
    
    return criticalMismatches.some(mismatch => 
      declaredType.startsWith(mismatch.declared) && 
      actualType.startsWith(mismatch.actual)
    );
  }

  private calculateSecurityRisk(file: File, errorCount: number): 'none' | 'low' | 'medium' | 'high' {
    if (errorCount === 0) return 'none';
    if (errorCount <= 2) return 'low';
    if (errorCount <= 4) return 'medium';
    return 'high';
  }

  private calculateQualityScore(file: File, errorCount: number): number {
    let score = 100;
    
    // Penalizar por errores
    score -= errorCount * 20;
    
    // Bonificar por buenas prácticas
    if (this.isValidExtension(this.getFileExtension(file.name))) score += 10;
    if (file.type && file.type !== 'application/octet-stream') score += 10;
    if (file.size > 0 && file.size < APP_CONFIG.MAX_FILE_SIZE) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private sortErrorsBySeverity(errors: ValidationError[]): ValidationError[] {
    const severityOrder = { critical: 0, high: 1, medium: 2 };
    return errors.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// ============================================
// SINGLETON INSTANCE + CONVENIENCE FUNCTIONS
// ============================================

export const fileValidator = new FileValidator();

/**
 * Validación rápida para avatares de contactos
 */
export const validateContactAvatar = (file: File): Promise<ValidationResult> => {
  return fileValidator.validateFile(file, VALIDATION_CONFIGS.CONTACT_AVATAR);
};

/**
 * Validación rápida para CSV de importación
 */
export const validateCSVImport = (file: File): Promise<ValidationResult> => {
  return fileValidator.validateFile(file, VALIDATION_CONFIGS.CSV_IMPORT);
};

/**
 * Validación rápida para documentos adjuntos
 */
export const validateDocumentAttachment = (file: File): Promise<ValidationResult> => {
  return fileValidator.validateFile(file, VALIDATION_CONFIGS.DOCUMENT_ATTACHMENT);
};

/**
 * Validación personalizada con configuración específica
 */
export const validateFileWithConfig = (file: File, config: FileValidationConfig): Promise<ValidationResult> => {
  return fileValidator.validateFile(file, config);
};

/**
 * Helper para crear reglas de validación personalizadas
 */
export const createCustomValidationRule = (
  name: string,
  category: 'security' | 'business' | 'technical',
  validator: (file: File) => ValidationError | null
): CustomValidationRule => ({
  name,
  category,
  validator,
});

export default fileValidator; 
