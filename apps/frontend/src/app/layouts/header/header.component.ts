/**
 * @fileoverview Header Component
 * @module HeaderComponent
 * 
 * Main application header component that provides:
 * - Navigation menu toggle
 * - Global search functionality
 * - User profile menu
 * - Theme switching
 * - Language selection
 * - Notifications access
 * - Quick actions
 * 
 * @author SCRUM Project Manager Team
 * @copyright 2025 Ximplicity Software Solutions
 */

import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  inject, 
  signal, 
  computed,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ShortcutService } from '../../core/services/shortcut.service';
import { LoadingService } from '../../core/services/loading.service';
import { NotificationService } from '../../core/services/notification.service';
import * as AuthActions from '../../store/auth/auth.actions';

/**
 * Language option interface
 */
interface LanguageOption {
  code: string;
  name: string;
}

/**
 * Header component for the application
 * 
 * @example
 * ```html
 * <app-header 
 *   [sidenavOpened]="isSidenavOpen"
 *   (toggleSidenav)="onToggleSidenav()"
 *   (toggleNotifications)="onToggleNotifications()">
 * </app-header>
 * ```
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatProgressBarModule,
    TranslateModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Service injections
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly translateService = inject(TranslateService);
  private readonly shortcutService = inject(ShortcutService);
  private readonly loadingService = inject(LoadingService);
  private readonly notificationService = inject(NotificationService);
  
  // Component lifecycle
  private readonly destroy$ = new Subject<void>();
  
  /**
   * Whether the sidenav is currently opened
   */
  @Input() sidenavOpened = false;
  
  /**
   * Event emitted when sidenav toggle is requested
   */
  @Output() toggleSidenav = new EventEmitter<void>();
  
  /**
   * Event emitted when notifications panel toggle is requested
   */
  @Output() toggleNotifications = new EventEmitter<void>();
  
  /**
   * Reference to search input element
   */
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  
  // Component state
  searchQuery = '';
  currentLanguage = signal(this.translateService.currentLang);
  scrolled = signal(false);
  
  // Computed signals from services
  isLoading = computed(() => this.loadingService.isLoading());
  unreadNotifications = computed(() => this.notificationService.unreadCount());
  
  // User information computed from auth service
  userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.firstName} ${user.lastName}`.trim() : '';
  });
  
  userEmail = computed(() => {
    const user = this.authService.currentUser();
    return user?.email || '';
  });
  
  userAvatar = computed(() => {
    const user = this.authService.currentUser();
    return user?.avatar || null;
  });
  
  userRole = computed(() => {
    const user = this.authService.currentUser();
    return user?.roles?.[0]?.name || '';
  });
  
  // Theme state
  isDarkTheme = computed(() => {
    return this.themeService.currentTheme() === 'dark';
  });
  
  /**
   * Available languages for the application
   */
  readonly availableLanguages: ReadonlyArray<LanguageOption> = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
    { code: 'it', name: 'Italiano' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' }
  ];
  
  /**
   * Component initialization
   */
  ngOnInit(): void {
    this.setupScrollListener();
    this.setupKeyboardShortcuts();
    this.loadUserPreferences();
  }
  
  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Setup scroll listener for header elevation effect
   * @private
   */
  private setupScrollListener(): void {
    fromEvent(window, 'scroll')
      .pipe(
        debounceTime(10),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.scrolled.set(window.scrollY > 10);
      });
  }
  
  /**
   * Setup keyboard shortcuts
   * @private
   */
  private setupKeyboardShortcuts(): void {
    // Global search shortcut (Ctrl/Cmd + K)
    this.shortcutService.add({
      keys: 'ctrl+k,cmd+k',
      description: 'Focus global search',
      handler: () => {
        this.searchInput?.nativeElement.focus();
        return false;
      }
    });
    
    // Toggle theme shortcut (Ctrl/Cmd + Shift + T)
    this.shortcutService.add({
      keys: 'ctrl+shift+t,cmd+shift+t',
      description: 'Toggle theme',
      handler: () => {
        this.toggleTheme();
        return false;
      }
    });
  }
  
  /**
   * Load user preferences from storage
   * @private
   */
  private loadUserPreferences(): void {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && this.isValidLanguage(savedLanguage)) {
      this.translateService.use(savedLanguage);
      this.currentLanguage.set(savedLanguage);
    }
  }
  
  /**
   * Check if a language code is valid
   * @param code Language code to validate
   * @returns True if the language code is valid
   * @private
   */
  private isValidLanguage(code: string): boolean {
    return this.availableLanguages.some(lang => lang.code === code);
  }
  
  /**
   * Handle global search
   */
  onSearch(): void {
    const query = this.searchQuery.trim();
    if (query) {
      // TODO: Implement global search functionality
      console.log('Searching for:', query);
      
      // For now, just show a notification
      this.notificationService.info(
        this.translateService.instant('header.searchInProgress', { query })
      );
    }
  }
  
  /**
   * Clear search input
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.searchInput?.nativeElement.focus();
  }
  
  /**
   * Toggle application theme
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
    
    // Show notification
    const theme = this.isDarkTheme() ? 'dark' : 'light';
    this.notificationService.success(
      this.translateService.instant('header.themeChanged', { theme })
    );
  }
  
  /**
   * Change application language
   * @param languageCode The language code to switch to
   */
  changeLanguage(languageCode: string): void {
    if (this.isValidLanguage(languageCode)) {
      this.translateService.use(languageCode);
      this.currentLanguage.set(languageCode);
      localStorage.setItem('language', languageCode);
      
      // Show notification
      const language = this.availableLanguages.find(l => l.code === languageCode)?.name;
      this.notificationService.success(
        this.translateService.instant('header.languageChanged', { language })
      );
    }
  }
  
  /**
   * Show keyboard shortcuts dialog
   */
  showKeyboardShortcuts(): void {
    // TODO: Implement keyboard shortcuts dialog
    console.log('Show keyboard shortcuts dialog');
    
    // For now, just show a notification
    this.notificationService.info(
      this.translateService.instant('header.shortcutsComingSoon')
    );
  }
  
  /**
   * Handle avatar image load error
   * @param event The error event
   */
  handleAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/default-avatar.png';
    }
  }
  
  /**
   * Logout the current user
   */
  logout(): void {
    // Show confirmation dialog
    if (confirm(this.translateService.instant('header.logoutConfirm'))) {
      this.store.dispatch(AuthActions.logout());
      
      // Clear local storage
      localStorage.removeItem('language');
      
      // Show notification
      this.notificationService.info(
        this.translateService.instant('header.logoutSuccess')
      );
    }
  }
  
  /**
   * TrackBy function for language options
   * @param index The index of the item
   * @param item The language option
   * @returns The unique identifier for the item
   */
  trackByLanguageCode(index: number, item: LanguageOption): string {
    return item.code;
  }
}
