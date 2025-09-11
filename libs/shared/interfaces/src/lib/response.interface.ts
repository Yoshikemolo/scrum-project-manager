export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: Date;
  path?: string;
  version?: string;
}

export interface IErrorResponse {
  success: false;
  error: IError;
  timestamp: Date;
  path?: string;
}

export interface IError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
  validationErrors?: IValidationError[];
}

export interface IValidationError {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}

export interface ISuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: Date;
}

export interface IListResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface IDeleteResponse {
  success: boolean;
  deletedCount: number;
  message?: string;
}

export interface IBatchResponse<T = any> {
  success: boolean;
  succeeded: T[];
  failed: IBatchFailure[];
  total: number;
  successCount: number;
  failureCount: number;
}

export interface IBatchFailure {
  item: any;
  error: IError;
  index: number;
}

export interface IFileUploadResponse {
  success: boolean;
  file: IUploadedFile;
  message?: string;
}

export interface IUploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface IHealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  version: string;
  uptime: number;
  timestamp: Date;
  services: IServiceHealth[];
}

export interface IServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  message?: string;
}

export interface IWebSocketMessage<T = any> {
  event: string;
  data: T;
  timestamp: Date;
  id?: string;
  userId?: string;
  roomId?: string;
}

export interface IStreamResponse<T = any> {
  chunk: T;
  index: number;
  isLast: boolean;
  timestamp: Date;
}

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

export interface IRateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}
