/**
 * Reusable Modal Component
 * Provides consistent modal structure with header, body, and footer
 */
import { Component, Input, Output, EventEmitter, HostListener, OnInit, signal, computed, ViewChild, ElementRef, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ModalRef } from '../../../core/services/modal.service';

/**
 * Modal size options
 */
export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen' | 'auto';

/**
 * Modal component for displaying content in overlay
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'scale(0.95) translateY(-20px)'
        }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({
            opacity: 1,
            transform: 'scale(1) translateY(0)'
          })
        )
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.6, 1)', 
          style({
            opacity: 0,
            transform: 'scale(0.95) translateY(-20px)'
          })
        )
      ])
    ]),
    trigger('backdropAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class ModalComponent implements OnInit {
  // Input properties
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() size: ModalSize = 'medium';
  @Input() showCloseButton = true;
  @Input() showHeader = true;
  @Input() showFooter = true;
  @Input() centered = true;
  @Input() scrollable = false;
  @Input() loading = false;
  @Input() disableClose = false;
  @Input() customClass?: string;
  @Input() headerClass?: string;
  @Input() bodyClass?: string;
  @Input() footerClass?: string;
  @Input() icon?: string;
  @Input() iconColor?: string;
  @Input() backdrop: boolean | 'static' = true;
  @Input() keyboard = true;
  @Input() ariaLabel?: string;
  @Input() ariaDescribedBy?: string;
  
  // Output events
  @Output() closed = new EventEmitter<any>();
  @Output() opened = new EventEmitter<void>();
  @Output() backdropClick = new EventEmitter<MouseEvent>();
  
  // Content projection
  @ContentChild('header') headerTemplate?: TemplateRef<any>;
  @ContentChild('footer') footerTemplate?: TemplateRef<any>;
  @ContentChild('actions') actionsTemplate?: TemplateRef<any>;
  
  // View children
  @ViewChild('modalDialog') modalDialog?: ElementRef<HTMLElement>;
  @ViewChild('closeButton') closeButton?: ElementRef<HTMLButtonElement>;
  
  // State management
  public isOpen = signal(false);
  public isAnimating = signal(false);
  public isDragging = signal(false);
  public dragOffset = signal({ x: 0, y: 0 });
  public isMaximized = signal(false);
  public isMinimized = signal(false);
  
  // Computed properties
  public modalClasses = computed(() => ({
    'modal': true,
    'modal--open': this.isOpen(),
    'modal--animating': this.isAnimating(),
    'modal--centered': this.centered && !this.isDragging(),
    'modal--scrollable': this.scrollable,
    'modal--maximized': this.isMaximized(),
    'modal--minimized': this.isMinimized(),
    [`modal--${this.size}`]: true,
    [this.customClass || '']: !!this.customClass
  }));
  
  public dialogClasses = computed(() => ({
    'modal__dialog': true,
    'modal__dialog--dragging': this.isDragging(),
    'modal__dialog--centered': this.centered && !this.isDragging()
  }));
  
  // Drag state
  private dragStartX = 0;
  private dragStartY = 0;
  private initialX = 0;
  private initialY = 0;
  
  // Modal reference (if used with service)
  private modalRef?: ModalRef;
  
  constructor() {}
  
  ngOnInit(): void {
    // Open modal on init
    this.open();
  }
  
  /**
   * Open the modal
   */
  public open(): void {
    if (this.isOpen()) return;
    
    this.isOpen.set(true);
    this.isAnimating.set(true);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      this.isAnimating.set(false);
      this.opened.emit();
      this.focusFirstElement();
    }, 300);
  }
  
  /**
   * Close the modal
   */
  public close(result?: any): void {
    if (!this.isOpen() || this.disableClose) return;
    
    this.isAnimating.set(true);
    
    setTimeout(() => {
      this.isOpen.set(false);
      this.isAnimating.set(false);
      document.body.style.overflow = '';
      this.closed.emit(result);
      
      if (this.modalRef) {
        this.modalRef.close(result);
      }
    }, 200);
  }
  
  /**
   * Handle backdrop click
   */
  public onBackdropClick(event: MouseEvent): void {
    if (this.backdrop === 'static' || this.disableClose) {
      this.shake();
      return;
    }
    
    this.backdropClick.emit(event);
    
    if (this.backdrop !== false) {
      this.close();
    }
  }
  
  /**
   * Handle dialog click (prevent closing)
   */
  public onDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }
  
  /**
   * Handle keyboard events
   */
  @HostListener('document:keydown', ['$event'])
  public handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.isOpen()) return;
    
    if (event.key === 'Escape' && this.keyboard) {
      if (this.disableClose) {
        this.shake();
      } else {
        event.preventDefault();
        this.close();
      }
    }
  }
  
  /**
   * Maximize modal
   */
  public maximize(): void {
    this.isMaximized.set(!this.isMaximized());
    this.isMinimized.set(false);
    
    if (this.isMaximized()) {
      this.dragOffset.set({ x: 0, y: 0 });
    }
  }
  
  /**
   * Minimize modal
   */
  public minimize(): void {
    this.isMinimized.set(!this.isMinimized());
    this.isMaximized.set(false);
  }
  
  /**
   * Start dragging
   */
  public startDrag(event: MouseEvent): void {
    if (this.isMaximized()) return;
    
    event.preventDefault();
    this.isDragging.set(true);
    
    const offset = this.dragOffset();
    this.dragStartX = event.clientX - offset.x;
    this.dragStartY = event.clientY - offset.y;
    
    // Add event listeners
    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);
  }
  
  /**
   * Handle drag move
   */
  private onDragMove = (event: MouseEvent): void => {
    if (!this.isDragging()) return;
    
    const x = event.clientX - this.dragStartX;
    const y = event.clientY - this.dragStartY;
    
    // Constrain to viewport
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;
    const constrainedX = Math.max(-maxX / 2, Math.min(maxX / 2, x));
    const constrainedY = Math.max(0, Math.min(maxY, y));
    
    this.dragOffset.set({ x: constrainedX, y: constrainedY });
  };
  
  /**
   * Handle drag end
   */
  private onDragEnd = (): void => {
    this.isDragging.set(false);
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
  };
  
  /**
   * Shake animation for denied actions
   */
  private shake(): void {
    if (!this.modalDialog) return;
    
    const element = this.modalDialog.nativeElement;
    element.classList.add('modal__dialog--shake');
    
    setTimeout(() => {
      element.classList.remove('modal__dialog--shake');
    }, 500);
  }
  
  /**
   * Focus first focusable element
   */
  private focusFirstElement(): void {
    if (!this.modalDialog) return;
    
    const focusable = this.modalDialog.nativeElement.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusable) {
      focusable.focus();
    } else if (this.closeButton) {
      this.closeButton.nativeElement.focus();
    }
  }
  
  /**
   * Set modal reference (for service integration)
   */
  public setModalRef(ref: ModalRef): void {
    this.modalRef = ref;
  }
  
  /**
   * Get transform style for dragging
   */
  public getTransformStyle(): string {
    const offset = this.dragOffset();
    return `translate(${offset.x}px, ${offset.y}px)`;
  }
}
