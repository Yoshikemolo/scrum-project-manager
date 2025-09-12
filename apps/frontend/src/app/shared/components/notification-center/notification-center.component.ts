/**
 * Notification Center Component
 * Displays and manages user notifications with filtering and actions
 */
import { Component, OnInit, OnDestroy, HostListener, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { NotificationService, Notification, NotificationType, NotificationPriority, NotificationStatus, NotificationFilter } from '../../../core/services/notification.service';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatTabsModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatRippleModule
  ],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ transform: 'translateX(0)', opacity: 1 })
        )
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.6, 1)', 
          style({ transform: 'translateX(100%)', opacity: 0 })
        )
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-10px)' }),
          stagger(50, [
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
              style({ opacity: 1, transform: 'translateY(0)' })
            )
          ])
        ], { optional: true })
      ])
    ]),
    trigger('badgeAnimation', [
      transition(':increment', [
        animate('300ms cubic-bezier(0.4, 0, 0.6, 1)', 
          style({ transform: 'scale(1.2)' })
        ),
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ transform: 'scale(1)' })
        )
      ])
    ])
  ]
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('notificationList') notificationList?: ElementRef<HTMLElement>;
  
  private destroy$ = new Subject<void>();
  
  // State management
  public isOpen = signal(false);
  public activeTab = signal<'all' | 'unread' | 'mentions'>('all');
  public searchQuery = signal('');
  public isSelectionMode = signal(false);
  public showFilters = signal(false);
  public currentFilter = signal<NotificationFilter>({});
  
  // Filter options
  public selectedTypes = signal<Set<NotificationType>>(new Set());
  public selectedPriorities = signal<Set<NotificationPriority>>(new Set());
  
  // Computed values from service
  public notifications = computed(() => this.notificationService.filteredNotifications());
  public unreadCount = computed(() => this.notificationService.unreadCount());
  public hasUnread = computed(() => this.notificationService.hasUnread());
  public isLoading = computed(() => this.notificationService.isLoadingNotifications());
  public hasMore = computed(() => this.notificationService.hasMoreNotifications());
  public selectedCount = computed(() => this.notificationService.selectedCount());
  public stats = computed(() => this.notificationService.stats());
  
  // Filtered notifications based on active tab
  public displayedNotifications = computed(() => {
    const notifications = this.notifications();
    const tab = this.activeTab();
    const search = this.searchQuery();
    
    let filtered = notifications;
    
    // Filter by tab
    switch (tab) {
      case 'unread':
        filtered = filtered.filter(n => n.status === NotificationStatus.UNREAD);
        break;
      case 'mentions':
        filtered = filtered.filter(n => n.type === NotificationType.MENTION);
        break;
    }
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  });
  
  // Grouped notifications
  public groupedNotifications = computed(() => {
    const notifications = this.displayedNotifications();
    const groups = new Map<string, Notification[]>();
    
    notifications.forEach(notification => {
      const date = new Date(notification.timestamp);
      const key = this.getDateGroupKey(date);
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });
    
    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      label: this.getDateGroupLabel(key),
      notifications: items
    }));
  });
  
  constructor(public notificationService: NotificationService) {}
  
  ngOnInit(): void {
    this.setupSearchListener();
    this.setupScrollListener();
    this.setupKeyboardShortcuts();
    
    // Load initial notifications
    this.notificationService.loadMore();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Toggle notification center
   */
  public toggle(): void {
    this.isOpen.set(!this.isOpen());
    
    if (this.isOpen()) {
      // Mark all as read after delay
      setTimeout(() => {
        if (this.notificationService.userPreferences().autoMarkAsRead) {
          this.notificationService.markAllAsRead();
        }
      }, 3000);
      
      // Focus search input
      setTimeout(() => {
        this.searchInput?.nativeElement.focus();
      }, 100);
    }
  }
  
  /**
   * Close notification center
   */
  public close(): void {
    this.isOpen.set(false);
  }
  
  /**
   * Change active tab
   */
  public changeTab(tab: 'all' | 'unread' | 'mentions'): void {
    this.activeTab.set(tab);
    this.updateFilter();
  }
  
  /**
   * Toggle selection mode
   */
  public toggleSelectionMode(): void {
    this.isSelectionMode.set(!this.isSelectionMode());
    if (!this.isSelectionMode()) {
      this.notificationService.clearSelection();
    }
  }
  
  /**
   * Toggle filters
   */
  public toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }
  
  /**
   * Toggle notification selection
   */
  public toggleSelection(notification: Notification): void {
    if (this.isSelectionMode()) {
      this.notificationService.selectNotification(notification.id);
    } else {
      // Open notification
      this.openNotification(notification);
    }
  }
  
  /**
   * Select all notifications
   */
  public selectAll(): void {
    this.notificationService.selectAll();
  }
  
  /**
   * Open notification
   */
  public openNotification(notification: Notification): void {
    // Mark as read
    if (notification.status === NotificationStatus.UNREAD) {
      this.notificationService.markAsRead(notification.id);
    }
    
    // Open URL if available
    if (notification.url) {
      window.open(notification.url, '_blank');
    }
  }
  
  /**
   * Handle notification action
   */
  public handleAction(notification: Notification, action: any, event: Event): void {
    event.stopPropagation();
    this.notificationService.handleAction(notification, action);
  }
  
  /**
   * Mark as read
   */
  public markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(notification.id);
  }
  
  /**
   * Delete notification
   */
  public deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification.id);
  }
  
  /**
   * Archive notification
   */
  public archiveNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.archiveNotification(notification.id);
  }
  
  /**
   * Mark all as read
   */
  public markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }
  
  /**
   * Clear all notifications
   */
  public clearAll(): void {
    if (confirm('Are you sure you want to clear all notifications?')) {
      this.notificationService.clearAll();
    }
  }
  
  /**
   * Delete selected
   */
  public deleteSelected(): void {
    const selected = Array.from(this.notificationService.selectedNotifications());
    if (selected.length > 0) {
      this.notificationService.deleteMultiple(selected);
      this.toggleSelectionMode();
    }
  }
  
  /**
   * Mark selected as read
   */
  public markSelectedAsRead(): void {
    const selected = Array.from(this.notificationService.selectedNotifications());
    if (selected.length > 0) {
      this.notificationService.markMultipleAsRead(selected);
      this.toggleSelectionMode();
    }
  }
  
  /**
   * Toggle type filter
   */
  public toggleTypeFilter(type: NotificationType): void {
    this.selectedTypes.update(types => {
      const newTypes = new Set(types);
      if (newTypes.has(type)) {
        newTypes.delete(type);
      } else {
        newTypes.add(type);
      }
      return newTypes;
    });
    this.updateFilter();
  }
  
  /**
   * Toggle priority filter
   */
  public togglePriorityFilter(priority: NotificationPriority): void {
    this.selectedPriorities.update(priorities => {
      const newPriorities = new Set(priorities);
      if (newPriorities.has(priority)) {
        newPriorities.delete(priority);
      } else {
        newPriorities.add(priority);
      }
      return newPriorities;
    });
    this.updateFilter();
  }
  
  /**
   * Update filter
   */
  private updateFilter(): void {
    const filter: NotificationFilter = {
      types: Array.from(this.selectedTypes()),
      priorities: Array.from(this.selectedPriorities()),
      search: this.searchQuery(),
      unreadOnly: this.activeTab() === 'unread'
    };
    
    this.currentFilter.set(filter);
    this.notificationService.updateFilter(filter);
  }
  
  /**
   * Load more notifications
   */
  public loadMore(): void {
    this.notificationService.loadMore();
  }
  
  /**
   * Refresh notifications
   */
  public refresh(): void {
    this.notificationService.refresh();
  }
  
  /**
   * Get notification icon
   */
  public getNotificationIcon(notification: Notification): string {
    const icons: Record<NotificationType, string> = {
      [NotificationType.INFO]: 'info',
      [NotificationType.SUCCESS]: 'check_circle',
      [NotificationType.WARNING]: 'warning',
      [NotificationType.ERROR]: 'error',
      [NotificationType.MENTION]: 'alternate_email',
      [NotificationType.TASK]: 'task_alt',
      [NotificationType.COMMENT]: 'comment',
      [NotificationType.SYSTEM]: 'settings',
      [NotificationType.UPDATE]: 'update',
      [NotificationType.REMINDER]: 'alarm'
    };
    return notification.icon || icons[notification.type];
  }
  
  /**
   * Get notification color
   */
  public getNotificationColor(notification: Notification): string {
    const colors: Record<NotificationType, string> = {
      [NotificationType.INFO]: '#2196f3',
      [NotificationType.SUCCESS]: '#4caf50',
      [NotificationType.WARNING]: '#ff9800',
      [NotificationType.ERROR]: '#f44336',
      [NotificationType.MENTION]: '#9c27b0',
      [NotificationType.TASK]: '#00bcd4',
      [NotificationType.COMMENT]: '#607d8b',
      [NotificationType.SYSTEM]: '#795548',
      [NotificationType.UPDATE]: '#3f51b5',
      [NotificationType.REMINDER]: '#ff5722'
    };
    return colors[notification.type];
  }
  
  /**
   * Get priority badge
   */
  public getPriorityBadge(priority: NotificationPriority): string {
    const badges: Record<NotificationPriority, string> = {
      [NotificationPriority.LOW]: '',
      [NotificationPriority.NORMAL]: '',
      [NotificationPriority.HIGH]: 'priority_high',
      [NotificationPriority.URGENT]: 'notification_important'
    };
    return badges[priority];
  }
  
  /**
   * Get relative time
   */
  public getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  }
  
  /**
   * Get date group key
   */
  private getDateGroupKey(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (dateOnly.getTime() === today.getTime()) {
      return 'today';
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return 'yesterday';
    } else if (dateOnly.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
      return 'week';
    } else if (dateOnly.getTime() > today.getTime() - 30 * 24 * 60 * 60 * 1000) {
      return 'month';
    } else {
      return 'older';
    }
  }
  
  /**
   * Get date group label
   */
  private getDateGroupLabel(key: string): string {
    const labels: Record<string, string> = {
      'today': 'Today',
      'yesterday': 'Yesterday',
      'week': 'This Week',
      'month': 'This Month',
      'older': 'Older'
    };
    return labels[key] || key;
  }
  
  /**
   * Setup search listener
   */
  private setupSearchListener(): void {
    if (this.searchInput) {
      fromEvent<Event>(this.searchInput.nativeElement, 'input')
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.searchQuery.set(this.searchInput!.nativeElement.value);
          this.updateFilter();
        });
    }
  }
  
  /**
   * Setup scroll listener for infinite scroll
   */
  private setupScrollListener(): void {
    if (this.notificationList) {
      fromEvent(this.notificationList.nativeElement, 'scroll')
        .pipe(
          debounceTime(100),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          const element = this.notificationList!.nativeElement;
          const threshold = 100;
          
          if (element.scrollHeight - element.scrollTop <= element.clientHeight + threshold) {
            if (this.hasMore() && !this.isLoading()) {
              this.loadMore();
            }
          }
        });
    }
  }
  
  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    // No global shortcuts for notification center to avoid conflicts
  }
  
  /**
   * Handle escape key
   */
  @HostListener('document:keydown.escape')
  public handleEscape(): void {
    if (this.isOpen()) {
      this.close();
    }
  }
  
  /**
   * Track by function for performance
   */
  public trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }
  
  /**
   * Track by group key
   */
  public trackByGroupKey(index: number, group: any): string {
    return group.key;
  }
}
