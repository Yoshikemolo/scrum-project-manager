/**
 * Recent Activity Widget Component Tests
 * Unit tests for the recent activity widget component
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { 
  RecentActivityWidgetComponent, 
  ActivityTypeFilter, 
  TimeRangeFilter 
} from './recent-activity-widget.component';
import { DashboardService, ActivityItem } from '../../services/dashboard.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { ThemeService } from '../../../../core/services/theme.service';

describe('RecentActivityWidgetComponent', () => {
  let component: RecentActivityWidgetComponent;
  let fixture: ComponentFixture<RecentActivityWidgetComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let i18nService: jasmine.SpyObj<I18nService>;
  let themeService: jasmine.SpyObj<ThemeService>;
  
  const mockActivities: ActivityItem[] = [
    {
      id: 'activity-1',
      type: 'task',
      action: 'completed',
      user: {
        id: 'user-1',
        name: 'John Doe',
        avatar: 'avatar1.jpg'
      },
      target: {
        id: 'task-1',
        type: 'task',
        name: 'Update documentation'
      },
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      details: { storyPoints: 3 }
    },
    {
      id: 'activity-2',
      type: 'comment',
      action: 'added',
      user: {
        id: 'user-2',
        name: 'Jane Smith',
        avatar: 'avatar2.jpg'
      },
      target: {
        id: 'task-2',
        type: 'task',
        name: 'Design dashboard'
      },
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      details: { comment: 'Looks good!' }
    },
    {
      id: 'activity-3',
      type: 'sprint',
      action: 'started',
      user: {
        id: 'user-3',
        name: 'Bob Johnson',
        avatar: 'avatar3.jpg'
      },
      target: {
        id: 'sprint-1',
        type: 'sprint',
        name: 'Sprint 24'
      },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      details: { duration: '2 weeks' }
    },
    {
      id: 'activity-4',
      type: 'task',
      action: 'created',
      user: {
        id: 'user-1',
        name: 'John Doe',
        avatar: 'avatar1.jpg'
      },
      target: {
        id: 'task-3',
        type: 'task',
        name: 'Write tests'
      },
      timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), // Yesterday
      details: { storyPoints: 5 }
    }
  ];
  
  beforeEach(async () => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', 
      ['loadActivityFeed'],
      { activityFeed$: of(mockActivities) }
    );
    const i18nServiceSpy = jasmine.createSpyObj('I18nService', ['translate']);
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['currentTheme']);
    
    await TestBed.configureTestingModule({
      imports: [
        RecentActivityWidgetComponent,
        BrowserAnimationsModule,
        FormsModule
      ],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy }
      ]
    }).compileComponents();
    
    dashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
    i18nService = TestBed.inject(I18nService) as jasmine.SpyObj<I18nService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    
    // Setup default spy returns
    dashboardService.loadActivityFeed.and.returnValue(of(mockActivities));
    i18nService.translate.and.callFake((key: string, params?: any) => {
      if (params) {
        return key + ' ' + JSON.stringify(params);
      }
      return key;
    });
    themeService.currentTheme.and.returnValue(signal('light'));
    
    fixture = TestBed.createComponent(RecentActivityWidgetComponent);
    component = fixture.componentInstance;
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  describe('Initialization', () => {
    it('should load activities on init', () => {
      fixture.detectChanges();
      
      expect(dashboardService.loadActivityFeed).toHaveBeenCalledWith(50);
      expect(component.isLoading()).toBe(false);
      expect(component.activities()).toEqual(mockActivities);
    });
    
    it('should handle loading error', () => {
      dashboardService.loadActivityFeed.and.returnValue(
        throwError(() => new Error('Loading failed'))
      );
      
      fixture.detectChanges();
      
      expect(component.isLoading()).toBe(false);
      expect(component.activities()).toEqual([]);
    });
    
    it('should start auto-refresh if enabled', () => {
      component.autoRefresh = true;
      component.refreshInterval = 1000;
      
      jasmine.clock().install();
      fixture.detectChanges();
      dashboardService.loadActivityFeed.calls.reset();
      
      jasmine.clock().tick(1000);
      
      expect(dashboardService.loadActivityFeed).toHaveBeenCalled();
      jasmine.clock().uninstall();
    });
    
    it('should not start auto-refresh if disabled', () => {
      component.autoRefresh = false;
      
      jasmine.clock().install();
      fixture.detectChanges();
      dashboardService.loadActivityFeed.calls.reset();
      
      jasmine.clock().tick(45000);
      
      expect(dashboardService.loadActivityFeed).not.toHaveBeenCalled();
      jasmine.clock().uninstall();
    });
  });
  
  describe('Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    
    it('should filter by activity type', () => {
      component.filterByType(ActivityTypeFilter.TASK);
      
      const filtered = component.filteredActivities();
      expect(filtered.every(a => a.type === 'task')).toBe(true);
      expect(filtered.length).toBe(2);
    });
    
    it('should filter by comment type', () => {
      component.filterByType(ActivityTypeFilter.COMMENT);
      
      const filtered = component.filteredActivities();
      expect(filtered.every(a => a.type === 'comment')).toBe(true);
      expect(filtered.length).toBe(1);
    });
    
    it('should show all activities when filter is ALL', () => {
      component.filterByType(ActivityTypeFilter.ALL);
      
      const filtered = component.filteredActivities();
      expect(filtered.length).toBe(4);
    });
    
    it('should filter by time range - today', () => {
      component.filterByTimeRange(TimeRangeFilter.TODAY);
      
      const filtered = component.filteredActivities();
      expect(filtered.length).toBe(3); // Activities from today
    });
    
    it('should filter by time range - week', () => {
      component.filterByTimeRange(TimeRangeFilter.WEEK);
      
      const filtered = component.filteredActivities();
      expect(filtered.length).toBe(4); // All activities are within a week
    });
    
    it('should combine type and time filters', () => {
      component.filterByType(ActivityTypeFilter.TASK);
      component.filterByTimeRange(TimeRangeFilter.TODAY);
      
      const filtered = component.filteredActivities();
      expect(filtered.every(a => a.type === 'task')).toBe(true);
      expect(filtered.length).toBe(1); // Only today's task
    });
    
    it('should limit activities to maxItems', () => {
      component.maxItems = 2;
      
      const filtered = component.filteredActivities();
      expect(filtered.length).toBe(2);
    });
  });
  
  describe('Grouping', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2025-09-15T12:00:00'));
      fixture.detectChanges();
    });
    
    afterEach(() => {
      jasmine.clock().uninstall();
    });
    
    it('should group activities by date', () => {
      const groups = component.groupedActivities();
      
      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0].date).toBeTruthy();
      expect(groups[0].items.length).toBeGreaterThan(0);
    });
    
    it('should label today activities correctly', () => {
      const groups = component.groupedActivities();
      const todayGroup = groups.find(g => g.date === 'common.today');
      
      expect(todayGroup).toBeTruthy();
      expect(todayGroup?.items.length).toBe(3);
    });
  });
  
  describe('Activity Stats', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    
    it('should calculate activity statistics', () => {
      const stats = component.activityStats();
      
      expect(stats.total).toBe(4);
      expect(stats.tasks).toBe(2);
      expect(stats.comments).toBe(1);
    });
  });
  
  describe('Activity Expansion', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    
    it('should toggle activity expansion', () => {
      const activityId = 'activity-1';
      
      expect(component.isActivityExpanded(activityId)).toBe(false);
      
      component.toggleActivityExpansion(activityId);
      expect(component.isActivityExpanded(activityId)).toBe(true);
      
      component.toggleActivityExpansion(activityId);
      expect(component.isActivityExpanded(activityId)).toBe(false);
    });
  });
  
  describe('Activity Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    
    it('should get correct activity icon', () => {
      const taskActivity = mockActivities[0];
      const icon = component.getActivityIcon(taskActivity);
      
      expect(icon).toBe('task_alt'); // completed task
    });
    
    it('should get correct activity color', () => {
      const taskActivity = mockActivities[0];
      const color = component.getActivityColor(taskActivity);
      
      expect(color).toBe('#4caf50'); // green for completed task
    });
    
    it('should format relative time correctly', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2025-09-15T12:00:00'));
      
      const fiveMinutesAgo = new Date('2025-09-15T11:55:00');
      const formatted = component.formatRelativeTime(fiveMinutesAgo);
      
      expect(formatted).toContain('5');
      jasmine.clock().uninstall();
    });
    
    it('should format just now for recent activities', () => {
      const now = new Date();
      const formatted = component.formatRelativeTime(now);
      
      expect(formatted).toBe('common.justNow');
    });
  });
  
  describe('Refresh and Load More', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    
    it('should refresh activities', () => {
      dashboardService.loadActivityFeed.calls.reset();
      
      component.refresh();
      
      expect(dashboardService.loadActivityFeed).toHaveBeenCalled();
    });
    
    it('should load more activities', () => {
      const initialMax = component.maxItems;
      
      component.loadMore();
      
      expect(component.maxItems).toBe(initialMax + 20);
      expect(dashboardService.loadActivityFeed).toHaveBeenCalled();
    });
  });
  
  describe('Compact Mode', () => {
    it('should apply compact styles', () => {
      component.compact = true;
      fixture.detectChanges();
      
      const element = fixture.nativeElement.querySelector('.recent-activity-widget');
      expect(element.classList.contains('recent-activity-widget--compact')).toBe(true);
    });
    
    it('should hide filters in compact mode', () => {
      component.compact = true;
      fixture.detectChanges();
      
      const filters = fixture.nativeElement.querySelector('.recent-activity-widget__filters');
      expect(filters).toBeNull();
    });
  });
  
  describe('Cleanup', () => {
    it('should clear refresh timer on destroy', () => {
      component.autoRefresh = true;
      fixture.detectChanges();
      
      const clearIntervalSpy = spyOn(window, 'clearInterval');
      
      fixture.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
    
    it('should complete destroy subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      
      fixture.destroy();
      
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
