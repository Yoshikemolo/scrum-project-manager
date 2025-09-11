export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    ME: '/auth/me',
  },

  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: (id: string) => `/users/${id}/profile`,
    AVATAR: (id: string) => `/users/${id}/avatar`,
    PREFERENCES: (id: string) => `/users/${id}/preferences`,
    GROUPS: (id: string) => `/users/${id}/groups`,
    PROJECTS: (id: string) => `/users/${id}/projects`,
    TASKS: (id: string) => `/users/${id}/tasks`,
    NOTIFICATIONS: (id: string) => `/users/${id}/notifications`,
  },

  // Projects
  PROJECTS: {
    BASE: '/projects',
    BY_ID: (id: string) => `/projects/${id}`,
    MEMBERS: (id: string) => `/projects/${id}/members`,
    SPRINTS: (id: string) => `/projects/${id}/sprints`,
    BACKLOG: (id: string) => `/projects/${id}/backlog`,
    METRICS: (id: string) => `/projects/${id}/metrics`,
    SETTINGS: (id: string) => `/projects/${id}/settings`,
    ARCHIVE: (id: string) => `/projects/${id}/archive`,
    RESTORE: (id: string) => `/projects/${id}/restore`,
    SUBSCRIBE: (id: string) => `/projects/${id}/subscribe`,
    UNSUBSCRIBE: (id: string) => `/projects/${id}/unsubscribe`,
  },

  // Sprints
  SPRINTS: {
    BASE: '/sprints',
    BY_ID: (id: string) => `/sprints/${id}`,
    START: (id: string) => `/sprints/${id}/start`,
    COMPLETE: (id: string) => `/sprints/${id}/complete`,
    CANCEL: (id: string) => `/sprints/${id}/cancel`,
    TASKS: (id: string) => `/sprints/${id}/tasks`,
    BURNDOWN: (id: string) => `/sprints/${id}/burndown`,
    VELOCITY: (id: string) => `/sprints/${id}/velocity`,
    RETROSPECTIVE: (id: string) => `/sprints/${id}/retrospective`,
    PLANNING: (id: string) => `/sprints/${id}/planning`,
  },

  // Tasks
  TASKS: {
    BASE: '/tasks',
    BY_ID: (id: string) => `/tasks/${id}`,
    ASSIGN: (id: string) => `/tasks/${id}/assign`,
    UNASSIGN: (id: string) => `/tasks/${id}/unassign`,
    MOVE: (id: string) => `/tasks/${id}/move`,
    COMMENTS: (id: string) => `/tasks/${id}/comments`,
    ATTACHMENTS: (id: string) => `/tasks/${id}/attachments`,
    SUBTASKS: (id: string) => `/tasks/${id}/subtasks`,
    ACTIVITY: (id: string) => `/tasks/${id}/activity`,
    WATCH: (id: string) => `/tasks/${id}/watch`,
    UNWATCH: (id: string) => `/tasks/${id}/unwatch`,
  },

  // Comments
  COMMENTS: {
    BASE: '/comments',
    BY_ID: (id: string) => `/comments/${id}`,
    EDIT: (id: string) => `/comments/${id}`,
    DELETE: (id: string) => `/comments/${id}`,
    REACTIONS: (id: string) => `/comments/${id}/reactions`,
  },

  // AI Assistant
  AI: {
    CHAT: '/ai/chat',
    SUGGESTIONS: '/ai/suggestions',
    ANALYSIS: '/ai/analysis',
    ACTIONS: '/ai/actions',
    EXECUTE: (id: string) => `/ai/actions/${id}/execute`,
    PROMPTS: '/ai/prompts',
    HISTORY: '/ai/history',
  },

  // Files
  FILES: {
    UPLOAD: '/files/upload',
    DOWNLOAD: (id: string) => `/files/${id}/download`,
    DELETE: (id: string) => `/files/${id}`,
    PREVIEW: (id: string) => `/files/${id}/preview`,
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    SETTINGS: '/notifications/settings',
  },

  // Search
  SEARCH: {
    GLOBAL: '/search',
    PROJECTS: '/search/projects',
    TASKS: '/search/tasks',
    USERS: '/search/users',
    COMMENTS: '/search/comments',
  },

  // Reports
  REPORTS: {
    DASHBOARD: '/reports/dashboard',
    PROJECT: (id: string) => `/reports/project/${id}`,
    SPRINT: (id: string) => `/reports/sprint/${id}`,
    TEAM: '/reports/team',
    EXPORT: '/reports/export',
  },

  // Admin
  ADMIN: {
    USERS: '/admin/users',
    PROJECTS: '/admin/projects',
    SETTINGS: '/admin/settings',
    AUDIT_LOG: '/admin/audit-log',
    METRICS: '/admin/metrics',
  },

  // Health
  HEALTH: {
    STATUS: '/health',
    READY: '/health/ready',
    LIVE: '/health/live',
  },
};

export const GRAPHQL_ENDPOINT = '/graphql';
export const WEBSOCKET_ENDPOINT = '/ws';

export const API_VERSIONS = {
  V1: '/api/v1',
  V2: '/api/v2',
  CURRENT: '/api/v1',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH001',
  AUTH_TOKEN_EXPIRED: 'AUTH002',
  AUTH_TOKEN_INVALID: 'AUTH003',
  AUTH_ACCOUNT_LOCKED: 'AUTH004',
  AUTH_ACCOUNT_DISABLED: 'AUTH005',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH006',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH007',

  // Validation errors
  VALIDATION_FAILED: 'VAL001',
  VALIDATION_REQUIRED_FIELD: 'VAL002',
  VALIDATION_INVALID_FORMAT: 'VAL003',
  VALIDATION_OUT_OF_RANGE: 'VAL004',
  VALIDATION_DUPLICATE_VALUE: 'VAL005',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RES001',
  RESOURCE_ALREADY_EXISTS: 'RES002',
  RESOURCE_CONFLICT: 'RES003',
  RESOURCE_LOCKED: 'RES004',
  RESOURCE_QUOTA_EXCEEDED: 'RES005',

  // Business logic errors
  BUSINESS_RULE_VIOLATION: 'BUS001',
  WORKFLOW_ERROR: 'BUS002',
  INVALID_STATE_TRANSITION: 'BUS003',
  DEPENDENCY_ERROR: 'BUS004',

  // System errors
  INTERNAL_ERROR: 'SYS001',
  DATABASE_ERROR: 'SYS002',
  EXTERNAL_SERVICE_ERROR: 'SYS003',
  RATE_LIMIT_EXCEEDED: 'SYS004',
  MAINTENANCE_MODE: 'SYS005',
};
