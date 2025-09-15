/**
 * Common shared interfaces
 */

export interface IPaginationRequest {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface IPaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: IApiError;
  timestamp: Date;
}

export interface IApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface IValidationError {
  field: string;
  message: string;
  value?: any;
  constraints?: string[];
}

export interface ISearchRequest {
  query: string;
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}

export interface ISearchResult<T> {
  items: T[];
  total: number;
  query: string;
  took: number; // milliseconds
  facets?: ISearchFacet[];
}

export interface ISearchFacet {
  field: string;
  values: IFacetValue[];
}

export interface IFacetValue {
  value: string;
  count: number;
  selected?: boolean;
}

export interface IFileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
  id?: string;
}

export interface IAuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: IChangeSet[];
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface IChangeSet {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface IHealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface ISystemStatus {
  status: 'operational' | 'degraded' | 'down';
  services: IHealthCheck[];
  uptime: number;
  version: string;
  timestamp: Date;
}

export interface IFeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  targetGroups?: string[];
  metadata?: Record<string, any>;
}

export interface IConfiguration {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  isSecret: boolean;
  isReadonly: boolean;
  category?: string;
  updatedAt: Date;
}

export interface IExport {
  id: string;
  type: 'CSV' | 'EXCEL' | 'PDF' | 'JSON';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  error?: string;
  progress?: number;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  createdAt: Date;
}

export interface IImport {
  id: string;
  type: 'CSV' | 'EXCEL' | 'JSON';
  status: 'pending' | 'validating' | 'processing' | 'completed' | 'failed';
  filename: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  errors?: IImportError[];
  mapping?: Record<string, string>;
  createdAt: Date;
  completedAt?: Date;
}

export interface IImportError {
  row: number;
  field?: string;
  value?: any;
  message: string;
}

export interface IWebhook {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  headers?: Record<string, string>;
  retryPolicy?: IRetryPolicy;
  lastTriggeredAt?: Date;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRetryPolicy {
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
}

export interface ICache {
  key: string;
  value: any;
  ttl?: number; // seconds
  tags?: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface IJob {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  data: Record<string, any>;
  result?: any;
  error?: string;
  progress?: number;
  attempts: number;
  maxAttempts: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface ITranslation {
  key: string;
  language: string;
  value: string;
  namespace?: string;
  pluralForm?: number;
  context?: string;
  updatedAt: Date;
}
