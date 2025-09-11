/**
 * Header component for the application.
 * Displays navigation bar, user menu, notifications, and global search.
 */

import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ShortcutService } from '../../core/services/shortcut.service';
import * as AuthActions from '../../store/auth/auth.actions';
import * as fromAuth from '../../store/auth/auth.selectors';

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
    TranslateModule
  ],
  template: `
    <mat-toolbar class="header" [class.elevated]="scrolled()">
      <div class="header-container">
        <!-- Left Section -->
        <div class="header-left">
          <!-- Menu Toggle -->
          <button
            mat-icon-button
            (click)="toggleSidenav.emit()"
            [matTooltip]="'header.toggleMenu' | translate"
            matTooltipPosition="below"
            class="menu-toggle"
          >
            <mat-icon>{{ sidenavOpened ? 'menu_open' : 'menu' }}</mat-icon>
          </button>
          
          <!-- Logo -->
          <div class="logo" routerLink="/dashboard">
            <img src="assets/logo.svg" alt="SCRUM PM" class="logo-image" />
            <span class="logo-text">SCRUM PM</span>
          </div>
        </div>
        
        <!-- Center Section - Search -->
        <div class="header-center">
          <mat-form-field
            class="search-field"
            appearance="outline"
            floatLabel="never"
          >
            <mat-icon matPrefix>search</mat-icon>
            <input
              matInput
              id="global-search"
              type="search"
              [placeholder]="'header.search' | translate"
              [(ngModel)]="searchQuery"
              (keyup.enter)="onSearch()"
              (keyup.escape)="clearSearch()"
            />
            <button
              mat-icon-button
              matSuffix
              *ngIf="searchQuery"
              (click)="clearSearch()"
              [matTooltip]="'header.clearSearch' | translate"
            >
              <mat-icon>close</mat-icon>
            </button>
            <mat-hint class="search-hint">{{ 'header.searchHint' | translate }}</mat-hint>
          </mat-form-field>
        </div>
        
        <!-- Right Section -->
        <div class="header-right">
          <!-- Quick Actions -->
          <button
            mat-icon-button
            routerLink="/tasks/new"
            [matTooltip]="'header.createTask' | translate"
            matTooltipPosition="below"
          >
            <mat-icon>add_task</mat-icon>
          </button>
          
          <!-- AI Assistant -->
          <button
            mat-icon-button
            routerLink="/ai-assistant"
            [matTooltip]="'header.aiAssistant' | translate"
            matTooltipPosition="below"
            class="ai-button"
          >
            <mat-icon>psychology</mat-icon>
          </button>
          
          <!-- Theme Toggle -->
          <button
            mat-icon-button
            (click)="toggleTheme()"
            [matTooltip]="'header.toggleTheme' | translate"
            matTooltipPosition="below"
          >
            <mat-icon>{{ isDarkTheme() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
          
          <!-- Notifications -->
          <button
            mat-icon-button
            [matBadge]="unreadNotifications()"
            [matBadgeHidden]="unreadNotifications() === 0"
            matBadgeColor="warn"
            matBadgeSize="small"
            (click)="toggleNotifications.emit()"
            [matTooltip]="'header.notifications' | translate"
            matTooltipPosition="below"
          >
            <mat-icon>notifications</mat-icon>
          </button>
          
          <!-- Language Selector -->
          <button
            mat-icon-button
            [matMenuTriggerFor]="languageMenu"
            [matTooltip]="'header.language' | translate"
            matTooltipPosition="below"
          >
            <mat-icon>language</mat-icon>
          </button>
          
          <mat-menu #languageMenu="matMenu">
            <button
              mat-menu-item
              *ngFor="let lang of availableLanguages"
              (click)="changeLanguage(lang.code)"
              [class.active]="currentLanguage === lang.code"
            >
              <mat-icon *ngIf="currentLanguage === lang.code">check</mat-icon>
              <span>{{ lang.name }}</span>
            </button>
          </mat-menu>
          
          <!-- User Menu -->
          <button
            mat-icon-button
            [matMenuTriggerFor]="userMenu"
            class="user-menu-trigger"
          >
            <img
              [src]="userAvatar() || 'assets/images/default-avatar.png'"
              [alt]="userName()"
              class="user-avatar"
            />
          </button>
          
          <mat-menu #userMenu="matMenu" class="user-menu">
            <div class="user-info" (click)="$event.stopPropagation()">
              <img
                [src]="userAvatar() || 'assets/images/default-avatar.png'"
                [alt]="userName()"
                class="user-avatar-large"
              />
              <div class="user-details">
                <div class="user-name">{{ userName() }}</div>
                <div class="user-email">{{ userEmail() }}</div>
                <div class="user-role" *ngIf="userRole()">
                  <mat-icon class="role-icon">badge</mat-icon>
                  {{ userRole() }}
                </div>
              </div>
            </div>
            
            <mat-divider></mat-divider>
            
            <button mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon>
              <span>{{ 'header.profile' | translate }}</span>
            </button>
            
            <button mat-menu-item routerLink="/settings">
              <mat-icon>settings</mat-icon>
              <span>{{ 'header.settings' | translate }}</span>
            </button>
            
            <button mat-menu-item (click)="showKeyboardShortcuts()">
              <mat-icon>keyboard</mat-icon>
              <span>{{ 'header.shortcuts' | translate }}</span>
            </button>
            
            <mat-divider></mat-divider>
            
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>{{ 'header.logout' | translate }}</span>
            </button>
          </mat-menu>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="progress-bar" *ngIf="isLoading()">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: var(--z-sticky);
      background: var(--surface-color);
      transition: box-shadow var(--transition-base);
      
      &.elevated {
        box-shadow: var(--shadow-md);
      }
    }
    
    .header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: var(--spacing-md);
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      cursor: pointer;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-sm);
      transition: background-color var(--transition-fast);
      
      &:hover {
        background-color: rgba(var(--primary-color), 0.1);
      }
    }
    
    .logo-image {
      width: 32px;
      height: 32px;
    }
    
    .logo-text {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary-color);
      
      @media (max-width: 768px) {
        display: none;
      }
    }
    
    .header-center {
      flex: 1;
      max-width: 600px;
      
      @media (max-width: 768px) {
        display: none;
      }
    }
    
    .search-field {
      width: 100%;
      
      ::ng-deep {
        .mat-mdc-form-field-wrapper {
          padding: 0;
        }
        
        .mat-mdc-text-field-wrapper {
          height: 40px;
        }
        
        .mat-mdc-form-field-infix {
          padding: 8px 0;
        }
        
        .mat-mdc-form-field-hint-wrapper {
          display: none;
        }
      }
    }
    
    .search-hint {
      font-size: 0.75rem;
      opacity: 0.7;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }
    
    .ai-button {
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        top: 8px;
        right: 8px;
        width: 6px;
        height: 6px;
        background: #4caf50;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.5;
        transform: scale(1.5);
      }
    }
    
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .user-menu {
      min-width: 280px;
    }
    
    .user-info {
      padding: var(--spacing-md);
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }
    
    .user-avatar-large {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .user-details {
      flex: 1;
    }
    
    .user-name {
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 2px;
    }
    
    .user-email {
      font-size: 0.9rem;
      opacity: 0.7;
      margin-bottom: 4px;
    }
    
    .user-role {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      color: var(--primary-color);
      
      .role-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    
    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
    }
    
    .active {
      background-color: rgba(var(--primary-color), 0.1);
    }
  `]
})
export class HeaderComponent {
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly translateService = inject(TranslateService);
  private readonly shortcutService = inject(ShortcutService);
  
  @Input() sidenavOpened = false;
  @Output() toggleSidenav = new EventEmitter<void>();
  @Output() toggleNotifications = new EventEmitter<void>();
  
  // Signals
  searchQuery = '';
  currentLanguage = this.translateService.currentLang;
  scrolled = signal(false);
  isLoading = signal(false);
  unreadNotifications = signal(5); // TODO: Connect to real notifications
  
  // Computed signals from store
  userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });
  
  userEmail = computed(() => {
    const user = this.authService.currentUser();
    return user?.email || '';
  });
  
  userAvatar = computed(() => {
    const user = this.authService.currentUser();
    return user?.avatar;
  });
  
  userRole = computed(() => {
    const user = this.authService.currentUser();
    return user?.roles?.[0]?.name;
  });
  
  isDarkTheme = computed(() => {
    return this.themeService.currentTheme() === 'dark';
  });
  
  availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
    { code: 'it', name: 'Italiano' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' }
  ];
  
  constructor() {
    this.setupScrollListener();
  }
  
  /**
   * Setup scroll listener for header elevation
   */
  private setupScrollListener(): void {
    window.addEventListener('scroll', () => {
      this.scrolled.set(window.scrollY > 10);
    });
  }
  
  /**
   * Handle search
   */
  onSearch(): void {
    if (this.searchQuery.trim()) {
      // TODO: Implement global search
      console.log('Searching for:', this.searchQuery);
    }
  }
  
  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchQuery = '';
  }
  
  /**
   * Toggle theme
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
  
  /**
   * Change language
   */
  changeLanguage(lang: string): void {
    this.translateService.use(lang);
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
  }
  
  /**
   * Show keyboard shortcuts dialog
   */
  showKeyboardShortcuts(): void {
    // TODO: Implement shortcuts dialog
    console.log('Show keyboard shortcuts');
  }
  
  /**
   * Logout user
   */
  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
