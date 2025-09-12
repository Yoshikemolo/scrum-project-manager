import { Component, OnInit, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { animate, style, transition, trigger, state, query, stagger } from '@angular/animations';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: User | null;
  reporter: User;
  labels: string[];
  storyPoints: number;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  attachments: number;
  comments: number;
  subtasks: { completed: number; total: number };
  blockedBy: string[];
  linkedIssues: string[];
  timeTracking: {
    estimated: number;
    logged: number;
  };
}

interface User {
  id: string;
  name: string;
  avatar: string | null;
  email: string;
}

interface Column {
  id: 'todo' | 'in-progress' | 'review' | 'done';
  title: string;
  color: string;
  icon: string;
  limit?: number;
  tasks: Task[];
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatTooltipModule,
    MatBadgeModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    DragDropModule,
    TranslateModule
  ],
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss'],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-20px)', opacity: 0 }),
        animate('300ms ease-out', 
          style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger('50ms', [
            animate('200ms ease-out', 
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('dragAnimation', [
      state('dragging', style({
        transform: 'rotate(2deg) scale(1.05)',
        opacity: 0.8,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      })),
      transition('* => dragging', animate('200ms ease-out')),
      transition('dragging => *', animate('300ms ease-in'))
    ])
  ]
})
export class KanbanBoardComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private breakpointObserver = inject(BreakpointObserver);
  private fb = inject(FormBuilder);

  // State signals
  isLoading = signal(false);
  searchQuery = signal('');
  selectedFilters = signal({
    assignee: null as User | null,
    priority: null as string | null,
    labels: [] as string[],
    sprint: null as string | null
  });
  viewMode = signal<'board' | 'list'>('board');
  isCompactView = signal(false);
  showQuickAdd = signal(false);
  draggedTask = signal<Task | null>(null);
  hoveredColumn = signal<string | null>(null);
  selectedTasks = signal<Set<string>>(new Set());
  isMobile = signal(false);
  
  // Quick add form
  quickAddForm: FormGroup;

  // Columns configuration
  columns = signal<Column[]>([
    {
      id: 'todo',
      title: 'To Do',
      color: '#6b7280',
      icon: 'radio_button_unchecked',
      limit: 10,
      tasks: []
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: '#3b82f6',
      icon: 'timelapse',
      limit: 5,
      tasks: []
    },
    {
      id: 'review',
      title: 'Review',
      color: '#f59e0b',
      icon: 'rate_review',
      limit: 8,
      tasks: []
    },
    {
      id: 'done',
      title: 'Done',
      color: '#10b981',
      icon: 'check_circle',
      tasks: []
    }
  ]);

  // Sample users
  users = signal<User[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', avatar: null },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatar: null },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', avatar: null },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', avatar: null },
    { id: '5', name: 'Tom Brown', email: 'tom@example.com', avatar: null }
  ]);

  // Available labels
  availableLabels = signal<string[]>([
    'bug', 'feature', 'enhancement', 'documentation', 'urgent',
    'frontend', 'backend', 'database', 'ui/ux', 'testing'
  ]);

  // Computed values
  filteredColumns = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const filters = this.selectedFilters();
    
    return this.columns().map(column => ({
      ...column,
      tasks: column.tasks.filter(task => {
        // Search filter
        if (query && !task.title.toLowerCase().includes(query) && 
            !task.description.toLowerCase().includes(query)) {
          return false;
        }
        
        // Assignee filter
        if (filters.assignee && task.assignee?.id !== filters.assignee.id) {
          return false;
        }
        
        // Priority filter
        if (filters.priority && task.priority !== filters.priority) {
          return false;
        }
        
        // Labels filter
        if (filters.labels.length > 0 && 
            !filters.labels.some(label => task.labels.includes(label))) {
          return false;
        }
        
        return true;
      })
    }));
  });

  totalTasks = computed(() => 
    this.columns().reduce((sum, col) => sum + col.tasks.length, 0)
  );

  completedTasks = computed(() => 
    this.columns().find(col => col.id === 'done')?.tasks.length || 0
  );

  completionRate = computed(() => {
    const total = this.totalTasks();
    return total > 0 ? Math.round((this.completedTasks() / total) * 100) : 0;
  });

  constructor() {
    this.quickAddForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      priority: ['medium'],
      assignee: [null],
      storyPoints: [1, [Validators.min(1), Validators.max(13)]],
      dueDate: [null]
    });
  }

  ngOnInit(): void {
    this.setupResponsive();
    this.loadTasks();
    this.setupKeyboardShortcuts();
    this.setupAutoSave();
  }

  private setupResponsive(): void {
    this.breakpointObserver.observe(['(max-width: 768px)'])
      .subscribe(result => {
        this.isMobile.set(result.matches);
        if (result.matches) {
          this.viewMode.set('list');
        }
      });
  }

  private loadTasks(): void {
    this.isLoading.set(true);
    
    // Simulate loading tasks
    setTimeout(() => {
      this.generateSampleTasks();
      this.isLoading.set(false);
    }, 500);
  }

  private generateSampleTasks(): void {
    const sampleTasks: Task[] = [
      {
        id: 'TASK-001',
        title: 'Implement user authentication',
        description: 'Add JWT-based authentication with refresh tokens',
        status: 'in-progress',
        priority: 'high',
        assignee: this.users()[0],
        reporter: this.users()[1],
        labels: ['backend', 'feature'],
        storyPoints: 5,
        dueDate: new Date(Date.now() + 86400000 * 3),
        createdAt: new Date(Date.now() - 86400000 * 5),
        updatedAt: new Date(),
        attachments: 2,
        comments: 5,
        subtasks: { completed: 2, total: 4 },
        blockedBy: [],
        linkedIssues: ['TASK-002'],
        timeTracking: { estimated: 16, logged: 8 }
      },
      {
        id: 'TASK-002',
        title: 'Design dashboard UI',
        description: 'Create mockups for the main dashboard',
        status: 'review',
        priority: 'medium',
        assignee: this.users()[2],
        reporter: this.users()[0],
        labels: ['ui/ux', 'frontend'],
        storyPoints: 3,
        dueDate: new Date(Date.now() + 86400000 * 2),
        createdAt: new Date(Date.now() - 86400000 * 3),
        updatedAt: new Date(),
        attachments: 5,
        comments: 8,
        subtasks: { completed: 3, total: 3 },
        blockedBy: [],
        linkedIssues: ['TASK-001'],
        timeTracking: { estimated: 8, logged: 7 }
      },
      {
        id: 'TASK-003',
        title: 'Fix critical bug in payment module',
        description: 'Users unable to complete checkout process',
        status: 'todo',
        priority: 'critical',
        assignee: this.users()[1],
        reporter: this.users()[3],
        labels: ['bug', 'urgent'],
        storyPoints: 8,
        dueDate: new Date(Date.now() + 86400000),
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(),
        attachments: 1,
        comments: 12,
        subtasks: { completed: 0, total: 2 },
        blockedBy: ['TASK-004'],
        linkedIssues: [],
        timeTracking: { estimated: 4, logged: 0 }
      },
      {
        id: 'TASK-004',
        title: 'Update API documentation',
        description: 'Document new endpoints and authentication flow',
        status: 'done',
        priority: 'low',
        assignee: this.users()[4],
        reporter: this.users()[2],
        labels: ['documentation'],
        storyPoints: 2,
        dueDate: null,
        createdAt: new Date(Date.now() - 86400000 * 7),
        updatedAt: new Date(Date.now() - 86400000 * 2),
        attachments: 0,
        comments: 3,
        subtasks: { completed: 4, total: 4 },
        blockedBy: [],
        linkedIssues: [],
        timeTracking: { estimated: 4, logged: 4 }
      },
      {
        id: 'TASK-005',
        title: 'Optimize database queries',
        description: 'Improve performance of slow queries',
        status: 'in-progress',
        priority: 'high',
        assignee: this.users()[0],
        reporter: this.users()[1],
        labels: ['backend', 'database', 'enhancement'],
        storyPoints: 5,
        dueDate: new Date(Date.now() + 86400000 * 4),
        createdAt: new Date(Date.now() - 86400000 * 2),
        updatedAt: new Date(),
        attachments: 0,
        comments: 6,
        subtasks: { completed: 1, total: 3 },
        blockedBy: [],
        linkedIssues: [],
        timeTracking: { estimated: 12, logged: 4 }
      }
    ];

    // Distribute tasks to columns
    const columns = [...this.columns()];
    sampleTasks.forEach(task => {
      const column = columns.find(col => col.id === task.status);
      if (column) {
        column.tasks.push(task);
      }
    });
    this.columns.set(columns);
  }

  private setupKeyboardShortcuts(): void {
    // Implement keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + K for search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        this.focusSearch();
      }
      
      // N for new task
      if (event.key === 'n' && !event.ctrlKey && !event.metaKey) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          this.showQuickAdd.set(true);
        }
      }
      
      // Escape to clear selection
      if (event.key === 'Escape') {
        this.clearSelection();
        this.showQuickAdd.set(false);
      }
    });
  }

  private setupAutoSave(): void {
    // Auto-save board state to localStorage
    setInterval(() => {
      this.saveBoardState();
    }, 30000); // Every 30 seconds
  }

  onDrop(event: CdkDragDrop<Task[]>, columnId: string): void {
    const columns = [...this.columns()];
    const targetColumn = columns.find(col => col.id === columnId);
    
    if (!targetColumn) return;
    
    // Check column limit
    if (targetColumn.limit && 
        targetColumn.tasks.length >= targetColumn.limit && 
        event.previousContainer !== event.container) {
      this.showSnackBar('Column limit reached!', 'error');
      return;
    }
    
    if (event.previousContainer === event.container) {
      // Moving within the same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving between columns
      const task = event.previousContainer.data[event.previousIndex];
      const previousStatus = task.status;
      
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Update task status
      task.status = columnId as Task['status'];
      task.updatedAt = new Date();
      
      // Show confirmation
      this.showSnackBar(
        `Task moved from ${previousStatus} to ${columnId}`,
        'success'
      );
      
      // Log activity
      this.logActivity('task_moved', task, { from: previousStatus, to: columnId });
      
      // Save state
      this.saveBoardState();
    }
    
    this.columns.set(columns);
    this.draggedTask.set(null);
    this.hoveredColumn.set(null);
  }

  onDragStarted(task: Task): void {
    this.draggedTask.set(task);
    // Add haptic feedback on mobile
    if ('vibrate' in navigator && this.isMobile()) {
      navigator.vibrate(50);
    }
  }

  onDragEntered(columnId: string): void {
    this.hoveredColumn.set(columnId);
  }

  onDragExited(): void {
    this.hoveredColumn.set(null);
  }

  onDragEnded(): void {
    this.draggedTask.set(null);
    this.hoveredColumn.set(null);
  }

  createTask(): void {
    if (this.quickAddForm.invalid) {
      this.quickAddForm.markAllAsTouched();
      return;
    }
    
    const formValue = this.quickAddForm.value;
    const newTask: Task = {
      id: `TASK-${Date.now()}`,
      title: formValue.title,
      description: formValue.description || '',
      status: 'todo',
      priority: formValue.priority,
      assignee: formValue.assignee,
      reporter: this.users()[0], // Current user
      labels: [],
      storyPoints: formValue.storyPoints,
      dueDate: formValue.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments: 0,
      comments: 0,
      subtasks: { completed: 0, total: 0 },
      blockedBy: [],
      linkedIssues: [],
      timeTracking: { estimated: 0, logged: 0 }
    };
    
    // Add task to todo column
    const columns = [...this.columns()];
    const todoColumn = columns.find(col => col.id === 'todo');
    if (todoColumn) {
      todoColumn.tasks.unshift(newTask);
      this.columns.set(columns);
    }
    
    // Reset form and hide quick add
    this.quickAddForm.reset({ priority: 'medium', storyPoints: 1 });
    this.showQuickAdd.set(false);
    
    // Show success message
    this.showSnackBar('Task created successfully', 'success');
    
    // Log activity
    this.logActivity('task_created', newTask);
  }

  editTask(task: Task): void {
    // Open task edit dialog
    console.log('Edit task:', task);
  }

  deleteTask(task: Task, columnId: string): void {
    // Show confirmation dialog
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      const columns = [...this.columns()];
      const column = columns.find(col => col.id === columnId);
      
      if (column) {
        const index = column.tasks.findIndex(t => t.id === task.id);
        if (index > -1) {
          column.tasks.splice(index, 1);
          this.columns.set(columns);
          
          this.showSnackBar('Task deleted', 'success');
          this.logActivity('task_deleted', task);
        }
      }
    }
  }

  duplicateTask(task: Task, columnId: string): void {
    const duplicatedTask: Task = {
      ...task,
      id: `TASK-${Date.now()}`,
      title: `${task.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: 0
    };
    
    const columns = [...this.columns()];
    const column = columns.find(col => col.id === columnId);
    
    if (column) {
      const index = column.tasks.findIndex(t => t.id === task.id);
      column.tasks.splice(index + 1, 0, duplicatedTask);
      this.columns.set(columns);
      
      this.showSnackBar('Task duplicated', 'success');
      this.logActivity('task_duplicated', duplicatedTask);
    }
  }

  toggleTaskSelection(taskId: string): void {
    const selected = new Set(this.selectedTasks());
    if (selected.has(taskId)) {
      selected.delete(taskId);
    } else {
      selected.add(taskId);
    }
    this.selectedTasks.set(selected);
  }

  clearSelection(): void {
    this.selectedTasks.set(new Set());
  }

  bulkMove(targetColumnId: string): void {
    const selected = this.selectedTasks();
    if (selected.size === 0) return;
    
    const columns = [...this.columns()];
    const targetColumn = columns.find(col => col.id === targetColumnId);
    
    if (!targetColumn) return;
    
    // Move selected tasks
    columns.forEach(column => {
      column.tasks = column.tasks.filter(task => {
        if (selected.has(task.id)) {
          task.status = targetColumnId as Task['status'];
          task.updatedAt = new Date();
          targetColumn.tasks.push(task);
          return false;
        }
        return true;
      });
    });
    
    this.columns.set(columns);
    this.clearSelection();
    this.showSnackBar(`${selected.size} tasks moved`, 'success');
  }

  bulkDelete(): void {
    const selected = this.selectedTasks();
    if (selected.size === 0) return;
    
    if (confirm(`Delete ${selected.size} selected tasks?`)) {
      const columns = [...this.columns()];
      
      columns.forEach(column => {
        column.tasks = column.tasks.filter(task => !selected.has(task.id));
      });
      
      this.columns.set(columns);
      this.clearSelection();
      this.showSnackBar(`${selected.size} tasks deleted`, 'success');
    }
  }

  applyFilter(type: string, value: any): void {
    const filters = { ...this.selectedFilters() };
    
    switch (type) {
      case 'assignee':
        filters.assignee = value;
        break;
      case 'priority':
        filters.priority = value;
        break;
      case 'label':
        if (filters.labels.includes(value)) {
          filters.labels = filters.labels.filter(l => l !== value);
        } else {
          filters.labels.push(value);
        }
        break;
      case 'clear':
        filters.assignee = null;
        filters.priority = null;
        filters.labels = [];
        break;
    }
    
    this.selectedFilters.set(filters);
  }

  toggleViewMode(): void {
    this.viewMode.update(mode => mode === 'board' ? 'list' : 'board');
  }

  toggleCompactView(): void {
    this.isCompactView.update(v => !v);
  }

  focusSearch(): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  exportBoard(): void {
    const data = {
      columns: this.columns(),
      exportedAt: new Date().toISOString(),
      totalTasks: this.totalTasks(),
      completionRate: this.completionRate()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanban-board-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showSnackBar('Board exported successfully', 'success');
  }

  private saveBoardState(): void {
    const state = {
      columns: this.columns(),
      filters: this.selectedFilters(),
      viewMode: this.viewMode(),
      isCompactView: this.isCompactView()
    };
    localStorage.setItem('kanban-board-state', JSON.stringify(state));
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'info'): void {
    const config = {
      duration: 3000,
      horizontalPosition: 'end' as const,
      verticalPosition: 'bottom' as const,
      panelClass: [`snackbar-${type}`]
    };
    this.snackBar.open(message, 'Close', config);
  }

  private logActivity(action: string, task: Task, metadata?: any): void {
    // Log activity for audit trail
    console.log('Activity:', { action, task, metadata, timestamp: new Date() });
  }

  // Template helper methods
  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      low: 'primary',
      medium: 'accent',
      high: 'warn',
      critical: 'error'
    };
    return colors[priority] || 'primary';
  }

  getPriorityIcon(priority: string): string {
    const icons: { [key: string]: string } = {
      low: 'arrow_downward',
      medium: 'remove',
      high: 'arrow_upward',
      critical: 'priority_high'
    };
    return icons[priority] || 'remove';
  }

  getLabelColor(label: string): string {
    // Generate consistent color based on label
    const colors = [
      '#667eea', '#f56565', '#48bb78', '#ed8936', '#9f7aea',
      '#38b2ac', '#ed64a6', '#4299e1', '#ecc94b'
    ];
    const index = label.charCodeAt(0) % colors.length;
    return colors[index];
  }

  getTaskProgress(task: Task): number {
    if (task.subtasks.total === 0) return 0;
    return Math.round((task.subtasks.completed / task.subtasks.total) * 100);
  }

  getTimeProgress(task: Task): number {
    if (task.timeTracking.estimated === 0) return 0;
    return Math.min(100, Math.round(
      (task.timeTracking.logged / task.timeTracking.estimated) * 100
    ));
  }

  formatTime(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
  }

  getDaysUntilDue(date: Date): number {
    const diff = date.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getUserInitials(user: User): string {
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}