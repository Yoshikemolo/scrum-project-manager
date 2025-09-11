/**
 * Production environment configuration
 */
export const environment = {
  production: true,
  apiUrl: 'https://api.scrum.ximplicity.es',
  graphqlUrl: 'https://api.scrum.ximplicity.es/graphql',
  wsUrl: 'wss://api.scrum.ximplicity.es',
  appVersion: '1.0.0',
  enableDebugTools: false,
  logLevel: 'error',
  cacheDuration: 7200000, // 2 hours in milliseconds
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
    enableAnalytics: true,
    enableServiceWorker: true
  },
  i18n: {
    defaultLanguage: 'en',
    availableLanguages: ['en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'zh']
  },
  theme: {
    defaultTheme: 'system',
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
    googleAnalyticsId: 'G-XXXXXXXXXX',
    enableTracking: true
  },
  sentry: {
    dsn: 'https://xxxxxx@sentry.io/xxxxxx',
    environment: 'production',
    enabled: true
  }
};
