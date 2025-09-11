/**
 * Sidebar navigation component for the application.
 * Provides main navigation menu with collapsible behavior.
 * 
 * @component SidebarComponent
 * @module Layouts
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

interface MenuItem {
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

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
    MatRippleModule,
    MatDividerModule,
    MatExpansionModule,
    TranslateModule
  ],
  template: `
    <nav class="sidebar" [class.collapsed]="isCollapsed">
      <!-- Logo Section -->
      <div class="sidebar-header">
        <div class="logo-container" (click)="navigateHome()">
          <img 
            [src]="isCollapsed ? '/assets/logo-icon.svg' : '/assets/logo-full.svg'" 
            alt="SCRUM PM"
            class="logo"
          />
        </div>
        <button 
          class="collapse-toggle"
          (click)="toggleCollapse.emit()"
          [matTooltip]="isCollapsed ? 'Expand' : 'Collapse'"
          matTooltipPosition="right"
        >
          <mat-icon>{{ isCollapsed ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </div>

      <!-- Navigation Menu -->
      <mat-nav-list class="sidebar-menu">
        <ng-container *ngFor="let item of menuItems">
          <!-- Divider -->
          <mat-divider *ngIf="item.divider" class="menu-divider"></mat-divider>
          
          <!-- Menu Item without children -->
          <a 
            *ngIf="!item.children && !item.divider && hasPermission(item)"
            mat-list-item 
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/' }"
            (click)="onNavigate()"
            [matTooltip]="isCollapsed ? item.label : ''"
            matTooltipPosition="right"
            class="menu-item"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle *ngIf="!isCollapsed">{{ item.label | translate }}</span>
            <span 
              *ngIf="item.badge && !isCollapsed" 
              class="badge"
              [ngClass]="'badge-' + (item.badgeColor || 'primary')"
            >
              {{ item.badge }}
            </span>
          </a>

          <!-- Menu Item with children (Expandable) -->
          <mat-expansion-panel 
            *ngIf="item.children && !isCollapsed && hasPermission(item)"
            class="menu-expansion"
            [expanded]="isExpanded(item.id)"
          >
            <mat-expansion-panel-header class="menu-item">
              <mat-panel-title>
                <mat-icon>{{ item.icon }}</mat-icon>
                <span class="menu-label">{{ item.label | translate }}</span>
              </mat-panel-title>
            </mat-expansion-panel-header>
            
            <mat-nav-list class="submenu">
              <a 
                *ngFor="let child of item.children"
                mat-list-item
                [routerLink]="child.route"
                routerLinkActive="active"
                (click)="onNavigate()"
                class="submenu-item"
                [hidden]="!hasPermission(child)"
              >
                <mat-icon matListItemIcon>{{ child.icon }}</mat-icon>
                <span matListItemTitle>{{ child.label | translate }}</span>
                <span 
                  *ngIf="child.badge" 
                  class="badge"
                  [ngClass]="'badge-' + (child.badgeColor || 'primary')"
                >
                  {{ child.badge }}
                </span>
              </a>
            </mat-nav-list>
          </mat-expansion-panel>

          <!-- Collapsed menu with children (shows as single item) -->
          <a 
            *ngIf="item.children && isCollapsed && hasPermission(item)"
            mat-list-item
            [routerLink]="item.children[0]?.route"
            [matTooltip]="item.label"
            matTooltipPosition="right"
            class="menu-item"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          </a>
        </ng-container>
      </mat-nav-list>

      <!-- Bottom Section -->
      <div class="sidebar-footer">
        <!-- User Section -->
        <div class="user-section" *ngIf="currentUser">
          <img 
            [src]="currentUser.avatar || '/assets/default-avatar.svg'" 
            alt="User"
            class="user-avatar"
          />
          <div class="user-info" *ngIf="!isCollapsed">
            <span class="user-name">{{ currentUser.name }}</span>
            <span class="user-role">{{ currentUser.role }}</span>
          </div>
        </div>

        <!-- Theme Toggle -->
        <button 
          mat-icon-button
          (click)="toggleTheme()"
          [matTooltip]="'Toggle theme' | translate"
          matTooltipPosition="right"
          class="theme-toggle"
        >
          <mat-icon>{{ isDarkTheme ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .sidebar {
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: var(--sidebar-bg);
      transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
      width: 280px;
      
      &.collapsed {
        width: 80px;
      }
    }

    .sidebar-header {
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      
      .logo-container {
        cursor: pointer;
        flex: 1;
        
        .logo {
          max-width: 100%;
          height: 40px;
          object-fit: contain;
        }
      }
      
      .collapse-toggle {
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 200ms;
        
        &:hover {
          background-color: var(--hover-bg);
        }
      }
    }

    .sidebar-menu {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
      
      .menu-item {
        margin: 4px 8px;
        border-radius: 8px;
        transition: all 200ms;
        
        &:hover {
          background-color: var(--hover-bg);
        }
        
        &.active {
          background-color: var(--active-bg);
          color: var(--primary-color);
        }
        
        mat-icon {
          margin-right: 16px;
        }
      }
      
      .menu-expansion {
        background: transparent;
        box-shadow: none;
        
        .submenu {
          padding-left: 24px;
          
          .submenu-item {
            font-size: 14px;
          }
        }
      }
      
      .badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        margin-left: auto;
        
        &.badge-primary {
          background-color: var(--primary-color);
          color: white;
        }
        
        &.badge-accent {
          background-color: var(--accent-color);
          color: white;
        }
        
        &.badge-warn {
          background-color: var(--warn-color);
          color: white;
        }
      }
      
      .menu-divider {
        margin: 8px 0;
      }
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border-color);
      
      .user-section {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          
          .user-name {
            font-weight: 500;
            font-size: 14px;
          }
          
          .user-role {
            font-size: 12px;
            opacity: 0.7;
          }
        }
      }
      
      .theme-toggle {
        width: 100%;
      }
    }

    .collapsed {
      .sidebar-header {
        padding: 20px 16px;
        
        .collapse-toggle {
          margin: 0 auto;
        }
      }
      
      .sidebar-menu {
        .menu-item {
          justify-content: center;
          
          mat-icon {
            margin: 0;
          }
        }
      }
      
      .sidebar-footer {
        .user-section {
          justify-content: center;
        }
      }
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isCollapsed = false;
  @Input() mode: 'side' | 'over' = 'side';
  @Input() isMobile = false;
  @Input() expanded = true;
  
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<void>();
  @Output() toggle = new EventEmitter<void>();
  
  private destroy$ = new Subject<void>();
  
  currentUser: any;
  isDarkTheme = false;
  expandedItems = new Set<string>();
  
  menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: 'folder',
      children: [
        {
          id: 'all-projects',
          label: 'All Projects',
          icon: 'list',
          route: '/projects'
        },
        {
          id: 'my-projects',
          label: 'My Projects',
          icon: 'person',
          route: '/projects/my'
        },
        {
          id: 'archived',
          label: 'Archived',
          icon: 'archive',
          route: '/projects/archived'
        }
      ]
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: 'task_alt',
      route: '/tasks',
      badge: 5,
      badgeColor: 'warn'
    },
    {
      id: 'sprints',
      label: 'Sprints',
      icon: 'speed',
      route: '/sprints'
    },
    {
      id: 'board',
      label: 'Board',
      icon: 'view_kanban',
      route: '/board'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'analytics',
      children: [
        {
          id: 'burndown',
          label: 'Burndown Chart',
          icon: 'show_chart',
          route: '/reports/burndown'
        },
        {
          id: 'velocity',
          label: 'Velocity',
          icon: 'trending_up',
          route: '/reports/velocity'
        },
        {
          id: 'team',
          label: 'Team Performance',
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
      label: 'Team',
      icon: 'group',
      route: '/team'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: '/settings',
      permissions: ['settings.view']
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'help',
      route: '/help'
    }
  ];
  
  constructor(
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}
  
  ngOnInit(): void {
    this.loadUserData();
    this.setupTheme();
    this.trackRouteChanges();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadUserData(): void {
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
    });
  }
  
  private setupTheme(): void {
    this.themeService.isDarkTheme$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isDark => {
      this.isDarkTheme = isDark;
    });
  }
  
  private trackRouteChanges(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // Auto-expand parent items based on current route
      this.autoExpandItems();
    });
  }
  
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
  
  hasPermission(item: MenuItem): boolean {
    if (!item.permissions || item.permissions.length === 0) {
      return true;
    }
    
    return this.authService.hasAnyPermission(item.permissions);
  }
  
  isExpanded(itemId: string): boolean {
    return this.expandedItems.has(itemId);
  }
  
  navigateHome(): void {
    this.router.navigate(['/']);
    this.navigate.emit();
  }
  
  onNavigate(): void {
    this.navigate.emit();
  }
  
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
