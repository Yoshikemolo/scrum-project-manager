/**
 * User related interfaces
 */

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  avatar?: string;
  roles: IRole[];
  groups: IGroup[];
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  preferences?: IUserPreferences;
  metadata?: Record<string, any>;
}

export interface IRole {
  id: string;
  name: string;
  description?: string;
  permissions: IPermission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermission {
  id: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface IGroup {
  id: string;
  name: string;
  description?: string;
  members: IUser[];
  owner: IUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberFormat: string;
  notifications: INotificationPreferences;
  dashboard: IDashboardPreferences;
}

export interface INotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sound: boolean;
  vibration: boolean;
  types: {
    taskAssigned: boolean;
    taskUpdated: boolean;
    taskCompleted: boolean;
    sprintStarted: boolean;
    sprintCompleted: boolean;
    commentAdded: boolean;
    mentionedInComment: boolean;
    projectInvite: boolean;
  };
}

export interface IDashboardPreferences {
  widgets: string[];
  layout: 'grid' | 'list';
  defaultView: string;
  refreshInterval: number;
}

export interface IUserProfile extends IUser {
  bio?: string;
  title?: string;
  department?: string;
  location?: string;
  phone?: string;
  skills?: string[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
}

export interface IUserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
