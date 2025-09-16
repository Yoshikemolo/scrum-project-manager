/**
 * Calendar Widget Component Tests
 * Unit tests for the calendar widget component
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { 
  CalendarWidgetComponent, 
  CalendarView, 
  EventTypeFilter 
} from './calendar-widget.component';
import { DashboardService, CalendarEvent } from '../../services/dashboard.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { ThemeService } from '../../../../core/services/theme.service';

describe('CalendarWidgetComponent', () => {
  let component: CalendarWidgetComponent;
  let fixture: ComponentFixture<CalendarWidgetComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let i18nService: jasmine.SpyObj<I18nService>;
  let themeService: jasmine.SpyObj<ThemeService>;
  
  const mockEvents: CalendarEvent[] = [
    {
      id: 'event-1',
      title: 'Sprint Planning',
      start: new Date('2025-09-15T10:00:00'),
      end: new Date('2025-09-15T11:30:00'),
      type: 'meeting',
      color: '#2196f3',
      participants: [
        { id: 'user-1', name: 'John Doe', avatar: 'avatar1.jpg' }
      ],
      location: 'Conference Room A'
    },
    {
      id: 'event-2',
      title: 'Sprint 24 Ends',
      start: new Date('2025-09-20T00:00:00'),
      end: new Date('2025-09-20T23:59:59'),
      type: 'sprint',
      color: '#4caf50'
    },
    {
      id: 'event-3',
      title: 'Release v2.0',
      start: new Date('2025-09-25T00:00:00'),
      end: new Date('2025-09-25T23:59:59'),
      type: 'release',
      color: '#ff9800'
    }
  ];
  
  beforeEach(async () => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['loadCalendarEvents']);
    const i18nServiceSpy = jasmine.createSpyObj('I18nService', ['translate']);
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['currentTheme']);
    
    await TestBed.configureTestingModule({
      imports: [
        CalendarWidgetComponent,
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
    dashboardService.loadCalendarEvents.and.returnValue(of(mockEvents));
    i18nService.translate.and.callFake((key: string) => key);
    themeService.currentTheme.and.returnValue(signal('light'));
    
    fixture = TestBed.createComponent(CalendarWidgetComponent);
    component = fixture.componentInstance;
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  describe('Initialization', () => {
    it('should load events on init', () => {
      fixture.detectChanges();
      
      expect(dashboardService.loadCalendarEvents).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
      expect(component.events()).toEqual(mockEvents);
    });
    
    it('should set default view from input', () => {
      component.defaultView = CalendarView.WEEK;
      fixture.detectChanges();
      
      expect(component.selectedView()).toBe(CalendarView.WEEK);
    });
    
    it('should handle loading error', () => {
      dashboardService.loadCalendarEvents.and.returnValue(
        throwError(() => new Error('Loading failed'))
      );
      
      fixture.detectChanges();
      
      expect(component.isLoading()).toBe(false);
      expect(component.events()).toEqual([]);
    });
  });
  
  describe('Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2025-09-15'));
    });
    
    afterEach(() => {
      jasmine.clock().uninstall();
    });
    
    it('should navigate to previous month', () => {
      const currentDate = new Date('2025-09-15');
      component.currentDate.set(currentDate);
      component.selectedView.set(CalendarView.MONTH);
      
      component.previousPeriod();
      
      const newDate = component.currentDate();
      expect(newDate.getMonth()).toBe(7); // August
      expect(newDate.getFullYear()).toBe(2025);
    });
    
    it('should navigate to next month', () => {
      const currentDate = new Date('2025-09-15');
      component.currentDate.set(currentDate);
      component.selectedView.set(CalendarView.MONTH);
      
      component.nextPeriod();
      
      const newDate = component.currentDate();
      expect(newDate.getMonth()).toBe(9); // October
      expect(newDate.getFullYear()).toBe(2025);
    });
    
    it('should navigate to previous week', () => {
      const currentDate = new Date('2025-09-15');
      component.currentDate.set(currentDate);
      component.selectedView.set(CalendarView.WEEK);
      
      component.previousPeriod();
      
      const newDate = component.currentDate();
      expect(newDate.getDate()).toBe(8);
    });
    
    it('should navigate to next week', () => {
      const currentDate = new Date('2025-09-15');
      component.currentDate.set(currentDate);
      component.selectedView.set(CalendarView.WEEK);
      
      component.nextPeriod();
      
      const newDate = component.currentDate();
      expect(newDate.getDate()).toBe(22);
    });
    
    it('should navigate to previous day', () => {
      const currentDate = new Date('2025-09-15');
      component.currentDate.set(currentDate);
      component.selectedView.set(CalendarView.DAY);
      
      component.previousPeriod();
      
      const newDate = component.currentDate();
      expect(newDate.getDate()).toBe(14);
    });
    
    it('should navigate to next day', () => {
      const currentDate = new Date('2025-09-15');
      component.currentDate.set(currentDate);
      component.selectedView.set(CalendarView.DAY);
      
      component.nextPeriod();
      
      const newDate = component.currentDate();
      expect(newDate.getDate()).toBe(16);
    });
    
    it('should go to today', () => {
      const oldDate = new Date('2025-08-01');
      component.currentDate.set(oldDate);
      
      component.goToToday();
      
      const today = new Date();
      const currentDate = component.currentDate();
      expect(currentDate.getDate()).toBe(today.getDate());
      expect(currentDate.getMonth()).toBe(today.getMonth());
      expect(currentDate.getFullYear()).toBe(today.getFullYear());
    });
  });
  
  describe('View Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    
    it('should change to week view', () => {
      component.changeView(CalendarView.WEEK);
      
      expect(component.selectedView()).toBe(CalendarView.WEEK);
    });
    
    it('should change to day view', () => {
      component.changeView(CalendarView.DAY);
      
      expect(component.selectedView()).toBe(CalendarView.DAY);
    });
    
    it('should change to agenda view', () => {
      component.changeView(CalendarView.AGENDA);
      
      expect(component.selectedView()).toBe(CalendarView.AGENDA);
    });
  });
  
  describe('Event Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    
    it('should filter events by type', () => {
      component.filterByType(EventTypeFilter.MEETING);
      
      expect(component.selectedEventType()).toBe(EventTypeFilter.MEETING);
      expect(component.filteredEvents().length).toBe(1);
      expect(component.filteredEvents()[0].type).toBe('meeting');
    });
    
    it('should show all events when filter is ALL', () => {
      component.filterByType(EventTypeFilter.ALL);
      
      expect(component.selectedEventType()).toBe(EventTypeFilter.ALL);
      expect(component.filteredEvents().length).toBe(3);
    });
    
    it('should filter sprint events', () => {
      component.filterByType(EventTypeFilter.SPRINT);
      
      const filtered = component.filteredEvents();
      expect(filtered.length).toBe(1);
      expect(filtered[0].type).toBe('sprint');
    });
  });
  
  describe('Calendar Generation', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2025-09-15'));
      fixture.detectChanges();
    });
    
    afterEach(() => {
      jasmine.clock().uninstall();
    });
    
    it('should generate correct calendar weeks', () => {
      const weeks = component.calendarWeeks();
      
      expect(weeks.length).toBeGreaterThan(0);
      expect(weeks[0].days.length).toBe(7);
    });
    
    it('should mark today correctly', () => {
      const weeks = component.calendarWeeks();
      let todayFound = false;
      
      weeks.forEach(week => {
        week.days.forEach(day => {
          if (day.isToday) {
            todayFound = true;
            expect(day.date.getDate()).toBe(15);
          }
        });
      });
      
      expect(todayFound).toBe(true);
    });
    
    it('should mark weekends correctly', () => {
      const weeks = component.calendarWeeks();
      
      weeks.forEach(week => {
        expect(week.days[0].isWeekend).toBe(true); // Sunday
        expect(week.days[6].isWeekend).toBe(true); // Saturday
        expect(week.days[3].isWeekend).toBe(false); // Wednesday
      });
    });
    
    it('should get week day names', () => {
      const weekDays = component.weekDays();
      
      expect(weekDays.length).toBe(7);
      expect(weekDays[0]).toBe('calendar.days.sunday');
      expect(weekDays[6]).toBe('calendar.days.saturday');
    });
  });
  
  describe('Event Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    
    it('should select event', () => {
      const event = mockEvents[0];
      component.openEvent(event);
      
      expect(component.selectedEvent()).toBe(event);
    });
    
    it('should get correct event icon', () => {
      expect(component.getEventIcon('meeting')).toBe('groups');
      expect(component.getEventIcon('deadline')).toBe('flag');
      expect(component.getEventIcon('sprint')).toBe('timer');
      expect(component.getEventIcon('release')).toBe('rocket_launch');
      expect(component.getEventIcon('holiday')).toBe('beach_access');
      expect(component.getEventIcon('unknown')).toBe('event');
    });
    
    it('should format event time correctly', () => {
      const date = new Date('2025-09-15T14:30:00');
      const formatted = component.formatEventTime(date);
      
      expect(formatted).toContain('2:30');
      expect(formatted.toLowerCase()).toContain('pm');
    });
  });
  
  describe('Today and Upcoming Events', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2025-09-15T09:00:00'));
      fixture.detectChanges();
    });
    
    afterEach(() => {
      jasmine.clock().uninstall();
    });
    
    it('should identify today events', () => {
      const todayEvents = component.todayEvents();
      
      expect(todayEvents.length).toBe(1);
      expect(todayEvents[0].title).toBe('Sprint Planning');
    });
    
    it('should identify upcoming events', () => {
      const upcomingEvents = component.upcomingEvents();
      
      expect(upcomingEvents.length).toBeGreaterThan(0);
      expect(upcomingEvents[0].title).toBe('Sprint 24 Ends');
    });
  });
  
  describe('Compact Mode', () => {
    it('should apply compact styles', () => {
      component.compact = true;
      fixture.detectChanges();
      
      const element = fixture.nativeElement.querySelector('.calendar-widget');
      expect(element.classList.contains('calendar-widget--compact')).toBe(true);
    });
    
    it('should hide filters in compact mode', () => {
      component.compact = true;
      fixture.detectChanges();
      
      const filters = fixture.nativeElement.querySelector('.calendar-widget__filters');
      expect(filters).toBeNull();
    });
    
    it('should hide actions in compact mode', () => {
      component.compact = true;
      fixture.detectChanges();
      
      const actions = fixture.nativeElement.querySelector('.calendar-widget__actions');
      expect(actions).toBeNull();
    });
  });
  
  describe('Refresh Functionality', () => {
    it('should reload events on refresh', () => {
      fixture.detectChanges();
      dashboardService.loadCalendarEvents.calls.reset();
      
      component.refresh();
      
      expect(dashboardService.loadCalendarEvents).toHaveBeenCalled();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA labels on navigation buttons', () => {
      fixture.detectChanges();
      
      const prevButton = fixture.nativeElement.querySelector('button[aria-label*="previous"]');
      const nextButton = fixture.nativeElement.querySelector('button[aria-label*="next"]');
      
      expect(prevButton).toBeTruthy();
      expect(nextButton).toBeTruthy();
    });
  });
  
  describe('Cleanup', () => {
    it('should complete destroy subject on destroy', () => {
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      
      fixture.destroy();
      
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
