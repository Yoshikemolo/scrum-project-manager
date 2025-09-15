import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ShortcutService } from '../../../core/services/shortcut.service';
import * as AuthActions from '../../../store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../store/auth/auth.selectors';

/**
 * Register Component
 * 
 * Provides comprehensive user registration with multi-step wizard,
 * advanced validation, and enhanced user experience features.
 * 
 * Features:
 * - Multi-step registration wizard
 * - Real-time form validation
 * - Password strength meter
 * - Email verification
 * - Terms and conditions acceptance
 * - Social registration options
 * - Profile picture upload preview
 * - Timezone and locale selection
 * - Accessibility compliant
 * - Responsive design
 */
@Component({
  selector: 'app-register',
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
    MatStepperModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('bounce', [
      transition(':enter', [
        animate('1s', keyframes([
          style({ transform: 'scale(0.5)', opacity: 0, offset: 0 }),
          style({ transform: 'scale(1.05)', offset: 0.7 }),
          style({ transform: 'scale(0.95)', offset: 0.9 }),
          style({ transform: 'scale(1)', opacity: 1, offset: 1 })
        ]))
      ])
    ])
  ]
})
export class RegisterComponent implements OnInit, OnDestroy {
  // Form groups for each step
  accountForm!: FormGroup;
  profileForm!: FormGroup;
  preferencesForm!: FormGroup;
  
  // UI state signals
  currentStep = signal(0);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  isSubmitting = signal(false);
  emailAvailable = signal<boolean | null>(null);
  usernameAvailable = signal<boolean | null>(null);
  socialRegistrationLoading = signal<string | null>(null);
  profilePicturePreview = signal<string | null>(null);
  
  // Loading and error states
  isLoading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);
  
  // Computed signals
  passwordStrength = computed(() => {
    const password = this.accountForm?.get('password')?.value || '';
    return this.calculatePasswordStrength(password);
  });
  
  passwordMatch = computed(() => {
    const password = this.accountForm?.get('password')?.value;
    const confirmPassword = this.accountForm?.get('confirmPassword')?.value;
    return password && confirmPassword && password === confirmPassword;
  });
  
  registrationProgress = computed(() => {
    const steps = 3;
    return ((this.currentStep() + 1) / steps) * 100;
  });
  
  canProceed = computed(() => {
    switch (this.currentStep()) {
      case 0:
        return this.accountForm?.valid && this.emailAvailable() && this.usernameAvailable();
      case 1:
        return this.profileForm?.valid;
      case 2:
        return this.preferencesForm?.valid;
      default:
        return false;
    }
  });
  
  // Available options
  timezones = signal<string[]>([]);
  locales = signal<{ code: string; name: string }[]>([]);
  roles = signal<string[]>(['Developer', 'Designer', 'Product Manager', 'QA Engineer', 'DevOps', 'Other']);
  
  // Lifecycle
  private destroy$ = new Subject<void>();
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private store: Store,
    private authService: AuthService,
    private loadingService: LoadingService,
    private themeService: ThemeService,
    private shortcutService: ShortcutService,
    private translateService: TranslateService,
    private snackBar: MatSnackBar
  ) {
    // Set up effects
    effect(() => {
      if (this.currentStep() === 3) {
        this.handleRegistrationComplete();
      }
    });
  }
  
  ngOnInit(): void {
    this.initializeForms();
    this.loadOptions();
    this.setupValidationSubscriptions();
    this.setupKeyboardShortcuts();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.removeKeyboardShortcuts();
  }
  
  /**
   * Initialize all form groups
   */
  private initializeForms(): void {
    // Step 1: Account Information
    this.accountForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        this.emailValidator
      ]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_-]+$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordValidator
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
    
    // Step 2: Profile Information
    this.profileForm = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-Z\s-']+$/)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-Z\s-']+$/)
      ]],
      phoneNumber: ['', [
        Validators.pattern(/^[+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/)
      ]],
      dateOfBirth: [''],
      company: [''],
      role: [''],
      bio: ['', Validators.maxLength(500)]
    });
    
    // Step 3: Preferences
    this.preferencesForm = this.fb.group({
      timezone: ['', Validators.required],
      locale: ['en', Validators.required],
      newsletter: [true],
      notifications: [true],
      marketingEmails: [false],
      termsAccepted: [false, Validators.requiredTrue],
      privacyAccepted: [false, Validators.requiredTrue]
    });
  }
  
  /**
   * Custom email validator
   */
  private emailValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;
    
    const domain = email.split('@')[1];
    const blockedDomains = ['tempmail.com', 'throwaway.email', 'guerrillamail.com'];
    
    if (blockedDomains.includes(domain)) {
      return { invalidDomain: true };
    }
    
    // Check for common typos
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const suggestedDomain = this.suggestDomain(domain, commonDomains);
    if (suggestedDomain && suggestedDomain !== domain) {
      return { suggestion: suggestedDomain };
    }
    
    return null;
  }
  
  /**
   * Suggest correct domain for common typos
   */
  private suggestDomain(input: string, domains: string[]): string | null {
    for (const domain of domains) {
      if (this.levenshteinDistance(input, domain) <= 2) {
        return domain;
      }
    }
    return null;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
  
  /**
   * Custom password validator
   */
  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;
    
    const errors: ValidationErrors = {};
    
    if (!/[a-z]/.test(password)) {
      errors['lowercase'] = true;
    }
    if (!/[A-Z]/.test(password)) {
      errors['uppercase'] = true;
    }
    if (!/[0-9]/.test(password)) {
      errors['number'] = true;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors['special'] = true;
    }
    
    // Check for common passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors['common'] = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }
  
  /**
   * Password match validator
   */
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (!password || !confirmPassword) return null;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
  
  /**
   * Calculate password strength
   */
  private calculatePasswordStrength(password: string): number {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character variety
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    // No common patterns
    if (!/(.+)\1{2,}/.test(password)) strength++; // No repeating characters
    if (!/^[a-zA-Z]+$/.test(password) && !/^[0-9]+$/.test(password)) strength++; // Not all letters or numbers
    
    return Math.min(Math.floor(strength / 2), 5);
  }
  
  /**
   * Load available options
   */
  private loadOptions(): void {
    // Load timezones
    this.timezones.set(Intl.supportedValuesOf('timeZone'));
    
    // Load locales
    this.locales.set([
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'it', name: 'Italiano' },
      { code: 'pt', name: 'Português' },
      { code: 'ja', name: '日本語' },
      { code: 'zh', name: '中文' }
    ]);
    
    // Set default timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.preferencesForm.patchValue({ timezone: userTimezone });
  }
  
  /**
   * Set up validation subscriptions
   */
  private setupValidationSubscriptions(): void {
    // Check email availability
    this.accountForm.get('email')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(email => {
        if (email && this.accountForm.get('email')?.valid) {
          this.checkEmailAvailability(email);
        }
      });
    
    // Check username availability
    this.accountForm.get('username')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(username => {
        if (username && this.accountForm.get('username')?.valid) {
          this.checkUsernameAvailability(username);
        }
      });
  }
  
  /**
   * Check email availability
   */
  private async checkEmailAvailability(email: string): Promise<void> {
    // Simulate API call
    this.emailAvailable.set(null);
    setTimeout(() => {
      const isAvailable = !email.includes('taken');
      this.emailAvailable.set(isAvailable);
      
      if (!isAvailable) {
        this.accountForm.get('email')?.setErrors({ emailTaken: true });
      }
    }, 1000);
  }
  
  /**
   * Check username availability
   */
  private async checkUsernameAvailability(username: string): Promise<void> {
    // Simulate API call
    this.usernameAvailable.set(null);
    setTimeout(() => {
      const isAvailable = !username.includes('taken');
      this.usernameAvailable.set(isAvailable);
      
      if (!isAvailable) {
        this.accountForm.get('username')?.setErrors({ usernameTaken: true });
      }
    }, 1000);
  }
  
  /**
   * Set up keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    this.shortcutService.add('alt+n', () => {
      if (this.canProceed()) {
        this.nextStep();
      }
    });
    
    this.shortcutService.add('alt+p', () => {
      this.previousStep();
    });
    
    this.shortcutService.add('ctrl+enter', () => {
      if (this.currentStep() === 2 && this.canProceed()) {
        this.onSubmit();
      }
    });
  }
  
  /**
   * Remove keyboard shortcuts
   */
  private removeKeyboardShortcuts(): void {
    this.shortcutService.remove('alt+n');
    this.shortcutService.remove('alt+p');
    this.shortcutService.remove('ctrl+enter');
  }
  
  /**
   * Navigate to next step
   */
  nextStep(): void {
    if (this.canProceed() && this.currentStep() < 2) {
      this.currentStep.update(step => step + 1);
    }
  }
  
  /**
   * Navigate to previous step
   */
  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(step => step - 1);
    }
  }
  
  /**
   * Go to specific step
   */
  goToStep(step: number): void {
    if (step >= 0 && step <= this.currentStep()) {
      this.currentStep.set(step);
    }
  }
  
  /**
   * Handle profile picture upload
   */
  onProfilePictureChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        this.snackBar.open(
          this.translateService.instant('auth.register.errors.invalidImage'),
          'OK',
          { duration: 3000 }
        );
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.snackBar.open(
          this.translateService.instant('auth.register.errors.imageTooLarge'),
          'OK',
          { duration: 3000 }
        );
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profilePicturePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }
  
  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    if (!this.canProceed() || this.currentStep() !== 2) {
      return;
    }
    
    this.isSubmitting.set(true);
    
    const registrationData = {
      ...this.accountForm.value,
      ...this.profileForm.value,
      ...this.preferencesForm.value,
      profilePicture: this.profilePicturePreview()
    };
    
    // Remove confirmPassword from data
    delete registrationData.confirmPassword;
    
    try {
      // Dispatch registration action
      this.store.dispatch(AuthActions.register(registrationData));
      
      // Show success message
      this.snackBar.open(
        this.translateService.instant('auth.register.success'),
        'OK',
        { duration: 5000 }
      );
      
      // Move to completion step
      this.currentStep.set(3);
    } catch (error) {
      console.error('Registration error:', error);
      this.snackBar.open(
        this.translateService.instant('auth.register.error'),
        'OK',
        { duration: 5000 }
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
  
  /**
   * Handle social registration
   */
  async socialRegister(provider: 'google' | 'github'): Promise<void> {
    if (this.socialRegistrationLoading()) return;
    
    this.socialRegistrationLoading.set(provider);
    
    try {
      this.store.dispatch(AuthActions.socialLogin({ provider }));
    } catch (error) {
      console.error(`${provider} registration error:`, error);
    } finally {
      setTimeout(() => {
        this.socialRegistrationLoading.set(null);
      }, 1000);
    }
  }
  
  /**
   * Handle registration completion
   */
  private handleRegistrationComplete(): void {
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 3000);
  }
  
  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.hidePassword.update(hide => !hide);
    } else {
      this.hideConfirmPassword.update(hide => !hide);
    }
  }
  
  /**
   * Navigate to login
   */
  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
  
  /**
   * Get error message for form field
   */
  getErrorMessage(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';
    
    const errors = control.errors;
    const errorKey = Object.keys(errors)[0];
    
    return this.translateService.instant(
      `auth.register.errors.${fieldName}.${errorKey}`,
      errors[errorKey]
    );
  }
  
  /**
   * Get password strength label
   */
  getPasswordStrengthLabel(): string {
    const strength = this.passwordStrength();
    const labels = ['', 'veryWeak', 'weak', 'fair', 'good', 'strong'];
    return this.translateService.instant(`auth.register.passwordStrength.${labels[strength]}`);
  }
  
  /**
   * Get password strength color
   */
  getPasswordStrengthColor(): string {
    const strength = this.passwordStrength();
    const colors = ['', 'error', 'warn', 'accent', 'primary', 'success'];
    return colors[strength];
  }
  
  /**
   * Open terms and conditions
   */
  openTerms(): void {
    window.open('/legal/terms', '_blank');
  }
  
  /**
   * Open privacy policy
   */
  openPrivacy(): void {
    window.open('/legal/privacy', '_blank');
  }
}
