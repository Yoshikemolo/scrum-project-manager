/**
 * Authentication and authorization interfaces
 */

import { IUser } from './user.interface';

export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: IUser;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
  marketingEmails?: boolean;
}

export interface IRegisterResponse {
  success: boolean;
  message: string;
  user?: IUser;
  requiresVerification?: boolean;
}

export interface IRefreshTokenRequest {
  refreshToken: string;
}

export interface IRefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface IPasswordResetRequest {
  email: string;
}

export interface IPasswordResetResponse {
  success: boolean;
  message: string;
}

export interface IPasswordResetConfirmRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IVerifyEmailRequest {
  token: string;
}

export interface IVerifyEmailResponse {
  success: boolean;
  message: string;
  user?: IUser;
}

export interface ITwoFactorSetupRequest {
  password: string;
}

export interface ITwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface ITwoFactorVerifyRequest {
  code: string;
  rememberDevice?: boolean;
}

export interface ITwoFactorVerifyResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
}

export interface ISession {
  id: string;
  userId: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface IAuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  loading: boolean;
  error: string | null;
  requiresTwoFactor: boolean;
  rememberMe: boolean;
}

export interface ITokenPayload {
  sub: string; // User ID
  email: string;
  roles: string[];
  permissions: string[];
  iat: number; // Issued at
  exp: number; // Expires at
  jti?: string; // JWT ID
  iss?: string; // Issuer
  aud?: string; // Audience
}

export interface IOAuthProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export interface IOAuthLoginRequest {
  provider: string;
  code?: string;
  state?: string;
  redirectUri?: string;
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
