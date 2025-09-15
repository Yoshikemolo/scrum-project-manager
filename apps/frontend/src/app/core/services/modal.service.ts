/**
 * Advanced Modal Service
 * Manages modal dialogs with animations, backdrop, and keyboard support
 */
import { Injectable, ComponentRef, ViewContainerRef, signal, computed, Type, Injector } from '@angular/core';
import { ComponentPortal, DomPortalOutlet } from '@angular/cdk/portal';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { Subject, Observable, fromEvent } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';

/**
 * Modal configuration options
 */
export interface ModalConfig {
  id?: string;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen' | 'auto';
  backdrop?: boolean | 'static';
  keyboard?: boolean;
  centered?: boolean;
  scrollable?: boolean;
  animation?: boolean;
  closeButton?: boolean;
  customClass?: string;
  data?: any;
  disableClose?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  panelClass?: string | string[];
  backdropClass?: string;
  hasBackdrop?: boolean;
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  position?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

/**
 * Modal reference for managing open modals
 */
export class ModalRef<T = any, R = any> {
  private readonly afterClosed$ = new Subject<R | undefined>();
  private readonly afterOpened$ = new Subject<void>();
  private readonly beforeClosed$ = new Subject<R | undefined>();
  private result?: R;
  private _closed = false;

  constructor(
    public readonly id: string,
    private overlayRef: OverlayRef,
    public readonly componentRef: ComponentRef<T>,
    private config: ModalConfig
  ) {
    // Handle backdrop click
    if (config.backdrop !== 'static' && config.backdrop !== false) {
      overlayRef.backdropClick().subscribe(() => {
        if (!config.disableClose) {
          this.close();
        }
      });
    }

    // Handle ESC key
    if (config.keyboard !== false) {
      overlayRef.keydownEvents()
        .pipe(filter(event => event.key === 'Escape'))
        .subscribe(event => {
          if (!config.disableClose) {
            event.preventDefault();
            event.stopPropagation();
            this.close();
          }
        });
    }

    // Emit opened event
    setTimeout(() => this.afterOpened$.next(), 100);
  }

  /**
   * Close the modal with optional result
   */
  close(result?: R): void {
    if (this._closed) return;

    this._closed = true;
    this.result = result;
    this.beforeClosed$.next(result);

    // Animate out
    this.overlayRef.detach();
    
    setTimeout(() => {
      this.overlayRef.dispose();
      this.afterClosed$.next(result);
      this.afterClosed$.complete();
      this.afterOpened$.complete();
      this.beforeClosed$.complete();
    }, 300);
  }

  /**
   * Get observable for after closed event
   */
  afterClosed(): Observable<R | undefined> {
    return this.afterClosed$.asObservable();
  }

  /**
   * Get observable for after opened event
   */
  afterOpened(): Observable<void> {
    return this.afterOpened$.asObservable();
  }

  /**
   * Get observable for before closed event
   */
  beforeClosed(): Observable<R | undefined> {
    return this.beforeClosed$.asObservable();
  }

  /**
   * Update modal config
   */
  updateConfig(config: Partial<ModalConfig>): void {
    Object.assign(this.config, config);
    this.updateOverlaySize();
  }

  /**
   * Update overlay size
   */
  private updateOverlaySize(): void {
    const overlayConfig = this.getOverlayConfig();
    this.overlayRef.updateSize({
      width: overlayConfig.width,
      height: overlayConfig.height,
      minWidth: overlayConfig.minWidth,
      minHeight: overlayConfig.minHeight,
      maxWidth: overlayConfig.maxWidth,
      maxHeight: overlayConfig.maxHeight
    });
  }

  /**
   * Get overlay configuration
   */
  private getOverlayConfig(): OverlayConfig {
    const config = this.config;
    const sizeConfig = this.getSizeConfig(config.size);

    return {
      width: config.width || sizeConfig.width,
      height: config.height || sizeConfig.height,
      minWidth: config.minWidth || sizeConfig.minWidth,
      minHeight: config.minHeight || sizeConfig.minHeight,
      maxWidth: config.maxWidth || sizeConfig.maxWidth,
      maxHeight: config.maxHeight || sizeConfig.maxHeight
    };
  }

  /**
   * Get size configuration
   */
  private getSizeConfig(size?: string): any {
    switch (size) {
      case 'small':
        return {
          width: '400px',
          maxWidth: '90vw',
          maxHeight: '90vh'
        };
      case 'large':
        return {
          width: '900px',
          maxWidth: '90vw',
          maxHeight: '90vh'
        };
      case 'fullscreen':
        return {
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh'
        };
      case 'auto':
        return {
          maxWidth: '90vw',
          maxHeight: '90vh'
        };
      default: // medium
        return {
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh'
        };
    }
  }
}

/**
 * Modal service for managing modals
 */
@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private openModals = signal<Map<string, ModalRef>>(new Map());
  private modalCounter = 0;
  private readonly destroy$ = new Subject<void>();

  // Computed values
  public readonly hasOpenModals = computed(() => this.openModals().size > 0);
  public readonly openModalCount = computed(() => this.openModals().size);
  public readonly topModal = computed(() => {
    const modals = Array.from(this.openModals().values());
    return modals[modals.length - 1] || null;
  });

  constructor(
    private overlay: Overlay,
    private injector: Injector
  ) {
    this.setupKeyboardHandling();
  }

  /**
   * Open a modal with a component
   */
  open<T, D = any, R = any>(
    component: Type<T>,
    config: ModalConfig = {}
  ): ModalRef<T, R> {
    // Generate unique ID
    const modalId = config.id || `modal-${++this.modalCounter}`;

    // Create overlay
    const overlayRef = this.createOverlay(config);

    // Create component portal
    const portal = new ComponentPortal(component, null, this.createInjector(config, overlayRef));
    const componentRef = overlayRef.attach(portal);

    // Create modal reference
    const modalRef = new ModalRef<T, R>(modalId, overlayRef, componentRef, config);

    // Store modal reference
    this.openModals.update(modals => {
      const newModals = new Map(modals);
      newModals.set(modalId, modalRef);
      return newModals;
    });

    // Handle modal close
    modalRef.afterClosed().subscribe(() => {
      this.openModals.update(modals => {
        const newModals = new Map(modals);
        newModals.delete(modalId);
        return newModals;
      });
    });

    // Add animation classes
    if (config.animation !== false) {
      this.animateIn(overlayRef);
    }

    // Handle auto-focus
    if (config.autoFocus !== false) {
      this.handleAutoFocus(overlayRef);
    }

    return modalRef;
  }

  /**
   * Close a specific modal
   */
  close(modalId: string, result?: any): void {
    const modal = this.openModals().get(modalId);
    if (modal) {
      modal.close(result);
    }
  }

  /**
   * Close all open modals
   */
  closeAll(): void {
    const modals = Array.from(this.openModals().values());
    modals.forEach(modal => modal.close());
  }

  /**
   * Get modal by ID
   */
  getModal(modalId: string): ModalRef | undefined {
    return this.openModals().get(modalId);
  }

  /**
   * Check if modal is open
   */
  isOpen(modalId: string): boolean {
    return this.openModals().has(modalId);
  }

  /**
   * Create overlay for modal
   */
  private createOverlay(config: ModalConfig): OverlayRef {
    const overlayConfig = this.getOverlayConfig(config);
    const overlayRef = this.overlay.create(overlayConfig);

    // Add custom classes
    if (config.customClass) {
      overlayRef.overlayElement.classList.add(config.customClass);
    }

    // Add panel classes
    if (config.panelClass) {
      const classes = Array.isArray(config.panelClass) ? config.panelClass : [config.panelClass];
      classes.forEach(cls => overlayRef.overlayElement.classList.add(cls));
    }

    return overlayRef;
  }

  /**
   * Get overlay configuration
   */
  private getOverlayConfig(config: ModalConfig): OverlayConfig {
    const positionStrategy = this.overlay.position()
      .global()
      .centerHorizontally()
      .centerVertically();

    if (config.position) {
      if (config.position.top) positionStrategy.top(config.position.top);
      if (config.position.bottom) positionStrategy.bottom(config.position.bottom);
      if (config.position.left) positionStrategy.left(config.position.left);
      if (config.position.right) positionStrategy.right(config.position.right);
    }

    const sizeConfig = this.getSizeConfig(config.size);

    return new OverlayConfig({
      hasBackdrop: config.hasBackdrop !== false && config.backdrop !== false,
      backdropClass: config.backdropClass || 'modal-backdrop',
      panelClass: 'modal-panel',
      scrollStrategy: config.scrollable ? this.overlay.scrollStrategies.block() : this.overlay.scrollStrategies.noop(),
      positionStrategy,
      width: config.width || sizeConfig.width,
      height: config.height || sizeConfig.height,
      minWidth: config.minWidth || sizeConfig.minWidth,
      minHeight: config.minHeight || sizeConfig.minHeight,
      maxWidth: config.maxWidth || sizeConfig.maxWidth,
      maxHeight: config.maxHeight || sizeConfig.maxHeight
    });
  }

  /**
   * Get size configuration
   */
  private getSizeConfig(size?: string): any {
    switch (size) {
      case 'small':
        return {
          width: '400px',
          maxWidth: '90vw',
          maxHeight: '90vh'
        };
      case 'large':
        return {
          width: '900px',
          maxWidth: '90vw',
          maxHeight: '90vh'
        };
      case 'fullscreen':
        return {
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh'
        };
      case 'auto':
        return {
          maxWidth: '90vw',
          maxHeight: '90vh'
        };
      default: // medium
        return {
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh'
        };
    }
  }

  /**
   * Create injector for modal component
   */
  private createInjector(config: ModalConfig, overlayRef: OverlayRef): Injector {
    return Injector.create({
      parent: this.injector,
      providers: [
        { provide: 'MODAL_DATA', useValue: config.data },
        { provide: OverlayRef, useValue: overlayRef }
      ]
    });
  }

  /**
   * Animate modal in
   */
  private animateIn(overlayRef: OverlayRef): void {
    const element = overlayRef.overlayElement;
    element.style.opacity = '0';
    element.style.transform = 'scale(0.95) translateY(-20px)';
    element.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';

    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1) translateY(0)';
    }, 50);
  }

  /**
   * Handle auto-focus
   */
  private handleAutoFocus(overlayRef: OverlayRef): void {
    setTimeout(() => {
      const element = overlayRef.overlayElement;
      const focusable = element.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusable) {
        focusable.focus();
      }
    }, 100);
  }

  /**
   * Setup keyboard handling for stacked modals
   */
  private setupKeyboardHandling(): void {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        takeUntil(this.destroy$),
        filter(event => event.key === 'Escape'),
        filter(() => this.hasOpenModals())
      )
      .subscribe(event => {
        const topModal = this.topModal();
        if (topModal && !topModal.componentRef.location.nativeElement.contains(document.activeElement)) {
          event.preventDefault();
          event.stopPropagation();
        }
      });
  }

  /**
   * Clean up on destroy
   */
  ngOnDestroy(): void {
    this.closeAll();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
