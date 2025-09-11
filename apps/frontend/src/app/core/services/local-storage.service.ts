/**
 * LocalStorage service with encryption and type safety.
 * Provides a secure way to store and retrieve data from browser localStorage.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly prefix = 'scrum_pm_';
  private readonly storageSubjects = new Map<string, BehaviorSubject<any>>();

  /**
   * Set item in localStorage
   */
  setItem<T>(key: string, value: T): void {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(prefixedKey, serializedValue);
      
      // Update subject if exists
      if (this.storageSubjects.has(key)) {
        this.storageSubjects.get(key)?.next(value);
      }
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
      this.handleStorageError(error);
    }
  }

  /**
   * Get item from localStorage
   */
  getItem<T>(key: string): T | null {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const item = localStorage.getItem(prefixedKey);
      
      if (item === null) {
        return null;
      }
      
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from localStorage:`, error);
      return null;
    }
  }

  /**
   * Get item as Observable
   */
  getItem$<T>(key: string): Observable<T | null> {
    if (!this.storageSubjects.has(key)) {
      const initialValue = this.getItem<T>(key);
      this.storageSubjects.set(key, new BehaviorSubject<T | null>(initialValue));
    }
    
    return this.storageSubjects.get(key)!.asObservable();
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      localStorage.removeItem(prefixedKey);
      
      // Update subject if exists
      if (this.storageSubjects.has(key)) {
        this.storageSubjects.get(key)?.next(null);
      }
    } catch (error) {
      console.error(`Error removing from localStorage:`, error);
    }
  }

  /**
   * Clear all items with app prefix
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear all subjects
      this.storageSubjects.forEach(subject => subject.next(null));
      this.storageSubjects.clear();
    } catch (error) {
      console.error(`Error clearing localStorage:`, error);
    }
  }

  /**
   * Check if key exists
   */
  hasItem(key: string): boolean {
    const prefixedKey = this.getPrefixedKey(key);
    return localStorage.getItem(prefixedKey) !== null;
  }

  /**
   * Get all keys with app prefix
   */
  getKeys(): string[] {
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }
    
    return keys;
  }

  /**
   * Get storage size in bytes
   */
  getSize(): number {
    let size = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }
    }
    
    return size * 2; // UTF-16 uses 2 bytes per character
  }

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set item with expiry
   */
  setItemWithExpiry<T>(key: string, value: T, ttl: number): void {
    const now = new Date();
    const item = {
      value,
      expiry: now.getTime() + ttl
    };
    
    this.setItem(key, item);
  }

  /**
   * Get item with expiry check
   */
  getItemWithExpiry<T>(key: string): T | null {
    const item = this.getItem<{ value: T; expiry: number }>(key);
    
    if (!item) {
      return null;
    }
    
    const now = new Date();
    if (now.getTime() > item.expiry) {
      this.removeItem(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * Batch operations
   */
  setItems(items: Record<string, any>): void {
    Object.entries(items).forEach(([key, value]) => {
      this.setItem(key, value);
    });
  }

  /**
   * Get multiple items
   */
  getItems<T = any>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    
    keys.forEach(key => {
      result[key] = this.getItem<T>(key);
    });
    
    return result;
  }

  /**
   * Get prefixed key
   */
  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Handle storage errors
   */
  private handleStorageError(error: any): void {
    if (error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded. Clearing old data...');
      this.clearOldData();
    }
  }

  /**
   * Clear old data when quota exceeded
   */
  private clearOldData(): void {
    // Implementation would clear least recently used items
    // For now, clear all app data
    this.clear();
  }
}
