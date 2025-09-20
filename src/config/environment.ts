/**
 * Frontend environment configuration
 */

export interface EnvironmentConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

// Get environment variables from Vite
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return import.meta.env[key] || defaultValue;
};

// Determine environment
const nodeEnv = getEnvVar('MODE', 'development');

export const config: EnvironmentConfig = {
  // API base URL - defaults to localhost:3001 in development
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 
    nodeEnv === 'production' 
      ? '/api' // Use relative path in production (same domain)
      : 'http://localhost:3001/api' // Full URL in development
  ),
  
  // Environment flags
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
};

// Validate configuration in non-test environments
export const validateConfig = (): void => {
  if (config.isTest) {
    return; // Skip validation in test environment
  }

  if (!config.apiBaseUrl) {
    console.warn('API base URL not configured, using default');
  }
};

// Validate configuration on import
validateConfig();