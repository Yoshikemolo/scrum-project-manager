/**
 * @fileoverview Loader Component
 * @module LoaderComponent
 * 
 * Versatile loading indicator component that provides:
 * - Multiple loader types (circular, linear, skeleton, dots, pulse, custom)
 * - Determinate and indeterminate progress modes
 * - Fullscreen and inline display modes
 * - Customizable messages and tips
 * - Action buttons for user interaction
 * - Timer display for long operations
 * - Accessibility features
 * - Responsive design
 * 
 * @author SCRUM Project Manager Team
 * @copyright 2025 Ximplicity Software Solutions
 */

import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';

/**
 * Loader type options
 */
export type LoaderType = 'circular' | 'linear' | 'skeleton' | 'dots' | 'pulse' | 'custom';

/**
 * Loader size options
 */
export type LoaderSize = 'small' | 'medium' | 'large';

/**
 * Progress mode options
 */
export type ProgressMode = 'determinate' | 'indeterminate' | 'buffer' | 'query';

/**
 * Message position options
 */
export type MessagePosition = 'above' | 'below';

/**
 * Action button interface
 */
export interface LoaderAction {
  id: string;
  label: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn';
  disabled?: boolean;
}

/**
 * Skeleton line configuration
 */
export interface SkeletonLine {
  width: number;
  height: number;
  delay: number;
}

/**
 * Global loader component for displaying loading states
 * 
 * @example
 * ```html
 * <!-- Simple usage -->
 * <app-loader 
 *   [message]="'Loading data...'"
 *   [type]="'circular'">
 * </app-loader>
 * 
 * <!-- Advanced usage with progress -->
 * <app-loader
 *   [type]="'linear'"
 *   [mode]="'determinate'"
 *   [progress]="uploadProgress"
 *   [message]="'Uploading file...'"
 *   [showCancel]="true"
 *   (cancelled)="onCancelUpload()">
 * </app-loader>
 * 
 * <!-- Custom content -->
 * <app-loader [type]="'custom'">
 *   <div class="custom-loader">
 *     <img src="custom-animation.gif" alt="Loading">
 *   </div>
 * </app-loader>
 * ```
 */
@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class LoaderComponent implements OnInit, OnDestroy {
  /**
   * Type of loader to display
   */
  @Input() type: LoaderType = 'circular';
  
  /**
   * Size of the loader
   */
  @Input() size: LoaderSize = 'medium';
  
  /**
   * Whether to display in fullscreen mode
   */
  @Input() fullscreen = true;
  
  /**
   * Progress mode (for circular and linear types)
   */
  @Input() mode: ProgressMode = 'indeterminate';
  
  /**
   * Progress value (0-100) for determinate mode
   */
  @Input() progress = 0;
  
  /**
   * Buffer value for buffer mode
   */
  @Input() bufferValue = 0;
  
  /**
   * Whether to show progress percentage
   */
  @Input() showProgress = true;
  
  /**
   * Loading message to display
   */
  @Input() message = '';
  
  /**
   * Position of the message relative to loader
   */
  @Input() messagePosition: MessagePosition = 'below';
  
  /**
   * Whether to show animated dots with message
   */
  @Input() showMessageDots = true;
  
  /**
   * Stroke width for circular spinner
   */
  @Input() strokeWidth = 4;
  
  /**
   * Color theme for the loader
   */
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  
  /**
   * Icon to display in pulse loader
   */
  @Input() icon = '';
  
  /**
   * Whether to show cancel button
   */
  @Input() showCancel = false;
  
  /**
   * Text for cancel button
   */
  @Input() cancelText = 'loader.cancel';
  
  /**
   * Whether cancel button is disabled
   */
  @Input() cancelDisabled = false;
  
  /**
   * Custom action buttons
   */
  @Input() customActions: LoaderAction[] = [];
  
  /**
   * Whether to allow backdrop click (fullscreen mode)
   */
  @Input() allowBackdropClick = false;
  
  /**
   * Custom backdrop color
   */
  @Input() backdropColor = 'rgba(0, 0, 0, 0.5)';
  
  /**
   * Whether to show elapsed time
   */
  @Input() showTimer = false;
  
  /**
   * Tips to rotate through while loading
   */
  @Input() tips: string[] = [];
  
  /**
   * Interval for tip rotation (ms)
   */
  @Input() tipRotationInterval = 3000;
  
  /**
   * Configuration for skeleton loader lines
   */
  @Input() skeletonLines: SkeletonLine[] = [
    { width: 100, height: 20, delay: 0 },
    { width: 80, height: 20, delay: 100 },
    { width: 90, height: 20, delay: 200 },
    { width: 70, height: 20, delay: 300 }
  ];
  
  /**
   * Event emitted when cancel button is clicked
   */
  @Output() cancelled = new EventEmitter<void>();
  
  /**
   * Event emitted when custom action is clicked
   */
  @Output() actionClicked = new EventEmitter<LoaderAction>();
  
  /**
   * Event emitted when backdrop is clicked
   */
  @Output() backdropClick = new EventEmitter<void>();
  
  // Internal state
  elapsedTime = 0;
  currentTip = '';
  private destroy$ = new Subject<void>();
  private timerInterval?: number;
  private tipInterval?: number;
  private tipIndex = 0;
  
  /**
   * Component initialization
   */
  ngOnInit(): void {
    this.startTimer();
    this.startTipRotation();
  }
  
  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    this.stopTimer();
    this.stopTipRotation();
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Start elapsed time timer
   * @private
   */
  private startTimer(): void {
    if (this.showTimer) {
      this.timerInterval = window.setInterval(() => {
        this.elapsedTime++;
      }, 1000);
    }
  }
  
  /**
   * Stop elapsed time timer
   * @private
   */
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }
  
  /**
   * Start tip rotation
   * @private
   */
  private startTipRotation(): void {
    if (this.tips.length > 0) {
      this.currentTip = this.tips[0];
      
      if (this.tips.length > 1) {
        this.tipInterval = window.setInterval(() => {
          this.tipIndex = (this.tipIndex + 1) % this.tips.length;
          this.currentTip = this.tips[this.tipIndex];
        }, this.tipRotationInterval);
      }
    }
  }
  
  /**
   * Stop tip rotation
   * @private
   */
  private stopTipRotation(): void {
    if (this.tipInterval) {
      clearInterval(this.tipInterval);
      this.tipInterval = undefined;
    }
  }
  
  /**
   * Get diameter based on size
   * @returns Diameter in pixels
   */
  getDiameter(): number {
    switch (this.size) {
      case 'small': return 48;
      case 'large': return 80;
      default: return 64;
    }
  }
  
  /**
   * Format elapsed time as MM:SS or HH:MM:SS
   * @param seconds Time in seconds
   * @returns Formatted time string
   */
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  /**
   * Set progress value
   * @param value Progress value (0-100)
   */
  setProgress(value: number): void {
    this.progress = Math.max(0, Math.min(100, value));
  }
  
  /**
   * Handle cancel button click
   */
  onCancel(): void {
    this.cancelled.emit();
  }
  
  /**
   * Handle custom action click
   * @param action Action that was clicked
   */
  onCustomAction(action: LoaderAction): void {
    this.actionClicked.emit(action);
  }
  
  /**
   * Handle backdrop click
   */
  onBackdropClick(): void {
    if (this.allowBackdropClick) {
      this.backdropClick.emit();
    }
  }
  
  /**
   * TrackBy function for ngFor optimization
   * @param index Item index
   * @returns Index value
   */
  trackByIndex(index: number): number {
    return index;
  }
  
  /**
   * TrackBy function for actions
   * @param index Item index
   * @param action Action item
   * @returns Action ID
   */
  trackByAction(index: number, action: LoaderAction): string {
    return action.id;
  }
}
