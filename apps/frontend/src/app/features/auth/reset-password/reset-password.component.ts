import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, timer } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectIsLoading } from '../../../store/auth/auth.selectors';

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
 * Reset Password component for password recovery
 * Validates reset token and allows user to set new password
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatListModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
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
    trigger('checkmark', [
      transition(':enter', [
        style({ transform: 'scale(0) rotate(-180deg)', opacity: 0 }),
        animate('400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
          style({ transform: 'scale(1) rotate(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  // Dependency injection
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);
  private snackBar = inject(MatSnackBar);

  // Component state
  resetPasswordForm!: FormGroup;
  isLoading = signal(false);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  token = signal<string | null>(null);
  tokenValid = signal<boolean | null>(null);
  tokenExpired = signal(false);
  passwordReset = signal(false);
  passwordStrength = signal(0);
  redirectCountdown = signal(5);
  
  // Observables
  private destroy$ = new Subject<void>();
  loading$ = this.store.select(selectIsLoading);

  // Password requirements
  passwordRequirements = [
    { label: 'At least 8 characters', key: 'isLengthValid', met: false },
    { label: 'Contains uppercase letter', key: 'hasUpperCase', met: false },
    { label: 'Contains lowercase letter', key: 'hasLowerCase', met: false },
    { label: 'Contains number', key: 'hasNumeric', met: false },
    { label: 'Contains special character', key: 'hasSpecialChar', met: false }
  ];

  // Error messages
  errorMessages = {
    password: {
      required: 'Password is required',
      minlength: 'Password must be at least 8 characters',
      passwordStrength: 'Password does not meet all requirements'
    },
    confirmPassword: {
      required: 'Please confirm your password',
      passwordMismatch: 'Passwords do not match'
    }
  };

  ngOnInit(): void {
    this.initializeForm();
    this.extractToken();
    this.validateToken();
    this.subscribeToLoadingState();
    this.setupPasswordStrengthMonitor();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the reset password form
   */
  private initializeForm(): void {
    this.resetPasswordForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128),
        passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  /**
   * Extract token from URL parameters
   */
  private extractToken(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const token = params['token'];
      if (token) {
        this.token.set(token);
      } else {
        this.handleInvalidToken();
      }
    });
  }

  /**
   * Validate the reset token
   */
  private async validateToken(): Promise<void> {
    const token = this.token();
    if (!token) {
      this.handleInvalidToken();
      return;
    }

    this.isLoading.set(true);

    try {
      const isValid = await this.authService.validateResetToken(token);
      this.tokenValid.set(isValid);
      
      if (!isValid) {
        this.tokenExpired.set(true);
        this.showTokenExpiredMessage();
      }
    } catch (error) {
      this.tokenValid.set(false);
      this.tokenExpired.set(true);
      this.showTokenExpiredMessage();
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Subscribe to loading state
   */
  private subscribeToLoadingState(): void {
    this.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.isLoading.set(loading);
    });
  }

  /**
   * Setup password strength monitor
   */
  private setupPasswordStrengthMonitor(): void {
    this.resetPasswordForm.get('password')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(password => {
        this.calculatePasswordStrength(password);
        this.updatePasswordRequirements(password);
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
   * Update password requirements status
   */
  private updatePasswordRequirements(password: string): void {
    if (!password) {
      this.passwordRequirements.forEach(req => req.met = false);
      return;
    }

    const validation = {
      isLengthValid: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumeric: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    this.passwordRequirements.forEach(req => {
      req.met = validation[req.key as keyof typeof validation];
    });
  }

  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.invalid) {
      this.markFormGroupTouched(this.resetPasswordForm);
      return;
    }

    const token = this.token();
    if (!token || !this.tokenValid()) {
      this.handleInvalidToken();
      return;
    }

    const password = this.resetPasswordForm.get('password')?.value;
    this.isLoading.set(true);

    try {
      await this.authService.resetPassword(token, password);
      this.handleSuccessfulReset();
    } catch (error) {
      this.handleResetError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handle successful password reset
   */
  private handleSuccessfulReset(): void {
    this.passwordReset.set(true);
    
    this.snackBar.open(
      'Your password has been successfully reset',
      'Close',
      {
        duration: 5000,
        panelClass: ['success-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );

    // Start redirect countdown
    this.startRedirectCountdown();
  }

  /**
   * Start countdown for redirect to login
   */
  private startRedirectCountdown(): void {
    const countdown = timer(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const current = this.redirectCountdown();
        if (current > 0) {
          this.redirectCountdown.update(c => c - 1);
        } else {
          countdown.unsubscribe();
          this.router.navigate(['/auth/login']);
        }
      });
  }

  /**
   * Handle reset error
   */
  private handleResetError(error: any): void {
    const message = error?.message || 'Failed to reset password. Please try again.';
    
    this.snackBar.open(
      message,
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
   * Handle invalid or missing token
   */
  private handleInvalidToken(): void {
    this.tokenValid.set(false);
    this.tokenExpired.set(true);
    
    this.snackBar.open(
      'Invalid or expired reset link. Please request a new one.',
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
   * Show token expired message
   */
  private showTokenExpiredMessage(): void {
    this.snackBar.open(
      'This password reset link has expired. Please request a new one.',
      'Close',
      {
        duration: 5000,
        panelClass: ['warning-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );
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
   * Get error message for form control
   */
  getErrorMessage(controlName: string): string {
    const control = this.resetPasswordForm.get(controlName);
    if (control?.errors && control.touched) {
      const errors = this.errorMessages[controlName as keyof typeof this.errorMessages];
      const errorKey = Object.keys(control.errors)[0];
      return errors[errorKey as keyof typeof errors] || 'Invalid input';
    }
    return '';
  }

  /**
   * Check if form control has error
   */
  hasError(controlName: string): boolean {
    const control = this.resetPasswordForm.get(controlName);
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
   * Check if submit button should be disabled
   */
  isSubmitDisabled(): boolean {
    return this.resetPasswordForm.invalid || 
           this.isLoading() || 
           !this.tokenValid() ||
           this.passwordReset();
  }

  /**
   * Request new reset link
   */
  requestNewLink(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}