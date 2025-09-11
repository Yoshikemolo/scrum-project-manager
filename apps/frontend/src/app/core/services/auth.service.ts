/**
 * Authentication service for managing user authentication state and operations.
 * Handles login, logout, token management, and authentication status.
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { Store } from '@ngrx/store';
import { Observable, BehaviorSubject, throwError, timer, of } from 'rxjs';
import { map, tap, catchError, switchMap, finalize } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

import {
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
  IRegisterResponse,
  IRefreshTokenRequest,
  IRefreshTokenResponse,
  IPasswordResetRequest,
  IPasswordResetResponse,
  IUser,
  ITokenPayload
} from '@scrum-pm/shared/interfaces';

import { environment } from '../../../environments/environment';
import * as AuthActions from '../../store/auth/auth.actions';
import { LocalStorageService } from './local-storage.service';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apollo = inject(Apollo);
  private readonly store = inject(Store);
  private readonly localStorage = inject(LocalStorageService);
  private readonly wsService = inject(WebSocketService);

  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = environment.auth.tokenKey;
  private readonly REFRESH_TOKEN_KEY = environment.auth.refreshTokenKey;

  // Reactive state using signals
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _currentUser = signal<IUser | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public computed signals
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed values
  readonly isAdmin = computed(() => {
    const user = this._currentUser();
    return user?.roles?.some(role => role.name === 'admin') ?? false;
  });

  readonly isManager = computed(() => {
    const user = this._currentUser();
    return user?.roles?.some(role => ['admin', 'manager'].includes(role.name)) ?? false;
  });

  // Token refresh timer
  private refreshTokenTimer?: any;

  constructor() {
    this.checkAuthStatus();
  }

  /**
   * Login user with email and password
   */
  login(request: ILoginRequest): Observable<ILoginResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<ILoginResponse>(`${this.API_URL}/login`, request).pipe(
      tap(response => {
        this.handleAuthenticationSuccess(response);
        this.store.dispatch(AuthActions.loginSuccess({ user: response.user, token: response.accessToken }));
      }),
      catchError(error => {
        this._error.set(error.error?.message || 'Login failed');
        this.store.dispatch(AuthActions.loginFailure({ error: error.error?.message }));
        return throwError(() => error);
      }),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Register new user
   */
  register(request: IRegisterRequest): Observable<IRegisterResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<IRegisterResponse>(`${this.API_URL}/register`, request).pipe(
      tap(response => {
        if (response.success && !response.requiresVerification) {
          // Auto-login if email verification is not required
          this.login({
            email: request.email,
            password: request.password
          }).subscribe();
        }
      }),
      catchError(error => {
        this._error.set(error.error?.message || 'Registration failed');
        return throwError(() => error);
      }),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    this._isLoading.set(true);

    // Call logout endpoint
    this.http.post(`${this.API_URL}/logout`, {}).pipe(
      catchError(() => of(null)) // Continue logout even if API call fails
    ).subscribe(() => {
      this.clearAuthentication();
      this.store.dispatch(AuthActions.logout());
      this.router.navigate(['/auth/login']);
      this._isLoading.set(false);
    });
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<IRefreshTokenResponse> {
    const refreshToken = this.localStorage.getItem(this.REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      this.clearAuthentication();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<IRefreshTokenResponse>(`${this.API_URL}/refresh`, {
      refreshToken
    }).pipe(
      tap(response => {
        this.localStorage.setItem(this.TOKEN_KEY, response.accessToken);
        this.localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
        this.scheduleTokenRefresh(response.accessToken);
      }),
      catchError(error => {
        this.clearAuthentication();
        this.router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Request password reset
   */
  requestPasswordReset(request: IPasswordResetRequest): Observable<IPasswordResetResponse> {
    return this.http.post<IPasswordResetResponse>(`${this.API_URL}/password-reset`, request);
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/password-reset/confirm`, {
      token,
      password,
      confirmPassword: password
    });
  }

  /**
   * Verify email with token
   */
  verifyEmail(token: string): Observable<any> {
    return this.http.post(`${this.API_URL}/verify-email`, { token });
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): Observable<IUser> {
    return this.http.get<IUser>(`${this.API_URL}/me`).pipe(
      tap(user => {
        this._currentUser.set(user);
        this.store.dispatch(AuthActions.loadUserSuccess({ user }));
      })
    );
  }

  /**
   * Update user profile
   */
  updateProfile(updates: Partial<IUser>): Observable<IUser> {
    return this.http.patch<IUser>(`${this.API_URL}/me`, updates).pipe(
      tap(user => {
        this._currentUser.set(user);
        this.store.dispatch(AuthActions.updateProfileSuccess({ user }));
      })
    );
  }

  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/change-password`, {
      currentPassword,
      newPassword,
      confirmPassword: newPassword
    });
  }

  /**
   * Check if user is authenticated
   */
  checkAuthStatus(): boolean {
    const token = this.localStorage.getItem(this.TOKEN_KEY);

    if (!token) {
      this._isAuthenticated.set(false);
      return false;
    }

    try {
      const payload = jwtDecode<ITokenPayload>(token);
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        // Try to refresh token
        this.refreshToken().subscribe({
          next: () => {
            this._isAuthenticated.set(true);
            this.getCurrentUser().subscribe();
          },
          error: () => {
            this._isAuthenticated.set(false);
          }
        });
      } else {
        this._isAuthenticated.set(true);
        this.scheduleTokenRefresh(token);
        this.getCurrentUser().subscribe();
        return true;
      }
    } catch (error) {
      this.clearAuthentication();
      return false;
    }

    return false;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get token payload
   */
  getTokenPayload(): ITokenPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      return jwtDecode<ITokenPayload>(token);
    } catch {
      return null;
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this._currentUser();
    return user?.roles?.some(r => r.name === role) ?? false;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(resource: string, action: string): boolean {
    const user = this._currentUser();
    if (!user) return false;

    return user.roles.some(role =>
      role.permissions.some(permission =>
        permission.resource === resource && permission.action === action
      )
    );
  }

  /**
   * Handle successful authentication
   */
  private handleAuthenticationSuccess(response: ILoginResponse): void {
    // Store tokens
    this.localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    this.localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);

    // Update state
    this._isAuthenticated.set(true);
    this._currentUser.set(response.user);
    this._error.set(null);

    // Schedule token refresh
    this.scheduleTokenRefresh(response.accessToken);

    // Connect WebSocket
    this.wsService.connect();

    // Reset Apollo cache
    this.apollo.client.resetStore();
  }

  /**
   * Clear authentication data
   */
  private clearAuthentication(): void {
    // Clear tokens
    this.localStorage.removeItem(this.TOKEN_KEY);
    this.localStorage.removeItem(this.REFRESH_TOKEN_KEY);

    // Clear state
    this._isAuthenticated.set(false);
    this._currentUser.set(null);

    // Cancel token refresh
    if (this.refreshTokenTimer) {
      clearTimeout(this.refreshTokenTimer);
    }

    // Disconnect WebSocket
    this.wsService.disconnect();

    // Clear Apollo cache
    this.apollo.client.clearStore();
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(token: string): void {
    try {
      const payload = jwtDecode<ITokenPayload>(token);
      const expiresIn = payload.exp * 1000 - Date.now();
      
      // Refresh token 5 minutes before expiry
      const refreshIn = Math.max(0, expiresIn - 5 * 60 * 1000);

      if (this.refreshTokenTimer) {
        clearTimeout(this.refreshTokenTimer);
      }

      this.refreshTokenTimer = setTimeout(() => {
        this.refreshToken().subscribe();
      }, refreshIn);
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  }
}
