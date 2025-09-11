/**
 * Root component of the SCRUM Project Manager application.
 * Manages the overall layout and initializes core services.
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import { SidenavComponent } from './layouts/sidenav/sidenav.component';
import { HeaderComponent } from './layouts/header/header.component';
import { FooterComponent } from './layouts/footer/footer.component';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { NotificationCenterComponent } from './shared/components/notification-center/notification-center.component';

import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { LoaderService } from './core/services/loader.service';
import { WebSocketService } from './core/services/websocket.service';
import { ShortcutService } from './core/services/shortcut.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    TranslateModule,
    SidenavComponent,
    HeaderComponent,
    FooterComponent,
    LoaderComponent,
    NotificationCenterComponent
  ],
  template: `
    <div class="app-container" [class.dark-theme]="isDarkTheme()">
      <!-- Global Loader -->
      <app-loader *ngIf="isLoading()"></app-loader>
      
      <!-- Main Layout -->
      <mat-sidenav-container class="sidenav-container" [hasBackdrop]="isMobile()">
        <!-- Side Navigation -->
        <mat-sidenav
          #sidenav
          [mode]="sidenavMode()"
          [opened]="sidenavOpened()"
          [fixedInViewport]="isMobile()"
          class="sidenav"
          (closedStart)="onSidenavClose()"
        >
          <app-sidenav
            [isCollapsed]="sidenavCollapsed()"
            (toggleCollapse)="toggleSidenavCollapse()"
            (navigate)="onNavigate()"
          ></app-sidenav>
        </mat-sidenav>
        
        <!-- Main Content -->
        <mat-sidenav-content class="main-content">
          <!-- Header -->
          <app-header
            [sidenavOpened]="sidenavOpened()"
            (toggleSidenav)="toggleSidenav()"
            (toggleNotifications)="toggleNotifications()"
          ></app-header>
          
          <!-- Router Outlet with Animation -->
          <main class="content-wrapper" [@routeAnimations]="prepareRoute(outlet)">
            <router-outlet #outlet="outlet"></router-outlet>
          </main>
          
          <!-- Footer -->
          <app-footer *ngIf="!isMobile()"></app-footer>
        </mat-sidenav-content>
      </mat-sidenav-container>
      
      <!-- Notification Center -->
      <app-notification-center
        [isOpen]="notificationsOpen()"
        (close)="closeNotifications()"
      ></app-notification-center>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .sidenav-container {
      flex: 1;
      overflow: hidden;
    }
    
    .sidenav {
      width: 260px;
      transition: width 0.3s ease;
      
      &.collapsed {
        width: 64px;
      }
    }
    
    .main-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    
    .content-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      background-color: var(--background-color);
      
      @media (max-width: 768px) {
        padding: 16px;
      }
    }
    
    ::ng-deep {
      .mat-drawer-backdrop.mat-drawer-shown {
        background-color: rgba(0, 0, 0, 0.6);
      }
    }
  `],
  animations: [
    // Route animations will be defined in animations file
  ]
})
export class AppComponent implements OnInit {
  private store = inject(Store);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private loaderService = inject(LoaderService);
  private wsService = inject(WebSocketService);
  private shortcutService = inject(ShortcutService);
  private translateService = inject(TranslateService);
  private toastr = inject(ToastrService);
  private breakpointObserver = inject(BreakpointObserver);
  
  // Signals for reactive state
  isDarkTheme = signal(false);
  isLoading = signal(false);
  sidenavOpened = signal(true);
  sidenavCollapsed = signal(false);
  notificationsOpen = signal(false);
  isMobile = signal(false);
  
  // Computed values
  sidenavMode = computed(() => this.isMobile() ? 'over' : 'side');
  
  ngOnInit(): void {
    this.initializeApp();
    this.setupResponsive();
    this.setupTheme();
    this.setupTranslations();
    this.setupWebSocket();
    this.setupShortcuts();
    this.setupLoader();
  }
  
  /**
   * Initialize core application services
   */
  private initializeApp(): void {
    // Check authentication status
    this.authService.checkAuthStatus();
    
    // Initialize service worker for PWA
    if ('serviceWorker' in navigator && environment.features.enableServiceWorker) {
      navigator.serviceWorker.register('/ngsw-worker.js');
    }
  }
  
  /**
   * Setup responsive behavior
   */
  private setupResponsive(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .subscribe(result => {
        this.isMobile.set(result.matches);
        if (result.matches) {
          this.sidenavOpened.set(false);
        } else {
          this.sidenavOpened.set(true);
        }
      });
  }
  
  /**
   * Setup theme management
   */
  private setupTheme(): void {
    this.themeService.isDarkTheme$.subscribe(isDark => {
      this.isDarkTheme.set(isDark);
    });
  }
  
  /**
   * Setup translations
   */
  private setupTranslations(): void {
    const defaultLang = localStorage.getItem('language') || environment.i18n.defaultLanguage;
    this.translateService.setDefaultLang(defaultLang);
    this.translateService.use(defaultLang);
  }
  
  /**
   * Setup WebSocket connection
   */
  private setupWebSocket(): void {
    if (this.authService.isAuthenticated()) {
      this.wsService.connect();
    }
  }
  
  /**
   * Setup keyboard shortcuts
   */
  private setupShortcuts(): void {
    // Global shortcuts
    this.shortcutService.add('ctrl+k', () => {
      // Open command palette
      console.log('Command palette opened');
    });
    
    this.shortcutService.add('ctrl+/', () => {
      // Toggle sidebar
      this.toggleSidenav();
    });
    
    this.shortcutService.add('ctrl+shift+n', () => {
      // Toggle notifications
      this.toggleNotifications();
    });
  }
  
  /**
   * Setup loader service
   */
  private setupLoader(): void {
    this.loaderService.loading$.subscribe(loading => {
      this.isLoading.set(loading);
    });
  }
  
  /**
   * Toggle sidenav open/close
   */
  toggleSidenav(): void {
    this.sidenavOpened.update(opened => !opened);
  }
  
  /**
   * Toggle sidenav collapse/expand
   */
  toggleSidenavCollapse(): void {
    this.sidenavCollapsed.update(collapsed => !collapsed);
  }
  
  /**
   * Handle sidenav close event
   */
  onSidenavClose(): void {
    if (this.isMobile()) {
      this.sidenavOpened.set(false);
    }
  }
  
  /**
   * Handle navigation
   */
  onNavigate(): void {
    if (this.isMobile()) {
      this.sidenavOpened.set(false);
    }
  }
  
  /**
   * Toggle notifications panel
   */
  toggleNotifications(): void {
    this.notificationsOpen.update(open => !open);
  }
  
  /**
   * Close notifications panel
   */
  closeNotifications(): void {
    this.notificationsOpen.set(false);
  }
  
  /**
   * Prepare route for animation
   */
  prepareRoute(outlet: RouterOutlet): string {
    return outlet?.activatedRouteData?.['animation'] || '';
  }
}

// Import environment
import { environment } from '../environments/environment';
