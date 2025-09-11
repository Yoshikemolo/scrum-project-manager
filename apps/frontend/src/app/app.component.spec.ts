/**
 * Unit tests for AppComponent
 * Tests the root component functionality including:
 * - Component initialization
 * - Theme management
 * - Responsive behavior
 * - Sidebar toggle
 * - Service worker updates
 * - Keyboard shortcuts
 * - Accessibility features
 */

import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatProgressBarHarness } from '@angular/material/progress-bar/testing';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { OverlayContainer } from '@angular/cdk/overlay';
import { SwUpdate } from '@angular/service-worker';
import { of, Subject, BehaviorSubject } from 'rxjs';

import { AppComponent } from './app.component';
import { ThemeService } from './core/services/theme.service';
import { LoadingService } from './core/services/loading.service';
import { NotificationService } from './core/services/notification.service';
import { ShortcutService } from './core/services/shortcut.service';
import { NetworkService } from './core/services/network.service';
import { LocaleService } from './core/services/locale.service';
import { AccessibilityService } from './core/services/accessibility.service';

// Mock services
class MockThemeService {
  currentTheme = new BehaviorSubject<'light' | 'dark' | 'auto'>('light');
  toggleTheme = jasmine.createSpy('toggleTheme');
}

class MockLoadingService {
  isLoading = new BehaviorSubject<boolean>(false);
  startLoading = jasmine.createSpy('startLoading');
  stopLoading = jasmine.createSpy('stopLoading');
}

class MockNotificationService {
  info = jasmine.createSpy('info');
  success = jasmine.createSpy('success');
  warning = jasmine.createSpy('warning');
  error = jasmine.createSpy('error');
}

class MockShortcutService {
  register = jasmine.createSpy('register');
  unregister = jasmine.createSpy('unregister');
}

class MockNetworkService {
  isOnline = new BehaviorSubject<boolean>(true);
  statusChanges = new Subject<boolean>();
}

class MockLocaleService {
  currentLocale = new BehaviorSubject<string>('en-US');
  setLocale = jasmine.createSpy('setLocale');
}

class MockAccessibilityService {
  initialize = jasmine.createSpy('initialize');
  announceMessage = jasmine.createSpy('announceMessage');
}

class MockSwUpdate {
  isEnabled = true;
  versionUpdates = new Subject();
  checkForUpdate = jasmine.createSpy('checkForUpdate').and.returnValue(Promise.resolve());
}

class MockBreakpointObserver {
  private subject = new BehaviorSubject({ matches: false, breakpoints: {} });
  
  observe = jasmine.createSpy('observe').and.returnValue(this.subject.asObservable());
  
  setBreakpoint(breakpoint: string, matches: boolean): void {
    const current = this.subject.value;
    current.breakpoints[breakpoint] = matches;
    current.matches = matches;
    this.subject.next(current);
  }
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let loader: HarnessLoader;
  let mockThemeService: MockThemeService;
  let mockLoadingService: MockLoadingService;
  let mockNotificationService: MockNotificationService;
  let mockShortcutService: MockShortcutService;
  let mockNetworkService: MockNetworkService;
  let mockBreakpointObserver: MockBreakpointObserver;
  let mockSwUpdate: MockSwUpdate;
  let overlayContainer: OverlayContainer;

  beforeEach(async () => {
    // Create mock instances
    mockThemeService = new MockThemeService();
    mockLoadingService = new MockLoadingService();
    mockNotificationService = new MockNotificationService();
    mockShortcutService = new MockShortcutService();
    mockNetworkService = new MockNetworkService();
    mockBreakpointObserver = new MockBreakpointObserver();
    mockSwUpdate = new MockSwUpdate();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideAnimations(),
        { provide: ThemeService, useValue: mockThemeService },
        { provide: LoadingService, useValue: mockLoadingService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ShortcutService, useValue: mockShortcutService },
        { provide: NetworkService, useValue: mockNetworkService },
        { provide: LocaleService, useValue: new MockLocaleService() },
        { provide: AccessibilityService, useValue: new MockAccessibilityService() },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
        { provide: SwUpdate, useValue: mockSwUpdate },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    overlayContainer = TestBed.inject(OverlayContainer);
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  // =============================================
  // COMPONENT INITIALIZATION TESTS
  // =============================================

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct title', () => {
    expect(component.title).toBe('SCRUM Project Manager');
  });

  it('should initialize with sidebar expanded on desktop', () => {
    mockBreakpointObserver.setBreakpoint(Breakpoints.Large, true);
    fixture.detectChanges();
    expect(component.sidebarExpanded()).toBe(true);
  });

  it('should initialize with sidebar collapsed on mobile', fakeAsync(() => {
    mockBreakpointObserver.setBreakpoint(Breakpoints.XSmall, true);
    fixture.detectChanges();
    tick();
    expect(component.sidebarExpanded()).toBe(false);
  }));

  // =============================================
  // THEME MANAGEMENT TESTS
  // =============================================

  it('should apply light theme', fakeAsync(() => {
    mockThemeService.currentTheme.next('light');
    fixture.detectChanges();
    tick();
    
    expect(document.body.classList.contains('light-theme')).toBe(true);
    expect(document.body.classList.contains('dark-theme')).toBe(false);
  }));

  it('should apply dark theme', fakeAsync(() => {
    mockThemeService.currentTheme.next('dark');
    fixture.detectChanges();
    tick();
    
    expect(document.body.classList.contains('dark-theme')).toBe(true);
    expect(document.body.classList.contains('light-theme')).toBe(false);
  }));

  it('should toggle theme when shortcut is pressed', () => {
    fixture.detectChanges();
    const shortcutCall = mockShortcutService.register.calls.all()
      .find(call => call.args[0] === 'ctrl+shift+t,cmd+shift+t');
    
    expect(shortcutCall).toBeDefined();
    
    // Execute the shortcut callback
    shortcutCall.args[2]();
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });

  // =============================================
  // RESPONSIVE BEHAVIOR TESTS
  // =============================================

  it('should detect mobile view', fakeAsync(() => {
    mockBreakpointObserver.setBreakpoint(Breakpoints.XSmall, true);
    fixture.detectChanges();
    tick();
    
    expect(component.isMobile()).toBe(true);
    expect(component.isTablet()).toBe(false);
    expect(component.isDesktop()).toBe(false);
    expect(component.layoutClass()).toBe('layout-mobile');
  }));

  it('should detect tablet view', fakeAsync(() => {
    mockBreakpointObserver.setBreakpoint(Breakpoints.Small, true);
    fixture.detectChanges();
    tick();
    
    expect(component.isMobile()).toBe(false);
    expect(component.isTablet()).toBe(true);
    expect(component.isDesktop()).toBe(false);
    expect(component.layoutClass()).toBe('layout-tablet');
  }));

  it('should detect desktop view', fakeAsync(() => {
    mockBreakpointObserver.setBreakpoint(Breakpoints.Large, true);
    fixture.detectChanges();
    tick();
    
    expect(component.isMobile()).toBe(false);
    expect(component.isTablet()).toBe(false);
    expect(component.isDesktop()).toBe(true);
    expect(component.layoutClass()).toBe('layout-desktop');
  }));

  // =============================================
  // SIDEBAR TESTS
  // =============================================

  it('should toggle sidebar', () => {
    component.sidebarExpanded.set(true);
    component.toggleSidebar();
    expect(component.sidebarExpanded()).toBe(false);
    
    component.toggleSidebar();
    expect(component.sidebarExpanded()).toBe(true);
  });

  it('should use overlay mode for sidebar on mobile', fakeAsync(() => {
    mockBreakpointObserver.setBreakpoint(Breakpoints.XSmall, true);
    fixture.detectChanges();
    tick();
    
    expect(component.sidebarMode()).toBe('over');
  }));

  it('should use side mode for sidebar on desktop', fakeAsync(() => {
    mockBreakpointObserver.setBreakpoint(Breakpoints.Large, true);
    fixture.detectChanges();
    tick();
    
    expect(component.sidebarMode()).toBe('side');
  }));

  // =============================================
  // LOADING STATE TESTS
  // =============================================

  it('should show loading bar when loading', async () => {
    mockLoadingService.isLoading.next(true);
    fixture.detectChanges();
    
    const progressBar = await loader.getHarness(MatProgressBarHarness);
    expect(progressBar).toBeTruthy();
  });

  it('should hide loading bar when not loading', async () => {
    mockLoadingService.isLoading.next(false);
    fixture.detectChanges();
    
    const progressBars = await loader.getAllHarnesses(MatProgressBarHarness);
    expect(progressBars.length).toBe(0);
  });

  // =============================================
  // NETWORK STATUS TESTS
  // =============================================

  it('should show offline indicator when offline', () => {
    mockNetworkService.isOnline.next(false);
    fixture.detectChanges();
    
    const offlineIndicator = fixture.nativeElement.querySelector('.offline-indicator');
    expect(offlineIndicator).toBeTruthy();
    expect(offlineIndicator.textContent).toContain('You are currently offline');
  });

  it('should hide offline indicator when online', () => {
    mockNetworkService.isOnline.next(true);
    fixture.detectChanges();
    
    const offlineIndicator = fixture.nativeElement.querySelector('.offline-indicator');
    expect(offlineIndicator).toBeFalsy();
  });

  it('should show notification when connection is restored', fakeAsync(() => {
    fixture.detectChanges();
    mockNetworkService.statusChanges.next(true);
    tick();
    
    expect(mockNotificationService.success).toHaveBeenCalledWith(
      'Connection restored',
      'You are back online'
    );
  }));

  it('should show notification when connection is lost', fakeAsync(() => {
    fixture.detectChanges();
    mockNetworkService.statusChanges.next(false);
    tick();
    
    expect(mockNotificationService.warning).toHaveBeenCalledWith(
      'Connection lost',
      'You are currently offline. Some features may be limited.'
    );
  }));

  // =============================================
  // SERVICE WORKER TESTS
  // =============================================

  it('should check for service worker updates', fakeAsync(() => {
    fixture.detectChanges();
    tick(30000); // Wait for interval
    
    expect(mockSwUpdate.checkForUpdate).toHaveBeenCalled();
  }));

  it('should notify user when new version is available', fakeAsync(() => {
    fixture.detectChanges();
    
    mockSwUpdate.versionUpdates.next({ type: 'VERSION_READY' });
    tick();
    
    expect(mockNotificationService.info).toHaveBeenCalledWith(
      'New version available',
      jasmine.any(String),
      jasmine.objectContaining({
        duration: 0,
        actions: jasmine.any(Array)
      })
    );
  }));

  // =============================================
  // KEYBOARD SHORTCUTS TESTS
  // =============================================

  it('should register keyboard shortcuts', () => {
    fixture.detectChanges();
    
    // Check if all shortcuts are registered
    const shortcuts = [
      'ctrl+k,cmd+k',
      'ctrl+b,cmd+b',
      'ctrl+/,cmd+/',
      'ctrl+shift+t,cmd+shift+t',
      'alt+1'
    ];
    
    shortcuts.forEach(shortcut => {
      const call = mockShortcutService.register.calls.all()
        .find(c => c.args[0] === shortcut);
      expect(call).toBeDefined();
    });
  });

  it('should open global search on shortcut', () => {
    const spy = spyOn(document, 'dispatchEvent');
    fixture.detectChanges();
    
    const shortcutCall = mockShortcutService.register.calls.all()
      .find(call => call.args[0] === 'ctrl+k,cmd+k');
    
    shortcutCall.args[2]();
    
    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: 'open-global-search' })
    );
  });

  // =============================================
  // TOUCH DEVICE TESTS
  // =============================================

  it('should detect touch device', () => {
    // Mock touch support
    Object.defineProperty(window, 'ontouchstart', {
      value: () => {},
      writable: true
    });
    
    const newComponent = new AppComponent();
    TestBed.runInInjectionContext(() => {
      newComponent.ngOnInit();
    });
    
    expect(newComponent.isTouchDevice()).toBe(true);
    expect(document.documentElement.classList.contains('touch-device')).toBe(true);
  });

  // =============================================
  // ACCESSIBILITY TESTS
  // =============================================

  it('should have skip links for accessibility', () => {
    fixture.detectChanges();
    
    const skipLinks = fixture.nativeElement.querySelectorAll('.skip-link');
    expect(skipLinks.length).toBe(2);
    expect(skipLinks[0].textContent).toContain('Skip to main content');
    expect(skipLinks[1].textContent).toContain('Skip to navigation');
  });

  it('should have proper ARIA labels', () => {
    fixture.detectChanges();
    
    const mainContent = fixture.nativeElement.querySelector('#main-content');
    expect(mainContent.getAttribute('role')).toBe('main');
    expect(mainContent.getAttribute('aria-label')).toBe('Main content');
    
    const navigation = fixture.nativeElement.querySelector('#main-navigation');
    expect(navigation.getAttribute('role')).toBe('navigation');
    expect(navigation.getAttribute('aria-label')).toBe('Main navigation');
  });

  // =============================================
  // COMPONENT CLEANUP TESTS
  // =============================================

  it('should clean up on destroy', () => {
    const spy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    
    fixture.destroy();
    
    expect(spy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // =============================================
  // PERFORMANCE TESTS
  // =============================================

  it('should monitor performance if supported', () => {
    if ('PerformanceObserver' in window) {
      const spy = spyOn(window, 'PerformanceObserver');
      fixture.detectChanges();
      expect(spy).toHaveBeenCalled();
    }
  });

  // =============================================
  // VISIBILITY CHANGE TESTS
  // =============================================

  it('should handle visibility change', fakeAsync(() => {
    fixture.detectChanges();
    
    // Simulate page becoming hidden
    Object.defineProperty(document, 'hidden', {
      value: true,
      writable: true
    });
    
    document.dispatchEvent(new Event('visibilitychange'));
    tick();
    
    // Should pause operations (check console log in actual implementation)
    
    // Simulate page becoming visible
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true
    });
    
    document.dispatchEvent(new Event('visibilitychange'));
    tick();
    
    // Should check for updates
    expect(mockSwUpdate.checkForUpdate).toHaveBeenCalled();
  }));
});
