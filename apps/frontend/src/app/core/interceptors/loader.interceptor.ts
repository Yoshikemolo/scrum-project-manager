/**
 * HTTP interceptor for managing loading states during API calls.
 * Automatically shows/hides loader during HTTP requests.
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { LoaderService } from '../services/loader.service';

// Endpoints that should not trigger loader
const EXCLUDED_ENDPOINTS = [
  '/auth/refresh',
  '/notifications/count',
  '/health',
  '/metrics',
  '.json' // Translation files
];

export const loaderInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const loaderService = inject(LoaderService);
  
  // Check if endpoint should trigger loader
  const shouldShowLoader = !EXCLUDED_ENDPOINTS.some(endpoint => 
    req.url.includes(endpoint)
  );
  
  if (shouldShowLoader) {
    // Use URL as key for tracking multiple simultaneous requests
    const loaderKey = `http-${req.method}-${req.urlWithParams}`;
    loaderService.show(loaderKey);
    
    return next(req).pipe(
      finalize(() => {
        loaderService.hide(loaderKey);
      })
    );
  }
  
  return next(req);
};
