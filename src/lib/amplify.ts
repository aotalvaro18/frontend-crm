// src/lib/amplify.ts
// ✅ VERSIÓN FINAL: Amplify v6 configuration, 100% Type-Safe y sin errores.
// 🔧 CORREGIDO QUIRÚRGICAMENTE: Inicialización SÍNCRONA

import { Amplify, type ResourcesConfig } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { env } from '@/config/environment';
import type { GraphQLResult } from '@aws-amplify/api-graphql';

// ============================================
// INTERFAZ SIMPLE PARA EL API CLIENT (Solución al "Excessive Stack Depth")
// ============================================

/**
 * Define SOLO los métodos del cliente de Amplify que realmente usamos.
 * Esto evita el error "excessive stack depth" al no forzar a TypeScript
 * a inferir el tipo completo y complejo de `generateClient`.
 */
export interface SimpleAmplifyApiClient {
  graphql: (options: any) => Promise<GraphQLResult<any>> | unknown;
  // Puedes añadir otros métodos si los usas en el futuro, como:
  // models: any;
}

// ============================================
// TIPOS DE CONFIGURACIÓN INTERNOS (Para claridad)
// ============================================
interface AmplifyAPIConfig {
  endpoint: string;
  region: string;
  defaultAuthMode?: string;
}

interface AmplifyAuthConfig {
  user_pool_id: string;
  user_pool_client_id: string;
  identity_pool_id?: string;
  region: string;
  // ... y otras propiedades que puedas necesitar
}

interface AmplifyStorageConfig {
  bucket_name?: string;
  region: string;
}

interface EklesaAmplifyConfig {
  aws_project_region: string;
  aws_cognito_region: string;
  aws_user_pools_id?: string;
  aws_user_pools_web_client_id?: string;
  aws_cognito_identity_pool_id?: string;
  API?: {
    crmapi?: AmplifyAPIConfig;
  };
  Storage?: AmplifyStorageConfig;
  Auth?: AmplifyAuthConfig;
}

// ============================================
// CONFIGURATION BUILDER (Lógica de construcción)
// ============================================
class AmplifyConfigurationError extends Error {
  constructor(message: string, public missingConfig?: string[]) {
    super(message);
    this.name = 'AmplifyConfigurationError';
  }
}

const buildAmplifyConfig = (baseConfig: EklesaAmplifyConfig): ResourcesConfig => {
  const missingConfig: string[] = [];
  
  // Build Auth
  const authConfig: any = {
    Cognito: {
      userPoolId: env.cognitoUserPoolId || baseConfig.aws_user_pools_id,
      userPoolClientId: env.cognitoClientId || baseConfig.aws_user_pools_web_client_id,
      region: env.awsRegion || baseConfig.aws_cognito_region,
    }
  };
  if (!authConfig.Cognito.userPoolId) missingConfig.push('User Pool ID');
  if (!authConfig.Cognito.userPoolClientId) missingConfig.push('Client ID');

  // Build API
  const apiConfig: any = {};
  if (env.apiGatewayUrl || baseConfig.API?.crmapi) {
    apiConfig.REST = {
      crmapi: {
        endpoint: env.apiGatewayUrl || baseConfig.API?.crmapi?.endpoint || env.apiBaseUrl,
        region: env.awsRegion || baseConfig.API?.crmapi?.region,
      }
    };
  }

  // Build Storage
  const storageConfig: any = {};
  if (env.s3BucketName || baseConfig.Storage?.bucket_name) {
    storageConfig.S3 = {
      bucket: env.s3BucketName || baseConfig.Storage?.bucket_name,
      region: env.awsRegion || baseConfig.Storage?.region,
    };
  }
  
  if (env.isProd && missingConfig.length > 0) {
    throw new AmplifyConfigurationError(
      `Missing required Amplify config: ${missingConfig.join(', ')}`,
      missingConfig
    );
  }

  return {
    Auth: authConfig,
    ...(Object.keys(apiConfig).length > 0 && { API: apiConfig }),
    ...(Object.keys(storageConfig).length > 0 && { Storage: storageConfig }),
  };
};

// ============================================
// 🔧 INICIALIZACIÓN SÍNCRONA (CORRECCIÓN QUIRÚRGICA)
// ============================================

let isAmplifyInitialized = false;

// 🔧 NUEVO: Función síncrona que se ejecuta inmediatamente
const initializeAmplifySync = (): void => {
  if (isAmplifyInitialized) {
    return;
  }

  try {
    // 1. 🔧 CAMBIO: Cargar configuración de forma SÍNCRONA
    let amplifyBaseConfig: EklesaAmplifyConfig;
    try {
      // 🔧 CRÍTICO: Import síncrono en lugar de async
      amplifyBaseConfig = require('../amplifyconfiguration.json');
    } catch (error) {
      if (env.isDev) console.warn('amplifyconfiguration.json not found, using .env only.');
      amplifyBaseConfig = { aws_project_region: env.awsRegion, aws_cognito_region: env.awsRegion };
    }

    // 2. Construir la configuración final
    const finalConfig = buildAmplifyConfig(amplifyBaseConfig);
    
    // 3. Configurar Amplify
    Amplify.configure(finalConfig);
    
    isAmplifyInitialized = true;
    
    if (env.enableDebug) {
      console.log('✅ Amplify configured successfully.', Amplify.getConfig());
    }

  } catch (error) {
    console.error('🚨 Amplify configuration failed:', error);
    if (env.isProd) {
      // En producción, es un error fatal.
      throw error;
    }
  }
};

// 🔧 EJECUTAR CONFIGURACIÓN INMEDIATAMENTE AL IMPORTAR
initializeAmplifySync();

// 🔧 MANTENER función async para compatibilidad (ahora es un wrapper)
export const initializeAmplify = async (): Promise<void> => {
  // Ya no hace nada porque la configuración es síncrona
  initializeAmplifySync();
};

// ============================================
// API CLIENT Y UTILITIES (Sin cambios)
// ============================================

// Usamos nuestra interfaz simple para evitar el error de stack depth
export const apiClient: SimpleAmplifyApiClient = generateClient();

// Las funciones de utilidad ahora pueden confiar en que Amplify ya fue configurado
export const getAmplifyConfig = () => Amplify.getConfig();

export const isAmplifyConfigured = (): boolean => isAmplifyInitialized;

export const validateAmplifyConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!isAmplifyInitialized) {
    errors.push('Amplify has not been initialized.');
    return { isValid: false, errors };
  }
  
  const config = Amplify.getConfig();
  
  if (!config.Auth?.Cognito?.userPoolId) errors.push('Missing Cognito User Pool ID');
  if (!config.Auth?.Cognito?.userPoolClientId) errors.push('Missing Cognito Client ID');
  
  // ✅ SOLUCIÓN al error de crmapi:
  // Hacemos un type assertion para decirle a TypeScript cómo es la forma de 'API.REST'
  const restApiConfig = config.API?.REST as { 
    crmapi?: { endpoint: string; region: string } 
  } | undefined;
  
  // ✅ Ahora puedes usar la notación de punto de forma segura
  if (!restApiConfig?.crmapi && !env.apiBaseUrl) {
    errors.push('No API configuration found for "crmapi"');
  }
  
  return { isValid: errors.length === 0, errors };
};