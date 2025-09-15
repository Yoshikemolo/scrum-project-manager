import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
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
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRippleModule } from '@angular/material/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { trigger, transition, style, animate, state } from '@angular/animations';

import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ShortcutService } from '../../core/services/shortcut.service';
import { SearchService } from '../../core/services/search.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectUser, selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { selectUnreadNotificationsCount } from '../../store/notifications/notifications.selectors';
import { User } from '../../shared/interfaces/user.interface';
import { SearchResult } from '../../shared/interfaces/search.interface';

/**
 * Header component for the application
 * Provides navigation, search, notifications, and user menu
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
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
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
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private shortcutService = inject(ShortcutService);
  private searchService = inject(SearchService);
  private websocketService = inject(WebSocketService);

  // ViewChild references
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // Component state
  user = signal<User | null>(null);
  isAuthenticated = signal(false);
  isDarkTheme = signal(false);
  unreadNotifications = signal(0);
  searchControl = new FormControl('');
  searchResults = signal<SearchResult[]>([]);
  isSearching = signal(false);
  showSearchResults = signal(false);
  isMobileMenuOpen = signal(false);
  isScrolled = signal(false);
  badgeAnimation = signal('');
  onlineUsers = signal(0);
  connectionStatus = signal<'connected' | 'connecting' | 'disconnected'>('disconnected');
  
  // Observables
  private destroy$ = new Subject<void>();
  user$ = this.store.select(selectUser);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);
  unreadCount$ = this.store.select(selectUnreadNotificationsCount);

  // Navigation items
  navigationItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Projects', route: '/projects', icon: 'folder' },
    { label: 'Tasks', route: '/tasks', icon: 'task_alt' },
    { label: 'Sprints', route: '/sprints', icon: 'speed' },
    { label: 'Teams', route: '/teams', icon: 'groups' },
    { label: 'Reports', route: '/reports', icon: 'analytics' }
  ];

  // User menu items
  userMenuItems = [
    { label: 'Profile', icon: 'person', action: 'profile' },
    { label: 'Settings', icon: 'settings', action: 'settings' },
    { label: 'Notifications', icon: 'notifications', action: 'notifications', badge: true },
    { label: 'Help & Support', icon: 'help', action: 'help' },
    { divider: true },
    { label: 'Logout', icon: 'logout', action: 'logout', danger: true }
  ];

  ngOnInit(): void {
    this.initializeSubscriptions();
    this.setupSearch();
    this.setupShortcuts();
    this.setupScrollListener();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.websocketService.disconnect();
  }

  /**
   * Initialize subscriptions
   */
  private initializeSubscriptions(): void {
    // User subscription
    this.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.user.set(user);
    });

    // Authentication subscription
    this.isAuthenticated$.pipe(takeUntil(this.destroy$)).subscribe(isAuth => {
      this.isAuthenticated.set(isAuth);
    });

    // Theme subscription
    this.themeService.isDarkTheme$.pipe(takeUntil(this.destroy$)).subscribe(isDark => {
      this.isDarkTheme.set(isDark);
    });

    // Unread notifications subscription
    this.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      const previousCount = this.unreadNotifications();
      this.unreadNotifications.set(count);
      
      // Animate badge on new notification
      if (count > previousCount) {
        this.animateBadge();
      }
    });
  }

  /**
   * Setup search functionality
   */
  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (!query || query.length < 2) {
            this.searchResults.set([]);
            this.showSearchResults.set(false);
            return of([]);
          }

          this.isSearching.set(true);
          this.showSearchResults.set(true);
          return this.searchService.search(query);
        })
      )
      .subscribe({
        next: (results) => {
          this.searchResults.set(results);
          this.isSearching.set(false);
        },
        error: () => {
          this.searchResults.set([]);
          this.isSearching.set(false);
        }
      });
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupShortcuts(): void {
    // Global search shortcut (Ctrl/Cmd + K)
    this.shortcutService.add({
      keys: 'meta.k',
      description: 'Open global search',
      handler: () => {
        this.focusSearch();
        return true;
      }
    });

    // Quick navigation shortcuts
    this.shortcutService.add({
      keys: 'meta.shift.d',
      description: 'Go to dashboard',
      handler: () => {
        this.navigate('/dashboard');
        return true;
      }
    });

    this.shortcutService.add({
      keys: 'meta.shift.p',
      description: 'Go to projects',
      handler: () => {
        this.navigate('/projects');
        return true;
      }
    });

    // Toggle theme shortcut
    this.shortcutService.add({
      keys: 'meta.shift.t',
      description: 'Toggle theme',
      handler: () => {
        this.toggleTheme();
        return true;
      }
    });
  }

  /**
   * Setup scroll listener for header effects
   */
  private setupScrollListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled.set(window.scrollY > 10);
      });
    }
  }

  /**
   * Setup WebSocket connection
   */
  private setupWebSocket(): void {
    if (this.isAuthenticated()) {
      this.websocketService.connect();
      
      // Listen for connection status
      this.websocketService.connectionStatus$
        .pipe(takeUntil(this.destroy$))
        .subscribe(status => {
          this.connectionStatus.set(status);
        });

      // Listen for online users count
      this.websocketService.on('onlineUsers')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.onlineUsers.set(data.count);
        });

      // Listen for real-time notifications
      this.websocketService.on('notification')
        .pipe(takeUntil(this.destroy$))
        .subscribe((notification: any) => {
          this.notificationService.addNotification(notification);
          this.animateBadge();
        });
    }
  }

  /**
   * Toggle theme
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  /**
   * Focus search input
   */
  focusSearch(): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
      this.searchInput.nativeElement.select();
    }
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchControl.setValue('');
    this.searchResults.set([]);
    this.showSearchResults.set(false);
  }

  /**
   * Handle search result click
   */
  onSearchResultClick(result: SearchResult): void {
    this.clearSearch();
    this.navigate(result.url);
  }

  /**
   * Handle search blur
   */
  onSearchBlur(): void {
    // Delay to allow click on results
    setTimeout(() => {
      this.showSearchResults.set(false);
    }, 200);
  }

  /**
   * Handle user menu action
   */
  handleUserMenuAction(action: string): void {
    switch (action) {
      case 'profile':
        this.navigate('/profile');
        break;
      case 'settings':
        this.navigate('/settings');
        break;
      case 'notifications':
        this.navigate('/notifications');
        break;
      case 'help':
        this.navigate('/help');
        break;
      case 'logout':
        this.logout();
        break;
    }
  }

  /**
   * Navigate to route
   */
  private navigate(route: string): void {
    // Router navigation would be handled here
    console.log('Navigating to:', route);
    this.closeMobileMenu();
  }

  /**
   * Logout user
   */
  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  /**
   * Animate notification badge
   */
  private animateBadge(): void {
    this.badgeAnimation.set('pulse');
    setTimeout(() => {
      this.badgeAnimation.set('');
    }, 600);
  }

  /**
   * Get user initials
   */
  getUserInitials(): string {
    const user = this.user();
    if (!user) return '?';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || '?';
  }

  /**
   * Get user avatar
   */
  getUserAvatar(): string | null {
    const user = this.user();
    return user?.avatar || null;
  }

  /**
   * Get connection status color
   */
  getConnectionStatusColor(): string {
    switch (this.connectionStatus()) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'disconnected':
        return 'error';
      default:
        return 'error';
    }
  }

  /**
   * Get connection status tooltip
   */
  getConnectionStatusTooltip(): string {
    switch (this.connectionStatus()) {
      case 'connected':
        return `Connected • ${this.onlineUsers()} users online`;
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  }
}