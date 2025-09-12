import { Component, OnInit, signal, computed, inject, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger, query, stagger, state } from '@angular/animations';
import { SwipeDirective } from '../../directives/swipe.directive';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationService } from '../../../core/services/notification.service';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'mention' | 'task' | 'comment' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  avatar?: string;
  from?: {
    id: string;
    name: string;
    avatar?: string;
  };
  data?: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
}

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCheckboxModule,
    TranslateModule,
    SwipeDirective
  ],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('staggerNotifications', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger('50ms', [
            animate('300ms ease-out', 
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('swipeOut', [
      state('swiped', style({ transform: 'translateX(100%)', opacity: 0 })),
      transition('* => swiped', animate('300ms ease-out'))
    ])
  ]
})
export class NotificationCenterComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @ViewChild('notificationList') notificationList!: ElementRef;

  private router = inject(Router);
  private store = inject(Store);
  private translate = inject(TranslateService);
  private snackBar = inject(MatSnackBar);
  private wsService = inject(WebSocketService);
  private notificationService = inject(NotificationService);

  // State
  notifications = signal<Notification[]>([]);
  isLoading = signal(false);
  selectedTab = signal(0);
  selectedNotifications = signal<Set<string>>(new Set());
  isSelectionMode = signal(false);
  filter = signal<string>('all');
  hasMore = signal(true);
  page = signal(1);
  searchQuery = signal('');

  // Categories
  categories = signal([
    { id: 'all', label: 'notifications.all', icon: 'inbox', count: 0 },
    { id: 'unread', label: 'notifications.unread', icon: 'markunread', count: 0 },
    { id: 'mentions', label: 'notifications.mentions', icon: 'alternate_email', count: 0 },
    { id: 'tasks', label: 'notifications.tasks', icon: 'task_alt', count: 0 },
    { id: 'comments', label: 'notifications.comments', icon: 'comment', count: 0 },
    { id: 'system', label: 'notifications.system', icon: 'info', count: 0 }
  ]);

  // Settings
  notificationSettings = signal({
    sound: true,
    desktop: true,
    email: true,
    push: true,
    vibration: true,
    groupByProject: false,
    showTimestamps: true
  });

  // Computed
  filteredNotifications = computed(() => {
    let notifications = this.notifications();
    const filter = this.filter();
    const query = this.searchQuery().toLowerCase();

    // Apply filter
    if (filter === 'unread') {
      notifications = notifications.filter(n => !n.read);
    } else if (filter !== 'all') {
      notifications = notifications.filter(n => n.category === filter);
    }

    // Apply search
    if (query) {
      notifications = notifications.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        n.from?.name.toLowerCase().includes(query)
      );
    }

    // Group by date if enabled
    if (this.notificationSettings().groupByProject) {
      // Group logic here
    }

    return notifications;
  });

  unreadCount = computed(() => 
    this.notifications().filter(n => !n.read).length
  );

  hasUnread = computed(() => this.unreadCount() > 0);

  selectedCount = computed(() => this.selectedNotifications().size);

  ngOnInit(): void {
    this.loadNotifications();
    this.setupWebSocket();
    this.loadSettings();
    this.requestNotificationPermission();
    this.setupInfiniteScroll();
  }

  private loadNotifications(): void {
    this.isLoading.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.notifications.set(this.generateMockNotifications());
      this.updateCategoryCounts();
      this.isLoading.set(false);
    }, 500);
  }

  private generateMockNotifications(): Notification[] {
    return [
      {
        id: '1',
        type: 'mention',
        title: 'New mention in task',
        message: '@john mentioned you in "Implement user authentication"',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        read: false,
        actionUrl: '/tasks/TASK-001',
        actionLabel: 'View Task',
        icon: 'alternate_email',
        from: {
          id: '1',
          name: 'John Doe',
          avatar: null
        },
        priority: 'high',
        category: 'mentions'
      },
      {
        id: '2',
        type: 'task',
        title: 'Task assigned to you',
        message: 'You have been assigned to "Fix critical bug in payment module"',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: false,
        actionUrl: '/tasks/TASK-003',
        actionLabel: 'Open Task',
        icon: 'assignment_ind',
        from: {
          id: '2',
          name: 'Jane Smith',
          avatar: null
        },
        priority: 'urgent',
        category: 'tasks'
      },
      {
        id: '3',
        type: 'success',
        title: 'Sprint completed',
        message: 'Sprint 14 has been successfully completed with 95% velocity',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        read: true,
        actionUrl: '/sprints/14',
        actionLabel: 'View Report',
        icon: 'check_circle',
        priority: 'normal',
        category: 'system'
      },
      {
        id: '4',
        type: 'comment',
        title: 'New comment on your task',
        message: 'Mike commented: "Great work on this implementation!"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
        read: true,
        actionUrl: '/tasks/TASK-002',
        actionLabel: 'Reply',
        icon: 'comment',
        from: {
          id: '3',
          name: 'Mike Johnson',
          avatar: null
        },
        priority: 'normal',
        category: 'comments'
      },
      {
        id: '5',
        type: 'warning',
        title: 'Deadline approaching',
        message: 'Task "Update API documentation" is due in 2 days',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        read: false,
        actionUrl: '/tasks/TASK-004',
        actionLabel: 'View Task',
        icon: 'schedule',
        priority: 'high',
        category: 'tasks'
      },
      {
        id: '6',
        type: 'info',
        title: 'System maintenance',
        message: 'Scheduled maintenance on Sunday, 2:00 AM - 4:00 AM',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        read: true,
        icon: 'build',
        priority: 'low',
        category: 'system'
      }
    ];
  }

  private setupWebSocket(): void {
    this.wsService.on('notification').subscribe(notification => {
      this.addNotification(notification);
      this.showNotification(notification);
      
      if (this.notificationSettings().sound) {
        this.playNotificationSound();
      }
      
      if (this.notificationSettings().vibration && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    });
  }

  private addNotification(notification: Notification): void {
    const notifications = [notification, ...this.notifications()];
    this.notifications.set(notifications);
    this.updateCategoryCounts();
  }

  private showNotification(notification: Notification): void {
    // Show snackbar
    const snackBarRef = this.snackBar.open(
      notification.message,
      notification.actionLabel || 'View',
      {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom',
        panelClass: [`snackbar-${notification.type}`]
      }
    );

    snackBarRef.onAction().subscribe(() => {
      if (notification.actionUrl) {
        this.router.navigate([notification.actionUrl]);
      }
    });

    // Show desktop notification if enabled
    if (this.notificationSettings().desktop && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const desktopNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/assets/icons/icon-192x192.png',
          badge: '/assets/icons/badge-72x72.png',
          tag: notification.id,
          requireInteraction: notification.priority === 'urgent',
          data: notification
        });

        desktopNotification.onclick = () => {
          window.focus();
          if (notification.actionUrl) {
            this.router.navigate([notification.actionUrl]);
          }
          desktopNotification.close();
        };
      }
    }
  }

  private requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private loadSettings(): void {
    const settings = localStorage.getItem('notificationSettings');
    if (settings) {
      this.notificationSettings.set(JSON.parse(settings));
    }
  }

  private saveSettings(): void {
    localStorage.setItem('notificationSettings', JSON.stringify(this.notificationSettings()));
  }

  private updateCategoryCounts(): void {
    const notifications = this.notifications();
    const categories = [...this.categories()];

    categories.forEach(category => {
      if (category.id === 'all') {
        category.count = notifications.length;
      } else if (category.id === 'unread') {
        category.count = notifications.filter(n => !n.read).length;
      } else {
        category.count = notifications.filter(n => n.category === category.id).length;
      }
    });

    this.categories.set(categories);
  }

  private setupInfiniteScroll(): void {
    if (!this.notificationList) return;

    const element = this.notificationList.nativeElement;
    element.addEventListener('scroll', () => {
      const threshold = 100;
      const position = element.scrollTop + element.offsetHeight;
      const height = element.scrollHeight;

      if (position > height - threshold && !this.isLoading() && this.hasMore()) {
        this.loadMore();
      }
    });
  }

  private loadMore(): void {
    if (this.isLoading() || !this.hasMore()) return;

    this.isLoading.set(true);
    const nextPage = this.page() + 1;

    // Simulate loading more
    setTimeout(() => {
      const moreNotifications = this.generateMockNotifications();
      this.notifications.update(current => [...current, ...moreNotifications]);
      this.page.set(nextPage);
      this.isLoading.set(false);
      
      // Check if there are more
      if (nextPage >= 5) {
        this.hasMore.set(false);
      }
    }, 500);
  }

  private playNotificationSound(): void {
    const audio = new Audio('/assets/sounds/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }

  // Public methods
  markAsRead(notification: Notification): void {
    if (notification.read) return;

    const notifications = this.notifications().map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    );
    
    this.notifications.set(notifications);
    this.updateCategoryCounts();
    
    // Update backend
    this.notificationService.markAsRead(notification.id).subscribe();
  }

  markAllAsRead(): void {
    const notifications = this.notifications().map(n => ({ ...n, read: true }));
    this.notifications.set(notifications);
    this.updateCategoryCounts();
    
    // Update backend
    this.notificationService.markAllAsRead().subscribe();
    
    this.snackBar.open('All notifications marked as read', 'OK', {
      duration: 2000
    });
  }

  deleteNotification(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const notifications = this.notifications().filter(n => n.id !== notification.id);
    this.notifications.set(notifications);
    this.updateCategoryCounts();
    
    // Update backend
    this.notificationService.delete(notification.id).subscribe();
    
    // Show undo option
    const snackBarRef = this.snackBar.open('Notification deleted', 'Undo', {
      duration: 5000
    });

    snackBarRef.onAction().subscribe(() => {
      this.addNotification(notification);
    });
  }

  deleteSelected(): void {
    const selected = this.selectedNotifications();
    if (selected.size === 0) return;

    const notifications = this.notifications().filter(n => !selected.has(n.id));
    this.notifications.set(notifications);
    this.updateCategoryCounts();
    this.selectedNotifications.set(new Set());
    this.isSelectionMode.set(false);
    
    this.snackBar.open(`${selected.size} notifications deleted`, 'OK', {
      duration: 2000
    });
  }

  clearAll(): void {
    if (confirm('Are you sure you want to clear all notifications?')) {
      this.notifications.set([]);
      this.updateCategoryCounts();
      
      // Update backend
      this.notificationService.clearAll().subscribe();
      
      this.snackBar.open('All notifications cleared', 'OK', {
        duration: 2000
      });
    }
  }

  toggleSelection(notification: Notification): void {
    const selected = new Set(this.selectedNotifications());
    
    if (selected.has(notification.id)) {
      selected.delete(notification.id);
    } else {
      selected.add(notification.id);
    }
    
    this.selectedNotifications.set(selected);
  }

  toggleSelectionMode(): void {
    this.isSelectionMode.update(mode => !mode);
    if (!this.isSelectionMode()) {
      this.selectedNotifications.set(new Set());
    }
  }

  selectAll(): void {
    const allIds = new Set(this.filteredNotifications().map(n => n.id));
    this.selectedNotifications.set(allIds);
  }

  performAction(notification: Notification): void {
    this.markAsRead(notification);
    
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
      this.close.emit();
    }
  }

  updateSetting(key: string, value: any): void {
    const settings = { ...this.notificationSettings(), [key]: value };
    this.notificationSettings.set(settings);
    this.saveSettings();
  }

  setFilter(filter: string): void {
    this.filter.set(filter);
    this.selectedNotifications.set(new Set());
  }

  onSwipeRight(notification: Notification): void {
    this.markAsRead(notification);
  }

  onSwipeLeft(notification: Notification): void {
    this.deleteNotification(notification);
  }

  // Helper methods
  getIconForType(type: string): string {
    const icons: { [key: string]: string } = {
      info: 'info',
      success: 'check_circle',
      warning: 'warning',
      error: 'error',
      mention: 'alternate_email',
      task: 'task_alt',
      comment: 'comment',
      system: 'settings'
    };
    return icons[type] || 'notifications';
  }

  getColorForType(type: string): string {
    const colors: { [key: string]: string } = {
      info: 'primary',
      success: 'success',
      warning: 'warn',
      error: 'error',
      mention: 'accent',
      task: 'primary',
      comment: 'info',
      system: 'basic'
    };
    return colors[type] || 'basic';
  }

  getRelativeTime(date: Date): string {
    const now = Date.now();
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  getUserInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}