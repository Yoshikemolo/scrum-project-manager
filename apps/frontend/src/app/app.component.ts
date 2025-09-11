/**
 * Root component of the SCRUM Project Manager application.
 * Manages the overall application layout, theme, and global services initialization.
 * 
 * @component AppComponent
 * @module App
 */

import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { OverlayContainer } from '@angular/cdk/overlay';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SwUpdate } from '@angular/service-worker';
import { Subject, takeUntil, filter, fromEvent, merge } from 'rxjs';
import { debounceTime, throttleTime } from 'rxjs/operators';

// Services
import { ThemeService } from './core/services/theme.service';
import { LoadingService } from './core/services/loading.service';
import { NotificationService } from './core/services/notification.service';
import { ShortcutService } from './core/services/shortcut.service';
import { NetworkService } from './core/services/network.service';
import { LocaleService } from './core/services/locale.service';
import { AccessibilityService } from './core/services/accessibility.service';

// Components
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { NotificationCenterComponent } from './shared/components/notification-center/notification-center.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { GlobalSearchComponent } from './shared/components/global-search/global-search.component';
import { KeyboardShortcutsDialogComponent } from './shared/components/keyboard-shortcuts-dialog/keyboard-shortcuts-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatProgressBarModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    NotificationCenterComponent,
    ToastContainerComponent,
    GlobalSearchComponent,
    KeyboardShortcutsDialogComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly overlayContainer = inject(OverlayContainer);
  private readonly swUpdate = inject(SwUpdate);
  private readonly themeService = inject(ThemeService);
  private readonly loadingService = inject(LoadingService);
  private readonly notificationService = inject(NotificationService);
  private readonly shortcutService = inject(ShortcutService);
  private readonly networkService = inject(NetworkService);
  private readonly localeService = inject(LocaleService);
  private readonly accessibilityService = inject(AccessibilityService);

  /**
   * Application title
   */
  readonly title = 'SCRUM Project Manager';

  /**
   * Current theme signal
   */
  readonly theme = this.themeService.currentTheme;

  /**
   * Loading state signal
   */
  readonly isLoading = this.loadingService.isLoading;

  /**
   * Sidebar expanded state signal
   */
  readonly sidebarExpanded = signal(true);

  /**
   * Mobile view state signal
   */
  readonly isMobile = signal(false);

  /**
   * Tablet view state signal
   */
  readonly isTablet = signal(false);

  /**
   * Desktop view state signal
   */
  readonly isDesktop = signal(true);

  /**
   * Network status signal
   */
  readonly isOnline = this.networkService.isOnline;

  /**
   * Touch device detection signal
   */
  readonly isTouchDevice = signal(false);

  /**
   * Computed layout class based on device type
   */
  readonly layoutClass = computed(() => {
    if (this.isMobile()) return 'layout-mobile';
    if (this.isTablet()) return 'layout-tablet';
    return 'layout-desktop';
  });

  /**
   * Computed sidebar state based on device type
   */
  readonly sidebarMode = computed(() => {
    if (this.isMobile()) return 'over';
    if (this.isTablet() && !this.sidebarExpanded()) return 'over';
    return 'side';
  });

  constructor() {
    // Apply theme effect
    effect(() => {
      const theme = this.theme();
      this.applyTheme(theme);
    });

    // Auto-hide sidebar on mobile
    effect(() => {
      if (this.isMobile()) {
        this.sidebarExpanded.set(false);
      }
    });
  }

  /**
   * Component initialization
   */
  ngOnInit(): void {
    this.initializeBreakpointObserver();
    this.initializeTouchDetection();
    this.initializeKeyboardShortcuts();
    this.initializeServiceWorker();
    this.initializePerformanceMonitoring();
    this.initializeAccessibility();
    this.initializeNetworkMonitoring();
    this.handleWindowEvents();
  }

  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize responsive breakpoint observer
   */
  private initializeBreakpointObserver(): void {
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile.set(result.matches && result.breakpoints[Breakpoints.XSmall]);
        this.isTablet.set(result.matches && (result.breakpoints[Breakpoints.Small] || result.breakpoints[Breakpoints.Medium]));
        this.isDesktop.set(result.matches && (result.breakpoints[Breakpoints.Large] || result.breakpoints[Breakpoints.XLarge]));
      });
  }

  /**
   * Initialize touch device detection
   */
  private initializeTouchDetection(): void {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.isTouchDevice.set(hasTouch);
    
    if (hasTouch) {
      document.documentElement.classList.add('touch-device');
    }
  }

  /**
   * Initialize keyboard shortcuts
   */
  private initializeKeyboardShortcuts(): void {
    // Global search shortcut (Ctrl/Cmd + K)
    this.shortcutService.register('ctrl+k,cmd+k', 'Open global search', () => {
      this.openGlobalSearch();
    });

    // Toggle sidebar (Ctrl/Cmd + B)
    this.shortcutService.register('ctrl+b,cmd+b', 'Toggle sidebar', () => {
      this.toggleSidebar();
    });

    // Show shortcuts dialog (Ctrl/Cmd + /)
    this.shortcutService.register('ctrl+/,cmd+/', 'Show keyboard shortcuts', () => {
      this.showKeyboardShortcuts();
    });

    // Toggle theme (Ctrl/Cmd + Shift + T)
    this.shortcutService.register('ctrl+shift+t,cmd+shift+t', 'Toggle theme', () => {
      this.toggleTheme();
    });
  }

  /**
   * Initialize service worker for PWA
   */
  private initializeServiceWorker(): void {
    if (this.swUpdate.isEnabled) {
      // Check for updates
      this.swUpdate.versionUpdates
        .pipe(
          filter(event => event.type === 'VERSION_READY'),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.notificationService.info(
            'New version available',
            'A new version of the application is available. Reload to update.',
            {
              duration: 0,
              actions: [
                {
                  label: 'Reload',
                  action: () => window.location.reload(),
                },
              ],
            }
          );
        });

      // Check for updates every 30 seconds
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 30000);
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      // Monitor long tasks
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  /**
   * Initialize accessibility features
   */
  private initializeAccessibility(): void {
    this.accessibilityService.initialize();
    
    // Skip to main content link
    this.shortcutService.register('alt+1', 'Skip to main content', () => {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    this.networkService.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOnline => {
        if (isOnline) {
          this.notificationService.success('Connection restored', 'You are back online');
        } else {
          this.notificationService.warning(
            'Connection lost',
            'You are currently offline. Some features may be limited.'
          );
        }
      });
  }

  /**
   * Handle window events
   */
  private handleWindowEvents(): void {
    // Handle resize events with throttling
    fromEvent(window, 'resize')
      .pipe(
        throttleTime(200),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.handleResize();
      });

    // Handle scroll events with throttling
    fromEvent(window, 'scroll')
      .pipe(
        throttleTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.handleScroll();
      });

    // Handle visibility change
    fromEvent(document, 'visibilitychange')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleVisibilityChange();
      });
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    // Custom resize logic if needed
  }

  /**
   * Handle window scroll
   */
  private handleScroll(): void {
    // Custom scroll logic if needed
  }

  /**
   * Handle document visibility change
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Pause non-critical operations
      console.log('App moved to background');
    } else {
      // Resume operations
      console.log('App moved to foreground');
      // Check for updates
      if (this.swUpdate.isEnabled) {
        this.swUpdate.checkForUpdate();
      }
    }
  }

  /**
   * Apply theme to the application
   */
  private applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    const effectiveTheme = theme === 'auto' 
      ? this.getSystemTheme() 
      : theme;

    // Remove existing theme classes
    document.body.classList.remove('light-theme', 'dark-theme');
    
    // Add new theme class
    document.body.classList.add(`${effectiveTheme}-theme`);
    
    // Update overlay container for Material overlays
    const overlayContainerElement = this.overlayContainer.getContainerElement();
    overlayContainerElement.classList.remove('light-theme', 'dark-theme');
    overlayContainerElement.classList.add(`${effectiveTheme}-theme`);
  }

  /**
   * Get system theme preference
   */
  private getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar(): void {
    this.sidebarExpanded.update(value => !value);
  }

  /**
   * Toggle theme
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Open global search
   */
  openGlobalSearch(): void {
    // Emit event to open global search
    document.dispatchEvent(new CustomEvent('open-global-search'));
  }

  /**
   * Show keyboard shortcuts dialog
   */
  showKeyboardShortcuts(): void {
    // Emit event to show shortcuts dialog
    document.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'));
  }
}
