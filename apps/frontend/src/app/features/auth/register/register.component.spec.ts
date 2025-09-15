import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { AuthActions } from '../../../store/auth/auth.actions';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let store: jasmine.SpyObj<Store>;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const storeSpy = jasmine.createSpyObj('Store', ['dispatch', 'select']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['checkEmailAvailability']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    storeSpy.select.and.returnValue(of(null));
    authServiceSpy.checkEmailAvailability.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
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

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize all three forms', () => {
      expect(component.accountForm).toBeDefined();
      expect(component.profileForm).toBeDefined();
      expect(component.preferencesForm).toBeDefined();
    });

    it('should initialize account form with validators', () => {
      const emailControl = component.accountForm.get('email');
      const passwordControl = component.accountForm.get('password');
      const confirmPasswordControl = component.accountForm.get('confirmPassword');

      expect(emailControl?.hasError('required')).toBeTruthy();
      expect(passwordControl?.hasError('required')).toBeTruthy();
      expect(confirmPasswordControl?.hasError('required')).toBeTruthy();
    });

    it('should initialize profile form with validators', () => {
      const firstNameControl = component.profileForm.get('firstName');
      const lastNameControl = component.profileForm.get('lastName');
      const roleControl = component.profileForm.get('role');

      expect(firstNameControl?.hasError('required')).toBeTruthy();
      expect(lastNameControl?.hasError('required')).toBeTruthy();
      expect(roleControl?.hasError('required')).toBeTruthy();
    });

    it('should initialize preferences form with default values', () => {
      expect(component.preferencesForm.get('language')?.value).toBe('en');
      expect(component.preferencesForm.get('timezone')?.value).toBe('UTC');
      expect(component.preferencesForm.get('emailNotifications')?.value).toBe(true);
      expect(component.preferencesForm.get('pushNotifications')?.value).toBe(true);
      expect(component.preferencesForm.get('marketingEmails')?.value).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('should validate email format', () => {
      const emailControl = component.accountForm.get('email');
      
      emailControl?.setValue('invalid');
      expect(emailControl?.hasError('email')).toBeTruthy();
      
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBeTruthy();
    });

    it('should check email availability', async () => {
      const emailControl = component.accountForm.get('email');
      emailControl?.setValue('test@example.com');
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      expect(authService.checkEmailAvailability).toHaveBeenCalledWith('test@example.com');
      expect(component.emailAvailable()).toBe(true);
    });

    it('should mark email as taken if not available', async () => {
      authService.checkEmailAvailability.and.returnValue(Promise.resolve(false));
      
      const emailControl = component.accountForm.get('email');
      emailControl?.setValue('taken@example.com');
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      expect(component.emailAvailable()).toBe(false);
      expect(emailControl?.hasError('emailTaken')).toBeTruthy();
    });
  });

  describe('Password Validation', () => {
    it('should validate password strength', () => {
      const passwordControl = component.accountForm.get('password');
      
      passwordControl?.setValue('weak');
      expect(passwordControl?.hasError('minlength')).toBeTruthy();
      
      passwordControl?.setValue('weakpassword');
      expect(passwordControl?.hasError('passwordStrength')).toBeTruthy();
      
      passwordControl?.setValue('StrongPass123!');
      expect(passwordControl?.valid).toBeTruthy();
    });

    it('should calculate password strength', () => {
      const passwordControl = component.accountForm.get('password');
      
      passwordControl?.setValue('weak');
      expect(component.passwordStrength()).toBeLessThan(30);
      
      passwordControl?.setValue('MediumPass1');
      expect(component.passwordStrength()).toBeGreaterThan(30);
      expect(component.passwordStrength()).toBeLessThan(60);
      
      passwordControl?.setValue('StrongPass123!');
      expect(component.passwordStrength()).toBeGreaterThanOrEqual(60);
    });

    it('should validate password match', () => {
      const passwordControl = component.accountForm.get('password');
      const confirmPasswordControl = component.accountForm.get('confirmPassword');
      
      passwordControl?.setValue('Password123!');
      confirmPasswordControl?.setValue('DifferentPass123!');
      
      component.accountForm.updateValueAndValidity();
      expect(component.accountForm.hasError('passwordMismatch')).toBeTruthy();
      
      confirmPasswordControl?.setValue('Password123!');
      component.accountForm.updateValueAndValidity();
      expect(component.accountForm.hasError('passwordMismatch')).toBeFalsy();
    });
  });

  describe('Step Navigation', () => {
    it('should start at step 0', () => {
      expect(component.currentStep()).toBe(0);
    });

    it('should not proceed to next step with invalid form', () => {
      component.nextStep();
      expect(component.currentStep()).toBe(0);
    });

    it('should proceed to next step with valid form', () => {
      // Fill account form
      component.accountForm.patchValue({
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
      component.emailAvailable.set(true);
      
      component.nextStep();
      expect(component.currentStep()).toBe(1);
    });

    it('should go back to previous step', () => {
      component.currentStep.set(1);
      component.previousStep();
      expect(component.currentStep()).toBe(0);
    });

    it('should not go back from first step', () => {
      component.currentStep.set(0);
      component.previousStep();
      expect(component.currentStep()).toBe(0);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Fill all forms with valid data
      component.accountForm.patchValue({
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
      component.emailAvailable.set(true);

      component.profileForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        company: 'Test Company',
        role: 'developer'
      });

      component.preferencesForm.patchValue({
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
        terms: true,
        privacy: true
      });
    });

    it('should dispatch register action with valid data', () => {
      component.onSubmit();

      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.register({
          userData: jasmine.objectContaining({
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'developer'
          })
        })
      );
    });

    it('should not submit with invalid forms', () => {
      component.accountForm.get('email')?.setValue('');
      component.onSubmit();

      expect(store.dispatch).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Please fill in all required fields correctly',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should include preferences in registration data', () => {
      component.onSubmit();

      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.register({
          userData: jasmine.objectContaining({
            preferences: jasmine.objectContaining({
              language: 'en',
              timezone: 'UTC',
              emailNotifications: true,
              pushNotifications: true,
              marketingEmails: false
            })
          })
        })
      );
    });
  });

  describe('Social Registration', () => {
    it('should dispatch social login action for Google', () => {
      component.socialRegister('google');
      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.socialLogin({ provider: 'google' })
      );
    });

    it('should dispatch social login action for GitHub', () => {
      component.socialRegister('github');
      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.socialLogin({ provider: 'github' })
      );
    });
  });

  describe('Error Handling', () => {
    it('should display registration error', () => {
      component['handleRegistrationError']('Email already exists');
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Registration failed: Email already exists',
        'Close',
        jasmine.any(Object)
      );
    });
  });

  describe('Navigation', () => {
    it('should navigate to dashboard when authenticated', () => {
      store.select.and.returnValue(of(true));
      
      component.ngOnInit();
      
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
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