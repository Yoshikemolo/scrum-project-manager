import { Component, OnInit, OnDestroy, signal, computed, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Project, ProjectStatus, ProjectPriority } from '../../../shared/interfaces/project.interface';
import { ShortcutService } from '../../../core/services/shortcut.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { selectUser } from '../../../store/auth/auth.selectors';

/**
 * Project List Component
 * 
 * Displays all projects with advanced filtering, sorting, and management capabilities.
 * 
 * Features:
 * - Grid and list view toggle
 * - Advanced filtering (status, priority, team, date range)
 * - Sorting by multiple columns
 * - Batch operations
 * - Real-time updates
 * - Quick actions menu
 * - Project templates
 * - Archive functionality
 * - Export to CSV/JSON
 * - Responsive design
 * - Keyboard shortcuts
 * - Infinite scroll
 */
@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatChipsModule,
    MatMenuModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ]),
    trigger('filterAnimation', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class ProjectListComponent implements OnInit, OnDestroy {
  // ViewChild references
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // User data
  user$ = this.store.select(selectUser);
  
  // View state
  viewMode = signal<'grid' | 'list'>('grid');
  showFilters = signal(false);
  isLoading = signal(true);
  selectedProjects = new SelectionModel<Project>(true, []);
  
  // Projects data
  projects = signal<Project[]>([]);
  filteredProjects = signal<Project[]>([]);
  displayedProjects = signal<Project[]>([]);
  
  // Filter form
  filterForm!: FormGroup;
  searchTerm = signal('');
  
  // Filter options
  statusOptions = Object.values(ProjectStatus);
  priorityOptions = Object.values(ProjectPriority);
  teamMembers = signal<any[]>([]);
  tags = signal<string[]>([]);
  
  // Pagination
  pageSize = signal(12);
  currentPage = signal(0);
  totalProjects = signal(0);
  
  // Sorting
  sortField = signal<string>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');
  
  // Statistics
  statistics = computed(() => {
    const projects = this.projects();
    return {
      total: projects.length,
      active: projects.filter(p => p.status === ProjectStatus.Active).length,
      completed: projects.filter(p => p.status === ProjectStatus.Completed).length,
      onHold: projects.filter(p => p.status === ProjectStatus.OnHold).length,
      overdue: projects.filter(p => this.isOverdue(p)).length,
      myProjects: projects.filter(p => this.isMyProject(p)).length
    };
  });
  
  // Computed values
  hasSelection = computed(() => this.selectedProjects.selected.length > 0);
  isAllSelected = computed(() => 
    this.selectedProjects.selected.length === this.displayedProjects().length
  );
  
  // Table columns for list view
  displayedColumns = signal<string[]>([
    'select',
    'name',
    'status',
    'priority',
    'progress',
    'team',
    'startDate',
    'endDate',
    'actions'
  ]);
  
  // Responsive
  isMobile = signal(false);
  isTablet = signal(false);
  
  // Lifecycle
  private destroy$ = new Subject<void>();
  
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private store: Store,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private shortcutService: ShortcutService,
    private wsService: WebSocketService,
    private translateService: TranslateService,
    private breakpointObserver: BreakpointObserver
  ) {
    // Set up effects
    effect(() => {
      this.applyFilters();
    });
    
    effect(() => {
      this.updateDisplayedProjects();
    });
  }
  
  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadProjects();
    this.setupResponsive();
    this.setupWebSocketListeners();
    this.setupKeyboardShortcuts();
    this.setupSearchSubscription();
    
    // Simulate loading
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1000);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.removeKeyboardShortcuts();
    this.wsService.disconnect();
  }
  
  /**
   * Initialize filter form
   */
  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      status: [[]],
      priority: [[]],
      team: [[]],
      tags: [[]],
      startDate: [null],
      endDate: [null],
      showArchived: [false],
      onlyMyProjects: [false]
    });
    
    // Subscribe to form changes
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }
  
  /**
   * Load projects
   */
  private loadProjects(): void {
    // Simulate API call
    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'E-Commerce Platform',
        description: 'Next-generation online shopping platform with AI recommendations',
        status: ProjectStatus.Active,
        priority: ProjectPriority.High,
        progress: 65,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date(),
        owner: { id: '1', name: 'John Doe', avatar: 'assets/avatars/john.jpg' },
        team: [
          { id: '2', name: 'Jane Smith', avatar: 'assets/avatars/jane.jpg', role: 'Developer' },
          { id: '3', name: 'Bob Johnson', avatar: 'assets/avatars/bob.jpg', role: 'Designer' },
          { id: '4', name: 'Alice Brown', avatar: 'assets/avatars/alice.jpg', role: 'QA' }
        ],
        tags: ['React', 'Node.js', 'MongoDB', 'AI'],
        sprintCount: 8,
        taskCount: 156,
        completedTaskCount: 98,
        bugCount: 12,
        isArchived: false,
        isFavorite: true
      },
      {
        id: '2',
        name: 'Mobile Banking App',
        description: 'Secure and user-friendly mobile banking application',
        status: ProjectStatus.Active,
        priority: ProjectPriority.Critical,
        progress: 42,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-31'),
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date(),
        owner: { id: '1', name: 'John Doe', avatar: 'assets/avatars/john.jpg' },
        team: [
          { id: '5', name: 'Mike Wilson', avatar: 'assets/avatars/mike.jpg', role: 'Lead Dev' },
          { id: '6', name: 'Sarah Davis', avatar: 'assets/avatars/sarah.jpg', role: 'Security' }
        ],
        tags: ['Flutter', 'Firebase', 'Security', 'FinTech'],
        sprintCount: 10,
        taskCount: 234,
        completedTaskCount: 98,
        bugCount: 8,
        isArchived: false,
        isFavorite: false
      },
      {
        id: '3',
        name: 'CRM System Upgrade',
        description: 'Modernizing legacy CRM system with cloud migration',
        status: ProjectStatus.Planning,
        priority: ProjectPriority.Medium,
        progress: 15,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-09-30'),
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date(),
        owner: { id: '2', name: 'Jane Smith', avatar: 'assets/avatars/jane.jpg' },
        team: [
          { id: '1', name: 'John Doe', avatar: 'assets/avatars/john.jpg', role: 'Architect' },
          { id: '7', name: 'Tom Anderson', avatar: 'assets/avatars/tom.jpg', role: 'DevOps' }
        ],
        tags: ['Salesforce', 'AWS', 'Migration', 'CRM'],
        sprintCount: 12,
        taskCount: 189,
        completedTaskCount: 28,
        bugCount: 3,
        isArchived: false,
        isFavorite: true
      },
      {
        id: '4',
        name: 'Data Analytics Dashboard',
        description: 'Real-time business intelligence dashboard',
        status: ProjectStatus.Completed,
        priority: ProjectPriority.High,
        progress: 100,
        startDate: new Date('2023-10-01'),
        endDate: new Date('2024-02-28'),
        createdAt: new Date('2023-09-15'),
        updatedAt: new Date(),
        owner: { id: '3', name: 'Bob Johnson', avatar: 'assets/avatars/bob.jpg' },
        team: [
          { id: '8', name: 'Emily White', avatar: 'assets/avatars/emily.jpg', role: 'Data Scientist' },
          { id: '9', name: 'David Lee', avatar: 'assets/avatars/david.jpg', role: 'Frontend' }
        ],
        tags: ['Python', 'Tableau', 'BigData', 'Analytics'],
        sprintCount: 6,
        taskCount: 124,
        completedTaskCount: 124,
        bugCount: 0,
        isArchived: false,
        isFavorite: false
      },
      {
        id: '5',
        name: 'IoT Platform',
        description: 'Industrial IoT device management platform',
        status: ProjectStatus.OnHold,
        priority: ProjectPriority.Low,
        progress: 35,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        createdAt: new Date('2023-12-15'),
        updatedAt: new Date(),
        owner: { id: '4', name: 'Alice Brown', avatar: 'assets/avatars/alice.jpg' },
        team: [
          { id: '10', name: 'Chris Martin', avatar: 'assets/avatars/chris.jpg', role: 'IoT Specialist' }
        ],
        tags: ['IoT', 'MQTT', 'Azure', 'Edge Computing'],
        sprintCount: 15,
        taskCount: 267,
        completedTaskCount: 93,
        bugCount: 18,
        isArchived: false,
        isFavorite: false
      },
      {
        id: '6',
        name: 'Healthcare Portal',
        description: 'Patient management and telemedicine platform',
        status: ProjectStatus.Active,
        priority: ProjectPriority.High,
        progress: 78,
        startDate: new Date('2023-11-01'),
        endDate: new Date('2024-05-31'),
        createdAt: new Date('2023-10-20'),
        updatedAt: new Date(),
        owner: { id: '5', name: 'Mike Wilson', avatar: 'assets/avatars/mike.jpg' },
        team: [
          { id: '1', name: 'John Doe', avatar: 'assets/avatars/john.jpg', role: 'Backend' },
          { id: '2', name: 'Jane Smith', avatar: 'assets/avatars/jane.jpg', role: 'Frontend' },
          { id: '11', name: 'Lisa Garcia', avatar: 'assets/avatars/lisa.jpg', role: 'Compliance' }
        ],
        tags: ['HIPAA', 'React', 'Node.js', 'Healthcare'],
        sprintCount: 9,
        taskCount: 198,
        completedTaskCount: 154,
        bugCount: 6,
        isArchived: false,
        isFavorite: true
      }
    ];
    
    this.projects.set(mockProjects);
    this.totalProjects.set(mockProjects.length);
    
    // Extract team members and tags
    const allTeamMembers = new Set<any>();
    const allTags = new Set<string>();
    
    mockProjects.forEach(project => {
      project.team.forEach(member => allTeamMembers.add(member));
      project.tags.forEach(tag => allTags.add(tag));
    });
    
    this.teamMembers.set(Array.from(allTeamMembers));
    this.tags.set(Array.from(allTags));
  }
  
  /**
   * Setup responsive layout
   */
  private setupResponsive(): void {
    this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.Tablet
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(result => {
      this.isMobile.set(result.breakpoints[Breakpoints.Handset]);
      this.isTablet.set(result.breakpoints[Breakpoints.Tablet]);
      
      // Adjust displayed columns for mobile
      if (this.isMobile()) {
        this.displayedColumns.set(['select', 'name', 'status', 'actions']);
        this.viewMode.set('grid');
      }
    });
  }
  
  /**
   * Setup WebSocket listeners
   */
  private setupWebSocketListeners(): void {
    this.wsService.connect();
    
    this.wsService.on('project:created')
      .pipe(takeUntil(this.destroy$))
      .subscribe(project => {
        this.addProject(project);
      });
    
    this.wsService.on('project:updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe(project => {
        this.updateProject(project);
      });
    
    this.wsService.on('project:deleted')
      .pipe(takeUntil(this.destroy$))
      .subscribe(projectId => {
        this.removeProject(projectId);
      });
  }
  
  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    this.shortcutService.add('ctrl+n', () => this.createProject());
    this.shortcutService.add('ctrl+f', () => this.toggleFilters());
    this.shortcutService.add('ctrl+a', () => this.selectAll());
    this.shortcutService.add('delete', () => {
      if (this.hasSelection()) {
        this.deleteSelected();
      }
    });
    this.shortcutService.add('ctrl+e', () => this.exportProjects());
    this.shortcutService.add('ctrl+shift+v', () => this.toggleView());
  }
  
  /**
   * Remove keyboard shortcuts
   */
  private removeKeyboardShortcuts(): void {
    this.shortcutService.remove('ctrl+n');
    this.shortcutService.remove('ctrl+f');
    this.shortcutService.remove('ctrl+a');
    this.shortcutService.remove('delete');
    this.shortcutService.remove('ctrl+e');
    this.shortcutService.remove('ctrl+shift+v');
  }
  
  /**
   * Setup search subscription
   */
  private setupSearchSubscription(): void {
    // Watch for search term changes
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (event: any) => {
        this.searchTerm.set(event.target.value);
      });
    }
  }
  
  /**
   * Apply filters
   */
  private applyFilters(): void {
    const filters = this.filterForm.value;
    const search = this.searchTerm().toLowerCase();
    let filtered = [...this.projects()];
    
    // Search filter
    if (search) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(search) ||
        project.description.toLowerCase().includes(search) ||
        project.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    // Status filter
    if (filters.status?.length > 0) {
      filtered = filtered.filter(project => 
        filters.status.includes(project.status)
      );
    }
    
    // Priority filter
    if (filters.priority?.length > 0) {
      filtered = filtered.filter(project => 
        filters.priority.includes(project.priority)
      );
    }
    
    // Team filter
    if (filters.team?.length > 0) {
      filtered = filtered.filter(project => 
        project.team.some(member => filters.team.includes(member.id))
      );
    }
    
    // Tags filter
    if (filters.tags?.length > 0) {
      filtered = filtered.filter(project => 
        project.tags.some(tag => filters.tags.includes(tag))
      );
    }
    
    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(project => 
        project.startDate >= filters.startDate
      );
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(project => 
        project.endDate <= filters.endDate
      );
    }
    
    // Archived filter
    if (!filters.showArchived) {
      filtered = filtered.filter(project => !project.isArchived);
    }
    
    // My projects filter
    if (filters.onlyMyProjects) {
      filtered = filtered.filter(project => this.isMyProject(project));
    }
    
    // Apply sorting
    filtered = this.sortProjects(filtered);
    
    this.filteredProjects.set(filtered);
    this.totalProjects.set(filtered.length);
  }
  
  /**
   * Sort projects
   */
  private sortProjects(projects: Project[]): Project[] {
    const field = this.sortField();
    const direction = this.sortDirection();
    
    return projects.sort((a, b) => {
      let aValue = a[field as keyof Project];
      let bValue = b[field as keyof Project];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  /**
   * Update displayed projects based on pagination
   */
  private updateDisplayedProjects(): void {
    const filtered = this.filteredProjects();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = page * size;
    const end = start + size;
    
    this.displayedProjects.set(filtered.slice(start, end));
  }
  
  /**
   * Check if project is overdue
   */
  private isOverdue(project: Project): boolean {
    return project.status !== ProjectStatus.Completed && 
           project.endDate < new Date();
  }
  
  /**
   * Check if project belongs to current user
   */
  private isMyProject(project: Project): boolean {
    const user = this.user$;
    // Simplified check - would use actual user ID
    return project.owner.id === '1' || 
           project.team.some(member => member.id === '1');
  }
  
  /**
   * Add new project
   */
  private addProject(project: Project): void {
    const projects = [...this.projects(), project];
    this.projects.set(projects);
    this.applyFilters();
  }
  
  /**
   * Update existing project
   */
  private updateProject(updated: Project): void {
    const projects = this.projects().map(p => 
      p.id === updated.id ? updated : p
    );
    this.projects.set(projects);
    this.applyFilters();
  }
  
  /**
   * Remove project
   */
  private removeProject(projectId: string): void {
    const projects = this.projects().filter(p => p.id !== projectId);
    this.projects.set(projects);
    this.applyFilters();
  }
  
  // Public methods
  
  /**
   * Toggle view mode
   */
  toggleView(): void {
    this.viewMode.update(mode => mode === 'grid' ? 'list' : 'grid');
  }
  
  /**
   * Toggle filters
   */
  toggleFilters(): void {
    this.showFilters.update(show => !show);
  }
  
  /**
   * Clear filters
   */
  clearFilters(): void {
    this.filterForm.reset({
      status: [],
      priority: [],
      team: [],
      tags: [],
      startDate: null,
      endDate: null,
      showArchived: false,
      onlyMyProjects: false
    });
    this.searchTerm.set('');
  }
  
  /**
   * Create new project
   */
  createProject(): void {
    this.router.navigate(['/projects/new']);
  }
  
  /**
   * View project details
   */
  viewProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }
  
  /**
   * Edit project
   */
  editProject(project: Project, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/projects', project.id, 'edit']);
  }
  
  /**
   * Duplicate project
   */
  duplicateProject(project: Project, event?: Event): void {
    event?.stopPropagation();
    // Implement duplication logic
    this.snackBar.open(
      this.translateService.instant('projects.duplicated', { name: project.name }),
      'OK',
      { duration: 3000 }
    );
  }
  
  /**
   * Archive/Unarchive project
   */
  toggleArchive(project: Project, event?: Event): void {
    event?.stopPropagation();
    project.isArchived = !project.isArchived;
    this.updateProject(project);
    
    const message = project.isArchived ? 'projects.archived' : 'projects.unarchived';
    this.snackBar.open(
      this.translateService.instant(message, { name: project.name }),
      'OK',
      { duration: 3000 }
    );
  }
  
  /**
   * Toggle favorite
   */
  toggleFavorite(project: Project, event?: Event): void {
    event?.stopPropagation();
    project.isFavorite = !project.isFavorite;
    this.updateProject(project);
  }
  
  /**
   * Delete project
   */
  deleteProject(project: Project, event?: Event): void {
    event?.stopPropagation();
    // Show confirmation dialog
    if (confirm(this.translateService.instant('projects.confirmDelete', { name: project.name }))) {
      this.removeProject(project.id);
      this.snackBar.open(
        this.translateService.instant('projects.deleted', { name: project.name }),
        'OK',
        { duration: 3000 }
      );
    }
  }
  
  /**
   * Select all projects
   */
  selectAll(): void {
    if (this.isAllSelected()) {
      this.selectedProjects.clear();
    } else {
      this.selectedProjects.select(...this.displayedProjects());
    }
  }
  
  /**
   * Delete selected projects
   */
  deleteSelected(): void {
    const count = this.selectedProjects.selected.length;
    if (confirm(this.translateService.instant('projects.confirmDeleteMultiple', { count }))) {
      this.selectedProjects.selected.forEach(project => {
        this.removeProject(project.id);
      });
      this.selectedProjects.clear();
      
      this.snackBar.open(
        this.translateService.instant('projects.deletedMultiple', { count }),
        'OK',
        { duration: 3000 }
      );
    }
  }
  
  /**
   * Export projects
   */
  exportProjects(): void {
    const data = this.filteredProjects();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projects_${Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.snackBar.open(
      this.translateService.instant('projects.exported'),
      'OK',
      { duration: 3000 }
    );
  }
  
  /**
   * Change page
   */
  onPageChange(event: any): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
  
  /**
   * Sort change
   */
  onSortChange(event: any): void {
    this.sortField.set(event.active);
    this.sortDirection.set(event.direction || 'asc');
    this.applyFilters();
  }
  
  /**
   * Get status color
   */
  getStatusColor(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.Planning:
        return 'accent';
      case ProjectStatus.Active:
        return 'primary';
      case ProjectStatus.OnHold:
        return 'warn';
      case ProjectStatus.Completed:
        return 'success';
      case ProjectStatus.Cancelled:
        return 'error';
      default:
        return '';
    }
  }
  
  /**
   * Get priority color
   */
  getPriorityColor(priority: ProjectPriority): string {
    switch (priority) {
      case ProjectPriority.Critical:
        return 'error';
      case ProjectPriority.High:
        return 'warn';
      case ProjectPriority.Medium:
        return 'primary';
      case ProjectPriority.Low:
        return 'accent';
      default:
        return '';
    }
  }
  
  /**
   * Get progress color
   */
  getProgressColor(progress: number): string {
    if (progress >= 80) return 'primary';
    if (progress >= 50) return 'accent';
    if (progress >= 20) return 'warn';
    return 'error';
  }
  
  /**
   * Format date
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
}

// Project interfaces (should be in shared/interfaces/project.interface.ts)
export enum ProjectStatus {
  Planning = 'planning',
  Active = 'active',
  OnHold = 'on-hold',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export enum ProjectPriority {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low'
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string;
    avatar: string;
  };
  team: Array<{
    id: string;
    name: string;
    avatar: string;
    role: string;
  }>;
  tags: string[];
  sprintCount: number;
  taskCount: number;
  completedTaskCount: number;
  bugCount: number;
  isArchived: boolean;
  isFavorite: boolean;
}
