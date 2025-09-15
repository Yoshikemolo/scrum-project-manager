import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, timer } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectIsLoading } from '../../../store/auth/auth.selectors';

/**
 * Forgot Password component for password recovery
 * Implements email-based password reset with rate limiting
 */
@Component({
  selector: 'app-forgot-password',
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
    MatSnackBarModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
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
        style({ transform: 'translateX(-100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
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
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  // Dependency injection
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private store = inject(Store);
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);
  private snackBar = inject(MatSnackBar);

  // Component state
  forgotPasswordForm!: FormGroup;
  isLoading = signal(false);
  emailSent = signal(false);
  canResend = signal(true);
  resendCountdown = signal(0);
  attempts = signal(0);
  maxAttempts = 3;
  resetBlockedUntil = signal<Date | null>(null);
  
  // Observables
  private destroy$ = new Subject<void>();
  loading$ = this.store.select(selectIsLoading);

  // Error messages
  errorMessages = {
    email: {
      required: 'Email is required',
      email: 'Please enter a valid email address',
      pattern: 'Please enter a valid email format'
    }
  };

  ngOnInit(): void {
    this.initializeForm();
    this.subscribeToLoadingState();
    this.checkBlockedStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the forgot password form
   */
  private initializeForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]]
    });
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
   * Check if user is blocked from sending reset emails
   */
  private checkBlockedStatus(): void {
    const blockedUntil = localStorage.getItem('resetBlockedUntil');
    if (blockedUntil) {
      const blockDate = new Date(blockedUntil);
      if (blockDate > new Date()) {
        this.resetBlockedUntil.set(blockDate);
        this.startBlockTimer(blockDate);
      } else {
        localStorage.removeItem('resetBlockedUntil');
      }
    }

    const storedAttempts = localStorage.getItem('resetAttempts');
    if (storedAttempts) {
      this.attempts.set(parseInt(storedAttempts, 10));
    }
  }

  /**
   * Start timer for blocked status
   */
  private startBlockTimer(blockDate: Date): void {
    const remainingTime = blockDate.getTime() - Date.now();
    timer(remainingTime).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.resetBlockedUntil.set(null);
      this.attempts.set(0);
      localStorage.removeItem('resetBlockedUntil');
      localStorage.removeItem('resetAttempts');
    });
  }

  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    if (this.resetBlockedUntil()) {
      this.showBlockedMessage();
      return;
    }

    const email = this.forgotPasswordForm.get('email')?.value;
    this.isLoading.set(true);

    try {
      await this.authService.requestPasswordReset(email);
      this.handleSuccessfulRequest();
    } catch (error) {
      this.handleFailedRequest(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handle successful password reset request
   */
  private handleSuccessfulRequest(): void {
    this.emailSent.set(true);
    this.canResend.set(false);
    this.startResendCountdown();
    
    this.snackBar.open(
      'Password reset instructions have been sent to your email',
      'Close',
      {
        duration: 5000,
        panelClass: ['success-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );
  }

  /**
   * Handle failed password reset request
   */
  private handleFailedRequest(error: any): void {
    this.attempts.update(a => a + 1);
    localStorage.setItem('resetAttempts', this.attempts().toString());

    if (this.attempts() >= this.maxAttempts) {
      this.blockUser();
    } else {
      const remainingAttempts = this.maxAttempts - this.attempts();
      this.snackBar.open(
        `Failed to send reset email. ${remainingAttempts} attempts remaining.`,
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );
    }
  }

  /**
   * Block user from sending more reset emails
   */
  private blockUser(): void {
    const blockUntil = new Date();
    blockUntil.setHours(blockUntil.getHours() + 1); // Block for 1 hour
    
    this.resetBlockedUntil.set(blockUntil);
    localStorage.setItem('resetBlockedUntil', blockUntil.toISOString());
    
    this.snackBar.open(
      'Too many reset attempts. Please try again in 1 hour.',
      'Close',
      {
        duration: 10000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );

    this.startBlockTimer(blockUntil);
  }

  /**
   * Show blocked message
   */
  private showBlockedMessage(): void {
    const blockDate = this.resetBlockedUntil();
    if (blockDate) {
      const remainingMinutes = Math.ceil((blockDate.getTime() - Date.now()) / 60000);
      this.snackBar.open(
        `Password reset is blocked. Please try again in ${remainingMinutes} minute(s).`,
        'Close',
        {
          duration: 5000,
          panelClass: ['warning-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );
    }
  }

  /**
   * Start countdown for resend button
   */
  private startResendCountdown(): void {
    this.resendCountdown.set(60); // 60 seconds countdown
    
    const countdown = timer(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const current = this.resendCountdown();
        if (current > 0) {
          this.resendCountdown.update(c => c - 1);
        } else {
          this.canResend.set(true);
          countdown.unsubscribe();
        }
      });
  }

  /**
   * Resend password reset email
   */
  async resendEmail(): Promise<void> {
    if (!this.canResend() || this.forgotPasswordForm.invalid) {
      return;
    }

    const email = this.forgotPasswordForm.get('email')?.value;
    this.isLoading.set(true);
    this.canResend.set(false);

    try {
      await this.authService.requestPasswordReset(email);
      this.startResendCountdown();
      
      this.snackBar.open(
        'Password reset email has been resent',
        'Close',
        {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );
    } catch (error) {
      this.canResend.set(true);
      this.snackBar.open(
        'Failed to resend email. Please try again.',
        'Close',
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );
    } finally {
      this.isLoading.set(false);
    }
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
   * Get error message for form control
   */
  getErrorMessage(controlName: string): string {
    const control = this.forgotPasswordForm.get(controlName);
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
    const control = this.forgotPasswordForm.get(controlName);
    return !!(control?.invalid && control?.touched);
  }

  /**
   * Reset form and state
   */
  resetForm(): void {
    this.forgotPasswordForm.reset();
    this.emailSent.set(false);
    this.canResend.set(true);
    this.resendCountdown.set(0);
  }

  /**
   * Get formatted countdown time
   */
  getCountdownText(): string {
    const seconds = this.resendCountdown();
    if (seconds === 0) return '';
    return `(${seconds}s)`;
  }

  /**
   * Check if submit button should be disabled
   */
  isSubmitDisabled(): boolean {
    return this.forgotPasswordForm.invalid || 
           this.isLoading() || 
           this.emailSent() || 
           this.resetBlockedUntil() !== null;
  }
}