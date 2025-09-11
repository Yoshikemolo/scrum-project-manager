export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  roles: IRole[];
  groups: IGroup[];
  preferences: IUserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface IRole {
  id: string;
  name: string;
  permissions: IPermission[];
  description?: string;
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
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: INotificationPreferences;
  displaySettings: IDisplaySettings;
}

export interface INotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  taskAssigned: boolean;
  taskCompleted: boolean;
  commentMention: boolean;
  projectUpdate: boolean;
}

export interface IDisplaySettings {
  compactView: boolean;
  showAvatars: boolean;
  animationsEnabled: boolean;
  sidebarCollapsed: boolean;
  kanbanColumns: string[];
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  PROJECT_OWNER = 'project_owner',
  TEAM_MEMBER = 'team_member',
  VIEWER = 'viewer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}
