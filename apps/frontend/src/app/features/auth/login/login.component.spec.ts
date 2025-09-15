import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { signal } from '@angular/core';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { ShortcutService } from '../../../core/services/shortcut.service';
import * as AuthActions from '../../../store/auth/auth.actions';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
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
      'getItem',
      'setItem',
      'removeItem'
    ]);
    const shortcutServiceSpy = jasmine.createSpyObj('ShortcutService', ['add', 'remove']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant', 'use']);
    translateServiceSpy.currentLang = 'en';
    translateServiceSpy.instant.and.returnValue('translated text');

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

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
    });

    it('should validate email field', () => {
      const emailControl = component.loginForm.get('email');
      
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBe(true);
      
      emailControl?.setValue('invalid');
      expect(emailControl?.hasError('email')).toBe(true);
      
      emailControl?.setValue('test@tempmail.com');
      expect(emailControl?.hasError('invalidDomain')).toBe(true);
      
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBe(true);
    });

    it('should validate password field', () => {
      const passwordControl = component.loginForm.get('password');
      
      passwordControl?.setValue('');
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
    });
  });

  describe('Form Submission', () => {
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
        'rememberedEmail',
        'test@example.com'
      );
    });

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
      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.socialLogin({ provider: 'google' })
      );
    });

    it('should handle GitHub login', async () => {
      await component.socialLogin('github');
      
      expect(component.socialLoginLoading()).toBe('github');
      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.socialLogin({ provider: 'github' })
      );
    });

    it('should prevent multiple simultaneous social logins', async () => {
      component.socialLoginLoading.set('google');
      
      await component.socialLogin('github');
      
      expect(store.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
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
    });
  });

  describe('Cleanup', () => {
    it('should clean up on destroy', () => {
      fixture.detectChanges();
      
      component.ngOnDestroy();
      
      expect(shortcutService.remove).toHaveBeenCalledWith('ctrl+enter');
      expect(shortcutService.remove).toHaveBeenCalledWith('alt+g');
      expect(shortcutService.remove).toHaveBeenCalledWith('alt+h');
    });
  });
});
