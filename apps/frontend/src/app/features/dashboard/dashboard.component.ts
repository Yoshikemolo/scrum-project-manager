import { Component, OnInit, signal, computed, inject, ViewChild, ElementRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { animate, style, transition, trigger, stagger, query } from '@angular/animations';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, combineLatest } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatChipsModule,
    MatBadgeModule,
    DragDropModule,
    TranslateModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit {
  @ViewChild('velocityChart') velocityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('burndownChart') burndownChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('taskChart') taskChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('teamChart') teamChartRef!: ElementRef<HTMLCanvasElement>;

  private store = inject(Store);
  private translate = inject(TranslateService);
  private breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);

  // Signals for reactive state
  isLoading = signal(true);
  selectedPeriod = signal<'week' | 'month' | 'quarter' | 'year'>('month');
  selectedProject = signal<string>('all');
  refreshInterval = signal<number>(30000); // 30 seconds
  lastRefresh = signal<Date>(new Date());
  isMobile = signal(false);
  isDarkMode = signal(false);
  
  // Dashboard metrics
  metrics = signal({
    activeProjects: 12,
    completedTasks: 234,
    pendingTasks: 87,
    teamMembers: 24,
    velocity: 78,
    sprintProgress: 65,
    upcomingDeadlines: 5,
    blockedTasks: 3
  });

  // Computed values
  taskCompletionRate = computed(() => {
    const total = this.metrics().completedTasks + this.metrics().pendingTasks;
    return total > 0 ? Math.round((this.metrics().completedTasks / total) * 100) : 0;
  });

  productivityTrend = computed(() => {
    const velocity = this.metrics().velocity;
    if (velocity >= 80) return { icon: 'trending_up', color: 'success', label: 'Excellent' };
    if (velocity >= 60) return { icon: 'trending_flat', color: 'warning', label: 'Good' };
    return { icon: 'trending_down', color: 'error', label: 'Needs Improvement' };
  });

  // Widget configuration
  widgets = signal([
    {
      id: 'metrics',
      title: 'dashboard.widgets.metrics',
      icon: 'analytics',
      type: 'metrics',
      size: 'large',
      order: 0,
      visible: true,
      refreshable: true,
      configurable: true
    },
    {
      id: 'velocity',
      title: 'dashboard.widgets.velocity',
      icon: 'speed',
      type: 'chart',
      chartType: 'line',
      size: 'medium',
      order: 1,
      visible: true,
      refreshable: true,
      configurable: true
    },
    {
      id: 'burndown',
      title: 'dashboard.widgets.burndown',
      icon: 'show_chart',
      type: 'chart',
      chartType: 'line',
      size: 'medium',
      order: 2,
      visible: true,
      refreshable: true,
      configurable: true
    },
    {
      id: 'tasks',
      title: 'dashboard.widgets.tasks',
      icon: 'task_alt',
      type: 'chart',
      chartType: 'doughnut',
      size: 'small',
      order: 3,
      visible: true,
      refreshable: true,
      configurable: true
    },
    {
      id: 'team',
      title: 'dashboard.widgets.team',
      icon: 'groups',
      type: 'chart',
      chartType: 'bar',
      size: 'small',
      order: 4,
      visible: true,
      refreshable: true,
      configurable: true
    },
    {
      id: 'activity',
      title: 'dashboard.widgets.activity',
      icon: 'timeline',
      type: 'activity',
      size: 'medium',
      order: 5,
      visible: true,
      refreshable: true,
      configurable: false
    },
    {
      id: 'deadlines',
      title: 'dashboard.widgets.deadlines',
      icon: 'event',
      type: 'list',
      size: 'small',
      order: 6,
      visible: true,
      refreshable: true,
      configurable: false
    },
    {
      id: 'blockers',
      title: 'dashboard.widgets.blockers',
      icon: 'block',
      type: 'list',
      size: 'small',
      order: 7,
      visible: true,
      refreshable: true,
      configurable: false
    }
  ]);

  // Activity feed
  activities = signal([
    {
      id: 1,
      type: 'task_completed',
      user: { name: 'John Doe', avatar: null },
      action: 'completed task',
      target: 'User Authentication',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
      icon: 'check_circle',
      color: 'success'
    },
    {
      id: 2,
      type: 'comment_added',
      user: { name: 'Jane Smith', avatar: null },
      action: 'commented on',
      target: 'API Integration',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
      icon: 'comment',
      color: 'primary'
    },
    {
      id: 3,
      type: 'sprint_started',
      user: { name: 'Mike Johnson', avatar: null },
      action: 'started sprint',
      target: 'Sprint 15',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      icon: 'play_arrow',
      color: 'accent'
    },
    {
      id: 4,
      type: 'task_blocked',
      user: { name: 'Sarah Wilson', avatar: null },
      action: 'marked as blocked',
      target: 'Database Migration',
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
      icon: 'block',
      color: 'warn'
    },
    {
      id: 5,
      type: 'member_joined',
      user: { name: 'Tom Brown', avatar: null },
      action: 'joined the team',
      target: 'Frontend Team',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      icon: 'person_add',
      color: 'info'
    }
  ]);

  // Upcoming deadlines
  deadlines = signal([
    {
      id: 1,
      title: 'Sprint 15 Review',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days
      priority: 'high',
      project: 'Project Alpha'
    },
    {
      id: 2,
      title: 'API Documentation',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days
      priority: 'medium',
      project: 'Project Beta'
    },
    {
      id: 3,
      title: 'Security Audit',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      priority: 'high',
      project: 'Project Gamma'
    }
  ]);

  // Blocked tasks
  blockedTasks = signal([
    {
      id: 1,
      title: 'Database Migration',
      blockedBy: 'Infrastructure setup',
      assignee: 'John Doe',
      duration: '3 days'
    },
    {
      id: 2,
      title: 'Payment Integration',
      blockedBy: 'API credentials',
      assignee: 'Jane Smith',
      duration: '1 day'
    },
    {
      id: 3,
      title: 'Email Service',
      blockedBy: 'Domain verification',
      assignee: 'Mike Johnson',
      duration: '2 days'
    }
  ]);

  // Chart instances
  private charts: { [key: string]: Chart } = {};

  ngOnInit(): void {
    this.setupResponsive();
    this.loadDashboardData();
    this.setupAutoRefresh();
    this.initializeCharts();
  }

  private setupResponsive(): void {
    this.breakpointObserver.observe(['(max-width: 768px)'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        this.isMobile.set(result.matches);
        this.updateChartsResponsive();
      });
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.updateMetrics();
      this.updateCharts();
      this.isLoading.set(false);
      this.lastRefresh.set(new Date());
    }, 1000);
  }

  private setupAutoRefresh(): void {
    interval(this.refreshInterval())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshDashboard();
      });
  }

  private initializeCharts(): void {
    setTimeout(() => {
      this.createVelocityChart();
      this.createBurndownChart();
      this.createTaskChart();
      this.createTeamChart();
    }, 100);
  }

  private createVelocityChart(): void {
    if (!this.velocityChartRef) return;

    const ctx = this.velocityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.4)');
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0.05)');

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: ['Sprint 10', 'Sprint 11', 'Sprint 12', 'Sprint 13', 'Sprint 14', 'Sprint 15'],
        datasets: [{
          label: 'Story Points',
          data: [65, 72, 68, 74, 78, 82],
          borderColor: '#667eea',
          backgroundColor: gradient,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context) => `${context.parsed.y} points`
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#666'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              color: '#666',
              callback: (value) => `${value} pts`
            }
          }
        }
      }
    };

    this.charts['velocity'] = new Chart(ctx, config);
  }

  private createBurndownChart(): void {
    if (!this.burndownChartRef) return;

    const ctx = this.burndownChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10'],
        datasets: [
          {
            label: 'Ideal',
            data: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10],
            borderColor: '#10b981',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0,
            fill: false,
            pointRadius: 0
          },
          {
            label: 'Actual',
            data: [100, 95, 85, 78, 65, 58, 45, 35, null, null],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => `${value}%`
            }
          }
        }
      }
    };

    this.charts['burndown'] = new Chart(ctx, config);
  }

  private createTaskChart(): void {
    if (!this.taskChartRef) return;

    const ctx = this.taskChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'In Progress', 'To Do', 'Blocked'],
        datasets: [{
          data: [234, 87, 45, 3],
          backgroundColor: [
            '#10b981',
            '#3b82f6',
            '#6b7280',
            '#ef4444'
          ],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1000
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    };

    this.charts['tasks'] = new Chart(ctx, config);
  }

  private createTeamChart(): void {
    if (!this.teamChartRef) return;

    const ctx = this.teamChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['John', 'Jane', 'Mike', 'Sarah', 'Tom'],
        datasets: [{
          label: 'Tasks Completed',
          data: [45, 38, 42, 35, 40],
          backgroundColor: '#667eea',
          borderRadius: 8,
          barThickness: 30
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 10
            }
          }
        }
      }
    };

    this.charts['team'] = new Chart(ctx, config);
  }

  private updateMetrics(): void {
    // Simulate metric updates
    this.metrics.update(m => ({
      ...m,
      completedTasks: m.completedTasks + Math.floor(Math.random() * 5),
      velocity: Math.min(100, m.velocity + Math.floor(Math.random() * 3))
    }));
  }

  private updateCharts(): void {
    Object.values(this.charts).forEach(chart => {
      chart.update('active');
    });
  }

  private updateChartsResponsive(): void {
    Object.values(this.charts).forEach(chart => {
      chart.resize();
    });
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  refreshWidget(widgetId: string): void {
    // Refresh specific widget
    console.log(`Refreshing widget: ${widgetId}`);
  }

  onPeriodChange(period: 'week' | 'month' | 'quarter' | 'year'): void {
    this.selectedPeriod.set(period);
    this.loadDashboardData();
  }

  onProjectChange(projectId: string): void {
    this.selectedProject.set(projectId);
    this.loadDashboardData();
  }

  onWidgetDrop(event: CdkDragDrop<any[]>): void {
    const widgets = [...this.widgets()];
    moveItemInArray(widgets, event.previousIndex, event.currentIndex);
    widgets.forEach((widget, index) => widget.order = index);
    this.widgets.set(widgets);
    this.saveWidgetConfiguration();
  }

  toggleWidgetVisibility(widgetId: string): void {
    const widgets = this.widgets().map(w => 
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    );
    this.widgets.set(widgets);
    this.saveWidgetConfiguration();
  }

  configureWidget(widgetId: string): void {
    // Open widget configuration dialog
    console.log(`Configuring widget: ${widgetId}`);
  }

  private saveWidgetConfiguration(): void {
    // Save widget configuration to localStorage or backend
    localStorage.setItem('dashboard-widgets', JSON.stringify(this.widgets()));
  }

  exportDashboard(): void {
    // Export dashboard data
    console.log('Exporting dashboard...');
  }

  getRelativeTime(date: Date): string {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  getDaysUntil(date: Date): number {
    const now = Date.now();
    const diff = date.getTime() - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      high: 'warn',
      medium: 'accent',
      low: 'primary'
    };
    return colors[priority] || 'primary';
  }
}