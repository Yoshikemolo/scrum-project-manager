import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { ThemeService } from '../../core/services/theme.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ShortcutService } from '../../core/services/shortcut.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let store: MockStore;
  let router: Router;
  let themeService: jasmine.SpyObj<ThemeService>;
  let wsService: jasmine.SpyObj<WebSocketService>;
  let shortcutService: jasmine.SpyObj<ShortcutService>;
  let translateService: jasmine.SpyObj<TranslateService>;
  let breakpointObserver: jasmine.SpyObj<BreakpointObserver>;

  const initialState = {
    auth: {
      user: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      },
      isAuthenticated: true
    }
  };

  beforeEach(async () => {
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['isDarkTheme']);
    const wsServiceSpy = jasmine.createSpyObj('WebSocketService', ['connect', 'disconnect', 'on', 'emit']);
    const shortcutServiceSpy = jasmine.createSpyObj('ShortcutService', ['add', 'remove']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    const breakpointObserverSpy = jasmine.createSpyObj('BreakpointObserver', ['observe']);

    themeServiceSpy.isDarkTheme.and.returnValue(false);
    wsServiceSpy.on.and.returnValue(of({}));
    translateServiceSpy.instant.and.returnValue('translated text');
    breakpointObserverSpy.observe.and.returnValue(of({ matches: false, breakpoints: {} }));

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        BrowserAnimationsModule,
        DragDropModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideMockStore({ initialState }),
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: WebSocketService, useValue: wsServiceSpy },
        { provide: ShortcutService, useValue: shortcutServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: BreakpointObserver, useValue: breakpointObserverSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    wsService = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;
    shortcutService = TestBed.inject(ShortcutService) as jasmine.SpyObj<ShortcutService>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
    breakpointObserver = TestBed.inject(BreakpointObserver) as jasmine.SpyObj<BreakpointObserver>;

    spyOn(router, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should set up WebSocket connection on init', () => {
      fixture.detectChanges();
      expect(wsService.connect).toHaveBeenCalled();
    });

    it('should set up keyboard shortcuts on init', () => {
      fixture.detectChanges();
      expect(shortcutService.add).toHaveBeenCalledWith('ctrl+r', jasmine.any(Function));
      expect(shortcutService.add).toHaveBeenCalledWith('ctrl+e', jasmine.any(Function));
      expect(shortcutService.add).toHaveBeenCalledWith('ctrl+shift+f', jasmine.any(Function));
    });

    it('should initialize KPI values', fakeAsync(() => {
      fixture.detectChanges();
      tick(1500);
      
      expect(component.totalProjects()).toBe(12);
      expect(component.activeSprints()).toBe(3);
      expect(component.completedTasks()).toBe(156);
      expect(component.teamMembers()).toBe(24);
      expect(component.velocity()).toBe(42);
      expect(component.bugCount()).toBe(8);
      expect(component.codeReviews()).toBe(15);
      expect(component.deployments()).toBe(4);
    }));

    it('should set loading to false after initialization', fakeAsync(() => {
      fixture.detectChanges();
      expect(component.isLoading()).toBe(true);
      
      tick(1500);
      expect(component.isLoading()).toBe(false);
    }));
  });

  describe('Period Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should default to month period', () => {
      expect(component.selectedPeriod()).toBe('month');
    });

    it('should change period and refresh dashboard', () => {
      spyOn(component, 'refreshDashboard');
      
      component.onPeriodChange('week');
      expect(component.selectedPeriod()).toBe('week');
      expect(component.refreshDashboard).toHaveBeenCalled();
    });

    it('should handle keyboard shortcuts for period changes', () => {
      // Get the callback functions from shortcut service calls
      const calls = shortcutService.add.calls.all();
      const weekShortcut = calls.find(c => c.args[0] === 'alt+1')?.args[1];
      const monthShortcut = calls.find(c => c.args[0] === 'alt+2')?.args[1];
      const quarterShortcut = calls.find(c => c.args[0] === 'alt+3')?.args[1];
      const yearShortcut = calls.find(c => c.args[0] === 'alt+4')?.args[1];
      
      weekShortcut();
      expect(component.selectedPeriod()).toBe('week');
      
      monthShortcut();
      expect(component.selectedPeriod()).toBe('month');
      
      quarterShortcut();
      expect(component.selectedPeriod()).toBe('quarter');
      
      yearShortcut();
      expect(component.selectedPeriod()).toBe('year');
    });
  });

  describe('Responsive Layout', () => {
    it('should detect mobile breakpoint', () => {
      breakpointObserver.observe.and.returnValue(of({
        matches: true,
        breakpoints: { '(max-width: 599.98px)': true }
      }));
      
      fixture.detectChanges();
      expect(component.isMobile()).toBe(true);
      expect(component.gridCols()).toBe(1);
    });

    it('should detect tablet breakpoint', () => {
      breakpointObserver.observe.and.returnValue(of({
        matches: true,
        breakpoints: { '(min-width: 600px) and (max-width: 959.98px)': true }
      }));
      
      fixture.detectChanges();
      expect(component.isTablet()).toBe(true);
      expect(component.gridCols()).toBe(2);
    });

    it('should detect desktop breakpoint', () => {
      breakpointObserver.observe.and.returnValue(of({
        matches: true,
        breakpoints: { '(min-width: 960px)': true }
      }));
      
      fixture.detectChanges();
      expect(component.isDesktop()).toBe(true);
      expect(component.gridCols()).toBe(4);
    });
  });

  describe('KPI Metrics', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should calculate completion rate correctly', () => {
      component.completedTasks.set(156);
      component.bugCount.set(8);
      
      expect(component.completionRate()).toBe(95);
    });

    it('should calculate sprint progress', () => {
      // Sprint progress is hardcoded to 50% in the component for demo
      expect(component.sprintProgress()).toBe(50);
    });

    it('should get correct trend icon', () => {
      expect(component.getTrendIcon(10, 5)).toBe('trending_up');
      expect(component.getTrendIcon(5, 10)).toBe('trending_down');
      expect(component.getTrendIcon(10, 10)).toBe('trending_flat');
    });

    it('should get correct trend color', () => {
      expect(component.getTrendColor(10, 5, false)).toBe('primary');
      expect(component.getTrendColor(5, 10, false)).toBe('warn');
      expect(component.getTrendColor(10, 5, true)).toBe('warn');
      expect(component.getTrendColor(5, 10, true)).toBe('primary');
    });
  });

  describe('Auto Refresh', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle auto refresh', () => {
      expect(component.autoRefresh()).toBe(true);
      
      component.toggleAutoRefresh();
      expect(component.autoRefresh()).toBe(false);
      
      component.toggleAutoRefresh();
      expect(component.autoRefresh()).toBe(true);
    });

    it('should refresh dashboard', fakeAsync(() => {
      component.refreshDashboard();
      expect(component.isLoading()).toBe(true);
      
      tick(1000);
      expect(component.isLoading()).toBe(false);
    }));
  });

  describe('Widget Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize with default widgets', () => {
      const widgets = component.widgets();
      expect(widgets.length).toBe(7);
      expect(widgets.every(w => w.enabled)).toBe(true);
    });

    it('should toggle widget visibility', () => {
      component.toggleWidget('velocity');
      
      const velocityWidget = component.widgets().find(w => w.id === 'velocity');
      expect(velocityWidget?.enabled).toBe(false);
      
      component.toggleWidget('velocity');
      expect(component.widgets().find(w => w.id === 'velocity')?.enabled).toBe(true);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to projects detail', () => {
      component.navigateToDetail('projects');
      expect(router.navigate).toHaveBeenCalledWith(['/projects']);
    });

    it('should navigate to sprints detail', () => {
      component.navigateToDetail('sprints');
      expect(router.navigate).toHaveBeenCalledWith(['/sprints']);
    });

    it('should navigate to tasks detail', () => {
      component.navigateToDetail('tasks');
      expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
    });

    it('should navigate to team detail', () => {
      component.navigateToDetail('team');
      expect(router.navigate).toHaveBeenCalledWith(['/team']);
    });
  });

  describe('Export Functionality', () => {
    it('should export dashboard data', () => {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');
      const linkSpy = jasmine.createSpyObj('a', ['click']);
      spyOn(document, 'createElement').and.returnValue(linkSpy);
      
      component.exportDashboard();
      
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(linkSpy.download).toContain('dashboard_month_');
      expect(linkSpy.click).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Time Formatting', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format relative time correctly', () => {
      const now = new Date();
      
      // Just now
      expect(component.formatRelativeTime(now)).toBe('translated text');
      
      // Minutes ago
      const minutesAgo = new Date(now.getTime() - 5 * 60000);
      component.formatRelativeTime(minutesAgo);
      expect(translateService.instant).toHaveBeenCalledWith(
        'dashboard.time.minutesAgo',
        { count: 5 }
      );
      
      // Hours ago
      const hoursAgo = new Date(now.getTime() - 2 * 3600000);
      component.formatRelativeTime(hoursAgo);
      expect(translateService.instant).toHaveBeenCalledWith(
        'dashboard.time.hoursAgo',
        { count: 2 }
      );
      
      // Days ago
      const daysAgo = new Date(now.getTime() - 3 * 86400000);
      component.formatRelativeTime(daysAgo);
      expect(translateService.instant).toHaveBeenCalledWith(
        'dashboard.time.daysAgo',
        { count: 3 }
      );
    });
  });

  describe('WebSocket Updates', () => {
    it('should set up WebSocket listeners', () => {
      fixture.detectChanges();
      
      expect(wsService.on).toHaveBeenCalledWith('dashboard:update');
      expect(wsService.on).toHaveBeenCalledWith('sprint:update');
      expect(wsService.on).toHaveBeenCalledWith('task:update');
    });
  });

  describe('Cleanup', () => {
    it('should clean up on destroy', () => {
      fixture.detectChanges();
      
      component.ngOnDestroy();
      
      expect(wsService.disconnect).toHaveBeenCalled();
      expect(shortcutService.remove).toHaveBeenCalledWith('ctrl+r');
      expect(shortcutService.remove).toHaveBeenCalledWith('ctrl+e');
      expect(shortcutService.remove).toHaveBeenCalledWith('ctrl+shift+f');
    });
  });
});
