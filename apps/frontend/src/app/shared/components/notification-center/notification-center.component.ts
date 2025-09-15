/**
 * @fileoverview Notification Center Component
 * @module NotificationCenterComponent
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule } from '@ngx-translate/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  source?: string;
  actionUrl?: string;
  actionLabel?: string;
  selected?: boolean;
}

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatBadgeModule,
    TranslateModule
  ],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class NotificationCenterComponent implements OnInit {
  @Input() notifications = signal<Notification[]>([]);
  @Input() hasMore = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() markRead = new EventEmitter<Notification>();
  @Output() markAllRead = new EventEmitter<void>();
  @Output() delete = new EventEmitter<Notification>();
  @Output() deleteAll = new EventEmitter<void>();
  @Output() action = new EventEmitter<Notification>();
  @Output() loadMore = new EventEmitter<void>();
  
  @ViewChild('scrollContainer') scrollContainer?: ElementRef;
  
  searchQuery = '';
  currentFilter = 'all';
  selectedNotifications = new Set<string>();
  animationState = 'in';
  
  filteredNotifications = computed(() => {
    let filtered = this.notifications();
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }
    
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(n => n.type === this.currentFilter);
    }
    
    return filtered;
  });
  
  unreadCount = computed(() => 
    this.notifications().filter(n => !n.read).length
  );
  
  notificationTypes = [
    { value: 'info', label: 'notifications.info', icon: 'info' },
    { value: 'success', label: 'notifications.success', icon: 'check_circle' },
    { value: 'warning', label: 'notifications.warning', icon: 'warning' },
    { value: 'error', label: 'notifications.error', icon: 'error' }
  ];
  
  ngOnInit(): void {
    // Initialize
  }
  
  getIconForType(type: string): string {
    const typeConfig = this.notificationTypes.find(t => t.value === type);
    return typeConfig?.icon || 'notifications';
  }
  
  getCountByType(type: string): number {
    return this.notifications().filter(n => n.type === type).length;
  }
  
  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
  
  filterNotifications(): void {
    // Filtering is handled by computed signal
  }
  
  clearSearch(): void {
    this.searchQuery = '';
  }
  
  filterByType(type: string): void {
    this.currentFilter = type;
  }
  
  onTabChange(event: any): void {
    // Handle tab change
  }
  
  toggleSelection(notification: Notification): void {
    if (this.selectedNotifications.has(notification.id)) {
      this.selectedNotifications.delete(notification.id);
    } else {
      this.selectedNotifications.add(notification.id);
    }
  }
  
  viewNotification(notification: Notification): void {
    if (!notification.read) {
      this.markAsRead(notification);
    }
  }
  
  markAsRead(notification: Notification): void {
    this.markRead.emit(notification);
  }
  
  markAllAsRead(): void {
    this.markAllRead.emit();
  }
  
  markSelectedAsRead(): void {
    this.selectedNotifications.forEach(id => {
      const notification = this.notifications().find(n => n.id === id);
      if (notification && !notification.read) {
        this.markAsRead(notification);
      }
    });
    this.selectedNotifications.clear();
  }
  
  deleteNotification(notification: Notification): void {
    this.delete.emit(notification);
  }
  
  deleteSelected(): void {
    this.selectedNotifications.forEach(id => {
      const notification = this.notifications().find(n => n.id === id);
      if (notification) {
        this.deleteNotification(notification);
      }
    });
    this.selectedNotifications.clear();
  }
  
  clearAll(): void {
    this.deleteAll.emit();
  }
  
  performAction(notification: Notification): void {
    this.action.emit(notification);
  }
  
  trackById(index: number, item: Notification): string {
    return item.id;
  }
}