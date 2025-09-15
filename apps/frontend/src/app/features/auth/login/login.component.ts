import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { ShortcutService } from '../../../core/services/shortcut.service';
import * as AuthActions from '../../../store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../store/auth/auth.selectors';

/**
 * Login Component
 * 
 * Provides comprehensive authentication functionality with social login,
 * form validation, accessibility features, and responsive design.
 * 
 * Features:
 * - Email/password authentication
 * - Social login (Google, GitHub)
 * - Remember me functionality
 * - Password visibility toggle
 * - Form validation with real-time feedback
 * - Loading states and error handling
 * - Keyboard shortcuts
 * - Internationalization support
 * - Responsive design
 * - Accessibility compliant
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('shake', [
      state('shake', style({ transform: 'translateX(0)' })),
      transition('* => shake', [
        animate('600ms', keyframes([
          style({ transform: 'translateX(-10px)', offset: 0.1 }),
          style({ transform: 'translateX(10px)', offset: 0.3 }),
          style({ transform: 'translateX(-10px)', offset: 0.5 }),
          style({ transform: 'translateX(10px)', offset: 0.7 }),
          style({ transform: 'translateX(0)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit, OnDestroy {
  // Form and validation
  loginForm!: FormGroup;
  hidePassword = signal(true);
  rememberMe = signal(false);
  loginAttempts = signal(0);
  maxLoginAttempts = 5;
  
  // Loading and error states
  isLoading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);
  isSubmitting = signal(false);
  shakeAnimation = signal('');
  
  // Social login states
  socialLoginLoading = signal<string | null>(null);
  
  // Computed signals
  isLoginDisabled = computed(() => 
    this.loginAttempts() >= this.maxLoginAttempts || 
    this.isSubmitting()
  );
  
  remainingAttempts = computed(() => 
    Math.max(0, this.maxLoginAttempts - this.loginAttempts())
  );
  
  passwordStrength = computed(() => {
    const password = this.loginForm?.get('password')?.value || '';
    if (password.length === 0) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  });
  
  // Lifecycle
  private destroy$ = new Subject<void>();
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private store: Store,
    private authService: AuthService,
    private loadingService: LoadingService,
    private themeService: ThemeService,
    private localStorageService: LocalStorageService,
    private shortcutService: ShortcutService,
    private translateService: TranslateService
  ) {
    // Set up effects for reactive updates
    effect(() => {
      if (this.loginAttempts() >= this.maxLoginAttempts) {
        this.handleMaxAttemptsReached();
      }
    });
  }
  
  ngOnInit(): void {
    this.initializeForm();
    this.loadSavedCredentials();
    this.setupKeyboardShortcuts();
    this.setupFormSubscriptions();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.removeKeyboardShortcuts();
  }
  
  /**
   * Initialize the login form with validators
   */
  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        this.emailDomainValidator
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
      ]],
      rememberMe: [false]
    });
  }
  
  /**
   * Custom validator for email domain
   */
  private emailDomainValidator(control: AbstractControl): {[key: string]: any} | null {
    const email = control.value;
    if (!email) return null;
    
    const domain = email.split('@')[1];
    const blockedDomains = ['tempmail.com', 'throwaway.email'];
    
    if (blockedDomains.includes(domain)) {
      return { invalidDomain: true };
    }
    return null;
  }
  
  /**
   * Load saved credentials if remember me was checked
   */
  private loadSavedCredentials(): void {
    const savedEmail = this.localStorageService.getItem('rememberedEmail');
    if (savedEmail) {
      this.loginForm.patchValue({ 
        email: savedEmail,
        rememberMe: true 
      });
      this.rememberMe.set(true);
    }
  }
  
  /**
   * Set up keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    this.shortcutService.add('ctrl+enter', () => {
      if (this.loginForm.valid && !this.isLoginDisabled()) {
        this.onSubmit();
      }
    });
    
    this.shortcutService.add('alt+g', () => {
      this.socialLogin('google');
    });
    
    this.shortcutService.add('alt+h', () => {
      this.socialLogin('github');
    });
  }
  
  /**
   * Remove keyboard shortcuts on destroy
   */
  private removeKeyboardShortcuts(): void {
    this.shortcutService.remove('ctrl+enter');
    this.shortcutService.remove('alt+g');
    this.shortcutService.remove('alt+h');
  }
  
  /**
   * Set up form value change subscriptions
   */
  private setupFormSubscriptions(): void {
    // Email validation feedback
    this.loginForm.get('email')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(email => {
        if (email && this.loginForm.get('email')?.valid) {
          this.checkEmailExists(email);
        }
      });
    
    // Remember me toggle
    this.loginForm.get('rememberMe')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(remember => {
        this.rememberMe.set(remember);
      });
  }
  
  /**
   * Check if email exists in system (for better UX)
   */
  private async checkEmailExists(email: string): Promise<void> {
    // This would typically call an API endpoint
    // For now, we'll just simulate it
    console.log('Checking email:', email);
  }
  
  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid || this.isLoginDisabled()) {
      this.markFormGroupTouched(this.loginForm);
      this.shakeForm();
      return;
    }
    
    this.isSubmitting.set(true);
    const { email, password, rememberMe } = this.loginForm.value;
    
    try {
      // Handle remember me
      if (rememberMe) {
        this.localStorageService.setItem('rememberedEmail', email);
      } else {
        this.localStorageService.removeItem('rememberedEmail');
      }
      
      // Dispatch login action
      this.store.dispatch(AuthActions.login({ email, password }));
      
      // Increment login attempts
      this.loginAttempts.update(attempts => attempts + 1);
      
      // Navigate on success (handled by effects)
    } catch (error) {
      console.error('Login error:', error);
      this.shakeForm();
    } finally {
      this.isSubmitting.set(false);
    }
  }
  
  /**
   * Handle social login
   */
  async socialLogin(provider: 'google' | 'github'): Promise<void> {
    if (this.socialLoginLoading()) return;
    
    this.socialLoginLoading.set(provider);
    
    try {
      // Dispatch social login action
      this.store.dispatch(AuthActions.socialLogin({ provider }));
    } catch (error) {
      console.error(`${provider} login error:`, error);
    } finally {
      setTimeout(() => {
        this.socialLoginLoading.set(null);
      }, 1000);
    }
  }
  
  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.hidePassword.update(hide => !hide);
  }
  
  /**
   * Navigate to forgot password
   */
  forgotPassword(): void {
    const email = this.loginForm.get('email')?.value;
    this.router.navigate(['/auth/forgot-password'], {
      queryParams: email ? { email } : {}
    });
  }
  
  /**
   * Navigate to register
   */
  navigateToRegister(): void {
    const email = this.loginForm.get('email')?.value;
    this.router.navigate(['/auth/register'], {
      queryParams: email ? { email } : {}
    });
  }
  
  /**
   * Handle max login attempts reached
   */
  private handleMaxAttemptsReached(): void {
    this.loginForm.disable();
    setTimeout(() => {
      this.loginAttempts.set(0);
      this.loginForm.enable();
    }, 300000); // 5 minutes cooldown
  }
  
  /**
   * Shake form on error
   */
  private shakeForm(): void {
    this.shakeAnimation.set('shake');
    setTimeout(() => {
      this.shakeAnimation.set('');
    }, 600);
  }
  
  /**
   * Mark all form controls as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  /**
   * Get error message for form field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';
    
    const errors = control.errors;
    if (errors['required']) {
      return this.translateService.instant(`auth.login.errors.${fieldName}.required`);
    }
    if (errors['email']) {
      return this.translateService.instant('auth.login.errors.email.invalid');
    }
    if (errors['minlength']) {
      return this.translateService.instant('auth.login.errors.password.minlength');
    }
    if (errors['pattern']) {
      return this.translateService.instant('auth.login.errors.password.pattern');
    }
    if (errors['invalidDomain']) {
      return this.translateService.instant('auth.login.errors.email.invalidDomain');
    }
    
    return '';
  }
  
  /**
   * Get password strength label
   */
  getPasswordStrengthLabel(): string {
    const strength = this.passwordStrength();
    const labels = ['', 'weak', 'fair', 'good', 'strong'];
    return this.translateService.instant(`auth.login.passwordStrength.${labels[strength]}`);
  }
  
  /**
   * Get password strength color
   */
  getPasswordStrengthColor(): string {
    const strength = this.passwordStrength();
    const colors = ['', 'warn', 'accent', 'primary', 'success'];
    return colors[strength];
  }
}
