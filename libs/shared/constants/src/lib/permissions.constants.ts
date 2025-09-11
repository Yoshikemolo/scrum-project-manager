export const PERMISSIONS = {
  // Project Permissions
  PROJECT: {
    VIEW: 'project:view',
    CREATE: 'project:create',
    UPDATE: 'project:update',
    DELETE: 'project:delete',
    ARCHIVE: 'project:archive',
    MANAGE_MEMBERS: 'project:manage_members',
    MANAGE_SETTINGS: 'project:manage_settings',
    EXPORT: 'project:export',
  },

  // Sprint Permissions
  SPRINT: {
    VIEW: 'sprint:view',
    CREATE: 'sprint:create',
    UPDATE: 'sprint:update',
    DELETE: 'sprint:delete',
    START: 'sprint:start',
    COMPLETE: 'sprint:complete',
    CANCEL: 'sprint:cancel',
    MANAGE_TASKS: 'sprint:manage_tasks',
  },

  // Task Permissions
  TASK: {
    VIEW: 'task:view',
    CREATE: 'task:create',
    UPDATE: 'task:update',
    DELETE: 'task:delete',
    ASSIGN: 'task:assign',
    MOVE: 'task:move',
    COMMENT: 'task:comment',
    ATTACH_FILES: 'task:attach_files',
  },

  // User Permissions
  USER: {
    VIEW: 'user:view',
    CREATE: 'user:create',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
    MANAGE_ROLES: 'user:manage_roles',
    MANAGE_GROUPS: 'user:manage_groups',
    IMPERSONATE: 'user:impersonate',
  },

  // Admin Permissions
  ADMIN: {
    ACCESS_DASHBOARD: 'admin:access_dashboard',
    MANAGE_SYSTEM: 'admin:manage_system',
    VIEW_AUDIT_LOG: 'admin:view_audit_log',
    MANAGE_SETTINGS: 'admin:manage_settings',
    VIEW_METRICS: 'admin:view_metrics',
    MANAGE_INTEGRATIONS: 'admin:manage_integrations',
  },

  // Report Permissions
  REPORT: {
    VIEW: 'report:view',
    CREATE: 'report:create',
    EXPORT: 'report:export',
    SCHEDULE: 'report:schedule',
  },

  // AI Permissions
  AI: {
    USE_ASSISTANT: 'ai:use_assistant',
    VIEW_SUGGESTIONS: 'ai:view_suggestions',
    EXECUTE_ACTIONS: 'ai:execute_actions',
    MANAGE_PROMPTS: 'ai:manage_prompts',
  },

  // Notification Permissions
  NOTIFICATION: {
    VIEW_ALL: 'notification:view_all',
    MANAGE_ALL: 'notification:manage_all',
  },
};

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: Object.values(PERMISSIONS).flatMap(group => Object.values(group)),
  
  ADMIN: [
    ...Object.values(PERMISSIONS.PROJECT),
    ...Object.values(PERMISSIONS.SPRINT),
    ...Object.values(PERMISSIONS.TASK),
    ...Object.values(PERMISSIONS.USER).filter(p => p !== PERMISSIONS.USER.IMPERSONATE),
    ...Object.values(PERMISSIONS.REPORT),
    ...Object.values(PERMISSIONS.AI),
    PERMISSIONS.ADMIN.ACCESS_DASHBOARD,
    PERMISSIONS.ADMIN.VIEW_AUDIT_LOG,
    PERMISSIONS.ADMIN.VIEW_METRICS,
  ],

  PROJECT_OWNER: [
    PERMISSIONS.PROJECT.VIEW,
    PERMISSIONS.PROJECT.UPDATE,
    PERMISSIONS.PROJECT.ARCHIVE,
    PERMISSIONS.PROJECT.MANAGE_MEMBERS,
    PERMISSIONS.PROJECT.MANAGE_SETTINGS,
    PERMISSIONS.PROJECT.EXPORT,
    ...Object.values(PERMISSIONS.SPRINT),
    ...Object.values(PERMISSIONS.TASK),
    ...Object.values(PERMISSIONS.REPORT),
    ...Object.values(PERMISSIONS.AI),
  ],

  TEAM_MEMBER: [
    PERMISSIONS.PROJECT.VIEW,
    PERMISSIONS.SPRINT.VIEW,
    PERMISSIONS.SPRINT.UPDATE,
    PERMISSIONS.TASK.VIEW,
    PERMISSIONS.TASK.CREATE,
    PERMISSIONS.TASK.UPDATE,
    PERMISSIONS.TASK.ASSIGN,
    PERMISSIONS.TASK.MOVE,
    PERMISSIONS.TASK.COMMENT,
    PERMISSIONS.TASK.ATTACH_FILES,
    PERMISSIONS.REPORT.VIEW,
    PERMISSIONS.AI.USE_ASSISTANT,
    PERMISSIONS.AI.VIEW_SUGGESTIONS,
  ],

  VIEWER: [
    PERMISSIONS.PROJECT.VIEW,
    PERMISSIONS.SPRINT.VIEW,
    PERMISSIONS.TASK.VIEW,
    PERMISSIONS.REPORT.VIEW,
  ],
};

export const RESOURCE_PERMISSIONS = {
  PROJECT: {
    OWNER: [
      ...Object.values(PERMISSIONS.PROJECT),
      ...Object.values(PERMISSIONS.SPRINT),
      ...Object.values(PERMISSIONS.TASK),
    ],
    ADMIN: [
      PERMISSIONS.PROJECT.VIEW,
      PERMISSIONS.PROJECT.UPDATE,
      PERMISSIONS.PROJECT.MANAGE_MEMBERS,
      ...Object.values(PERMISSIONS.SPRINT),
      ...Object.values(PERMISSIONS.TASK),
    ],
    MEMBER: [
      PERMISSIONS.PROJECT.VIEW,
      PERMISSIONS.SPRINT.VIEW,
      PERMISSIONS.TASK.VIEW,
      PERMISSIONS.TASK.CREATE,
      PERMISSIONS.TASK.UPDATE,
      PERMISSIONS.TASK.COMMENT,
    ],
    VIEWER: [
      PERMISSIONS.PROJECT.VIEW,
      PERMISSIONS.SPRINT.VIEW,
      PERMISSIONS.TASK.VIEW,
    ],
  },
};

export const PERMISSION_GROUPS = [
  {
    name: 'Project Management',
    permissions: Object.values(PERMISSIONS.PROJECT),
  },
  {
    name: 'Sprint Management',
    permissions: Object.values(PERMISSIONS.SPRINT),
  },
  {
    name: 'Task Management',
    permissions: Object.values(PERMISSIONS.TASK),
  },
  {
    name: 'User Management',
    permissions: Object.values(PERMISSIONS.USER),
  },
  {
    name: 'Administration',
    permissions: Object.values(PERMISSIONS.ADMIN),
  },
  {
    name: 'Reporting',
    permissions: Object.values(PERMISSIONS.REPORT),
  },
  {
    name: 'AI Assistant',
    permissions: Object.values(PERMISSIONS.AI),
  },
];
