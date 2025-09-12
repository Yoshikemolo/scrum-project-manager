/**
 * Calendar Widget Component
 * Displays project events, deadlines, and sprint milestones
 * 
 * @component CalendarWidgetComponent
 * @module DashboardModule
 * @description Interactive calendar showing team events, task deadlines, sprint dates, and meetings.
 * Supports month, week, and day views with event filtering.
 */
import { 
  Component, 
  OnInit, 
  OnDestroy, 
  Input, 
  signal, 
  computed, 
  effect 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DashboardService, CalendarEvent } from '../../services/dashboard.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { ThemeService } from '../../../../core/services/theme.service';

/**
 * Calendar view type
 */
export enum CalendarView {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
  AGENDA = 'agenda'
}

/**
 * Event type for filtering
 */
export enum EventTypeFilter {
  ALL = 'all',
  MEETING = 'meeting',
  DEADLINE = 'deadline',
  SPRINT = 'sprint',
  RELEASE = 'release',
  HOLIDAY = 'holiday'
}

/**
 * Calendar day interface
 */
interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
}

/**
 * Calendar week interface
 */
interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

@Component({
  selector: 'app-calendar-widget',
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
    MatBadgeModule
  ],
  templateUrl: './calendar-widget.component.html',
  styleUrls: ['./calendar-widget.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-20px)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ transform: 'translateX(0)', opacity: 1 })
        )
      ])
    ])
  ]
})
export class CalendarWidgetComponent implements OnInit, OnDestroy {
  @Input() compact = false;
  @Input() defaultView: CalendarView = CalendarView.MONTH;
  @Input() showControls = true;
  @Input() showEventTypes = true;
  
  private destroy$ = new Subject<void>();
  
  // State management
  public isLoading = signal(true);
  public currentDate = signal(new Date());
  public selectedView = signal<CalendarView>(this.defaultView);
  public selectedEventType = signal<EventTypeFilter>(EventTypeFilter.ALL);
  public events = signal<CalendarEvent[]>([]);
  public selectedEvent = signal<CalendarEvent | null>(null);
  
  // View options
  public calendarViews = Object.values(CalendarView);
  public eventTypes = Object.values(EventTypeFilter);
  
  // Calendar data
  public calendarWeeks = computed(() => this.generateCalendarWeeks());
  public weekDays = computed(() => this.getWeekDays());
  
  // Computed properties
  public currentMonthYear = computed(() => {
    const date = this.currentDate();
    return this.i18n.translate(`calendar.months.${date.getMonth()}`) + ' ' + date.getFullYear();
  });
  
  public filteredEvents = computed(() => {
    const allEvents = this.events();
    const filter = this.selectedEventType();
    
    if (filter === EventTypeFilter.ALL) {
      return allEvents;
    }
    
    return allEvents.filter(event => event.type === filter);
  });
  
  public todayEvents = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    return this.filteredEvents().filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate < tomorrow;
    });
  });
  
  public upcomingEvents = computed(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return this.filteredEvents()
      .filter(event => {
        const eventDate = new Date(event.start);
        return eventDate > today && eventDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  });
  
  constructor(
    private dashboardService: DashboardService,
    private i18n: I18nService,
    private themeService: ThemeService
  ) {
    // React to date changes
    effect(() => {
      const date = this.currentDate();
      this.loadEvents(date);
    });
  }
  
  /**
   * Component initialization
   */
  ngOnInit(): void {
    this.loadEvents(this.currentDate());
  }
  
  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Load calendar events
   * @param date - Date to load events for
   */
  private loadEvents(date: Date): void {
    this.isLoading.set(true);
    
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    this.dashboardService.loadCalendarEvents(startOfMonth, endOfMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (events) => {
          this.events.set(events);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading calendar events:', error);
          this.isLoading.set(false);
        }
      });
  }
  
  /**
   * Generate calendar weeks for month view
   * @returns Array of calendar weeks
   */
  private generateCalendarWeeks(): CalendarWeek[] {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const weeks: CalendarWeek[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(startDate);
    let weekNumber = 1;
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      const week: CalendarWeek = {
        weekNumber,
        days: []
      };
      
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(currentDate);
        const dayEvents = this.getEventsForDate(dayDate);
        
        week.days.push({
          date: dayDate,
          dayNumber: dayDate.getDate(),
          isCurrentMonth: dayDate.getMonth() === month,
          isToday: dayDate.getTime() === today.getTime(),
          isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
          events: dayEvents
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeks.push(week);
      weekNumber++;
    }
    
    return weeks;
  }
  
  /**
   * Get events for a specific date
   * @param date - Date to get events for
   * @returns Array of events
   */
  private getEventsForDate(date: Date): CalendarEvent[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.filteredEvents().filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      return (eventStart >= startOfDay && eventStart <= endOfDay) ||
             (eventEnd >= startOfDay && eventEnd <= endOfDay) ||
             (eventStart <= startOfDay && eventEnd >= endOfDay);
    });
  }
  
  /**
   * Get week day names
   * @returns Array of day names
   */
  private getWeekDays(): string[] {
    return [
      this.i18n.translate('calendar.days.sunday'),
      this.i18n.translate('calendar.days.monday'),
      this.i18n.translate('calendar.days.tuesday'),
      this.i18n.translate('calendar.days.wednesday'),
      this.i18n.translate('calendar.days.thursday'),
      this.i18n.translate('calendar.days.friday'),
      this.i18n.translate('calendar.days.saturday')
    ];
  }
  
  /**
   * Navigate to previous period
   */
  public previousPeriod(): void {
    const date = new Date(this.currentDate());
    
    switch (this.selectedView()) {
      case CalendarView.DAY:
        date.setDate(date.getDate() - 1);
        break;
      case CalendarView.WEEK:
        date.setDate(date.getDate() - 7);
        break;
      default:
        date.setMonth(date.getMonth() - 1);
    }
    
    this.currentDate.set(date);
  }
  
  /**
   * Navigate to next period
   */
  public nextPeriod(): void {
    const date = new Date(this.currentDate());
    
    switch (this.selectedView()) {
      case CalendarView.DAY:
        date.setDate(date.getDate() + 1);
        break;
      case CalendarView.WEEK:
        date.setDate(date.getDate() + 7);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    
    this.currentDate.set(date);
  }
  
  /**
   * Go to today
   */
  public goToToday(): void {
    this.currentDate.set(new Date());
  }
  
  /**
   * Change calendar view
   * @param view - New view type
   */
  public changeView(view: CalendarView): void {
    this.selectedView.set(view);
  }
  
  /**
   * Filter events by type
   * @param type - Event type filter
   */
  public filterByType(type: EventTypeFilter): void {
    this.selectedEventType.set(type);
  }
  
  /**
   * Select a date
   * @param day - Calendar day to select
   */
  public selectDate(day: CalendarDay): void {
    if (day.events.length > 0) {
      this.selectedEvent.set(day.events[0]);
    }
    
    if (this.selectedView() === CalendarView.MONTH) {
      this.currentDate.set(day.date);
      this.changeView(CalendarView.DAY);
    }
  }
  
  /**
   * Open event details
   * @param event - Event to open
   */
  public openEvent(event: CalendarEvent): void {
    this.selectedEvent.set(event);
    console.log('Open event:', event);
  }
  
  /**
   * Get event type icon
   * @param type - Event type
   * @returns Icon name
   */
  public getEventIcon(type: string): string {
    switch (type) {
      case 'meeting':
        return 'groups';
      case 'deadline':
        return 'flag';
      case 'sprint':
        return 'timer';
      case 'release':
        return 'rocket_launch';
      case 'holiday':
        return 'beach_access';
      default:
        return 'event';
    }
  }
  
  /**
   * Get event type label
   * @param type - Event type
   * @returns Translated label
   */
  public getEventTypeLabel(type: string): string {
    return this.i18n.translate(`calendar.eventTypes.${type}`);
  }
  
  /**
   * Get view label
   * @param view - Calendar view
   * @returns Translated label
   */
  public getViewLabel(view: CalendarView): string {
    return this.i18n.translate(`calendar.views.${view}`);
  }
  
  /**
   * Format event time
   * @param date - Date to format
   * @returns Formatted time string
   */
  public formatEventTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  /**
   * Refresh calendar
   */
  public refresh(): void {
    this.loadEvents(this.currentDate());
  }
  
  /**
   * Export calendar
   */
  public exportCalendar(): void {
    console.log('Export calendar');
    // Implementation for exporting calendar to ICS format
  }
  
  /**
   * Create new event
   */
  public createEvent(): void {
    console.log('Create new event');
    // Open event creation dialog
  }
}
