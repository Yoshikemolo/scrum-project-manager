/**
 * Authentication effects.
 * Handles side effects for authentication actions.
 */

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import * as AuthActions from './auth.actions';
import { AuthService } from '../../core/services/auth.service';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ request }) =>
        this.authService.login(request).pipe(
          map(response =>
            AuthActions.loginSuccess({
              user: response.user,
              token: response.accessToken
            })
          ),
          catchError(error =>
            of(AuthActions.loginFailure({ error: error.error?.message || 'Login failed' }))
          )
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => {
          this.toastr.success('Welcome back!', 'Login Successful');
          this.router.navigate(['/dashboard']);
        })
      ),
    { dispatch: false }
  );

  loginFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginFailure),
        tap(({ error }) => {
          this.toastr.error(error, 'Login Failed');
        })
      ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ request }) =>
        this.authService.register(request).pipe(
          map(response =>
            AuthActions.registerSuccess({ message: response.message })
          ),
          catchError(error =>
            of(AuthActions.registerFailure({ error: error.error?.message || 'Registration failed' }))
          )
        )
      )
    )
  );

  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(({ message }) => {
          this.toastr.success(message, 'Registration Successful');
          this.router.navigate(['/auth/login']);
        })
      ),
    { dispatch: false }
  );

  registerFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerFailure),
        tap(({ error }) => {
          this.toastr.error(error, 'Registration Failed');
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          this.authService.logout();
          this.toastr.info('You have been logged out', 'Goodbye');
          this.router.navigate(['/auth/login']);
        }),
        map(() => AuthActions.logoutSuccess())
      )
  );

  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUser),
      exhaustMap(() =>
        this.authService.getCurrentUser().pipe(
          map(user => AuthActions.loadUserSuccess({ user })),
          catchError(error =>
            of(AuthActions.loadUserFailure({ error: error.error?.message || 'Failed to load user' }))
          )
        )
      )
    )
  );

  updateProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.updateProfile),
      exhaustMap(({ updates }) =>
        this.authService.updateProfile(updates).pipe(
          map(user => AuthActions.updateProfileSuccess({ user })),
          catchError(error =>
            of(AuthActions.updateProfileFailure({ error: error.error?.message || 'Failed to update profile' }))
          )
        )
      )
    )
  );

  updateProfileSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.updateProfileSuccess),
        tap(() => {
          this.toastr.success('Your profile has been updated', 'Profile Updated');
        })
      ),
    { dispatch: false }
  );

  requestPasswordReset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.requestPasswordReset),
      exhaustMap(({ email }) =>
        this.authService.requestPasswordReset({ email }).pipe(
          map(response =>
            AuthActions.requestPasswordResetSuccess({ message: response.message })
          ),
          catchError(error =>
            of(AuthActions.requestPasswordResetFailure({ 
              error: error.error?.message || 'Failed to request password reset' 
            }))
          )
        )
      )
    )
  );

  requestPasswordResetSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.requestPasswordResetSuccess),
        tap(({ message }) => {
          this.toastr.success(message, 'Password Reset');
          this.router.navigate(['/auth/login']);
        })
      ),
    { dispatch: false }
  );

  resetPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.resetPassword),
      exhaustMap(({ token, password }) =>
        this.authService.resetPassword(token, password).pipe(
          map(() =>
            AuthActions.resetPasswordSuccess({ message: 'Password has been reset successfully' })
          ),
          catchError(error =>
            of(AuthActions.resetPasswordFailure({ 
              error: error.error?.message || 'Failed to reset password' 
            }))
          )
        )
      )
    )
  );

  resetPasswordSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.resetPasswordSuccess),
        tap(({ message }) => {
          this.toastr.success(message, 'Password Reset');
          this.router.navigate(['/auth/login']);
        })
      ),
    { dispatch: false }
  );

  verifyEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.verifyEmail),
      exhaustMap(({ token }) =>
        this.authService.verifyEmail(token).pipe(
          map(response =>
            AuthActions.verifyEmailSuccess({ user: response.user })
          ),
          catchError(error =>
            of(AuthActions.verifyEmailFailure({ 
              error: error.error?.message || 'Failed to verify email' 
            }))
          )
        )
      )
    )
  );

  verifyEmailSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.verifyEmailSuccess),
        tap(() => {
          this.toastr.success('Your email has been verified', 'Email Verified');
          this.router.navigate(['/dashboard']);
        })
      ),
    { dispatch: false }
  );

  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      exhaustMap(() =>
        this.authService.refreshToken().pipe(
          map(response =>
            AuthActions.refreshTokenSuccess({ token: response.accessToken })
          ),
          catchError(error =>
            of(AuthActions.refreshTokenFailure({ 
              error: error.error?.message || 'Session expired' 
            }))
          )
        )
      )
    )
  );

  refreshTokenFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.refreshTokenFailure),
        tap(() => {
          this.toastr.warning('Your session has expired. Please login again.', 'Session Expired');
          this.router.navigate(['/auth/login']);
        }),
        map(() => AuthActions.clearAuthState())
      )
  );
}
