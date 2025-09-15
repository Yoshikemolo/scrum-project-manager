import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let store: jasmine.SpyObj<Store>;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const storeSpy = jasmine.createSpyObj('Store', ['dispatch', 'select']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['requestPasswordReset']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    storeSpy.select.and.returnValue(of(false));
    authServiceSpy.requestPasswordReset.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [
        ForgotPasswordComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: Store, useValue: storeSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        LoadingService
      ]
    }).compileComponents();

    store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    
    // Clear localStorage before each test
    localStorage.clear();
    
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should initialize form with empty email', () => {
      expect(component.forgotPasswordForm.get('email')?.value).toBe('');
    });

    it('should validate email field', () => {
      const emailControl = component.forgotPasswordForm.get('email');
      
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBeTruthy();
      
      emailControl?.setValue('invalid');
      expect(emailControl?.hasError('email')).toBeTruthy();
      
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    it('should not submit if form is invalid', async () => {
      await component.onSubmit();
      expect(authService.requestPasswordReset).not.toHaveBeenCalled();
    });

    it('should call authService when form is valid', async () => {
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });

      await component.onSubmit();

      expect(authService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });

    it('should show success message on successful submission', async () => {
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });

      await component.onSubmit();

      expect(component.emailSent()).toBeTruthy();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Password reset instructions have been sent to your email',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should handle submission error', async () => {
      authService.requestPasswordReset.and.returnValue(
        Promise.reject(new Error('Network error'))
      );

      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });

      await component.onSubmit();

      expect(component.emailSent()).toBeFalsy();
      expect(component.attempts()).toBe(1);
    });
  });

  describe('Rate Limiting', () => {
    it('should track attempts', async () => {
      authService.requestPasswordReset.and.returnValue(
        Promise.reject(new Error('Error'))
      );

      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });

      await component.onSubmit();
      expect(component.attempts()).toBe(1);

      await component.onSubmit();
      expect(component.attempts()).toBe(2);
    });

    it('should block after max attempts', async () => {
      authService.requestPasswordReset.and.returnValue(
        Promise.reject(new Error('Error'))
      );

      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });

      // Exhaust all attempts
      for (let i = 0; i < component.maxAttempts; i++) {
        await component.onSubmit();
      }

      expect(component.resetBlockedUntil()).not.toBeNull();
      expect(localStorage.getItem('resetBlockedUntil')).not.toBeNull();
    });

    it('should show blocked message when blocked', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      component['resetBlockedUntil'].set(futureDate);

      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });

      await component.onSubmit();

      expect(authService.requestPasswordReset).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Password reset is blocked'),
        'Close',
        jasmine.any(Object)
      );
    });
  });

  describe('Resend Email', () => {
    beforeEach(async () => {
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      await component.onSubmit();
    });

    it('should start countdown after sending email', () => {
      expect(component.resendCountdown()).toBe(60);
      expect(component.canResend()).toBeFalsy();
    });

    it('should enable resend after countdown', fakeAsync(() => {
      tick(60000); // 60 seconds
      expect(component.canResend()).toBeTruthy();
      expect(component.resendCountdown()).toBe(0);
    }));

    it('should resend email when allowed', async () => {
      component['canResend'].set(true);
      authService.requestPasswordReset.calls.reset();

      await component.resendEmail();

      expect(authService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
      expect(snackBar.open).toHaveBeenCalledWith(
        'Password reset email has been resent',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should not resend during countdown', async () => {
      component['canResend'].set(false);
      authService.requestPasswordReset.calls.reset();

      await component.resendEmail();

      expect(authService.requestPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('Form Reset', () => {
    it('should reset form and state', () => {
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      component['emailSent'].set(true);
      component['resendCountdown'].set(30);

      component.resetForm();

      expect(component.forgotPasswordForm.get('email')?.value).toBeNull();
      expect(component.emailSent()).toBeFalsy();
      expect(component.canResend()).toBeTruthy();
      expect(component.resendCountdown()).toBe(0);
    });
  });

  describe('Helper Methods', () => {
    it('should get countdown text', () => {
      component['resendCountdown'].set(30);
      expect(component.getCountdownText()).toBe('(30s)');

      component['resendCountdown'].set(0);
      expect(component.getCountdownText()).toBe('');
    });

    it('should check if submit is disabled', () => {
      // Invalid form
      expect(component.isSubmitDisabled()).toBeTruthy();

      // Valid form
      component.forgotPasswordForm.patchValue({
        email: 'test@example.com'
      });
      expect(component.isSubmitDisabled()).toBeFalsy();

      // Loading state
      component['isLoading'].set(true);
      expect(component.isSubmitDisabled()).toBeTruthy();

      // Email sent state
      component['isLoading'].set(false);
      component['emailSent'].set(true);
      expect(component.isSubmitDisabled()).toBeTruthy();

      // Blocked state
      component['emailSent'].set(false);
      component['resetBlockedUntil'].set(new Date());
      expect(component.isSubmitDisabled()).toBeTruthy();
    });
  });

  describe('Error Messages', () => {
    it('should get error message for email', () => {
      const emailControl = component.forgotPasswordForm.get('email');
      
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      expect(component.getErrorMessage('email')).toBe('Email is required');

      emailControl?.setValue('invalid');
      expect(component.getErrorMessage('email')).toBe('Please enter a valid email address');
    });

    it('should check if control has error', () => {
      const emailControl = component.forgotPasswordForm.get('email');
      
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      expect(component.hasError('email')).toBeTruthy();

      emailControl?.setValue('test@example.com');
      expect(component.hasError('email')).toBeFalsy();
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});