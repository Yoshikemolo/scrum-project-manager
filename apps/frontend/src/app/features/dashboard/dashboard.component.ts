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
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
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
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
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
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
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
      }
    });
  }
  
  ngOnInit(): void {
    this.setupResponsiveLayout();
    this.loadDashboardData();
    this.setupWebSocketListeners();
    this.setupKeyboardShortcuts();
    this.initializeCharts();
    this.loadActivities();
    
    // Simulate loading
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1500);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
  }
  
  /**
   * Load dashboard data
   */
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
    }
  }
  
  /**
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
  }
  
  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
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
    }, 1000);
  }
  
  /**
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
    this.widgets.set(widgets);
  }
  
  /**
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
    }
  }
  
  /**
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
