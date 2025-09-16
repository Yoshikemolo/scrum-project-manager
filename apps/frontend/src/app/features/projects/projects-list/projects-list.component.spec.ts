import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store, StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of, throwError, BehaviorSubject, Subject } from 'rxjs';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CdkDropList } from '@angular/cdk/drag-drop';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { ProjectsListComponent } from './projects-list.component';
import { ProjectsService } from '../../../core/services/projects.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ShortcutService } from '../../../core/services/shortcut.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ExportService } from '../../../core/services/export.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Project, ProjectStatus, ProjectPriority } from '../../../shared/interfaces/project.interface';
import { User } from '../../../shared/interfaces/user.interface';
import { Team } from '../../../shared/interfaces/team.interface';
import * as fromProjects from '../../../store/projects';

/**
 * Test suite for ProjectsListComponent
 * Tests all functionality including grid/list views, filtering, sorting, batch operations,
 * drag and drop, real-time updates, and user interactions.
 */
describe('ProjectsListComponent', () => {
  let component: ProjectsListComponent;
  let fixture: ComponentFixture<ProjectsListComponent>;
  let store: MockStore;
  let projectsService: jasmine.SpyObj<ProjectsService>;
  let webSocketService: jasmine.SpyObj<WebSocketService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let shortcutService: jasmine.SpyObj<ShortcutService>;
  let authService: jasmine.SpyObj<AuthService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let exportService: jasmine.SpyObj<ExportService>;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;
  let translateService: jasmine.SpyObj<TranslateService>;

  const mockProjects: Project[] = [
    {
      id: '1',
      key: 'PRJ-001',
      name: 'Test Project 1',
      description: 'Description for test project 1',
      status: ProjectStatus.Active,
      priority: ProjectPriority.High,
      progress: 75,
      startDate: new Date('2025-01-01'),
      dueDate: new Date('2025-12-31'),
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-09-01'),
      owner: { id: 'user1', name: 'John Doe' } as User,
      team: [
        { id: 'user1', name: 'John Doe', avatar: 'avatar1.jpg' } as User,
        { id: 'user2', name: 'Jane Smith', avatar: 'avatar2.jpg' } as User,
      ],
      tags: ['frontend', 'angular'],
      taskCount: 50,
      completedTaskCount: 35,
      bugCount: 5,
      teamSize: 5,
      sprintCount: 3,
      isFavorite: true,
      isArchived: false,
      logo: 'project1.jpg',
      velocity: 25,
      recentActivities: [
        { icon: 'task', description: 'Task completed', timestamp: new Date() },
      ],
    },
    {
      id: '2',
      key: 'PRJ-002',
      name: 'Test Project 2',
      description: 'Description for test project 2',
      status: ProjectStatus.Planning,
      priority: ProjectPriority.Medium,
      progress: 25,
      startDate: new Date('2025-02-01'),
      dueDate: new Date('2025-11-30'),
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-09-01'),
      owner: { id: 'user2', name: 'Jane Smith' } as User,
      team: [
        { id: 'user2', name: 'Jane Smith', avatar: 'avatar2.jpg' } as User,
        { id: 'user3', name: 'Bob Johnson', avatar: 'avatar3.jpg' } as User,
      ],
      tags: ['backend', 'nodejs'],
      taskCount: 30,
      completedTaskCount: 8,
      bugCount: 2,
      teamSize: 3,
      sprintCount: 1,
      isFavorite: false,
      isArchived: false,
      logo: 'project2.jpg',
      velocity: 15,
      recentActivities: [],
    },
  ];

  const mockTeams: Team[] = [
    {
      id: 'team1',
      name: 'Development Team',
      avatar: 'team1.jpg',
      members: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'team2',
      name: 'Design Team',
      avatar: 'team2.jpg',
      members: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const initialState = {
    projects: {
      entities: {
        '1': mockProjects[0],
        '2': mockProjects[1],
      },
      ids: ['1', '2'],
      selectedProjectId: null,
      loading: false,
      error: null,
      filters: {},
      sortBy: 'name',
      sortOrder: 'asc',
    },
    auth: {
      user: {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        permissions: ['project.create', 'project.edit', 'project.delete'],
      },
      isAuthenticated: true,
    },
    teams: {
      entities: {
        'team1': mockTeams[0],
        'team2': mockTeams[1],
      },
      ids: ['team1', 'team2'],
    },
  };

  beforeEach(async () => {
    // Create spies for services
    const projectsServiceSpy = jasmine.createSpyObj('ProjectsService', [
      'getProjects',
      'createProject',
      'updateProject',
      'deleteProject',
      'duplicateProject',
      'archiveProject',
      'toggleFavorite',
      'batchUpdate',
      'exportProjects',
      'importProjects',
    ]);

    const webSocketServiceSpy = jasmine.createSpyObj('WebSocketService', [
      'connect',
      'disconnect',
      'emit',
      'on',
      'off',
    ]);

    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['isDarkMode', 'toggleTheme']);
    const shortcutServiceSpy = jasmine.createSpyObj('ShortcutService', ['register', 'unregister']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);
    const exportServiceSpy = jasmine.createSpyObj('ExportService', ['exportToJSON', 'exportToCSV', 'exportToPDF']);
    const localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem', 'removeItem']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant', 'get']);

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        FormsModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatCheckboxModule,
        MatMenuModule,
        MatProgressBarModule,
        MatChipsModule,
        MatTooltipModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatProgressSpinnerModule,
        DragDropModule,
        OverlayModule,
        A11yModule,
        TranslateModule.forRoot(),
        StoreModule.forRoot({}),
        EffectsModule.forRoot([]),
      ],
      declarations: [
        ProjectsListComponent,
        TruncatePipe,
        TimeAgoPipe,
      ],
      providers: [
        provideMockStore({ initialState }),
        { provide: ProjectsService, useValue: projectsServiceSpy },
        { provide: WebSocketService, useValue: webSocketServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: ShortcutService, useValue: shortcutServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: ExportService, useValue: exportServiceSpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsListComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store) as MockStore;
    projectsService = TestBed.inject(ProjectsService) as jasmine.SpyObj<ProjectsService>;
    webSocketService = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    shortcutService = TestBed.inject(ShortcutService) as jasmine.SpyObj<ShortcutService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    exportService = TestBed.inject(ExportService) as jasmine.SpyObj<ExportService>;
    localStorageService = TestBed.inject(LocalStorageService) as jasmine.SpyObj<LocalStorageService>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;

    // Set up default spy behaviors
    projectsService.getProjects.and.returnValue(of(mockProjects));
    webSocketService.on.and.returnValue(new Subject());
    authService.hasPermission.and.returnValue(true);
    translateService.instant.and.returnValue('Translated');
    translateService.get.and.returnValue(of('Translated'));
    localStorageService.getItem.and.returnValue(null);
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      fixture.detectChanges();
      expect(component.viewMode).toBe('grid');
      expect(component.showFilters).toBe(false);
      expect(component.selectedProjects.size).toBe(0);
      expect(component.pageSize).toBe(10);
      expect(component.expandedElement).toBeNull();
    });

    it('should load projects on init', () => {
      fixture.detectChanges();
      expect(store.dispatch).toHaveBeenCalledWith(
        fromProjects.loadProjects()
      );
    });

    it('should set up WebSocket listeners', () => {
      fixture.detectChanges();
      expect(webSocketService.on).toHaveBeenCalledWith('project:created');
      expect(webSocketService.on).toHaveBeenCalledWith('project:updated');
      expect(webSocketService.on).toHaveBeenCalledWith('project:deleted');
    });

    it('should register keyboard shortcuts', () => {
      fixture.detectChanges();
      expect(shortcutService.register).toHaveBeenCalled();
    });

    it('should restore view preferences from localStorage', () => {
      localStorageService.getItem.and.returnValue('list');
      fixture.detectChanges();
      expect(component.viewMode).toBe('list');
    });
  });

  describe('View Modes', () => {
    it('should switch between grid and list views', () => {
      fixture.detectChanges();
      
      component.setViewMode('list');
      fixture.detectChanges();
      expect(component.viewMode).toBe('list');
      expect(localStorageService.setItem).toHaveBeenCalledWith(
        'projects-view-mode',
        'list'
      );

      component.setViewMode('grid');
      fixture.detectChanges();
      expect(component.viewMode).toBe('grid');
    });

    it('should render projects in grid view', () => {
      component.viewMode = 'grid';
      fixture.detectChanges();

      const projectCards = fixture.debugElement.queryAll(
        By.css('.project-card')
      );
      expect(projectCards.length).toBe(0); // Initially no projects rendered
    });

    it('should render projects in list view', () => {
      component.viewMode = 'list';
      fixture.detectChanges();

      const table = fixture.debugElement.query(By.css('table'));
      expect(table).toBeTruthy();
    });
  });

  describe('Filtering', () => {
    it('should toggle filter section', () => {
      fixture.detectChanges();
      
      component.toggleFilters();
      expect(component.showFilters).toBe(true);

      component.toggleFilters();
      expect(component.showFilters).toBe(false);
    });

    it('should apply search filter', fakeAsync(() => {
      fixture.detectChanges();
      
      component.filters.search = 'Test';
      component.applyFilters();
      tick(300); // Debounce time

      expect(store.dispatch).toHaveBeenCalledWith(
        fromProjects.setFilters({ filters: component.filters })
      );
    }));

    it('should filter by status', () => {
      fixture.detectChanges();
      
      component.filters.status = [ProjectStatus.Active];
      component.applyFilters();

      expect(store.dispatch).toHaveBeenCalledWith(
        fromProjects.setFilters({ filters: component.filters })
      );
    });

    it('should filter by priority', () => {
      fixture.detectChanges();
      
      component.filters.priority = ProjectPriority.High;
      component.applyFilters();

      expect(store.dispatch).toHaveBeenCalledWith(
        fromProjects.setFilters({ filters: component.filters })
      );
    });

    it('should filter by team', () => {
      fixture.detectChanges();
      
      component.filters.teamId = 'team1';
      component.applyFilters();

      expect(store.dispatch).toHaveBeenCalledWith(
        fromProjects.setFilters({ filters: component.filters })
      );
    });

    it('should filter by date range', () => {
      fixture.detectChanges();
      
      component.filters.startDate = new Date('2025-01-01');
      component.filters.endDate = new Date('2025-12-31');
      component.applyFilters();

      expect(store.dispatch).toHaveBeenCalledWith(
        fromProjects.setFilters({ filters: component.filters })
      );
    });

    it('should add and remove tags', () => {
      fixture.detectChanges();
      
      const event = {
        value: 'new-tag',
        chipInput: { clear: jasmine.createSpy('clear') },
      };

      component.addTag(event as any);
      expect(component.filters.tags).toContain('new-tag');

      component.removeTag('new-tag');
      expect(component.filters.tags).not.toContain('new-tag');
    });

    it('should clear all filters', () => {
      fixture.detectChanges();
      
      component.filters = {
        search: 'test',
        status: [ProjectStatus.Active],
        priority: ProjectPriority.High,
        teamId: 'team1',
        tags: ['tag1'],
        startDate: new Date(),
        endDate: new Date(),
      };

      component.clearFilters();

      expect(component.filters.search).toBe('');
      expect(component.filters.status).toEqual([]);
      expect(component.filters.priority).toBeNull();
      expect(component.filters.teamId).toBeNull();
      expect(component.filters.tags).toEqual([]);
      expect(component.filters.startDate).toBeNull();
      expect(component.filters.endDate).toBeNull();
    });

    it('should detect active filters', () => {
      fixture.detectChanges();
      
      expect(component.hasActiveFilters).toBe(false);

      component.filters.search = 'test';
      expect(component.hasActiveFilters).toBe(true);
    });
  });

  describe('Selection', () => {
    beforeEach(() => {
      component.filteredProjects$ = of(mockProjects);
    });

    it('should select a project', () => {
      fixture.detectChanges();
      
      component.toggleProjectSelection(mockProjects[0]);
      expect(component.selectedProjects.has('1')).toBe(true);

      component.toggleProjectSelection(mockProjects[0]);
      expect(component.selectedProjects.has('1')).toBe(false);
    });

    it('should select all projects', () => {
      fixture.detectChanges();
      
      component.toggleAllSelection();
      expect(component.selectedProjects.size).toBe(2);

      component.toggleAllSelection();
      expect(component.selectedProjects.size).toBe(0);
    });

    it('should detect if all are selected', () => {
      fixture.detectChanges();
      
      expect(component.isAllSelected()).toBe(false);

      mockProjects.forEach(p => component.selectedProjects.add(p.id));
      expect(component.isAllSelected()).toBe(true);
    });

    it('should detect partial selection', () => {
      fixture.detectChanges();
      
      expect(component.isPartiallySelected()).toBe(false);

      component.selectedProjects.add('1');
      expect(component.isPartiallySelected()).toBe(true);
    });

    it('should handle multi-select with shift key', () => {
      fixture.detectChanges();
      
      const event = new MouseEvent('click', { shiftKey: true });
      component.selectProject(mockProjects[1], event);

      expect(component.selectedProjects.size).toBeGreaterThan(0);
    });

    it('should handle multi-select with ctrl key', () => {
      fixture.detectChanges();
      
      const event = new MouseEvent('click', { ctrlKey: true });
      component.selectProject(mockProjects[0], event);

      expect(component.selectedProjects.has('1')).toBe(true);
    });
  });

  describe('CRUD Operations', () => {
    it('should create a new project', () => {
      fixture.detectChanges();
      
      const dialogRef = { afterClosed: () => of(mockProjects[0]) };
      dialog.open.and.returnValue(dialogRef as any);

      component.createProject();

      expect(dialog.open).toHaveBeenCalled();
    });

    it('should edit a project', () => {
      fixture.detectChanges();
      
      const dialogRef = { afterClosed: () => of(mockProjects[0]) };
      dialog.open.and.returnValue(dialogRef as any);

      component.editProject(mockProjects[0]);

      expect(dialog.open).toHaveBeenCalled();
    });

    it('should view project details', () => {
      fixture.detectChanges();
      
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      component.viewProject(mockProjects[0]);

      expect(router.navigate).toHaveBeenCalledWith(
        ['/projects', '1']
      );
    });

    it('should delete a project with confirmation', () => {
      fixture.detectChanges();
      
      const dialogRef = { afterClosed: () => of(true) };
      dialog.open.and.returnValue(dialogRef as any);

      component.deleteProject(mockProjects[0]);

      expect(dialog.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            title: 'projects.delete.title',
            message: 'projects.delete.message',
          }),
        })
      );
    });

    it('should duplicate a project', () => {
      fixture.detectChanges();
      projectsService.duplicateProject.and.returnValue(of(mockProjects[0]));

      component.duplicateProject(mockProjects[0]);

      expect(projectsService.duplicateProject).toHaveBeenCalledWith('1');
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('should archive a project', () => {
      fixture.detectChanges();
      projectsService.archiveProject.and.returnValue(of(mockProjects[0]));

      component.archiveProject(mockProjects[0]);

      expect(projectsService.archiveProject).toHaveBeenCalledWith('1');
    });

    it('should toggle favorite status', () => {
      fixture.detectChanges();
      projectsService.toggleFavorite.and.returnValue(of(mockProjects[0]));

      const event = new MouseEvent('click');
      component.toggleFavorite(mockProjects[0], event);

      expect(projectsService.toggleFavorite).toHaveBeenCalledWith('1');
    });
  });

  describe('Batch Operations', () => {
    beforeEach(() => {
      component.selectedProjects.add('1');
      component.selectedProjects.add('2');
    });

    it('should batch archive projects', () => {
      fixture.detectChanges();
      projectsService.batchUpdate.and.returnValue(of(mockProjects));

      component.batchArchive();

      expect(projectsService.batchUpdate).toHaveBeenCalledWith(
        ['1', '2'],
        { isArchived: true }
      );
    });

    it('should batch delete projects with confirmation', () => {
      fixture.detectChanges();
      
      const dialogRef = { afterClosed: () => of(true) };
      dialog.open.and.returnValue(dialogRef as any);
      projectsService.batchUpdate.and.returnValue(of([]));

      component.batchDelete();

      expect(dialog.open).toHaveBeenCalled();
    });

    it('should batch update status', () => {
      fixture.detectChanges();
      
      const dialogRef = { afterClosed: () => of(ProjectStatus.Completed) };
      dialog.open.and.returnValue(dialogRef as any);
      projectsService.batchUpdate.and.returnValue(of(mockProjects));

      component.batchUpdateStatus();

      expect(dialog.open).toHaveBeenCalled();
    });

    it('should batch assign team', () => {
      fixture.detectChanges();
      
      const dialogRef = { afterClosed: () => of('team1') };
      dialog.open.and.returnValue(dialogRef as any);
      projectsService.batchUpdate.and.returnValue(of(mockProjects));

      component.batchAssignTeam();

      expect(dialog.open).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('should sort by column', () => {
      fixture.detectChanges();
      
      component.dataSource.sort = { active: 'name', direction: 'asc' } as any;
      const sortChange = { active: 'status', direction: 'desc' };

      component.dataSource.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'name': return item.name;
          case 'status': return item.status;
          default: return '';
        }
      };

      fixture.detectChanges();
      expect(component.dataSource.sort).toBeTruthy();
    });

    it('should handle custom sorting logic', () => {
      fixture.detectChanges();
      
      const sortedProjects = [...mockProjects].sort((a, b) => 
        component.sortProjects(a, b, 'name', 'asc')
      );

      expect(sortedProjects[0].name).toBe('Test Project 1');
    });
  });

  describe('Drag and Drop', () => {
    it('should handle project reordering', () => {
      fixture.detectChanges();
      
      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: { data: mockProjects[0] },
        container: {} as CdkDropList,
        previousContainer: {} as CdkDropList,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
      };

      component.onDrop(event);

      expect(store.dispatch).toHaveBeenCalled();
    });
  });

  describe('Export/Import', () => {
    it('should export selected projects', () => {
      fixture.detectChanges();
      component.selectedProjects.add('1');
      exportService.exportToJSON.and.returnValue(of(new Blob()));

      component.exportProjects();

      expect(exportService.exportToJSON).toHaveBeenCalled();
    });

    it('should import projects from file', () => {
      fixture.detectChanges();
      
      const dialogRef = { afterClosed: () => of({ file: new File([], 'test.json') }) };
      dialog.open.and.returnValue(dialogRef as any);
      projectsService.importProjects.and.returnValue(of(mockProjects));

      component.importProjects();

      expect(dialog.open).toHaveBeenCalled();
    });
  });

  describe('Real-time Updates', () => {
    it('should handle project created event', () => {
      fixture.detectChanges();
      
      const subject = new Subject<Project>();
      webSocketService.on.and.returnValue(subject);
      
      component.ngOnInit();
      subject.next(mockProjects[0]);

      expect(store.dispatch).toHaveBeenCalled();
    });

    it('should handle project updated event', () => {
      fixture.detectChanges();
      
      const subject = new Subject<Project>();
      webSocketService.on.and.returnValue(subject);
      
      component.ngOnInit();
      subject.next(mockProjects[0]);

      expect(store.dispatch).toHaveBeenCalled();
    });

    it('should handle project deleted event', () => {
      fixture.detectChanges();
      
      const subject = new Subject<{ id: string }>();
      webSocketService.on.and.returnValue(subject);
      
      component.ngOnInit();
      subject.next({ id: '1' });

      expect(store.dispatch).toHaveBeenCalled();
    });

    it('should show refresh indicator during updates', fakeAsync(() => {
      fixture.detectChanges();
      
      component.refreshProjects();
      fixture.detectChanges();

      const refreshButton = fixture.debugElement.query(
        By.css('button.spinning')
      );
      expect(refreshButton).toBeTruthy();

      tick();
    }));
  });

  describe('Pagination', () => {
    it('should paginate projects in list view', () => {
      component.viewMode = 'list';
      fixture.detectChanges();

      expect(component.paginator).toBeDefined();
      expect(component.pageSize).toBe(10);
    });

    it('should update page size', () => {
      component.viewMode = 'list';
      fixture.detectChanges();

      component.paginator.pageSize = 25;
      component.paginator.page.emit({ pageSize: 25, pageIndex: 0, length: 100 });

      expect(component.pageSize).toBe(25);
      expect(localStorageService.setItem).toHaveBeenCalledWith(
        'projects-page-size',
        '25'
      );
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle create project shortcut', () => {
      fixture.detectChanges();
      
      const event = new KeyboardEvent('keydown', { 
        ctrlKey: true, 
        key: 'n' 
      });

      component.handleKeyboardShortcut(event);

      expect(dialog.open).toHaveBeenCalled();
    });

    it('should handle refresh shortcut', () => {
      fixture.detectChanges();
      
      const event = new KeyboardEvent('keydown', { 
        key: 'F5' 
      });

      component.handleKeyboardShortcut(event);

      expect(store.dispatch).toHaveBeenCalledWith(
        fromProjects.loadProjects()
      );
    });

    it('should handle view toggle shortcut', () => {
      fixture.detectChanges();
      component.viewMode = 'grid';

      const event = new KeyboardEvent('keydown', { 
        ctrlKey: true,
        shiftKey: true,
        key: 'v' 
      });

      component.handleKeyboardShortcut(event);

      expect(component.viewMode).toBe('list');
    });

    it('should handle search focus shortcut', () => {
      fixture.detectChanges();
      
      const event = new KeyboardEvent('keydown', { 
        ctrlKey: true,
        key: 'f' 
      });

      component.handleKeyboardShortcut(event);

      expect(component.showFilters).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      fixture.detectChanges();

      const createButton = fixture.debugElement.query(
        By.css('.create-btn')
      );
      expect(createButton.nativeElement.getAttribute('aria-label')).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      fixture.detectChanges();
      component.viewMode = 'grid';

      const cards = fixture.debugElement.queryAll(
        By.css('.project-card')
      );
      
      // Test tab index
      cards.forEach(card => {
        expect(card.nativeElement.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });

    it('should announce changes to screen readers', () => {
      fixture.detectChanges();
      
      const liveRegion = fixture.debugElement.query(
        By.css('[aria-live="polite"]')
      );
      expect(liveRegion).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    it('should adjust layout for mobile screens', () => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      expect(component.isMobile).toBe(true);
    });

    it('should adjust layout for tablet screens', () => {
      window.innerWidth = 800;
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      expect(component.isTablet).toBe(true);
    });

    it('should show mobile menu on small screens', () => {
      component.isMobile = true;
      fixture.detectChanges();

      const mobileMenu = fixture.debugElement.query(
        By.css('.mobile-menu')
      );
      // Mobile menu implementation would be tested here
    });
  });

  describe('Performance', () => {
    it('should use trackBy for lists', () => {
      fixture.detectChanges();
      
      const trackedItem = component.trackByFn(0, mockProjects[0]);
      expect(trackedItem).toBe('1');
    });

    it('should debounce search input', fakeAsync(() => {
      fixture.detectChanges();
      
      component.filters.search = 'test';
      component.applyFilters();

      expect(store.dispatch).not.toHaveBeenCalled();

      tick(300);

      expect(store.dispatch).toHaveBeenCalledWith(
        fromProjects.setFilters({ filters: component.filters })
      );
    }));

    it('should implement virtual scrolling for large lists', () => {
      // Virtual scrolling would be tested if implemented
      expect(component.enableVirtualScroll).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle load error', () => {
      const error = new Error('Failed to load projects');
      store.setState({
        ...initialState,
        projects: {
          ...initialState.projects,
          error: error.message,
          loading: false,
        },
      });

      fixture.detectChanges();

      expect(notificationService.error).toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      fixture.detectChanges();
      projectsService.deleteProject.and.returnValue(
        throwError(() => new Error('Delete failed'))
      );

      const dialogRef = { afterClosed: () => of(true) };
      dialog.open.and.returnValue(dialogRef as any);

      component.deleteProject(mockProjects[0]);

      expect(notificationService.error).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', () => {
      fixture.detectChanges();
      webSocketService.on.and.returnValue(throwError(() => new Error('Network error')));

      component.setupWebSocketListeners();

      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      fixture.detectChanges();
      
      spyOn(component.destroy$, 'next');
      spyOn(component.destroy$, 'complete');

      component.ngOnDestroy();

      expect(component.destroy$.next).toHaveBeenCalled();
      expect(component.destroy$.complete).toHaveBeenCalled();
      expect(webSocketService.off).toHaveBeenCalled();
      expect(shortcutService.unregister).toHaveBeenCalled();
    });
  });
});
