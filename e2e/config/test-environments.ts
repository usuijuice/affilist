export const testEnvironments = {
  development: {
    baseURL: 'http://localhost:5173',
    apiURL: 'http://localhost:3000',
    timeout: 30000,
  },
  staging: {
    baseURL: process.env.STAGING_URL || 'https://staging.affilist.com',
    apiURL: process.env.STAGING_API_URL || 'https://api-staging.affilist.com',
    timeout: 60000,
  },
  production: {
    baseURL: process.env.PRODUCTION_URL || 'https://affilist.com',
    apiURL: process.env.PRODUCTION_API_URL || 'https://api.affilist.com',
    timeout: 60000,
  },
};

export const getCurrentEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  return (
    testEnvironments[env as keyof typeof testEnvironments] ||
    testEnvironments.development
  );
};
