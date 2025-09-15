import { Component, OnInit, OnDestroy, inject, signal, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, timer } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectIsLoading, selectUser } from '../../../store/auth/auth.selectors';

/**
 * Two-Factor Authentication component
 * Handles OTP verification for SMS and authenticator app methods
 */
@Component({
  selector: 'app-two-factor',
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
    MatSnackBarModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './two-factor.component.html',
  styleUrls: ['./two-factor.component.scss'],
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
      transition('* => shake', [
        animate('600ms', style({ transform: 'translateX(-10px)' })),
        animate('600ms', style({ transform: 'translateX(10px)' })),
        animate('600ms', style({ transform: 'translateX(-10px)' })),
        animate('600ms', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class TwoFactorComponent implements OnInit, OnDestroy {
  // Dependency injection
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private store = inject(Store);
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);
  private localStorage = inject(LocalStorageService);
  private snackBar = inject(MatSnackBar);

  // ViewChildren for OTP input fields
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  // Component state
  otpForm!: FormGroup;
  backupCodeForm!: FormGroup;
  isLoading = signal(false);
  selectedMethod = signal<'app' | 'sms' | 'backup'>('app');
  maskedPhoneNumber = signal('');
  maskedEmail = signal('');
  otpLength = 6;
  backupCodeLength = 8;
  verificationAttempts = signal(0);
  maxAttempts = 5;
  isBlocked = signal(false);
  canResend = signal(false);
  resendCountdown = signal(0);
  trustDevice = signal(false);
  shakeAnimation = signal('');
  otpValues = signal<string[]>(Array(this.otpLength).fill(''));
  
  // Observables
  private destroy$ = new Subject<void>();
  loading$ = this.store.select(selectIsLoading);
  user$ = this.store.select(selectUser);

  // Available methods (would come from user settings)
  availableMethods = [
    { value: 'app', label: 'Authenticator App', icon: 'smartphone', available: true },
    { value: 'sms', label: 'SMS', icon: 'message', available: true },
    { value: 'backup', label: 'Backup Code', icon: 'vpn_key', available: true }
  ];

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserInfo();
    this.subscribeToLoadingState();
    this.startResendTimer();
    this.checkBlockedStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize forms
   */
  private initializeForms(): void {
    // Create individual form controls for each OTP digit
    const otpControls: { [key: string]: FormControl } = {};
    for (let i = 0; i < this.otpLength; i++) {
      otpControls[`digit${i}`] = new FormControl('', [
        Validators.required,
        Validators.pattern('^[0-9]$')
      ]);
    }
    this.otpForm = this.fb.group(otpControls);

    // Backup code form
    this.backupCodeForm = this.fb.group({
      code: ['', [
        Validators.required,
        Validators.pattern('^[A-Z0-9]{8}$')
      ]]
    });
  }

  /**
   * Load user information
   */
  private loadUserInfo(): void {
    this.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        // Mask phone number
        if (user.phone) {
          const phone = user.phone;
          this.maskedPhoneNumber.set(
            phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
          );
        }

        // Mask email
        if (user.email) {
          const [username, domain] = user.email.split('@');
          const maskedUsername = username.charAt(0) + 
            '*'.repeat(Math.max(username.length - 2, 0)) + 
            username.charAt(username.length - 1);
          this.maskedEmail.set(`${maskedUsername}@${domain}`);
        }

        // Check available methods from user settings
        if (user.twoFactorMethods) {
          this.availableMethods.forEach(method => {
            method.available = user.twoFactorMethods?.includes(method.value as any) || false;
          });

          // Select first available method
          const firstAvailable = this.availableMethods.find(m => m.available);
          if (firstAvailable) {
            this.selectedMethod.set(firstAvailable.value as any);
          }
        }
      }
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
   * Check if user is blocked
   */
  private checkBlockedStatus(): void {
    const blockUntil = this.localStorage.getItem<number>('twoFactorBlockedUntil');
    if (blockUntil && blockUntil > Date.now()) {
      this.isBlocked.set(true);
      const remainingTime = blockUntil - Date.now();
      timer(remainingTime).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.isBlocked.set(false);
        this.verificationAttempts.set(0);
        this.localStorage.removeItem('twoFactorBlockedUntil');
      });
    }
  }

  /**
   * Handle OTP input change
   */
  onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Update form control
    this.otpForm.get(`digit${index}`)?.setValue(value);

    // Update signal array
    const values = [...this.otpValues()];
    values[index] = value;
    this.otpValues.set(values);

    // Auto-focus next input
    if (value && index < this.otpLength - 1) {
      const nextInput = this.otpInputs.toArray()[index + 1];
      if (nextInput) {
        nextInput.nativeElement.focus();
        nextInput.nativeElement.select();
      }
    }

    // Auto-submit when all digits are entered
    if (value && index === this.otpLength - 1) {
      const allFilled = values.every(v => v !== '');
      if (allFilled) {
        this.verifyOtp();
      }
    }
  }

  /**
   * Handle OTP keydown events
   */
  onOtpKeydown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;

    // Handle backspace
    if (event.key === 'Backspace' && !input.value && index > 0) {
      event.preventDefault();
      const prevInput = this.otpInputs.toArray()[index - 1];
      if (prevInput) {
        prevInput.nativeElement.focus();
        prevInput.nativeElement.select();
      }
    }

    // Handle arrow keys
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      const prevInput = this.otpInputs.toArray()[index - 1];
      if (prevInput) {
        prevInput.nativeElement.focus();
      }
    }

    if (event.key === 'ArrowRight' && index < this.otpLength - 1) {
      event.preventDefault();
      const nextInput = this.otpInputs.toArray()[index + 1];
      if (nextInput) {
        nextInput.nativeElement.focus();
      }
    }

    // Prevent non-numeric input
    if (!/^[0-9]$/.test(event.key) && 
        !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Handle paste event
   */
  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text');
    
    if (pastedData && /^\d+$/.test(pastedData)) {
      const digits = pastedData.slice(0, this.otpLength).split('');
      const values = Array(this.otpLength).fill('');
      
      digits.forEach((digit, index) => {
        this.otpForm.get(`digit${index}`)?.setValue(digit);
        values[index] = digit;
      });
      
      this.otpValues.set(values);
      
      // Focus last filled input or first empty
      const lastFilledIndex = Math.min(digits.length - 1, this.otpLength - 1);
      const targetInput = this.otpInputs.toArray()[lastFilledIndex];
      if (targetInput) {
        targetInput.nativeElement.focus();
        targetInput.nativeElement.select();
      }

      // Auto-submit if all digits are filled
      if (digits.length === this.otpLength) {
        this.verifyOtp();
      }
    }
  }

  /**
   * Verify OTP
   */
  async verifyOtp(): Promise<void> {
    if (this.isBlocked()) {
      this.showBlockedMessage();
      return;
    }

    const otp = this.otpValues().join('');
    if (otp.length !== this.otpLength) {
      this.shakeForm();
      return;
    }

    this.isLoading.set(true);

    try {
      const result = await this.authService.verifyTwoFactor({
        code: otp,
        method: this.selectedMethod(),
        trustDevice: this.trustDevice()
      });

      if (result.success) {
        this.handleSuccessfulVerification();
      } else {
        this.handleFailedVerification();
      }
    } catch (error) {
      this.handleFailedVerification();
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(): Promise<void> {
    if (this.backupCodeForm.invalid) {
      this.markFormGroupTouched(this.backupCodeForm);
      return;
    }

    if (this.isBlocked()) {
      this.showBlockedMessage();
      return;
    }

    const code = this.backupCodeForm.get('code')?.value;
    this.isLoading.set(true);

    try {
      const result = await this.authService.verifyTwoFactor({
        code,
        method: 'backup',
        trustDevice: this.trustDevice()
      });

      if (result.success) {
        this.handleSuccessfulVerification();
        
        // Show warning about used backup code
        if (result.remainingBackupCodes !== undefined) {
          this.snackBar.open(
            `Backup code used. ${result.remainingBackupCodes} codes remaining.`,
            'Close',
            {
              duration: 5000,
              panelClass: ['warning-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'top'
            }
          );
        }
      } else {
        this.handleFailedVerification();
      }
    } catch (error) {
      this.handleFailedVerification();
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handle successful verification
   */
  private handleSuccessfulVerification(): void {
    this.store.dispatch(AuthActions.twoFactorSuccess());
    
    // Save trusted device if requested
    if (this.trustDevice()) {
      const deviceId = this.generateDeviceId();
      this.localStorage.setItem('trustedDevice', deviceId);
    }

    this.snackBar.open(
      'Verification successful!',
      'Close',
      {
        duration: 3000,
        panelClass: ['success-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );

    this.router.navigate(['/dashboard']);
  }

  /**
   * Handle failed verification
   */
  private handleFailedVerification(): void {
    this.verificationAttempts.update(attempts => attempts + 1);
    
    if (this.verificationAttempts() >= this.maxAttempts) {
      this.blockUser();
    } else {
      const remainingAttempts = this.maxAttempts - this.verificationAttempts();
      this.snackBar.open(
        `Invalid code. ${remainingAttempts} attempts remaining.`,
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );
      this.shakeForm();
      this.clearOtp();
    }
  }

  /**
   * Block user after too many attempts
   */
  private blockUser(): void {
    const blockDuration = 300000; // 5 minutes
    const blockUntil = Date.now() + blockDuration;
    this.localStorage.setItem('twoFactorBlockedUntil', blockUntil);
    this.isBlocked.set(true);
    
    this.snackBar.open(
      'Too many failed attempts. Please try again in 5 minutes.',
      'Close',
      {
        duration: 10000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );

    timer(blockDuration).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isBlocked.set(false);
      this.verificationAttempts.set(0);
      this.localStorage.removeItem('twoFactorBlockedUntil');
    });
  }

  /**
   * Show blocked message
   */
  private showBlockedMessage(): void {
    const blockUntil = this.localStorage.getItem<number>('twoFactorBlockedUntil');
    if (blockUntil) {
      const remainingMinutes = Math.ceil((blockUntil - Date.now()) / 60000);
      this.snackBar.open(
        `Verification blocked. Please try again in ${remainingMinutes} minute(s).`,
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
   * Resend OTP
   */
  async resendOtp(): Promise<void> {
    if (!this.canResend() || this.isBlocked()) {
      return;
    }

    this.isLoading.set(true);

    try {
      await this.authService.resendTwoFactorCode(this.selectedMethod());
      
      this.snackBar.open(
        `Code sent to ${this.selectedMethod() === 'sms' ? 'your phone' : 'your authenticator app'}`,
        'Close',
        {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );

      this.startResendTimer();
      this.clearOtp();
    } catch (error) {
      this.snackBar.open(
        'Failed to resend code. Please try again.',
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
   * Start resend timer
   */
  private startResendTimer(): void {
    this.canResend.set(false);
    this.resendCountdown.set(30); // 30 seconds
    
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
   * Clear OTP inputs
   */
  clearOtp(): void {
    for (let i = 0; i < this.otpLength; i++) {
      this.otpForm.get(`digit${i}`)?.setValue('');
    }
    this.otpValues.set(Array(this.otpLength).fill(''));
    
    // Focus first input
    const firstInput = this.otpInputs.first;
    if (firstInput) {
      firstInput.nativeElement.focus();
    }
  }

  /**
   * Shake form animation
   */
  private shakeForm(): void {
    this.shakeAnimation.set('shake');
    setTimeout(() => this.shakeAnimation.set(''), 600);
  }

  /**
   * Mark form group as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    return 'device_' + Math.random().toString(36).substr(2, 9) + Date.now();
  }

  /**
   * Switch verification method
   */
  switchMethod(method: 'app' | 'sms' | 'backup'): void {
    this.selectedMethod.set(method);
    this.clearOtp();
    this.backupCodeForm.reset();
    
    if (method !== 'backup') {
      this.startResendTimer();
    }
  }

  /**
   * Get resend button text
   */
  getResendText(): string {
    if (!this.canResend()) {
      return `Resend in ${this.resendCountdown()}s`;
    }
    return 'Resend Code';
  }

  /**
   * Check if verification is disabled
   */
  isVerificationDisabled(): boolean {
    if (this.selectedMethod() === 'backup') {
      return this.backupCodeForm.invalid || this.isLoading() || this.isBlocked();
    }
    return this.otpValues().some(v => v === '') || this.isLoading() || this.isBlocked();
  }
}