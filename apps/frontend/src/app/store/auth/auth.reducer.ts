/**
 * Authentication reducer.
 * Manages the authentication state of the application.
 */

import { createReducer, on } from '@ngrx/store';
import { IUser } from '@scrum-pm/shared/interfaces';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  message: string | null;
}

export const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  message: null
};

export const authReducer = createReducer(
  initialState,
  
  // Login
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isAuthenticated: true,
    loading: false,
    error: null
  })),
  
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false
  })),
  
  // Register
  on(AuthActions.register, (state) => ({
    ...state,
    loading: true,
    error: null,
    message: null
  })),
  
  on(AuthActions.registerSuccess, (state, { message }) => ({
    ...state,
    loading: false,
    message,
    error: null
  })),
  
  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Logout
  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true
  })),
  
  on(AuthActions.logoutSuccess, () => initialState),
  
  on(AuthActions.logoutFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Load user
  on(AuthActions.loadUser, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.loadUserSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null
  })),
  
  on(AuthActions.loadUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Update profile
  on(AuthActions.updateProfile, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.updateProfileSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null
  })),
  
  on(AuthActions.updateProfileFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Refresh token
  on(AuthActions.refreshToken, (state) => ({
    ...state,
    loading: true
  })),
  
  on(AuthActions.refreshTokenSuccess, (state, { token }) => ({
    ...state,
    token,
    loading: false,
    error: null
  })),
  
  on(AuthActions.refreshTokenFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false
  })),
  
  // Password reset
  on(AuthActions.requestPasswordReset, (state) => ({
    ...state,
    loading: true,
    error: null,
    message: null
  })),
  
  on(AuthActions.requestPasswordResetSuccess, (state, { message }) => ({
    ...state,
    loading: false,
    message,
    error: null
  })),
  
  on(AuthActions.requestPasswordResetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  on(AuthActions.resetPassword, (state) => ({
    ...state,
    loading: true,
    error: null,
    message: null
  })),
  
  on(AuthActions.resetPasswordSuccess, (state, { message }) => ({
    ...state,
    loading: false,
    message,
    error: null
  })),
  
  on(AuthActions.resetPasswordFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Email verification
  on(AuthActions.verifyEmail, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.verifyEmailSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null
  })),
  
  on(AuthActions.verifyEmailFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Session
  on(AuthActions.checkSession, (state) => ({
    ...state,
    loading: true
  })),
  
  on(AuthActions.sessionValid, (state) => ({
    ...state,
    loading: false,
    isAuthenticated: true
  })),
  
  on(AuthActions.sessionExpired, (state) => ({
    ...state,
    loading: false,
    isAuthenticated: false,
    user: null,
    token: null
  })),
  
  // Clear state
  on(AuthActions.clearAuthState, () => initialState)
);
