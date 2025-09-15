import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectAuthError, selectIsAuthenticated, selectIsLoading } from '../../../store/auth/auth.selectors';
import { RegisterRequest } from '../../../shared/interfaces/auth.interface';

/**
 * Custom validator for password strength
 */
function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumeric = /[0-9]/.test(value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  const isLengthValid = value.length >= 8;

  const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar && isLengthValid;

  if (!passwordValid) {
    return {
      passwordStrength: {
        hasUpperCase,
        hasLowerCase,
        hasNumeric,
        hasSpecialChar,
        isLengthValid
      }
    };
  }

  return null;
}

/**
 * Custom validator for password match
 */
function passwordMatchValidator(group: FormGroup): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  
  if (password !== confirmPassword) {
    group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  
  return null;
}

/**
 * Register component for new user registration
 * Implements multi-step registration with comprehensive validation
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
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatStepperModule,
    MatSelectModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class RegisterComponent implements OnInit, OnDestroy {
  // Dependency injection
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private store = inject(Store);
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);
  private snackBar = inject(MatSnackBar);

  // Component state
  accountForm!: FormGroup;
  profileForm!: FormGroup;
  preferencesForm!: FormGroup;
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  isLoading = signal(false);
  passwordStrength = signal(0);
  emailAvailable = signal<boolean | null>(null);
  currentStep = signal(0);
  
  // Observables
  private destroy$ = new Subject<void>();
  private emailCheck$ = new Subject<string>();
  authError$ = this.store.select(selectAuthError);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);
  loading$ = this.store.select(selectIsLoading);

  // Configuration
  roles = [
    { value: 'developer', label: 'Developer' },
    { value: 'scrum_master', label: 'Scrum Master' },
    { value: 'product_owner', label: 'Product Owner' },
    { value: 'stakeholder', label: 'Stakeholder' },
    { value: 'designer', label: 'Designer' },
    { value: 'tester', label: 'QA Tester' }
  ];

  timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Australia/Sydney', label: 'Sydney' }
  ];

  // Error messages
  errorMessages = {
    email: {
      required: 'Email is required',
      email: 'Please enter a valid email address',
      pattern: 'Please enter a valid email format',
      emailTaken: 'This email is already registered'
    },
    password: {
      required: 'Password is required',
      minlength: 'Password must be at least 8 characters',
      passwordStrength: 'Password must contain uppercase, lowercase, number and special character'
    },
    confirmPassword: {
      required: 'Please confirm your password',
      passwordMismatch: 'Passwords do not match'
    },
    firstName: {
      required: 'First name is required',
      minlength: 'First name must be at least 2 characters',
      pattern: 'First name can only contain letters'
    },
    lastName: {
      required: 'Last name is required',
      minlength: 'Last name must be at least 2 characters',
      pattern: 'Last name can only contain letters'
    },
    company: {
      minlength: 'Company name must be at least 2 characters'
    },
    role: {
      required: 'Please select your role'
    },
    terms: {
      required: 'You must accept the terms and conditions'
    }
  };

  ngOnInit(): void {
    this.initializeForms();
    this.setupEmailAvailabilityCheck();
    this.subscribeToAuthState();
    this.setupPasswordStrengthMonitor();
    
    // Check if user is already authenticated
    this.isAuthenticated$.pipe(takeUntil(this.destroy$)).subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize all form groups
   */
  private initializeForms(): void {
    // Account Information Form
    this.accountForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128),
        passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });

    // Profile Information Form
    this.profileForm = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-Z\\s-\']+$')
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-Z\\s-\']+$')
      ]],
      phone: ['', [
        Validators.pattern('^[\\+]?[(]?[0-9]{1,4}[)]?[-\\s\\.]?[(]?[0-9]{1,4}[)]?[-\\s\\.]?[0-9]{1,9}$')
      ]],
      company: ['', [
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      role: ['', [Validators.required]]
    });

    // Preferences Form
    this.preferencesForm = this.fb.group({
      language: ['en'],
      timezone: ['UTC'],
      emailNotifications: [true],
      pushNotifications: [true],
      marketingEmails: [false],
      terms: [false, [Validators.requiredTrue]],
      privacy: [false, [Validators.requiredTrue]]
    });
  }

  /**
   * Setup email availability check with debounce
   */
  private setupEmailAvailabilityCheck(): void {
    this.emailCheck$
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

    this.accountForm.get('email')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(email => {
        this.emailAvailable.set(null);
        this.emailCheck$.next(email);
      });
  }

  /**
   * Check if email is available
   */
  private async checkEmailAvailability(email: string): Promise<void> {
    try {
      const available = await this.authService.checkEmailAvailability(email);
      this.emailAvailable.set(available);
      
      if (!available) {
        this.accountForm.get('email')?.setErrors({ emailTaken: true });
      }
    } catch (error) {
      console.error('Error checking email availability:', error);
    }
  }

  /**
   * Setup password strength monitor
   */
  private setupPasswordStrengthMonitor(): void {
    this.accountForm.get('password')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(password => {
        this.calculatePasswordStrength(password);
      });
  }

  /**
   * Calculate password strength
   */
  private calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength.set(0);
      return;
    }

    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (password.length >= 16) strength += 10;
    
    // Character type checks
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;
    
    this.passwordStrength.set(Math.min(100, strength));
  }

  /**
   * Subscribe to authentication state changes
   */
  private subscribeToAuthState(): void {
    this.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.isLoading.set(loading);
    });

    this.authError$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      if (error) {
        this.handleRegistrationError(error);
      }
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.accountForm.invalid || this.profileForm.invalid || this.preferencesForm.invalid) {
      this.markAllFormsAsTouched();
      this.showValidationError();
      return;
    }

    const registerRequest: RegisterRequest = {
      email: this.accountForm.get('email')?.value,
      password: this.accountForm.get('password')?.value,
      firstName: this.profileForm.get('firstName')?.value,
      lastName: this.profileForm.get('lastName')?.value,
      phone: this.profileForm.get('phone')?.value,
      company: this.profileForm.get('company')?.value,
      role: this.profileForm.get('role')?.value,
      preferences: {
        language: this.preferencesForm.get('language')?.value,
        timezone: this.preferencesForm.get('timezone')?.value,
        emailNotifications: this.preferencesForm.get('emailNotifications')?.value,
        pushNotifications: this.preferencesForm.get('pushNotifications')?.value,
        marketingEmails: this.preferencesForm.get('marketingEmails')?.value
      }
    };

    this.store.dispatch(AuthActions.register({ userData: registerRequest }));
  }

  /**
   * Handle registration errors
   */
  private handleRegistrationError(error: string): void {
    this.snackBar.open(
      `Registration failed: ${error}`,
      'Close',
      {
        duration: 5000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );
  }

  /**
   * Show validation error message
   */
  private showValidationError(): void {
    this.snackBar.open(
      'Please fill in all required fields correctly',
      'Close',
      {
        duration: 3000,
        panelClass: ['warning-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );
  }

  /**
   * Mark all forms as touched
   */
  private markAllFormsAsTouched(): void {
    this.markFormGroupTouched(this.accountForm);
    this.markFormGroupTouched(this.profileForm);
    this.markFormGroupTouched(this.preferencesForm);
  }

  /**
   * Mark form group as touched
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
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.hidePassword.update(hide => !hide);
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update(hide => !hide);
  }

  /**
   * Handle social registration
   */
  socialRegister(provider: 'google' | 'github'): void {
    this.store.dispatch(AuthActions.socialLogin({ provider }));
  }

  /**
   * Get error message for form control
   */
  getErrorMessage(formName: string, controlName: string): string {
    let form: FormGroup;
    
    switch (formName) {
      case 'account':
        form = this.accountForm;
        break;
      case 'profile':
        form = this.profileForm;
        break;
      case 'preferences':
        form = this.preferencesForm;
        break;
      default:
        return '';
    }

    const control = form.get(controlName);
    if (control?.errors && control.touched) {
      const errors = this.errorMessages[controlName as keyof typeof this.errorMessages];
      const errorKey = Object.keys(control.errors)[0];
      return errors?.[errorKey as keyof typeof errors] || 'Invalid input';
    }
    return '';
  }

  /**
   * Check if form control has error
   */
  hasError(formName: string, controlName: string): boolean {
    let form: FormGroup;
    
    switch (formName) {
      case 'account':
        form = this.accountForm;
        break;
      case 'profile':
        form = this.profileForm;
        break;
      case 'preferences':
        form = this.preferencesForm;
        break;
      default:
        return false;
    }

    const control = form.get(controlName);
    return !!(control?.invalid && control?.touched);
  }

  /**
   * Get password strength color
   */
  getPasswordStrengthColor(): string {
    const strength = this.passwordStrength();
    if (strength < 30) return 'warn';
    if (strength < 60) return 'accent';
    return 'primary';
  }

  /**
   * Get password strength label
   */
  getPasswordStrengthLabel(): string {
    const strength = this.passwordStrength();
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Medium';
    if (strength < 90) return 'Strong';
    return 'Very Strong';
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
   * Navigate to next step
   */
  nextStep(): void {
    if (this.currentStep() === 0 && this.accountForm.invalid) {
      this.markFormGroupTouched(this.accountForm);
      return;
    }
    
    if (this.currentStep() === 1 && this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }
    
    if (this.currentStep() < 2) {
      this.currentStep.update(step => step + 1);
    }
  }

  /**
   * Check if can proceed to next step
   */
  canProceed(): boolean {
    switch (this.currentStep()) {
      case 0:
        return this.accountForm.valid && this.emailAvailable() !== false;
      case 1:
        return this.profileForm.valid;
      case 2:
        return this.preferencesForm.valid;
      default:
        return false;
    }
  }
}