/**
 * Sprint Progress Widget Component
 * Displays current sprint progress with burndown chart
 */
import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DashboardService, SprintProgress } from '../../services/dashboard.service';

@Component({
  selector: 'app-sprint-progress-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './sprint-progress-widget.component.html',
  styleUrls: ['./sprint-progress-widget.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ transform: 'translateY(0)', opacity: 1 })
        )
      ])
    ])
  ]
})
export class SprintProgressWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;
  @Input() compact = false;
  @Input() showChart = true;
  
  private destroy$ = new Subject<void>();
  
  // State
  public isLoading = signal(true);
  public sprintData = signal<SprintProgress | null>(null);
  public selectedView = signal<'burndown' | 'stats'>('burndown');
  
  // Computed values
  public progressPercentage = computed(() => {
    const data = this.sprintData();
    return data ? data.progress : 0;
  });
  
  public daysProgress = computed(() => {
    const data = this.sprintData();
    if (!data) return 0;
    
    const start = new Date(data.startDate).getTime();
    const end = new Date(data.endDate).getTime();
    const now = Date.now();
    
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    
    return Math.min(100, (elapsedDays / totalDays) * 100);
  });
  
  public isOnTrack = computed(() => {
    const data = this.sprintData();
    if (!data) return true;
    
    const timeProgress = this.daysProgress();
    const workProgress = data.progress;
    
    // Consider on track if work progress is within 10% of time progress
    return Math.abs(workProgress - timeProgress) <= 10;
  });
  
  public velocity = computed(() => {
    const data = this.sprintData();
    if (!data || data.daysRemaining === 0) return 0;
    
    const pointsPerDay = data.completedPoints / 
      Math.max(1, this.getElapsedDays());
    return Math.round(pointsPerDay * 10) / 10;
  });
  
  public estimatedCompletion = computed(() => {
    const data = this.sprintData();
    if (!data || this.velocity() === 0) return null;
    
    const remainingDays = Math.ceil(
      data.remainingPoints / this.velocity()
    );
    
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + remainingDays);
    
    return completionDate;
  });
  
  constructor(private dashboardService: DashboardService) {}
  
  ngOnInit(): void {
    this.loadSprintData();
    this.subscribeToUpdates();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Load sprint data
   */
  private loadSprintData(): void {
    this.isLoading.set(true);
    
    this.dashboardService.loadSprintProgress()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sprintData.set(data);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading sprint data:', error);
          this.isLoading.set(false);
        }
      });
  }
  
  /**
   * Subscribe to real-time updates
   */
  private subscribeToUpdates(): void {
    this.dashboardService.sprintProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.sprintData.set(data);
        }
      });
  }
  
  /**
   * Get elapsed days
   */
  private getElapsedDays(): number {
    const data = this.sprintData();
    if (!data) return 0;
    
    const start = new Date(data.startDate).getTime();
    const now = Date.now();
    
    return Math.ceil((now - start) / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Format date for display
   */
  public formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  /**
   * Get status color
   */
  public getStatusColor(status?: string): string {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in-progress':
        return '#2196f3';
      case 'overdue':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  }
  
  /**
   * Get status icon
   */
  public getStatusIcon(status?: string): string {
    switch (status) {
      case 'completed':
        return 'check_circle';
      case 'in-progress':
        return 'timer';
      case 'overdue':
        return 'warning';
      default:
        return 'schedule';
    }
  }
  
  /**
   * Get progress color
   */
  public getProgressColor(): string {
    const onTrack = this.isOnTrack();
    const progress = this.progressPercentage();
    
    if (onTrack) {
      return progress >= 80 ? 'primary' : 'accent';
    }
    return 'warn';
  }
  
  /**
   * Change view
   */
  public changeView(view: 'burndown' | 'stats'): void {
    this.selectedView.set(view);
  }
  
  /**
   * Refresh data
   */
  public refresh(): void {
    this.loadSprintData();
  }
  
  /**
   * Navigate to sprint details
   */
  public viewDetails(): void {
    const data = this.sprintData();
    if (data) {
      console.log('Navigate to sprint:', data.sprintId);
    }
  }
}
