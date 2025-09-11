/**
 * Authentication guard to protect routes that require authentication.
 * Redirects to login page if user is not authenticated.
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  // Store the attempted URL for redirecting after login
  const returnUrl = state.url;
  
  // Navigate to login with return URL
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl }
  });
  
  return false;
};
