/**
 * Notification related interfaces
 */

import { IUser } from './user.interface';

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  priority: NotificationPriority;
  channel: NotificationChannel[];
  actionUrl?: string;
  actionText?: string;
  icon?: string;
  color?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  // Task notifications
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_COMMENTED = 'TASK_COMMENTED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  TASK_OVERDUE = 'TASK_OVERDUE',
  TASK_BLOCKED = 'TASK_BLOCKED',
  TASK_UNBLOCKED = 'TASK_UNBLOCKED',
  
  // Sprint notifications
  SPRINT_STARTED = 'SPRINT_STARTED',
  SPRINT_COMPLETED = 'SPRINT_COMPLETED',
  SPRINT_UPDATED = 'SPRINT_UPDATED',
  SPRINT_DEADLINE_APPROACHING = 'SPRINT_DEADLINE_APPROACHING',
  
  // Project notifications
  PROJECT_INVITE = 'PROJECT_INVITE',
  PROJECT_MEMBER_ADDED = 'PROJECT_MEMBER_ADDED',
  PROJECT_MEMBER_REMOVED = 'PROJECT_MEMBER_REMOVED',
  PROJECT_ROLE_CHANGED = 'PROJECT_ROLE_CHANGED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_ARCHIVED = 'PROJECT_ARCHIVED',
  
  // Mention notifications
  MENTIONED_IN_COMMENT = 'MENTIONED_IN_COMMENT',
  MENTIONED_IN_TASK = 'MENTIONED_IN_TASK',
  MENTIONED_IN_DOCUMENT = 'MENTIONED_IN_DOCUMENT',
  
  // System notifications
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  
  // Account notifications
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  
  // AI notifications
  AI_SUGGESTION = 'AI_SUGGESTION',
  AI_ANALYSIS_COMPLETE = 'AI_ANALYSIS_COMPLETE',
  AI_AUTOMATION_TRIGGERED = 'AI_AUTOMATION_TRIGGERED',
  
  // Report notifications
  REPORT_GENERATED = 'REPORT_GENERATED',
  REPORT_SCHEDULED = 'REPORT_SCHEDULED',
  
  // Other
  CUSTOM = 'CUSTOM'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
  SLACK = 'SLACK',
  TEAMS = 'TEAMS',
  WEBHOOK = 'WEBHOOK'
}

export interface INotificationTemplate {
  id: string;
  type: NotificationType;
  name: string;
  subject?: string;
  template: string;
  variables: string[];
  channels: NotificationChannel[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationSettings {
  userId: string;
  channels: IChannelSettings;
  types: ITypeSettings;
  schedule: IScheduleSettings;
  doNotDisturb: IDoNotDisturbSettings;
}

export interface IChannelSettings {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
  slack: boolean;
  teams: boolean;
}

export interface ITypeSettings {
  [key: string]: {
    enabled: boolean;
    channels: NotificationChannel[];
    priority?: NotificationPriority;
  };
}

export interface IScheduleSettings {
  timezone: string;
  workingHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
    days: number[]; // 0-6 (Sunday-Saturday)
  };
  digest: {
    enabled: boolean;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    time: string; // HH:mm format
  };
}

export interface IDoNotDisturbSettings {
  enabled: boolean;
  start?: string; // HH:mm format
  end?: string; // HH:mm format
  allowUrgent: boolean;
}

export interface INotificationBatch {
  id: string;
  userId: string;
  notifications: INotification[];
  type: 'DIGEST' | 'BULK' | 'SCHEDULED';
  status: 'PENDING' | 'SENT' | 'FAILED';
  scheduledFor?: Date;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
}

export interface INotificationStats {
  userId: string;
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  byChannel: Record<NotificationChannel, number>;
  lastReadAt?: Date;
  period: {
    start: Date;
    end: Date;
  };
}
