/**
 * @fileoverview Sidebar Component
 * @module SidebarComponent
 * 
 * Main navigation sidebar component that provides:
 * - Hierarchical menu navigation
 * - Collapsible/expandable behavior
 * - Permission-based menu visibility
 * - Search functionality
 * - User profile section
 * - Theme switching
 * - Mobile responsive behavior
 * 
 * @author SCRUM Project Manager Team
 * @copyright 2025 Ximplicity Software Solutions
 */

import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

/**
 * Menu item interface
 */
export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  badge?: number;
  badgeColor?: 'primary' | 'accent' | 'warn';
  permissions?: string[];
  divider?: boolean;
}

/**
 * Sidebar navigation component
 * 
 * @example
 * ```html
 * <app-sidebar
 *   [isCollapsed]="sidebarCollapsed"
 *   [isMobile]="isMobileView"
 *   [expanded]="sidebarExpanded"
 *   (toggleCollapse)="onToggleSidebar()"
 *   (navigate)="onNavigate()">
 * </app-sidebar>
 * ```
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
    MatRippleModule,
    MatDividerModule,
    MatExpansionModule,
    MatMenuModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-10px)' }))
      ])
    ])
  ]
})
export class SidebarComponent implements OnInit, OnDestroy {
  // Service injections
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly translateService = inject(TranslateService);
  
  // Component lifecycle
  private readonly destroy$ = new Subject<void>();
  
  /**
   * Whether the sidebar is collapsed
   */
  @Input() isCollapsed = false;
  
  /**
   * Sidebar display mode
   */
  @Input() mode: 'side' | 'over' = 'side';
  
  /**
   * Whether the sidebar is in mobile mode
   */
  @Input() isMobile = false;
  
  /**
   * Whether the sidebar is expanded (mobile)
   */
  @Input() expanded = true;
  
  /**
   * Event emitted when collapse toggle is requested
   */
  @Output() toggleCollapse = new EventEmitter<void>();
  
  /**
   * Event emitted when navigation occurs
   */
  @Output() navigate = new EventEmitter<void>();
  
  /**
   * Event emitted when sidebar toggle is requested (mobile)
   */
  @Output() toggle = new EventEmitter<void>();
  
  // Component state
  searchQuery = '';
  expandedItems = new Set<string>();
  dropdownItems = new Set<string>();
  filteredMenuItems: MenuItem[] = [];
  
  // Computed signals
  currentUser = computed(() => this.authService.currentUser());
  isDarkTheme = computed(() => this.themeService.isDarkTheme());
  
  /**
   * Menu items configuration
   */
  readonly menuItems: ReadonlyArray<MenuItem> = [
    {
      id: 'dashboard',
      label: 'sidebar.dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      id: 'projects',
      label: 'sidebar.projects',
      icon: 'folder',
      children: [
        {
          id: 'all-projects',
          label: 'sidebar.allProjects',
          icon: 'list',
          route: '/projects'
        },
        {
          id: 'my-projects',
          label: 'sidebar.myProjects',
          icon: 'person',
          route: '/projects/my'
        },
        {
          id: 'archived',
          label: 'sidebar.archived',
          icon: 'archive',
          route: '/projects/archived'
        }
      ]
    },
    {
      id: 'tasks',
      label: 'sidebar.tasks',
      icon: 'task_alt',
      route: '/tasks',
      badge: 5,
      badgeColor: 'warn'
    },
    {
      id: 'sprints',
      label: 'sidebar.sprints',
      icon: 'speed',
      route: '/sprints'
    },
    {
      id: 'board',
      label: 'sidebar.board',
      icon: 'view_kanban',
      route: '/board'
    },
    {
      id: 'reports',
      label: 'sidebar.reports',
      icon: 'analytics',
      children: [
        {
          id: 'burndown',
          label: 'sidebar.burndownChart',
          icon: 'show_chart',
          route: '/reports/burndown'
        },
        {
          id: 'velocity',
          label: 'sidebar.velocity',
          icon: 'trending_up',
          route: '/reports/velocity'
        },
        {
          id: 'team-performance',
          label: 'sidebar.teamPerformance',
          icon: 'groups',
          route: '/reports/team'
        }
      ]
    },
    {
      id: 'divider-1',
      label: '',
      icon: '',
      divider: true
    },
    {
      id: 'team',
      label: 'sidebar.team',
      icon: 'group',
      route: '/team'
    },
    {
      id: 'ai-assistant',
      label: 'sidebar.aiAssistant',
      icon: 'psychology',
      route: '/ai-assistant',
      badge: 1,
      badgeColor: 'primary'
    },
    {
      id: 'settings',
      label: 'sidebar.settings',
      icon: 'settings',
      route: '/settings',
      permissions: ['settings.view']
    },
    {
      id: 'help',
      label: 'sidebar.helpSupport',
      icon: 'help',
      route: '/help'
    }
  ];
  
  /**
   * Component initialization
   */
  ngOnInit(): void {
    this.setupRouteTracking();
    this.initializeMenuItems();
  }
  
  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Setup route change tracking
   * @private
   */
  private setupRouteTracking(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.autoExpandItems();
    });
    
    // Initial expansion based on current route
    this.autoExpandItems();
  }
  
  /**
   * Initialize filtered menu items
   * @private
   */
  private initializeMenuItems(): void {
    this.filteredMenuItems = [...this.menuItems];
  }
  
  /**
   * Auto-expand parent items based on current route
   * @private
   */
  private autoExpandItems(): void {
    const currentUrl = this.router.url;
    
    this.menuItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => 
          child.route && currentUrl.startsWith(child.route)
        );
        
        if (hasActiveChild) {
          this.expandedItems.add(item.id);
        }
      }
    });
  }
  
  /**
   * Filter menu items based on search query
   */
  filterMenuItems(): void {
    if (!this.searchQuery.trim()) {
      this.filteredMenuItems = [...this.menuItems];
      return;
    }
    
    const query = this.searchQuery.toLowerCase();
    this.filteredMenuItems = this.menuItems.filter(item => {
      if (item.divider) return false;
      
      // Check main item
      const labelMatch = this.translateService
        .instant(item.label)
        .toLowerCase()
        .includes(query);
      
      // Check children
      const childMatch = item.children?.some(child =>
        this.translateService
          .instant(child.label)
          .toLowerCase()
          .includes(query)
      );
      
      return labelMatch || childMatch;
    });
  }
  
  /**
   * Clear search query and reset menu
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.filteredMenuItems = [...this.menuItems];
  }
  
  /**
   * Check if user has permission for menu item
   * @param item Menu item to check
   * @returns True if user has permission
   */
  hasPermission(item: MenuItem): boolean {
    if (!item.permissions || item.permissions.length === 0) {
      return true;
    }
    
    return this.authService.hasAnyPermission(item.permissions);
  }
  
  /**
   * Check if menu item is expanded
   * @param itemId Menu item ID
   * @returns True if expanded
   */
  isExpanded(itemId: string): boolean {
    return this.expandedItems.has(itemId);
  }
  
  /**
   * Toggle expansion state of menu item
   * @param itemId Menu item ID
   * @param expanded New expansion state
   */
  toggleExpansion(itemId: string, expanded: boolean): void {
    if (expanded) {
      this.expandedItems.add(itemId);
    } else {
      this.expandedItems.delete(itemId);
    }
  }
  
  /**
   * Show dropdown menu (collapsed mode)
   * @param itemId Menu item ID
   */
  showDropdown(itemId: string): void {
    this.dropdownItems.add(itemId);
  }
  
  /**
   * Hide dropdown menu (collapsed mode)
   * @param itemId Menu item ID
   */
  hideDropdown(itemId: string): void {
    this.dropdownItems.delete(itemId);
  }
  
  /**
   * Check if dropdown is open
   * @param itemId Menu item ID
   * @returns True if dropdown is open
   */
  isDropdownOpen(itemId: string): boolean {
    return this.dropdownItems.has(itemId);
  }
  
  /**
   * Check if route is active
   * @param route Route to check
   * @returns True if route is active
   */
  isActiveRoute(route?: string): boolean {
    if (!route) return false;
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
  
  /**
   * Navigate to home
   */
  navigateHome(): void {
    this.router.navigate(['/']);
    this.navigate.emit();
    
    if (this.isMobile) {
      this.toggle.emit();
    }
  }
  
  /**
   * Handle navigation
   * @param item Menu item navigated to
   */
  onNavigate(item: MenuItem): void {
    this.navigate.emit();
    
    if (this.isMobile) {
      this.toggle.emit();
    }
    
    // Log analytics event
    console.log('Navigation to:', item.route || item.id);
  }
  
  /**
   * Toggle theme
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
  
  /**
   * Handle avatar image error
   * @param event Error event
   */
  handleAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/default-avatar.png';
    }
  }
  
  /**
   * Logout user
   */
  logout(): void {
    if (confirm(this.translateService.instant('sidebar.logoutConfirm'))) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
  
  /**
   * TrackBy function for menu items
   * @param index Item index
   * @param item Menu item
   * @returns Unique identifier
   */
  trackById(index: number, item: MenuItem): string {
    return item.id;
  }
}
