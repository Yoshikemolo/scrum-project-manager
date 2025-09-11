/**
 * HTTP interceptor for handling API errors globally.
 * Displays error messages and handles different error scenarios.
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const toastr = inject(ToastrService);
  const router = inject(Router);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Unable to connect to server. Please check your internet connection.';
            break;
          
          case 400:
            errorMessage = error.error?.message || 'Bad request. Please check your input.';
            break;
          
          case 401:
            errorMessage = 'Authentication required. Please login.';
            // Handled by auth interceptor
            break;
          
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;
          
          case 404:
            errorMessage = error.error?.message || 'The requested resource was not found.';
            break;
          
          case 409:
            errorMessage = error.error?.message || 'A conflict occurred. The resource may already exist.';
            break;
          
          case 422:
            errorMessage = handleValidationErrors(error.error);
            break;
          
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            router.navigate(['/error/500']);
            break;
          
          case 502:
            errorMessage = 'Bad gateway. The server is temporarily unavailable.';
            break;
          
          case 503:
            errorMessage = 'Service unavailable. Please try again later.';
            router.navigate(['/error/503']);
            break;
          
          case 504:
            errorMessage = 'Gateway timeout. The server took too long to respond.';
            break;
          
          default:
            errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
        }
      }
      
      // Show error message (except for 401 which is handled by auth interceptor)
      if (error.status !== 401) {
        toastr.error(errorMessage, 'Error', {
          timeOut: 5000,
          progressBar: true,
          closeButton: true
        });
      }
      
      // Log error to console in development
      if (!environment.production) {
        console.error('HTTP Error:', {
          url: req.url,
          method: req.method,
          status: error.status,
          message: errorMessage,
          error: error.error
        });
      }
      
      return throwError(() => error);
    })
  );
};

/**
 * Handle validation errors from API
 */
function handleValidationErrors(error: any): string {
  if (error?.errors && Array.isArray(error.errors)) {
    const messages = error.errors.map((err: any) => {
      if (typeof err === 'string') {
        return err;
      }
      return err.message || err.msg || 'Validation error';
    });
    
    return messages.join('. ');
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'Validation failed. Please check your input.';
}

// Import environment
import { environment } from '../../../environments/environment';
