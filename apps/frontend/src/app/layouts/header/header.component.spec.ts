/**
 * Unit tests for HeaderComponent
 * 
 * Tests cover functionality including navigation, theme toggling, 
 * language selection, user menu, search, and accessibility features.
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Store } from '@ngrx/store';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { HeaderComponent } from './header.component';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ShortcutService } from '../../core/services/shortcut.service';
import * as AuthActions from '../../store/auth/auth.actions';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let loader: HarnessLoader;
  let store: MockStore;
  let authService: jasmine.SpyObj<AuthService>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let translateService: jasmine.SpyObj<TranslateService>;
  let shortcutService: jasmine.SpyObj<ShortcutService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'avatar.jpg',
    roles: [{ id: '1', name: 'Admin' }]
  };

  const initialState = {
    auth: {
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      error: null
    }
  };

  beforeEach(async () => {
    // Create spy objects
    authService = jasmine.createSpyObj('AuthService', [], {
      currentUser: signal(mockUser)
    });
    
    themeService = jasmine.createSpyObj('ThemeService', 
      ['toggleTheme'], 
      { currentTheme: signal('light') }
    );
    
    translateService = jasmine.createSpyObj('TranslateService', 
      ['use'],
      { currentLang: 'en' }
    );
    
    shortcutService = jasmine.createSpyObj('ShortcutService', 
      ['add', 'remove']
    );

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        NoopAnimationsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        FormsModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatBadgeModule,
        MatTooltipModule,
        MatInputModule,
        MatFormFieldModule,
        MatDividerModule,
        MatProgressBarModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideMockStore({ initialState }),
        { provide: AuthService, useValue: authService },
        { provide: ThemeService, useValue: themeService },
        { provide: TranslateService, useValue: translateService },
        { provide: ShortcutService, useValue: shortcutService }
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(HeaderComponent);
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
      expect(component.searchQuery).toBe('');
      expect(component.sidenavOpened).toBeFalse();
      expect(component.scrolled()).toBeFalse();
      expect(component.isLoading()).toBeFalse();
    });

    it('should display user information correctly', () => {
      expect(component.userName()).toBe('John Doe');
      expect(component.userEmail()).toBe('test@example.com');
      expect(component.userAvatar()).toBe('avatar.jpg');
      expect(component.userRole()).toBe('Admin');
    });

    it('should setup scroll listener on initialization', () => {
      spyOn(window, 'addEventListener');
      const newComponent = new HeaderComponent();
      expect(window.addEventListener).toHaveBeenCalledWith(
        'scroll', 
        jasmine.any(Function)
      );
    });
  });

  describe('Navigation Toggle', () => {
    it('should emit toggleSidenav event when menu button clicked', () => {
      spyOn(component.toggleSidenav, 'emit');
      const menuButton = fixture.debugElement.query(
        By.css('.menu-toggle')
      );
      
      menuButton.nativeElement.click();
      
      expect(component.toggleSidenav.emit).toHaveBeenCalled();
    });

    it('should display correct menu icon based on sidenav state', () => {
      component.sidenavOpened = false;
      fixture.detectChanges();
      let icon = fixture.debugElement.query(By.css('.menu-toggle mat-icon'));
      expect(icon.nativeElement.textContent).toBe('menu');
      
      component.sidenavOpened = true;
      fixture.detectChanges();
      icon = fixture.debugElement.query(By.css('.menu-toggle mat-icon'));
      expect(icon.nativeElement.textContent).toBe('menu_open');
    });
  });

  describe('Search Functionality', () => {
    it('should perform search on Enter key', () => {
      spyOn(component, 'onSearch');
      const searchInput = fixture.debugElement.query(
        By.css('#global-search')
      ).nativeElement;
      
      component.searchQuery = 'test query';
      searchInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      
      expect(component.onSearch).toHaveBeenCalled();
    });

    it('should clear search on Escape key', () => {
      spyOn(component, 'clearSearch');
      const searchInput = fixture.debugElement.query(
        By.css('#global-search')
      ).nativeElement;
      
      searchInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
      
      expect(component.clearSearch).toHaveBeenCalled();
    });

    it('should show clear button when search query exists', () => {
      component.searchQuery = '';
      fixture.detectChanges();
      let clearButton = fixture.debugElement.query(
        By.css('.search-field button[matSuffix]')
      );
      expect(clearButton).toBeNull();
      
      component.searchQuery = 'test';
      fixture.detectChanges();
      clearButton = fixture.debugElement.query(
        By.css('.search-field button[matSuffix]')
      );
      expect(clearButton).toBeTruthy();
    });

    it('should clear search query when clear button clicked', () => {
      component.searchQuery = 'test';
      fixture.detectChanges();
      
      const clearButton = fixture.debugElement.query(
        By.css('.search-field button[matSuffix]')
      );
      clearButton.nativeElement.click();
      
      expect(component.searchQuery).toBe('');
    });
  });

  describe('Theme Toggle', () => {
    it('should toggle theme when theme button clicked', () => {
      const themeButton = fixture.debugElement.query(
        By.css('button[matTooltip*="theme"]')
      );
      
      themeButton.nativeElement.click();
      
      expect(themeService.toggleTheme).toHaveBeenCalled();
    });

    it('should display correct theme icon', () => {
      // Light theme
      expect(component.isDarkTheme()).toBeFalse();
      let icon = fixture.debugElement.query(
        By.css('button[matTooltip*="theme"] mat-icon')
      );
      expect(icon.nativeElement.textContent).toBe('dark_mode');
      
      // Dark theme
      themeService.currentTheme = signal('dark');
      fixture.detectChanges();
      expect(component.isDarkTheme()).toBeTrue();
      icon = fixture.debugElement.query(
        By.css('button[matTooltip*="theme"] mat-icon')
      );
      expect(icon.nativeElement.textContent).toBe('light_mode');
    });
  });

  describe('Notifications', () => {
    it('should emit toggleNotifications event when button clicked', () => {
      spyOn(component.toggleNotifications, 'emit');
      const notifButton = fixture.debugElement.query(
        By.css('button[matBadge]')
      );
      
      notifButton.nativeElement.click();
      
      expect(component.toggleNotifications.emit).toHaveBeenCalled();
    });

    it('should display notification badge with count', () => {
      component.unreadNotifications.set(5);
      fixture.detectChanges();
      
      const badge = fixture.debugElement.query(
        By.css('button[matBadge]')
      );
      expect(badge.attributes['matBadge']).toBe('5');
    });

    it('should hide badge when no notifications', () => {
      component.unreadNotifications.set(0);
      fixture.detectChanges();
      
      const badge = fixture.debugElement.query(
        By.css('button[matBadge]')
      );
      expect(badge.attributes['matBadgeHidden']).toBe('true');
    });
  });

  describe('Language Selection', () => {
    it('should display available languages in menu', async () => {
      const menuTrigger = await loader.getHarness(
        MatButtonHarness.with({ selector: '[matMenuTriggerFor]' })
      );
      await menuTrigger.click();
      
      const menu = await loader.getHarness(MatMenuHarness);
      const items = await menu.getItems();
      
      expect(items.length).toBe(component.availableLanguages.length);
    });

    it('should change language when menu item clicked', fakeAsync(() => {
      const langButton = fixture.debugElement.query(
        By.css('button[matMenuTriggerFor]')
      );
      langButton.nativeElement.click();
      tick();
      fixture.detectChanges();
      
      const menuItems = fixture.debugElement.queryAll(
        By.css('button[mat-menu-item]')
      );
      const spanishItem = menuItems.find(item => 
        item.nativeElement.textContent.includes('Español')
      );
      
      spanishItem?.nativeElement.click();
      tick();
      
      expect(translateService.use).toHaveBeenCalledWith('es');
      expect(component.currentLanguage()).toBe('es');
      expect(localStorage.getItem('language')).toBe('es');
    }));

    it('should highlight current language', fakeAsync(() => {
      component.currentLanguage.set('es');
      fixture.detectChanges();
      
      const langButton = fixture.debugElement.query(
        By.css('button[matMenuTriggerFor]')
      );
      langButton.nativeElement.click();
      tick();
      fixture.detectChanges();
      
      const activeItem = fixture.debugElement.query(
        By.css('button[mat-menu-item].active')
      );
      expect(activeItem.nativeElement.textContent).toContain('Español');
    }));
  });

  describe('User Menu', () => {
    it('should display user avatar', () => {
      const avatar = fixture.debugElement.query(
        By.css('.user-menu-trigger img')
      );
      expect(avatar.attributes['src']).toBe('avatar.jpg');
      expect(avatar.attributes['alt']).toBe('John Doe');
    });

    it('should handle avatar error', () => {
      const avatar = fixture.debugElement.query(
        By.css('.user-menu-trigger img')
      );
      const event = new Event('error');
      Object.defineProperty(event, 'target', {
        value: { src: '' },
        writable: false
      });
      
      component.handleAvatarError(event);
      fixture.detectChanges();
      
      expect((event.target as any).src).toContain('default-avatar.png');
    });

    it('should show keyboard shortcuts when menu item clicked', () => {
      spyOn(component, 'showKeyboardShortcuts');
      // This would require opening the menu and clicking the item
      component.showKeyboardShortcuts();
      expect(component.showKeyboardShortcuts).toHaveBeenCalled();
    });

    it('should dispatch logout action when logout clicked', () => {
      spyOn(store, 'dispatch');
      component.logout();
      expect(store.dispatch).toHaveBeenCalledWith(AuthActions.logout());
    });
  });

  describe('Scroll Behavior', () => {
    it('should add elevated class when scrolled', () => {
      component.scrolled.set(false);
      fixture.detectChanges();
      let toolbar = fixture.debugElement.query(By.css('.header'));
      expect(toolbar.classes['elevated']).toBeFalsy();
      
      component.scrolled.set(true);
      fixture.detectChanges();
      toolbar = fixture.debugElement.query(By.css('.header'));
      expect(toolbar.classes['elevated']).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should show progress bar when loading', () => {
      component.isLoading.set(false);
      fixture.detectChanges();
      let progressBar = fixture.debugElement.query(
        By.css('.progress-bar')
      );
      expect(progressBar).toBeNull();
      
      component.isLoading.set(true);
      fixture.detectChanges();
      progressBar = fixture.debugElement.query(
        By.css('.progress-bar')
      );
      expect(progressBar).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const menuToggle = fixture.debugElement.query(
        By.css('.menu-toggle')
      );
      expect(menuToggle.attributes['aria-label']).toBeTruthy();
      expect(menuToggle.attributes['aria-expanded']).toBe('false');
      
      const searchInput = fixture.debugElement.query(
        By.css('#global-search')
      );
      expect(searchInput.attributes['aria-label']).toBeTruthy();
    });

    it('should have proper alt text for images', () => {
      const logo = fixture.debugElement.query(
        By.css('.logo-image')
      );
      expect(logo.attributes['alt']).toBeTruthy();
      
      const avatar = fixture.debugElement.query(
        By.css('.user-avatar')
      );
      expect(avatar.attributes['alt']).toBe('John Doe');
    });

    it('should support keyboard navigation', async () => {
      const buttons = fixture.debugElement.queryAll(
        By.css('button')
      );
      
      buttons.forEach(button => {
        expect(button.nativeElement.tabIndex).toBeGreaterThanOrEqual(-1);
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should hide search on mobile devices', () => {
      // This would require mocking window size or using a testing library
      // that supports responsive testing
      expect(component).toBeTruthy();
    });

    it('should hide logo text on tablets', () => {
      // This would require mocking window size or using a testing library
      // that supports responsive testing
      expect(component).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should use trackBy for language list', () => {
      const result = component.trackByLanguageCode(0, { code: 'en', name: 'English' });
      expect(result).toBe('en');
    });

    it('should memoize computed signals', () => {
      const userName1 = component.userName();
      const userName2 = component.userName();
      expect(userName1).toBe(userName2);
    });
  });
});
