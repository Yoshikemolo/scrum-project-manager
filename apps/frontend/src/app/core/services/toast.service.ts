/**
 * Toast notification service for displaying user feedback messages
 * Supports multiple severity levels, custom actions, and queue management
 */
import { Injectable, signal, computed } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/**
 * Toast severity levels for different message types
 */
export enum ToastSeverity {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Toast position options on the screen
 */
export enum ToastPosition {
  TOP_RIGHT = 'top-right',
  TOP_LEFT = 'top-left',
  TOP_CENTER = 'top-center',
  BOTTOM_RIGHT = 'bottom-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_CENTER = 'bottom-center'
}

/**
 * Toast action button configuration
 */
export interface ToastAction {
  label: string;
  action: () => void;
  color?: 'primary' | 'accent' | 'warn';
}

/**
 * Toast message configuration
 */
export interface ToastMessage {
  id?: string;
  title: string;
  message?: string;
  severity: ToastSeverity;
  duration?: number;
  closable?: boolean;
  actions?: ToastAction[];
  data?: any;
  icon?: string;
  position?: ToastPosition;
  timestamp?: Date;
}

/**
 * Internal toast representation with metadata
 */
export interface Toast extends ToastMessage {
  id: string;
  timestamp: Date;
  timeoutId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // Default configuration
  private readonly DEFAULT_DURATION = 5000;
  private readonly MAX_TOASTS = 5;
  
  // Toast management
  private toasts = signal<Toast[]>([]);
  private toastSubject = new Subject<Toast>();
  private toastDismissSubject = new Subject<string>();
  
  // Position configuration
  private position = signal<ToastPosition>(ToastPosition.TOP_RIGHT);
  
  // Computed signals for reactive state
  public readonly activeToasts = computed(() => this.toasts());
  public readonly toastCount = computed(() => this.toasts().length);
  public readonly hasToasts = computed(() => this.toasts().length > 0);
  public readonly currentPosition = computed(() => this.position());
  
  // Observable streams
  public readonly toast$ = this.toastSubject.asObservable();
  public readonly dismiss$ = this.toastDismissSubject.asObservable();

  constructor() {
    this.loadSettings();
  }

  /**
   * Load user preferences for toast settings
   */
  private loadSettings(): void {
    const savedPosition = localStorage.getItem('toast-position');
    if (savedPosition && Object.values(ToastPosition).includes(savedPosition as ToastPosition)) {
      this.position.set(savedPosition as ToastPosition);
    }
  }

  /**
   * Show a success toast
   */
  success(title: string, message?: string, options?: Partial<ToastMessage>): string {
    return this.show({
      ...options,
      title,
      message,
      severity: ToastSeverity.SUCCESS,
      icon: options?.icon || 'check_circle'
    });
  }

  /**
   * Show an error toast
   */
  error(title: string, message?: string, options?: Partial<ToastMessage>): string {
    return this.show({
      ...options,
      title,
      message,
      severity: ToastSeverity.ERROR,
      icon: options?.icon || 'error',
      duration: options?.duration || 0 // Errors don't auto-dismiss by default
    });
  }

  /**
   * Show a warning toast
   */
  warning(title: string, message?: string, options?: Partial<ToastMessage>): string {
    return this.show({
      ...options,
      title,
      message,
      severity: ToastSeverity.WARNING,
      icon: options?.icon || 'warning'
    });
  }

  /**
   * Show an info toast
   */
  info(title: string, message?: string, options?: Partial<ToastMessage>): string {
    return this.show({
      ...options,
      title,
      message,
      severity: ToastSeverity.INFO,
      icon: options?.icon || 'info'
    });
  }

  /**
   * Show a custom toast with full configuration
   */
  show(config: ToastMessage): string {
    const toast: Toast = {
      ...config,
      id: config.id || this.generateId(),
      timestamp: new Date(),
      closable: config.closable !== false,
      duration: config.duration !== undefined ? config.duration : this.DEFAULT_DURATION,
      position: config.position || this.position()
    };

    // Manage queue size
    const currentToasts = this.toasts();
    if (currentToasts.length >= this.MAX_TOASTS) {
      const oldestToast = currentToasts[0];
      this.dismiss(oldestToast.id);
    }

    // Add toast to queue
    this.toasts.update(toasts => [...toasts, toast]);
    this.toastSubject.next(toast);

    // Set auto-dismiss timeout if duration is specified
    if (toast.duration > 0) {
      const timeoutId = window.setTimeout(() => {
        this.dismiss(toast.id);
      }, toast.duration);
      
      toast.timeoutId = timeoutId;
    }

    return toast.id;
  }

  /**
   * Dismiss a specific toast
   */
  dismiss(id: string): void {
    const toast = this.toasts().find(t => t.id === id);
    if (toast) {
      // Clear timeout if exists
      if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
      }
      
      // Remove from queue
      this.toasts.update(toasts => toasts.filter(t => t.id !== id));
      this.toastDismissSubject.next(id);
    }
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    const currentToasts = this.toasts();
    currentToasts.forEach(toast => {
      if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
      }
    });
    
    this.toasts.set([]);
    this.toastDismissSubject.next('*');
  }

  /**
   * Dismiss toasts by severity
   */
  dismissBySeverity(severity: ToastSeverity): void {
    const toastsToRemove = this.toasts().filter(t => t.severity === severity);
    toastsToRemove.forEach(toast => this.dismiss(toast.id));
  }

  /**
   * Update toast position
   */
  setPosition(position: ToastPosition): void {
    this.position.set(position);
    localStorage.setItem('toast-position', position);
  }

  /**
   * Generate unique toast ID
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Show toast with undo action
   */
  showUndo(title: string, message: string, onUndo: () => void, duration = 8000): string {
    return this.show({
      title,
      message,
      severity: ToastSeverity.INFO,
      duration,
      actions: [
        {
          label: 'UNDO',
          action: () => {
            onUndo();
            this.dismissAll();
          },
          color: 'primary'
        }
      ]
    });
  }

  /**
   * Show confirmation toast
   */
  showConfirmation(title: string, message: string): string {
    return this.success(title, message, {
      icon: 'task_alt',
      duration: 3000
    });
  }

  /**
   * Show loading toast (doesn't auto-dismiss)
   */
  showLoading(title: string, message?: string): string {
    return this.info(title, message, {
      icon: 'hourglass_empty',
      duration: 0,
      closable: false
    });
  }

  /**
   * Update existing toast
   */
  update(id: string, updates: Partial<ToastMessage>): void {
    this.toasts.update(toasts => 
      toasts.map(toast => 
        toast.id === id 
          ? { ...toast, ...updates, id: toast.id, timestamp: toast.timestamp }
          : toast
      )
    );
  }
}
