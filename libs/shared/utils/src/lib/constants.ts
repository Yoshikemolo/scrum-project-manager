export const CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  
  // Sprint
  DEFAULT_SPRINT_DURATION: 14, // days
  MIN_SPRINT_DURATION: 7,
  MAX_SPRINT_DURATION: 30,
  
  // Task
  FIBONACCI_SEQUENCE: [0, 0.5, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
  DEFAULT_TASK_PRIORITY: 'medium',
  DEFAULT_TASK_STATUS: 'todo',
  
  // Authentication
  JWT_EXPIRES_IN: '7d',
  REFRESH_TOKEN_EXPIRES_IN: '30d',
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // Cache
  CACHE_TTL: 60 * 60, // 1 hour in seconds
  CACHE_MAX_ITEMS: 1000,
  
  // WebSocket
  WS_HEARTBEAT_INTERVAL: 30000, // 30 seconds
  WS_RECONNECT_INTERVAL: 5000, // 5 seconds
  WS_MAX_RECONNECT_ATTEMPTS: 5,
  
  // AI
  AI_MAX_TOKENS: 4000,
  AI_TEMPERATURE: 0.7,
  AI_MAX_CONTEXT_MESSAGES: 10,
  AI_RATE_LIMIT_PER_MINUTE: 10,
  AI_RATE_LIMIT_PER_HOUR: 100,
  
  // Colors (Ximplicity branding)
  COLORS: {
    PRIMARY: '#0066FF',
    SECONDARY: '#111111',
    ACCENT: '#0044CC',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#3B82F6',
  },
  
  // Regex Patterns
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^https?:\/\/.+/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    PROJECT_KEY: /^[A-Z]{2,10}$/,
    PHONE: /^\+?[1-9]\d{1,14}$/,
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'You are not authorized to perform this action',
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Your session has expired. Please login again',
    NOT_FOUND: 'The requested resource was not found',
    VALIDATION_ERROR: 'Validation failed. Please check your input',
    SERVER_ERROR: 'An unexpected error occurred. Please try again later',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    LOGIN: 'Login successful',
    LOGOUT: 'Logout successful',
    REGISTER: 'Registration successful. Please check your email to verify your account',
    PASSWORD_RESET: 'Password reset link has been sent to your email',
    PASSWORD_CHANGED: 'Password changed successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    TASK_CREATED: 'Task created successfully',
    TASK_UPDATED: 'Task updated successfully',
    TASK_DELETED: 'Task deleted successfully',
    PROJECT_CREATED: 'Project created successfully',
    SPRINT_STARTED: 'Sprint started successfully',
    SPRINT_COMPLETED: 'Sprint completed successfully',
  },
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences',
    AVATAR: '/users/avatar',
  },
  PROJECTS: {
    BASE: '/projects',
    MEMBERS: '/projects/:id/members',
    METRICS: '/projects/:id/metrics',
    SUBSCRIBE: '/projects/:id/subscribe',
  },
  SPRINTS: {
    BASE: '/sprints',
    START: '/sprints/:id/start',
    COMPLETE: '/sprints/:id/complete',
    PLANNING: '/sprints/:id/planning',
    RETROSPECTIVE: '/sprints/:id/retrospective',
  },
  TASKS: {
    BASE: '/tasks',
    COMMENTS: '/tasks/:id/comments',
    ATTACHMENTS: '/tasks/:id/attachments',
    MOVE: '/tasks/:id/move',
    ASSIGN: '/tasks/:id/assign',
  },
  AI: {
    CHAT: '/ai/chat',
    SUGGESTIONS: '/ai/suggestions',
    ANALYSIS: '/ai/analysis',
    ACTIONS: '/ai/actions',
  },
};

export const PERMISSIONS = {
  // Project permissions
  PROJECT_CREATE: 'project.create',
  PROJECT_READ: 'project.read',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',
  PROJECT_ARCHIVE: 'project.archive',
  
  // Sprint permissions
  SPRINT_CREATE: 'sprint.create',
  SPRINT_READ: 'sprint.read',
  SPRINT_UPDATE: 'sprint.update',
  SPRINT_DELETE: 'sprint.delete',
  SPRINT_START: 'sprint.start',
  SPRINT_COMPLETE: 'sprint.complete',
  
  // Task permissions
  TASK_CREATE: 'task.create',
  TASK_READ: 'task.read',
  TASK_UPDATE: 'task.update',
  TASK_DELETE: 'task.delete',
  TASK_ASSIGN: 'task.assign',
  TASK_MOVE: 'task.move',
  
  // User permissions
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_MANAGE_ROLES: 'user.manage_roles',
  
  // Admin permissions
  ADMIN_ACCESS: 'admin.access',
  ADMIN_SETTINGS: 'admin.settings',
  ADMIN_USERS: 'admin.users',
  ADMIN_PROJECTS: 'admin.projects',
};
