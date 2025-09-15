import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ShortcutService } from '../../../core/services/shortcut.service';
import * as AuthActions from '../../../store/auth/auth.actions';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let store: MockStore;
  let router: Router;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
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
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const shortcutServiceSpy = jasmine.createSpyObj('ShortcutService', ['add', 'remove']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    translateServiceSpy.instant.and.returnValue('translated text');

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideMockStore({ initialState }),
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ShortcutService, useValue: shortcutServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        AuthService,
        LoadingService,
        ThemeService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    shortcutService = TestBed.inject(ShortcutService) as jasmine.SpyObj<ShortcutService>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;

    spyOn(router, 'navigate');
    spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize all form groups', () => {
      fixture.detectChanges();
      
      expect(component.accountForm).toBeDefined();
      expect(component.profileForm).toBeDefined();
      expect(component.preferencesForm).toBeDefined();
    });

    it('should set default timezone', () => {
      fixture.detectChanges();
      
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      expect(component.preferencesForm.get('timezone')?.value).toBe(timezone);
    });

    it('should load available options', () => {
      fixture.detectChanges();
      
      expect(component.timezones().length).toBeGreaterThan(0);
      expect(component.locales().length).toBe(8);
      expect(component.roles().length).toBe(6);
    });
  });

  describe('Step Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should start at step 0', () => {
      expect(component.currentStep()).toBe(0);
    });

    it('should navigate to next step when valid', () => {
      // Fill account form
      component.accountForm.patchValue({
        email: 'test@example.com',
        username: 'testuser',
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!'
      });
      component.emailAvailable.set(true);
      component.usernameAvailable.set(true);
      
      component.nextStep();
      expect(component.currentStep()).toBe(1);
    });

    it('should not navigate to next step when invalid', () => {
      component.nextStep();
      expect(component.currentStep()).toBe(0);
    });

    it('should navigate to previous step', () => {
      component.currentStep.set(1);
      component.previousStep();
      expect(component.currentStep()).toBe(0);
    });

    it('should not go below step 0', () => {
      component.previousStep();
      expect(component.currentStep()).toBe(0);
    });

    it('should calculate registration progress correctly', () => {
      expect(component.registrationProgress()).toBe(33.33333333333333);
      
      component.currentStep.set(1);
      expect(component.registrationProgress()).toBe(66.66666666666666);
      
      component.currentStep.set(2);
      expect(component.registrationProgress()).toBe(100);
    });
  });

  describe('Account Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate email field', () => {
      const emailControl = component.accountForm.get('email');
      
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBe(true);
      
      emailControl?.setValue('invalid');
      expect(emailControl?.hasError('email')).toBe(true);
      
      emailControl?.setValue('test@tempmail.com');
      expect(emailControl?.hasError('invalidDomain')).toBe(true);
      
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBe(true);
    });

    it('should validate username field', () => {
      const usernameControl = component.accountForm.get('username');
      
      usernameControl?.setValue('');
      expect(usernameControl?.hasError('required')).toBe(true);
      
      usernameControl?.setValue('ab');
      expect(usernameControl?.hasError('minlength')).toBe(true);
      
      usernameControl?.setValue('user name');
      expect(usernameControl?.hasError('pattern')).toBe(true);
      
      usernameControl?.setValue('validuser123');
      expect(usernameControl?.valid).toBe(true);
    });

    it('should validate password requirements', () => {
      const passwordControl = component.accountForm.get('password');
      
      passwordControl?.setValue('password');
      expect(passwordControl?.hasError('uppercase')).toBe(true);
      expect(passwordControl?.hasError('number')).toBe(true);
      expect(passwordControl?.hasError('special')).toBe(true);
      
      passwordControl?.setValue('Password123!');
      expect(passwordControl?.valid).toBe(true);
    });

    it('should validate password match', () => {
      component.accountForm.patchValue({
        password: 'Password123!',
        confirmPassword: 'Different123!'
      });
      
      expect(component.accountForm.hasError('passwordMismatch')).toBe(true);
      expect(component.passwordMatch()).toBe(false);
      
      component.accountForm.patchValue({
        confirmPassword: 'Password123!'
      });
      
      expect(component.accountForm.hasError('passwordMismatch')).toBe(false);
      expect(component.passwordMatch()).toBe(true);
    });

    it('should calculate password strength', () => {
      const passwordControl = component.accountForm.get('password');
      
      passwordControl?.setValue('');
      expect(component.passwordStrength()).toBe(0);
      
      passwordControl?.setValue('password');
      expect(component.passwordStrength()).toBe(1);
      
      passwordControl?.setValue('Password');
      expect(component.passwordStrength()).toBe(2);
      
      passwordControl?.setValue('Password1');
      expect(component.passwordStrength()).toBe(3);
      
      passwordControl?.setValue('Password1!');
      expect(component.passwordStrength()).toBe(4);
      
      passwordControl?.setValue('MyP@ssw0rd123!');
      expect(component.passwordStrength()).toBe(5);
    });
  });

  describe('Profile Form', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate required fields', () => {
      const firstNameControl = component.profileForm.get('firstName');
      const lastNameControl = component.profileForm.get('lastName');
      
      firstNameControl?.setValue('');
      lastNameControl?.setValue('');
      
      expect(firstNameControl?.hasError('required')).toBe(true);
      expect(lastNameControl?.hasError('required')).toBe(true);
      
      firstNameControl?.setValue('John');
      lastNameControl?.setValue('Doe');
      
      expect(firstNameControl?.valid).toBe(true);
      expect(lastNameControl?.valid).toBe(true);
    });

    it('should validate phone number format', () => {
      const phoneControl = component.profileForm.get('phoneNumber');
      
      phoneControl?.setValue('invalid');
      expect(phoneControl?.hasError('pattern')).toBe(true);
      
      phoneControl?.setValue('+1234567890');
      expect(phoneControl?.valid).toBe(true);
    });

    it('should validate bio length', () => {
      const bioControl = component.profileForm.get('bio');
      const longBio = 'a'.repeat(501);
      
      bioControl?.setValue(longBio);
      expect(bioControl?.hasError('maxlength')).toBe(true);
      
      bioControl?.setValue('Valid bio');
      expect(bioControl?.valid).toBe(true);
    });
  });

  describe('Preferences Form', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require timezone and locale', () => {
      const timezoneControl = component.preferencesForm.get('timezone');
      const localeControl = component.preferencesForm.get('locale');
      
      timezoneControl?.setValue('');
      expect(timezoneControl?.hasError('required')).toBe(true);
      
      timezoneControl?.setValue('America/New_York');
      expect(timezoneControl?.valid).toBe(true);
      
      expect(localeControl?.value).toBe('en');
      expect(localeControl?.valid).toBe(true);
    });

    it('should require terms and privacy acceptance', () => {
      const termsControl = component.preferencesForm.get('termsAccepted');
      const privacyControl = component.preferencesForm.get('privacyAccepted');
      
      expect(termsControl?.hasError('required')).toBe(true);
      expect(privacyControl?.hasError('required')).toBe(true);
      
      termsControl?.setValue(true);
      privacyControl?.setValue(true);
      
      expect(termsControl?.valid).toBe(true);
      expect(privacyControl?.valid).toBe(true);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
      
      // Fill all forms with valid data
      component.accountForm.patchValue({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
      
      component.profileForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        company: 'Test Company',
        role: 'Developer'
      });
      
      component.preferencesForm.patchValue({
        timezone: 'America/New_York',
        locale: 'en',
        termsAccepted: true,
        privacyAccepted: true
      });
      
      component.emailAvailable.set(true);
      component.usernameAvailable.set(true);
      component.currentStep.set(2);
    });

    it('should submit valid registration data', async () => {
      await component.onSubmit();
      
      expect(store.dispatch).toHaveBeenCalled();
      const action = (store.dispatch as jasmine.Spy).calls.mostRecent().args[0];
      expect(action.type).toContain('Register');
    });

    it('should show success message on submission', async () => {
      await component.onSubmit();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'translated text',
        'OK',
        { duration: 5000 }
      );
    });

    it('should move to completion step after submission', async () => {
      await component.onSubmit();
      
      expect(component.currentStep()).toBe(3);
    });

    it('should not submit if not on step 2', async () => {
      component.currentStep.set(1);
      
      await component.onSubmit();
      
      expect(store.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('Social Registration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle Google registration', async () => {
      await component.socialRegister('google');
      
      expect(component.socialRegistrationLoading()).toBe('google');
      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.socialLogin({ provider: 'google' })
      );
    });

    it('should handle GitHub registration', async () => {
      await component.socialRegister('github');
      
      expect(component.socialRegistrationLoading()).toBe('github');
      expect(store.dispatch).toHaveBeenCalledWith(
        AuthActions.socialLogin({ provider: 'github' })
      );
    });
  });

  describe('Profile Picture Upload', () => {
    it('should handle valid image upload', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [file] } } as any;
      
      spyOn(FileReader.prototype, 'readAsDataURL');
      
      component.onProfilePictureChange(event);
      
      expect(FileReader.prototype.readAsDataURL).toHaveBeenCalledWith(file);
    });

    it('should reject non-image files', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      const event = { target: { files: [file] } } as any;
      
      component.onProfilePictureChange(event);
      
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should reject large files', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [largeFile] } } as any;
      
      component.onProfilePictureChange(event);
      
      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should set up keyboard shortcuts', () => {
      fixture.detectChanges();
      
      expect(shortcutService.add).toHaveBeenCalledWith('alt+n', jasmine.any(Function));
      expect(shortcutService.add).toHaveBeenCalledWith('alt+p', jasmine.any(Function));
      expect(shortcutService.add).toHaveBeenCalledWith('ctrl+enter', jasmine.any(Function));
    });

    it('should remove keyboard shortcuts on destroy', () => {
      fixture.detectChanges();
      
      component.ngOnDestroy();
      
      expect(shortcutService.remove).toHaveBeenCalledWith('alt+n');
      expect(shortcutService.remove).toHaveBeenCalledWith('alt+p');
      expect(shortcutService.remove).toHaveBeenCalledWith('ctrl+enter');
    });
  });

  describe('Navigation', () => {
    it('should navigate to login', () => {
      component.navigateToLogin();
      
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should redirect to dashboard after completion', fakeAsync(() => {
      component.currentStep.set(3);
      tick(3000);
      
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    }));
  });
});
