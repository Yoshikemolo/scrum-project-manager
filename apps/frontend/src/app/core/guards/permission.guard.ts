/**
 * Permission-based access control guard.
 * Checks if user has specific permissions to access a route.
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);
  
  // Get required permissions from route data
  const requiredPermissions = route.data['permissions'] as Array<{
    resource: string;
    action: string;
  }>;
  
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  
  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }
  
  // Check if user has all required permissions
  const hasPermissions = requiredPermissions.every(permission =>
    authService.hasPermission(permission.resource, permission.action)
  );
  
  if (hasPermissions) {
    return true;
  }
  
  // Show error message and redirect
  toastr.error('You do not have the required permissions', 'Access Denied');
  router.navigate(['/dashboard']);
  return false;
};
