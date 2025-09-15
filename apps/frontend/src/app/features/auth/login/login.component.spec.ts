import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { AuthActions } from '../../../store/auth/auth.actions';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let store: jasmine.SpyObj<Store>;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let localStorage: jasmine.SpyObj<LocalStorageService>;

  beforeEach(async () => {
    const storeSpy = jasmine.createSpyObj('Store', ['dispatch', 'select']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const localStorageSpy = jasmine.createSpyObj('LocalStorageService', [
      'getItem',
      'setItem',
      'removeItem'
    ]);

    storeSpy.select.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: Store, useValue: storeSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: LocalStorageService, useValue: localStorageSpy },
        LoadingService
      ]
    }).compileComponents();

    store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    localStorage = TestBed.inject(LocalStorageService) as jasmine.SpyObj<LocalStorageService>;

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should initialize form with empty values', () => {
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
      expect(component.loginForm.get('rememberMe')?.value).toBe(false);
    });

    it('should validate email field', () => {
      const emailControl = component.loginForm.get('email');
      
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBeTruthy();
      
      emailControl?.setValue('invalid');
      expect(emailControl?.hasError('email')).toBeTruthy();
      
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBeTruthy();
    });

    it('should validate password field', () => {
      const passwordControl = component.loginForm.get('password');
      
      passwordControl?.setValue('');
      expect(passwordControl?.hasError('required')).toBeTruthy();
      
      passwordControl?.setValue('short');
      expect(passwordControl?.hasError('minlength')).toBeTruthy();
      
      passwordControl?.setValue('validpassword123');
      expect(passwordControl?.valid).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    it('should not submit if form is invalid', () => {
      component.onSubmit();
      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('should dispatch login action when form is valid', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      });

      component.onSubmit();

      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.login({
          credentials: {
            email: 'test@example.com',
            password: 'password123'
          }
        })
      );
    });

    it('should save email when remember me is checked', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      });

      component.onSubmit();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'rememberedEmail',
        'test@example.com'
      );
    });

    it('should remove saved email when remember me is unchecked', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      });

      component.onSubmit();

      expect(localStorage.removeItem).toHaveBeenCalledWith('rememberedEmail');
    });
  });

  describe('Login Attempts', () => {
    it('should track login attempts', () => {
      expect(component.loginAttempts()).toBe(0);
      
      component['handleLoginError']('Invalid credentials');
      expect(component.loginAttempts()).toBe(1);
    });

    it('should block user after max attempts', fakeAsync(() => {
      for (let i = 0; i < component.maxLoginAttempts; i++) {
        component['handleLoginError']('Invalid credentials');
      }

      expect(component.isBlocked()).toBeTruthy();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'loginBlockedUntil',
        jasmine.any(Number)
      );
    }));

    it('should show remaining attempts message', () => {
      component['handleLoginError']('Invalid credentials');
      
      const remaining = component.getRemainingAttempts();
      expect(remaining).toBe(component.maxLoginAttempts - 1);
      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining(`${remaining} attempts remaining`),
        'Close',
        jasmine.any(Object)
      );
    });
  });

  describe('Social Login', () => {
    it('should dispatch social login action for Google', () => {
      component.socialLogin('google');
      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.socialLogin({ provider: 'google' })
      );
    });

    it('should dispatch social login action for GitHub', () => {
      component.socialLogin('github');
      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.socialLogin({ provider: 'github' })
      );
    });
  });

  describe('Password Visibility', () => {
    it('should toggle password visibility', () => {
      expect(component.hidePassword()).toBeTruthy();
      
      component.togglePasswordVisibility();
      expect(component.hidePassword()).toBeFalsy();
      
      component.togglePasswordVisibility();
      expect(component.hidePassword()).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should display error message for invalid email', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid');
      emailControl?.markAsTouched();
      
      const errorMessage = component.getErrorMessage('email');
      expect(errorMessage).toBe('Please enter a valid email address');
    });

    it('should display error message for short password', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('short');
      passwordControl?.markAsTouched();
      
      const errorMessage = component.getErrorMessage('password');
      expect(errorMessage).toBe('Password must be at least 8 characters');
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