<<<<<<< HEAD
import { Component, OnInit, OnDestroy, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatGridListModule } from '@angular/material/grid-list';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, interval, combineLatest, map, switchMap } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { ThemeService } from '../../core/services/theme.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ShortcutService } from '../../core/services/shortcut.service';
import { selectUser } from '../../store/auth/auth.selectors';

// Register Chart.js components
Chart.register(...registerables);

/**
 * Dashboard Component
 * 
 * Main dashboard with real-time metrics, interactive charts, and comprehensive project overview.
 * 
 * Features:
 * - Real-time KPI cards with animations
 * - Interactive charts (line, bar, doughnut, radar)
 * - Sprint velocity tracking
 * - Burndown/Burnup charts
 * - Team performance metrics
 * - Activity timeline
 * - Quick actions panel
 * - Customizable widgets with drag-and-drop
 * - Responsive grid layout
 * - Real-time updates via WebSocket
 * - Export functionality
 * - Dark mode support
 */
=======
/**
 * Main Dashboard Component
 * Displays widgets and provides overview of project status
 */
import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Widgets
import { StatsWidgetComponent } from './widgets/stats-widget/stats-widget.component';
import { SprintProgressWidgetComponent } from './widgets/sprint-progress-widget/sprint-progress-widget.component';
import { TasksWidgetComponent } from './widgets/tasks-widget/tasks-widget.component';
import { TeamActivityWidgetComponent } from './widgets/team-activity-widget/team-activity-widget.component';
import { ChartsWidgetComponent } from './widgets/charts-widget/charts-widget.component';
import { CalendarWidgetComponent } from './widgets/calendar-widget/calendar-widget.component';
import { RecentActivityWidgetComponent } from './widgets/recent-activity-widget/recent-activity-widget.component';
import { WeatherWidgetComponent } from './widgets/weather-widget/weather-widget.component';

// Services
import { DashboardService } from './services/dashboard.service';
import { ThemeService } from '../../core/services/theme.service';
import { I18nService } from '../../core/services/i18n.service';
import { ShortcutService } from '../../core/services/shortcut.service';

/**
 * Widget configuration
 */
export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  icon: string;
  component: any;
  size: 'small' | 'medium' | 'large' | 'full';
  position: number;
  visible: boolean;
  refreshInterval?: number;
  settings?: any;
}

/**
 * Dashboard layout
 */
export type DashboardLayout = 'grid' | 'list' | 'compact' | 'custom';

>>>>>>> feature/SPM-016-projects-tasks
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
<<<<<<< HEAD
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatBadgeModule,
    MatChipsModule,
    MatTabsModule,
    MatGridListModule,
    DragDropModule,
    TranslateModule
=======
    DragDropModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    // Widgets
    StatsWidgetComponent,
    SprintProgressWidgetComponent,
    TasksWidgetComponent,
    TeamActivityWidgetComponent,
    ChartsWidgetComponent,
    CalendarWidgetComponent,
    RecentActivityWidgetComponent,
    WeatherWidgetComponent
>>>>>>> feature/SPM-016-projects-tasks
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [
<<<<<<< HEAD
    trigger('fadeInUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
=======
    trigger('widgetAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 1, transform: 'scale(1)' })
        )
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.6, 1)', 
          style({ opacity: 0, transform: 'scale(0.95)' })
        )
>>>>>>> feature/SPM-016-projects-tasks
      ])
    ]),
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
<<<<<<< HEAD
            animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('numberAnimation', [
      transition(':increment', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-20px)' }),
          animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
        ], { optional: true })
      ])
    ]),
    trigger('pulse', [
      state('active', style({ transform: 'scale(1)' })),
      transition('* => active', [
        animate('1s ease-in-out', style({ transform: 'scale(1.05)' }))
      ])
=======
            animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', 
              style({ opacity: 1, transform: 'translateY(0)' })
            )
          ])
        ], { optional: true })
      ])
>>>>>>> feature/SPM-016-projects-tasks
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
<<<<<<< HEAD
  // ViewChild references for charts
  @ViewChild('velocityChart') velocityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('burndownChart') burndownChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('taskChart') taskChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('teamChart') teamChartRef!: ElementRef<HTMLCanvasElement>;
  
  // User data
  user$ = this.store.select(selectUser);
  
  // Dashboard state signals
  selectedPeriod = signal<'week' | 'month' | 'quarter' | 'year'>('month');
  selectedProject = signal<string | null>(null);
  isLoading = signal(true);
  autoRefresh = signal(true);
  refreshInterval = signal(30000); // 30 seconds
  lastUpdated = signal(new Date());
  
  // KPI signals
  totalProjects = signal(12);
  activeSprints = signal(3);
  completedTasks = signal(156);
  teamMembers = signal(24);
  velocity = signal(42);
  bugCount = signal(8);
  codeReviews = signal(15);
  deployments = signal(4);
  
  // Chart data signals
  velocityData = signal<any>(null);
  burndownData = signal<any>(null);
  taskDistribution = signal<any>(null);
  teamPerformance = signal<any>(null);
  
  // Activity timeline
  activities = signal<Activity[]>([]);
  
  // Widget configuration
  widgets = signal<Widget[]>([
    { id: 'kpi', title: 'dashboard.widgets.kpi', icon: 'dashboard', cols: 4, rows: 1, enabled: true },
    { id: 'velocity', title: 'dashboard.widgets.velocity', icon: 'speed', cols: 2, rows: 2, enabled: true },
    { id: 'burndown', title: 'dashboard.widgets.burndown', icon: 'trending_down', cols: 2, rows: 2, enabled: true },
    { id: 'tasks', title: 'dashboard.widgets.tasks', icon: 'assignment', cols: 1, rows: 2, enabled: true },
    { id: 'team', title: 'dashboard.widgets.team', icon: 'group', cols: 1, rows: 2, enabled: true },
    { id: 'activity', title: 'dashboard.widgets.activity', icon: 'timeline', cols: 2, rows: 3, enabled: true },
    { id: 'quickActions', title: 'dashboard.widgets.quickActions', icon: 'flash_on', cols: 2, rows: 1, enabled: true }
  ]);
  
  // Computed signals
  gridCols = computed(() => {
    if (this.isMobile()) return 1;
    if (this.isTablet()) return 2;
    return 4;
  });
  
  completionRate = computed(() => {
    const total = this.completedTasks() + this.bugCount();
    return total > 0 ? Math.round((this.completedTasks() / total) * 100) : 0;
  });
  
  sprintProgress = computed(() => {
    // Calculate sprint progress based on current date
    const sprintDays = 14;
    const daysPassed = 7;
    return Math.round((daysPassed / sprintDays) * 100);
  });
  
  // Responsive signals
  isMobile = signal(false);
  isTablet = signal(false);
  isDesktop = signal(true);
  
  // Charts
  private velocityChart: Chart | null = null;
  private burndownChart: Chart | null = null;
  private taskChart: Chart | null = null;
  private teamChart: Chart | null = null;
  
  // Lifecycle
  private destroy$ = new Subject<void>();
  private refreshSubscription: any;
  
  constructor(
    private store: Store,
    private router: Router,
    private themeService: ThemeService,
    private wsService: WebSocketService,
    private shortcutService: ShortcutService,
    private translateService: TranslateService,
    private breakpointObserver: BreakpointObserver
  ) {
    // Set up responsive layout effect
    effect(() => {
      this.updateChartsTheme();
    });
    
    // Auto-refresh effect
    effect(() => {
      if (this.autoRefresh()) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
=======
  private destroy$ = new Subject<void>();
  
  // State
  public isLoading = signal(true);
  public isEditMode = signal(false);
  public layout = signal<DashboardLayout>('grid');
  public refreshing = signal<Set<string>>(new Set());
  public expandedWidget = signal<string | null>(null);
  public searchQuery = signal('');
  
  // Widget configurations
  public widgets = signal<WidgetConfig[]>([
    {
      id: 'stats',
      type: 'stats',
      title: 'Key Metrics',
      icon: 'analytics',
      component: StatsWidgetComponent,
      size: 'full',
      position: 0,
      visible: true,
      refreshInterval: 60000
    },
    {
      id: 'sprint-progress',
      type: 'sprint-progress',
      title: 'Sprint Progress',
      icon: 'timer',
      component: SprintProgressWidgetComponent,
      size: 'medium',
      position: 1,
      visible: true,
      refreshInterval: 30000
    },
    {
      id: 'tasks',
      type: 'tasks',
      title: 'My Tasks',
      icon: 'task_alt',
      component: TasksWidgetComponent,
      size: 'medium',
      position: 2,
      visible: true,
      refreshInterval: 30000
    },
    {
      id: 'team-activity',
      type: 'team-activity',
      title: 'Team Activity',
      icon: 'groups',
      component: TeamActivityWidgetComponent,
      size: 'medium',
      position: 3,
      visible: true,
      refreshInterval: 60000
    },
    {
      id: 'charts',
      type: 'charts',
      title: 'Analytics',
      icon: 'bar_chart',
      component: ChartsWidgetComponent,
      size: 'large',
      position: 4,
      visible: true,
      refreshInterval: 120000
    },
    {
      id: 'calendar',
      type: 'calendar',
      title: 'Calendar',
      icon: 'calendar_month',
      component: CalendarWidgetComponent,
      size: 'medium',
      position: 5,
      visible: true
    },
    {
      id: 'recent-activity',
      type: 'recent-activity',
      title: 'Recent Activity',
      icon: 'history',
      component: RecentActivityWidgetComponent,
      size: 'medium',
      position: 6,
      visible: true,
      refreshInterval: 45000
    },
    {
      id: 'weather',
      type: 'weather',
      title: 'Weather',
      icon: 'wb_sunny',
      component: WeatherWidgetComponent,
      size: 'small',
      position: 7,
      visible: true,
      refreshInterval: 600000
    }
  ]);
  
  // Computed values
  public visibleWidgets = computed(() => 
    this.widgets()
      .filter(w => w.visible)
      .sort((a, b) => a.position - b.position)
  );
  
  public filteredWidgets = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.visibleWidgets();
    
    return this.visibleWidgets().filter(widget => 
      widget.title.toLowerCase().includes(query) ||
      widget.type.toLowerCase().includes(query)
    );
  });
  
  public gridClasses = computed(() => ({
    'dashboard__grid': true,
    'dashboard__grid--edit': this.isEditMode(),
    [`dashboard__grid--${this.layout()}`]: true
  }));
  
  // User preferences
  private userPreferences = {
    layout: 'grid' as DashboardLayout,
    widgets: [] as string[],
    theme: 'auto'
  };
  
  constructor(
    private dashboardService: DashboardService,
    private themeService: ThemeService,
    private i18n: I18nService,
    private shortcuts: ShortcutService
  ) {
    // Auto-save widget configuration
    effect(() => {
      if (!this.isEditMode()) {
        this.saveWidgetConfiguration();
>>>>>>> feature/SPM-016-projects-tasks
      }
    });
  }
  
  ngOnInit(): void {
<<<<<<< HEAD
    this.setupResponsiveLayout();
    this.loadDashboardData();
    this.setupWebSocketListeners();
    this.setupKeyboardShortcuts();
    this.initializeCharts();
    this.loadActivities();
=======
    this.loadUserPreferences();
    this.loadDashboardData();
    this.setupKeyboardShortcuts();
    this.setupAutoRefresh();
>>>>>>> feature/SPM-016-projects-tasks
    
    // Simulate loading
    setTimeout(() => {
      this.isLoading.set(false);
<<<<<<< HEAD
    }, 1500);
=======
    }, 1000);
>>>>>>> feature/SPM-016-projects-tasks
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
<<<<<<< HEAD
    this.stopAutoRefresh();
    this.removeKeyboardShortcuts();
    this.destroyCharts();
    this.wsService.disconnect();
  }
  
  /**
   * Setup responsive layout detection
   */
  private setupResponsiveLayout(): void {
    this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.Tablet,
      Breakpoints.Desktop
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(result => {
      this.isMobile.set(result.breakpoints[Breakpoints.Handset]);
      this.isTablet.set(result.breakpoints[Breakpoints.Tablet]);
      this.isDesktop.set(result.breakpoints[Breakpoints.Desktop] || 
                        (!result.breakpoints[Breakpoints.Handset] && !result.breakpoints[Breakpoints.Tablet]));
      
      // Resize charts on breakpoint change
      this.resizeCharts();
    });
=======
>>>>>>> feature/SPM-016-projects-tasks
  }
  
  /**
   * Load dashboard data
   */
<<<<<<< HEAD
  private async loadDashboardData(): Promise<void> {
    // Simulate API calls
    this.animateNumber(this.totalProjects, 12);
    this.animateNumber(this.activeSprints, 3);
    this.animateNumber(this.completedTasks, 156);
    this.animateNumber(this.teamMembers, 24);
    this.animateNumber(this.velocity, 42);
    this.animateNumber(this.bugCount, 8);
    this.animateNumber(this.codeReviews, 15);
    this.animateNumber(this.deployments, 4);
    
    this.lastUpdated.set(new Date());
  }
  
  /**
   * Animate number changes
   */
  private animateNumber(signal: any, target: number, duration: number = 1000): void {
    const start = signal();
    const increment = (target - start) / (duration / 50);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        signal.set(target);
        clearInterval(timer);
      } else {
        signal.set(Math.round(current));
      }
    }, 50);
  }
  
  /**
   * Setup WebSocket listeners for real-time updates
   */
  private setupWebSocketListeners(): void {
    this.wsService.connect();
    
    this.wsService.on('dashboard:update')
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.handleRealtimeUpdate(data);
      });
    
    this.wsService.on('sprint:update')
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.updateSprintMetrics(data);
      });
    
    this.wsService.on('task:update')
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.updateTaskMetrics(data);
      });
  }
  
  /**
   * Handle real-time updates
   */
  private handleRealtimeUpdate(data: any): void {
    if (data.type === 'kpi') {
      this.animateNumber(this[data.metric], data.value);
    } else if (data.type === 'activity') {
      this.addActivity(data.activity);
    }
    
    this.lastUpdated.set(new Date());
  }
  
  /**
   * Update sprint metrics
   */
  private updateSprintMetrics(data: any): void {
    if (data.velocity) {
      this.animateNumber(this.velocity, data.velocity);
      this.updateVelocityChart();
    }
    
    if (data.burndown) {
      this.updateBurndownChart(data.burndown);
=======
  private loadDashboardData(): void {
    this.dashboardService.loadDashboardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Dashboard data loaded', data);
        },
        error: (error) => {
          console.error('Error loading dashboard data', error);
        }
      });
  }
  
  /**
   * Load user preferences
   */
  private loadUserPreferences(): void {
    const saved = localStorage.getItem('dashboard-preferences');
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        this.userPreferences = preferences;
        this.layout.set(preferences.layout);
        
        // Restore widget visibility
        if (preferences.widgets && preferences.widgets.length > 0) {
          this.widgets.update(widgets => 
            widgets.map(w => ({
              ...w,
              visible: preferences.widgets.includes(w.id)
            }))
          );
        }
      } catch (error) {
        console.error('Error loading preferences', error);
      }
>>>>>>> feature/SPM-016-projects-tasks
    }
  }
  
  /**
<<<<<<< HEAD
   * Update task metrics
   */
  private updateTaskMetrics(data: any): void {
    if (data.completed) {
      this.animateNumber(this.completedTasks, data.completed);
    }
    
    if (data.bugs) {
      this.animateNumber(this.bugCount, data.bugs);
    }
    
    this.updateTaskChart();
=======
   * Save widget configuration
   */
  private saveWidgetConfiguration(): void {
    const preferences = {
      layout: this.layout(),
      widgets: this.visibleWidgets().map(w => w.id),
      theme: this.themeService.currentTheme()
    };
    localStorage.setItem('dashboard-preferences', JSON.stringify(preferences));
>>>>>>> feature/SPM-016-projects-tasks
  }
  
  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
<<<<<<< HEAD
    this.shortcutService.add('ctrl+r', () => this.refreshDashboard());
    this.shortcutService.add('ctrl+e', () => this.exportDashboard());
    this.shortcutService.add('ctrl+shift+f', () => this.toggleFullscreen());
    this.shortcutService.add('alt+1', () => this.selectedPeriod.set('week'));
    this.shortcutService.add('alt+2', () => this.selectedPeriod.set('month'));
    this.shortcutService.add('alt+3', () => this.selectedPeriod.set('quarter'));
    this.shortcutService.add('alt+4', () => this.selectedPeriod.set('year'));
  }
  
  /**
   * Remove keyboard shortcuts
   */
  private removeKeyboardShortcuts(): void {
    this.shortcutService.remove('ctrl+r');
    this.shortcutService.remove('ctrl+e');
    this.shortcutService.remove('ctrl+shift+f');
    this.shortcutService.remove('alt+1');
    this.shortcutService.remove('alt+2');
    this.shortcutService.remove('alt+3');
    this.shortcutService.remove('alt+4');
  }
  
  /**
   * Initialize all charts
   */
  private initializeCharts(): void {
    // Wait for view to initialize
    setTimeout(() => {
      this.initVelocityChart();
      this.initBurndownChart();
      this.initTaskChart();
      this.initTeamChart();
    }, 100);
  }
  
  /**
   * Initialize velocity chart
   */
  private initVelocityChart(): void {
    if (!this.velocityChartRef) return;
    
    const ctx = this.velocityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const isDark = this.themeService.isDarkTheme();
    
    this.velocityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5', 'Sprint 6'],
        datasets: [{
          label: 'Velocity',
          data: [32, 35, 38, 40, 42, 45],
          borderColor: '#4285f4',
          backgroundColor: 'rgba(66, 133, 244, 0.1)',
          tension: 0.4,
          fill: true
        }, {
          label: 'Commitment',
          data: [35, 37, 40, 42, 44, 46],
          borderColor: '#34a853',
          backgroundColor: 'rgba(52, 168, 83, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: isDark ? '#fff' : '#333'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: isDark ? '#fff' : '#333'
            }
          },
          x: {
            grid: {
              color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: isDark ? '#fff' : '#333'
            }
          }
        }
      }
    });
  }
  
  /**
   * Initialize burndown chart
   */
  private initBurndownChart(): void {
    if (!this.burndownChartRef) return;
    
    const ctx = this.burndownChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const isDark = this.themeService.isDarkTheme();
    
    this.burndownChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array.from({ length: 14 }, (_, i) => `Day ${i + 1}`),
        datasets: [{
          label: 'Ideal',
          data: Array.from({ length: 14 }, (_, i) => 100 - (i * 7.14)),
          borderColor: '#9e9e9e',
          borderDash: [5, 5],
          fill: false
        }, {
          label: 'Actual',
          data: [100, 95, 92, 85, 78, 72, 65, 58, 50, 42, 35, 28, 20, 10],
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: isDark ? '#fff' : '#333'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: isDark ? '#fff' : '#333',
              callback: (value) => value + '%'
            }
          },
          x: {
            grid: {
              color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: isDark ? '#fff' : '#333'
            }
          }
        }
      }
    });
  }
  
  /**
   * Initialize task distribution chart
   */
  private initTaskChart(): void {
    if (!this.taskChartRef) return;
    
    const ctx = this.taskChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const isDark = this.themeService.isDarkTheme();
    
    this.taskChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'In Progress', 'To Do', 'Blocked'],
        datasets: [{
          data: [156, 42, 28, 8],
          backgroundColor: [
            '#34a853',
            '#4285f4',
            '#fbbc04',
            '#ea4335'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: isDark ? '#fff' : '#333',
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * Initialize team performance chart
   */
  private initTeamChart(): void {
    if (!this.teamChartRef) return;
    
    const ctx = this.teamChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const isDark = this.themeService.isDarkTheme();
    
    this.teamChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Productivity', 'Quality', 'Collaboration', 'Innovation', 'Delivery'],
        datasets: [{
          label: 'Current Sprint',
          data: [85, 92, 78, 88, 90],
          borderColor: '#4285f4',
          backgroundColor: 'rgba(66, 133, 244, 0.2)',
          pointBackgroundColor: '#4285f4',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#4285f4'
        }, {
          label: 'Previous Sprint',
          data: [80, 88, 75, 82, 85],
          borderColor: '#9e9e9e',
          backgroundColor: 'rgba(158, 158, 158, 0.2)',
          pointBackgroundColor: '#9e9e9e',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#9e9e9e'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: isDark ? '#fff' : '#333'
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            pointLabels: {
              color: isDark ? '#fff' : '#333'
            },
            ticks: {
              color: isDark ? '#fff' : '#333',
              backdropColor: 'transparent'
            }
          }
        }
      }
    });
  }
  
  /**
   * Update charts theme
   */
  private updateChartsTheme(): void {
    if (this.velocityChart || this.burndownChart || this.taskChart || this.teamChart) {
      this.destroyCharts();
      this.initializeCharts();
    }
  }
  
  /**
   * Resize charts
   */
  private resizeCharts(): void {
    if (this.velocityChart) this.velocityChart.resize();
    if (this.burndownChart) this.burndownChart.resize();
    if (this.taskChart) this.taskChart.resize();
    if (this.teamChart) this.teamChart.resize();
  }
  
  /**
   * Destroy all charts
   */
  private destroyCharts(): void {
    if (this.velocityChart) {
      this.velocityChart.destroy();
      this.velocityChart = null;
    }
    if (this.burndownChart) {
      this.burndownChart.destroy();
      this.burndownChart = null;
    }
    if (this.taskChart) {
      this.taskChart.destroy();
      this.taskChart = null;
    }
    if (this.teamChart) {
      this.teamChart.destroy();
      this.teamChart = null;
    }
  }
  
  /**
   * Update velocity chart
   */
  private updateVelocityChart(): void {
    if (!this.velocityChart) return;
    
    // Update chart data
    this.velocityChart.data.datasets[0].data = [32, 35, 38, 40, 42, this.velocity()];
    this.velocityChart.update();
  }
  
  /**
   * Update burndown chart
   */
  private updateBurndownChart(data: number[]): void {
    if (!this.burndownChart) return;
    
    this.burndownChart.data.datasets[1].data = data;
    this.burndownChart.update();
  }
  
  /**
   * Update task chart
   */
  private updateTaskChart(): void {
    if (!this.taskChart) return;
    
    this.taskChart.data.datasets[0].data = [
      this.completedTasks(),
      42,
      28,
      this.bugCount()
    ];
    this.taskChart.update();
  }
  
  /**
   * Load activity timeline
   */
  private loadActivities(): void {
    this.activities.set([
      {
        id: '1',
        type: 'task',
        title: 'Task #234 completed',
        description: 'Login component implementation finished',
        user: 'John Doe',
        avatar: 'assets/avatars/john.jpg',
        timestamp: new Date(Date.now() - 600000),
        icon: 'check_circle',
        color: 'primary'
      },
      {
        id: '2',
        type: 'comment',
        title: 'New comment on Task #156',
        description: 'Please review the latest changes',
        user: 'Jane Smith',
        avatar: 'assets/avatars/jane.jpg',
        timestamp: new Date(Date.now() - 1800000),
        icon: 'comment',
        color: 'accent'
      },
      {
        id: '3',
        type: 'sprint',
        title: 'Sprint 4 started',
        description: '14 days sprint with 42 story points',
        user: 'System',
        avatar: null,
        timestamp: new Date(Date.now() - 3600000),
        icon: 'flag',
        color: 'warn'
      },
      {
        id: '4',
        type: 'deployment',
        title: 'Production deployment successful',
        description: 'Version 1.2.0 deployed to production',
        user: 'CI/CD Pipeline',
        avatar: null,
        timestamp: new Date(Date.now() - 7200000),
        icon: 'cloud_upload',
        color: 'success'
      }
    ]);
  }
  
  /**
   * Add new activity
   */
  private addActivity(activity: Activity): void {
    const currentActivities = this.activities();
    this.activities.set([activity, ...currentActivities.slice(0, 9)]);
  }
  
  /**
   * Start auto-refresh
   */
  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    
    this.refreshSubscription = interval(this.refreshInterval())
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshDashboard();
      });
  }
  
  /**
   * Stop auto-refresh
   */
  private stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
  
  /**
   * Handle period change
   */
  onPeriodChange(period: 'week' | 'month' | 'quarter' | 'year'): void {
    this.selectedPeriod.set(period);
    this.refreshDashboard();
  }
  
  /**
   * Handle project change
   */
  onProjectChange(projectId: string | null): void {
    this.selectedProject.set(projectId);
    this.refreshDashboard();
  }
  
  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.isLoading.set(true);
    this.loadDashboardData();
    
    setTimeout(() => {
      this.isLoading.set(false);
=======
    // Refresh dashboard
    this.shortcuts.register({
      keys: 'ctrl+r',
      description: 'Refresh dashboard',
      handler: () => this.refreshAll()
    });
    
    // Toggle edit mode
    this.shortcuts.register({
      keys: 'ctrl+e',
      description: 'Toggle edit mode',
      handler: () => this.toggleEditMode()
    });
    
    // Change layout
    this.shortcuts.register({
      keys: 'ctrl+l',
      description: 'Cycle layout',
      handler: () => this.cycleLayout()
    });
    
    // Search widgets
    this.shortcuts.register({
      keys: 'ctrl+f',
      description: 'Search widgets',
      handler: () => this.focusSearch()
    });
  }
  
  /**
   * Setup auto-refresh for widgets
   */
  private setupAutoRefresh(): void {
    this.widgets().forEach(widget => {
      if (widget.refreshInterval) {
        setInterval(() => {
          if (widget.visible && !this.refreshing().has(widget.id)) {
            this.refreshWidget(widget);
          }
        }, widget.refreshInterval);
      }
    });
  }
  
  /**
   * Toggle edit mode
   */
  public toggleEditMode(): void {
    this.isEditMode.set(!this.isEditMode());
  }
  
  /**
   * Change layout
   */
  public changeLayout(layout: DashboardLayout): void {
    this.layout.set(layout);
    this.saveWidgetConfiguration();
  }
  
  /**
   * Cycle through layouts
   */
  public cycleLayout(): void {
    const layouts: DashboardLayout[] = ['grid', 'list', 'compact', 'custom'];
    const currentIndex = layouts.indexOf(this.layout());
    const nextIndex = (currentIndex + 1) % layouts.length;
    this.changeLayout(layouts[nextIndex]);
  }
  
  /**
   * Refresh all widgets
   */
  public refreshAll(): void {
    this.visibleWidgets().forEach(widget => {
      this.refreshWidget(widget);
    });
  }
  
  /**
   * Refresh single widget
   */
  public refreshWidget(widget: WidgetConfig): void {
    this.refreshing.update(set => {
      const newSet = new Set(set);
      newSet.add(widget.id);
      return newSet;
    });
    
    // Simulate refresh
    setTimeout(() => {
      this.refreshing.update(set => {
        const newSet = new Set(set);
        newSet.delete(widget.id);
        return newSet;
      });
>>>>>>> feature/SPM-016-projects-tasks
    }, 1000);
  }
  
  /**
<<<<<<< HEAD
   * Export dashboard data
   */
  exportDashboard(): void {
    const data = {
      period: this.selectedPeriod(),
      metrics: {
        totalProjects: this.totalProjects(),
        activeSprints: this.activeSprints(),
        completedTasks: this.completedTasks(),
        teamMembers: this.teamMembers(),
        velocity: this.velocity(),
        bugCount: this.bugCount(),
        codeReviews: this.codeReviews(),
        deployments: this.deployments()
      },
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard_${this.selectedPeriod()}_${Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  
  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
  
  /**
   * Toggle auto-refresh
   */
  toggleAutoRefresh(): void {
    this.autoRefresh.update(refresh => !refresh);
  }
  
  /**
   * Handle widget drop
   */
  onWidgetDrop(event: CdkDragDrop<Widget[]>): void {
    const widgets = [...this.widgets()];
    moveItemInArray(widgets, event.previousIndex, event.currentIndex);
    this.widgets.set(widgets);
  }
  
  /**
   * Toggle widget visibility
   */
  toggleWidget(widgetId: string): void {
    const widgets = this.widgets().map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    );
=======
   * Toggle widget visibility
   */
  public toggleWidget(widget: WidgetConfig): void {
    this.widgets.update(widgets => 
      widgets.map(w => 
        w.id === widget.id ? { ...w, visible: !w.visible } : w
      )
    );
  }
  
  /**
   * Expand widget to fullscreen
   */
  public expandWidget(widget: WidgetConfig): void {
    this.expandedWidget.set(widget.id === this.expandedWidget() ? null : widget.id);
  }
  
  /**
   * Configure widget
   */
  public configureWidget(widget: WidgetConfig): void {
    // Open widget configuration dialog
    console.log('Configure widget', widget);
  }
  
  /**
   * Remove widget
   */
  public removeWidget(widget: WidgetConfig): void {
    this.widgets.update(widgets => 
      widgets.map(w => 
        w.id === widget.id ? { ...w, visible: false } : w
      )
    );
  }
  
  /**
   * Handle widget drag and drop
   */
  public onWidgetDrop(event: CdkDragDrop<WidgetConfig[]>): void {
    const widgets = [...this.widgets()];
    moveItemInArray(widgets, event.previousIndex, event.currentIndex);
    
    // Update positions
    widgets.forEach((widget, index) => {
      widget.position = index;
    });
    
>>>>>>> feature/SPM-016-projects-tasks
    this.widgets.set(widgets);
  }
  
  /**
<<<<<<< HEAD
   * Navigate to detail page
   */
  navigateToDetail(type: string): void {
    switch (type) {
      case 'projects':
        this.router.navigate(['/projects']);
        break;
      case 'sprints':
        this.router.navigate(['/sprints']);
        break;
      case 'tasks':
        this.router.navigate(['/tasks']);
        break;
      case 'team':
        this.router.navigate(['/team']);
        break;
=======
   * Add new widget
   */
  public addWidget(): void {
    // Open widget gallery
    console.log('Add new widget');
  }
  
  /**
   * Reset to default layout
   */
  public resetLayout(): void {
    if (confirm(this.i18n.translate('dashboard.resetConfirm'))) {
      localStorage.removeItem('dashboard-preferences');
      window.location.reload();
>>>>>>> feature/SPM-016-projects-tasks
    }
  }
  
  /**
<<<<<<< HEAD
   * Format relative time
   */
  formatRelativeTime(date: Date): string {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return this.translateService.instant('dashboard.time.justNow');
    if (minutes < 60) return this.translateService.instant('dashboard.time.minutesAgo', { count: minutes });
    if (hours < 24) return this.translateService.instant('dashboard.time.hoursAgo', { count: hours });
    return this.translateService.instant('dashboard.time.daysAgo', { count: days });
  }
  
  /**
   * Get trend icon
   */
  getTrendIcon(current: number, previous: number): string {
    if (current > previous) return 'trending_up';
    if (current < previous) return 'trending_down';
    return 'trending_flat';
  }
  
  /**
   * Get trend color
   */
  getTrendColor(current: number, previous: number, inverse: boolean = false): string {
    const isPositive = current > previous;
    if (inverse) {
      return isPositive ? 'warn' : 'primary';
    }
    return isPositive ? 'primary' : 'warn';
  }
}

// Interfaces
interface Activity {
  id: string;
  type: 'task' | 'comment' | 'sprint' | 'deployment' | 'review';
  title: string;
  description: string;
  user: string;
  avatar: string | null;
  timestamp: Date;
  icon: string;
  color: string;
}

interface Widget {
  id: string;
  title: string;
  icon: string;
  cols: number;
  rows: number;
  enabled: boolean;
}
=======
   * Export dashboard configuration
   */
  public exportConfiguration(): void {
    const config = {
      layout: this.layout(),
      widgets: this.widgets(),
      preferences: this.userPreferences
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard-config.json';
    link.click();
    URL.revokeObjectURL(url);
  }
  
  /**
   * Import dashboard configuration
   */
  public importConfiguration(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const config = JSON.parse(e.target.result);
            this.layout.set(config.layout);
            this.widgets.set(config.widgets);
            this.userPreferences = config.preferences;
            this.saveWidgetConfiguration();
          } catch (error) {
            console.error('Error importing configuration', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }
  
  /**
   * Focus search input
   */
  private focusSearch(): void {
    const searchInput = document.querySelector('.dashboard__search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }
  
  /**
   * Get widget size classes
   */
  public getWidgetSizeClass(widget: WidgetConfig): string {
    const expanded = this.expandedWidget() === widget.id;
    if (expanded) return 'dashboard__widget--fullscreen';
    
    return `dashboard__widget--${widget.size}`;
  }
  
  /**
   * Track by function for performance
   */
  public trackByWidgetId(index: number, widget: WidgetConfig): string {
    return widget.id;
  }
}
>>>>>>> feature/SPM-016-projects-tasks
