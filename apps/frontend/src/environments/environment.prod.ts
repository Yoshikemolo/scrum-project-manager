/**
 * Production environment configuration
 * @module Environment
 */

export const environment = {
  production: true,
  apiUrl: 'https://api.scrum-pm.com',
  graphqlUrl: 'https://api.scrum-pm.com/graphql',
  wsUrl: 'wss://api.scrum-pm.com/ws',
  appName: 'SCRUM Project Manager',
  appVersion: '1.0.0',
  company: 'Ximplicity Software Solutions',
  
  // Feature flags
  features: {
    aiAssistant: true,
    darkMode: true,
    notifications: true,
    analytics: true,
    maintenance: false,
  },
  
  // Auth configuration
  auth: {
    tokenKey: 'spm_token',
    refreshTokenKey: 'spm_refresh_token',
    tokenExpiry: 900, // 15 minutes
    refreshTokenExpiry: 2592000, // 30 days
  },
  
  // i18n configuration
  i18n: {
    defaultLanguage: 'en',
    availableLanguages: ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja'],
    useBrowserLanguage: true,
  },
  
  // Logging configuration
  logging: {
    level: 'error',
    enableConsole: false,
    enableRemote: true,
  },
  
  // Cache configuration
  cache: {
    ttl: 600, // 10 minutes
    maxSize: 200, // Maximum number of cached items
  },
  
  // UI configuration
  ui: {
    animationDuration: 200,
    toastDuration: 3000,
    debounceTime: 300,
    throttleTime: 100,
    pageSize: 20,
    maxFileSize: 10485760, // 10MB
  },
};
