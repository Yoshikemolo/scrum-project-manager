/**
 * Sidenav component for the application.
 * Displays navigation menu with collapsible sections and quick access items.
 */

import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  badge?: number | string;
  badgeColor?: 'primary' | 'accent' | 'warn';
  children?: NavItem[];
  roles?: string[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatExpansionModule,
    TranslateModule
  ],
  template: `
    <div class="sidenav" [class.collapsed]="isCollapsed">
      <!-- User Section -->
      <div class="user-section" *ngIf="!isCollapsed">
        <img
          [src]="userAvatar() || 'assets/images/default-avatar.png'"
          [alt]="userName()"
          class="user-avatar"
        />
        <div class="user-info">
          <div class="user-name">{{ userName() }}</div>
          <div class="user-role">{{ userRole() }}</div>
        </div>
      </div>
      
      <mat-divider *ngIf="!isCollapsed"></mat-divider>
      
      <!-- Navigation Items -->
      <mat-nav-list class="nav-list">
        <ng-container *ngFor="let item of navItems">
          <ng-container *ngIf="canShowItem(item)">
            <!-- Single Item -->
            <a
              mat-list-item
              *ngIf="!item.children"
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              (click)="onNavigate()"
              [matTooltip]="isCollapsed ? (item.label | translate) : ''"
              matTooltipPosition="right"
              class="nav-item"
            >
              <mat-icon
                matListItemIcon
                [matBadge]="item.badge"
                [matBadgeColor]="item.badgeColor || 'primary'"
                [matBadgeHidden]="!item.badge"
                matBadgeSize="small"
              >
                {{ item.icon }}
              </mat-icon>
              <span matListItemTitle class="nav-label" *ngIf="!isCollapsed">
                {{ item.label | translate }}
              </span>
            </a>
            
            <!-- Group Item -->
            <div *ngIf="item.children && !isCollapsed" class="nav-group">
              <mat-expansion-panel
                [expanded]="item.expanded || false"
                (expandedChange)="item.expanded = $event"
                class="nav-expansion"
              >
                <mat-expansion-panel-header class="nav-group-header">
                  <mat-panel-title>
                    <mat-icon class="nav-group-icon">{{ item.icon }}</mat-icon>
                    <span class="nav-group-label">{{ item.label | translate }}</span>
                  </mat-panel-title>
                </mat-expansion-panel-header>
                
                <mat-nav-list class="nav-sublist">
                  <a
                    mat-list-item
                    *ngFor="let child of item.children"
                    [routerLink]="child.route"
                    routerLinkActive="active"
                    (click)="onNavigate()"
                    class="nav-subitem"
                  >
                    <mat-icon matListItemIcon>{{ child.icon }}</mat-icon>
                    <span matListItemTitle class="nav-label">
                      {{ child.label | translate }}
                    </span>
                  </a>
                </mat-nav-list>
              </mat-expansion-panel>
            </div>
            
            <!-- Collapsed Group -->
            <button
              mat-list-item
              *ngIf="item.children && isCollapsed"
              [matTooltip]="item.label | translate"
              matTooltipPosition="right"
              (click)="expandAndNavigate(item)"
              class="nav-item"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            </button>
          </ng-container>
        </ng-container>
      </mat-nav-list>
      
      <div class="nav-footer">
        <mat-divider></mat-divider>
        
        <!-- Quick Actions -->
        <mat-nav-list class="quick-actions">
          <button
            mat-list-item
            (click)="toggleCollapse.emit()"
            [matTooltip]="isCollapsed ? ('sidenav.expand' | translate) : ('sidenav.collapse' | translate)"
            matTooltipPosition="right"
            class="nav-item"
          >
            <mat-icon matListItemIcon>
              {{ isCollapsed ? 'chevron_right' : 'chevron_left' }}
            </mat-icon>
            <span matListItemTitle class="nav-label" *ngIf="!isCollapsed">
              {{ 'sidenav.collapse' | translate }}
            </span>
          </button>
        </mat-nav-list>
      </div>
    </div>
  `,
  styles: [`
    .sidenav {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--surface-color);
      transition: width var(--transition-base);
      overflow-x: hidden;
      
      &.collapsed {
        width: 64px;
      }
    }
    
    .user-section {
      padding: var(--spacing-lg) var(--spacing-md);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      background: rgba(var(--primary-color), 0.05);
    }
    
    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }
    
    .user-info {
      flex: 1;
      overflow: hidden;
    }
    
    .user-name {
      font-weight: 600;
      font-size: 0.95rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .user-role {
      font-size: 0.85rem;
      opacity: 0.7;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .nav-list {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-sm) 0;
    }
    
    .nav-item {
      margin: 2px var(--spacing-sm);
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
      
      &:hover {
        background: rgba(var(--primary-color), 0.08);
      }
      
      &.active {
        background: rgba(var(--primary-color), 0.12);
        color: var(--primary-color);
        
        mat-icon {
          color: var(--primary-color);
        }
      }
    }
    
    .nav-label {
      margin-left: var(--spacing-sm);
    }
    
    .nav-group {
      margin: var(--spacing-xs) var(--spacing-sm);
    }
    
    .nav-expansion {
      background: transparent;
      box-shadow: none;
      
      ::ng-deep {
        .mat-expansion-panel-body {
          padding: 0;
        }
      }
    }
    
    .nav-group-header {
      padding: 0 var(--spacing-md);
      height: 48px;
      
      &:hover {
        background: rgba(var(--primary-color), 0.08);
      }
    }
    
    .nav-group-icon {
      margin-right: var(--spacing-sm);
    }
    
    .nav-group-label {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    
    .nav-sublist {
      padding: 0;
    }
    
    .nav-subitem {
      padding-left: calc(var(--spacing-lg) + var(--spacing-md));
      margin: 2px var(--spacing-sm);
      border-radius: var(--radius-sm);
      
      &:hover {
        background: rgba(var(--primary-color), 0.08);
      }
      
      &.active {
        background: rgba(var(--primary-color), 0.12);
        color: var(--primary-color);
      }
    }
    
    .nav-footer {
      margin-top: auto;
    }
    
    .quick-actions {
      padding: var(--spacing-sm) 0;
    }
    
    mat-icon {
      margin-right: 0;
    }
    
    .collapsed {
      .nav-item,
      .nav-group {
        ::ng-deep {
          .mat-list-item-content {
            justify-content: center;
          }
        }
      }
    }
  `]
})
export class SidenavComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<void>();
  
  // User info signals
  userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });
  
  userRole = computed(() => {
    const user = this.authService.currentUser();
    return user?.roles?.[0]?.name || 'User';
  });
  
  userAvatar = computed(() => {
    const user = this.authService.currentUser();
    return user?.avatar;
  });
  
  // Navigation items
  navItems: NavItem[] = [
    {
      label: 'sidenav.dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      badge: undefined
    },
    {
      label: 'sidenav.projects',
      icon: 'folder',
      route: '/projects',
      badge: '3',
      badgeColor: 'primary'
    },
    {
      label: 'sidenav.sprints',
      icon: 'schedule',
      children: [
        {
          label: 'sidenav.activeSprints',
          icon: 'play_circle',
          route: '/sprints/active'
        },
        {
          label: 'sidenav.planning',
          icon: 'event',
          route: '/sprints/planning'
        },
        {
          label: 'sidenav.retrospectives',
          icon: 'history',
          route: '/sprints/retrospectives'
        }
      ],
      expanded: false
    },
    {
      label: 'sidenav.tasks',
      icon: 'task_alt',
      children: [
        {
          label: 'sidenav.kanban',
          icon: 'view_kanban',
          route: '/tasks/board'
        },
        {
          label: 'sidenav.myTasks',
          icon: 'assignment_ind',
          route: '/tasks/my-tasks',
          badge: '5',
          badgeColor: 'warn'
        },
        {
          label: 'sidenav.backlog',
          icon: 'list_alt',
          route: '/tasks/backlog'
        }
      ],
      expanded: false
    },
    {
      label: 'sidenav.team',
      icon: 'groups',
      route: '/team'
    },
    {
      label: 'sidenav.reports',
      icon: 'analytics',
      children: [
        {
          label: 'sidenav.velocity',
          icon: 'speed',
          route: '/reports/velocity'
        },
        {
          label: 'sidenav.burndown',
          icon: 'trending_down',
          route: '/reports/burndown'
        },
        {
          label: 'sidenav.performance',
          icon: 'insights',
          route: '/reports/performance'
        }
      ],
      roles: ['admin', 'manager'],
      expanded: false
    },
    {
      label: 'sidenav.admin',
      icon: 'admin_panel_settings',
      children: [
        {
          label: 'sidenav.users',
          icon: 'people',
          route: '/admin/users'
        },
        {
          label: 'sidenav.settings',
          icon: 'settings',
          route: '/admin/settings'
        },
        {
          label: 'sidenav.integrations',
          icon: 'extension',
          route: '/admin/integrations'
        }
      ],
      roles: ['admin'],
      expanded: false
    }
  ];
  
  constructor() {
    this.trackNavigationChanges();
  }
  
  /**
   * Track navigation changes to auto-expand groups
   */
  private trackNavigationChanges(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.expandActiveGroup(event.url);
      });
  }
  
  /**
   * Expand group containing active route
   */
  private expandActiveGroup(url: string): void {
    this.navItems.forEach(item => {
      if (item.children) {
        item.expanded = item.children.some(child => 
          child.route && url.startsWith(child.route)
        );
      }
    });
  }
  
  /**
   * Check if user can see nav item based on roles
   */
  canShowItem(item: NavItem): boolean {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    
    return item.roles.some(role => this.authService.hasRole(role));
  }
  
  /**
   * Handle navigation
   */
  onNavigate(): void {
    this.navigate.emit();
  }
  
  /**
   * Expand sidebar and navigate to first child
   */
  expandAndNavigate(item: NavItem): void {
    if (item.children && item.children.length > 0) {
      this.toggleCollapse.emit();
      setTimeout(() => {
        const firstChild = item.children![0];
        if (firstChild.route) {
          this.router.navigate([firstChild.route]);
        }
      }, 300);
    }
  }
}
