/**
 * Stats Widget Component
 * Displays key performance indicators and metrics
 */
import { Component, OnInit, OnDestroy, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';

/**
 * Stat card configuration
 */
interface StatCard {
  id: string;
  title: string;
  value: number | string;
  icon: string;
  color: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  unit?: string;
  description?: string;
  progress?: number;
  target?: number;
  link?: string;
}

@Component({
  selector: 'app-stats-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatRippleModule
  ],
  templateUrl: './stats-widget.component.html',
  styleUrls: ['./stats-widget.component.scss'],
  animations: [
    trigger('statAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ]),
    trigger('valueChange', [
      transition(':increment', [
        animate('600ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ transform: 'scale(1.1)' })
        ),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ transform: 'scale(1)' })
        )
      ])
    ])
  ]
})
export class StatsWidgetComponent implements OnInit, OnDestroy {
  @Input() compact = false;
  
  private destroy$ = new Subject<void>();
  
  // State
  public isLoading = signal(true);
  public stats = signal<DashboardStats | null>(null);
  public animateValues = signal(false);
  
  // Stat cards
  public statCards = computed<StatCard[]>(() => {
    const data = this.stats();
    if (!data) return [];
    
    return [
      {
        id: 'projects',
        title: 'Active Projects',
        value: data.activeProjects,
        icon: 'folder_open',
        color: '#2196f3',
        change: this.calculateChange(data.activeProjects, 6),
        changeType: data.activeProjects > 6 ? 'increase' : 'decrease',
        unit: 'of ' + data.totalProjects,
        description: 'Currently active projects',
        progress: (data.activeProjects / data.totalProjects) * 100
      },
      {
        id: 'tasks',
        title: 'Tasks Completed',
        value: data.completedTasks,
        icon: 'task_alt',
        color: '#4caf50',
        change: this.calculateChange(data.completedTasks, 142),
        changeType: 'increase',
        unit: 'of ' + data.totalTasks,
        description: 'Tasks completed this sprint',
        progress: (data.completedTasks / data.totalTasks) * 100
      },
      {
        id: 'velocity',
        title: 'Sprint Velocity',
        value: data.velocity,
        icon: 'speed',
        color: '#ff9800',
        change: this.calculateChange(data.velocity, 38),
        changeType: data.velocity > 38 ? 'increase' : 'decrease',
        unit: 'story points',
        description: 'Average velocity over last 3 sprints',
        target: 45,
        progress: (data.velocity / 45) * 100
      },
      {
        id: 'productivity',
        title: 'Productivity Score',
        value: data.productivityScore + '%',
        icon: 'trending_up',
        color: '#9c27b0',
        change: this.calculateChange(data.productivityScore, 82),
        changeType: data.productivityScore > 82 ? 'increase' : 'neutral',
        description: 'Team productivity index',
        progress: data.productivityScore
      },
      {
        id: 'burndown',
        title: 'Burndown Rate',
        value: Math.round(data.burndownRate * 100) + '%',
        icon: 'local_fire_department',
        color: '#f44336',
        change: this.calculateChange(data.burndownRate * 100, 75),
        changeType: data.burndownRate > 0.75 ? 'increase' : 'decrease',
        description: 'Sprint burndown efficiency',
        progress: data.burndownRate * 100
      },
      {
        id: 'team',
        title: 'Team Members',
        value: data.teamMembers,
        icon: 'groups',
        color: '#00bcd4',
        change: 0,
        changeType: 'neutral',
        description: 'Active team members'
      }
    ];
  });
  
  // Computed values
  public primaryStats = computed(() => this.statCards().slice(0, 4));
  public secondaryStats = computed(() => this.statCards().slice(4));
  
  constructor(private dashboardService: DashboardService) {}
  
  ngOnInit(): void {
    this.loadStats();
    this.subscribeToUpdates();
    
    // Animate values after load
    setTimeout(() => {
      this.animateValues.set(true);
    }, 500);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Load statistics
   */
  private loadStats(): void {
    this.isLoading.set(true);
    
    this.dashboardService.loadStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats.set(stats);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading stats:', error);
          this.isLoading.set(false);
        }
      });
  }
  
  /**
   * Subscribe to real-time updates
   */
  private subscribeToUpdates(): void {
    this.dashboardService.stats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        if (stats) {
          this.stats.set(stats);
        }
      });
  }
  
  /**
   * Calculate percentage change
   */
  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }
  
  /**
   * Get change icon
   */
  public getChangeIcon(changeType?: string): string {
    switch (changeType) {
      case 'increase':
        return 'trending_up';
      case 'decrease':
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  }
  
  /**
   * Get change color
   */
  public getChangeColor(changeType?: string, isPositive = true): string {
    if (changeType === 'neutral') return '#9e9e9e';
    
    const isGood = (changeType === 'increase' && isPositive) || 
                   (changeType === 'decrease' && !isPositive);
    
    return isGood ? '#4caf50' : '#f44336';
  }
  
  /**
   * Format large numbers
   */
  public formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }
  
  /**
   * Get progress bar color
   */
  public getProgressColor(progress: number): string {
    if (progress >= 80) return 'primary';
    if (progress >= 60) return 'accent';
    if (progress >= 40) return 'warn';
    return 'warn';
  }
  
  /**
   * Handle stat click
   */
  public onStatClick(stat: StatCard): void {
    if (stat.link) {
      // Navigate to detailed view
      console.log('Navigate to:', stat.link);
    }
  }
  
  /**
   * Refresh stats
   */
  public refresh(): void {
    this.animateValues.set(false);
    this.loadStats();
    
    setTimeout(() => {
      this.animateValues.set(true);
    }, 100);
  }
  
  /**
   * Track by function for performance
   */
  public trackByStatId(index: number, stat: StatCard): string {
    return stat.id;
  }
}
