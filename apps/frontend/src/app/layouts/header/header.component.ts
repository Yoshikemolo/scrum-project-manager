import { Component, OnInit, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { OverlayModule } from '@angular/cdk/overlay';
import { animate, style, transition, trigger, state } from '@angular/animations';
import { fromEvent, debounceTime, distinctUntilChanged } from 'rxjs';

import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ShortcutService } from '../../core/services/shortcut.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { SearchComponent } from '../search/search.component';
import { NotificationCenterComponent } from '../notification-center/notification-center.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatRippleModule,
    MatProgressBarModule,
    TranslateModule,
    OverlayModule,
    SearchComponent,
    NotificationCenterComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('badgePulse', [
      state('pulse', style({ transform: 'scale(1)' })),
      transition('* => pulse', [
        animate('300ms ease-out', style({ transform: 'scale(1.3)' })),
        animate('200ms ease-in', style({ transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  private store = inject(Store);
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private breakpointObserver = inject(BreakpointObserver);
  private shortcutService = inject(ShortcutService);
  private wsService = inject(WebSocketService);

  // Signals
  currentUser = signal(this.authService.getCurrentUser());
  isDarkMode = signal(this.themeService.isDarkMode());
  isMobile = signal(false);
  isTablet = signal(false);
  unreadNotifications = signal(0);
  isSearchOpen = signal(false);
  isNotificationOpen = signal(false);
  isLoading = signal(false);
  currentLanguage = signal(this.translate.currentLang || 'en');
  connectionStatus = signal<'connected' | 'disconnected' | 'reconnecting'>('connected');
  
  // Computed values
  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  });

  displayName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return this.isMobile() ? user.firstName : `${user.firstName} ${user.lastName}`;
  });

  // Navigation items with icons and badges
  navItems = signal([
    { 
      route: '/dashboard', 
      label: 'header.dashboard', 
      icon: 'dashboard',
      tooltip: 'header.dashboard.tooltip',
      badge: null,
      shortcut: 'alt+d'
    },
    { 
      route: '/projects', 
      label: 'header.projects', 
      icon: 'folder',
      tooltip: 'header.projects.tooltip',
      badge: null,
      shortcut: 'alt+p'
    },
    { 
      route: '/tasks', 
      label: 'header.tasks', 
      icon: 'task_alt',
      tooltip: 'header.tasks.tooltip',
      badge: signal(0),
      shortcut: 'alt+t'
    },
    { 
      route: '/sprints', 
      label: 'header.sprints', 
      icon: 'speed',
      tooltip: 'header.sprints.tooltip',
      badge: null,
      shortcut: 'alt+s'
    },
    { 
      route: '/team', 
      label: 'header.team', 
      icon: 'groups',
      tooltip: 'header.team.tooltip',
      badge: null,
      shortcut: 'alt+m'
    },
    { 
      route: '/reports', 
      label: 'header.reports', 
      icon: 'insights',
      tooltip: 'header.reports.tooltip',
      badge: null,
      shortcut: 'alt+r'
    }
  ]);

  // User menu items
  userMenuItems = signal([
    { 
      action: 'profile', 
      label: 'header.profile', 
      icon: 'person',
      divider: false 
    },
    { 
      action: 'settings', 
      label: 'header.settings', 
      icon: 'settings',
      divider: false 
    },
    { 
      action: 'help', 
      label: 'header.help', 
      icon: 'help',
      divider: true 
    },
    { 
      action: 'logout', 
      label: 'header.logout', 
      icon: 'logout',
      divider: false,
      danger: true 
    }
  ]);

  // Available languages
  languages = signal([
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'zh', label: '中文', flag: '🇨🇳' }
  ]);

  ngOnInit(): void {
    this.setupResponsive();
    this.setupShortcuts();
    this.setupWebSocket();
    this.loadNotifications();
    this.setupSearch();
  }

  private setupResponsive(): void {
    this.breakpointObserver.observe(['(max-width: 768px)'])
      .subscribe(result => this.isMobile.set(result.matches));
    
    this.breakpointObserver.observe(['(min-width: 769px) and (max-width: 1024px)'])
      .subscribe(result => this.isTablet.set(result.matches));
  }

  private setupShortcuts(): void {
    // Global search shortcut (Ctrl/Cmd + K)
    this.shortcutService.add('ctrl+k', () => this.toggleSearch());
    this.shortcutService.add('cmd+k', () => this.toggleSearch());
    
    // Navigation shortcuts
    this.navItems().forEach(item => {
      if (item.shortcut) {
        this.shortcutService.add(item.shortcut, () => {
          // Navigate to route
          console.log(`Navigating to ${item.route}`);
        });
      }
    });

    // Notification shortcut (N)
    this.shortcutService.add('n', () => this.toggleNotifications());
    
    // Theme toggle (T)
    this.shortcutService.add('t', () => this.toggleTheme());
  }

  private setupWebSocket(): void {
    this.wsService.connectionStatus$.subscribe(status => {
      this.connectionStatus.set(status);
    });

    this.wsService.on('notification').subscribe(notification => {
      this.unreadNotifications.update(count => count + 1);
      this.playNotificationSound();
      this.showDesktopNotification(notification);
    });

    this.wsService.on('task-update').subscribe(update => {
      // Update task badge
      const taskItem = this.navItems().find(item => item.route === '/tasks');
      if (taskItem?.badge) {
        taskItem.badge.update(count => count + 1);
      }
    });
  }

  private setupSearch(): void {
    if (this.searchInput) {
      fromEvent(this.searchInput.nativeElement, 'input')
        .pipe(
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe((event: any) => {
          this.performSearch(event.target.value);
        });
    }
  }

  private loadNotifications(): void {
    this.notificationService.getUnreadCount().subscribe(count => {
      this.unreadNotifications.set(count);
    });
  }

  toggleTheme(): void {
    const isDark = !this.isDarkMode();
    this.themeService.setDarkMode(isDark);
    this.isDarkMode.set(isDark);
    
    // Smooth theme transition
    document.documentElement.classList.add('theme-transition');
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  }

  toggleSearch(): void {
    this.isSearchOpen.update(open => !open);
    if (this.isSearchOpen()) {
      setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
    }
  }

  toggleNotifications(): void {
    this.isNotificationOpen.update(open => !open);
    if (this.isNotificationOpen()) {
      this.markNotificationsAsRead();
    }
  }

  changeLanguage(langCode: string): void {
    this.translate.use(langCode);
    this.currentLanguage.set(langCode);
    localStorage.setItem('language', langCode);
    
    // Update document language attribute
    document.documentElement.lang = langCode;
    
    // Handle RTL languages
    const rtlLanguages = ['ar', 'he'];
    document.documentElement.dir = rtlLanguages.includes(langCode) ? 'rtl' : 'ltr';
  }

  handleUserMenuAction(action: string): void {
    switch (action) {
      case 'profile':
        // Navigate to profile
        break;
      case 'settings':
        // Navigate to settings
        break;
      case 'help':
        // Open help center
        this.openHelpCenter();
        break;
      case 'logout':
        this.logout();
        break;
    }
  }

  private performSearch(query: string): void {
    if (!query.trim()) return;
    
    this.isLoading.set(true);
    // Implement search logic
    setTimeout(() => {
      this.isLoading.set(false);
    }, 500);
  }

  private markNotificationsAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.unreadNotifications.set(0);
    });
  }

  private playNotificationSound(): void {
    const audio = new Audio('/assets/sounds/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }

  private showDesktopNotification(notification: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SCRUM Manager', {
        body: notification.message,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        tag: notification.id
      });
    }
  }

  private openHelpCenter(): void {
    // Open help modal or navigate to help page
    console.log('Opening help center');
  }

  private logout(): void {
    this.authService.logout().subscribe(() => {
      // Navigation handled by auth service
    });
  }

  // Touch gesture handlers for mobile
  onSwipeLeft(): void {
    if (this.isMobile()) {
      // Open next navigation item
    }
  }

  onSwipeRight(): void {
    if (this.isMobile()) {
      // Open previous navigation item
    }
  }

  // Accessibility
  onEscape(): void {
    this.isSearchOpen.set(false);
    this.isNotificationOpen.set(false);
  }
}