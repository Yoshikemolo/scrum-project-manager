export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface ISoftDelete {
  deletedAt?: Date;
  deletedBy?: string;
  deleteReason?: string;
}

export interface IAudit extends ITimestamps {
  createdBy: string;
  updatedBy?: string;
  version: number;
}

export interface IAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IContact {
  email: string;
  phone?: string;
  mobile?: string;
  fax?: string;
}

export interface IFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
  uploadedAt: Date;
}

export interface IImage extends IFile {
  width: number;
  height: number;
  thumbnailUrl?: string;
  alt?: string;
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  TASK_COMPLETED = 'task_completed',
  COMMENT_MENTION = 'comment_mention',
  PROJECT_INVITATION = 'project_invitation',
  SPRINT_STARTED = 'sprint_started',
  SPRINT_COMPLETED = 'sprint_completed',
}

export interface IActivity {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface IApiKey {
  id: string;
  name: string;
  key: string;
  userId: string;
  permissions: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  revokedAt?: Date;
}

export interface IWebhook {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  headers?: Record<string, string>;
  retryPolicy?: IRetryPolicy;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
}

export interface IRetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  maxBackoffSeconds: number;
}

export interface IHealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  responseTime: number;
  details?: Record<string, any>;
}

export interface IMetric {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp: Date;
}

export interface IFeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions?: IFeatureFlagCondition[];
  percentage?: number;
  userIds?: string[];
  groups?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeatureFlagCondition {
  attribute: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}
