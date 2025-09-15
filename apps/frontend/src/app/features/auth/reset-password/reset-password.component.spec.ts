import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let store: jasmine.SpyObj<Store>;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let activatedRoute: any;

  beforeEach(async () => {
    const storeSpy = jasmine.createSpyObj('Store', ['dispatch', 'select']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'validateResetToken',
      'resetPassword'
    ]);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    activatedRoute = {
      queryParams: of({ token: 'valid-token-123' })
    };

    storeSpy.select.and.returnValue(of(false));
    authServiceSpy.validateResetToken.and.returnValue(Promise.resolve(true));
    authServiceSpy.resetPassword.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [
        ResetPasswordComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: Store, useValue: storeSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: activatedRoute },
        LoadingService
      ]
    }).compileComponents();

    store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Token Validation', () => {
    it('should extract token from query params', () => {
      expect(component.token()).toBe('valid-token-123');
    });

    it('should validate token on init', fakeAsync(() => {
      tick(100);
      expect(authService.validateResetToken).toHaveBeenCalledWith('valid-token-123');
      expect(component.tokenValid()).toBe(true);
    }));

    it('should handle invalid token', fakeAsync(() => {
      authService.validateResetToken.and.returnValue(Promise.resolve(false));
      
      component['validateToken']();
      tick(100);
      
      expect(component.tokenValid()).toBe(false);
      expect(component.tokenExpired()).toBe(true);
    }));

    it('should handle missing token', () => {
      activatedRoute.queryParams = of({});
      
      component.ngOnInit();
      
      expect(component.tokenValid()).toBe(false);
      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Invalid or expired'),
        'Close',
        jasmine.any(Object)
      );
    });
  });

  describe('Form Validation', () => {
    it('should initialize form with validators', () => {
      const passwordControl = component.resetPasswordForm.get('password');
      const confirmPasswordControl = component.resetPasswordForm.get('confirmPassword');

      expect(passwordControl?.hasError('required')).toBeTruthy();
      expect(confirmPasswordControl?.hasError('required')).toBeTruthy();
    });

    it('should validate password strength', () => {
      const passwordControl = component.resetPasswordForm.get('password');
      
      passwordControl?.setValue('weak');
      expect(passwordControl?.hasError('minlength')).toBeTruthy();
      
      passwordControl?.setValue('weakpassword');
      expect(passwordControl?.hasError('passwordStrength')).toBeTruthy();
      
      passwordControl?.setValue('StrongPass123!');
      expect(passwordControl?.valid).toBeTruthy();
    });

    it('should validate password match', () => {
      const passwordControl = component.resetPasswordForm.get('password');
      const confirmPasswordControl = component.resetPasswordForm.get('confirmPassword');
      
      passwordControl?.setValue('Password123!');
      confirmPasswordControl?.setValue('DifferentPass123!');
      
      component.resetPasswordForm.updateValueAndValidity();
      expect(component.resetPasswordForm.hasError('passwordMismatch')).toBeTruthy();
      
      confirmPasswordControl?.setValue('Password123!');
      component.resetPasswordForm.updateValueAndValidity();
      expect(component.resetPasswordForm.hasError('passwordMismatch')).toBeFalsy();
    });
  });

  describe('Password Strength', () => {
    it('should calculate password strength', () => {
      const passwordControl = component.resetPasswordForm.get('password');
      
      passwordControl?.setValue('weak');
      expect(component.passwordStrength()).toBeLessThan(30);
      
      passwordControl?.setValue('MediumPass1');
      expect(component.passwordStrength()).toBeGreaterThan(30);
      expect(component.passwordStrength()).toBeLessThan(60);
      
      passwordControl?.setValue('StrongPass123!');
      expect(component.passwordStrength()).toBeGreaterThanOrEqual(60);
    });

    it('should update password requirements', () => {
      const passwordControl = component.resetPasswordForm.get('password');
      
      passwordControl?.setValue('StrongPass123!');
      
      const lengthReq = component.passwordRequirements.find(r => r.key === 'isLengthValid');
      const upperReq = component.passwordRequirements.find(r => r.key === 'hasUpperCase');
      const lowerReq = component.passwordRequirements.find(r => r.key === 'hasLowerCase');
      const numReq = component.passwordRequirements.find(r => r.key === 'hasNumeric');
      const specialReq = component.passwordRequirements.find(r => r.key === 'hasSpecialChar');
      
      expect(lengthReq?.met).toBeTruthy();
      expect(upperReq?.met).toBeTruthy();
      expect(lowerReq?.met).toBeTruthy();
      expect(numReq?.met).toBeTruthy();
      expect(specialReq?.met).toBeTruthy();
    });

    it('should get password strength color', () => {
      component['passwordStrength'].set(20);
      expect(component.getPasswordStrengthColor()).toBe('warn');
      
      component['passwordStrength'].set(50);
      expect(component.getPasswordStrengthColor()).toBe('accent');
      
      component['passwordStrength'].set(80);
      expect(component.getPasswordStrengthColor()).toBe('primary');
    });

    it('should get password strength label', () => {
      component['passwordStrength'].set(20);
      expect(component.getPasswordStrengthLabel()).toBe('Weak');
      
      component['passwordStrength'].set(50);
      expect(component.getPasswordStrengthLabel()).toBe('Medium');
      
      component['passwordStrength'].set(80);
      expect(component.getPasswordStrengthLabel()).toBe('Strong');
      
      component['passwordStrength'].set(95);
      expect(component.getPasswordStrengthLabel()).toBe('Very Strong');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.resetPasswordForm.patchValue({
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      });
      component['token'].set('valid-token-123');
      component['tokenValid'].set(true);
    });

    it('should not submit with invalid form', async () => {
      component.resetPasswordForm.get('password')?.setValue('');
      
      await component.onSubmit();
      
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });

    it('should not submit with invalid token', async () => {
      component['tokenValid'].set(false);
      
      await component.onSubmit();
      
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });

    it('should reset password with valid form and token', async () => {
      await component.onSubmit();
      
      expect(authService.resetPassword).toHaveBeenCalledWith(
        'valid-token-123',
        'NewPassword123!'
      );
    });

    it('should show success message on successful reset', async () => {
      await component.onSubmit();
      
      expect(component.passwordReset()).toBeTruthy();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Your password has been successfully reset',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should handle reset error', async () => {
      authService.resetPassword.and.returnValue(
        Promise.reject(new Error('Reset failed'))
      );
      
      await component.onSubmit();
      
      expect(component.passwordReset()).toBeFalsy();
      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to reset password'),
        'Close',
        jasmine.any(Object)
      );
    });
  });

  describe('Redirect Countdown', () => {
    it('should start countdown after successful reset', fakeAsync(() => {
      component['handleSuccessfulReset']();
      
      expect(component.redirectCountdown()).toBe(5);
      
      tick(1000);
      expect(component.redirectCountdown()).toBe(4);
      
      tick(4000);
      expect(component.redirectCountdown()).toBe(0);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    }));
  });

  describe('Navigation', () => {
    it('should navigate to forgot password for new link', () => {
      component.requestNewLink();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/forgot-password']);
    });
  });

  describe('Helper Methods', () => {
    it('should toggle password visibility', () => {
      expect(component.hidePassword()).toBeTruthy();
      
      component.togglePasswordVisibility();
      expect(component.hidePassword()).toBeFalsy();
      
      component.togglePasswordVisibility();
      expect(component.hidePassword()).toBeTruthy();
    });

    it('should toggle confirm password visibility', () => {
      expect(component.hideConfirmPassword()).toBeTruthy();
      
      component.toggleConfirmPasswordVisibility();
      expect(component.hideConfirmPassword()).toBeFalsy();
      
      component.toggleConfirmPasswordVisibility();
      expect(component.hideConfirmPassword()).toBeTruthy();
    });

    it('should check if submit is disabled', () => {
      // Invalid form
      expect(component.isSubmitDisabled()).toBeTruthy();
      
      // Valid form and token
      component.resetPasswordForm.patchValue({
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
      component['tokenValid'].set(true);
      expect(component.isSubmitDisabled()).toBeFalsy();
      
      // Loading state
      component['isLoading'].set(true);
      expect(component.isSubmitDisabled()).toBeTruthy();
      
      // Password already reset
      component['isLoading'].set(false);
      component['passwordReset'].set(true);
      expect(component.isSubmitDisabled()).toBeTruthy();
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