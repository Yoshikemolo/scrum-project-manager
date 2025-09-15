/**
 * Development environment configuration
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  graphqlUrl: 'http://localhost:3000/graphql',
  wsUrl: 'ws://localhost:3000',
  appVersion: '1.0.0-dev',
  enableDebugTools: true,
  logLevel: 'debug',
  cacheDuration: 3600000, // 1 hour in milliseconds
  auth: {
    tokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiry: 3600, // 1 hour in seconds
    refreshTokenExpiry: 604800 // 7 days in seconds
  },
  features: {
    enableAI: true,
    enableNotifications: true,
    enableOfflineMode: true,
    enableAnalytics: false,
    enableServiceWorker: false
  },
  i18n: {
    defaultLanguage: 'en',
    availableLanguages: ['en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'zh']
  },
  theme: {
    defaultTheme: 'light',
    availableThemes: ['light', 'dark', 'system']
  },
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100]
  },
  upload: {
    maxFileSize: 10485760, // 10MB in bytes
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
  },
  notifications: {
    position: 'top-right',
    timeout: 5000,
    closeButton: true,
    progressBar: true,
    preventDuplicates: true
  },
  analytics: {
    googleAnalyticsId: '',
    enableTracking: false
  },
  sentry: {
    dsn: '',
    environment: 'development',
    enabled: false
  }
};
