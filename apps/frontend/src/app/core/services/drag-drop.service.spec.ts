/**
 * Unit tests for DragDropService
 * Tests drag and drop functionality for desktop and mobile
 */
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DragDropService, DragItem, DropZoneConfig } from './drag-drop.service';

describe('DragDropService', () => {
  let service: DragDropService;
  let testElement: HTMLElement;
  let dropZone: HTMLElement;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DragDropService);
    
    // Create test elements
    testElement = document.createElement('div');
    testElement.style.width = '100px';
    testElement.style.height = '100px';
    testElement.textContent = 'Drag Me';
    document.body.appendChild(testElement);
    
    dropZone = document.createElement('div');
    dropZone.style.width = '200px';
    dropZone.style.height = '200px';
    dropZone.style.position = 'absolute';
    dropZone.style.top = '300px';
    dropZone.style.left = '300px';
    document.body.appendChild(dropZone);
  });
  
  afterEach(() => {
    if (testElement.parentNode) {
      testElement.remove();
    }
    if (dropZone.parentNode) {
      dropZone.remove();
    }
  });
  
  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
    
    it('should initialize with default state', () => {
      expect(service.isDragging()).toBe(false);
      expect(service.currentDragItem()).toBeNull();
      expect(service.activeDropZone()).toBeNull();
    });
  });
  
  describe('Make Draggable', () => {
    it('should make element draggable', () => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: { value: 'test data' }
      };
      
      const cleanup = service.makeDraggable(testElement, item);
      
      expect(testElement.style.cursor).toBe('move');
      expect(typeof cleanup).toBe('function');
      
      cleanup();
    });
    
    it('should support custom cursor', () => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      service.makeDraggable(testElement, item, { cursor: 'grab' });
      
      expect(testElement.style.cursor).toBe('grab');
    });
    
    it('should not make disabled element draggable', () => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      const cleanup = service.makeDraggable(testElement, item, { disabled: true });
      
      expect(testElement.style.cursor).toBe('');
      cleanup();
    });
    
    it('should use handle element if specified', () => {
      const handle = document.createElement('div');
      handle.className = 'handle';
      testElement.appendChild(handle);
      
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      const cleanup = service.makeDraggable(testElement, item, { handle: '.handle' });
      
      expect(cleanup).toBeTruthy();
      cleanup();
    });
  });
  
  describe('Register Drop Zone', () => {
    it('should register drop zone', () => {
      const config: DropZoneConfig = {
        id: 'drop-zone-1',
        acceptTypes: ['test'],
        sortable: true
      };
      
      const cleanup = service.registerDropZone(dropZone, config);
      
      expect(dropZone.dataset.dropZone).toBe('drop-zone-1');
      expect(dropZone.dataset.dropTypes).toBe('test');
      expect(typeof cleanup).toBe('function');
      
      cleanup();
      expect(dropZone.dataset.dropZone).toBeUndefined();
    });
    
    it('should support multiple accept types', () => {
      const config: DropZoneConfig = {
        id: 'drop-zone-1',
        acceptTypes: ['type1', 'type2', 'type3']
      };
      
      service.registerDropZone(dropZone, config);
      
      expect(dropZone.dataset.dropTypes).toBe('type1,type2,type3');
    });
  });
  
  describe('Drag Start', () => {
    it('should emit drag start event', (done) => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: { value: 'test' }
      };
      
      service.onDragStart$.subscribe(event => {
        expect(event.item).toEqual(item);
        expect(event.position).toBeDefined();
        expect(event.offset).toBeDefined();
        done();
      });
      
      service.makeDraggable(testElement, item);
      
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
        button: 0
      });
      
      testElement.dispatchEvent(mouseEvent);
    });
    
    it('should update dragging state on drag start', () => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      service.makeDraggable(testElement, item);
      
      expect(service.isDragging()).toBe(false);
      
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
        button: 0
      });
      
      testElement.dispatchEvent(mouseEvent);
      
      expect(service.isDragging()).toBe(true);
      expect(service.currentDragItem()).toBeTruthy();
      expect(service.currentDragItem()?.id).toBe('test-item');
    });
    
    it('should add dragging class to element', () => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      service.makeDraggable(testElement, item);
      
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
        button: 0
      });
      
      testElement.dispatchEvent(mouseEvent);
      
      expect(testElement.classList.contains('dragging')).toBe(true);
    });
    
    it('should create ghost element', () => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      service.makeDraggable(testElement, item);
      
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
        button: 0
      });
      
      testElement.dispatchEvent(mouseEvent);
      
      const ghost = document.querySelector('.drag-ghost');
      expect(ghost).toBeTruthy();
      expect(ghost?.parentElement).toBe(document.body);
    });
  });
  
  describe('Drag Move', () => {
    beforeEach(() => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      service.makeDraggable(testElement, item);
      
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
        button: 0
      });
      
      testElement.dispatchEvent(mouseEvent);
    });
    
    it('should emit drag move event', (done) => {
      service.onDragMove$.subscribe(event => {
        expect(event.position.x).toBe(100);
        expect(event.position.y).toBe(100);
        done();
      });
      
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100
      });
      
      document.dispatchEvent(moveEvent);
    });
    
    it('should update ghost element position', fakeAsync(() => {
      const ghost = document.querySelector('.drag-ghost') as HTMLElement;
      expect(ghost).toBeTruthy();
      
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 150
      });
      
      document.dispatchEvent(moveEvent);
      tick(20);
      
      // Ghost position should be updated (accounting for offset)
      const left = parseFloat(ghost.style.left);
      const top = parseFloat(ghost.style.top);
      
      expect(left).toBeGreaterThan(0);
      expect(top).toBeGreaterThan(0);
    }));
  });
  
  describe('Drop Zone Detection', () => {
    beforeEach(() => {
      const config: DropZoneConfig = {
        id: 'drop-zone-1',
        acceptTypes: ['test'],
        sortable: true
      };
      
      service.registerDropZone(dropZone, config);
      
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      service.makeDraggable(testElement, item);
      
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
        button: 0
      });
      
      testElement.dispatchEvent(mouseEvent);
    });
    
    it('should detect drop zone on drag enter', fakeAsync(() => {
      let entered = false;
      
      service.onDragEnter$.subscribe(() => {
        entered = true;
      });
      
      // Move to drop zone
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 350,
        clientY: 350
      });
      
      document.dispatchEvent(moveEvent);
      tick(20);
      
      expect(entered).toBe(true);
      expect(service.activeDropZone()).toBeTruthy();
      expect(service.activeDropZone()?.id).toBe('drop-zone-1');
    }));
    
    it('should add active class to drop zone', fakeAsync(() => {
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 350,
        clientY: 350
      });
      
      document.dispatchEvent(moveEvent);
      tick(20);
      
      expect(dropZone.classList.contains('drop-zone-active')).toBe(true);
    }));
    
    it('should detect drop zone leave', fakeAsync(() => {
      // Enter drop zone
      const enterEvent = new MouseEvent('mousemove', {
        clientX: 350,
        clientY: 350
      });
      
      document.dispatchEvent(enterEvent);
      tick(20);
      
      expect(service.activeDropZone()).toBeTruthy();
      
      let left = false;
      service.onDragLeave$.subscribe(() => {
        left = true;
      });
      
      // Leave drop zone
      const leaveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100
      });
      
      document.dispatchEvent(leaveEvent);
      tick(20);
      
      expect(left).toBe(true);
      expect(service.activeDropZone()).toBeNull();
      expect(dropZone.classList.contains('drop-zone-active')).toBe(false);
    }));
  });
  
  describe('Drop Handling', () => {
    beforeEach(() => {
      const config: DropZoneConfig = {
        id: 'drop-zone-1',
        acceptTypes: ['test'],
        sortable: true
      };
      
      service.registerDropZone(dropZone, config);
    });
    
    it('should handle successful drop', fakeAsync(() => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: { value: 'test' }
      };
      
      service.makeDraggable(testElement, item);
      
      // Start drag
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
        button: 0
      });
      testElement.dispatchEvent(mouseDown);
      
      // Move to drop zone
      const mouseMove = new MouseEvent('mousemove', {
        clientX: 350,
        clientY: 350
      });
      document.dispatchEvent(mouseMove);
      tick(20);
      
      let dropResult: any;
      service.onDrop$.subscribe(result => {
        dropResult = result;
      });
      
      // Drop
      const mouseUp = new MouseEvent('mouseup', {
        clientX: 350,
        clientY: 350
      });
      document.dispatchEvent(mouseUp);
      
      expect(dropResult).toBeTruthy();
      expect(dropResult.item.id).toBe('test-item');
      expect(dropResult.targetZone.id).toBe('drop-zone-1');
      expect(dropResult.accepted).toBe(true);
    }));
    
    it('should reject drop for incompatible type', fakeAsync(() => {
      const item: DragItem = {
        id: 'test-item',
        type: 'incompatible',
        data: {}
      };
      
      service.makeDraggable(testElement, item);
      
      // Start drag
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
        button: 0
      });
      testElement.dispatchEvent(mouseDown);
      
      // Move to drop zone
      const mouseMove = new MouseEvent('mousemove', {
        clientX: 350,
        clientY: 350
      });
      document.dispatchEvent(mouseMove);
      tick(20);
      
      // Should not detect as active drop zone
      expect(service.activeDropZone()).toBeNull();
    }));
    
    it('should respect max items limit', () => {
      const config: DropZoneConfig = {
        id: 'limited-zone',
        acceptTypes: ['test'],
        maxItems: 1
      };
      
      const limitedZone = document.createElement('div');
      limitedZone.innerHTML = '<div data-drag-item="true">Existing Item</div>';
      document.body.appendChild(limitedZone);
      
      service.registerDropZone(limitedZone, config);
      
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      const canDrop = service['canDrop'](item, config);
      expect(canDrop).toBe(false);
      
      limitedZone.remove();
    });
  });
  
  describe('Touch Support', () => {
    it('should handle touch long press', fakeAsync(() => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      service.makeDraggable(testElement, item);
      
      const touchStart = new TouchEvent('touchstart', {
        touches: [{
          clientX: 50,
          clientY: 50,
          identifier: 0,
          target: testElement
        } as Touch]
      });
      
      testElement.dispatchEvent(touchStart);
      
      // Wait for long press delay
      tick(500);
      
      expect(service.isDragging()).toBe(true);
    }));
    
    it('should cancel long press on touch move', fakeAsync(() => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      service.makeDraggable(testElement, item);
      
      const touchStart = new TouchEvent('touchstart', {
        touches: [{
          clientX: 50,
          clientY: 50,
          identifier: 0,
          target: testElement
        } as Touch]
      });
      
      testElement.dispatchEvent(touchStart);
      
      // Move before long press completes
      tick(200);
      
      const touchMove = new TouchEvent('touchmove', {
        touches: [{
          clientX: 100,
          clientY: 100,
          identifier: 0,
          target: testElement
        } as Touch]
      });
      
      document.dispatchEvent(touchMove);
      
      tick(400);
      
      expect(service.isDragging()).toBe(false);
    }));
  });
  
  describe('Keyboard Support', () => {
    it('should cancel drag on Escape key', () => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      service.makeDraggable(testElement, item);
      
      // Start drag
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
        button: 0
      });
      testElement.dispatchEvent(mouseDown);
      
      expect(service.isDragging()).toBe(true);
      
      // Press Escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      
      expect(service.isDragging()).toBe(false);
    });
  });
  
  describe('Cleanup', () => {
    it('should clean up on drag end', () => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      service.makeDraggable(testElement, item);
      
      // Start drag
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
        button: 0
      });
      testElement.dispatchEvent(mouseDown);
      
      expect(service.isDragging()).toBe(true);
      expect(testElement.classList.contains('dragging')).toBe(true);
      
      // End drag
      const mouseUp = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUp);
      
      expect(service.isDragging()).toBe(false);
      expect(testElement.classList.contains('dragging')).toBe(false);
      
      const ghost = document.querySelector('.drag-ghost');
      expect(ghost).toBeNull();
    });
    
    it('should clean up when cleanup function called', () => {
      const item: DragItem = {
        id: 'test-item',
        type: 'test',
        data: {}
      };
      
      const cleanup = service.makeDraggable(testElement, item);
      
      cleanup();
      
      // Should not start drag after cleanup
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
        button: 0
      });
      testElement.dispatchEvent(mouseDown);
      
      expect(service.isDragging()).toBe(false);
    });
  });
});
