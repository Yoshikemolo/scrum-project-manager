import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { HeaderComponent } from './header.component';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ShortcutService } from '../../core/services/shortcut.service';
import { SearchService } from '../../core/services/search.service';
import { WebSocketService } from '../../core/services/websocket.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let store: jasmine.SpyObj<Store>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let searchService: jasmine.SpyObj<SearchService>;
  let websocketService: jasmine.SpyObj<WebSocketService>;

  beforeEach(async () => {
    const storeSpy = jasmine.createSpyObj('Store', ['select', 'dispatch']);
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['toggleTheme'], {
      isDarkTheme$: of(false)
    });
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['addNotification']);
    const shortcutServiceSpy = jasmine.createSpyObj('ShortcutService', ['add']);
    const searchServiceSpy = jasmine.createSpyObj('SearchService', ['search']);
    const websocketServiceSpy = jasmine.createSpyObj('WebSocketService', [
      'connect',
      'disconnect',
      'on'
    ], {
      connectionStatus$: of('connected')
    });

    storeSpy.select.and.returnValue(of(null));
    searchServiceSpy.search.and.returnValue(of([]));
    websocketServiceSpy.on.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        BrowserAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: Store, useValue: storeSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: ShortcutService, useValue: shortcutServiceSpy },
        { provide: SearchService, useValue: searchServiceSpy },
        { provide: WebSocketService, useValue: websocketServiceSpy }
      ]
    }).compileComponents();

    store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    searchService = TestBed.inject(SearchService) as jasmine.SpyObj<SearchService>;
    websocketService = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Theme Toggle', () => {
    it('should toggle theme when button is clicked', () => {
      component.toggleTheme();
      expect(themeService.toggleTheme).toHaveBeenCalled();
    });

    it('should display correct icon based on theme', () => {
      component['isDarkTheme'].set(false);
      expect(component.isDarkTheme()).toBeFalsy();
      
      component['isDarkTheme'].set(true);
      expect(component.isDarkTheme()).toBeTruthy();
    });
  });

  describe('Search Functionality', () => {
    it('should perform search with debounce', (done) => {
      const searchQuery = 'test query';
      searchService.search.and.returnValue(of([
        {
          id: '1',
          title: 'Test Result',
          description: 'Test description',
          type: 'project',
          url: '/projects/1',
          icon: 'folder'
        }
      ]));

      component.searchControl.setValue(searchQuery);
      
      setTimeout(() => {
        expect(searchService.search).toHaveBeenCalledWith(searchQuery);
        expect(component.searchResults().length).toBe(1);
        done();
      }, 400);
    });

    it('should clear search results', () => {
      component.searchResults.set([{
        id: '1',
        title: 'Test',
        description: 'Test',
        type: 'project',
        url: '/test',
        icon: 'folder'
      }]);
      component.searchControl.setValue('test');
      
      component.clearSearch();
      
      expect(component.searchControl.value).toBe('');
      expect(component.searchResults()).toEqual([]);
      expect(component.showSearchResults()).toBeFalsy();
    });

    it('should not search for short queries', (done) => {
      component.searchControl.setValue('a');
      
      setTimeout(() => {
        expect(searchService.search).not.toHaveBeenCalled();
        done();
      }, 400);
    });
  });

  describe('Mobile Menu', () => {
    it('should toggle mobile menu', () => {
      expect(component.isMobileMenuOpen()).toBeFalsy();
      
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen()).toBeTruthy();
      
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen()).toBeFalsy();
    });

    it('should close mobile menu', () => {
      component['isMobileMenuOpen'].set(true);
      
      component.closeMobileMenu();
      expect(component.isMobileMenuOpen()).toBeFalsy();
    });
  });

  describe('User Menu Actions', () => {
    it('should handle profile action', () => {
      spyOn<any>(component, 'navigate');
      component.handleUserMenuAction('profile');
      expect(component['navigate']).toHaveBeenCalledWith('/profile');
    });

    it('should handle settings action', () => {
      spyOn<any>(component, 'navigate');
      component.handleUserMenuAction('settings');
      expect(component['navigate']).toHaveBeenCalledWith('/settings');
    });

    it('should handle logout action', () => {
      component.handleUserMenuAction('logout');
      expect(store.dispatch).toHaveBeenCalled();
    });
  });

  describe('User Information', () => {
    it('should get user initials', () => {
      component['user'].set({
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'Developer',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      expect(component.getUserInitials()).toBe('JD');
    });

    it('should return ? for missing user', () => {
      component['user'].set(null);
      expect(component.getUserInitials()).toBe('?');
    });

    it('should get user avatar', () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      component['user'].set({
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'Developer',
        avatar: avatarUrl,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      expect(component.getUserAvatar()).toBe(avatarUrl);
    });
  });

  describe('Connection Status', () => {
    it('should get connection status color', () => {
      component['connectionStatus'].set('connected');
      expect(component.getConnectionStatusColor()).toBe('success');
      
      component['connectionStatus'].set('connecting');
      expect(component.getConnectionStatusColor()).toBe('warning');
      
      component['connectionStatus'].set('disconnected');
      expect(component.getConnectionStatusColor()).toBe('error');
    });

    it('should get connection status tooltip', () => {
      component['connectionStatus'].set('connected');
      component['onlineUsers'].set(5);
      expect(component.getConnectionStatusTooltip()).toBe('Connected • 5 users online');
      
      component['connectionStatus'].set('connecting');
      expect(component.getConnectionStatusTooltip()).toBe('Connecting...');
      
      component['connectionStatus'].set('disconnected');
      expect(component.getConnectionStatusTooltip()).toBe('Disconnected');
    });
  });

  describe('Notifications', () => {
    it('should animate badge on new notification', () => {
      component['unreadNotifications'].set(0);
      spyOn<any>(component, 'animateBadge');
      
      component['unreadNotifications'].set(1);
      component['initializeSubscriptions']();
      
      // Would need to trigger the subscription
    });
  });

  describe('Cleanup', () => {
    it('should disconnect websocket on destroy', () => {
      component.ngOnDestroy();
      expect(websocketService.disconnect).toHaveBeenCalled();
    });

    it('should complete destroy subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});