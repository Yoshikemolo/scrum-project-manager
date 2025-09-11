/**
 * Notification center component.
 * Displays a slide-out panel with user notifications.
 */

import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { formatDistanceToNow } from 'date-fns';

import { INotification, NotificationType, NotificationPriority } from '@scrum-pm/shared/interfaces';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatBadgeModule,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    MatCheckboxModule,
    TranslateModule
  ],
  template: `
    <div class="notification-panel" [class.open]="isOpen" @slideIn>
      <!-- Header -->
      <div class="panel-header">
        <h2 class="panel-title">{{ 'notifications.title' | translate }}</h2>
        
        <div class="header-actions">
          <button
            mat-icon-button
            [matMenuTriggerFor]="filterMenu"
            [matTooltip]="'notifications.filter' | translate"
          >
            <mat-icon>filter_list</mat-icon>
          </button>
          
          <mat-menu #filterMenu="matMenu">
            <button mat-menu-item (click)="filterByType('all')">
              <mat-icon>all_inclusive</mat-icon>
              <span>{{ 'notifications.all' | translate }}</span>
            </button>
            <button mat-menu-item (click)="filterByType('unread')">
              <mat-icon>mark_email_unread</mat-icon>
              <span>{{ 'notifications.unread' | translate }}</span>
            </button>
            <button mat-menu-item (click)="filterByType('urgent')">
              <mat-icon>priority_high</mat-icon>
              <span>{{ 'notifications.urgent' | translate }}</span>
            </button>
          </mat-menu>
          
          <button
            mat-icon-button
            (click)="markAllAsRead()"
            [matTooltip]="'notifications.markAllRead' | translate"
            [disabled]="unreadCount() === 0"
          >
            <mat-icon>done_all</mat-icon>
          </button>
          
          <button
            mat-icon-button
            (click)="close.emit()"
            [matTooltip]="'notifications.close' | translate"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      
      <!-- Tabs -->
      <mat-tab-group class="notification-tabs">
        <!-- All Notifications -->
        <mat-tab [label]="'notifications.allTab' | translate">
          <div class="notification-list">
            <div *ngIf="filteredNotifications().length === 0" class="empty-state">
              <mat-icon>notifications_none</mat-icon>
              <p>{{ 'notifications.empty' | translate }}</p>
            </div>
            
            <mat-list *ngIf="filteredNotifications().length > 0">
              <mat-list-item
                *ngFor="let notification of filteredNotifications()"
                class="notification-item"
                [class.unread]="!notification.isRead"
                [class.urgent]="notification.priority === 'URGENT'"
                (click)="onNotificationClick(notification)"
              >
                <mat-icon matListItemIcon [class]="getNotificationIconClass(notification.type)">
                  {{ getNotificationIcon(notification.type) }}
                </mat-icon>
                
                <div matListItemTitle class="notification-content">
                  <div class="notification-header">
                    <span class="notification-title">{{ notification.title }}</span>
                    <span class="notification-time">
                      {{ formatTime(notification.createdAt) }}
                    </span>
                  </div>
                  <div class="notification-message">
                    {{ notification.message }}
                  </div>
                  
                  <div class="notification-actions" *ngIf="notification.actionUrl">
                    <a
                      [routerLink]="notification.actionUrl"
                      class="notification-action"
                      (click)="close.emit()"
                    >
                      {{ notification.actionText || ('notifications.viewDetails' | translate) }}
                      <mat-icon>arrow_forward</mat-icon>
                    </a>
                  </div>
                </div>
                
                <button
                  mat-icon-button
                  matListItemMeta
                  (click)="deleteNotification(notification); $event.stopPropagation()"
                  [matTooltip]="'notifications.delete' | translate"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </mat-list-item>
            </mat-list>
          </div>
        </mat-tab>
        
        <!-- Settings Tab -->
        <mat-tab [label]="'notifications.settingsTab' | translate">
          <div class="settings-content">
            <h3>{{ 'notifications.preferences' | translate }}</h3>
            
            <mat-list>
              <mat-list-item *ngFor="let setting of notificationSettings">
                <mat-checkbox
                  [(ngModel)]="setting.enabled"
                  (change)="updateSettings()"
                >
                  {{ setting.label | translate }}
                </mat-checkbox>
              </mat-list-item>
            </mat-list>
            
            <div class="settings-actions">
              <button mat-raised-button color="primary" (click)="saveSettings()">
                {{ 'notifications.saveSettings' | translate }}
              </button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .notification-panel {
      position: fixed;
      top: 64px;
      right: -400px;
      width: 400px;
      height: calc(100vh - 64px);
      background: var(--surface-color);
      box-shadow: var(--shadow-xl);
      transition: right var(--transition-base);
      z-index: var(--z-modal-backdrop);
      display: flex;
      flex-direction: column;
      
      &.open {
        right: 0;
      }
    }
    
    .panel-header {
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .panel-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
    }
    
    .header-actions {
      display: flex;
      gap: var(--spacing-xs);
    }
    
    .notification-tabs {
      flex: 1;
      overflow: hidden;
      
      ::ng-deep {
        .mat-mdc-tab-body-wrapper {
          flex: 1;
        }
        
        .mat-mdc-tab-body {
          height: 100%;
        }
      }
    }
    
    .notification-list {
      height: 100%;
      overflow-y: auto;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      color: var(--text-secondary-color);
      
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        opacity: 0.3;
      }
      
      p {
        margin-top: var(--spacing-md);
        font-size: 1.1rem;
      }
    }
    
    .notification-item {
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      transition: background-color var(--transition-fast);
      
      &:hover {
        background: rgba(var(--primary-color), 0.05);
      }
      
      &.unread {
        background: rgba(var(--primary-color), 0.08);
        
        .notification-title {
          font-weight: 600;
        }
      }
      
      &.urgent {
        border-left: 4px solid var(--warn-color);
      }
    }
    
    .notification-content {
      flex: 1;
    }
    
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xs);
    }
    
    .notification-title {
      font-size: 0.95rem;
      color: var(--text-color);
    }
    
    .notification-time {
      font-size: 0.75rem;
      color: var(--text-secondary-color);
      white-space: nowrap;
    }
    
    .notification-message {
      font-size: 0.875rem;
      color: var(--text-secondary-color);
      line-height: 1.4;
      margin-bottom: var(--spacing-xs);
    }
    
    .notification-actions {
      margin-top: var(--spacing-sm);
    }
    
    .notification-action {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--primary-color);
      text-decoration: none;
      font-size: 0.875rem;
      
      &:hover {
        text-decoration: underline;
      }
      
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    
    .settings-content {
      padding: var(--spacing-lg);
      
      h3 {
        margin-top: 0;
        margin-bottom: var(--spacing-md);
      }
    }
    
    .settings-actions {
      margin-top: var(--spacing-lg);
      display: flex;
      justify-content: flex-end;
    }
    
    // Icon colors based on notification type
    .icon-success {
      color: var(--success-color);
    }
    
    .icon-warning {
      color: var(--warn-color);
    }
    
    .icon-error {
      color: var(--error-color);
    }
    
    .icon-info {
      color: var(--info-color);
    }
  `]
})
export class NotificationCenterComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  
  // Signals
  notifications = signal<INotification[]>(this.getMockNotifications());
  filter = signal<string>('all');
  
  // Computed
  filteredNotifications = computed(() => {
    const allNotifications = this.notifications();
    const currentFilter = this.filter();
    
    switch (currentFilter) {
      case 'unread':
        return allNotifications.filter(n => !n.isRead);
      case 'urgent':
        return allNotifications.filter(n => n.priority === NotificationPriority.URGENT);
      default:
        return allNotifications;
    }
  });
  
  unreadCount = computed(() => 
    this.notifications().filter(n => !n.isRead).length
  );
  
  // Settings
  notificationSettings = [
    { key: 'email', label: 'notifications.settings.email', enabled: true },
    { key: 'push', label: 'notifications.settings.push', enabled: true },
    { key: 'desktop', label: 'notifications.settings.desktop', enabled: false },
    { key: 'taskAssigned', label: 'notifications.settings.taskAssigned', enabled: true },
    { key: 'taskCompleted', label: 'notifications.settings.taskCompleted', enabled: true },
    { key: 'mentions', label: 'notifications.settings.mentions', enabled: true },
    { key: 'sprintUpdates', label: 'notifications.settings.sprintUpdates', enabled: false }
  ];
  
  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: NotificationType): string {
    const iconMap: Record<string, string> = {
      TASK_ASSIGNED: 'assignment',
      TASK_COMPLETED: 'task_alt',
      TASK_COMMENTED: 'comment',
      SPRINT_STARTED: 'play_circle',
      SPRINT_COMPLETED: 'check_circle',
      MENTIONED_IN_COMMENT: 'alternate_email',
      PROJECT_INVITE: 'group_add',
      SYSTEM_UPDATE: 'system_update',
      AI_SUGGESTION: 'psychology'
    };
    
    return iconMap[type] || 'notifications';
  }
  
  /**
   * Get notification icon class
   */
  getNotificationIconClass(type: NotificationType): string {
    if (type.includes('COMPLETED')) return 'icon-success';
    if (type.includes('OVERDUE') || type.includes('BLOCKED')) return 'icon-error';
    if (type.includes('DUE_SOON')) return 'icon-warning';
    return 'icon-info';
  }
  
  /**
   * Format time for display
   */
  formatTime(date: Date): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  }
  
  /**
   * Handle notification click
   */
  onNotificationClick(notification: INotification): void {
    if (!notification.isRead) {
      this.markAsRead(notification);
    }
  }
  
  /**
   * Mark notification as read
   */
  markAsRead(notification: INotification): void {
    const notifications = [...this.notifications()];
    const index = notifications.findIndex(n => n.id === notification.id);
    if (index !== -1) {
      notifications[index] = { ...notification, isRead: true };
      this.notifications.set(notifications);
    }
  }
  
  /**
   * Mark all as read
   */
  markAllAsRead(): void {
    const notifications = this.notifications().map(n => ({ ...n, isRead: true }));
    this.notifications.set(notifications);
  }
  
  /**
   * Delete notification
   */
  deleteNotification(notification: INotification): void {
    const notifications = this.notifications().filter(n => n.id !== notification.id);
    this.notifications.set(notifications);
  }
  
  /**
   * Filter by type
   */
  filterByType(type: string): void {
    this.filter.set(type);
  }
  
  /**
   * Update settings
   */
  updateSettings(): void {
    // Settings updated in real-time
  }
  
  /**
   * Save settings
   */
  saveSettings(): void {
    // TODO: Save to backend
    console.log('Saving notification settings:', this.notificationSettings);
  }
  
  /**
   * Get mock notifications for testing
   */
  private getMockNotifications(): INotification[] {
    return [
      {
        id: '1',
        userId: 'user1',
        type: NotificationType.TASK_ASSIGNED,
        title: 'New Task Assigned',
        message: 'You have been assigned to "Implement user authentication"',
        isRead: false,
        priority: NotificationPriority.HIGH,
        channel: [],
        actionUrl: '/tasks/123',
        actionText: 'View Task',
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
        updatedAt: new Date()
      },
      {
        id: '2',
        userId: 'user1',
        type: NotificationType.SPRINT_STARTED,
        title: 'Sprint Started',
        message: 'Sprint 23 has started. Good luck!',
        isRead: false,
        priority: NotificationPriority.MEDIUM,
        channel: [],
        actionUrl: '/sprints/active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60),
        updatedAt: new Date()
      },
      {
        id: '3',
        userId: 'user1',
        type: NotificationType.MENTIONED_IN_COMMENT,
        title: 'You were mentioned',
        message: 'John Smith mentioned you in a comment on "API Integration"',
        isRead: true,
        priority: NotificationPriority.LOW,
        channel: [],
        actionUrl: '/tasks/456#comment-789',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        updatedAt: new Date()
      },
      {
        id: '4',
        userId: 'user1',
        type: NotificationType.TASK_DUE_SOON,
        title: 'Task Due Soon',
        message: 'Task "Complete code review" is due in 2 hours',
        isRead: false,
        priority: NotificationPriority.URGENT,
        channel: [],
        actionUrl: '/tasks/789',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        updatedAt: new Date()
      },
      {
        id: '5',
        userId: 'user1',
        type: NotificationType.AI_SUGGESTION,
        title: 'AI Assistant Suggestion',
        message: 'Based on your sprint velocity, consider breaking down large tasks',
        isRead: true,
        priority: NotificationPriority.LOW,
        channel: [],
        actionUrl: '/ai-assistant',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        updatedAt: new Date()
      }
    ];
  }
}
