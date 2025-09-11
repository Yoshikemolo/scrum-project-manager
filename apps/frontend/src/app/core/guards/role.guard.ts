/**
 * Role-based access control guard.
 * Checks if user has required roles to access a route.
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);
  
  // Get required roles from route data
  const requiredRoles = route.data['roles'] as string[];
  
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }
  
  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }
  
  // Check if user has any of the required roles
  const hasRole = requiredRoles.some(role => authService.hasRole(role));
  
  if (hasRole) {
    return true;
  }
  
  // Show error message and redirect
  toastr.error('You do not have permission to access this page', 'Access Denied');
  router.navigate(['/dashboard']);
  return false;
};
