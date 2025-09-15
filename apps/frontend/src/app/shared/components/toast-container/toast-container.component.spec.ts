/**
 * Unit tests for ToastContainerComponent
 * Tests component initialization, toast display, animations, and user interactions
 */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService, ToastSeverity, ToastPosition } from '../../../core/services/toast.service';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ToastContainerComponent,
        BrowserAnimationsModule
      ],
      providers: [ToastService]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });
  
  afterEach(() => {
    toastService.dismissAll();
  });
  
  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
    
    it('should initialize with empty toast list', () => {
      expect(component.animatedToasts()).toEqual([]);
    });
    
    it('should have correct default position', () => {
      expect(component.position()).toBe(ToastPosition.TOP_RIGHT);
    });
    
    it('should detect mobile view', () => {
      const originalWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });
      
      component.onResize(new Event('resize'));
      expect(component.containerClasses()['toast-container--mobile']).toBe(true);
      
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalWidth
      });
    });
  });
  
  describe('Toast Display', () => {
    it('should display toast when service creates one', fakeAsync(() => {
      toastService.info('Test Toast', 'Test Message');
      tick(100);
      fixture.detectChanges();
      
      const toastElements = fixture.debugElement.queryAll(By.css('.toast'));
      expect(toastElements.length).toBe(1);
      
      const titleElement = fixture.debugElement.query(By.css('.toast__title'));
      expect(titleElement.nativeElement.textContent).toBe('Test Toast');
      
      const messageElement = fixture.debugElement.query(By.css('.toast__message'));
      expect(messageElement.nativeElement.textContent).toBe('Test Message');
    }));
    
    it('should display multiple toasts', fakeAsync(() => {
      toastService.info('Toast 1');
      toastService.success('Toast 2');
      toastService.warning('Toast 3');
      tick(100);
      fixture.detectChanges();
      
      const toastElements = fixture.debugElement.queryAll(By.css('.toast'));
      expect(toastElements.length).toBe(3);
    }));
    
    it('should apply correct severity classes', fakeAsync(() => {
      toastService.success('Success');
      toastService.error('Error');
      toastService.warning('Warning');
      toastService.info('Info');
      tick(100);
      fixture.detectChanges();
      
      const toastElements = fixture.debugElement.queryAll(By.css('.toast'));
      expect(toastElements[0].nativeElement.classList.contains('toast--success')).toBe(true);
      expect(toastElements[1].nativeElement.classList.contains('toast--error')).toBe(true);
      expect(toastElements[2].nativeElement.classList.contains('toast--warning')).toBe(true);
      expect(toastElements[3].nativeElement.classList.contains('toast--info')).toBe(true);
    }));
    
    it('should display custom icon when provided', fakeAsync(() => {
      toastService.info('Test', undefined, { icon: 'custom_icon' });
      tick(100);
      fixture.detectChanges();
      
      const iconElement = fixture.debugElement.query(By.css('.toast__icon'));
      expect(iconElement.nativeElement.getAttribute('ng-reflect-font-icon')).toBe('custom_icon');
    }));
  });
  
  describe('Toast Actions', () => {
    it('should display action buttons', fakeAsync(() => {
      let actionCalled = false;
      toastService.show({
        title: 'Test',
        severity: ToastSeverity.INFO,
        actions: [{
          label: 'ACTION',
          action: () => { actionCalled = true; }
        }]
      });
      tick(100);
      fixture.detectChanges();
      
      const actionButton = fixture.debugElement.query(By.css('.toast__action'));
      expect(actionButton).toBeTruthy();
      expect(actionButton.nativeElement.textContent.trim()).toBe('ACTION');
      
      actionButton.nativeElement.click();
      expect(actionCalled).toBe(true);
    }));
    
    it('should display close button for closable toasts', fakeAsync(() => {
      toastService.info('Closable', undefined, { closable: true });
      tick(100);
      fixture.detectChanges();
      
      const closeButton = fixture.debugElement.query(By.css('.toast__close'));
      expect(closeButton).toBeTruthy();
    }));
    
    it('should not display close button for non-closable toasts', fakeAsync(() => {
      toastService.info('Not Closable', undefined, { closable: false });
      tick(100);
      fixture.detectChanges();
      
      const closeButton = fixture.debugElement.query(By.css('.toast__close'));
      expect(closeButton).toBeFalsy();
    }));
  });
  
  describe('Toast Dismissal', () => {
    it('should remove toast when dismissed', fakeAsync(() => {
      const id = toastService.info('Test');
      tick(100);
      fixture.detectChanges();
      
      expect(component.animatedToasts().length).toBe(1);
      
      toastService.dismiss(id);
      tick(400); // Wait for animation
      fixture.detectChanges();
      
      expect(component.animatedToasts().length).toBe(0);
    }));
    
    it('should remove all toasts when dismissAll called', fakeAsync(() => {
      toastService.info('Toast 1');
      toastService.info('Toast 2');
      toastService.info('Toast 3');
      tick(100);
      fixture.detectChanges();
      
      expect(component.animatedToasts().length).toBe(3);
      
      toastService.dismissAll();
      tick(100);
      fixture.detectChanges();
      
      expect(component.animatedToasts().length).toBe(0);
    }));
    
    it('should dismiss on close button click', fakeAsync(() => {
      toastService.info('Test');
      tick(100);
      fixture.detectChanges();
      
      const closeButton = fixture.debugElement.query(By.css('.toast__close'));
      closeButton.nativeElement.click();
      
      tick(400);
      fixture.detectChanges();
      
      expect(component.animatedToasts().length).toBe(0);
    }));
    
    it('should dismiss on toast click if closable and no actions', fakeAsync(() => {
      toastService.info('Test');
      tick(100);
      fixture.detectChanges();
      
      const toast = fixture.debugElement.query(By.css('.toast'));
      toast.nativeElement.click();
      
      tick(400);
      fixture.detectChanges();
      
      expect(component.animatedToasts().length).toBe(0);
    }));
    
    it('should not dismiss on click if toast has actions', fakeAsync(() => {
      toastService.show({
        title: 'Test',
        severity: ToastSeverity.INFO,
        actions: [{ label: 'ACTION', action: () => {} }]
      });
      tick(100);
      fixture.detectChanges();
      
      const toast = fixture.debugElement.query(By.css('.toast'));
      toast.nativeElement.click();
      
      tick(400);
      fixture.detectChanges();
      
      expect(component.animatedToasts().length).toBe(1);
    }));
  });
  
  describe('Progress Bar', () => {
    it('should show progress bar for auto-dismiss toasts', fakeAsync(() => {
      toastService.info('Test', undefined, { duration: 5000 });
      tick(100);
      fixture.detectChanges();
      
      const progressBar = fixture.debugElement.query(By.css('.toast__progress'));
      expect(progressBar).toBeTruthy();
    }));
    
    it('should not show progress bar for manual dismiss toasts', fakeAsync(() => {
      toastService.info('Test', undefined, { duration: 0 });
      tick(100);
      fixture.detectChanges();
      
      const progressBar = fixture.debugElement.query(By.css('.toast__progress'));
      expect(progressBar).toBeFalsy();
    }));
  });
  
  describe('Position Classes', () => {
    it('should apply correct position class', () => {
      const positions: ToastPosition[] = [
        ToastPosition.TOP_RIGHT,
        ToastPosition.TOP_LEFT,
        ToastPosition.TOP_CENTER,
        ToastPosition.BOTTOM_RIGHT,
        ToastPosition.BOTTOM_LEFT,
        ToastPosition.BOTTOM_CENTER
      ];
      
      positions.forEach(position => {
        toastService.setPosition(position);
        fixture.detectChanges();
        
        const classes = component.containerClasses();
        expect(classes[`toast-container--${position}`]).toBe(true);
      });
    });
  });
  
  describe('Touch/Swipe Handling', () => {
    it('should handle touch start', fakeAsync(() => {
      toastService.info('Test');
      tick(100);
      fixture.detectChanges();
      
      const toast = component.animatedToasts()[0];
      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      
      component.onTouchStart(touchEvent, toast);
      expect(component['currentToast']).toBe(toast);
    }));
    
    it('should update swipe offset on touch move', fakeAsync(() => {
      toastService.info('Test');
      tick(100);
      fixture.detectChanges();
      
      const toast = component.animatedToasts()[0];
      
      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      component.onTouchStart(startEvent, toast);
      
      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 150, clientY: 100 } as Touch]
      });
      component.onTouchMove(moveEvent, toast);
      
      expect(component.animatedToasts()[0].swipeOffset).toBe(50);
    }));
    
    it('should dismiss on sufficient swipe', fakeAsync(() => {
      toastService.info('Test');
      tick(100);
      fixture.detectChanges();
      
      const toast = component.animatedToasts()[0];
      
      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      component.onTouchStart(startEvent, toast);
      
      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 250, clientY: 100 } as Touch]
      });
      component.onTouchMove(moveEvent, toast);
      
      const endEvent = new TouchEvent('touchend', {});
      component.onTouchEnd(endEvent, toast);
      
      tick(400);
      fixture.detectChanges();
      
      expect(component.animatedToasts().length).toBe(0);
    }));
    
    it('should reset position on insufficient swipe', fakeAsync(() => {
      toastService.info('Test');
      tick(100);
      fixture.detectChanges();
      
      const toast = component.animatedToasts()[0];
      
      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      component.onTouchStart(startEvent, toast);
      
      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 130, clientY: 100 } as Touch]
      });
      component.onTouchMove(moveEvent, toast);
      
      const endEvent = new TouchEvent('touchend', {});
      component.onTouchEnd(endEvent, toast);
      
      expect(component.animatedToasts()[0].swipeOffset).toBe(0);
    }));
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA attributes', fakeAsync(() => {
      toastService.info('Test Title', 'Test Message');
      tick(100);
      fixture.detectChanges();
      
      const container = fixture.debugElement.query(By.css('.toast-container'));
      expect(container.nativeElement.getAttribute('role')).toBe('region');
      expect(container.nativeElement.getAttribute('aria-live')).toBe('polite');
      
      const toast = fixture.debugElement.query(By.css('.toast'));
      expect(toast.nativeElement.getAttribute('role')).toBe('alert');
      expect(toast.nativeElement.getAttribute('aria-labelledby')).toContain('toast-title-');
      expect(toast.nativeElement.getAttribute('aria-describedby')).toContain('toast-message-');
    }));
    
    it('should have accessible close button', fakeAsync(() => {
      toastService.info('Test Toast');
      tick(100);
      fixture.detectChanges();
      
      const closeButton = fixture.debugElement.query(By.css('.toast__close'));
      expect(closeButton.nativeElement.getAttribute('aria-label')).toContain('Close notification');
    }));
  });
});
