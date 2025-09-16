/**
 * Unit tests for ConfirmDialogComponent
 * Tests dialog functionality, user interactions, and animations
 */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogSeverity } from './confirm-dialog.component';
import { By } from '@angular/platform-browser';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;
  let dialogData: ConfirmDialogData;
  
  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    dialogData = {
      title: 'Test Dialog',
      message: 'Test message'
    };
    
    await TestBed.configureTestingModule({
      imports: [
        ConfirmDialogComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  
  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
    
    it('should set default values', () => {
      expect(component.data.confirmText).toBe('Confirm');
      expect(component.data.cancelText).toBe('Cancel');
      expect(component.data.severity).toBe(ConfirmDialogSeverity.INFO);
      expect(component.data.showIcon).toBe(true);
    });
    
    it('should display title and message', () => {
      const titleElement = fixture.debugElement.query(By.css('.confirm-dialog__title'));
      const messageElement = fixture.debugElement.query(By.css('.confirm-dialog__message'));
      
      expect(titleElement.nativeElement.textContent).toBe('Test Dialog');
      expect(messageElement.nativeElement.textContent).toBe('Test message');
    });
    
    it('should apply severity class', () => {
      const dialogElement = fixture.debugElement.query(By.css('.confirm-dialog'));
      expect(dialogElement.nativeElement.classList.contains('confirm-dialog--info')).toBe(true);
    });
  });
  
  describe('Severity Variations', () => {
    it('should display correct icon for each severity', () => {
      const severities = [
        { severity: ConfirmDialogSeverity.INFO, icon: 'info' },
        { severity: ConfirmDialogSeverity.WARNING, icon: 'warning' },
        { severity: ConfirmDialogSeverity.DANGER, icon: 'dangerous' },
        { severity: ConfirmDialogSeverity.SUCCESS, icon: 'check_circle' }
      ];
      
      severities.forEach(({ severity, icon }) => {
        component.data.severity = severity;
        fixture.detectChanges();
        
        expect(component.dialogIcon()).toBe(icon);
      });
    });
    
    it('should use custom icon when provided', () => {
      component.data.icon = 'custom_icon';
      fixture.detectChanges();
      
      expect(component.dialogIcon()).toBe('custom_icon');
    });
    
    it('should return correct button color based on severity', () => {
      component.data.severity = ConfirmDialogSeverity.DANGER;
      expect(component.getConfirmButtonColor()).toBe('warn');
      
      component.data.severity = ConfirmDialogSeverity.SUCCESS;
      expect(component.getConfirmButtonColor()).toBe('primary');
      
      component.data.severity = ConfirmDialogSeverity.INFO;
      expect(component.getConfirmButtonColor()).toBe('primary');
    });
  });
  
  describe('Button Actions', () => {
    it('should close dialog with true on confirm', fakeAsync(() => {
      component.onConfirm();
      tick(300);
      
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    }));
    
    it('should close dialog with false on cancel', () => {
      component.onCancel();
      
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
    
    it('should disable confirm button when processing', () => {
      component.isProcessing.set(true);
      fixture.detectChanges();
      
      expect(component.confirmButtonDisabled()).toBe(true);
    });
    
    it('should not confirm when processing', fakeAsync(() => {
      component.isProcessing.set(true);
      component.onConfirm();
      tick(300);
      
      expect(dialogRef.close).not.toHaveBeenCalled();
    }));
    
    it('should not cancel when processing', () => {
      component.isProcessing.set(true);
      component.onCancel();
      
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });
  
  describe('Input Functionality', () => {
    beforeEach(() => {
      component.data.showInput = true;
      component.data.inputLabel = 'Enter value';
      component.data.inputPlaceholder = 'Type here';
      fixture.detectChanges();
    });
    
    it('should display input field when showInput is true', () => {
      const inputElement = fixture.debugElement.query(By.css('.confirm-dialog__input'));
      const labelElement = fixture.debugElement.query(By.css('.confirm-dialog__input-label'));
      
      expect(inputElement).toBeTruthy();
      expect(labelElement.nativeElement.textContent).toBe('Enter value');
      expect(inputElement.nativeElement.placeholder).toBe('Type here');
    });
    
    it('should update input value on change', () => {
      const inputElement = fixture.debugElement.query(By.css('.confirm-dialog__input'));
      const input = inputElement.nativeElement;
      
      input.value = 'test value';
      input.dispatchEvent(new Event('input'));
      
      expect(component.inputValue()).toBe('test value');
    });
    
    it('should validate input when validator provided', () => {
      component.data.inputValidator = (value: string) => {
        return value.length < 3 ? 'Too short' : null;
      };
      
      const inputElement = fixture.debugElement.query(By.css('.confirm-dialog__input'));
      const input = inputElement.nativeElement;
      
      input.value = 'ab';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      expect(component.inputError()).toBe('Too short');
      
      const errorElement = fixture.debugElement.query(By.css('.confirm-dialog__input-error'));
      expect(errorElement.nativeElement.textContent).toContain('Too short');
    });
    
    it('should disable confirm when input required but empty', () => {
      component.data.requireInput = true;
      component.inputValue.set('');
      fixture.detectChanges();
      
      expect(component.confirmButtonDisabled()).toBe(true);
    });
    
    it('should enable confirm when required input has value', () => {
      component.data.requireInput = true;
      component.inputValue.set('valid input');
      fixture.detectChanges();
      
      expect(component.confirmButtonDisabled()).toBe(false);
    });
    
    it('should return input value on confirm', fakeAsync(() => {
      component.inputValue.set('test value');
      component.onConfirm();
      tick(300);
      
      expect(dialogRef.close).toHaveBeenCalledWith('test value');
    }));
    
    it('should trigger confirm on Enter key in input', () => {
      const inputElement = fixture.debugElement.query(By.css('.confirm-dialog__input'));
      const event = new KeyboardEvent('keypress', { key: 'Enter' });
      
      spyOn(component, 'onConfirm');
      inputElement.nativeElement.dispatchEvent(event);
      
      expect(component.onConfirm).toHaveBeenCalled();
    });
  });
  
  describe('Countdown Functionality', () => {
    it('should start countdown when specified', fakeAsync(() => {
      component.data.countdown = 3;
      component.ngOnInit();
      
      expect(component.countdown()).toBe(3);
      
      tick(1000);
      expect(component.countdown()).toBe(2);
      
      tick(1000);
      expect(component.countdown()).toBe(1);
      
      tick(1000);
      expect(component.countdown()).toBe(0);
    }));
    
    it('should disable confirm button during countdown', fakeAsync(() => {
      component.data.countdown = 2;
      component.ngOnInit();
      
      expect(component.confirmButtonDisabled()).toBe(true);
      
      tick(2000);
      expect(component.confirmButtonDisabled()).toBe(false);
    }));
    
    it('should display countdown in button text', fakeAsync(() => {
      component.data.countdown = 3;
      component.data.confirmText = 'Delete';
      component.ngOnInit();
      
      expect(component.confirmButtonText()).toBe('Delete (3)');
      
      tick(1000);
      expect(component.confirmButtonText()).toBe('Delete (2)');
      
      tick(2000);
      expect(component.confirmButtonText()).toBe('Delete');
    }));
  });
  
  describe('Keyboard Shortcuts', () => {
    it('should confirm on Enter key', () => {
      spyOn(component, 'onConfirm');
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.handleKeyboardEvent(event);
      
      expect(component.onConfirm).toHaveBeenCalled();
    });
    
    it('should cancel on Escape key', () => {
      spyOn(component, 'onCancel');
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardEvent(event);
      
      expect(component.onCancel).toHaveBeenCalled();
    });
    
    it('should confirm on Y key when no input', () => {
      component.data.showInput = false;
      spyOn(component, 'onConfirm');
      
      const event = new KeyboardEvent('keydown', { key: 'y' });
      component.handleKeyboardEvent(event);
      
      expect(component.onConfirm).toHaveBeenCalled();
    });
    
    it('should cancel on N key when no input', () => {
      component.data.showInput = false;
      spyOn(component, 'onCancel');
      
      const event = new KeyboardEvent('keydown', { key: 'n' });
      component.handleKeyboardEvent(event);
      
      expect(component.onCancel).toHaveBeenCalled();
    });
    
    it('should not handle shortcuts when input is focused', () => {
      component.data.showInput = true;
      fixture.detectChanges();
      
      const inputElement = fixture.debugElement.query(By.css('.confirm-dialog__input')).nativeElement;
      inputElement.focus();
      
      spyOn(component, 'onConfirm');
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      Object.defineProperty(document, 'activeElement', {
        value: inputElement,
        configurable: true
      });
      
      component.handleKeyboardEvent(event);
      
      expect(component.onConfirm).not.toHaveBeenCalled();
    });
    
    it('should not cancel on Escape when disableClose is true', () => {
      component.data.disableClose = true;
      spyOn(component, 'onCancel');
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardEvent(event);
      
      expect(component.onCancel).not.toHaveBeenCalled();
    });
  });
  
  describe('Additional Details', () => {
    it('should display details when provided', () => {
      component.data.details = ['Detail 1', 'Detail 2', 'Detail 3'];
      fixture.detectChanges();
      
      const detailItems = fixture.debugElement.queryAll(By.css('.confirm-dialog__detail-item'));
      expect(detailItems.length).toBe(3);
      expect(detailItems[0].nativeElement.textContent).toContain('Detail 1');
      expect(detailItems[1].nativeElement.textContent).toContain('Detail 2');
      expect(detailItems[2].nativeElement.textContent).toContain('Detail 3');
    });
    
    it('should not show details section when empty', () => {
      component.data.details = [];
      fixture.detectChanges();
      
      const detailsSection = fixture.debugElement.query(By.css('.confirm-dialog__details'));
      expect(detailsSection).toBeFalsy();
    });
  });
  
  describe('Loading State', () => {
    it('should show loading indicator when loading is true', () => {
      component.data.loading = true;
      fixture.detectChanges();
      
      const loadingSection = fixture.debugElement.query(By.css('.confirm-dialog__loading'));
      expect(loadingSection).toBeTruthy();
      expect(loadingSection.nativeElement.textContent).toContain('Processing...');
    });
    
    it('should show loading indicator when processing', () => {
      component.isProcessing.set(true);
      fixture.detectChanges();
      
      const loadingSection = fixture.debugElement.query(By.css('.confirm-dialog__loading'));
      expect(loadingSection).toBeTruthy();
    });
    
    it('should show spinner in confirm button when processing', () => {
      component.isProcessing.set(true);
      fixture.detectChanges();
      
      const spinner = fixture.debugElement.query(By.css('.confirm-dialog__button-spinner'));
      expect(spinner).toBeTruthy();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const dialogElement = fixture.debugElement.query(By.css('.confirm-dialog'));
      
      expect(dialogElement.nativeElement.getAttribute('role')).toBe('dialog');
      expect(dialogElement.nativeElement.getAttribute('aria-modal')).toBe('true');
      expect(dialogElement.nativeElement.getAttribute('aria-labelledby')).toBe('dialog-title');
      expect(dialogElement.nativeElement.getAttribute('aria-describedby')).toBe('dialog-message');
    });
    
    it('should have aria-label on buttons', () => {
      const confirmButton = fixture.debugElement.query(By.css('.confirm-dialog__confirm-button'));
      const cancelButton = fixture.debugElement.query(By.css('.confirm-dialog__cancel-button'));
      
      expect(confirmButton).toBeTruthy();
      expect(cancelButton).toBeTruthy();
    });
    
    it('should announce input errors', () => {
      component.data.showInput = true;
      component.inputError.set('Error message');
      fixture.detectChanges();
      
      const errorElement = fixture.debugElement.query(By.css('.confirm-dialog__input-error'));
      expect(errorElement.nativeElement.getAttribute('role')).toBe('alert');
    });
  });
  
  describe('Animations', () => {
    it('should trigger shake animation on validation error', fakeAsync(() => {
      component.data.showInput = true;
      component.data.inputValidator = () => 'Error';
      component.inputValue.set('invalid');
      
      component.onConfirm();
      tick();
      
      expect(component.shakeState()).toBe('shake');
      
      tick(2000);
      expect(component.shakeState()).toBe('idle');
    }));
    
    it('should animate icon for danger severity', fakeAsync(() => {
      component.data.severity = ConfirmDialogSeverity.DANGER;
      component.ngOnInit();
      
      expect(component.iconState()).toBe('idle');
      
      tick(2000);
      expect(component.iconState()).toBe('active');
      
      tick(2000);
      expect(component.iconState()).toBe('idle');
    }));
  });
});
