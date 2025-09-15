/**
 * @fileoverview Footer Component
 * @module FooterComponent
 * 
 * Application footer component that provides:
 * - Copyright and version information
 * - Navigation links
 * - Social media links
 * - System status indicator
 * - Language display
 * - Responsive mobile footer
 * 
 * @author SCRUM Project Manager Team
 * @copyright 2025 Ximplicity Software Solutions
 */

import { 
  Component, 
  OnInit, 
  OnDestroy, 
  signal, 
  computed,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

/**
 * Footer link interface
 */
interface FooterLink {
  label: string;
  route: string;
  icon?: string;
}

/**
 * Social link interface
 */
interface SocialLink {
  label: string;
  icon: string;
  url: string;
  svgIcon?: boolean;
}

/**
 * Footer component for the application
 * 
 * @example
 * ```html
 * <app-footer></app-footer>
 * ```
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnInit, OnDestroy {
  // Service injections
  private readonly translateService = inject(TranslateService);
  
  // Component lifecycle
  private readonly destroy$ = new Subject<void>();
  
  // Event listeners references for cleanup
  private onlineHandler?: () => void;
  private offlineHandler?: () => void;
  
  // Component state
  readonly currentYear = new Date().getFullYear();
  readonly appVersion = environment.appVersion;
  readonly isProduction = environment.production;
  readonly environmentName = environment.name || 'development';
  
  // Signals
  isOnline = signal(navigator.onLine);
  showBackToTop = signal(false);
  currentLanguage = computed(() => this.translateService.currentLang);
  
  // Performance metrics (development only)
  showPerformanceMetrics = !environment.production;
  loadTime = 0;
  memoryUsage = 0;
  scrollHandlerCallCount = 0;
  
  /**
   * Footer navigation links
   */
  readonly footerLinks: ReadonlyArray<FooterLink> = [
    { label: 'footer.documentation', route: '/docs' },
    { label: 'footer.support', route: '/support' },
    { label: 'footer.privacy', route: '/privacy' },
    { label: 'footer.terms', route: '/terms' },
    { label: 'footer.about', route: '/about' }
  ];
  
  /**
   * Mobile footer navigation links
   */
  readonly mobileFooterLinks: ReadonlyArray<FooterLink> = [
    { label: 'footer.home', route: '/dashboard', icon: 'home' },
    { label: 'footer.projects', route: '/projects', icon: 'folder' },
    { label: 'footer.tasks', route: '/tasks', icon: 'task_alt' },
    { label: 'footer.profile', route: '/profile', icon: 'person' }
  ];
  
  /**
   * Social media links
   */
  readonly socialLinks: ReadonlyArray<SocialLink> = [
    {
      label: 'GitHub',
      icon: 'code',
      url: 'https://github.com/Yoshikemolo/scrum-project-manager'
    },
    {
      label: 'LinkedIn',
      icon: 'business',
      url: 'https://linkedin.com/company/ximplicity'
    },
    {
      label: 'Twitter',
      icon: 'tag',
      url: 'https://twitter.com/ximplicity'
    },
    {
      label: 'YouTube',
      icon: 'play_circle',
      url: 'https://youtube.com/@ximplicity'
    }
  ];
  
  /**
   * Component initialization
   */
  ngOnInit(): void {
    this.recordLoadTime();
    this.setupOnlineListener();
    this.setupScrollListener();
    this.calculateMemoryUsage();
  }
  
  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    // Clean up event listeners
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }
    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
    }
    
    // Complete subjects
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Record component load time for performance metrics
   * @private
   */
  private recordLoadTime(): void {
    if (!this.isProduction && performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const navigationEntry = navigationEntries[0];
        this.loadTime = Math.round(navigationEntry.loadEventEnd - navigationEntry.fetchStart);
      }
    }
  }
  
  /**
   * Calculate memory usage for performance metrics
   * @private
   */
  private calculateMemoryUsage(): void {
    if (!this.isProduction && 'memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        this.memoryUsage = Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100;
      }
    }
  }
  
  /**
   * Setup online/offline status listener
   * @private
   */
  private setupOnlineListener(): void {
    this.onlineHandler = () => {
      this.isOnline.set(true);
      console.log('System is online');
    };
    
    this.offlineHandler = () => {
      this.isOnline.set(false);
      console.warn('System is offline');
    };
    
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }
  
  /**
   * Setup scroll listener for back-to-top button
   * @private
   */
  private setupScrollListener(): void {
    fromEvent(window, 'scroll')
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.scrollHandlerCallCount++;
        const scrolled = window.pageYOffset || document.documentElement.scrollTop;
        this.showBackToTop.set(scrolled > 300);
      });
  }
  
  /**
   * Scroll to top of the page
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  
  /**
   * TrackBy function for footer links
   * @param index The index of the item
   * @param item The footer link
   * @returns The unique identifier for the item
   */
  trackByRoute(index: number, item: FooterLink): string {
    return item.route;
  }
  
  /**
   * TrackBy function for social links
   * @param index The index of the item
   * @param item The social link
   * @returns The unique identifier for the item
   */
  trackByUrl(index: number, item: SocialLink): string {
    return item.url;
  }
}
