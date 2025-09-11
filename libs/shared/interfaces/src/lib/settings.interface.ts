/**
 * Settings related interfaces
 */

export interface IAppSettings {
  general: IGeneralSettings;
  display: IDisplaySettings;
  notifications: INotificationSettings;
  security: ISecuritySettings;
  integrations: IIntegrationSettings;
  advanced: IAdvancedSettings;
}

export interface IGeneralSettings {
  appName: string;
  appUrl: string;
  logoUrl: string;
  faviconUrl: string;
  supportEmail: string;
  defaultLanguage: string;
  availableLanguages: string[];
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: number; // 0 = Sunday, 1 = Monday
  workingDays: number[];
  workingHours: {
    start: string;
    end: string;
  };
}

export interface IDisplaySettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  density: 'compact' | 'comfortable' | 'spacious';
  animations: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  colorBlindMode?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  sidebarPosition: 'left' | 'right';
  sidebarCollapsed: boolean;
  showFooter: boolean;
}

export interface INotificationSettings {
  enableNotifications: boolean;
  enableSounds: boolean;
  enableVibration: boolean;
  enableDesktopNotifications: boolean;
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  emailDigest: 'none' | 'daily' | 'weekly' | 'monthly';
  digestTime: string; // HH:mm format
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  notificationTypes: {
    [key: string]: {
      enabled: boolean;
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
}

export interface ISecuritySettings {
  requireTwoFactor: boolean;
  sessionTimeout: number; // minutes
  passwordPolicy: IPasswordPolicy;
  allowedIpAddresses: string[];
  blockedIpAddresses: string[];
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  requireEmailVerification: boolean;
  allowPasswordReset: boolean;
  allowRegistration: boolean;
  registrationDomains: string[];
  auditLogging: boolean;
  dataRetention: number; // days
}

export interface IPasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number; // number of previous passwords
  expirationDays: number;
  requireChangeOnFirstLogin: boolean;
}

export interface IIntegrationSettings {
  slack: ISlackIntegration;
  teams: ITeamsIntegration;
  jira: IJiraIntegration;
  github: IGithubIntegration;
  gitlab: IGitlabIntegration;
  google: IGoogleIntegration;
  azure: IAzureIntegration;
  custom: ICustomIntegration[];
}

export interface ISlackIntegration {
  enabled: boolean;
  workspaceId: string;
  channelId: string;
  webhookUrl: string;
  botToken: string;
  notifications: string[];
}

export interface ITeamsIntegration {
  enabled: boolean;
  tenantId: string;
  channelId: string;
  webhookUrl: string;
  notifications: string[];
}

export interface IJiraIntegration {
  enabled: boolean;
  url: string;
  username: string;
  apiToken: string;
  projectKey: string;
  syncTasks: boolean;
  syncComments: boolean;
  fieldMapping: Record<string, string>;
}

export interface IGithubIntegration {
  enabled: boolean;
  organization: string;
  repository: string;
  token: string;
  syncIssues: boolean;
  syncPullRequests: boolean;
  webhookSecret: string;
}

export interface IGitlabIntegration {
  enabled: boolean;
  url: string;
  projectId: string;
  token: string;
  syncIssues: boolean;
  syncMergeRequests: boolean;
  webhookSecret: string;
}

export interface IGoogleIntegration {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  syncCalendar: boolean;
  syncDrive: boolean;
}

export interface IAzureIntegration {
  enabled: boolean;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface ICustomIntegration {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'oauth';
  config: Record<string, any>;
  enabled: boolean;
}

export interface IAdvancedSettings {
  debug: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  performanceMonitoring: boolean;
  errorReporting: boolean;
  analytics: boolean;
  telemetry: boolean;
  experimental: {
    [key: string]: boolean;
  };
  customCss: string;
  customJs: string;
  apiRateLimit: number;
  maxUploadSize: number; // bytes
  allowedFileTypes: string[];
  maintenanceMode: {
    enabled: boolean;
    message: string;
    allowedIps: string[];
  };
}

export interface IOrganizationSettings {
  name: string;
  domain: string;
  logo: string;
  primaryColor: string;
  billing: IBillingSettings;
  limits: ILimits;
  features: IFeatures;
}

export interface IBillingSettings {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  paymentMethod?: IPaymentMethod;
  billingAddress?: IBillingAddress;
  nextBillingDate?: Date;
  amount?: number;
  currency?: string;
}

export interface IPaymentMethod {
  type: 'card' | 'paypal' | 'bank';
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;
}

export interface IBillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ILimits {
  maxUsers: number;
  maxProjects: number;
  maxStorage: number; // bytes
  maxApiCalls: number;
  maxExports: number;
}

export interface IFeatures {
  aiAssistant: boolean;
  advancedReporting: boolean;
  customFields: boolean;
  automations: boolean;
  integrations: boolean;
  sso: boolean;
  audit: boolean;
  backup: boolean;
}
