/**
 * Global loader service for managing loading states across the application.
 * Provides methods to show/hide loading indicators with reference counting.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { debounceTime, map, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private readonly loadingSubject = new BehaviorSubject<number>(0);
  private readonly loadingMap = new Map<string, boolean>();
  
  /**
   * Observable that emits true when any loading operation is active
   */
  readonly loading$: Observable<boolean> = this.loadingSubject.pipe(
    debounceTime(10), // Debounce to prevent flickering
    map(count => count > 0),
    distinctUntilChanged()
  );
  
  /**
   * Observable that emits the current loading count
   */
  readonly loadingCount$: Observable<number> = this.loadingSubject.asObservable();
  
  /**
   * Show loader
   */
  show(key?: string): void {
    if (key) {
      this.loadingMap.set(key, true);
    }
    
    const currentCount = this.loadingSubject.value;
    this.loadingSubject.next(currentCount + 1);
  }
  
  /**
   * Hide loader
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
   * Show loader with automatic hide after delay
   */
  showWithTimeout(duration: number = 3000, key?: string): void {
    this.show(key);
    
    timer(duration).subscribe(() => {
      this.hide(key);
    });
  }
  
  /**
   * Reset all loaders
   */
  reset(): void {
    this.loadingMap.clear();
    this.loadingSubject.next(0);
  }
  
  /**
   * Check if specific loader is active
   */
  isLoading(key: string): boolean {
    return this.loadingMap.get(key) || false;
  }
  
  /**
   * Get all active loader keys
   */
  getActiveLoaders(): string[] {
    return Array.from(this.loadingMap.keys());
  }
  
  /**
   * Execute function with loader
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
   * Execute observable with loader
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
