/**
 * HTTP interceptor for managing loading states during API calls.
 * Automatically shows/hides loader during HTTP requests.
 * 
 * @interceptor loadingInterceptor
 * @module Core/Interceptors
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { LoadingService } from '../services/loading.service';

/**
 * Endpoints that should not trigger the loading indicator
 * These are typically background requests or frequent polling endpoints
 */
const EXCLUDED_ENDPOINTS = [
  '/auth/refresh',        // Token refresh
  '/notifications/count', // Notification polling
  '/health',             // Health checks
  '/metrics',            // Metrics collection
  '.json',               // Translation files
  '/assets/',            // Static assets
  '/api/websocket'       // WebSocket connections
];

/**
 * HTTP methods that should not trigger loader by default
 */
const EXCLUDED_METHODS = [
  'HEAD',
  'OPTIONS'
];

/**
 * Loading interceptor function
 * Manages loading state for HTTP requests automatically
 */
export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const loadingService = inject(LoadingService);
  
  // Check if this request method should trigger loader
  const isExcludedMethod = EXCLUDED_METHODS.includes(req.method.toUpperCase());
  
  // Check if endpoint should trigger loader
  const isExcludedEndpoint = EXCLUDED_ENDPOINTS.some(endpoint => 
    req.url.includes(endpoint)
  );
  
  // Check for custom header to skip loader
  const skipLoader = req.headers.has('X-Skip-Loader');
  
  const shouldShowLoader = !isExcludedMethod && !isExcludedEndpoint && !skipLoader;
  
  if (shouldShowLoader) {
    // Use URL as key for tracking multiple simultaneous requests
    const loaderKey = `http-${req.method}-${req.urlWithParams}`;
    loadingService.startLoading(loaderKey);
    
    return next(req).pipe(
      finalize(() => {
        loadingService.stopLoading(loaderKey);
      })
    );
  }
  
  return next(req);
};
