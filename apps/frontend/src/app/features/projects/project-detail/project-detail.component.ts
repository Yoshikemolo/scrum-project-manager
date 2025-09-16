import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, BehaviorSubject, combineLatest, timer, fromEvent } from 'rxjs';
import { takeUntil, map, filter, switchMap, debounceTime, distinctUntilChanged, tap, catchError, shareReplay, startWith } from 'rxjs/operators';
import { trigger, state, style, transition, animate, query, stagger, animateChild } from '@angular/animations';

// Interfaces
import { Project, ProjectStatus, ProjectPriority, ProjectActivity } from '../../../shared/interfaces/project.interface';
import { Sprint } from '../../../shared/interfaces/sprint.interface';
import { Task, TaskStatus } from '../../../shared/interfaces/task.interface';
import { User } from '../../../shared/interfaces/user.interface';
import { Team } from '../../../shared/interfaces/team.interface';
import { Comment } from '../../../shared/interfaces/comment.interface';
import { FileAttachment } from '../../../shared/interfaces/file.interface';

// Services
import { ProjectsService } from '../../../core/services/projects.service';
import { SprintsService } from '../../../core/services/sprints.service';
import { TasksService } from '../../../core/services/tasks.service';
import { TeamsService } from '../../../core/services/teams.service';
import { CommentsService } from '../../../core/services/comments.service';
import { FileUploadService } from '../../../core/services/file-upload.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShortcutService } from '../../../core/services/shortcut.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { ExportService } from '../../../core/services/export.service';

// Store
import * as fromProjects from '../../../store/projects';
import * as fromSprints from '../../../store/sprints';
import * as fromTasks from '../../../store/tasks';
import * as fromTeams from '../../../store/teams';
import * as fromAuth from '../../../store/auth';
import * as fromUI from '../../../store/ui';

// Components
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ProjectEditDialogComponent } from '../dialogs/project-edit-dialog/project-edit-dialog.component';
import { SprintCreateDialogComponent } from '../../sprints/dialogs/sprint-create-dialog/sprint-create-dialog.component';
import { TaskCreateDialogComponent } from '../../tasks/dialogs/task-create-dialog/task-create-dialog.component';
import { TeamMemberAddDialogComponent } from '../../teams/dialogs/team-member-add-dialog/team-member-add-dialog.component';
import { FileUploadDialogComponent } from '../../../shared/components/file-upload-dialog/file-upload-dialog.component';
import { ShareDialogComponent } from '../../../shared/components/share-dialog/share-dialog.component';

// Charts
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

/**
 * Project Detail Component
 * Displays comprehensive project information with tabs for different sections
 * Supports real-time updates, editing, team management, and activity tracking
 */
@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDividerModule,
    MatExpansionModule,
    MatListModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    DragDropModule,
    BaseChartDirective,
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('400ms ease-out', style({ transform: 'translateX(0)' })),
      ]),
    ]),
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out')),
    ]),
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-15px)' }),
          stagger('50ms', [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ],
})
export class ProjectDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  // ViewChild references
  @ViewChild('burndownChart') burndownChart!: BaseChartDirective;
  @ViewChild('velocityChart') velocityChart!: BaseChartDirective;
  @ViewChild('taskChart') taskChart!: BaseChartDirective;

  // Observables
  project$!: Observable<Project | null>;
  sprints$!: Observable<Sprint[]>;
  tasks$!: Observable<Task[]>;
  team$!: Observable<User[]>;
  activities$!: Observable<ProjectActivity[]>;
  comments$!: Observable<Comment[]>;
  files$!: Observable<FileAttachment[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  currentUser$!: Observable<User | null>;

  // Signals for reactive state
  selectedTab = signal(0);
  isEditMode = signal(false);
  showTimeline = signal(true);
  showStatistics = signal(true);
  autoRefresh = signal(true);
  refreshInterval = signal(30000); // 30 seconds

  // Computed signals
  canEdit = computed(() => {
    const user = this.currentUser;
    const project = this.project;
    return user && project && (
      user.id === project.owner.id ||
      user.role === 'admin' ||
      this.hasPermission('project.edit')
    );
  });

  canDelete = computed(() => {
    const user = this.currentUser;
    return user && (
      user.role === 'admin' ||
      this.hasPermission('project.delete')
    );
  });

  projectProgress = computed(() => {
    const project = this.project;
    if (!project) return 0;
    return project.completedTaskCount / project.taskCount * 100;
  });

  // Component state
  project: Project | null = null;
  projectId!: string;
  currentUser: User | null = null;
  selectedSprint: Sprint | null = null;
  editForm!: FormGroup;
  commentForm!: FormGroup;
  
  // UI state
  activeTabIndex = 0;
  expandedPanels = new Set<string>();
  selectedTasks = new Set<string>();
  viewMode: 'kanban' | 'list' | 'calendar' = 'kanban';
  timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month';
  
  // Chart configurations
  burndownChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Ideal',
      borderColor: '#4caf50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
    }, {
      data: [],
      label: 'Actual',
      borderColor: '#2196f3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
    }],
  };

  velocityChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Completed',
      backgroundColor: '#4caf50',
    }, {
      data: [],
      label: 'Committed',
      backgroundColor: '#ff9800',
    }],
  };

  taskChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['To Do', 'In Progress', 'In Review', 'Done'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#f44336', '#ff9800', '#2196f3', '#4caf50'],
    }],
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Responsive
  isMobile = false;
  isTablet = false;
  
  // Subscriptions
  private destroy$ = new Subject<void>();
  private refreshTimer$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private fb: FormBuilder,
    private projectsService: ProjectsService,
    private sprintsService: SprintsService,
    private tasksService: TasksService,
    private teamsService: TeamsService,
    private commentsService: CommentsService,
    private fileUploadService: FileUploadService,
    private webSocketService: WebSocketService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private shortcutService: ShortcutService,
    private themeService: ThemeService,
    private localStorageService: LocalStorageService,
    private exportService: ExportService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef,
    private translateService: TranslateService
  ) {
    this.initializeForms();
    this.setupResponsive();
  }

  ngOnInit(): void {
    this.loadProjectData();
    this.setupObservables();
    this.setupWebSocketListeners();
    this.registerKeyboardShortcuts();
    this.setupAutoRefresh();
    this.loadUserPreferences();
  }

  ngAfterViewInit(): void {
    this.initializeCharts();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.refreshTimer$.complete();
    this.webSocketService.off('project:updated');
    this.webSocketService.off('sprint:updated');
    this.webSocketService.off('task:updated');
    this.shortcutService.unregister(['ctrl+e', 'ctrl+s', 'ctrl+d', 'ctrl+shift+e']);
  }

  /**
   * Initialize reactive forms
   */
  private initializeForms(): void {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      status: [ProjectStatus.Planning, Validators.required],
      priority: [ProjectPriority.Medium, Validators.required],
      startDate: [new Date(), Validators.required],
      dueDate: [new Date(), Validators.required],
      budget: [0, [Validators.min(0)]],
      tags: [[]],
      settings: this.fb.group({
        isPublic: [false],
        allowComments: [true],
        requireApproval: [false],
        notifyOnUpdate: [true],
      }),
    });

    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]],
      attachments: [[]],
    });
  }

  /**
   * Setup responsive breakpoint observer
   */
  private setupResponsive(): void {
    this.breakpointObserver
      .observe(['(max-width: 768px)', '(max-width: 1024px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.breakpoints['(max-width: 768px)'];
        this.isTablet = result.breakpoints['(max-width: 1024px)'];
      });
  }

  /**
   * Load project data from route params
   */
  private loadProjectData(): void {
    this.route.params
      .pipe(
        map(params => params['id']),
        filter(id => !!id),
        tap(id => this.projectId = id),
        takeUntil(this.destroy$)
      )
      .subscribe(id => {
        this.store.dispatch(fromProjects.loadProject({ id }));
        this.store.dispatch(fromSprints.loadSprintsByProject({ projectId: id }));
        this.store.dispatch(fromTasks.loadTasksByProject({ projectId: id }));
      });
  }

  /**
   * Setup observable streams
   */
  private setupObservables(): void {
    this.project$ = this.store.select(fromProjects.selectSelectedProject).pipe(
      tap(project => {
        this.project = project;
        if (project) {
          this.updateFormValues(project);
          this.updateChartData();
        }
      }),
      takeUntil(this.destroy$)
    );

    this.sprints$ = this.store.select(fromSprints.selectSprintsByProject(this.projectId));
    this.tasks$ = this.store.select(fromTasks.selectTasksByProject(this.projectId));
    this.loading$ = this.store.select(fromUI.selectLoading);
    this.error$ = this.store.select(fromProjects.selectError);
    this.currentUser$ = this.store.select(fromAuth.selectCurrentUser).pipe(
      tap(user => this.currentUser = user)
    );

    // Load additional data
    this.activities$ = this.projectsService.getProjectActivities(this.projectId).pipe(
      catchError(() => of([])),
      shareReplay(1)
    );

    this.comments$ = this.commentsService.getCommentsByProject(this.projectId).pipe(
      catchError(() => of([])),
      shareReplay(1)
    );

    this.files$ = this.fileUploadService.getFilesByProject(this.projectId).pipe(
      catchError(() => of([])),
      shareReplay(1)
    );

    this.team$ = this.teamsService.getProjectTeam(this.projectId).pipe(
      catchError(() => of([])),
      shareReplay(1)
    );
  }

  /**
   * Setup WebSocket listeners for real-time updates
   */
  private setupWebSocketListeners(): void {
    this.webSocketService.on('project:updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe((project: Project) => {
        if (project.id === this.projectId) {
          this.store.dispatch(fromProjects.updateProjectSuccess({ project }));
          this.notificationService.info('Project updated');
        }
      });

    this.webSocketService.on('sprint:updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe((sprint: Sprint) => {
        if (sprint.projectId === this.projectId) {
          this.store.dispatch(fromSprints.updateSprintSuccess({ sprint }));
        }
      });

    this.webSocketService.on('task:updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe((task: Task) => {
        if (task.projectId === this.projectId) {
          this.store.dispatch(fromTasks.updateTaskSuccess({ task }));
          this.updateChartData();
        }
      });
  }

  /**
   * Register keyboard shortcuts
   */
  private registerKeyboardShortcuts(): void {
    this.shortcutService.register('ctrl+e', () => this.toggleEditMode());
    this.shortcutService.register('ctrl+s', () => this.saveProject());
    this.shortcutService.register('ctrl+d', () => this.duplicateProject());
    this.shortcutService.register('ctrl+shift+e', () => this.exportProject());
  }

  /**
   * Setup auto-refresh timer
   */
  private setupAutoRefresh(): void {
    effect(() => {
      if (this.autoRefresh() && this.refreshInterval() > 0) {
        timer(0, this.refreshInterval())
          .pipe(takeUntil(this.refreshTimer$))
          .subscribe(() => this.refreshData());
      } else {
        this.refreshTimer$.next();
      }
    });
  }

  /**
   * Load user preferences from local storage
   */
  private loadUserPreferences(): void {
    const preferences = this.localStorageService.getItem('project-detail-preferences');
    if (preferences) {
      this.showTimeline.set(preferences.showTimeline ?? true);
      this.showStatistics.set(preferences.showStatistics ?? true);
      this.autoRefresh.set(preferences.autoRefresh ?? true);
      this.refreshInterval.set(preferences.refreshInterval ?? 30000);
      this.viewMode = preferences.viewMode ?? 'kanban';
      this.timeRange = preferences.timeRange ?? 'month';
    }
  }

  /**
   * Save user preferences to local storage
   */
  private saveUserPreferences(): void {
    const preferences = {
      showTimeline: this.showTimeline(),
      showStatistics: this.showStatistics(),
      autoRefresh: this.autoRefresh(),
      refreshInterval: this.refreshInterval(),
      viewMode: this.viewMode,
      timeRange: this.timeRange,
    };
    this.localStorageService.setItem('project-detail-preferences', preferences);
  }

  /**
   * Update form values with project data
   */
  private updateFormValues(project: Project): void {
    this.editForm.patchValue({
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      dueDate: project.dueDate,
      budget: project.budget || 0,
      tags: project.tags || [],
      settings: project.settings || {},
    });
  }

  /**
   * Initialize charts
   */
  private initializeCharts(): void {
    if (this.burndownChart) {
      this.updateBurndownChart();
    }
    if (this.velocityChart) {
      this.updateVelocityChart();
    }
    if (this.taskChart) {
      this.updateTaskChart();
    }
  }

  /**
   * Update chart data based on project metrics
   */
  private updateChartData(): void {
    this.updateBurndownChart();
    this.updateVelocityChart();
    this.updateTaskChart();
  }

  /**
   * Update burndown chart data
   */
  private updateBurndownChart(): void {
    // Implementation for burndown chart data
    // This would fetch actual sprint/task data and calculate burndown
  }

  /**
   * Update velocity chart data
   */
  private updateVelocityChart(): void {
    // Implementation for velocity chart data
    // This would fetch sprint velocity data
  }

  /**
   * Update task distribution chart
   */
  private updateTaskChart(): void {
    this.tasks$.pipe(
      take(1),
      map(tasks => {
        const distribution = {
          todo: 0,
          inProgress: 0,
          inReview: 0,
          done: 0,
        };

        tasks.forEach(task => {
          switch (task.status) {
            case TaskStatus.Todo:
              distribution.todo++;
              break;
            case TaskStatus.InProgress:
              distribution.inProgress++;
              break;
            case TaskStatus.InReview:
              distribution.inReview++;
              break;
            case TaskStatus.Done:
              distribution.done++;
              break;
          }
        });

        return [distribution.todo, distribution.inProgress, distribution.inReview, distribution.done];
      })
    ).subscribe(data => {
      this.taskChartData.datasets[0].data = data;
      this.taskChart?.update();
    });
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  /**
   * Toggle edit mode
   */
  toggleEditMode(): void {
    this.isEditMode.update(v => !v);
    if (!this.isEditMode()) {
      this.updateFormValues(this.project!);
    }
  }

  /**
   * Save project changes
   */
  saveProject(): void {
    if (this.editForm.valid && this.project) {
      const updates = this.editForm.value;
      this.store.dispatch(fromProjects.updateProject({
        project: { ...this.project, ...updates }
      }));
      this.isEditMode.set(false);
      this.notificationService.success('Project updated successfully');
    }
  }

  /**
   * Delete project
   */
  deleteProject(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to delete "${this.project?.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed()
      .pipe(filter(confirmed => confirmed))
      .subscribe(() => {
        this.store.dispatch(fromProjects.deleteProject({ id: this.projectId }));
        this.router.navigate(['/projects']);
      });
  }

  /**
   * Duplicate project
   */
  duplicateProject(): void {
    if (this.project) {
      this.projectsService.duplicateProject(this.project.id)
        .subscribe(newProject => {
          this.notificationService.success('Project duplicated successfully');
          this.router.navigate(['/projects', newProject.id]);
        });
    }
  }

  /**
   * Archive project
   */
  archiveProject(): void {
    if (this.project) {
      this.projectsService.archiveProject(this.project.id)
        .subscribe(() => {
          this.notificationService.success('Project archived successfully');
          this.router.navigate(['/projects']);
        });
    }
  }

  /**
   * Export project data
   */
  exportProject(): void {
    if (this.project) {
      combineLatest([
        of(this.project),
        this.sprints$,
        this.tasks$,
        this.team$,
      ]).pipe(
        take(1),
        switchMap(([project, sprints, tasks, team]) => {
          return this.exportService.exportProject({
            project,
            sprints,
            tasks,
            team,
          });
        })
      ).subscribe(() => {
        this.notificationService.success('Project exported successfully');
      });
    }
  }

  /**
   * Share project
   */
  shareProject(): void {
    const dialogRef = this.dialog.open(ShareDialogComponent, {
      width: '500px',
      data: {
        type: 'project',
        item: this.project,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notificationService.success('Project shared successfully');
      }
    });
  }

  /**
   * Refresh project data
   */
  refreshData(): void {
    this.store.dispatch(fromProjects.loadProject({ id: this.projectId }));
    this.store.dispatch(fromSprints.loadSprintsByProject({ projectId: this.projectId }));
    this.store.dispatch(fromTasks.loadTasksByProject({ projectId: this.projectId }));
  }

  /**
   * Handle tab change
   */
  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTab.set(event.index);
    this.activeTabIndex = event.index;
    this.saveUserPreferences();
  }

  /**
   * Create new sprint
   */
  createSprint(): void {
    const dialogRef = this.dialog.open(SprintCreateDialogComponent, {
      width: '600px',
      data: { projectId: this.projectId },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.store.dispatch(fromSprints.createSprint({ sprint: result }));
        this.notificationService.success('Sprint created successfully');
      }
    });
  }

  /**
   * Create new task
   */
  createTask(): void {
    const dialogRef = this.dialog.open(TaskCreateDialogComponent, {
      width: '600px',
      data: { projectId: this.projectId },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.store.dispatch(fromTasks.createTask({ task: result }));
        this.notificationService.success('Task created successfully');
      }
    });
  }

  /**
   * Add team member
   */
  addTeamMember(): void {
    const dialogRef = this.dialog.open(TeamMemberAddDialogComponent, {
      width: '500px',
      data: { projectId: this.projectId },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.teamsService.addMemberToProject(this.projectId, result)
          .subscribe(() => {
            this.notificationService.success('Team member added successfully');
            this.refreshData();
          });
      }
    });
  }

  /**
   * Remove team member
   */
  removeTeamMember(member: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove Team Member',
        message: `Are you sure you want to remove ${member.name} from the project?`,
        confirmText: 'Remove',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed()
      .pipe(filter(confirmed => confirmed))
      .subscribe(() => {
        this.teamsService.removeMemberFromProject(this.projectId, member.id)
          .subscribe(() => {
            this.notificationService.success('Team member removed successfully');
            this.refreshData();
          });
      });
  }

  /**
   * Post comment
   */
  postComment(): void {
    if (this.commentForm.valid) {
      const comment = {
        ...this.commentForm.value,
        projectId: this.projectId,
        userId: this.currentUser?.id,
        timestamp: new Date(),
      };

      this.commentsService.createComment(comment)
        .subscribe(() => {
          this.commentForm.reset();
          this.notificationService.success('Comment posted successfully');
        });
    }
  }

  /**
   * Upload file
   */
  uploadFile(): void {
    const dialogRef = this.dialog.open(FileUploadDialogComponent, {
      width: '500px',
      data: {
        projectId: this.projectId,
        accept: '*/*',
        multiple: true,
      },
    });

    dialogRef.afterClosed().subscribe(files => {
      if (files?.length) {
        this.notificationService.success(`${files.length} file(s) uploaded successfully`);
        this.refreshData();
      }
    });
  }

  /**
   * Download file
   */
  downloadFile(file: FileAttachment): void {
    this.fileUploadService.downloadFile(file.id)
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }

  /**
   * Delete file
   */
  deleteFile(file: FileAttachment): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete File',
        message: `Are you sure you want to delete "${file.name}"?`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed()
      .pipe(filter(confirmed => confirmed))
      .subscribe(() => {
        this.fileUploadService.deleteFile(file.id)
          .subscribe(() => {
            this.notificationService.success('File deleted successfully');
            this.refreshData();
          });
      });
  }

  /**
   * Toggle panel expansion
   */
  togglePanel(panel: string): void {
    if (this.expandedPanels.has(panel)) {
      this.expandedPanels.delete(panel);
    } else {
      this.expandedPanels.add(panel);
    }
  }

  /**
   * Check if panel is expanded
   */
  isPanelExpanded(panel: string): boolean {
    return this.expandedPanels.has(panel);
  }

  /**
   * Get status color
   */
  getStatusColor(status: ProjectStatus): string {
    const colors = {
      [ProjectStatus.Planning]: '#2196f3',
      [ProjectStatus.Active]: '#4caf50',
      [ProjectStatus.OnHold]: '#ff9800',
      [ProjectStatus.Completed]: '#9c27b0',
      [ProjectStatus.Cancelled]: '#f44336',
    };
    return colors[status] || '#757575';
  }

  /**
   * Get priority color
   */
  getPriorityColor(priority: ProjectPriority): string {
    const colors = {
      [ProjectPriority.Low]: '#4caf50',
      [ProjectPriority.Medium]: '#ff9800',
      [ProjectPriority.High]: '#f44336',
      [ProjectPriority.Critical]: '#d32f2f',
    };
    return colors[priority] || '#757575';
  }

  /**
   * Get progress color based on percentage
   */
  getProgressColor(progress: number): string {
    if (progress < 25) return 'warn';
    if (progress < 75) return 'accent';
    return 'primary';
  }

  /**
   * Check if date is overdue
   */
  isOverdue(date: Date): boolean {
    return new Date(date) < new Date() && this.project?.status !== ProjectStatus.Completed;
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Track by function for ngFor
   */
  trackById(index: number, item: any): any {
    return item.id || index;
  }
}
