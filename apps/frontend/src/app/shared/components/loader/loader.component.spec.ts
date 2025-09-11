/**
 * Unit tests for LoaderComponent
 * 
 * Tests cover all loader types, animations, accessibility features,
 * user interactions, and responsive behavior.
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { LoaderComponent, LoaderAction } from './loader.component';

describe('LoaderComponent', () => {
  let component: LoaderComponent;
  let fixture: ComponentFixture<LoaderComponent>;
  let translateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    translateService = jasmine.createSpyObj('TranslateService', ['instant', 'get']);
    translateService.instant.and.returnValue('translated');
    translateService.get.and.returnValue(of('translated'));

    await TestBed.configureTestingModule({
      imports: [
        LoaderComponent,
        NoopAnimationsModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatButtonModule,
        MatIconModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: TranslateService, useValue: translateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.type).toBe('circular');
      expect(component.size).toBe('medium');
      expect(component.fullscreen).toBe(true);
      expect(component.mode).toBe('indeterminate');
      expect(component.progress).toBe(0);
      expect(component.showProgress).toBe(true);
    });

    it('should start timer if showTimer is true', fakeAsync(() => {
      component.showTimer = true;
      component.ngOnInit();
      
      tick(1000);
      expect(component.elapsedTime).toBe(1);
      
      tick(1000);
      expect(component.elapsedTime).toBe(2);
      
      component.ngOnDestroy();
    }));

    it('should rotate tips if provided', fakeAsync(() => {
      component.tips = ['tip1', 'tip2', 'tip3'];
      component.tipRotationInterval = 1000;
      component.ngOnInit();
      
      expect(component.currentTip).toBe('tip1');
      
      tick(1000);
      expect(component.currentTip).toBe('tip2');
      
      tick(1000);
      expect(component.currentTip).toBe('tip3');
      
      tick(1000);
      expect(component.currentTip).toBe('tip1');
      
      component.ngOnDestroy();
    }));
  });

  describe('Loader Types', () => {
    it('should display circular loader', () => {
      component.type = 'circular';
      fixture.detectChanges();
      
      const spinner = fixture.debugElement.query(By.css('.loader-spinner'));
      expect(spinner).toBeTruthy();
      
      const progressSpinner = fixture.debugElement.query(By.css('mat-progress-spinner'));
      expect(progressSpinner).toBeTruthy();
    });

    it('should display linear loader', () => {
      component.type = 'linear';
      fixture.detectChanges();
      
      const linear = fixture.debugElement.query(By.css('.loader-linear'));
      expect(linear).toBeTruthy();
      
      const progressBar = fixture.debugElement.query(By.css('mat-progress-bar'));
      expect(progressBar).toBeTruthy();
    });

    it('should display skeleton loader', () => {
      component.type = 'skeleton';
      component.skeletonLines = [
        { width: 100, height: 20, delay: 0 },
        { width: 80, height: 20, delay: 100 }
      ];
      fixture.detectChanges();
      
      const skeleton = fixture.debugElement.query(By.css('.loader-skeleton'));
      expect(skeleton).toBeTruthy();
      
      const lines = fixture.debugElement.queryAll(By.css('.skeleton-line'));
      expect(lines.length).toBe(2);
    });

    it('should display dots loader', () => {
      component.type = 'dots';
      fixture.detectChanges();
      
      const dots = fixture.debugElement.query(By.css('.loader-dots'));
      expect(dots).toBeTruthy();
      
      const dotElements = fixture.debugElement.queryAll(By.css('.dot'));
      expect(dotElements.length).toBe(4);
    });

    it('should display pulse loader', () => {
      component.type = 'pulse';
      component.icon = 'sync';
      fixture.detectChanges();
      
      const pulse = fixture.debugElement.query(By.css('.loader-pulse'));
      expect(pulse).toBeTruthy();
      
      const rings = fixture.debugElement.queryAll(By.css('.pulse-ring'));
      expect(rings.length).toBe(3);
      
      const icon = fixture.debugElement.query(By.css('.pulse-core mat-icon'));
      expect(icon.nativeElement.textContent).toBe('sync');
    });

    it('should display custom content', () => {
      component.type = 'custom';
      fixture.detectChanges();
      
      const custom = fixture.debugElement.query(By.css('.loader-custom'));
      expect(custom).toBeTruthy();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size class', () => {
      component.size = 'small';
      fixture.detectChanges();
      
      const container = fixture.debugElement.query(By.css('.loader-container'));
      expect(container.classes['loader-small']).toBeTruthy();
    });

    it('should apply medium size class', () => {
      component.size = 'medium';
      fixture.detectChanges();
      
      const container = fixture.debugElement.query(By.css('.loader-container'));
      expect(container.classes['loader-medium']).toBeTruthy();
    });

    it('should apply large size class', () => {
      component.size = 'large';
      fixture.detectChanges();
      
      const container = fixture.debugElement.query(By.css('.loader-container'));
      expect(container.classes['loader-large']).toBeTruthy();
    });

    it('should calculate correct diameter', () => {
      component.size = 'small';
      expect(component.getDiameter()).toBe(48);
      
      component.size = 'medium';
      expect(component.getDiameter()).toBe(64);
      
      component.size = 'large';
      expect(component.getDiameter()).toBe(80);
    });
  });

  describe('Progress Display', () => {
    it('should show progress text in determinate mode', () => {
      component.type = 'circular';
      component.mode = 'determinate';
      component.progress = 75;
      component.showProgress = true;
      fixture.detectChanges();
      
      const progressText = fixture.debugElement.query(By.css('.progress-text'));
      expect(progressText).toBeTruthy();
      expect(progressText.nativeElement.textContent).toBe('75%');
    });

    it('should not show progress text in indeterminate mode', () => {
      component.mode = 'indeterminate';
      fixture.detectChanges();
      
      const progressText = fixture.debugElement.query(By.css('.progress-text'));
      expect(progressText).toBeNull();
    });

    it('should update progress value', () => {
      component.mode = 'determinate';
      component.setProgress(50);
      fixture.detectChanges();
      
      expect(component.progress).toBe(50);
      
      const progressText = fixture.debugElement.query(By.css('.progress-text'));
      expect(progressText.nativeElement.textContent).toBe('50%');
    });
  });

  describe('Message Display', () => {
    it('should display message when provided', () => {
      component.message = 'Loading data...';
      fixture.detectChanges();
      
      const message = fixture.debugElement.query(By.css('.loader-message'));
      expect(message).toBeTruthy();
      expect(message.nativeElement.textContent).toContain('Loading data...');
    });

    it('should show animated dots with message', () => {
      component.message = 'Loading';
      component.showMessageDots = true;
      fixture.detectChanges();
      
      const dots = fixture.debugElement.queryAll(By.css('.message-dot'));
      expect(dots.length).toBe(3);
    });

    it('should position message below by default', () => {
      component.message = 'Loading';
      component.messagePosition = 'below';
      fixture.detectChanges();
      
      const message = fixture.debugElement.query(By.css('.loader-message'));
      expect(message.classes['message-below']).toBeTruthy();
    });

    it('should position message above when specified', () => {
      component.message = 'Loading';
      component.messagePosition = 'above';
      fixture.detectChanges();
      
      const message = fixture.debugElement.query(By.css('.loader-message'));
      expect(message.classes['message-above']).toBeTruthy();
    });
  });

  describe('Actions', () => {
    it('should show cancel button when enabled', () => {
      component.showCancel = true;
      component.cancelText = 'Cancel';
      fixture.detectChanges();
      
      const cancelBtn = fixture.debugElement.query(By.css('button[color="warn"]'));
      expect(cancelBtn).toBeTruthy();
      expect(cancelBtn.nativeElement.textContent).toContain('Cancel');
    });

    it('should emit cancel event', () => {
      spyOn(component.cancelled, 'emit');
      component.showCancel = true;
      fixture.detectChanges();
      
      const cancelBtn = fixture.debugElement.query(By.css('button[color="warn"]'));
      cancelBtn.nativeElement.click();
      
      expect(component.cancelled.emit).toHaveBeenCalled();
    });

    it('should display custom actions', () => {
      const action: LoaderAction = {
        id: 'retry',
        label: 'Retry',
        icon: 'refresh',
        color: 'primary'
      };
      component.customActions = [action];
      fixture.detectChanges();
      
      const actionBtn = fixture.debugElement.query(By.css('button[color="primary"]'));
      expect(actionBtn).toBeTruthy();
      expect(actionBtn.nativeElement.textContent).toContain('Retry');
    });

    it('should emit custom action event', () => {
      spyOn(component.actionClicked, 'emit');
      const action: LoaderAction = {
        id: 'retry',
        label: 'Retry'
      };
      component.customActions = [action];
      fixture.detectChanges();
      
      const actionBtn = fixture.debugElement.query(By.css('.loader-actions button:last-child'));
      actionBtn.nativeElement.click();
      
      expect(component.actionClicked.emit).toHaveBeenCalledWith(action);
    });
  });

  describe('Fullscreen Mode', () => {
    it('should show backdrop in fullscreen mode', () => {
      component.fullscreen = true;
      fixture.detectChanges();
      
      const backdrop = fixture.debugElement.query(By.css('.loader-backdrop'));
      expect(backdrop).toBeTruthy();
    });

    it('should not show backdrop in inline mode', () => {
      component.fullscreen = false;
      fixture.detectChanges();
      
      const backdrop = fixture.debugElement.query(By.css('.loader-backdrop'));
      expect(backdrop).toBeNull();
    });

    it('should emit backdrop click when allowBackdropClick is true', () => {
      spyOn(component.backdropClick, 'emit');
      component.fullscreen = true;
      component.allowBackdropClick = true;
      fixture.detectChanges();
      
      const backdrop = fixture.debugElement.query(By.css('.loader-backdrop'));
      backdrop.nativeElement.click();
      
      expect(component.backdropClick.emit).toHaveBeenCalled();
    });

    it('should not emit backdrop click when disabled', () => {
      spyOn(component.backdropClick, 'emit');
      component.fullscreen = true;
      component.allowBackdropClick = false;
      fixture.detectChanges();
      
      component.onBackdropClick();
      
      expect(component.backdropClick.emit).not.toHaveBeenCalled();
    });
  });

  describe('Timer Display', () => {
    it('should display timer when enabled', () => {
      component.showTimer = true;
      component.elapsedTime = 5;
      fixture.detectChanges();
      
      const timer = fixture.debugElement.query(By.css('.loader-timer'));
      expect(timer).toBeTruthy();
      expect(timer.nativeElement.textContent).toContain('0:05');
    });

    it('should format time correctly', () => {
      expect(component.formatTime(0)).toBe('0:00');
      expect(component.formatTime(5)).toBe('0:05');
      expect(component.formatTime(65)).toBe('1:05');
      expect(component.formatTime(3665)).toBe('1:01:05');
    });
  });

  describe('Tips Display', () => {
    it('should display current tip', () => {
      component.tips = ['Tip 1', 'Tip 2'];
      component.currentTip = 'Tip 1';
      fixture.detectChanges();
      
      const tips = fixture.debugElement.query(By.css('.loader-tips'));
      expect(tips).toBeTruthy();
      expect(tips.nativeElement.textContent).toContain('Tip 1');
    });

    it('should not display tips when empty', () => {
      component.tips = [];
      fixture.detectChanges();
      
      const tips = fixture.debugElement.query(By.css('.loader-tips'));
      expect(tips).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const overlay = fixture.debugElement.query(By.css('.loader-overlay'));
      expect(overlay.attributes['aria-busy']).toBe('true');
      expect(overlay.attributes['aria-live']).toBe('polite');
      expect(overlay.attributes['role']).toBe('status');
    });

    it('should announce progress updates', () => {
      component.mode = 'determinate';
      component.progress = 50;
      fixture.detectChanges();
      
      const announcement = fixture.debugElement.query(By.css('.sr-only span'));
      expect(announcement).toBeTruthy();
    });

    it('should have aria-label', () => {
      component.message = 'Custom loading message';
      fixture.detectChanges();
      
      const overlay = fixture.debugElement.query(By.css('.loader-overlay'));
      expect(overlay.attributes['aria-label']).toBeTruthy();
    });
  });

  describe('Cleanup', () => {
    it('should clean up timers on destroy', () => {
      component.showTimer = true;
      component.tips = ['tip1', 'tip2'];
      component.ngOnInit();
      
      spyOn(window, 'clearInterval');
      component.ngOnDestroy();
      
      expect(window.clearInterval).toHaveBeenCalledTimes(2);
    });

    it('should complete destroy subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should use trackBy for skeleton lines', () => {
      const result = component.trackByIndex(5);
      expect(result).toBe(5);
    });

    it('should use trackBy for custom actions', () => {
      const action: LoaderAction = { id: 'test', label: 'Test' };
      const result = component.trackByAction(0, action);
      expect(result).toBe('test');
    });
  });
});
