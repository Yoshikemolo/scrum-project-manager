/**
 * Keyboard shortcut service for managing global and context-specific shortcuts.
 * Provides a centralized way to register and handle keyboard shortcuts.
 */

import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { fromEvent, Subject, Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

export interface Shortcut {
  key: string;
  description?: string;
  callback: () => void;
  context?: string;
  preventDefault?: boolean;
  allowInInput?: boolean;
  global?: boolean;
}

interface NormalizedShortcut extends Shortcut {
  parts: string[];
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  key: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShortcutService {
  private readonly document = inject(DOCUMENT);
  private readonly shortcuts = new Map<string, NormalizedShortcut>();
  private readonly contextStack: string[] = ['global'];
  private readonly destroy$ = new Subject<void>();
  
  // Shortcut help visibility
  private readonly helpVisibleSubject = new Subject<boolean>();
  readonly helpVisible$ = this.helpVisibleSubject.asObservable();
  
  constructor() {
    this.initializeKeyboardListener();
    this.registerDefaultShortcuts();
  }
  
  /**
   * Initialize keyboard event listener
   */
  private initializeKeyboardListener(): void {
    fromEvent<KeyboardEvent>(this.document, 'keydown')
      .pipe(
        filter(event => !this.shouldIgnoreEvent(event)),
        takeUntil(this.destroy$)
      )
      .subscribe(event => this.handleKeyboardEvent(event));
  }
  
  /**
   * Register default application shortcuts
   */
  private registerDefaultShortcuts(): void {
    // Help
    this.add('shift+?', () => this.toggleHelp(), {
      description: 'Show keyboard shortcuts help',
      global: true
    });
    
    // Search
    this.add('ctrl+k', () => this.focusSearch(), {
      description: 'Focus search',
      global: true
    });
    
    // Navigation
    this.add('g h', () => this.navigate('/dashboard'), {
      description: 'Go to dashboard',
      global: true
    });
    
    this.add('g p', () => this.navigate('/projects'), {
      description: 'Go to projects',
      global: true
    });
    
    this.add('g t', () => this.navigate('/tasks'), {
      description: 'Go to tasks',
      global: true
    });
    
    this.add('g s', () => this.navigate('/sprints'), {
      description: 'Go to sprints',
      global: true
    });
    
    // Actions
    this.add('n', () => this.createNew(), {
      description: 'Create new item',
      context: 'list'
    });
    
    this.add('e', () => this.edit(), {
      description: 'Edit selected item',
      context: 'detail'
    });
    
    this.add('delete', () => this.delete(), {
      description: 'Delete selected item',
      context: 'detail'
    });
    
    this.add('escape', () => this.escape(), {
      description: 'Close dialog/Cancel action',
      global: true
    });
  }
  
  /**
   * Add a keyboard shortcut
   */
  add(key: string, callback: () => void, options?: Partial<Shortcut>): void {
    const shortcut: Shortcut = {
      key,
      callback,
      ...options
    };
    
    const normalized = this.normalizeShortcut(shortcut);
    const id = this.getShortcutId(normalized);
    
    this.shortcuts.set(id, normalized);
  }
  
  /**
   * Remove a keyboard shortcut
   */
  remove(key: string, context?: string): void {
    const parts = this.parseShortcut(key);
    const id = `${context || 'global'}:${parts.join('+')}`;
    this.shortcuts.delete(id);
  }
  
  /**
   * Push a new context to the stack
   */
  pushContext(context: string): void {
    this.contextStack.push(context);
  }
  
  /**
   * Pop the current context from the stack
   */
  popContext(): void {
    if (this.contextStack.length > 1) {
      this.contextStack.pop();
    }
  }
  
  /**
   * Get current context
   */
  getCurrentContext(): string {
    return this.contextStack[this.contextStack.length - 1] || 'global';
  }
  
  /**
   * Get all registered shortcuts
   */
  getShortcuts(context?: string): Shortcut[] {
    const shortcuts: Shortcut[] = [];
    
    this.shortcuts.forEach((shortcut, id) => {
      if (!context || shortcut.context === context || shortcut.global) {
        shortcuts.push(shortcut);
      }
    });
    
    return shortcuts;
  }
  
  /**
   * Handle keyboard event
   */
  private handleKeyboardEvent(event: KeyboardEvent): void {
    const currentContext = this.getCurrentContext();
    
    // Check context-specific shortcuts first
    const contextShortcut = this.findMatchingShortcut(event, currentContext);
    if (contextShortcut) {
      if (contextShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      contextShortcut.callback();
      return;
    }
    
    // Check global shortcuts
    const globalShortcut = this.findMatchingShortcut(event, 'global');
    if (globalShortcut && globalShortcut.global) {
      if (globalShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      globalShortcut.callback();
    }
  }
  
  /**
   * Find matching shortcut for keyboard event
   */
  private findMatchingShortcut(event: KeyboardEvent, context: string): NormalizedShortcut | undefined {
    const eventKey = this.getEventKey(event);
    const id = `${context}:${eventKey}`;
    
    return this.shortcuts.get(id);
  }
  
  /**
   * Get normalized key from keyboard event
   */
  private getEventKey(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    
    const key = event.key.toLowerCase();
    const normalizedKey = this.normalizeKey(key);
    parts.push(normalizedKey);
    
    return parts.join('+');
  }
  
  /**
   * Normalize shortcut definition
   */
  private normalizeShortcut(shortcut: Shortcut): NormalizedShortcut {
    const parts = this.parseShortcut(shortcut.key);
    
    return {
      ...shortcut,
      parts,
      ctrl: parts.includes('ctrl') || parts.includes('cmd'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      meta: parts.includes('meta'),
      key: parts[parts.length - 1]
    };
  }
  
  /**
   * Parse shortcut string into parts
   */
  private parseShortcut(shortcut: string): string[] {
    return shortcut
      .toLowerCase()
      .replace(/\s+/g, '')
      .split(/[+\-]/)
      .map(part => {
        if (part === 'cmd') return 'ctrl';
        return part;
      })
      .sort((a, b) => {
        // Order: ctrl, alt, shift, key
        const order = ['ctrl', 'alt', 'shift'];
        const aIndex = order.indexOf(a);
        const bIndex = order.indexOf(b);
        
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return aIndex - bIndex;
      });
  }
  
  /**
   * Get shortcut ID
   */
  private getShortcutId(shortcut: NormalizedShortcut): string {
    const context = shortcut.context || 'global';
    return `${context}:${shortcut.parts.join('+')}`;
  }
  
  /**
   * Normalize key name
   */
  private normalizeKey(key: string): string {
    const keyMap: Record<string, string> = {
      ' ': 'space',
      'arrowup': 'up',
      'arrowdown': 'down',
      'arrowleft': 'left',
      'arrowright': 'right',
      'escape': 'esc',
      'return': 'enter',
      'delete': 'del',
      'backspace': 'back'
    };
    
    return keyMap[key] || key;
  }
  
  /**
   * Check if event should be ignored
   */
  private shouldIgnoreEvent(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    
    // Ignore if in input field (unless allowed)
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    const isContentEditable = target.contentEditable === 'true';
    
    return isInput || isContentEditable;
  }
  
  /**
   * Toggle help dialog
   */
  private toggleHelp(): void {
    this.helpVisibleSubject.next(true);
  }
  
  /**
   * Focus search
   */
  private focusSearch(): void {
    const searchInput = this.document.querySelector('#global-search') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }
  
  /**
   * Navigate to route
   */
  private navigate(path: string): void {
    // This would be injected from a component
    console.log('Navigate to:', path);
  }
  
  /**
   * Create new item
   */
  private createNew(): void {
    console.log('Create new item');
  }
  
  /**
   * Edit selected item
   */
  private edit(): void {
    console.log('Edit item');
  }
  
  /**
   * Delete selected item
   */
  private delete(): void {
    console.log('Delete item');
  }
  
  /**
   * Escape/cancel action
   */
  private escape(): void {
    console.log('Escape');
  }
  
  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
