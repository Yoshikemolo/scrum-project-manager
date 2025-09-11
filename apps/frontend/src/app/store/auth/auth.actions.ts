/**
 * Authentication store actions.
 * Defines all actions related to authentication state management.
 */

import { createAction, props } from '@ngrx/store';
import { IUser, ILoginRequest, IRegisterRequest } from '@scrum-pm/shared/interfaces';

// Login actions
export const login = createAction(
  '[Auth] Login',
  props<{ request: ILoginRequest }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: IUser; token: string }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// Register actions
export const register = createAction(
  '[Auth] Register',
  props<{ request: IRegisterRequest }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ message: string }>()
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>()
);

// Logout actions
export const logout = createAction('[Auth] Logout');

export const logoutSuccess = createAction('[Auth] Logout Success');

export const logoutFailure = createAction(
  '[Auth] Logout Failure',
  props<{ error: string }>()
);

// Load user actions
export const loadUser = createAction('[Auth] Load User');

export const loadUserSuccess = createAction(
  '[Auth] Load User Success',
  props<{ user: IUser }>()
);

export const loadUserFailure = createAction(
  '[Auth] Load User Failure',
  props<{ error: string }>()
);

// Update profile actions
export const updateProfile = createAction(
  '[Auth] Update Profile',
  props<{ updates: Partial<IUser> }>()
);

export const updateProfileSuccess = createAction(
  '[Auth] Update Profile Success',
  props<{ user: IUser }>()
);

export const updateProfileFailure = createAction(
  '[Auth] Update Profile Failure',
  props<{ error: string }>()
);

// Token actions
export const refreshToken = createAction('[Auth] Refresh Token');

export const refreshTokenSuccess = createAction(
  '[Auth] Refresh Token Success',
  props<{ token: string }>()
);

export const refreshTokenFailure = createAction(
  '[Auth] Refresh Token Failure',
  props<{ error: string }>()
);

// Password reset actions
export const requestPasswordReset = createAction(
  '[Auth] Request Password Reset',
  props<{ email: string }>()
);

export const requestPasswordResetSuccess = createAction(
  '[Auth] Request Password Reset Success',
  props<{ message: string }>()
);

export const requestPasswordResetFailure = createAction(
  '[Auth] Request Password Reset Failure',
  props<{ error: string }>()
);

export const resetPassword = createAction(
  '[Auth] Reset Password',
  props<{ token: string; password: string }>()
);

export const resetPasswordSuccess = createAction(
  '[Auth] Reset Password Success',
  props<{ message: string }>()
);

export const resetPasswordFailure = createAction(
  '[Auth] Reset Password Failure',
  props<{ error: string }>()
);

// Email verification actions
export const verifyEmail = createAction(
  '[Auth] Verify Email',
  props<{ token: string }>()
);

export const verifyEmailSuccess = createAction(
  '[Auth] Verify Email Success',
  props<{ user: IUser }>()
);

export const verifyEmailFailure = createAction(
  '[Auth] Verify Email Failure',
  props<{ error: string }>()
);

// Session actions
export const checkSession = createAction('[Auth] Check Session');

export const sessionValid = createAction('[Auth] Session Valid');

export const sessionExpired = createAction('[Auth] Session Expired');

// Clear auth state
export const clearAuthState = createAction('[Auth] Clear State');
