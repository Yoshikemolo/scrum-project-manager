import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
<<<<<<< HEAD
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
=======
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';
>>>>>>> feature/SPM-016-projects-tasks

import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
<<<<<<< HEAD
import { ThemeService } from '../../../core/services/theme.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { ShortcutService } from '../../../core/services/shortcut.service';
import * as AuthActions from '../../../store/auth/auth.actions';
=======
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { AuthActions } from '../../../store/auth/auth.actions';
>>>>>>> feature/SPM-016-projects-tasks

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
<<<<<<< HEAD
  let store: MockStore;
  let router: Router;
  let authService: jasmine.SpyObj<AuthService>;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;
  let shortcutService: jasmine.SpyObj<ShortcutService>;
  let translateService: jasmine.SpyObj<TranslateService>;

  const initialState = {
    auth: {
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    }
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'socialLogin']);
    const localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', [
=======
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
>>>>>>> feature/SPM-016-projects-tasks
      'getItem',
      'setItem',
      'removeItem'
    ]);
<<<<<<< HEAD
    const shortcutServiceSpy = jasmine.createSpyObj('ShortcutService', ['add', 'remove']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant', 'use']);
    translateServiceSpy.currentLang = 'en';
    translateServiceSpy.instant.and.returnValue('translated text');
=======

    storeSpy.select.and.returnValue(of(null));
>>>>>>> feature/SPM-016-projects-tasks

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
<<<<<<< HEAD
        BrowserAnimationsModule,
        MatSnackBarModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideMockStore({ initialState }),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: ShortcutService, useValue: shortcutServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        LoadingService,
        ThemeService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    localStorageService = TestBed.inject(LocalStorageService) as jasmine.SpyObj<LocalStorageService>;
    shortcutService = TestBed.inject(ShortcutService) as jasmine.SpyObj<ShortcutService>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;

    spyOn(router, 'navigate');
    spyOn(store, 'dispatch');
=======
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
>>>>>>> feature/SPM-016-projects-tasks
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

<<<<<<< HEAD
  describe('Form Initialization', () => {
    it('should initialize login form with validators', () => {
      fixture.detectChanges();
      
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')).toBeDefined();
      expect(component.loginForm.get('password')).toBeDefined();
      expect(component.loginForm.get('rememberMe')).toBeDefined();
    });

    it('should load saved email if remember me was checked', () => {
      localStorageService.getItem.and.returnValue('test@example.com');
      
      fixture.detectChanges();
      
      expect(component.loginForm.get('email')?.value).toBe('test@example.com');
      expect(component.loginForm.get('rememberMe')?.value).toBe(true);
      expect(component.rememberMe()).toBe(true);
    });

    it('should set up keyboard shortcuts', () => {
      fixture.detectChanges();
      
      expect(shortcutService.add).toHaveBeenCalledWith('ctrl+enter', jasmine.any(Function));
      expect(shortcutService.add).toHaveBeenCalledWith('alt+g', jasmine.any(Function));
      expect(shortcutService.add).toHaveBeenCalledWith('alt+h', jasmine.any(Function));
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
=======
  describe('Form Validation', () => {
    it('should initialize form with empty values', () => {
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
      expect(component.loginForm.get('rememberMe')?.value).toBe(false);
>>>>>>> feature/SPM-016-projects-tasks
    });

    it('should validate email field', () => {
      const emailControl = component.loginForm.get('email');
      
      emailControl?.setValue('');
<<<<<<< HEAD
      expect(emailControl?.hasError('required')).toBe(true);
      
      emailControl?.setValue('invalid');
      expect(emailControl?.hasError('email')).toBe(true);
      
      emailControl?.setValue('test@tempmail.com');
      expect(emailControl?.hasError('invalidDomain')).toBe(true);
      
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBe(true);
=======
      expect(emailControl?.hasError('required')).toBeTruthy();
      
      emailControl?.setValue('invalid');
      expect(emailControl?.hasError('email')).toBeTruthy();
      
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBeTruthy();
>>>>>>> feature/SPM-016-projects-tasks
    });

    it('should validate password field', () => {
      const passwordControl = component.loginForm.get('password');
      
      passwordControl?.setValue('');
<<<<<<< HEAD
      expect(passwordControl?.hasError('required')).toBe(true);
      
      passwordControl?.setValue('short');
      expect(passwordControl?.hasError('minlength')).toBe(true);
      
      passwordControl?.setValue('nouppercaseordigits');
      expect(passwordControl?.hasError('pattern')).toBe(true);
      
      passwordControl?.setValue('ValidPass123');
      expect(passwordControl?.valid).toBe(true);
    });

    it('should calculate password strength correctly', () => {
      const passwordControl = component.loginForm.get('password');
      
      passwordControl?.setValue('');
      expect(component.passwordStrength()).toBe(0);
      
      passwordControl?.setValue('password');
      expect(component.passwordStrength()).toBe(1); // Length >= 8
      
      passwordControl?.setValue('Password');
      expect(component.passwordStrength()).toBe(2); // Has upper and lower
      
      passwordControl?.setValue('Password1');
      expect(component.passwordStrength()).toBe(3); // Has number
      
      passwordControl?.setValue('Password1!');
      expect(component.passwordStrength()).toBe(4); // Has special char
=======
      expect(passwordControl?.hasError('required')).toBeTruthy();
      
      passwordControl?.setValue('short');
      expect(passwordControl?.hasError('minlength')).toBeTruthy();
      
      passwordControl?.setValue('validpassword123');
      expect(passwordControl?.valid).toBeTruthy();
>>>>>>> feature/SPM-016-projects-tasks
    });
  });

  describe('Form Submission', () => {
<<<<<<< HEAD
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not submit if form is invalid', async () => {
      await component.onSubmit();
      
      expect(store.dispatch).not.toHaveBeenCalled();
      expect(component.shakeAnimation()).toBe('shake');
    });

    it('should submit valid form and dispatch login action', async () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'ValidPass123',
        rememberMe: false
      });
      
      await component.onSubmit();
      
      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.login({
          email: 'test@example.com',
          password: 'ValidPass123'
        })
      );
      expect(component.loginAttempts()).toBe(1);
    });

    it('should save email when remember me is checked', async () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'ValidPass123',
        rememberMe: true
      });
      
      await component.onSubmit();
      
      expect(localStorageService.setItem).toHaveBeenCalledWith(
=======
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
>>>>>>> feature/SPM-016-projects-tasks
        'rememberedEmail',
        'test@example.com'
      );
    });

<<<<<<< HEAD
    it('should remove saved email when remember me is unchecked', async () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'ValidPass123',
        rememberMe: false
      });
      
      await component.onSubmit();
      
      expect(localStorageService.removeItem).toHaveBeenCalledWith('rememberedEmail');
    });

    it('should disable form after max login attempts', fakeAsync(() => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'ValidPass123'
      });
      
      // Simulate max attempts
      for (let i = 0; i < 5; i++) {
        component.loginAttempts.update(attempts => attempts + 1);
      }
      
      tick();
      fixture.detectChanges();
      
      expect(component.isLoginDisabled()).toBe(true);
      expect(component.loginForm.disabled).toBe(true);
    }));
  });

  describe('Social Login', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle Google login', async () => {
      await component.socialLogin('google');
      
      expect(component.socialLoginLoading()).toBe('google');
=======
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
>>>>>>> feature/SPM-016-projects-tasks
      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.socialLogin({ provider: 'google' })
      );
    });

<<<<<<< HEAD
    it('should handle GitHub login', async () => {
      await component.socialLogin('github');
      
      expect(component.socialLoginLoading()).toBe('github');
=======
    it('should dispatch social login action for GitHub', () => {
      component.socialLogin('github');
>>>>>>> feature/SPM-016-projects-tasks
      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.socialLogin({ provider: 'github' })
      );
    });
<<<<<<< HEAD

    it('should prevent multiple simultaneous social logins', async () => {
      component.socialLoginLoading.set('google');
      
      await component.socialLogin('github');
      
      expect(store.dispatch).not.toHaveBeenCalled();
=======
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
>>>>>>> feature/SPM-016-projects-tasks
    });
  });

  describe('Navigation', () => {
<<<<<<< HEAD
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to forgot password with email', () => {
      component.loginForm.patchValue({ email: 'test@example.com' });
      
      component.forgotPassword();
      
      expect(router.navigate).toHaveBeenCalledWith(
        ['/auth/forgot-password'],
        { queryParams: { email: 'test@example.com' } }
      );
    });

    it('should navigate to register with email', () => {
      component.loginForm.patchValue({ email: 'test@example.com' });
      
      component.navigateToRegister();
      
      expect(router.navigate).toHaveBeenCalledWith(
        ['/auth/register'],
        { queryParams: { email: 'test@example.com' } }
      );
    });
  });

  describe('UI Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle password visibility', () => {
      expect(component.hidePassword()).toBe(true);
      
      component.togglePasswordVisibility();
      expect(component.hidePassword()).toBe(false);
      
      component.togglePasswordVisibility();
      expect(component.hidePassword()).toBe(true);
    });

    it('should get correct error messages', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setErrors({ required: true });
      emailControl?.markAsTouched();
      
      const errorMessage = component.getErrorMessage('email');
      expect(translateService.instant).toHaveBeenCalledWith(
        'auth.login.errors.email.required'
      );
    });

    it('should get password strength label and color', () => {
      component.loginForm.patchValue({ password: 'ValidPass123!' });
      
      const label = component.getPasswordStrengthLabel();
      const color = component.getPasswordStrengthColor();
      
      expect(translateService.instant).toHaveBeenCalledWith(
        'auth.login.passwordStrength.strong'
      );
      expect(color).toBe('success');
=======
    it('should navigate to dashboard when authenticated', () => {
      store.select.and.returnValue(of(true));
      
      component.ngOnInit();
      
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
>>>>>>> feature/SPM-016-projects-tasks
    });
  });

  describe('Cleanup', () => {
<<<<<<< HEAD
    it('should clean up on destroy', () => {
      fixture.detectChanges();
      
      component.ngOnDestroy();
      
      expect(shortcutService.remove).toHaveBeenCalledWith('ctrl+enter');
      expect(shortcutService.remove).toHaveBeenCalledWith('alt+g');
      expect(shortcutService.remove).toHaveBeenCalledWith('alt+h');
    });
  });
});
=======
    it('should unsubscribe on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
>>>>>>> feature/SPM-016-projects-tasks
