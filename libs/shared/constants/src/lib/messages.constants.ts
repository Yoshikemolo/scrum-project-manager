export const SUCCESS_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Successfully logged in',
  LOGOUT_SUCCESS: 'Successfully logged out',
  REGISTER_SUCCESS: 'Registration successful. Please check your email to verify your account.',
  PASSWORD_RESET_SENT: 'Password reset instructions have been sent to your email',
  PASSWORD_CHANGED: 'Password successfully changed',
  EMAIL_VERIFIED: 'Email successfully verified',

  // Projects
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  PROJECT_ARCHIVED: 'Project archived successfully',
  PROJECT_RESTORED: 'Project restored successfully',
  PROJECT_MEMBER_ADDED: 'Member added to project successfully',
  PROJECT_MEMBER_REMOVED: 'Member removed from project successfully',

  // Sprints
  SPRINT_CREATED: 'Sprint created successfully',
  SPRINT_UPDATED: 'Sprint updated successfully',
  SPRINT_STARTED: 'Sprint started successfully',
  SPRINT_COMPLETED: 'Sprint completed successfully',
  SPRINT_CANCELLED: 'Sprint cancelled successfully',

  // Tasks
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASK_DELETED: 'Task deleted successfully',
  TASK_ASSIGNED: 'Task assigned successfully',
  TASK_MOVED: 'Task moved successfully',
  TASK_COMPLETED: 'Task completed successfully',

  // Comments
  COMMENT_ADDED: 'Comment added successfully',
  COMMENT_UPDATED: 'Comment updated successfully',
  COMMENT_DELETED: 'Comment deleted successfully',

  // Files
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DELETED: 'File deleted successfully',

  // General
  OPERATION_SUCCESS: 'Operation completed successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PREFERENCES_UPDATED: 'Preferences updated successfully',
};

export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account is locked due to multiple failed login attempts',
  ACCOUNT_DISABLED: 'Account has been disabled',
  EMAIL_NOT_VERIFIED: 'Please verify your email before logging in',
  TOKEN_EXPIRED: 'Session has expired. Please login again',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',

  // Validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number and special character',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  INVALID_DATE_RANGE: 'End date must be after start date',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
  INVALID_FILE_TYPE: 'Invalid file type',

  // Resources
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  CONFLICT: 'Resource conflict detected',
  QUOTA_EXCEEDED: 'Quota exceeded',

  // Business logic
  SPRINT_ALREADY_ACTIVE: 'A sprint is already active for this project',
  CANNOT_DELETE_ACTIVE_SPRINT: 'Cannot delete an active sprint',
  CANNOT_MOVE_COMPLETED_TASK: 'Cannot move a completed task',
  TASK_ALREADY_ASSIGNED: 'Task is already assigned to this user',
  INVALID_STATE_TRANSITION: 'Invalid state transition',
  CIRCULAR_DEPENDENCY: 'Circular dependency detected',

  // System
  INTERNAL_ERROR: 'An internal error occurred. Please try again later',
  DATABASE_ERROR: 'Database error occurred',
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  MAINTENANCE_MODE: 'System is under maintenance. Please try again later',

  // General
  OPERATION_FAILED: 'Operation failed. Please try again',
  INVALID_INPUT: 'Invalid input provided',
  TIMEOUT: 'Request timed out',
  UNKNOWN_ERROR: 'An unknown error occurred',
};

export const VALIDATION_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) => `${field} must not exceed ${max} characters`,
  MIN_VALUE: (field: string, min: number) => `${field} must be at least ${min}`,
  MAX_VALUE: (field: string, max: number) => `${field} must not exceed ${max}`,
  PATTERN: (field: string) => `${field} format is invalid`,
  EMAIL: 'Please enter a valid email address',
  URL: 'Please enter a valid URL',
  DATE: 'Please enter a valid date',
  NUMBER: 'Please enter a valid number',
  INTEGER: 'Please enter a whole number',
  UNIQUE: (field: string) => `${field} already exists`,
};

export const CONFIRMATION_MESSAGES = {
  DELETE_PROJECT: 'Are you sure you want to delete this project? This action cannot be undone.',
  DELETE_SPRINT: 'Are you sure you want to delete this sprint? All tasks will be moved to backlog.',
  DELETE_TASK: 'Are you sure you want to delete this task? This action cannot be undone.',
  CANCEL_SPRINT: 'Are you sure you want to cancel this sprint? All incomplete tasks will be moved to backlog.',
  LOGOUT: 'Are you sure you want to logout?',
  DISCARD_CHANGES: 'Are you sure you want to discard your changes?',
  REMOVE_MEMBER: 'Are you sure you want to remove this member from the project?',
};

export const PLACEHOLDER_MESSAGES = {
  EMAIL: 'Enter your email address',
  PASSWORD: 'Enter your password',
  SEARCH: 'Search...',
  PROJECT_NAME: 'Enter project name',
  TASK_TITLE: 'Enter task title',
  COMMENT: 'Add a comment...',
  DESCRIPTION: 'Enter description',
  SELECT_OPTION: 'Select an option',
  SELECT_DATE: 'Select a date',
  SELECT_USER: 'Select a user',
  SELECT_PROJECT: 'Select a project',
};

export const AI_MESSAGES = {
  GREETING: 'Hello! I\'m your AI assistant. How can I help you with your project today?',
  THINKING: 'Let me think about that...',
  PROCESSING: 'Processing your request...',
  ERROR: 'I encountered an error while processing your request. Please try again.',
  SUGGESTION_PREFIX: 'Based on your project data, I suggest:',
  ACTION_CONFIRMATION: 'Would you like me to perform this action?',
  ACTION_COMPLETED: 'Action completed successfully',
  NO_SUGGESTIONS: 'No suggestions available at this time',
};
