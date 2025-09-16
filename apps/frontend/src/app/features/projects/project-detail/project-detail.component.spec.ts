import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
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
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store, StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of, throwError, BehaviorSubject, Subject } from 'rxjs';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { ProjectDetailComponent } from './project-detail.component';
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
import { Project, ProjectStatus, ProjectPriority } from '../../../shared/interfaces/project.interface';
import { Sprint } from '../../../shared/interfaces/sprint.interface';
import { Task, TaskStatus } from '../../../shared/interfaces/task.interface';
import { User } from '../../../shared/interfaces/user.interface';
import { Comment } from '../../../shared/interfaces/comment.interface';
import { FileAttachment } from '../../../shared/interfaces/file.interface';
import * as fromProjects from '../../../store/projects';
import * as fromAuth from '../../../store/auth';

/**
 * Test suite for ProjectDetailComponent
 * Tests comprehensive project detail functionality including tabs,
 * real-time updates, editing, team management, and charts.
 */
describe('ProjectDetailComponent', () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;
  let store: MockStore;
  let projectsService: jasmine.SpyObj<ProjectsService>;
  let sprintsService: jasmine.SpyObj<SprintsService>;
  let tasksService: jasmine.SpyObj<TasksService>;
  let teamsService: jasmine.SpyObj<TeamsService>;
  let commentsService: jasmine.SpyObj<CommentsService>;
  let fileUploadService: jasmine.SpyObj<FileUploadService>;
  let webSocketService: jasmine.SpyObj<WebSocketService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let authService: jasmine.SpyObj<AuthService>;
  let shortcutService: jasmine.SpyObj<ShortcutService>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;
  let exportService: jasmine.SpyObj<ExportService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: jasmine.SpyObj<Router>;
  let breakpointObserver: jasmine.SpyObj<BreakpointObserver>;
  let translateService: jasmine.SpyObj<TranslateService>;

  const mockProject: Project = {
    id: '1',
    key: 'PRJ-001',
    name: 'Test Project',
    description: 'A test project for unit testing',
    status: ProjectStatus.Active,
    priority: ProjectPriority.High,
    progress: 65,
    startDate: new Date('2025-01-01'),
    dueDate: new Date('2025-12-31'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-09-01'),
    owner: {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'avatar1.jpg',
      role: 'admin'
    } as User,
    team: [
      { id: 'user1', name: 'John Doe', avatar: 'avatar1.jpg' } as User,
      { id: 'user2', name: 'Jane Smith', avatar: 'avatar2.jpg' } as User,
    ],
    tags: ['frontend', 'angular', 'testing'],
    taskCount: 100,
    completedTaskCount: 65,
    bugCount: 5,
    teamSize: 5,
    sprintCount: 8,
    completedSprintCount: 4,
    isFavorite: true,
    isArchived: false,
    logo: 'project-logo.jpg',
    coverImage: 'project-cover.jpg',
    velocity: 25,
    budget: 50000,
    settings: {
      isPublic: false,
      allowComments: true,
      requireApproval: false,
      notifyOnUpdate: true,
    },
    recentActivities: [],
  };

  const mockSprints: Sprint[] = [
    {
      id: '1',
      name: 'Sprint 1',
      goal: 'Complete authentication',
      projectId: '1',
      status: 'completed',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-14'),
      isActive: false,
      totalPoints: 30,
      completedPoints: 30,
      velocity: 30,
      completionRate: 100,
      progress: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Sprint 2',
      goal: 'Implement dashboard',
      projectId: '1',
      status: 'active',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-01-28'),
      isActive: true,
      totalPoints: 40,
      completedPoints: 25,
      velocity: 25,
      completionRate: 62.5,
      progress: 62.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockTasks: Task[] = [
    {
      id: '1',
      key: 'TASK-001',
      title: 'Implement login',
      description: 'Create login component',
      status: TaskStatus.Done,
      priority: 'high',
      type: 'feature',
      projectId: '1',
      sprintId: '1',
      assignee: { id: 'user1', name: 'John Doe' } as User,
      storyPoints: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      key: 'TASK-002',
      title: 'Add validation',
      description: 'Add form validation',
      status: TaskStatus.InProgress,
      priority: 'medium',
      type: 'feature',
      projectId: '1',
      sprintId: '2',
      assignee: { id: 'user2', name: 'Jane Smith' } as User,
      storyPoints: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockComments: Comment[] = [
    {
      id: '1',
      content: 'Great progress on this project!',
      projectId: '1',
      user: {
        id: 'user1',
        name: 'John Doe',
        avatar: 'avatar1.jpg'
      } as User,
      timestamp: new Date(),
      attachments: [],
    },
  ];

  const mockFiles: FileAttachment[] = [
    {
      id: '1',
      name: 'requirements.pdf',
      size: 1024000,
      type: 'application/pdf',
      url: 'files/requirements.pdf',
      uploadedAt: new Date(),
      uploadedBy: {
        id: 'user1',
        name: 'John Doe'
      } as User,
    },
  ];

  const mockUser: User = {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'avatar1.jpg',
    role: 'admin',
    permissions: ['project.edit', 'project.delete'],
  };

  const initialState = {
    projects: {
      entities: { '1': mockProject },
      ids: ['1'],
      selectedProjectId: '1',
      loading: false,
      error: null,
    },
    sprints: {
      entities: {
        '1': mockSprints[0],
        '2': mockSprints[1],
      },
      ids: ['1', '2'],
    },
    tasks: {
      entities: {
        '1': mockTasks[0],
        '2': mockTasks[1],
      },
      ids: ['1', '2'],
    },
    auth: {
      user: mockUser,
      isAuthenticated: true,
    },
    ui: {
      loading: false,
    },
  };

  beforeEach(async () => {
    // Create spies for services
    const projectsServiceSpy = jasmine.createSpyObj('ProjectsService', [
      'getProject',
      'updateProject',
      'deleteProject',
      'duplicateProject',
      'archiveProject',
      'getProjectActivities',
    ]);

    const sprintsServiceSpy = jasmine.createSpyObj('SprintsService', [
      'getSprintsByProject',
      'createSprint',
      'updateSprint',
      'startSprint',
      'completeSprint',
    ]);

    const tasksServiceSpy = jasmine.createSpyObj('TasksService', [
      'getTasksByProject',
      'createTask',
      'updateTask',
      'moveTask',
    ]);

    const teamsServiceSpy = jasmine.createSpyObj('TeamsService', [
      'getProjectTeam',
      'addMemberToProject',
      'removeMemberFromProject',
      'updateMemberRole',
    ]);

    const commentsServiceSpy = jasmine.createSpyObj('CommentsService', [
      'getCommentsByProject',
      'createComment',
      'updateComment',
      'deleteComment',
    ]);

    const fileUploadServiceSpy = jasmine.createSpyObj('FileUploadService', [
      'getFilesByProject',
      'uploadFile',
      'downloadFile',
      'deleteFile',
    ]);

    const webSocketServiceSpy = jasmine.createSpyObj('WebSocketService', [
      'connect',
      'disconnect',
      'emit',
      'on',
      'off',
    ]);

    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
      'warning',
      'info',
    ]);

    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'hasPermission',
      'getCurrentUser',
    ]);

    const shortcutServiceSpy = jasmine.createSpyObj('ShortcutService', [
      'register',
      'unregister',
    ]);

    const themeServiceSpy = jasmine.createSpyObj('ThemeService', [
      'isDarkMode',
      'toggleTheme',
    ]);

    const localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', [
      'getItem',
      'setItem',
      'removeItem',
    ]);

    const exportServiceSpy = jasmine.createSpyObj('ExportService', [
      'exportProject',
      'exportChart',
    ]);

    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const breakpointObserverSpy = jasmine.createSpyObj('BreakpointObserver', ['observe']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant', 'get']);

    const activatedRouteStub = {
      params: of({ id: '1' }),
    };

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        HttpClientTestingModule,
        ReactiveFormsModule,
        FormsModule,
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
        MatNativeDateModule,
        MatAutocompleteModule,
        MatSlideToggleModule,
        DragDropModule,
        TranslateModule.forRoot(),
        StoreModule.forRoot({}),
        EffectsModule.forRoot([]),
        ProjectDetailComponent, // Standalone component
      ],
      providers: [
        provideMockStore({ initialState }),
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: Router, useValue: routerSpy },
        { provide: ProjectsService, useValue: projectsServiceSpy },
        { provide: SprintsService, useValue: sprintsServiceSpy },
        { provide: TasksService, useValue: tasksServiceSpy },
        { provide: TeamsService, useValue: teamsServiceSpy },
        { provide: CommentsService, useValue: commentsServiceSpy },
        { provide: FileUploadService, useValue: fileUploadServiceSpy },
        { provide: WebSocketService, useValue: webSocketServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ShortcutService, useValue: shortcutServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: ExportService, useValue: exportServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: BreakpointObserver, useValue: breakpointObserverSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store) as MockStore;
    projectsService = TestBed.inject(ProjectsService) as jasmine.SpyObj<ProjectsService>;
    sprintsService = TestBed.inject(SprintsService) as jasmine.SpyObj<SprintsService>;
    tasksService = TestBed.inject(TasksService) as jasmine.SpyObj<TasksService>;
    teamsService = TestBed.inject(TeamsService) as jasmine.SpyObj<TeamsService>;
    commentsService = TestBed.inject(CommentsService) as jasmine.SpyObj<CommentsService>;
    fileUploadService = TestBed.inject(FileUploadService) as jasmine.SpyObj<FileUploadService>;
    webSocketService = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    shortcutService = TestBed.inject(ShortcutService) as jasmine.SpyObj<ShortcutService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    localStorageService = TestBed.inject(LocalStorageService) as jasmine.SpyObj<LocalStorageService>;
    exportService = TestBed.inject(ExportService) as jasmine.SpyObj<ExportService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    breakpointObserver = TestBed.inject(BreakpointObserver) as jasmine.SpyObj<BreakpointObserver>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;

    // Set up default spy behaviors
    projectsService.getProjectActivities.and.returnValue(of([]));
    commentsService.getCommentsByProject.and.returnValue(of(mockComments));
    fileUploadService.getFilesByProject.and.returnValue(of(mockFiles));
    teamsService.getProjectTeam.and.returnValue(of(mockProject.team));
    webSocketService.on.and.returnValue(new Subject());
    authService.hasPermission.and.returnValue(true);
    translateService.instant.and.returnValue('Translated');
    translateService.get.and.returnValue(of('Translated'));
    localStorageService.getItem.and.returnValue(null);
    breakpointObserver.observe.and.returnValue(of({ matches: false, breakpoints: {} }));
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize forms on construction', () => {
      expect(component.editForm).toBeDefined();
      expect(component.commentForm).toBeDefined();
      expect(component.editForm.get('name')).toBeDefined();
      expect(component.commentForm.get('content')).toBeDefined();
    });

    it('should load project data from route params', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      expect(component.projectId).toBe('1');
      expect(store.dispatch).toHaveBeenCalledWith(
        fromProjects.loadProject({ id: '1' })
      );
    }));

    it('should setup observables', () => {
      fixture.detectChanges();
      
      expect(component.project$).toBeDefined();
      expect(component.sprints$).toBeDefined();
      expect(component.tasks$).toBeDefined();
      expect(component.team$).toBeDefined();
      expect(component.activities$).toBeDefined();
      expect(component.comments$).toBeDefined();
      expect(component.files$).toBeDefined();
    });

    it('should setup WebSocket listeners', () => {
      fixture.detectChanges();
      
      expect(webSocketService.on).toHaveBeenCalledWith('project:updated');
      expect(webSocketService.on).toHaveBeenCalledWith('sprint:updated');
      expect(webSocketService.on).toHaveBeenCalledWith('task:updated');
    });

    it('should register keyboard shortcuts', () => {
      fixture.detectChanges();
      
      expect(shortcutService.register).toHaveBeenCalledWith('ctrl+e', jasmine.any(Function));
      expect(shortcutService.register).toHaveBeenCalledWith('ctrl+s', jasmine.any(Function));
      expect(shortcutService.register).toHaveBeenCalledWith('ctrl+d', jasmine.any(Function));
      expect(shortcutService.register).toHaveBeenCalledWith('ctrl+shift+e', jasmine.any(Function));
    });

    it('should load user preferences', () => {
      const preferences = {
        showTimeline: false,
        showStatistics: false,
        autoRefresh: false,
        refreshInterval: 60000,
        viewMode: 'list',
        timeRange: 'quarter',
      };
      localStorageService.getItem.and.returnValue(preferences);
      
      fixture.detectChanges();
      
      expect(component.showTimeline()).toBe(false);
      expect(component.showStatistics()).toBe(false);
      expect(component.autoRefresh()).toBe(false);
      expect(component.refreshInterval()).toBe(60000);
      expect(component.viewMode).toBe('list');
      expect(component.timeRange).toBe('quarter');
    });
  });

  describe('Project Data Management', () => {
    beforeEach(() => {
      component.project = mockProject;
      component.currentUser = mockUser;
    });

    it('should update form values when project loads', () => {
      fixture.detectChanges();
      
      expect(component.editForm.get('name')?.value).toBe(mockProject.name);
      expect(component.editForm.get('description')?.value).toBe(mockProject.description);
      expect(component.editForm.get('status')?.value).toBe(mockProject.status);
      expect(component.editForm.get('priority')?.value).toBe(mockProject.priority);
    });

    it('should toggle edit mode', () => {
      fixture.detectChanges();
      
      expect(component.isEditMode()).toBe(false);
      
      component.toggleEditMode();
      expect(component.isEditMode()).toBe(true);
      
      component.toggleEditMode();
      expect(component.isEditMode()).toBe(false);
    });

    it('should save project changes', () => {
      fixture.detectChanges();
      component.isEditMode.set(true);
      
      component.editForm.patchValue({
        name: 'Updated Project',
        description: 'Updated description',
      });
      
      component.saveProject();
      
      expect(store.dispatch).toHaveBeenCalledWith(
        fromProjects.updateProject({
          project: jasmine.objectContaining({
            id: '1',
            name: 'Updated Project',
            description: 'Updated description',
          })
        })
      );
      expect(component.isEditMode()).toBe(false);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('should not save invalid form', () => {
      fixture.detectChanges();
      component.editForm.patchValue({ name: '' });
      
      component.saveProject();
      
      expect(store.dispatch).not.toHaveBeenCalledWith(
        jasmine.objectContaining({ type: fromProjects.updateProject.type })
      );
    });

    it('should delete project with confirmation', () => {
      const dialogRef = { afterClosed: () => of(true) };
      dialog.open.and.returnValue(dialogRef as any);
      
      component.deleteProject();
      
      expect(dialog.open).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith(
        fromProjects.deleteProject({ id: '1' })
      );
      expect(router.navigate).toHaveBeenCalledWith(['/projects']);
    });

    it('should duplicate project', () => {
      projectsService.duplicateProject.and.returnValue(of({ ...mockProject, id: '2' }));
      
      component.duplicateProject();
      
      expect(projectsService.duplicateProject).toHaveBeenCalledWith('1');
      expect(notificationService.success).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/projects', '2']);
    });

    it('should archive project', () => {
      projectsService.archiveProject.and.returnValue(of(mockProject));
      
      component.archiveProject();
      
      expect(projectsService.archiveProject).toHaveBeenCalledWith('1');
      expect(notificationService.success).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/projects']);
    });

    it('should export project data', () => {
      exportService.exportProject.and.returnValue(of(new Blob()));
      
      component.exportProject();
      
      expect(exportService.exportProject).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('should share project', () => {
      const dialogRef = { afterClosed: () => of({ shared: true }) };
      dialog.open.and.returnValue(dialogRef as any);
      
      component.shareProject();
      
      expect(dialog.open).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalled();
    });
  });

  describe('Tab Management', () => {
    it('should handle tab changes', () => {
      const event = { index: 2 } as any;
      
      component.onTabChange(event);
      
      expect(component.selectedTab()).toBe(2);
      expect(component.activeTabIndex).toBe(2);
      expect(localStorageService.setItem).toHaveBeenCalled();
    });

    it('should show correct tab content', () => {
      fixture.detectChanges();
      
      const tabs = fixture.debugElement.queryAll(By.css('mat-tab'));
      expect(tabs.length).toBeGreaterThan(0);
    });
  });

  describe('Sprint Management', () => {
    it('should create a new sprint', () => {
      const dialogRef = { afterClosed: () => of(mockSprints[0]) };
      dialog.open.and.returnValue(dialogRef as any);
      
      component.createSprint();
      
      expect(dialog.open).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith(
        fromSprints.createSprint({ sprint: mockSprints[0] })
      );
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('should start a sprint', () => {
      sprintsService.startSprint.and.returnValue(of(mockSprints[1]));
      
      component.startSprint(mockSprints[1]);
      
      expect(sprintsService.startSprint).toHaveBeenCalledWith(mockSprints[1].id);
    });

    it('should complete a sprint', () => {
      sprintsService.completeSprint.and.returnValue(of(mockSprints[0]));
      
      component.completeSprint(mockSprints[0]);
      
      expect(sprintsService.completeSprint).toHaveBeenCalledWith(mockSprints[0].id);
    });
  });

  describe('Task Management', () => {
    it('should create a new task', () => {
      const dialogRef = { afterClosed: () => of(mockTasks[0]) };
      dialog.open.and.returnValue(dialogRef as any);
      
      component.createTask();
      
      expect(dialog.open).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith(
        fromTasks.createTask({ task: mockTasks[0] })
      );
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('should handle task drop in kanban', () => {
      const event = {
        previousContainer: { data: [] },
        container: { data: [] },
        previousIndex: 0,
        currentIndex: 1,
        item: { data: mockTasks[0] },
      } as any;
      
      component.onTaskDrop(event, TaskStatus.InProgress);
      
      expect(tasksService.moveTask).toHaveBeenCalled();
    });

    it('should filter tasks by status', () => {
      component.tasks$ = of(mockTasks);
      
      const todoTasks = component.getTasksByStatus({ value: TaskStatus.Todo } as any);
      const inProgressTasks = component.getTasksByStatus({ value: TaskStatus.InProgress } as any);
      
      expect(todoTasks.length).toBe(0);
      expect(inProgressTasks.length).toBe(1);
    });
  });

  describe('Team Management', () => {
    it('should add a team member', () => {
      const newMember = { id: 'user3', name: 'Bob Johnson' };
      const dialogRef = { afterClosed: () => of(newMember) };
      dialog.open.and.returnValue(dialogRef as any);
      teamsService.addMemberToProject.and.returnValue(of(newMember));
      
      component.addTeamMember();
      
      expect(dialog.open).toHaveBeenCalled();
      expect(teamsService.addMemberToProject).toHaveBeenCalledWith('1', newMember);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('should remove a team member', () => {
      const member = mockProject.team[0];
      const dialogRef = { afterClosed: () => of(true) };
      dialog.open.and.returnValue(dialogRef as any);
      teamsService.removeMemberFromProject.and.returnValue(of({}));
      
      component.removeTeamMember(member);
      
      expect(dialog.open).toHaveBeenCalled();
      expect(teamsService.removeMemberFromProject).toHaveBeenCalledWith('1', member.id);
      expect(notificationService.success).toHaveBeenCalled();
    });
  });

  describe('Comments', () => {
    it('should post a comment', () => {
      component.currentUser = mockUser;
      component.commentForm.patchValue({ content: 'New comment' });
      commentsService.createComment.and.returnValue(of(mockComments[0]));
      
      component.postComment();
      
      expect(commentsService.createComment).toHaveBeenCalledWith(
        jasmine.objectContaining({
          content: 'New comment',
          projectId: '1',
          userId: 'user1',
        })
      );
      expect(component.commentForm.get('content')?.value).toBe(null);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('should not post empty comment', () => {
      component.commentForm.patchValue({ content: '' });
      
      component.postComment();
      
      expect(commentsService.createComment).not.toHaveBeenCalled();
    });
  });

  describe('File Management', () => {
    it('should upload files', () => {
      const files = [new File([''], 'test.pdf')];
      const dialogRef = { afterClosed: () => of(files) };
      dialog.open.and.returnValue(dialogRef as any);
      
      component.uploadFile();
      
      expect(dialog.open).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('1 file(s) uploaded successfully');
    });

    it('should download a file', () => {
      const blob = new Blob(['file content']);
      fileUploadService.downloadFile.and.returnValue(of(blob));
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');
      
      const file = mockFiles[0];
      component.downloadFile(file);
      
      expect(fileUploadService.downloadFile).toHaveBeenCalledWith('1');
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
    });

    it('should delete a file', () => {
      const dialogRef = { afterClosed: () => of(true) };
      dialog.open.and.returnValue(dialogRef as any);
      fileUploadService.deleteFile.and.returnValue(of({}));
      
      component.deleteFile(mockFiles[0]);
      
      expect(dialog.open).toHaveBeenCalled();
      expect(fileUploadService.deleteFile).toHaveBeenCalledWith('1');
      expect(notificationService.success).toHaveBeenCalled();
    });
  });

  describe('Charts', () => {
    it('should initialize chart data', () => {
      fixture.detectChanges();
      
      expect(component.burndownChartData).toBeDefined();
      expect(component.velocityChartData).toBeDefined();
      expect(component.taskChartData).toBeDefined();
    });

    it('should update task distribution chart', () => {
      component.tasks$ = of(mockTasks);
      
      component.updateTaskChart();
      
      expect(component.taskChartData.datasets[0].data).toBeDefined();
    });
  });

  describe('Real-time Updates', () => {
    it('should handle project updates via WebSocket', () => {
      const subject = new Subject<Project>();
      webSocketService.on.and.returnValue(subject);
      
      component.ngOnInit();
      subject.next(mockProject);
      
      expect(store.dispatch).toHaveBeenCalledWith(
        fromProjects.updateProjectSuccess({ project: mockProject })
      );
    });

    it('should handle sprint updates via WebSocket', () => {
      const subject = new Subject<Sprint>();
      webSocketService.on.and.returnValue(subject);
      
      component.ngOnInit();
      subject.next(mockSprints[0]);
      
      expect(store.dispatch).toHaveBeenCalledWith(
        fromSprints.updateSprintSuccess({ sprint: mockSprints[0] })
      );
    });

    it('should handle task updates via WebSocket', () => {
      const subject = new Subject<Task>();
      webSocketService.on.and.returnValue(subject);
      
      component.ngOnInit();
      subject.next(mockTasks[0]);
      
      expect(store.dispatch).toHaveBeenCalledWith(
        fromTasks.updateTaskSuccess({ task: mockTasks[0] })
      );
    });
  });

  describe('Auto Refresh', () => {
    it('should setup auto refresh when enabled', fakeAsync(() => {
      component.autoRefresh.set(true);
      component.refreshInterval.set(1000);
      
      fixture.detectChanges();
      tick(1000);
      
      expect(store.dispatch).toHaveBeenCalledWith(
        fromProjects.loadProject({ id: '1' })
      );
    }));

    it('should stop auto refresh when disabled', fakeAsync(() => {
      component.autoRefresh.set(true);
      fixture.detectChanges();
      
      component.autoRefresh.set(false);
      tick(1000);
      
      // Should not trigger additional refreshes
      const dispatchCalls = (store.dispatch as jasmine.Spy).calls.count();
      tick(1000);
      expect((store.dispatch as jasmine.Spy).calls.count()).toBe(dispatchCalls);
    }));
  });

  describe('Permissions', () => {
    it('should check edit permission', () => {
      authService.hasPermission.and.returnValue(true);
      component.currentUser = mockUser;
      component.project = mockProject;
      
      expect(component.canEdit()).toBe(true);
    });

    it('should check delete permission', () => {
      authService.hasPermission.and.returnValue(true);
      component.currentUser = mockUser;
      
      expect(component.canDelete()).toBe(true);
    });

    it('should deny edit for non-owner without permission', () => {
      authService.hasPermission.and.returnValue(false);
      component.currentUser = { ...mockUser, id: 'user2', role: 'member' };
      component.project = mockProject;
      
      expect(component.canEdit()).toBe(false);
    });
  });

  describe('Responsive Design', () => {
    it('should detect mobile breakpoint', () => {
      const breakpointSubject = new BehaviorSubject({
        matches: true,
        breakpoints: { '(max-width: 768px)': true }
      });
      breakpointObserver.observe.and.returnValue(breakpointSubject);
      
      fixture.detectChanges();
      
      expect(component.isMobile).toBe(true);
    });

    it('should detect tablet breakpoint', () => {
      const breakpointSubject = new BehaviorSubject({
        matches: true,
        breakpoints: { '(max-width: 1024px)': true }
      });
      breakpointObserver.observe.and.returnValue(breakpointSubject);
      
      fixture.detectChanges();
      
      expect(component.isTablet).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should get correct status color', () => {
      expect(component.getStatusColor(ProjectStatus.Active)).toBe('#4caf50');
      expect(component.getStatusColor(ProjectStatus.Planning)).toBe('#2196f3');
      expect(component.getStatusColor(ProjectStatus.OnHold)).toBe('#ff9800');
    });

    it('should get correct priority color', () => {
      expect(component.getPriorityColor(ProjectPriority.High)).toBe('#f44336');
      expect(component.getPriorityColor(ProjectPriority.Medium)).toBe('#ff9800');
      expect(component.getPriorityColor(ProjectPriority.Low)).toBe('#4caf50');
    });

    it('should get progress color based on percentage', () => {
      expect(component.getProgressColor(10)).toBe('warn');
      expect(component.getProgressColor(50)).toBe('accent');
      expect(component.getProgressColor(80)).toBe('primary');
    });

    it('should check if date is overdue', () => {
      const pastDate = new Date('2024-01-01');
      const futureDate = new Date('2026-01-01');
      
      component.project = { ...mockProject, status: ProjectStatus.Active };
      
      expect(component.isOverdue(pastDate)).toBe(true);
      expect(component.isOverdue(futureDate)).toBe(false);
    });

    it('should format file size correctly', () => {
      expect(component.formatFileSize(1024)).toBe('1.0 KB');
      expect(component.formatFileSize(1048576)).toBe('1.0 MB');
      expect(component.formatFileSize(1073741824)).toBe('1.0 GB');
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe and cleanup on destroy', () => {
      fixture.detectChanges();
      
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      spyOn(component['refreshTimer$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
      expect(component['refreshTimer$'].complete).toHaveBeenCalled();
      expect(webSocketService.off).toHaveBeenCalledWith('project:updated');
      expect(webSocketService.off).toHaveBeenCalledWith('sprint:updated');
      expect(webSocketService.off).toHaveBeenCalledWith('task:updated');
      expect(shortcutService.unregister).toHaveBeenCalled();
    });
  });
});
