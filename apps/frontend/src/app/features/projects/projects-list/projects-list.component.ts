import { Component, OnInit, signal, computed, inject, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';
import { debounceTime, distinctUntilChanged } from 'rxjs';

interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  status: 'active' | 'on-hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'scrum' | 'kanban' | 'waterfall' | 'hybrid';
  visibility: 'public' | 'private' | 'team';
  owner: User;
  lead: User;
  team: User[];
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  progress: number;
  budget: {
    allocated: number;
    spent: number;
    currency: string;
  };
  tags: string[];
  icon?: string;
  color?: string;
  repository?: string;
  documentationUrl?: string;
  metrics: {
    totalTasks: number;
    completedTasks: number;
    activeSprints: number;
    velocity: number;
    bugs: number;
    coverage: number;
  };
  settings: {
    sprintDuration: number;
    workingDays: number[];
    autoArchive: boolean;
    requireApproval: boolean;
    notifications: boolean;
  };
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canArchive: boolean;
    canInvite: boolean;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule,
    DragDropModule,
    TranslateModule
  ],
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss'],
  animations: [
    trigger('listAnimation', [
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
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-20px)', opacity: 0 }),
        animate('300ms ease-out', 
          style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class ProjectsListComponent implements OnInit {
  @ViewChild('projectDialog') projectDialog!: TemplateRef<any>;
  
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private breakpointObserver = inject(BreakpointObserver);
  private fb = inject(FormBuilder);

  // State signals
  projects = signal<Project[]>([]);
  filteredProjects = signal<Project[]>([]);
  isLoading = signal(false);
  viewMode = signal<'grid' | 'list' | 'board'>('grid');
  selectedProjects = signal<Set<string>>(new Set());
  searchQuery = signal('');
  selectedFilter = signal<string>('all');
  sortBy = signal<string>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');
  currentPage = signal(0);
  pageSize = signal(12);
  totalProjects = signal(0);
  isMobile = signal(false);
  showArchived = signal(false);
  showCreateDialog = signal(false);
  editingProject = signal<Project | null>(null);
  
  // Form
  projectForm: FormGroup;
  
  // Filters
  filters = signal([
    { id: 'all', label: 'projects.filter.all', icon: 'apps', count: 0 },
    { id: 'active', label: 'projects.filter.active', icon: 'play_circle', count: 0 },
    { id: 'on-hold', label: 'projects.filter.on_hold', icon: 'pause_circle', count: 0 },
    { id: 'completed', label: 'projects.filter.completed', icon: 'check_circle', count: 0 },
    { id: 'my-projects', label: 'projects.filter.my_projects', icon: 'person', count: 0 },
    { id: 'team-projects', label: 'projects.filter.team_projects', icon: 'groups', count: 0 }
  ]);

  // View modes
  viewModes = signal([
    { id: 'grid', icon: 'grid_view', tooltip: 'projects.view.grid' },
    { id: 'list', icon: 'view_list', tooltip: 'projects.view.list' },
    { id: 'board', icon: 'view_kanban', tooltip: 'projects.view.board' }
  ]);

  // Sort options
  sortOptions = signal([
    { value: 'name', label: 'projects.sort.name' },
    { value: 'created', label: 'projects.sort.created' },
    { value: 'updated', label: 'projects.sort.updated' },
    { value: 'progress', label: 'projects.sort.progress' },
    { value: 'priority', label: 'projects.sort.priority' },
    { value: 'deadline', label: 'projects.sort.deadline' }
  ]);

  // Project templates
  projectTemplates = signal([
    { id: 'blank', name: 'Blank Project', icon: 'note_add', color: '#6b7280' },
    { id: 'scrum', name: 'Scrum Project', icon: 'speed', color: '#3b82f6' },
    { id: 'kanban', name: 'Kanban Project', icon: 'view_kanban', color: '#8b5cf6' },
    { id: 'software', name: 'Software Development', icon: 'code', color: '#10b981' },
    { id: 'marketing', name: 'Marketing Campaign', icon: 'campaign', color: '#f59e0b' },
    { id: 'design', name: 'Design Project', icon: 'palette', color: '#ec4899' }
  ]);

  // Computed values
  displayedProjects = computed(() => {
    let projects = [...this.projects()];
    const query = this.searchQuery().toLowerCase();
    const filter = this.selectedFilter();
    const sortBy = this.sortBy();
    const sortDir = this.sortDirection();
    const showArchived = this.showArchived();
    const page = this.currentPage();
    const size = this.pageSize();

    // Filter archived
    if (!showArchived) {
      projects = projects.filter(p => p.status !== 'archived');
    }

    // Apply search
    if (query) {
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.key.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply filter
    switch (filter) {
      case 'active':
        projects = projects.filter(p => p.status === 'active');
        break;
      case 'on-hold':
        projects = projects.filter(p => p.status === 'on-hold');
        break;
      case 'completed':
        projects = projects.filter(p => p.status === 'completed');
        break;
      case 'my-projects':
        // Filter by current user
        break;
      case 'team-projects':
        // Filter by team membership
        break;
    }

    // Sort
    projects.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updated':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'deadline':
          const aDeadline = a.endDate?.getTime() || Infinity;
          const bDeadline = b.endDate?.getTime() || Infinity;
          comparison = aDeadline - bDeadline;
          break;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    // Update total
    this.totalProjects.set(projects.length);

    // Paginate
    const start = page * size;
    const end = start + size;
    return projects.slice(start, end);
  });

  // Statistics
  statistics = computed(() => {
    const projects = this.projects();
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      onHold: projects.filter(p => p.status === 'on-hold').length,
      completed: projects.filter(p => p.status === 'completed').length,
      avgProgress: projects.reduce((sum, p) => sum + p.progress, 0) / projects.length || 0,
      totalBudget: projects.reduce((sum, p) => sum + p.budget.allocated, 0),
      spentBudget: projects.reduce((sum, p) => sum + p.budget.spent, 0)
    };
  });

  constructor() {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      key: ['', [Validators.required, Validators.pattern(/^[A-Z]{2,10}$/)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      type: ['scrum', Validators.required],
      visibility: ['team', Validators.required],
      priority: ['medium', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [null],
      budget: this.fb.group({
        allocated: [0, [Validators.min(0)]],
        currency: ['USD']
      }),
      lead: [null, Validators.required],
      team: [[]],
      tags: [[]],
      settings: this.fb.group({
        sprintDuration: [14, [Validators.min(7), Validators.max(30)]],
        workingDays: [[1, 2, 3, 4, 5]],
        autoArchive: [false],
        requireApproval: [true],
        notifications: [true]
      })
    });
  }

  ngOnInit(): void {
    this.setupResponsive();
    this.loadProjects();
    this.setupSearch();
    this.setupKeyboardShortcuts();
  }

  private setupResponsive(): void {
    this.breakpointObserver.observe(['(max-width: 768px)'])
      .subscribe(result => {
        this.isMobile.set(result.matches);
        if (result.matches) {
          this.viewMode.set('list');
          this.pageSize.set(10);
        }
      });
  }

  private loadProjects(): void {
    this.isLoading.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.projects.set(this.generateMockProjects());
      this.updateFilterCounts();
      this.isLoading.set(false);
    }, 800);
  }

  private generateMockProjects(): Project[] {
    const mockProjects: Project[] = [];
    const statuses: Project['status'][] = ['active', 'on-hold', 'completed', 'archived'];
    const priorities: Project['priority'][] = ['low', 'medium', 'high', 'critical'];
    const types: Project['type'][] = ['scrum', 'kanban', 'waterfall', 'hybrid'];
    const projectNames = [
      'E-commerce Platform', 'Mobile Banking App', 'CRM System', 'Healthcare Portal',
      'Educational Platform', 'Social Media Dashboard', 'IoT Management', 'Data Analytics Tool',
      'Video Streaming Service', 'Cloud Storage Solution', 'AI Assistant', 'Blockchain Wallet'
    ];

    for (let i = 0; i < 24; i++) {
      const startDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + Math.random() * 180 * 24 * 60 * 60 * 1000);
      const progress = Math.floor(Math.random() * 100);
      const budget = Math.floor(Math.random() * 500000) + 50000;
      const spent = Math.floor(budget * (progress / 100) * (0.8 + Math.random() * 0.4));

      mockProjects.push({
        id: `PRJ-${1000 + i}`,
        name: projectNames[i % projectNames.length],
        key: projectNames[i % projectNames.length].split(' ').map(w => w[0]).join('').toUpperCase(),
        description: `A comprehensive ${types[i % 4]} project focused on delivering high-quality solutions.`,
        status: statuses[Math.floor(Math.random() * 4)],
        priority: priorities[Math.floor(Math.random() * 4)],
        type: types[i % 4],
        visibility: i % 3 === 0 ? 'public' : i % 3 === 1 ? 'private' : 'team',
        owner: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: null,
          role: 'Project Owner'
        },
        lead: {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          avatar: null,
          role: 'Project Lead'
        },
        team: [
          { id: '3', name: 'Mike Johnson', email: 'mike@example.com', avatar: null, role: 'Developer' },
          { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', avatar: null, role: 'Designer' },
          { id: '5', name: 'Tom Brown', email: 'tom@example.com', avatar: null, role: 'QA Engineer' }
        ],
        startDate,
        endDate: Math.random() > 0.3 ? endDate : null,
        createdAt: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        progress,
        budget: {
          allocated: budget,
          spent,
          currency: 'USD'
        },
        tags: ['web', 'mobile', 'api', 'cloud', 'security'].slice(0, Math.floor(Math.random() * 3) + 1),
        icon: ['rocket', 'shopping_cart', 'medical_services', 'school', 'analytics'][i % 5],
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
        repository: Math.random() > 0.5 ? 'https://github.com/company/project' : undefined,
        documentationUrl: Math.random() > 0.5 ? 'https://docs.project.com' : undefined,
        metrics: {
          totalTasks: Math.floor(Math.random() * 200) + 50,
          completedTasks: Math.floor(progress * 2),
          activeSprints: Math.floor(Math.random() * 5) + 1,
          velocity: Math.floor(Math.random() * 30) + 20,
          bugs: Math.floor(Math.random() * 20),
          coverage: Math.floor(Math.random() * 40) + 60
        },
        settings: {
          sprintDuration: 14,
          workingDays: [1, 2, 3, 4, 5],
          autoArchive: false,
          requireApproval: true,
          notifications: true
        },
        permissions: {
          canEdit: Math.random() > 0.3,
          canDelete: Math.random() > 0.7,
          canArchive: Math.random() > 0.5,
          canInvite: Math.random() > 0.4
        }
      });
    }

    return mockProjects;
  }

  private setupSearch(): void {
    // Implement search with debounce
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + N for new project
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        this.openCreateDialog();
      }
      
      // Switch view modes with number keys
      if (event.key === '1') this.setViewMode('grid');
      if (event.key === '2') this.setViewMode('list');
      if (event.key === '3') this.setViewMode('board');
    });
  }

  private updateFilterCounts(): void {
    const projects = this.projects();
    const filters = [...this.filters()];
    
    filters[0].count = projects.filter(p => p.status !== 'archived').length;
    filters[1].count = projects.filter(p => p.status === 'active').length;
    filters[2].count = projects.filter(p => p.status === 'on-hold').length;
    filters[3].count = projects.filter(p => p.status === 'completed').length;
    filters[4].count = projects.filter(p => p.owner.id === '1').length; // Current user
    filters[5].count = projects.filter(p => p.team.some(m => m.id === '1')).length;
    
    this.filters.set(filters);
  }

  // Public methods
  setViewMode(mode: 'grid' | 'list' | 'board'): void {
    this.viewMode.set(mode);
    
    // Save preference
    localStorage.setItem('projects-view-mode', mode);
  }

  setFilter(filterId: string): void {
    this.selectedFilter.set(filterId);
    this.currentPage.set(0);
  }

  setSortBy(sortBy: string): void {
    if (this.sortBy() === sortBy) {
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(sortBy);
      this.sortDirection.set('asc');
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  openCreateDialog(template?: string): void {
    this.editingProject.set(null);
    this.projectForm.reset({
      type: template || 'scrum',
      visibility: 'team',
      priority: 'medium',
      startDate: new Date(),
      settings: {
        sprintDuration: 14,
        workingDays: [1, 2, 3, 4, 5],
        autoArchive: false,
        requireApproval: true,
        notifications: true
      }
    });
    
    const dialogRef = this.dialog.open(this.projectDialog, {
      width: '800px',
      maxHeight: '90vh',
      panelClass: 'project-dialog'
    });
  }

  openEditDialog(project: Project): void {
    this.editingProject.set(project);
    this.projectForm.patchValue(project);
    
    const dialogRef = this.dialog.open(this.projectDialog, {
      width: '800px',
      maxHeight: '90vh',
      panelClass: 'project-dialog'
    });
  }

  saveProject(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }
    
    const formValue = this.projectForm.value;
    const editing = this.editingProject();
    
    if (editing) {
      // Update project
      const projects = this.projects().map(p => 
        p.id === editing.id ? { ...p, ...formValue, updatedAt: new Date() } : p
      );
      this.projects.set(projects);
      this.showSnackBar('Project updated successfully', 'success');
    } else {
      // Create new project
      const newProject: Project = {
        ...formValue,
        id: `PRJ-${Date.now()}`,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        progress: 0,
        owner: { id: '1', name: 'Current User', email: 'user@example.com', avatar: null, role: 'Owner' },
        metrics: {
          totalTasks: 0,
          completedTasks: 0,
          activeSprints: 0,
          velocity: 0,
          bugs: 0,
          coverage: 0
        },
        permissions: {
          canEdit: true,
          canDelete: true,
          canArchive: true,
          canInvite: true
        }
      };
      
      this.projects.update(projects => [newProject, ...projects]);
      this.showSnackBar('Project created successfully', 'success');
    }
    
    this.dialog.closeAll();
    this.updateFilterCounts();
  }

  duplicateProject(project: Project): void {
    const duplicated: Project = {
      ...project,
      id: `PRJ-${Date.now()}`,
      name: `${project.name} (Copy)`,
      key: `${project.key}2`,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      metrics: {
        ...project.metrics,
        totalTasks: 0,
        completedTasks: 0,
        activeSprints: 0,
        velocity: 0,
        bugs: 0
      }
    };
    
    this.projects.update(projects => [duplicated, ...projects]);
    this.showSnackBar('Project duplicated successfully', 'success');
    this.updateFilterCounts();
  }

  archiveProject(project: Project): void {
    if (confirm(`Archive project "${project.name}"? This action can be undone.`)) {
      const projects = this.projects().map(p => 
        p.id === project.id ? { ...p, status: 'archived' as const, updatedAt: new Date() } : p
      );
      this.projects.set(projects);
      this.showSnackBar('Project archived', 'success');
      this.updateFilterCounts();
    }
  }

  deleteProject(project: Project): void {
    if (confirm(`Delete project "${project.name}"? This action cannot be undone.`)) {
      const projects = this.projects().filter(p => p.id !== project.id);
      this.projects.set(projects);
      this.showSnackBar('Project deleted', 'success');
      this.updateFilterCounts();
    }
  }

  toggleProjectSelection(projectId: string): void {
    const selected = new Set(this.selectedProjects());
    if (selected.has(projectId)) {
      selected.delete(projectId);
    } else {
      selected.add(projectId);
    }
    this.selectedProjects.set(selected);
  }

  bulkArchive(): void {
    const selected = this.selectedProjects();
    if (selected.size === 0) return;
    
    if (confirm(`Archive ${selected.size} selected projects?`)) {
      const projects = this.projects().map(p => 
        selected.has(p.id) ? { ...p, status: 'archived' as const, updatedAt: new Date() } : p
      );
      this.projects.set(projects);
      this.selectedProjects.set(new Set());
      this.showSnackBar(`${selected.size} projects archived`, 'success');
      this.updateFilterCounts();
    }
  }

  exportProjects(): void {
    const data = this.displayedProjects();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showSnackBar('Projects exported successfully', 'success');
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: [`snackbar-${type}`]
    });
  }

  // Template helper methods
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      active: 'primary',
      'on-hold': 'warn',
      completed: 'success',
      archived: 'basic'
    };
    return colors[status] || 'basic';
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      low: 'primary',
      medium: 'accent',
      high: 'warn',
      critical: 'error'
    };
    return colors[priority] || 'primary';
  }

  getProjectIcon(type: string): string {
    const icons: { [key: string]: string } = {
      scrum: 'speed',
      kanban: 'view_kanban',
      waterfall: 'waterfall_chart',
      hybrid: 'hub'
    };
    return icons[type] || 'folder';
  }

  getProgressClass(progress: number): string {
    if (progress >= 80) return 'progress-success';
    if (progress >= 50) return 'progress-warning';
    return 'progress-danger';
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getDaysRemaining(endDate: Date | null): number {
    if (!endDate) return -1;
    const diff = endDate.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getHealthScore(project: Project): number {
    let score = 100;
    
    // Progress vs time elapsed
    if (project.endDate) {
      const totalTime = project.endDate.getTime() - project.startDate.getTime();
      const elapsedTime = Date.now() - project.startDate.getTime();
      const expectedProgress = (elapsedTime / totalTime) * 100;
      const progressDiff = project.progress - expectedProgress;
      score -= Math.abs(progressDiff) * 0.5;
    }
    
    // Budget health
    const budgetRatio = project.budget.spent / project.budget.allocated;
    const progressRatio = project.progress / 100;
    if (budgetRatio > progressRatio) {
      score -= (budgetRatio - progressRatio) * 50;
    }
    
    // Bug ratio
    if (project.metrics.totalTasks > 0) {
      const bugRatio = project.metrics.bugs / project.metrics.totalTasks;
      score -= bugRatio * 30;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  getUserInitials(user: User): string {
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}