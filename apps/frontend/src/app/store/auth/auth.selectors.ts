/**
 * Authentication selectors.
 * Provides memoized selectors for accessing authentication state.
 */

import { createSelector } from '@ngrx/store';
import { selectAuthState } from '../index';
import { AuthState } from './auth.reducer';

export const selectAuth = selectAuthState;

export const selectCurrentUser = createSelector(
  selectAuth,
  (state: AuthState) => state.user
);

export const selectIsAuthenticated = createSelector(
  selectAuth,
  (state: AuthState) => state.isAuthenticated
);

export const selectAuthToken = createSelector(
  selectAuth,
  (state: AuthState) => state.token
);

export const selectAuthLoading = createSelector(
  selectAuth,
  (state: AuthState) => state.loading
);

export const selectAuthError = createSelector(
  selectAuth,
  (state: AuthState) => state.error
);

export const selectAuthMessage = createSelector(
  selectAuth,
  (state: AuthState) => state.message
);

export const selectUserRoles = createSelector(
  selectCurrentUser,
  (user) => user?.roles || []
);

export const selectIsAdmin = createSelector(
  selectUserRoles,
  (roles) => roles.some(role => role.name === 'admin')
);

export const selectIsManager = createSelector(
  selectUserRoles,
  (roles) => roles.some(role => role.name === 'manager' || role.name === 'admin')
);

export const selectUserPermissions = createSelector(
  selectUserRoles,
  (roles) => {
    const permissions = new Set<string>();
    roles.forEach(role => {
      role.permissions.forEach(permission => {
        permissions.add(`${permission.resource}:${permission.action}`);
      });
    });
    return Array.from(permissions);
  }
);

export const selectHasPermission = (resource: string, action: string) =>
  createSelector(
    selectUserRoles,
    (roles) => roles.some(role =>
      role.permissions.some(permission =>
        permission.resource === resource && permission.action === action
      )
    )
  );

export const selectUserFullName = createSelector(
  selectCurrentUser,
  (user) => user ? `${user.firstName} ${user.lastName}` : ''
);

export const selectUserAvatar = createSelector(
  selectCurrentUser,
  (user) => user?.avatar || '/assets/images/default-avatar.png'
);

export const selectUserEmail = createSelector(
  selectCurrentUser,
  (user) => user?.email || ''
);

export const selectUserPreferences = createSelector(
  selectCurrentUser,
  (user) => user?.preferences || null
);
