/**
 * Notification Service
 * Manages system notifications, real-time updates, and notification preferences
 */
import { Injectable, signal, computed, effect } from '@angular/core';
import { Subject, Observable, BehaviorSubject, interval, fromEvent } from 'rxjs';
import { filter, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { WebSocketService } from './websocket.service';

/**
 * Notification types
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  MENTION = 'mention',
  TASK = 'task',
  COMMENT = 'comment',
  SYSTEM = 'system',
  UPDATE = 'update',
  REMINDER = 'reminder'
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Notification status
 */
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

/**
 * Notification action
 */
export interface NotificationAction {
  label: string;
  action: string;
  icon?: string;
  color?: string;
  data?: any;
}

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  timestamp: Date;
  icon?: string;
  avatar?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  actions?: NotificationAction[];
  data?: any;
  groupId?: string;
  tags?: string[];
  expiresAt?: Date;
  sound?: boolean;
  vibrate?: boolean;
  persistent?: boolean;
  autoClose?: number;
  url?: string;
  metadata?: Record<string, any>;
}

/**
 * Notification filter
 */
export interface NotificationFilter {
  types?: NotificationType[];
  priorities?: NotificationPriority[];
  statuses?: NotificationStatus[];
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  unreadOnly?: boolean;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  desktop: boolean;
  email: boolean;
  push: boolean;
  doNotDisturb: boolean;
  doNotDisturbStart?: string;
  doNotDisturbEnd?: string;
  groupByType: boolean;
  autoMarkAsRead: boolean;
  autoMarkAsReadDelay: number;
  types: Record<NotificationType, boolean>;
  priorities: Record<NotificationPriority, boolean>;
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // State management
  private notifications = signal<Notification[]>([]);
  private preferences = signal<NotificationPreferences>(this.getDefaultPreferences());
  private filter = signal<NotificationFilter>({});
  private selectedNotifications = signal<Set<string>>(new Set());
  private isLoading = signal<boolean>(false);
  private hasMore = signal<boolean>(true);
  private page = signal<number>(1);
  private readonly pageSize = 20;
  
  // Event subjects
  private notificationReceived$ = new Subject<Notification>();
  private notificationRead$ = new Subject<string>();
  private notificationDeleted$ = new Subject<string>();
  private actionClicked$ = new Subject<{ notification: Notification; action: NotificationAction }>();
  private destroy$ = new Subject<void>();
  
  // Computed values
  public readonly allNotifications = computed(() => this.notifications());
  public readonly filteredNotifications = computed(() => this.applyFilter(this.notifications(), this.filter()));
  public readonly unreadNotifications = computed(() => 
    this.notifications().filter(n => n.status === NotificationStatus.UNREAD)
  );
  public readonly unreadCount = computed(() => this.unreadNotifications().length);
  public readonly hasUnread = computed(() => this.unreadCount() > 0);
  public readonly selectedCount = computed(() => this.selectedNotifications().size);
  public readonly userPreferences = computed(() => this.preferences());
  public readonly isLoadingNotifications = computed(() => this.isLoading());
  public readonly hasMoreNotifications = computed(() => this.hasMore());
  
  // Statistics
  public readonly stats = computed<NotificationStats>(() => {
    const notifications = this.notifications();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => n.status === NotificationStatus.UNREAD).length,
      today: notifications.filter(n => n.timestamp >= today).length,
      thisWeek: notifications.filter(n => n.timestamp >= weekAgo).length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>
    };
    
    // Count by type
    Object.values(NotificationType).forEach(type => {
      stats.byType[type] = notifications.filter(n => n.type === type).length;
    });
    
    // Count by priority
    Object.values(NotificationPriority).forEach(priority => {
      stats.byPriority[priority] = notifications.filter(n => n.priority === priority).length;
    });
    
    return stats;
  });
  
  // Grouped notifications
  public readonly groupedNotifications = computed(() => {
    const notifications = this.filteredNotifications();
    const grouped = new Map<string, Notification[]>();
    
    if (this.preferences().groupByType) {
      notifications.forEach(notification => {
        const key = notification.groupId || notification.type;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(notification);
      });
    } else {
      grouped.set('all', notifications);
    }
    
    return grouped;
  });
  
  // Permission status
  private notificationPermission: NotificationPermission = 'default';
  
  constructor(private websocket: WebSocketService) {
    this.initializeService();
    this.setupWebSocketListeners();
    this.setupAutoMarkAsRead();
    this.checkNotificationPermission();
  }
  
  /**
   * Initialize service
   */
  private initializeService(): void {
    // Load saved preferences
    const savedPreferences = this.loadPreferences();
    if (savedPreferences) {
      this.preferences.set(savedPreferences);
    }
    
    // Load cached notifications
    const cachedNotifications = this.loadCachedNotifications();
    if (cachedNotifications) {
      this.notifications.set(cachedNotifications);
    }
    
    // Setup visibility change listener
    this.setupVisibilityListener();
    
    // Setup periodic cleanup
    this.setupPeriodicCleanup();
  }
  
  /**
   * Setup WebSocket listeners
   */
  private setupWebSocketListeners(): void {
    // Listen for new notifications
    this.websocket.on<Notification>('notification:new')
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        this.addNotification(notification);
      });
    
    // Listen for notification updates
    this.websocket.on<Notification>('notification:update')
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        this.updateNotification(notification);
      });
    
    // Listen for notification deletion
    this.websocket.on<string>('notification:delete')
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        this.removeNotification(id);
      });
  }
  
  /**
   * Add new notification
   */
  public addNotification(notification: Notification): void {
    // Check if notification should be shown
    if (!this.shouldShowNotification(notification)) {
      return;
    }
    
    // Add to notifications
    this.notifications.update(notifications => {
      const exists = notifications.some(n => n.id === notification.id);
      if (exists) {
        return notifications;
      }
      return [notification, ...notifications];
    });
    
    // Show desktop notification if enabled
    if (this.preferences().desktop && this.notificationPermission === 'granted') {
      this.showDesktopNotification(notification);
    }
    
    // Play sound if enabled
    if (this.preferences().sound && notification.sound !== false) {
      this.playNotificationSound(notification);
    }
    
    // Trigger vibration if enabled
    if (this.preferences().vibration && notification.vibrate !== false) {
      this.triggerVibration(notification);
    }
    
    // Emit event
    this.notificationReceived$.next(notification);
    
    // Auto-close if specified
    if (notification.autoClose && notification.autoClose > 0) {
      setTimeout(() => {
        this.markAsRead(notification.id);
      }, notification.autoClose);
    }
    
    // Save to cache
    this.saveCachedNotifications();
  }
  
  /**
   * Update notification
   */
  private updateNotification(notification: Notification): void {
    this.notifications.update(notifications =>
      notifications.map(n => n.id === notification.id ? notification : n)
    );
    this.saveCachedNotifications();
  }
  
  /**
   * Remove notification
   */
  private removeNotification(id: string): void {
    this.notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
    this.notificationDeleted$.next(id);
    this.saveCachedNotifications();
  }
  
  /**
   * Mark notification as read
   */
  public markAsRead(id: string): void {
    this.notifications.update(notifications =>
      notifications.map(n => 
        n.id === id ? { ...n, status: NotificationStatus.READ } : n
      )
    );
    this.notificationRead$.next(id);
    this.saveCachedNotifications();
    
    // Send to server
    this.websocket.emit('notification:read', { id });
  }
  
  /**
   * Mark multiple notifications as read
   */
  public markMultipleAsRead(ids: string[]): void {
    ids.forEach(id => this.markAsRead(id));
  }
  
  /**
   * Mark all as read
   */
  public markAllAsRead(): void {
    const unreadIds = this.unreadNotifications().map(n => n.id);
    this.markMultipleAsRead(unreadIds);
  }
  
  /**
   * Delete notification
   */
  public deleteNotification(id: string): void {
    this.removeNotification(id);
    this.websocket.emit('notification:delete', { id });
  }
  
  /**
   * Delete multiple notifications
   */
  public deleteMultiple(ids: string[]): void {
    ids.forEach(id => this.deleteNotification(id));
  }
  
  /**
   * Archive notification
   */
  public archiveNotification(id: string): void {
    this.notifications.update(notifications =>
      notifications.map(n => 
        n.id === id ? { ...n, status: NotificationStatus.ARCHIVED } : n
      )
    );
    this.saveCachedNotifications();
    this.websocket.emit('notification:archive', { id });
  }
  
  /**
   * Clear all notifications
   */
  public clearAll(): void {
    const ids = this.notifications().map(n => n.id);
    this.deleteMultiple(ids);
  }
  
  /**
   * Select notification
   */
  public selectNotification(id: string): void {
    this.selectedNotifications.update(selected => {
      const newSelected = new Set(selected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }
  
  /**
   * Select all notifications
   */
  public selectAll(): void {
    const allIds = this.filteredNotifications().map(n => n.id);
    this.selectedNotifications.set(new Set(allIds));
  }
  
  /**
   * Clear selection
   */
  public clearSelection(): void {
    this.selectedNotifications.set(new Set());
  }
  
  /**
   * Handle notification action
   */
  public handleAction(notification: Notification, action: NotificationAction): void {
    this.actionClicked$.next({ notification, action });
    
    // Mark as read
    if (notification.status === NotificationStatus.UNREAD) {
      this.markAsRead(notification.id);
    }
    
    // Handle predefined actions
    switch (action.action) {
      case 'dismiss':
        this.deleteNotification(notification.id);
        break;
      case 'archive':
        this.archiveNotification(notification.id);
        break;
      case 'open':
        if (notification.url) {
          window.open(notification.url, '_blank');
        }
        break;
    }
    
    // Send to server
    this.websocket.emit('notification:action', {
      notificationId: notification.id,
      action: action.action,
      data: action.data
    });
  }
  
  /**
   * Load more notifications
   */
  public async loadMore(): Promise<void> {
    if (this.isLoading() || !this.hasMore()) {
      return;
    }
    
    this.isLoading.set(true);
    
    try {
      // Simulate API call
      const response = await this.fetchNotifications(this.page(), this.pageSize);
      
      if (response.notifications.length > 0) {
        this.notifications.update(notifications => [
          ...notifications,
          ...response.notifications
        ]);
        this.page.update(p => p + 1);
        this.hasMore.set(response.hasMore);
      } else {
        this.hasMore.set(false);
      }
    } finally {
      this.isLoading.set(false);
    }
  }
  
  /**
   * Refresh notifications
   */
  public async refresh(): Promise<void> {
    this.page.set(1);
    this.hasMore.set(true);
    this.notifications.set([]);
    await this.loadMore();
  }
  
  /**
   * Update filter
   */
  public updateFilter(filter: NotificationFilter): void {
    this.filter.set(filter);
  }
  
  /**
   * Update preferences
   */
  public updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences.update(prefs => ({ ...prefs, ...preferences }));
    this.savePreferences();
  }
  
  /**
   * Request notification permission
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission();
      return this.notificationPermission;
    }
    return 'denied';
  }
  
  /**
   * Check if notification should be shown
   */
  private shouldShowNotification(notification: Notification): boolean {
    const prefs = this.preferences();
    
    // Check if notifications are enabled
    if (!prefs.enabled) {
      return false;
    }
    
    // Check do not disturb
    if (prefs.doNotDisturb) {
      if (prefs.doNotDisturbStart && prefs.doNotDisturbEnd) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startHour, startMinute] = prefs.doNotDisturbStart.split(':').map(Number);
        const [endHour, endMinute] = prefs.doNotDisturbEnd.split(':').map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        
        if (startTime <= endTime) {
          if (currentTime >= startTime && currentTime <= endTime) {
            return false;
          }
        } else {
          if (currentTime >= startTime || currentTime <= endTime) {
            return false;
          }
        }
      }
    }
    
    // Check type preference
    if (prefs.types[notification.type] === false) {
      return false;
    }
    
    // Check priority preference
    if (prefs.priorities[notification.priority] === false) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Show desktop notification
   */
  private showDesktopNotification(notification: Notification): void {
    if ('Notification' in window && this.notificationPermission === 'granted') {
      const options: NotificationOptions = {
        body: notification.message,
        icon: notification.icon || notification.avatar || '/assets/icons/notification.png',
        badge: '/assets/icons/badge.png',
        tag: notification.id,
        requireInteraction: notification.persistent,
        silent: !notification.sound,
        data: notification.data
      };
      
      const desktopNotification = new Notification(notification.title, options);
      
      desktopNotification.onclick = () => {
        window.focus();
        if (notification.url) {
          window.open(notification.url, '_blank');
        }
        this.markAsRead(notification.id);
        desktopNotification.close();
      };
      
      if (notification.autoClose && notification.autoClose > 0) {
        setTimeout(() => {
          desktopNotification.close();
        }, notification.autoClose);
      }
    }
  }
  
  /**
   * Play notification sound
   */
  private playNotificationSound(notification: Notification): void {
    const audio = new Audio('/assets/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.warn('Failed to play notification sound:', error);
    });
  }
  
  /**
   * Trigger vibration
   */
  private triggerVibration(notification: Notification): void {
    if ('vibrate' in navigator) {
      const pattern = notification.priority === NotificationPriority.URGENT ? [200, 100, 200] : [200];
      navigator.vibrate(pattern);
    }
  }
  
  /**
   * Apply filter to notifications
   */
  private applyFilter(notifications: Notification[], filter: NotificationFilter): Notification[] {
    let filtered = [...notifications];
    
    // Filter by types
    if (filter.types && filter.types.length > 0) {
      filtered = filtered.filter(n => filter.types!.includes(n.type));
    }
    
    // Filter by priorities
    if (filter.priorities && filter.priorities.length > 0) {
      filtered = filtered.filter(n => filter.priorities!.includes(n.priority));
    }
    
    // Filter by statuses
    if (filter.statuses && filter.statuses.length > 0) {
      filtered = filtered.filter(n => filter.statuses!.includes(n.status));
    }
    
    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(n => 
        n.tags && n.tags.some(tag => filter.tags!.includes(tag))
      );
    }
    
    // Filter by date range
    if (filter.dateFrom) {
      filtered = filtered.filter(n => n.timestamp >= filter.dateFrom!);
    }
    if (filter.dateTo) {
      filtered = filtered.filter(n => n.timestamp <= filter.dateTo!);
    }
    
    // Filter by search
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter unread only
    if (filter.unreadOnly) {
      filtered = filtered.filter(n => n.status === NotificationStatus.UNREAD);
    }
    
    return filtered;
  }
  
  /**
   * Setup auto mark as read
   */
  private setupAutoMarkAsRead(): void {
    if (!this.preferences().autoMarkAsRead) {
      return;
    }
    
    const delay = this.preferences().autoMarkAsReadDelay || 3000;
    
    // Auto-mark when notification is viewed
    fromEvent(document, 'visibilitychange')
      .pipe(
        filter(() => !document.hidden),
        debounceTime(delay),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.preferences().autoMarkAsRead) {
          this.markAllAsRead();
        }
      });
  }
  
  /**
   * Setup visibility listener
   */
  private setupVisibilityListener(): void {
    fromEvent(document, 'visibilitychange')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!document.hidden) {
          // Refresh notifications when page becomes visible
          this.refresh();
        }
      });
  }
  
  /**
   * Setup periodic cleanup
   */
  private setupPeriodicCleanup(): void {
    // Clean up expired notifications every hour
    interval(60 * 60 * 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const now = new Date();
        this.notifications.update(notifications =>
          notifications.filter(n => !n.expiresAt || n.expiresAt > now)
        );
        this.saveCachedNotifications();
      });
  }
  
  /**
   * Check notification permission
   */
  private checkNotificationPermission(): void {
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }
  }
  
  /**
   * Fetch notifications from server
   */
  private async fetchNotifications(page: number, pageSize: number): Promise<{
    notifications: Notification[];
    hasMore: boolean;
  }> {
    // This would be replaced with actual API call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          notifications: [],
          hasMore: false
        });
      }, 1000);
    });
  }
  
  /**
   * Get default preferences
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      sound: true,
      vibration: true,
      desktop: true,
      email: true,
      push: true,
      doNotDisturb: false,
      groupByType: false,
      autoMarkAsRead: false,
      autoMarkAsReadDelay: 3000,
      types: Object.values(NotificationType).reduce((acc, type) => ({
        ...acc,
        [type]: true
      }), {} as Record<NotificationType, boolean>),
      priorities: Object.values(NotificationPriority).reduce((acc, priority) => ({
        ...acc,
        [priority]: true
      }), {} as Record<NotificationPriority, boolean>)
    };
  }
  
  /**
   * Save preferences
   */
  private savePreferences(): void {
    localStorage.setItem('notification-preferences', JSON.stringify(this.preferences()));
  }
  
  /**
   * Load preferences
   */
  private loadPreferences(): NotificationPreferences | null {
    const saved = localStorage.getItem('notification-preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  }
  
  /**
   * Save cached notifications
   */
  private saveCachedNotifications(): void {
    const notifications = this.notifications().slice(0, 100); // Cache only last 100
    localStorage.setItem('cached-notifications', JSON.stringify(notifications));
  }
  
  /**
   * Load cached notifications
   */
  private loadCachedNotifications(): Notification[] | null {
    const cached = localStorage.getItem('cached-notifications');
    if (cached) {
      try {
        const notifications = JSON.parse(cached);
        // Convert timestamps to Date objects
        return notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
        }));
      } catch {
        return null;
      }
    }
    return null;
  }
  
  /**
   * Observable getters
   */
  public get onNotificationReceived$(): Observable<Notification> {
    return this.notificationReceived$.asObservable();
  }
  
  public get onNotificationRead$(): Observable<string> {
    return this.notificationRead$.asObservable();
  }
  
  public get onNotificationDeleted$(): Observable<string> {
    return this.notificationDeleted$.asObservable();
  }
  
  public get onActionClicked$(): Observable<{ notification: Notification; action: NotificationAction }> {
    return this.actionClicked$.asObservable();
  }
  
  /**
   * Clean up
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
