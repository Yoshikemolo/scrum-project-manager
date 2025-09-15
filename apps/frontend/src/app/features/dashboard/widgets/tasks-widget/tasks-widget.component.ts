/**
 * Tasks Widget Component
 * Displays user's assigned tasks with quick actions
 */
import { Component, OnInit, OnDestroy, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DashboardService, TaskItem } from '../../services/dashboard.service';

/**
 * Task status type
 */
type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

/**
 * Task priority type
 */
type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

@Component({
  selector: 'app-tasks-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatTabsModule,
    MatBadgeModule,
    MatCheckboxModule,
    MatProgressBarModule,
    DragDropModule
  ],
  templateUrl: './tasks-widget.component.html',
  styleUrls: ['./tasks-widget.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(50, [
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
              style({ opacity: 1, transform: 'translateY(0)' })
            )
          ])
        ], { optional: true })
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-10px)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ transform: 'translateX(0)', opacity: 1 })
        )
      ])
    ])
  ]
})
export class TasksWidgetComponent implements OnInit, OnDestroy {
  @Input() compact = false;
  @Input() showFilters = true;
  
  private destroy$ = new Subject<void>();
  
  // State
  public isLoading = signal(true);
  public tasks = signal<TaskItem[]>([]);
  public selectedTab = signal<TaskStatus | 'all'>('all');
  public selectedPriority = signal<TaskPriority | 'all'>('all');
  public showCompleted = signal(false);
  public selectedTasks = signal<Set<string>>(new Set());
  public viewMode = signal<'list' | 'kanban'>('list');
  
  // Computed values
  public tasksByStatus = computed(() => {
    const allTasks = this.tasks();
    return {
      todo: allTasks.filter(t => t.status === 'todo'),
      'in-progress': allTasks.filter(t => t.status === 'in-progress'),
      review: allTasks.filter(t => t.status === 'review'),
      done: allTasks.filter(t => t.status === 'done')
    };
  });
  
  public filteredTasks = computed(() => {
    let filtered = this.tasks();
    const tab = this.selectedTab();
    const priority = this.selectedPriority();
    const showCompleted = this.showCompleted();
    
    // Filter by status
    if (tab !== 'all') {
      filtered = filtered.filter(t => t.status === tab);
    }
    
    // Filter by priority
    if (priority !== 'all') {
      filtered = filtered.filter(t => t.priority === priority);
    }
    
    // Filter completed
    if (!showCompleted) {
      filtered = filtered.filter(t => t.status !== 'done');
    }
    
    // Sort by priority and due date
    return filtered.sort((a, b) => {
      // Priority order: critical > high > medium > low
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });
  });
  
  public overdueCount = computed(() => {
    const now = new Date();
    return this.tasks().filter(t => 
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
    ).length;
  });
  
  public upcomingCount = computed(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return this.tasks().filter(t => 
      t.dueDate && new Date(t.dueDate) <= tomorrow && t.status !== 'done'
    ).length;
  });
  
  constructor(private dashboardService: DashboardService) {}
  
  ngOnInit(): void {
    this.loadTasks();
    this.subscribeToUpdates();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Load tasks
   */
  private loadTasks(): void {
    this.isLoading.set(true);
    
    this.dashboardService.loadTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          this.tasks.set(tasks);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading tasks:', error);
          this.isLoading.set(false);
        }
      });
  }
  
  /**
   * Subscribe to real-time updates
   */
  private subscribeToUpdates(): void {
    this.dashboardService.tasks$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tasks => {
        this.tasks.set(tasks);
      });
  }
  
  /**
   * Change tab
   */
  public changeTab(tab: TaskStatus | 'all'): void {
    this.selectedTab.set(tab);
  }
  
  /**
   * Change priority filter
   */
  public changePriority(priority: TaskPriority | 'all'): void {
    this.selectedPriority.set(priority);
  }
  
  /**
   * Toggle view mode
   */
  public toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'list' ? 'kanban' : 'list');
  }
  
  /**
   * Toggle task selection
   */
  public toggleTaskSelection(taskId: string): void {
    this.selectedTasks.update(selected => {
      const newSelected = new Set(selected);
      if (newSelected.has(taskId)) {
        newSelected.delete(taskId);
      } else {
        newSelected.add(taskId);
      }
      return newSelected;
    });
  }
  
  /**
   * Update task status
   */
  public updateTaskStatus(task: TaskItem, status: TaskStatus): void {
    // Update locally
    this.tasks.update(tasks => 
      tasks.map(t => t.id === task.id ? { ...t, status } : t)
    );
    
    // Send update to server
    console.log('Update task status:', task.id, status);
  }
  
  /**
   * Handle drag and drop
   */
  public onTaskDrop(event: CdkDragDrop<TaskItem[]>, status?: TaskStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      if (status) {
        this.updateTaskStatus(task, status);
      }
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
  
  /**
   * Get priority color
   */
  public getPriorityColor(priority: TaskPriority): string {
    switch (priority) {
      case 'critical':
        return '#f44336';
      case 'high':
        return '#ff9800';
      case 'medium':
        return '#2196f3';
      case 'low':
        return '#9e9e9e';
      default:
        return '#9e9e9e';
    }
  }
  
  /**
   * Get priority icon
   */
  public getPriorityIcon(priority: TaskPriority): string {
    switch (priority) {
      case 'critical':
        return 'priority_high';
      case 'high':
        return 'arrow_upward';
      case 'medium':
        return 'remove';
      case 'low':
        return 'arrow_downward';
      default:
        return 'remove';
    }
  }
  
  /**
   * Get status color
   */
  public getStatusColor(status: TaskStatus): string {
    switch (status) {
      case 'todo':
        return '#9e9e9e';
      case 'in-progress':
        return '#2196f3';
      case 'review':
        return '#ff9800';
      case 'done':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  }
  
  /**
   * Get status icon
   */
  public getStatusIcon(status: TaskStatus): string {
    switch (status) {
      case 'todo':
        return 'radio_button_unchecked';
      case 'in-progress':
        return 'timer';
      case 'review':
        return 'rate_review';
      case 'done':
        return 'check_circle';
      default:
        return 'radio_button_unchecked';
    }
  }
  
  /**
   * Check if task is overdue
   */
  public isOverdue(task: TaskItem): boolean {
    if (!task.dueDate || task.status === 'done') return false;
    return new Date(task.dueDate) < new Date();
  }
  
  /**
   * Format due date
   */
  public formatDueDate(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffTime = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  /**
   * Open task details
   */
  public openTask(task: TaskItem): void {
    console.log('Open task:', task.id);
  }
  
  /**
   * Refresh tasks
   */
  public refresh(): void {
    this.loadTasks();
  }
  
  /**
   * Track by function
   */
  public trackByTaskId(index: number, task: TaskItem): string {
    return task.id;
  }
}
