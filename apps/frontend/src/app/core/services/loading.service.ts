/**
 * Global loading service for managing loading states across the application.
 * Provides methods to show/hide loading indicators with reference counting.
 * 
 * @service LoadingService
 * @module Core/Services
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { debounceTime, map, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly loadingSubject = new BehaviorSubject<number>(0);
  private readonly loadingMap = new Map<string, boolean>();
  
  /**
   * Observable that emits true when any loading operation is active
   * Debounced to prevent flickering on quick operations
   */
  readonly isLoading$: Observable<boolean> = this.loadingSubject.pipe(
    debounceTime(10), // Debounce to prevent flickering
    map(count => count > 0),
    distinctUntilChanged()
  );
  
  /**
   * Signal-compatible isLoading getter for Angular 16+ signals
   */
  readonly isLoading = () => this.loadingSubject.value > 0;
  
  /**
   * Observable that emits the current loading count
   * Useful for debugging and advanced loading state management
   */
  readonly loadingCount$: Observable<number> = this.loadingSubject.asObservable();
  
  /**
   * Show loading indicator
   * @param key - Optional unique key to track specific loading operations
   */
  show(key?: string): void {
    if (key) {
      this.loadingMap.set(key, true);
    }
    
    const currentCount = this.loadingSubject.value;
    this.loadingSubject.next(currentCount + 1);
  }
  
  /**
   * Start loading - alias for show()
   * @param key - Optional unique key to track specific loading operations
   */
  startLoading(key?: string): void {
    this.show(key);
  }
  
  /**
   * Hide loading indicator
   * @param key - Optional unique key to hide specific loading operation
   */
  hide(key?: string): void {
    if (key && this.loadingMap.has(key)) {
      this.loadingMap.delete(key);
    }
    
    const currentCount = this.loadingSubject.value;
    if (currentCount > 0) {
      this.loadingSubject.next(currentCount - 1);
    }
  }
  
  /**
   * Stop loading - alias for hide()
   * @param key - Optional unique key to hide specific loading operation
   */
  stopLoading(key?: string): void {
    this.hide(key);
  }
  
  /**
   * Show loader with automatic hide after delay
   * @param duration - Duration in milliseconds before auto-hide
   * @param key - Optional unique key to track specific loading operation
   */
  showWithTimeout(duration: number = 3000, key?: string): void {
    this.show(key);
    
    timer(duration).subscribe(() => {
      this.hide(key);
    });
  }
  
  /**
   * Reset all loaders
   * Clears all tracked loading operations and resets counter
   */
  reset(): void {
    this.loadingMap.clear();
    this.loadingSubject.next(0);
  }
  
  /**
   * Check if specific loader is active
   * @param key - Unique key of the loading operation
   * @returns True if the specific loader is active
   */
  isLoadingKey(key: string): boolean {
    return this.loadingMap.get(key) || false;
  }
  
  /**
   * Get all active loader keys
   * @returns Array of active loader keys
   */
  getActiveLoaders(): string[] {
    return Array.from(this.loadingMap.keys());
  }
  
  /**
   * Execute async function with loader
   * Automatically shows loader before execution and hides after completion
   * @param fn - Async function to execute
   * @param key - Optional unique key to track this operation
   * @returns Promise with the function result
   */
  async withLoader<T>(fn: () => Promise<T>, key?: string): Promise<T> {
    this.show(key);
    
    try {
      return await fn();
    } finally {
      this.hide(key);
    }
  }
  
  /**
   * Wrap observable with loader
   * Shows loader on subscription and hides on completion/error
   * @param observable - Observable to wrap
   * @param key - Optional unique key to track this operation
   * @returns Wrapped observable
   */
  wrapObservable<T>(observable: Observable<T>, key?: string): Observable<T> {
    return new Observable(observer => {
      this.show(key);
      
      const subscription = observable.subscribe({
        next: value => observer.next(value),
        error: error => {
          this.hide(key);
          observer.error(error);
        },
        complete: () => {
          this.hide(key);
          observer.complete();
        }
      });
      
      return () => {
        subscription.unsubscribe();
        this.hide(key);
      };
    });
  }
}
