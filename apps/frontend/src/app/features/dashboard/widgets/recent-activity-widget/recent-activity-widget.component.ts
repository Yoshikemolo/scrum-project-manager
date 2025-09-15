/**
 * Recent Activity Widget Component
 * Displays a feed of recent project activities
 * 
 * @component RecentActivityWidgetComponent
 * @module DashboardModule
 * @description Shows recent team activities including task updates, comments, sprint changes, and user actions.
 * Supports real-time updates and activity filtering.
 */
import { 
  Component, 
  OnInit, 
  OnDestroy, 
  Input, 
  signal, 
  computed 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DashboardService, ActivityItem } from '../../services/dashboard.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { ThemeService } from '../../../../core/services/theme.service';

/**
 * Activity type filter
 */
export enum ActivityTypeFilter {
  ALL = 'all',
  TASK = 'task',
  COMMENT = 'comment',
  SPRINT = 'sprint',
  PROJECT = 'project',
  USER = 'user'
}

/**
 * Time range filter
 */
export enum TimeRangeFilter {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  ALL = 'all'
}

@Component({
  selector: 'app-recent-activity-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './recent-activity-widget.component.html',
  styleUrls: ['./recent-activity-widget.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(50, [
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
              style({ opacity: 1, transform: 'translateY(0)' })
            )
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class RecentActivityWidgetComponent implements OnInit, OnDestroy {
  @Input() compact = false;
  @Input() maxItems = 20;
  @Input() showFilters = true;
  @Input() autoRefresh = true;
  @Input() refreshInterval = 45000; // 45 seconds
  
  private destroy$ = new Subject<void>();
  private refreshTimer?: any;
  
  // State management
  public isLoading = signal(true);
  public activities = signal<ActivityItem[]>([]);
  public selectedType = signal<ActivityTypeFilter>(ActivityTypeFilter.ALL);
  public selectedTimeRange = signal<TimeRangeFilter>(TimeRangeFilter.WEEK);
  public expandedActivities = signal<Set<string>>(new Set());
  
  // Filter options
  public activityTypes = Object.values(ActivityTypeFilter);
  public timeRanges = Object.values(TimeRangeFilter);
  
  // Computed properties
  public filteredActivities = computed(() => {
    let filtered = this.activities();
    const typeFilter = this.selectedType();
    const timeFilter = this.selectedTimeRange();
    
    // Filter by type
    if (typeFilter !== ActivityTypeFilter.ALL) {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }
    
    // Filter by time range
    const now = new Date();
    if (timeFilter !== TimeRangeFilter.ALL) {
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        const diffMs = now.getTime() - activityDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        switch (timeFilter) {
          case TimeRangeFilter.TODAY:
            return diffDays === 0;
          case TimeRangeFilter.WEEK:
            return diffDays <= 7;
          case TimeRangeFilter.MONTH:
            return diffDays <= 30;
          default:
            return true;
        }
      });
    }
    
    // Limit items
    return filtered.slice(0, this.maxItems);
  });
  
  public groupedActivities = computed(() => {
    const activities = this.filteredActivities();
    const groups = new Map<string, ActivityItem[]>();
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp);
      const dateKey = this.getDateKey(date);
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)?.push(activity);
    });
    
    return Array.from(groups.entries()).map(([date, items]) => ({
      date,
      items
    }));
  });
  
  public activityStats = computed(() => {
    const activities = this.activities();
    const now = new Date();
    const today = activities.filter(a => {
      const date = new Date(a.timestamp);
      return date.toDateString() === now.toDateString();
    });
    
    return {
      total: activities.length,
      today: today.length,
      tasks: activities.filter(a => a.type === 'task').length,
      comments: activities.filter(a => a.type === 'comment').length
    };
  });
  
  constructor(
    private dashboardService: DashboardService,
    private i18n: I18nService,
    private themeService: ThemeService
  ) {}
  
  /**
   * Component initialization
   */
  ngOnInit(): void {
    this.loadActivities();
    this.subscribeToUpdates();
    
    if (this.autoRefresh) {
      this.startAutoRefresh();
    }
  }
  
  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }
  
  /**
   * Load activity feed
   */
  private loadActivities(): void {
    this.isLoading.set(true);
    
    this.dashboardService.loadActivityFeed(50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (activities) => {
          this.activities.set(activities);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading activities:', error);
          this.isLoading.set(false);
        }
      });
  }
  
  /**
   * Subscribe to real-time updates
   */
  private subscribeToUpdates(): void {
    this.dashboardService.activityFeed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(activities => {
        this.activities.set(activities);
      });
  }
  
  /**
   * Start auto-refresh timer
   */
  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.loadActivities();
    }, this.refreshInterval);
  }
  
  /**
   * Get date key for grouping
   * @param date - Date to get key for
   * @returns Date key string
   */
  private getDateKey(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (activityDate.getTime() === today.getTime()) {
      return this.i18n.translate('common.today');
    } else if (activityDate.getTime() === yesterday.getTime()) {
      return this.i18n.translate('common.yesterday');
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }
  
  /**
   * Filter by activity type
   * @param type - Activity type filter
   */
  public filterByType(type: ActivityTypeFilter): void {
    this.selectedType.set(type);
  }
  
  /**
   * Filter by time range
   * @param range - Time range filter
   */
  public filterByTimeRange(range: TimeRangeFilter): void {
    this.selectedTimeRange.set(range);
  }
  
  /**
   * Toggle activity expansion
   * @param activityId - Activity ID to toggle
   */
  public toggleActivityExpansion(activityId: string): void {
    this.expandedActivities.update(expanded => {
      const newExpanded = new Set(expanded);
      if (newExpanded.has(activityId)) {
        newExpanded.delete(activityId);
      } else {
        newExpanded.add(activityId);
      }
      return newExpanded;
    });
  }
  
  /**
   * Check if activity is expanded
   * @param activityId - Activity ID to check
   * @returns True if expanded
   */
  public isActivityExpanded(activityId: string): boolean {
    return this.expandedActivities().has(activityId);
  }
  
  /**
   * Get activity icon
   * @param activity - Activity item
   * @returns Icon name
   */
  public getActivityIcon(activity: ActivityItem): string {
    switch (activity.type) {
      case 'task':
        switch (activity.action) {
          case 'created': return 'add_task';
          case 'completed': return 'task_alt';
          case 'assigned': return 'assignment_ind';
          case 'updated': return 'edit';
          default: return 'task';
        }
      case 'comment':
        return 'comment';
      case 'sprint':
        switch (activity.action) {
          case 'started': return 'play_arrow';
          case 'completed': return 'check_circle';
          default: return 'timer';
        }
      case 'project':
        return 'folder';
      case 'user':
        switch (activity.action) {
          case 'joined': return 'person_add';
          case 'left': return 'person_remove';
          default: return 'person';
        }
      default:
        return 'notifications';
    }
  }
  
  /**
   * Get activity color
   * @param activity - Activity item
   * @returns Color string
   */
  public getActivityColor(activity: ActivityItem): string {
    switch (activity.type) {
      case 'task':
        return activity.action === 'completed' ? '#4caf50' : '#2196f3';
      case 'comment':
        return '#ff9800';
      case 'sprint':
        return '#9c27b0';
      case 'project':
        return '#00bcd4';
      case 'user':
        return '#607d8b';
      default:
        return '#9e9e9e';
    }
  }
  
  /**
   * Get activity description
   * @param activity - Activity item
   * @returns Formatted description
   */
  public getActivityDescription(activity: ActivityItem): string {
    const userLink = `<strong>${activity.user.name}</strong>`;
    const targetLink = `<strong>${activity.target.name}</strong>`;
    
    return this.i18n.translate(
      `activity.${activity.type}.${activity.action}`,
      { user: userLink, target: targetLink }
    );
  }
  
  /**
   * Format relative time
   * @param date - Date to format
   * @returns Formatted time string
   */
  public formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return this.i18n.translate('common.justNow');
    } else if (diffMins < 60) {
      return this.i18n.translate('common.minutesAgo', { count: diffMins });
    } else if (diffHours < 24) {
      return this.i18n.translate('common.hoursAgo', { count: diffHours });
    } else if (diffDays < 7) {
      return this.i18n.translate('common.daysAgo', { count: diffDays });
    } else {
      return activityDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }
  
  /**
   * Get type label
   * @param type - Activity type
   * @returns Translated label
   */
  public getTypeLabel(type: ActivityTypeFilter): string {
    return this.i18n.translate(`activity.types.${type}`);
  }
  
  /**
   * Get time range label
   * @param range - Time range
   * @returns Translated label
   */
  public getTimeRangeLabel(range: TimeRangeFilter): string {
    return this.i18n.translate(`activity.timeRange.${range}`);
  }
  
  /**
   * Open activity details
   * @param activity - Activity to open
   */
  public openActivity(activity: ActivityItem): void {
    console.log('Open activity:', activity);
    // Navigate to the related entity
  }
  
  /**
   * Mark all as read
   */
  public markAllAsRead(): void {
    console.log('Mark all activities as read');
    // Implementation for marking activities as read
  }
  
  /**
   * Refresh activities
   */
  public refresh(): void {
    this.loadActivities();
  }
  
  /**
   * Load more activities
   */
  public loadMore(): void {
    this.maxItems += 20;
    this.loadActivities();
  }
}
