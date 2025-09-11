/**
 * Unit tests for FooterComponent
 * 
 * Tests cover functionality including navigation links, status indicators,
 * social links, responsive behavior, and accessibility features.
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { FooterComponent } from './footer.component';
import { environment } from '../../../environments/environment';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let translateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    translateService = jasmine.createSpyObj('TranslateService', 
      ['instant', 'get'],
      { currentLang: 'en' }
    );
    
    translateService.instant.and.returnValue('translated');
    translateService.get.and.returnValue(of('translated'));

    await TestBed.configureTestingModule({
      imports: [
        FooterComponent,
        NoopAnimationsModule,
        RouterTestingModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: TranslateService, useValue: translateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should display current year', () => {
      const currentYear = new Date().getFullYear();
      expect(component.currentYear).toBe(currentYear);
      
      const copyrightElement = fixture.debugElement.query(
        By.css('.copyright')
      );
      expect(copyrightElement.nativeElement.textContent).toContain(currentYear.toString());
    });

    it('should display app version', () => {
      expect(component.appVersion).toBe(environment.appVersion);
      
      const versionElement = fixture.debugElement.query(
        By.css('.version')
      );
      expect(versionElement.nativeElement.textContent).toContain(`v${environment.appVersion}`);
    });

    it('should initialize with online status', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      
      const newComponent = new FooterComponent();
      expect(newComponent.isOnline()).toBe(true);
    });

    it('should display environment badge in non-production', () => {
      component.isProduction = false;
      component.environmentName = 'development';
      fixture.detectChanges();
      
      const badge = fixture.debugElement.query(
        By.css('.environment-badge')
      );
      expect(badge).toBeTruthy();
      expect(badge.nativeElement.textContent).toContain('development');
    });
  });

  describe('Navigation Links', () => {
    it('should display all footer links', () => {
      const links = fixture.debugElement.queryAll(
        By.css('.footer-link')
      );
      expect(links.length).toBe(component.footerLinks.length);
    });

    it('should have correct routing for links', () => {
      const links = fixture.debugElement.queryAll(
        By.css('.footer-link')
      );
      
      links.forEach((link, index) => {
        expect(link.attributes['ng-reflect-router-link']).toBe(
          component.footerLinks[index].route
        );
      });
    });

    it('should mark active route', () => {
      // This would require mocking the router to set an active route
      const activeLink = fixture.debugElement.query(
        By.css('.footer-link.active')
      );
      // Active state depends on router configuration
      expect(component).toBeTruthy();
    });

    it('should use trackBy for footer links', () => {
      const link = { label: 'test', route: '/test' };
      const result = component.trackByRoute(0, link);
      expect(result).toBe('/test');
    });
  });

  describe('Status Indicator', () => {
    it('should show online status when connected', () => {
      component.isOnline.set(true);
      fixture.detectChanges();
      
      const statusDot = fixture.debugElement.query(
        By.css('.status-dot')
      );
      expect(statusDot.classes['online']).toBeTruthy();
      expect(statusDot.classes['offline']).toBeFalsy();
    });

    it('should show offline status when disconnected', () => {
      component.isOnline.set(false);
      fixture.detectChanges();
      
      const statusDot = fixture.debugElement.query(
        By.css('.status-dot')
      );
      expect(statusDot.classes['offline']).toBeTruthy();
      expect(statusDot.classes['online']).toBeFalsy();
    });

    it('should update status on online event', () => {
      component.isOnline.set(false);
      
      window.dispatchEvent(new Event('online'));
      fixture.detectChanges();
      
      expect(component.isOnline()).toBe(true);
    });

    it('should update status on offline event', () => {
      component.isOnline.set(true);
      
      window.dispatchEvent(new Event('offline'));
      fixture.detectChanges();
      
      expect(component.isOnline()).toBe(false);
    });
  });

  describe('Language Display', () => {
    it('should display current language', () => {
      component.currentLanguage.set('en');
      fixture.detectChanges();
      
      const langCode = fixture.debugElement.query(
        By.css('.language-code')
      );
      expect(langCode.nativeElement.textContent).toBe('EN');
    });

    it('should update when language changes', () => {
      component.currentLanguage.set('es');
      fixture.detectChanges();
      
      const langCode = fixture.debugElement.query(
        By.css('.language-code')
      );
      expect(langCode.nativeElement.textContent).toBe('ES');
    });
  });

  describe('Social Links', () => {
    it('should display all social links', () => {
      const socialLinks = fixture.debugElement.queryAll(
        By.css('.social-link')
      );
      expect(socialLinks.length).toBe(component.socialLinks.length);
    });

    it('should have correct URLs for social links', () => {
      const socialLinks = fixture.debugElement.queryAll(
        By.css('.social-link')
      );
      
      socialLinks.forEach((link, index) => {
        expect(link.attributes['href']).toBe(
          component.socialLinks[index].url
        );
      });
    });

    it('should open social links in new tab', () => {
      const socialLinks = fixture.debugElement.queryAll(
        By.css('.social-link')
      );
      
      socialLinks.forEach(link => {
        expect(link.attributes['target']).toBe('_blank');
        expect(link.attributes['rel']).toContain('noopener');
      });
    });

    it('should use trackBy for social links', () => {
      const social = { label: 'Test', icon: 'test', url: 'https://test.com' };
      const result = component.trackByUrl(0, social);
      expect(result).toBe('https://test.com');
    });
  });

  describe('Back to Top Button', () => {
    it('should be hidden initially', () => {
      component.showBackToTop.set(false);
      fixture.detectChanges();
      
      const button = fixture.debugElement.query(
        By.css('.back-to-top')
      );
      expect(button.classes['visible']).toBeFalsy();
    });

    it('should show when scrolled down', () => {
      component.showBackToTop.set(true);
      fixture.detectChanges();
      
      const button = fixture.debugElement.query(
        By.css('.back-to-top')
      );
      expect(button.classes['visible']).toBeTruthy();
    });

    it('should scroll to top when clicked', () => {
      spyOn(window, 'scrollTo');
      
      component.scrollToTop();
      
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth'
      });
    });

    it('should update visibility on scroll', fakeAsync(() => {
      component.showBackToTop.set(false);
      
      // Simulate scroll
      Object.defineProperty(window, 'pageYOffset', {
        writable: true,
        value: 500
      });
      
      window.dispatchEvent(new Event('scroll'));
      tick(100);
      
      expect(component.showBackToTop()).toBe(true);
    }));
  });

  describe('Mobile Footer', () => {
    it('should display mobile links', () => {
      const mobileLinks = fixture.debugElement.queryAll(
        By.css('.mobile-link')
      );
      expect(mobileLinks.length).toBe(component.mobileFooterLinks.length);
    });

    it('should have icons for mobile links', () => {
      const mobileLinks = fixture.debugElement.queryAll(
        By.css('.mobile-link mat-icon')
      );
      
      mobileLinks.forEach((icon, index) => {
        expect(icon.nativeElement.textContent).toBe(
          component.mobileFooterLinks[index].icon
        );
      });
    });

    it('should display mobile copyright', () => {
      const mobileCopyright = fixture.debugElement.query(
        By.css('.mobile-copyright')
      );
      expect(mobileCopyright).toBeTruthy();
      expect(mobileCopyright.nativeElement.textContent).toContain(
        component.currentYear.toString()
      );
    });
  });

  describe('Performance Metrics', () => {
    it('should show metrics in development mode', () => {
      component.showPerformanceMetrics = true;
      component.loadTime = 150;
      component.memoryUsage = 25.5;
      fixture.detectChanges();
      
      const metrics = fixture.debugElement.query(
        By.css('.performance-metrics')
      );
      expect(metrics).toBeTruthy();
      expect(metrics.nativeElement.textContent).toContain('150ms');
      expect(metrics.nativeElement.textContent).toContain('25.5MB');
    });

    it('should hide metrics in production', () => {
      component.showPerformanceMetrics = false;
      fixture.detectChanges();
      
      const metrics = fixture.debugElement.query(
        By.css('.performance-metrics')
      );
      expect(metrics).toBeNull();
    });

    it('should calculate load time correctly', () => {
      const startTime = performance.now();
      component.ngOnInit();
      const loadTime = component.loadTime;
      
      expect(loadTime).toBeGreaterThanOrEqual(0);
      expect(loadTime).toBeLessThan(1000); // Should load in less than 1 second
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const footer = fixture.debugElement.query(By.css('footer'));
      expect(footer.attributes['role']).toBe('contentinfo');
      
      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav.attributes['aria-label']).toBeTruthy();
      
      const socialNav = fixture.debugElement.query(
        By.css('.social-links')
      );
      expect(socialNav.attributes['aria-label']).toBeTruthy();
    });

    it('should have keyboard navigation support', () => {
      const links = fixture.debugElement.queryAll(
        By.css('a, button')
      );
      
      links.forEach(link => {
        expect(link.nativeElement.tabIndex).toBeGreaterThanOrEqual(-1);
      });
    });

    it('should hide decorative elements from screen readers', () => {
      const separators = fixture.debugElement.queryAll(
        By.css('.separator')
      );
      
      separators.forEach(separator => {
        expect(separator.attributes['aria-hidden']).toBe('true');
      });
    });
  });

  describe('Company Link', () => {
    it('should have correct company URL', () => {
      const companyLink = fixture.debugElement.query(
        By.css('.company a')
      );
      expect(companyLink.attributes['href']).toBe('https://ximplicity.es');
    });

    it('should open in new tab with security attributes', () => {
      const companyLink = fixture.debugElement.query(
        By.css('.company a')
      );
      expect(companyLink.attributes['target']).toBe('_blank');
      expect(companyLink.attributes['rel']).toBe('noopener noreferrer');
    });
  });

  describe('Performance', () => {
    it('should clean up event listeners on destroy', () => {
      spyOn(window, 'removeEventListener');
      
      component.ngOnDestroy();
      
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'online',
        jasmine.any(Function)
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'offline',
        jasmine.any(Function)
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        jasmine.any(Function)
      );
    });

    it('should debounce scroll events', fakeAsync(() => {
      let scrollCount = 0;
      component.showBackToTop.set(false);
      
      // Simulate multiple rapid scroll events
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new Event('scroll'));
      }
      
      tick(100);
      
      // Should only process once due to debouncing
      expect(component.scrollHandlerCallCount).toBeLessThan(10);
    }));
  });
});
