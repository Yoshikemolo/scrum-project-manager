/**
 * Advanced Drag and Drop Service with touch support
 * Provides unified drag-drop functionality for desktop and mobile devices
 */
import { Injectable, signal, computed, ElementRef } from '@angular/core';
import { Subject, Observable, fromEvent, merge, animationFrameScheduler } from 'rxjs';
import { filter, map, takeUntil, throttleTime, distinctUntilChanged } from 'rxjs/operators';

/**
 * Drag item data structure
 */
export interface DragItem {
  id: string;
  type: string;
  data: any;
  element?: HTMLElement;
  sourceContainer?: string;
  sourceIndex?: number;
}

/**
 * Drop zone configuration
 */
export interface DropZoneConfig {
  id: string;
  acceptTypes: string[];
  maxItems?: number;
  sortable?: boolean;
  group?: string;
  disabled?: boolean;
  enterClass?: string;
  activeClass?: string;
  placeholder?: boolean;
}

/**
 * Drag event data
 */
export interface DragEventData {
  item: DragItem;
  event: MouseEvent | TouchEvent;
  position: { x: number; y: number };
  offset: { x: number; y: number };
  dropZone?: DropZoneConfig;
}

/**
 * Drop result data
 */
export interface DropResult {
  item: DragItem;
  targetZone: DropZoneConfig;
  targetIndex?: number;
  accepted: boolean;
  event: MouseEvent | TouchEvent;
}

/**
 * Drag state management
 */
interface DragState {
  isDragging: boolean;
  dragItem: DragItem | null;
  dragElement: HTMLElement | null;
  ghostElement: HTMLElement | null;
  activeDropZone: DropZoneConfig | null;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  offset: { x: number; y: number };
  scrollInterval?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DragDropService {
  // State management with signals
  private dragState = signal<DragState>({
    isDragging: false,
    dragItem: null,
    dragElement: null,
    ghostElement: null,
    activeDropZone: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });

  // Registered drop zones
  private dropZones = new Map<string, DropZoneConfig>();
  private dropZoneElements = new Map<string, HTMLElement>();

  // Event subjects
  private dragStart$ = new Subject<DragEventData>();
  private dragMove$ = new Subject<DragEventData>();
  private dragEnd$ = new Subject<DragEventData>();
  private dragEnter$ = new Subject<DragEventData>();
  private dragLeave$ = new Subject<DragEventData>();
  private drop$ = new Subject<DropResult>();

  // Computed signals
  public readonly isDragging = computed(() => this.dragState().isDragging);
  public readonly currentDragItem = computed(() => this.dragState().dragItem);
  public readonly activeDropZone = computed(() => this.dragState().activeDropZone);

  // Configuration
  private readonly DRAG_THRESHOLD = 5; // pixels
  private readonly SCROLL_ZONE_SIZE = 50; // pixels
  private readonly SCROLL_SPEED = 10; // pixels per frame
  private readonly GHOST_OPACITY = 0.5;
  private readonly HAPTIC_FEEDBACK = true;

  // Touch handling
  private touchTimeout?: number;
  private readonly LONG_PRESS_DELAY = 500; // ms

  constructor() {
    this.setupGlobalListeners();
  }

  /**
   * Register a draggable element
   */
  public makeDraggable(
    element: HTMLElement,
    item: DragItem,
    options: {
      handle?: string;
      preview?: HTMLElement | (() => HTMLElement);
      disabled?: boolean;
      cursor?: string;
      haptic?: boolean;
    } = {}
  ): () => void {
    if (options.disabled) return () => {};

    // Set cursor style
    element.style.cursor = options.cursor || 'move';
    
    // Handle element (if specified)
    const handleElement = options.handle 
      ? element.querySelector(options.handle) as HTMLElement
      : element;

    if (!handleElement) return () => {};

    // Desktop drag events
    const mousedown$ = fromEvent<MouseEvent>(handleElement, 'mousedown');
    const dragstart$ = fromEvent<DragEvent>(element, 'dragstart');
    
    // Touch events for mobile
    const touchstart$ = fromEvent<TouchEvent>(handleElement, 'touchstart');
    const touchmove$ = fromEvent<TouchEvent>(document, 'touchmove', { passive: false });
    const touchend$ = fromEvent<TouchEvent>(document, 'touchend');

    // Prevent default drag behavior
    const preventDrag = dragstart$.subscribe(e => e.preventDefault());

    // Mouse drag handling
    const mouseDrag = mousedown$
      .pipe(
        filter(e => e.button === 0), // Left button only
        map(e => this.initiateDrag(e, element, item, options.preview))
      )
      .subscribe();

    // Touch drag handling with long press
    const touchDrag = touchstart$
      .pipe(
        filter(e => e.touches.length === 1) // Single touch only
      )
      .subscribe(e => {
        const touch = e.touches[0];
        
        // Clear any existing timeout
        if (this.touchTimeout) {
          clearTimeout(this.touchTimeout);
        }

        // Start long press detection
        this.touchTimeout = window.setTimeout(() => {
          // Trigger haptic feedback if supported
          if (options.haptic !== false && this.HAPTIC_FEEDBACK) {
            this.triggerHapticFeedback();
          }

          // Convert touch event to mouse-like event
          const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0
          });

          this.initiateDrag(mouseEvent, element, item, options.preview);
        }, this.LONG_PRESS_DELAY);

        // Cancel on move or end
        const cancelSub = merge(touchmove$, touchend$)
          .pipe(takeUntil(this.dragStart$))
          .subscribe(() => {
            if (this.touchTimeout) {
              clearTimeout(this.touchTimeout);
              this.touchTimeout = undefined;
            }
            cancelSub.unsubscribe();
          });
      });

    // Cleanup function
    return () => {
      preventDrag.unsubscribe();
      mouseDrag.unsubscribe();
      touchDrag.unsubscribe();
      if (this.touchTimeout) {
        clearTimeout(this.touchTimeout);
      }
    };
  }

  /**
   * Register a drop zone
   */
  public registerDropZone(
    element: HTMLElement,
    config: DropZoneConfig
  ): () => void {
    this.dropZones.set(config.id, config);
    this.dropZoneElements.set(config.id, element);

    // Add data attributes for styling
    element.dataset.dropZone = config.id;
    element.dataset.dropTypes = config.acceptTypes.join(',');

    // Cleanup function
    return () => {
      this.dropZones.delete(config.id);
      this.dropZoneElements.delete(config.id);
      delete element.dataset.dropZone;
      delete element.dataset.dropTypes;
    };
  }

  /**
   * Initiate drag operation
   */
  private initiateDrag(
    event: MouseEvent | TouchEvent,
    element: HTMLElement,
    item: DragItem,
    preview?: HTMLElement | (() => HTMLElement)
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const position = this.getEventPosition(event);
    const elementRect = element.getBoundingClientRect();
    
    // Calculate offset from element corner
    const offset = {
      x: position.x - elementRect.left,
      y: position.y - elementRect.top
    };

    // Create ghost element
    const ghostElement = this.createGhostElement(element, preview);
    this.positionGhostElement(ghostElement, position, offset);
    document.body.appendChild(ghostElement);

    // Update state
    this.dragState.update(state => ({
      ...state,
      isDragging: true,
      dragItem: { ...item, element },
      dragElement: element,
      ghostElement,
      startPosition: position,
      currentPosition: position,
      offset
    }));

    // Add dragging class to original element
    element.classList.add('dragging');

    // Emit drag start event
    this.dragStart$.next({
      item,
      event,
      position,
      offset
    });

    // Start auto-scroll if near edges
    this.startAutoScroll();
  }

  /**
   * Create ghost element for drag preview
   */
  private createGhostElement(
    element: HTMLElement,
    preview?: HTMLElement | (() => HTMLElement)
  ): HTMLElement {
    let ghost: HTMLElement;

    if (preview) {
      ghost = typeof preview === 'function' ? preview() : preview.cloneNode(true) as HTMLElement;
    } else {
      ghost = element.cloneNode(true) as HTMLElement;
    }

    // Style ghost element
    ghost.style.position = 'fixed';
    ghost.style.zIndex = '10000';
    ghost.style.opacity = this.GHOST_OPACITY.toString();
    ghost.style.pointerEvents = 'none';
    ghost.style.transform = 'rotate(2deg) scale(1.05)';
    ghost.style.transition = 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)';
    ghost.style.width = `${element.offsetWidth}px`;
    ghost.style.height = `${element.offsetHeight}px`;
    ghost.classList.add('drag-ghost');

    return ghost;
  }

  /**
   * Position ghost element at cursor
   */
  private positionGhostElement(
    ghost: HTMLElement,
    position: { x: number; y: number },
    offset: { x: number; y: number }
  ): void {
    ghost.style.left = `${position.x - offset.x}px`;
    ghost.style.top = `${position.y - offset.y}px`;
  }

  /**
   * Setup global event listeners
   */
  private setupGlobalListeners(): void {
    // Mouse events
    merge(
      fromEvent<MouseEvent>(document, 'mousemove'),
      fromEvent<TouchEvent>(document, 'touchmove', { passive: false })
    )
      .pipe(
        filter(() => this.isDragging()),
        throttleTime(16, animationFrameScheduler), // 60 FPS
        map(e => this.getEventPosition(e))
      )
      .subscribe(position => {
        this.handleDragMove(position);
      });

    // End drag
    merge(
      fromEvent<MouseEvent>(document, 'mouseup'),
      fromEvent<TouchEvent>(document, 'touchend')
    )
      .pipe(filter(() => this.isDragging()))
      .subscribe(event => {
        this.handleDragEnd(event);
      });

    // Cancel on ESC
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(e => e.key === 'Escape' && this.isDragging())
      )
      .subscribe(() => {
        this.cancelDrag();
      });
  }

  /**
   * Handle drag move
   */
  private handleDragMove(position: { x: number; y: number }): void {
    const state = this.dragState();
    if (!state.ghostElement || !state.dragItem) return;

    // Update position
    this.positionGhostElement(state.ghostElement, position, state.offset);
    
    // Update state
    this.dragState.update(s => ({
      ...s,
      currentPosition: position
    }));

    // Check drop zones
    const dropZone = this.findDropZoneAtPosition(position);
    
    if (dropZone !== state.activeDropZone) {
      // Leave previous zone
      if (state.activeDropZone) {
        this.handleDragLeave(state.activeDropZone);
      }

      // Enter new zone
      if (dropZone) {
        this.handleDragEnter(dropZone);
      }

      // Update active zone
      this.dragState.update(s => ({
        ...s,
        activeDropZone: dropZone
      }));
    }

    // Emit move event
    this.dragMove$.next({
      item: state.dragItem,
      event: new MouseEvent('mousemove'),
      position,
      offset: state.offset,
      dropZone
    });
  }

  /**
   * Handle drag end
   */
  private handleDragEnd(event: MouseEvent | TouchEvent): void {
    const state = this.dragState();
    if (!state.dragItem) return;

    const position = this.getEventPosition(event);
    const dropZone = state.activeDropZone;

    // Clean up
    this.cleanup();

    // Handle drop
    if (dropZone && this.canDrop(state.dragItem, dropZone)) {
      const targetIndex = this.calculateDropIndex(position, dropZone);
      
      this.drop$.next({
        item: state.dragItem,
        targetZone: dropZone,
        targetIndex,
        accepted: true,
        event
      });
    } else {
      // Animate back to original position
      this.animateBackToOrigin(state);
    }

    // Emit end event
    this.dragEnd$.next({
      item: state.dragItem,
      event,
      position,
      offset: state.offset,
      dropZone
    });
  }

  /**
   * Cancel drag operation
   */
  private cancelDrag(): void {
    const state = this.dragState();
    if (state.dragItem && state.dragElement) {
      this.animateBackToOrigin(state);
    }
    this.cleanup();
  }

  /**
   * Clean up after drag
   */
  private cleanup(): void {
    const state = this.dragState();

    // Remove ghost element
    if (state.ghostElement && state.ghostElement.parentNode) {
      state.ghostElement.remove();
    }

    // Remove dragging class
    if (state.dragElement) {
      state.dragElement.classList.remove('dragging');
    }

    // Clear active drop zone styles
    if (state.activeDropZone) {
      this.handleDragLeave(state.activeDropZone);
    }

    // Stop auto-scroll
    this.stopAutoScroll();

    // Reset state
    this.dragState.set({
      isDragging: false,
      dragItem: null,
      dragElement: null,
      ghostElement: null,
      activeDropZone: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      offset: { x: 0, y: 0 }
    });
  }

  /**
   * Find drop zone at position
   */
  private findDropZoneAtPosition(position: { x: number; y: number }): DropZoneConfig | null {
    const state = this.dragState();
    if (!state.dragItem) return null;

    for (const [id, config] of this.dropZones) {
      if (config.disabled) continue;
      if (!this.canDrop(state.dragItem, config)) continue;

      const element = this.dropZoneElements.get(id);
      if (!element) continue;

      const rect = element.getBoundingClientRect();
      if (
        position.x >= rect.left &&
        position.x <= rect.right &&
        position.y >= rect.top &&
        position.y <= rect.bottom
      ) {
        return config;
      }
    }

    return null;
  }

  /**
   * Check if item can be dropped in zone
   */
  private canDrop(item: DragItem, zone: DropZoneConfig): boolean {
    // Check type compatibility
    if (!zone.acceptTypes.includes(item.type) && !zone.acceptTypes.includes('*')) {
      return false;
    }

    // Check max items
    if (zone.maxItems !== undefined) {
      const element = this.dropZoneElements.get(zone.id);
      if (element) {
        const currentItems = element.querySelectorAll('[data-drag-item]').length;
        if (currentItems >= zone.maxItems) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Calculate drop index in sortable zone
   */
  private calculateDropIndex(position: { x: number; y: number }, zone: DropZoneConfig): number {
    if (!zone.sortable) return -1;

    const element = this.dropZoneElements.get(zone.id);
    if (!element) return -1;

    const items = Array.from(element.querySelectorAll('[data-drag-item]'));
    
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      
      if (position.y < midpoint) {
        return i;
      }
    }

    return items.length;
  }

  /**
   * Handle drag enter drop zone
   */
  private handleDragEnter(zone: DropZoneConfig): void {
    const element = this.dropZoneElements.get(zone.id);
    if (!element) return;

    element.classList.add('drop-zone-active');
    if (zone.enterClass) {
      element.classList.add(zone.enterClass);
    }

    const state = this.dragState();
    if (state.dragItem) {
      this.dragEnter$.next({
        item: state.dragItem,
        event: new MouseEvent('dragenter'),
        position: state.currentPosition,
        offset: state.offset,
        dropZone: zone
      });
    }
  }

  /**
   * Handle drag leave drop zone
   */
  private handleDragLeave(zone: DropZoneConfig): void {
    const element = this.dropZoneElements.get(zone.id);
    if (!element) return;

    element.classList.remove('drop-zone-active');
    if (zone.enterClass) {
      element.classList.remove(zone.enterClass);
    }

    const state = this.dragState();
    if (state.dragItem) {
      this.dragLeave$.next({
        item: state.dragItem,
        event: new MouseEvent('dragleave'),
        position: state.currentPosition,
        offset: state.offset,
        dropZone: zone
      });
    }
  }

  /**
   * Animate element back to original position
   */
  private animateBackToOrigin(state: DragState): void {
    if (!state.ghostElement || !state.dragElement) return;

    const rect = state.dragElement.getBoundingClientRect();
    state.ghostElement.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';
    state.ghostElement.style.left = `${rect.left}px`;
    state.ghostElement.style.top = `${rect.top}px`;
    state.ghostElement.style.transform = 'rotate(0) scale(1)';
    state.ghostElement.style.opacity = '0';

    setTimeout(() => {
      if (state.ghostElement && state.ghostElement.parentNode) {
        state.ghostElement.remove();
      }
    }, 300);
  }

  /**
   * Start auto-scroll near edges
   */
  private startAutoScroll(): void {
    const state = this.dragState();
    if (state.scrollInterval) return;

    const scrollInterval = window.setInterval(() => {
      const position = state.currentPosition;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      let scrollX = 0;
      let scrollY = 0;

      // Vertical scrolling
      if (position.y < this.SCROLL_ZONE_SIZE) {
        scrollY = -this.SCROLL_SPEED;
      } else if (position.y > viewportHeight - this.SCROLL_ZONE_SIZE) {
        scrollY = this.SCROLL_SPEED;
      }

      // Horizontal scrolling
      if (position.x < this.SCROLL_ZONE_SIZE) {
        scrollX = -this.SCROLL_SPEED;
      } else if (position.x > viewportWidth - this.SCROLL_ZONE_SIZE) {
        scrollX = this.SCROLL_SPEED;
      }

      if (scrollX !== 0 || scrollY !== 0) {
        window.scrollBy(scrollX, scrollY);
      }
    }, 16); // 60 FPS

    this.dragState.update(s => ({ ...s, scrollInterval }));
  }

  /**
   * Stop auto-scroll
   */
  private stopAutoScroll(): void {
    const state = this.dragState();
    if (state.scrollInterval) {
      clearInterval(state.scrollInterval);
      this.dragState.update(s => ({ ...s, scrollInterval: undefined }));
    }
  }

  /**
   * Get position from mouse or touch event
   */
  private getEventPosition(event: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('touches' in event && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    } else if ('clientX' in event) {
      return {
        x: event.clientX,
        y: event.clientY
      };
    }
    return { x: 0, y: 0 };
  }

  /**
   * Trigger haptic feedback on mobile
   */
  private triggerHapticFeedback(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  /**
   * Observable streams
   */
  public get onDragStart$(): Observable<DragEventData> {
    return this.dragStart$.asObservable();
  }

  public get onDragMove$(): Observable<DragEventData> {
    return this.dragMove$.asObservable();
  }

  public get onDragEnd$(): Observable<DragEventData> {
    return this.dragEnd$.asObservable();
  }

  public get onDragEnter$(): Observable<DragEventData> {
    return this.dragEnter$.asObservable();
  }

  public get onDragLeave$(): Observable<DragEventData> {
    return this.dragLeave$.asObservable();
  }

  public get onDrop$(): Observable<DropResult> {
    return this.drop$.asObservable();
  }
}
