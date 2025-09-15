/**
 * HTTP interceptor for caching GET requests.
 * Implements client-side caching with configurable TTL.
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

interface CacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
  ttl: number;
}

// Cache storage
const cache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Observable<HttpEvent<any>>>();

// Default cache configuration
const DEFAULT_TTL = environment.cacheDuration || 3600000; // 1 hour
const CACHE_ENDPOINTS = [
  '/api/users/me',
  '/api/projects',
  '/api/settings',
  '/api/translations'
];

export const cacheInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }
  
  // Check if endpoint should be cached
  const shouldCache = CACHE_ENDPOINTS.some(endpoint => req.url.includes(endpoint));
  
  if (!shouldCache) {
    return next(req);
  }
  
  // Check for cache control headers
  const cacheControl = req.headers.get('Cache-Control');
  if (cacheControl === 'no-cache' || cacheControl === 'no-store') {
    return next(req);
  }
  
  const cacheKey = getCacheKey(req);
  
  // Check if request is already pending
  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    return pending;
  }
  
  // Check cache
  const cached = getFromCache(cacheKey);
  if (cached) {
    return of(cached);
  }
  
  // Make request and cache response
  const request$ = next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        const ttl = getCacheTTL(req);
        saveToCache(cacheKey, event, ttl);
        pendingRequests.delete(cacheKey);
      }
    }),
    shareReplay(1)
  );
  
  pendingRequests.set(cacheKey, request$);
  
  return request$;
};

/**
 * Generate cache key from request
 */
function getCacheKey(req: HttpRequest<any>): string {
  const params = req.params.keys()
    .sort()
    .map(key => `${key}=${req.params.get(key)}`)
    .join('&');
  
  return `${req.method}:${req.urlWithParams}:${params}`;
}

/**
 * Get response from cache
 */
function getFromCache(key: string): HttpResponse<any> | null {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  const age = Date.now() - entry.timestamp;
  
  if (age > entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.response.clone();
}

/**
 * Save response to cache
 */
function saveToCache(key: string, response: HttpResponse<any>, ttl: number): void {
  cache.set(key, {
    response: response.clone(),
    timestamp: Date.now(),
    ttl
  });
  
  // Limit cache size
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

/**
 * Get cache TTL from request headers or use default
 */
function getCacheTTL(req: HttpRequest<any>): number {
  const cacheControl = req.headers.get('Cache-Control');
  
  if (cacheControl) {
    const maxAge = cacheControl.match(/max-age=(\d+)/);
    if (maxAge) {
      return parseInt(maxAge[1], 10) * 1000; // Convert to milliseconds
    }
  }
  
  return DEFAULT_TTL;
}

/**
 * Clear cache
 */
export function clearCache(): void {
  cache.clear();
  pendingRequests.clear();
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(pattern: string): void {
  const keys = Array.from(cache.keys());
  
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}
