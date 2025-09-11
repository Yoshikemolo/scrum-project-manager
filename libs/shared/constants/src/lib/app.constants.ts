export const APP_CONSTANTS = {
  NAME: 'SCRUM Project Manager',
  VERSION: '1.0.0',
  COMPANY: 'Ximplicity Software Solutions',
  SUPPORT_EMAIL: 'support@scrum-pm.com',
  WEBSITE: 'https://scrum-pm.com',
  COPYRIGHT: '© 2025 Ximplicity Software Solutions. All Rights Reserved.',
};

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
  SORT_ORDER: 'desc' as const,
};

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ALLOWED_EXTENSIONS: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
  ],
};

export const SPRINT_DEFAULTS = {
  DURATION_DAYS: 14,
  MIN_DURATION: 7,
  MAX_DURATION: 30,
  WORKING_DAYS: [1, 2, 3, 4, 5], // Monday to Friday
  START_DAY: 1, // Monday
};

export const TASK_DEFAULTS = {
  STORY_POINTS: [0, 0.5, 1, 2, 3, 5, 8, 13, 21],
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_COMMENT_LENGTH: 2000,
  MAX_ATTACHMENTS: 10,
  MAX_SUBTASKS: 20,
};

export const USER_DEFAULTS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  PASSWORD_RESET_TOKEN_EXPIRY: 3600000, // 1 hour
  EMAIL_VERIFICATION_TOKEN_EXPIRY: 86400000, // 24 hours
  SESSION_TIMEOUT: 1800000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900000, // 15 minutes
};

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

export const RATE_LIMITS = {
  ANONYMOUS: {
    POINTS: 100,
    DURATION: 3600, // 1 hour
  },
  AUTHENTICATED: {
    POINTS: 1000,
    DURATION: 3600,
  },
  PREMIUM: {
    POINTS: 5000,
    DURATION: 3600,
  },
  API: {
    POINTS: 10000,
    DURATION: 3600,
  },
};

export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  TASK_COMPLETED: 'task_completed',
  TASK_COMMENTED: 'task_commented',
  SPRINT_STARTED: 'sprint_started',
  SPRINT_COMPLETED: 'sprint_completed',
  PROJECT_INVITATION: 'project_invitation',
  MENTION: 'mention',
  DEADLINE_APPROACHING: 'deadline_approaching',
  SYSTEM_UPDATE: 'system_update',
};

export const AI_CONSTANTS = {
  MAX_CONTEXT_MESSAGES: 10,
  MAX_MESSAGE_LENGTH: 4000,
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.7,
  MODEL: 'gpt-4-turbo-preview',
  RATE_LIMIT_PER_MINUTE: 10,
  RATE_LIMIT_PER_HOUR: 100,
};
