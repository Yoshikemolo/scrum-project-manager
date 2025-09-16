/**
 * Toast container component for displaying toast notifications
 * Features smooth animations, swipe-to-dismiss, and responsive layout
 */
import { Component, OnInit, OnDestroy, HostListener, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { animate, state, style, transition, trigger, group, query, stagger } from '@angular/animations';
import { ToastService, Toast, ToastSeverity, ToastPosition } from '../../../core/services/toast.service';
import { Subject, takeUntil } from 'rxjs';

/**
 * Interface for toast animation state
 */
interface AnimatedToast extends Toast {
  animationState: 'void' | 'entering' | 'visible' | 'leaving';
  swipeOffset: number;
  swipeVelocity: number;
  isSwipeable: boolean;
}

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule
  ],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({
          transform: 'translateX({{ enterTransform }}) scale(0.95)',
          opacity: 0
        }),
        group([
          animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
            style({ transform: 'translateX(0) scale(1)' })
          ),
          animate('200ms ease-out', 
            style({ opacity: 1 })
          )
        ])
      ]),
      transition(':leave', [
        group([
          animate('200ms cubic-bezier(0.4, 0, 0.6, 1)', 
            style({
              transform: 'translateX({{ leaveTransform }}) scale(0.95)',
              opacity: 0
            })
          )
        ])
      ])
    ]),
    trigger('progressBar', [
      state('running', style({ width: '0%' })),
      state('complete', style({ width: '100%' })),
      transition('* => running', [
        animate('{{ duration }}ms linear', style({ width: '100%' }))
      ])
    ])
  ]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Toast state management
  public animatedToasts = signal<AnimatedToast[]>([]);
  public position = computed(() => this.toastService.currentPosition());
  
  // Touch/swipe handling
  private touchStartX = 0;
  private touchStartY = 0;
  private currentToast: AnimatedToast | null = null;
  private readonly SWIPE_THRESHOLD = 100;
  private readonly SWIPE_VELOCITY_THRESHOLD = 0.5;
  
  // Animation configuration based on position
  public getEnterTransform = computed(() => {
    const pos = this.position();
    if (pos.includes('right')) return '100%';
    if (pos.includes('left')) return '-100%';
    return '0';
  });
  
  public getLeaveTransform = computed(() => {
    const pos = this.position();
    if (pos.includes('right')) return '120%';
    if (pos.includes('left')) return '-120%';
    return '0';
  });
  
  // Container positioning classes
  public containerClasses = computed(() => {
    const pos = this.position();
    return {
      'toast-container': true,
      [`toast-container--${pos}`]: true,
      'toast-container--mobile': this.isMobile()
    };
  });
  
  // Mobile detection
  private isMobile = signal(window.innerWidth < 768);
  
  constructor(public toastService: ToastService) {}
  
  ngOnInit(): void {
    // Subscribe to toast stream
    this.toastService.toast$
      .pipe(takeUntil(this.destroy$))
      .subscribe(toast => {
        this.addToast(toast);
      });
    
    // Subscribe to dismiss stream
    this.toastService.dismiss$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        if (id === '*') {
          this.animatedToasts.set([]);
        } else {
          this.removeToast(id);
        }
      });
    
    // Initialize with existing toasts
    const existingToasts = this.toastService.activeToasts();
    existingToasts.forEach(toast => this.addToast(toast));
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Window resize handler for responsive behavior
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.isMobile.set(window.innerWidth < 768);
  }
  
  /**
   * Add toast with animation state
   */
  private addToast(toast: Toast): void {
    const animatedToast: AnimatedToast = {
      ...toast,
      animationState: 'entering',
      swipeOffset: 0,
      swipeVelocity: 0,
      isSwipeable: this.isMobile() || toast.closable !== false
    };
    
    this.animatedToasts.update(toasts => [...toasts, animatedToast]);
    
    // Transition to visible state
    setTimeout(() => {
      this.updateToastState(toast.id, { animationState: 'visible' });
    }, 50);
  }
  
  /**
   * Remove toast with animation
   */
  private removeToast(id: string): void {
    this.updateToastState(id, { animationState: 'leaving' });
    
    // Remove from DOM after animation
    setTimeout(() => {
      this.animatedToasts.update(toasts => 
        toasts.filter(t => t.id !== id)
      );
    }, 300);
  }
  
  /**
   * Update toast animation state
   */
  private updateToastState(id: string, updates: Partial<AnimatedToast>): void {
    this.animatedToasts.update(toasts =>
      toasts.map(toast =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }
  
  /**
   * Handle toast click
   */
  onToastClick(toast: AnimatedToast, event: Event): void {
    event.stopPropagation();
    
    // Don't dismiss on click if there are actions
    if (toast.actions && toast.actions.length > 0) {
      return;
    }
    
    // Don't dismiss if not closable
    if (toast.closable === false) {
      return;
    }
    
    this.toastService.dismiss(toast.id);
  }
  
  /**
   * Handle close button click
   */
  onCloseClick(toast: AnimatedToast, event: Event): void {
    event.stopPropagation();
    this.toastService.dismiss(toast.id);
  }
  
  /**
   * Handle action button click
   */
  onActionClick(action: any, toast: AnimatedToast, event: Event): void {
    event.stopPropagation();
    action.action();
    
    // Optionally dismiss toast after action
    if (action.dismissOnClick !== false) {
      this.toastService.dismiss(toast.id);
    }
  }
  
  /**
   * Touch start handler for swipe-to-dismiss
   */
  onTouchStart(event: TouchEvent, toast: AnimatedToast): void {
    if (!toast.isSwipeable) return;
    
    this.currentToast = toast;
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }
  
  /**
   * Touch move handler for swipe animation
   */
  onTouchMove(event: TouchEvent, toast: AnimatedToast): void {
    if (!this.currentToast || this.currentToast.id !== toast.id) return;
    
    const deltaX = event.touches[0].clientX - this.touchStartX;
    const deltaY = event.touches[0].clientY - this.touchStartY;
    
    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      event.preventDefault();
      
      // Update swipe offset with resistance at edges
      const resistance = Math.abs(deltaX) > this.SWIPE_THRESHOLD ? 0.3 : 1;
      const offset = deltaX * resistance;
      
      this.updateToastState(toast.id, { 
        swipeOffset: offset,
        swipeVelocity: deltaX / 100
      });
    }
  }
  
  /**
   * Touch end handler for swipe completion
   */
  onTouchEnd(event: TouchEvent, toast: AnimatedToast): void {
    if (!this.currentToast || this.currentToast.id !== toast.id) return;
    
    const shouldDismiss = 
      Math.abs(toast.swipeOffset) > this.SWIPE_THRESHOLD ||
      Math.abs(toast.swipeVelocity) > this.SWIPE_VELOCITY_THRESHOLD;
    
    if (shouldDismiss) {
      this.toastService.dismiss(toast.id);
    } else {
      // Animate back to original position
      this.updateToastState(toast.id, { 
        swipeOffset: 0,
        swipeVelocity: 0
      });
    }
    
    this.currentToast = null;
  }
  
  /**
   * Get severity icon
   */
  getSeverityIcon(severity: ToastSeverity): string {
    const icons: Record<ToastSeverity, string> = {
      [ToastSeverity.SUCCESS]: 'check_circle',
      [ToastSeverity.ERROR]: 'error',
      [ToastSeverity.WARNING]: 'warning',
      [ToastSeverity.INFO]: 'info'
    };
    return icons[severity];
  }
  
  /**
   * Get severity color class
   */
  getSeverityClass(severity: ToastSeverity): string {
    return `toast--${severity}`;
  }
  
  /**
   * Track by function for performance
   */
  trackByToastId(index: number, toast: AnimatedToast): string {
    return toast.id;
  }
  
  /**
   * Get animation duration for progress bar
   */
  getProgressDuration(toast: AnimatedToast): number {
    return toast.duration || 0;
  }
  
  /**
   * Check if toast should show progress bar
   */
  shouldShowProgress(toast: AnimatedToast): boolean {
    return toast.duration !== undefined && toast.duration > 0;
  }
}
