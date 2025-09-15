/**
 * Unit tests for SidebarComponent
 * 
 * Tests cover functionality including navigation, permissions, collapsible behavior,
 * search functionality, theme switching, and accessibility features.
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, NavigationEnd } from '@angular/router';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { signal, WritableSignal } from '@angular/core';
import { of, Subject } from 'rxjs';

import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let loader: HarnessLoader;
  let router: Router;
  let authService: jasmine.SpyObj<AuthService>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let translateService: jasmine.SpyObj<TranslateService>;
  let routerEventsSubject: Subject<any>;

  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'avatar.jpg',
    role: 'Admin',
    permissions: ['settings.view', 'admin.access']
  };

  beforeEach(async () => {
    routerEventsSubject = new Subject();
    
    authService = jasmine.createSpyObj('AuthService', 
      ['hasPermission', 'hasAnyPermission', 'logout'],
      { 
        currentUser: signal(mockUser),
        isAuthenticated: signal(true)
      }
    );
    
    themeService = jasmine.createSpyObj('ThemeService', 
      ['toggleTheme'],
      { 
        isDarkTheme: signal(false),
        currentTheme: signal('light')
      }
    );
    
    translateService = jasmine.createSpyObj('TranslateService', 
      ['instant', 'get'],
      { currentLang: 'en' }
    );
    
    translateService.instant.and.returnValue('translated');
    translateService.get.and.returnValue(of('translated'));
    authService.hasPermission.and.returnValue(true);
    authService.hasAnyPermission.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [
        SidebarComponent,
        NoopAnimationsModule,
        RouterTestingModule,
        FormsModule,
        MatListModule,
        MatIconModule,
        MatTooltipModule,
        MatRippleModule,
        MatDividerModule,
        MatExpansionModule,
        MatMenuModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ThemeService, useValue: themeService },
        { provide: TranslateService, useValue: translateService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    Object.defineProperty(router, 'events', {
      get: () => routerEventsSubject.asObservable()
    });
    Object.defineProperty(router, 'url', {
      get: () => '/dashboard'
    });

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.isCollapsed).toBe(false);
      expect(component.mode).toBe('side');
      expect(component.isMobile).toBe(false);
      expect(component.expanded).toBe(true);
      expect(component.searchQuery).toBe('');
    });

    it('should load menu items', () => {
      expect(component.menuItems.length).toBeGreaterThan(0);
      expect(component.filteredMenuItems).toEqual(component.menuItems);
    });

    it('should setup user data', () => {
      expect(component.currentUser()).toEqual(mockUser);
    });

    it('should setup theme', () => {
      expect(component.isDarkTheme()).toBe(false);
    });
  });

  describe('Collapse/Expand Behavior', () => {
    it('should emit toggleCollapse event', () => {
      spyOn(component.toggleCollapse, 'emit');
      const toggleBtn = fixture.debugElement.query(
        By.css('.collapse-toggle')
      );
      
      toggleBtn.nativeElement.click();
      
      expect(component.toggleCollapse.emit).toHaveBeenCalled();
    });

    it('should apply collapsed class when collapsed', () => {
      component.isCollapsed = false;
      fixture.detectChanges();
      let sidebar = fixture.debugElement.query(By.css('.sidebar'));
      expect(sidebar.classes['collapsed']).toBeFalsy();
      
      component.isCollapsed = true;
      fixture.detectChanges();
      sidebar = fixture.debugElement.query(By.css('.sidebar'));
      expect(sidebar.classes['collapsed']).toBeTruthy();
    });

    it('should show tooltips when collapsed', () => {
      component.isCollapsed = true;
      fixture.detectChanges();
      
      const menuItems = fixture.debugElement.queryAll(
        By.css('.menu-item')
      );
      const firstItem = menuItems[0];
      expect(firstItem.attributes['matTooltip']).toBeTruthy();
    });

    it('should hide labels when collapsed', () => {
      component.isCollapsed = false;
      fixture.detectChanges();
      let labels = fixture.debugElement.queryAll(By.css('.menu-label'));
      expect(labels.length).toBeGreaterThan(0);
      
      component.isCollapsed = true;
      fixture.detectChanges();
      labels = fixture.debugElement.queryAll(By.css('.menu-label'));
      labels.forEach(label => {
        expect(label.nativeElement.offsetParent).toBeNull();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to home when logo clicked', () => {
      const logo = fixture.debugElement.query(
        By.css('.logo-container')
      );
      
      logo.nativeElement.click();
      
      expect(router.navigate).toHaveBeenCalledWith(['/']);
      expect(component.navigate.emit).toHaveBeenCalled();
    });

    it('should emit navigate event when menu item clicked', () => {
      spyOn(component.navigate, 'emit');
      const menuItem = fixture.debugElement.query(
        By.css('.menu-item')
      );
      
      component.onNavigate(component.menuItems[0]);
      
      expect(component.navigate.emit).toHaveBeenCalled();
    });

    it('should mark active route', () => {
      Object.defineProperty(router, 'url', {
        get: () => '/dashboard',
        configurable: true
      });
      
      component.ngOnInit();
      routerEventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
      fixture.detectChanges();
      
      const activeItem = fixture.debugElement.query(
        By.css('.menu-item.active')
      );
      expect(activeItem).toBeTruthy();
    });

    it('should auto-expand parent items for active routes', fakeAsync(() => {
      const projectsItem = component.menuItems.find(item => item.id === 'projects');
      expect(projectsItem?.children).toBeTruthy();
      
      Object.defineProperty(router, 'url', {
        get: () => '/projects/my',
        configurable: true
      });
      
      routerEventsSubject.next(new NavigationEnd(1, '/projects/my', '/projects/my'));
      tick();
      
      expect(component.isExpanded('projects')).toBeTruthy();
    }));
  });

  describe('Search Functionality', () => {
    it('should filter menu items based on search query', () => {
      component.searchQuery = 'dash';
      component.filterMenuItems();
      
      expect(component.filteredMenuItems.length).toBe(1);
      expect(component.filteredMenuItems[0].label).toContain('Dashboard');
    });

    it('should clear search and reset menu items', () => {
      component.searchQuery = 'test';
      component.filterMenuItems();
      expect(component.filteredMenuItems.length).toBeLessThan(component.menuItems.length);
      
      component.clearSearch();
      
      expect(component.searchQuery).toBe('');
      expect(component.filteredMenuItems).toEqual(component.menuItems);
    });

    it('should show clear button when search has value', () => {
      component.isCollapsed = false;
      component.searchQuery = 'test';
      fixture.detectChanges();
      
      const clearBtn = fixture.debugElement.query(
        By.css('.search-field button[matSuffix]')
      );
      expect(clearBtn).toBeTruthy();
    });

    it('should hide search when sidebar is collapsed', () => {
      component.isCollapsed = false;
      fixture.detectChanges();
      let searchSection = fixture.debugElement.query(By.css('.sidebar-search'));
      expect(searchSection).toBeTruthy();
      
      component.isCollapsed = true;
      fixture.detectChanges();
      searchSection = fixture.debugElement.query(By.css('.sidebar-search'));
      expect(searchSection).toBeNull();
    });
  });

  describe('Permissions', () => {
    it('should show items with permissions when user has them', () => {
      authService.hasAnyPermission.and.returnValue(true);
      fixture.detectChanges();
      
      const settingsItem = fixture.debugElement.query(
        By.css('[ng-reflect-router-link="/settings"]')
      );
      expect(settingsItem).toBeTruthy();
    });

    it('should hide items when user lacks permissions', () => {
      authService.hasAnyPermission.and.returnValue(false);
      component.ngOnInit();
      fixture.detectChanges();
      
      const settingsItem = fixture.debugElement.query(
        By.css('[ng-reflect-router-link="/settings"]')
      );
      expect(settingsItem).toBeNull();
    });

    it('should check permissions for child items', () => {
      const childItem = { 
        id: 'test', 
        label: 'Test', 
        icon: 'test',
        permissions: ['test.permission'] 
      };
      
      authService.hasAnyPermission.and.returnValue(false);
      const result = component.hasPermission(childItem);
      
      expect(authService.hasAnyPermission).toHaveBeenCalledWith(['test.permission']);
      expect(result).toBe(false);
    });
  });

  describe('Expansion Panels', () => {
    it('should expand/collapse menu items with children', async () => {
      component.isCollapsed = false;
      fixture.detectChanges();
      
      const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
      expect(panels.length).toBeGreaterThan(0);
      
      const firstPanel = panels[0];
      expect(await firstPanel.isExpanded()).toBe(false);
      
      await firstPanel.expand();
      expect(await firstPanel.isExpanded()).toBe(true);
    });

    it('should track expanded state', () => {
      component.toggleExpansion('projects', true);
      expect(component.isExpanded('projects')).toBe(true);
      
      component.toggleExpansion('projects', false);
      expect(component.isExpanded('projects')).toBe(false);
    });

    it('should show dropdown on hover when collapsed', () => {
      component.isCollapsed = true;
      fixture.detectChanges();
      
      component.showDropdown('projects');
      expect(component.isDropdownOpen('projects')).toBe(true);
      
      component.hideDropdown('projects');
      expect(component.isDropdownOpen('projects')).toBe(false);
    });
  });

  describe('Theme Toggle', () => {
    it('should toggle theme when button clicked', () => {
      const themeBtn = fixture.debugElement.query(
        By.css('.quick-actions button:first-child')
      );
      
      themeBtn.nativeElement.click();
      
      expect(themeService.toggleTheme).toHaveBeenCalled();
    });

    it('should display correct theme icon', () => {
      themeService.isDarkTheme = signal(false);
      fixture.detectChanges();
      let icon = fixture.debugElement.query(
        By.css('.quick-actions button:first-child mat-icon')
      );
      expect(icon.nativeElement.textContent).toBe('dark_mode');
      
      themeService.isDarkTheme = signal(true);
      fixture.detectChanges();
      icon = fixture.debugElement.query(
        By.css('.quick-actions button:first-child mat-icon')
      );
      expect(icon.nativeElement.textContent).toBe('light_mode');
    });
  });

  describe('User Section', () => {
    it('should display user information', () => {
      component.isCollapsed = false;
      fixture.detectChanges();
      
      const userName = fixture.debugElement.query(By.css('.user-name'));
      const userRole = fixture.debugElement.query(By.css('.user-role'));
      
      expect(userName.nativeElement.textContent).toBe('John Doe');
      expect(userRole.nativeElement.textContent).toBe('Admin');
    });

    it('should show user avatar', () => {
      const avatar = fixture.debugElement.query(By.css('.user-avatar'));
      expect(avatar.attributes['src']).toBe('avatar.jpg');
      expect(avatar.attributes['alt']).toBe('John Doe');
    });

    it('should handle avatar error', () => {
      const avatar = fixture.debugElement.query(By.css('.user-avatar'));
      const event = new Event('error');
      Object.defineProperty(event, 'target', {
        value: { src: '' },
        writable: false
      });
      
      component.handleAvatarError(event);
      
      expect((event.target as any).src).toContain('default-avatar.png');
    });

    it('should show user menu on button click', async () => {
      component.isCollapsed = false;
      fixture.detectChanges();
      
      const menuBtn = fixture.debugElement.query(
        By.css('.user-menu-button')
      );
      menuBtn.nativeElement.click();
      fixture.detectChanges();
      
      const menu = await loader.getHarness(MatMenuHarness);
      expect(menu).toBeTruthy();
    });
  });

  describe('Badges', () => {
    it('should display badge counts', () => {
      const taskItem = component.menuItems.find(item => item.id === 'tasks');
      expect(taskItem?.badge).toBe(5);
      
      fixture.detectChanges();
      const badge = fixture.debugElement.query(
        By.css('.badge.badge-warn')
      );
      expect(badge).toBeTruthy();
      expect(badge.nativeElement.textContent.trim()).toBe('5');
    });

    it('should apply correct badge color classes', () => {
      const badges = fixture.debugElement.queryAll(By.css('.badge'));
      
      badges.forEach(badge => {
        const classes = badge.nativeElement.classList;
        expect(
          classes.contains('badge-primary') ||
          classes.contains('badge-accent') ||
          classes.contains('badge-warn')
        ).toBeTruthy();
      });
    });
  });

  describe('Mobile Behavior', () => {
    it('should apply mobile class when isMobile is true', () => {
      component.isMobile = true;
      fixture.detectChanges();
      
      const sidebar = fixture.debugElement.query(By.css('.sidebar'));
      expect(sidebar.classes['mobile']).toBeTruthy();
    });

    it('should show/hide based on expanded state on mobile', () => {
      component.isMobile = true;
      component.expanded = false;
      fixture.detectChanges();
      
      let sidebar = fixture.debugElement.query(By.css('.sidebar'));
      expect(sidebar.classes['expanded']).toBeFalsy();
      
      component.expanded = true;
      fixture.detectChanges();
      sidebar = fixture.debugElement.query(By.css('.sidebar'));
      expect(sidebar.classes['expanded']).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav.attributes['role']).toBe('navigation');
      expect(nav.attributes['aria-label']).toBeTruthy();
      
      const menuItems = fixture.debugElement.queryAll(
        By.css('.menu-item')
      );
      menuItems.forEach(item => {
        expect(item.attributes['aria-label']).toBeTruthy();
      });
    });

    it('should mark active route with aria-current', () => {
      const activeItem = fixture.debugElement.query(
        By.css('.menu-item.active')
      );
      if (activeItem) {
        expect(activeItem.attributes['aria-current']).toBe('page');
      }
    });

    it('should support keyboard navigation', () => {
      const logo = fixture.debugElement.query(By.css('.logo-container'));
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      logo.nativeElement.dispatchEvent(keyEvent);
      
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('Performance', () => {
    it('should use trackBy for menu items', () => {
      const item = component.menuItems[0];
      const result = component.trackById(0, item);
      expect(result).toBe(item.id);
    });

    it('should cleanup on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Logout', () => {
    it('should call logout service when logout clicked', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.logout();
      
      expect(authService.logout).toHaveBeenCalled();
    });

    it('should not logout if user cancels confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.logout();
      
      expect(authService.logout).not.toHaveBeenCalled();
    });
  });
});
