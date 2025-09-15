import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { trigger, transition, style, animate, state } from '@angular/animations';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ShortcutService } from '../../core/services/shortcut.service';
import { LocaleService } from '../../core/services/locale.service';
import { AuthActions } from '../../store/auth/auth.actions';
import { NotificationActions } from '../../store/notifications/notification.actions';
import { selectUser, selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { selectUnreadNotificationsCount, selectRecentNotifications } from '../../store/notifications/notification.selectors';
import { User } from '../../shared/interfaces/user.interface';
import { Notification } from '../../shared/interfaces/notification.interface';

/**
 * Application header component with navigation and user controls
 * Implements responsive design with mobile menu support
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatRippleModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('badgePulse', [
      state('pulse', style({ transform: 'scale(1)' })),
      transition('* => pulse', [
        animate('300ms', style({ transform: 'scale(1.2)' })),
        animate('300ms', style({ transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Dependency injection
  private store = inject(Store);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private notificationService = inject(NotificationService);
  private webSocketService = inject(WebSocketService);
  private shortcutService = inject(ShortcutService);
  private localeService = inject(LocaleService);

  // Component state
  user = signal<User | null>(null);
  isAuthenticated = signal(false);
  isDarkMode = signal(false);
  isMobileMenuOpen = signal(false);
  isSearchFocused = signal(false);
  isNotificationOpen = signal(false);
  unreadCount = signal(0);
  recentNotifications = signal<Notification[]>([]);
  searchControl = new FormControl('');
  searchResults = signal<any[]>([]);
  isSearching = signal(false);
  userInitials = computed(() => {
    const user = this.user();
    if (!user) return '';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  });
  notificationBadgeAnimation = signal('');
  currentLanguage = signal('en');
  onlineStatus = signal('online');
  
  // Observables
  private destroy$ = new Subject<void>();
  user$ = this.store.select(selectUser);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);
  unreadCount$ = this.store.select(selectUnreadNotificationsCount);
  recentNotifications$ = this.store.select(selectRecentNotifications);

  // Navigation items
  navigationItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard', permissions: [] },
    { label: 'Projects', route: '/projects', icon: 'folder', permissions: ['view_projects'] },
    { label: 'Tasks', route: '/tasks', icon: 'task_alt', permissions: ['view_tasks'] },
    { label: 'Sprints', route: '/sprints', icon: 'speed', permissions: ['view_sprints'] },
    { label: 'Team', route: '/team', icon: 'groups', permissions: ['view_team'] },
    { label: 'Reports', route: '/reports', icon: 'analytics', permissions: ['view_reports'] }
  ];

  // Language options
  languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'zh', label: '中文', flag: '🇨🇳' }
  ];

  ngOnInit(): void {
    this.subscribeToUserState();
    this.subscribeToNotifications();
    this.subscribeToTheme();
    this.setupSearch();
    this.setupKeyboardShortcuts();
    this.setupWebSocketListeners();
    this.loadUserPreferences();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to user state
   */
  private subscribeToUserState(): void {
    this.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.user.set(user);
    });

    this.isAuthenticated$.pipe(takeUntil(this.destroy$)).subscribe(isAuth => {
      this.isAuthenticated.set(isAuth);
    });
  }

  /**
   * Subscribe to notifications
   */
  private subscribeToNotifications(): void {
    this.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      const prevCount = this.unreadCount();
      this.unreadCount.set(count);
      
      // Animate badge when count increases
      if (count > prevCount) {
        this.animateNotificationBadge();
        this.playNotificationSound();
      }
    });

    this.recentNotifications$.pipe(takeUntil(this.destroy$)).subscribe(notifications => {
      this.recentNotifications.set(notifications || []);
    });
  }

  /**
   * Subscribe to theme changes
   */
  private subscribeToTheme(): void {
    this.themeService.isDarkTheme$.pipe(takeUntil(this.destroy$)).subscribe(isDark => {
      this.isDarkMode.set(isDark);
    });
  }

  /**
   * Setup search functionality
   */
  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (!query || query.length < 2) {
            this.searchResults.set([]);
            return of([]);
          }
          this.isSearching.set(true);
          return this.performSearch(query);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(results => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      });
  }

  /**
   * Perform search
   */
  private async performSearch(query: string): Promise<any[]> {
    // This would call a search service
    // For now, returning mock results
    return new Promise(resolve => {
      setTimeout(() => {
        const mockResults = [
          { type: 'project', title: 'Project Alpha', description: 'Main project', route: '/projects/1' },
          { type: 'task', title: 'Task #123', description: 'Fix bug in header', route: '/tasks/123' },
          { type: 'user', title: 'John Doe', description: 'Developer', route: '/team/johndoe' }
        ].filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
        );
        resolve(mockResults);
      }, 500);
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    // Search shortcut (Ctrl/Cmd + K)
    this.shortcutService.add({
      keys: 'ctrl+k,cmd+k',
      description: 'Focus search',
      action: () => this.focusSearch()
    });

    // Notifications shortcut (Ctrl/Cmd + N)
    this.shortcutService.add({
      keys: 'ctrl+n,cmd+n',
      description: 'Open notifications',
      action: () => this.toggleNotifications()
    });

    // Theme toggle shortcut (Ctrl/Cmd + Shift + T)
    this.shortcutService.add({
      keys: 'ctrl+shift+t,cmd+shift+t',
      description: 'Toggle theme',
      action: () => this.toggleTheme()
    });
  }

  /**
   * Setup WebSocket listeners
   */
  private setupWebSocketListeners(): void {
    // Listen for real-time notifications
    this.webSocketService.on('notification')
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        this.store.dispatch(NotificationActions.addNotification({ notification }));
      });

    // Listen for user status updates
    this.webSocketService.on('userStatus')
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.onlineStatus.set(status);
      });
  }

  /**
   * Load user preferences
   */
  private loadUserPreferences(): void {
    const user = this.user();
    if (user?.preferences) {
      this.currentLanguage.set(user.preferences.language || 'en');
      this.localeService.setLocale(user.preferences.language || 'en');
      
      if (user.preferences.theme) {
        this.themeService.setTheme(user.preferences.theme);
      }
    }
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(isOpen => !isOpen);
  }

  /**
   * Toggle theme
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Toggle notifications panel
   */
  toggleNotifications(): void {
    this.isNotificationOpen.update(isOpen => !isOpen);
    
    if (this.isNotificationOpen()) {
      // Mark notifications as read when opened
      this.store.dispatch(NotificationActions.markAllAsRead());
    }
  }

  /**
   * Focus search input
   */
  focusSearch(): void {
    this.isSearchFocused.set(true);
    // Focus would be handled by ViewChild in template
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchControl.setValue('');
    this.searchResults.set([]);
    this.isSearchFocused.set(false);
  }

  /**
   * Handle search result click
   */
  onSearchResultClick(result: any): void {
    // Navigate to result
    // Router would be injected and used here
    this.clearSearch();
  }

  /**
   * Logout user
   */
  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  /**
   * Change language
   */
  changeLanguage(code: string): void {
    this.currentLanguage.set(code);
    this.localeService.setLocale(code);
    
    // Save preference
    const user = this.user();
    if (user) {
      this.authService.updateUserPreferences({ language: code });
    }
  }

  /**
   * Animate notification badge
   */
  private animateNotificationBadge(): void {
    this.notificationBadgeAnimation.set('pulse');
    setTimeout(() => this.notificationBadgeAnimation.set(''), 600);
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    if (this.user()?.preferences?.soundEnabled) {
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Handle autoplay restrictions
      });
    }
  }

  /**
   * Check if user has permission
   */
  hasPermission(permissions: string[]): boolean {
    if (permissions.length === 0) return true;
    
    const user = this.user();
    if (!user) return false;
    
    return permissions.some(permission => 
      user.permissions?.includes(permission) || false
    );
  }

  /**
   * Get notification icon
   */
  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'task': 'task_alt',
      'comment': 'comment',
      'mention': 'alternate_email',
      'sprint': 'speed',
      'project': 'folder',
      'team': 'groups',
      'system': 'info'
    };
    return iconMap[type] || 'notifications';
  }

  /**
   * Get notification color
   */
  getNotificationColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'task': 'primary',
      'comment': 'accent',
      'mention': 'warn',
      'sprint': 'primary',
      'project': 'primary',
      'team': 'accent',
      'system': 'basic'
    };
    return colorMap[type] || 'basic';
  }

  /**
   * Format notification time
   */
  formatNotificationTime(date: Date | string): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diff = now.getTime() - notificationDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return notificationDate.toLocaleDateString();
  }

  /**
   * Get user avatar URL
   */
  getUserAvatar(): string {
    const user = this.user();
    if (user?.avatarUrl) {
      return user.avatarUrl;
    }
    // Return default avatar or generate based on initials
    return `/assets/avatars/default.png`;
  }

  /**
   * Get online status color
   */
  getStatusColor(): string {
    const statusColors: { [key: string]: string } = {
      'online': 'success',
      'away': 'warning',
      'busy': 'error',
      'offline': 'disabled'
    };
    return statusColors[this.onlineStatus()] || 'disabled';
  }
}