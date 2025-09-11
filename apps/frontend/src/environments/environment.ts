/**
 * Development environment configuration
 * @module Environment
 */

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  graphqlUrl: 'http://localhost:3000/graphql',
  wsUrl: 'ws://localhost:3000/ws',
  appName: 'SCRUM Project Manager',
  appVersion: '1.0.0-dev',
  company: 'Ximplicity Software Solutions',
  
  // Feature flags
  features: {
    aiAssistant: true,
    darkMode: true,
    notifications: true,
    analytics: false,
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
    level: 'debug',
    enableConsole: true,
    enableRemote: false,
  },
  
  // Cache configuration
  cache: {
    ttl: 300, // 5 minutes
    maxSize: 100, // Maximum number of cached items
  },
  
  // UI configuration
  ui: {
    animationDuration: 300,
    toastDuration: 3000,
    debounceTime: 300,
    throttleTime: 100,
    pageSize: 20,
    maxFileSize: 10485760, // 10MB
  },
};
