export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: IAuthUser;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface IRegisterResponse {
  success: boolean;
  message: string;
  user?: IAuthUser;
  verificationRequired: boolean;
}

export interface IAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface ITokenPayload {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
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

export interface IPasswordChangeRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IEmailVerificationRequest {
  token: string;
}

export interface IEmailVerificationResponse {
  success: boolean;
  message: string;
  user?: IAuthUser;
}
