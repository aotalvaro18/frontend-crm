// src/config/environment.ts
// ✅ CORREGIDO: Centralized environment configuration siguiendo guía arquitectónica

// ============================================
// TYPES
// ============================================

interface Environment {
  // App Configuration
  appName: string;
  appVersion: string;
  appDescription: string;
  appEnvironment: 'development' | 'staging' | 'production';
  
  // AWS Configuration
  awsRegion: string;
  cognitoUserPoolId: string;
  cognitoClientId: string;
  cognitoIdentityPoolId?: string;
  
  // API Configuration
  apiBaseUrl: string;
  apiGatewayUrl: string;
  
  // Storage Configuration
  s3BucketName?: string;
  
  // Feature Flags
  enableAnalytics: boolean;
  enableDebug: boolean;
  
  // External Services
  sentryDsn?: string;
  
  // Computed Properties
  isDev: boolean;
  isProd: boolean;
  isStaging: boolean;
}

// ============================================
// ENVIRONMENT VARIABLE READER
// ============================================

class EnvironmentConfig implements Environment {
  // App Configuration
  readonly appName: string;
  readonly appVersion: string;
  readonly appDescription: string;
  readonly appEnvironment: 'development' | 'staging' | 'production';
  
  // AWS Configuration  
  readonly awsRegion: string;
  readonly cognitoUserPoolId: string;
  readonly cognitoClientId: string;
  readonly cognitoIdentityPoolId?: string;
  
  // API Configuration
  readonly apiBaseUrl: string;
  readonly apiGatewayUrl: string;
  
  // Storage Configuration
  readonly s3BucketName?: string;
  
  // Feature Flags
  readonly enableAnalytics: boolean;
  readonly enableDebug: boolean;
  
  // External Services
  readonly sentryDsn?: string;
  
  // Computed Properties
  readonly isDev: boolean;
  readonly isProd: boolean;
  readonly isStaging: boolean;

  constructor() {
    // ============================================
    // APP CONFIGURATION
    // ============================================
    
    this.appName = this.getRequired('VITE_APP_NAME');
    this.appVersion = this.getRequired('VITE_APP_VERSION');
    this.appDescription = this.getRequired('VITE_APP_DESCRIPTION');
    
    // Environment detection
    const nodeEnv = import.meta.env.MODE || 'development';
    this.appEnvironment = this.validateEnvironment(nodeEnv);
    
    // Computed properties
    this.isDev = this.appEnvironment === 'development';
    this.isProd = this.appEnvironment === 'production';
    this.isStaging = this.appEnvironment === 'staging';

    // ============================================
    // AWS CONFIGURATION
    // ============================================
    
    this.awsRegion = this.getRequired('VITE_AWS_REGION');
    this.cognitoUserPoolId = this.getRequired('VITE_COGNITO_USER_POOL_ID');
    this.cognitoClientId = this.getRequired('VITE_COGNITO_CLIENT_ID');
    this.cognitoIdentityPoolId = this.get('VITE_COGNITO_IDENTITY_POOL_ID');

    // ============================================
    // API CONFIGURATION
    // ============================================
    
    this.apiGatewayUrl = this.getRequired('VITE_API_GATEWAY_URL');
    // Use API Gateway URL as base, or fallback to localhost in development
    this.apiBaseUrl = this.apiGatewayUrl || (this.isDev ? 'http://localhost:8080' : '');
    
    if (!this.apiBaseUrl) {
      throw new Error('API Base URL is required. Set VITE_API_GATEWAY_URL environment variable.');
    }

    // ============================================
    // STORAGE CONFIGURATION
    // ============================================
    
    this.s3BucketName = this.get('VITE_S3_BUCKET_NAME');

    // ============================================
    // FEATURE FLAGS
    // ============================================
    
    this.enableAnalytics = this.getBoolean('VITE_FEATURE_ANALYTICS_ENABLED', true);
    this.enableDebug = this.getBoolean('VITE_DEBUG_MODE', this.isDev);

    // ============================================
    // EXTERNAL SERVICES
    // ============================================
    
    this.sentryDsn = this.get('VITE_SENTRY_DSN');

    // ============================================
    // VALIDATION
    // ============================================
    
    this.validateConfiguration();
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private getRequired(key: string): string {
    const value = import.meta.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  get(key: string): string | undefined {
    return import.meta.env[key];
  }

  private getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private validateEnvironment(env: string): 'development' | 'staging' | 'production' {
    const validEnvs = ['development', 'staging', 'production'];
    if (!validEnvs.includes(env)) {
      console.warn(`Invalid environment: ${env}. Defaulting to development.`);
      return 'development';
    }
    return env as 'development' | 'staging' | 'production';
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    // Validate AWS region format
    if (!/^[a-z0-9-]+$/.test(this.awsRegion)) {
      errors.push('Invalid AWS region format');
    }

    // Validate Cognito User Pool ID format
    if (!/^[a-z0-9-]+_[a-zA-Z0-9]+$/.test(this.cognitoUserPoolId)) {
      errors.push('Invalid Cognito User Pool ID format');
    }

    // Validate Cognito Client ID format (alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(this.cognitoClientId)) {
      errors.push('Invalid Cognito Client ID format');
    }

    // Validate API URL format
    try {
      new URL(this.apiBaseUrl);
    } catch {
      errors.push('Invalid API Base URL format');
    }

    // Validate Sentry DSN if provided
    if (this.sentryDsn && !this.sentryDsn.startsWith('https://')) {
      errors.push('Invalid Sentry DSN format');
    }

    // Production-specific validations
    if (this.isProd) {
      if (this.apiBaseUrl.includes('localhost')) {
        errors.push('Production environment cannot use localhost API URL');
      }

      if (this.enableDebug) {
        console.warn('Debug mode is enabled in production');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Environment configuration errors: ${errors.join(', ')}`);
    }
  }

  // ============================================
  // PUBLIC UTILITY METHODS
  // ============================================

  /**
   * Get all configuration as an object (for debugging)
   */
  getAll(): Record<string, any> {
    return {
      // App
      appName: this.appName,
      appVersion: this.appVersion,
      appDescription: this.appDescription,
      appEnvironment: this.appEnvironment,
      
      // AWS (sensitive data masked in production)
      awsRegion: this.awsRegion,
      cognitoUserPoolId: this.isProd ? '***masked***' : this.cognitoUserPoolId,
      cognitoClientId: this.isProd ? '***masked***' : this.cognitoClientId,
      
      // API
      apiBaseUrl: this.apiBaseUrl,
      apiGatewayUrl: this.apiGatewayUrl,
      
      // Features
      enableAnalytics: this.enableAnalytics,
      enableDebug: this.enableDebug,
      
      // Environment flags
      isDev: this.isDev,
      isProd: this.isProd,
      isStaging: this.isStaging,
    };
  }

  /**
   * Print configuration to console (development only)
   */
  printConfiguration(): void {
    if (this.isDev) {
      console.group('🔧 Environment Configuration');
      console.table(this.getAll());
      console.groupEnd();
    }
  }

  /**
   * Check if all required configuration is present
   */
  isValid(): boolean {
    try {
      this.validateConfiguration();
      return true;
    } catch (error) {
      console.error('Environment configuration is invalid:', error);
      return false;
    }
  }

  /**
   * Get configuration for specific service
   */
  getAwsConfig() {
    return {
      region: this.awsRegion,
      userPoolId: this.cognitoUserPoolId,
      clientId: this.cognitoClientId,
      identityPoolId: this.cognitoIdentityPoolId,
    };
  }

  getApiConfig() {
    return {
      baseUrl: this.apiBaseUrl,
      gatewayUrl: this.apiGatewayUrl,
      timeout: 30000,
    };
  }

  getFeatureFlags() {
    return {
      analytics: this.enableAnalytics,
      debug: this.enableDebug,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const env = new EnvironmentConfig();

// Print configuration in development
if (env.isDev) {
  env.printConfiguration();
}

// Export for testing and advanced usage
export type { Environment };
export { EnvironmentConfig };