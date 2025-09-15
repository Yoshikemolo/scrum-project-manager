/**
 * Confirmation dialog component for destructive actions
 * Features customizable severity levels, animations, and keyboard shortcuts
 */
import { Component, Inject, OnInit, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, state, style, transition, animate } from '@angular/animations';

/**
 * Dialog severity levels
 */
export enum ConfirmDialogSeverity {
  INFO = 'info',
  WARNING = 'warning',
  DANGER = 'danger',
  SUCCESS = 'success'
}

/**
 * Dialog configuration data
 */
export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: ConfirmDialogSeverity;
  showIcon?: boolean;
  icon?: string;
  confirmDisabled?: boolean;
  showInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputValidator?: (value: string) => string | null;
  requireInput?: boolean;
  loading?: boolean;
  disableClose?: boolean;
  countdown?: number;
  details?: string[];
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  animations: [
    trigger('iconAnimation', [
      state('idle', style({ transform: 'scale(1) rotate(0deg)' })),
      state('active', style({ transform: 'scale(1.1) rotate(5deg)' })),
      transition('idle <=> active', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ]),
    trigger('shake', [
      state('idle', style({ transform: 'translateX(0)' })),
      state('shake', style({ transform: 'translateX(0)' })),
      transition('idle => shake', [
        animate('500ms', style({ transform: 'translateX(-10px)' })),
        animate('500ms', style({ transform: 'translateX(10px)' })),
        animate('500ms', style({ transform: 'translateX(-10px)' })),
        animate('500ms', style({ transform: 'translateX(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ transform: 'translateY(0)', opacity: 1 })
        )
      ])
    ])
  ]
})
export class ConfirmDialogComponent implements OnInit {
  // State management
  public iconState = signal<'idle' | 'active'>('idle');
  public shakeState = signal<'idle' | 'shake'>('idle');
  public inputValue = signal<string>('');
  public inputError = signal<string | null>(null);
  public countdown = signal<number>(0);
  public isProcessing = signal<boolean>(false);
  
  // Computed properties
  public confirmButtonDisabled = computed(() => {
    if (this.isProcessing()) return true;
    if (this.countdown() > 0) return true;
    if (this.data.confirmDisabled) return true;
    
    if (this.data.showInput && this.data.requireInput) {
      const value = this.inputValue();
      if (!value || value.trim().length === 0) return true;
      if (this.inputError()) return true;
    }
    
    return false;
  });
  
  public confirmButtonText = computed(() => {
    const countdown = this.countdown();
    if (countdown > 0) {
      return `${this.data.confirmText || 'Confirm'} (${countdown})`;
    }
    return this.data.confirmText || 'Confirm';
  });
  
  public severityClass = computed(() => {
    return `confirm-dialog--${this.data.severity || ConfirmDialogSeverity.INFO}`;
  });
  
  public dialogIcon = computed(() => {
    if (this.data.icon) return this.data.icon;
    
    const icons: Record<ConfirmDialogSeverity, string> = {
      [ConfirmDialogSeverity.INFO]: 'info',
      [ConfirmDialogSeverity.WARNING]: 'warning',
      [ConfirmDialogSeverity.DANGER]: 'dangerous',
      [ConfirmDialogSeverity.SUCCESS]: 'check_circle'
    };
    
    return icons[this.data.severity || ConfirmDialogSeverity.INFO];
  });
  
  private countdownInterval?: number;
  
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    // Set default values
    this.data = {
      ...{
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        severity: ConfirmDialogSeverity.INFO,
        showIcon: true,
        confirmDisabled: false,
        showInput: false,
        requireInput: false,
        loading: false,
        disableClose: false
      },
      ...data
    };
    
    // Configure dialog behavior
    dialogRef.disableClose = data.disableClose || false;
  }
  
  ngOnInit(): void {
    // Start countdown if specified
    if (this.data.countdown && this.data.countdown > 0) {
      this.startCountdown();
    }
    
    // Animate icon periodically for danger severity
    if (this.data.severity === ConfirmDialogSeverity.DANGER) {
      this.startIconAnimation();
    }
  }
  
  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
  
  /**
   * Handle confirm button click
   */
  async onConfirm(): Promise<void> {
    if (this.confirmButtonDisabled()) return;
    
    // Validate input if required
    if (this.data.showInput && this.data.inputValidator) {
      const error = this.data.inputValidator(this.inputValue());
      if (error) {
        this.inputError.set(error);
        this.triggerShake();
        return;
      }
    }
    
    // Show processing state
    this.isProcessing.set(true);
    
    // Return result
    const result = this.data.showInput ? this.inputValue() : true;
    
    // Add small delay for better UX
    await this.delay(300);
    
    this.dialogRef.close(result);
  }
  
  /**
   * Handle cancel button click
   */
  onCancel(): void {
    if (this.isProcessing()) return;
    this.dialogRef.close(false);
  }
  
  /**
   * Handle input change
   */
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.inputValue.set(input.value);
    
    // Validate input if validator provided
    if (this.data.inputValidator) {
      const error = this.data.inputValidator(input.value);
      this.inputError.set(error);
    } else {
      this.inputError.set(null);
    }
  }
  
  /**
   * Handle input key press
   */
  onInputKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.confirmButtonDisabled()) {
      this.onConfirm();
    }
  }
  
  /**
   * Keyboard shortcuts
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Don't handle if input is focused
    if (this.data.showInput && document.activeElement?.tagName === 'INPUT') {
      return;
    }
    
    switch (event.key) {
      case 'Enter':
        if (!event.altKey && !event.ctrlKey && !event.shiftKey) {
          event.preventDefault();
          if (!this.confirmButtonDisabled()) {
            this.onConfirm();
          }
        }
        break;
      
      case 'Escape':
        if (!this.data.disableClose && !this.isProcessing()) {
          event.preventDefault();
          this.onCancel();
        }
        break;
      
      case 'y':
      case 'Y':
        if (!this.data.showInput && !this.confirmButtonDisabled()) {
          event.preventDefault();
          this.onConfirm();
        }
        break;
      
      case 'n':
      case 'N':
        if (!this.data.showInput && !this.isProcessing()) {
          event.preventDefault();
          this.onCancel();
        }
        break;
    }
  }
  
  /**
   * Start countdown timer
   */
  private startCountdown(): void {
    this.countdown.set(this.data.countdown || 0);
    
    this.countdownInterval = window.setInterval(() => {
      const current = this.countdown();
      if (current > 0) {
        this.countdown.set(current - 1);
      } else {
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
        }
      }
    }, 1000);
  }
  
  /**
   * Start icon animation for danger severity
   */
  private startIconAnimation(): void {
    setInterval(() => {
      this.iconState.set(this.iconState() === 'idle' ? 'active' : 'idle');
    }, 2000);
  }
  
  /**
   * Trigger shake animation
   */
  private triggerShake(): void {
    this.shakeState.set('shake');
    setTimeout(() => {
      this.shakeState.set('idle');
    }, 2000);
  }
  
  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get button color based on severity
   */
  getConfirmButtonColor(): string {
    switch (this.data.severity) {
      case ConfirmDialogSeverity.DANGER:
        return 'warn';
      case ConfirmDialogSeverity.SUCCESS:
        return 'primary';
      default:
        return 'primary';
    }
  }
  
  /**
   * Check if should show details
   */
  shouldShowDetails(): boolean {
    return !!this.data.details && this.data.details.length > 0;
  }
}
