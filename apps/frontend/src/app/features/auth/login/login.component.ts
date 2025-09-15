import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { trigger, transition, style, animate, state } from '@angular/animations';

import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectAuthError, selectIsAuthenticated, selectIsLoading } from '../../../store/auth/auth.selectors';
import { LoginRequest } from '../../../shared/interfaces/auth.interface';

/**
 * Login component for user authentication
 * Implements reactive forms with comprehensive validation
 * Supports remember me functionality and social login options
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
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
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
    trigger('shake', [
      state('shake', style({ transform: 'translateX(0)' })),
      transition('* => shake', [
        animate('600ms', style({ transform: 'translateX(-10px)' })),
        animate('600ms', style({ transform: 'translateX(10px)' })),
        animate('600ms', style({ transform: 'translateX(-10px)' })),
        animate('600ms', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit, OnDestroy {
  // Dependency injection
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private store = inject(Store);
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);
  private localStorage = inject(LocalStorageService);
  private snackBar = inject(MatSnackBar);

  // Component state
  loginForm!: FormGroup;
  hidePassword = signal(true);
  isLoading = signal(false);
  loginAttempts = signal(0);
  maxLoginAttempts = 5;
  isBlocked = signal(false);
  blockDuration = 300000; // 5 minutes in milliseconds
  shakeAnimation = signal('');
  
  // Observables
  private destroy$ = new Subject<void>();
  authError$ = this.store.select(selectAuthError);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);
  loading$ = this.store.select(selectIsLoading);

  // Error messages for form validation
  errorMessages = {
    email: {
      required: 'Email is required',
      email: 'Please enter a valid email address',
      pattern: 'Please enter a valid email format'
    },
    password: {
      required: 'Password is required',
      minlength: 'Password must be at least 8 characters',
      maxlength: 'Password cannot exceed 128 characters'
    }
  };

  ngOnInit(): void {
    this.initializeForm();
    this.checkBlockedStatus();
    this.loadRememberedEmail();
    this.subscribeToAuthState();
    
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
   * Initialize the login form with validators
   */
  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128)
      ]],
      rememberMe: [false]
    });
  }

  /**
   * Check if user is blocked from too many failed attempts
   */
  private checkBlockedStatus(): void {
    const blockUntil = this.localStorage.getItem<number>('loginBlockedUntil');
    if (blockUntil && blockUntil > Date.now()) {
      this.isBlocked.set(true);
      const remainingTime = blockUntil - Date.now();
      setTimeout(() => {
        this.isBlocked.set(false);
        this.loginAttempts.set(0);
        this.localStorage.removeItem('loginBlockedUntil');
      }, remainingTime);
    }
  }

  /**
   * Load remembered email if remember me was checked
   */
  private loadRememberedEmail(): void {
    const rememberedEmail = this.localStorage.getItem<string>('rememberedEmail');
    if (rememberedEmail) {
      this.loginForm.patchValue({
        email: rememberedEmail,
        rememberMe: true
      });
    }
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
        this.handleLoginError(error);
      }
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      this.shakeForm();
      return;
    }

    if (this.isBlocked()) {
      this.showBlockedMessage();
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;

    // Handle remember me
    if (rememberMe) {
      this.localStorage.setItem('rememberedEmail', email);
    } else {
      this.localStorage.removeItem('rememberedEmail');
    }

    // Dispatch login action
    const loginRequest: LoginRequest = { email, password };
    this.store.dispatch(AuthActions.login({ credentials: loginRequest }));
  }

  /**
   * Handle login errors
   */
  private handleLoginError(error: string): void {
    this.loginAttempts.update(attempts => attempts + 1);
    
    if (this.loginAttempts() >= this.maxLoginAttempts) {
      this.blockUser();
    } else {
      const remainingAttempts = this.maxLoginAttempts - this.loginAttempts();
      this.snackBar.open(
        `Login failed: ${error}. ${remainingAttempts} attempts remaining.`,
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );
      this.shakeForm();
    }
  }

  /**
   * Block user after too many failed attempts
   */
  private blockUser(): void {
    const blockUntil = Date.now() + this.blockDuration;
    this.localStorage.setItem('loginBlockedUntil', blockUntil);
    this.isBlocked.set(true);
    
    this.snackBar.open(
      'Too many failed login attempts. Please try again in 5 minutes.',
      'Close',
      {
        duration: 10000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );

    setTimeout(() => {
      this.isBlocked.set(false);
      this.loginAttempts.set(0);
      this.localStorage.removeItem('loginBlockedUntil');
    }, this.blockDuration);
  }

  /**
   * Show blocked message
   */
  private showBlockedMessage(): void {
    const blockUntil = this.localStorage.getItem<number>('loginBlockedUntil');
    if (blockUntil) {
      const remainingMinutes = Math.ceil((blockUntil - Date.now()) / 60000);
      this.snackBar.open(
        `Account temporarily blocked. Please try again in ${remainingMinutes} minute(s).`,
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
   * Trigger shake animation on form
   */
  private shakeForm(): void {
    this.shakeAnimation.set('shake');
    setTimeout(() => this.shakeAnimation.set(''), 600);
  }

  /**
   * Mark all form controls as touched to show validation errors
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
   * Handle social login
   */
  socialLogin(provider: 'google' | 'github'): void {
    this.store.dispatch(AuthActions.socialLogin({ provider }));
  }

  /**
   * Get error message for a form control
   */
  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
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
    const control = this.loginForm.get(controlName);
    return !!(control?.invalid && control?.touched);
  }

  /**
   * Get remaining login attempts
   */
  getRemainingAttempts(): number {
    return Math.max(0, this.maxLoginAttempts - this.loginAttempts());
  }

  /**
   * Check if login button should be disabled
   */
  isLoginDisabled(): boolean {
    return this.loginForm.invalid || this.isLoading() || this.isBlocked();
  }
}