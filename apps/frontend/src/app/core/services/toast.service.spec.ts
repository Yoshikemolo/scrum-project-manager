/**
 * Unit tests for ToastService
 * Tests toast creation, dismissal, queue management, and configuration
 */
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService, ToastSeverity, ToastPosition } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    localStorage.clear();
  });

  afterEach(() => {
    service.dismissAll();
  });

  describe('Toast Creation', () => {
    it('should create service instance', () => {
      expect(service).toBeTruthy();
    });

    it('should show success toast', () => {
      const id = service.success('Success', 'Operation completed');
      expect(service.toastCount()).toBe(1);
      
      const toast = service.activeToasts()[0];
      expect(toast.title).toBe('Success');
      expect(toast.message).toBe('Operation completed');
      expect(toast.severity).toBe(ToastSeverity.SUCCESS);
      expect(toast.icon).toBe('check_circle');
      expect(toast.id).toBe(id);
    });

    it('should show error toast with no auto-dismiss', () => {
      service.error('Error', 'Something went wrong');
      
      const toast = service.activeToasts()[0];
      expect(toast.severity).toBe(ToastSeverity.ERROR);
      expect(toast.duration).toBe(0);
      expect(toast.icon).toBe('error');
    });

    it('should show warning toast', () => {
      service.warning('Warning', 'Please review');
      
      const toast = service.activeToasts()[0];
      expect(toast.severity).toBe(ToastSeverity.WARNING);
      expect(toast.icon).toBe('warning');
    });

    it('should show info toast', () => {
      service.info('Info', 'For your information');
      
      const toast = service.activeToasts()[0];
      expect(toast.severity).toBe(ToastSeverity.INFO);
      expect(toast.icon).toBe('info');
    });

    it('should accept custom configuration', () => {
      const customIcon = 'custom_icon';
      const customDuration = 10000;
      
      service.show({
        title: 'Custom',
        message: 'Custom message',
        severity: ToastSeverity.INFO,
        icon: customIcon,
        duration: customDuration,
        closable: false
      });
      
      const toast = service.activeToasts()[0];
      expect(toast.icon).toBe(customIcon);
      expect(toast.duration).toBe(customDuration);
      expect(toast.closable).toBe(false);
    });

    it('should generate unique IDs for toasts', () => {
      const id1 = service.info('Toast 1');
      const id2 = service.info('Toast 2');
      
      expect(id1).not.toBe(id2);
      expect(service.toastCount()).toBe(2);
    });

    it('should add timestamp to toast', () => {
      const beforeTime = new Date();
      service.info('Test');
      const afterTime = new Date();
      
      const toast = service.activeToasts()[0];
      expect(toast.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(toast.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Toast Dismissal', () => {
    it('should dismiss specific toast', () => {
      const id = service.info('Test');
      expect(service.hasToasts()).toBe(true);
      
      service.dismiss(id);
      expect(service.hasToasts()).toBe(false);
    });

    it('should dismiss all toasts', () => {
      service.info('Toast 1');
      service.warning('Toast 2');
      service.error('Toast 3');
      
      expect(service.toastCount()).toBe(3);
      
      service.dismissAll();
      expect(service.toastCount()).toBe(0);
    });

    it('should dismiss toasts by severity', () => {
      service.info('Info 1');
      service.info('Info 2');
      service.warning('Warning');
      service.error('Error');
      
      expect(service.toastCount()).toBe(4);
      
      service.dismissBySeverity(ToastSeverity.INFO);
      expect(service.toastCount()).toBe(2);
      
      const remainingToasts = service.activeToasts();
      expect(remainingToasts.find(t => t.severity === ToastSeverity.INFO)).toBeUndefined();
    });

    it('should auto-dismiss toast after duration', fakeAsync(() => {
      service.info('Test', undefined, { duration: 1000 });
      expect(service.hasToasts()).toBe(true);
      
      tick(999);
      expect(service.hasToasts()).toBe(true);
      
      tick(1);
      expect(service.hasToasts()).toBe(false);
    }));

    it('should clear timeout when manually dismissed', fakeAsync(() => {
      const id = service.info('Test', undefined, { duration: 5000 });
      
      service.dismiss(id);
      expect(service.hasToasts()).toBe(false);
      
      tick(5000);
      expect(service.hasToasts()).toBe(false);
    }));

    it('should handle dismissing non-existent toast', () => {
      service.info('Test');
      expect(service.toastCount()).toBe(1);
      
      service.dismiss('non-existent-id');
      expect(service.toastCount()).toBe(1);
    });
  });

  describe('Queue Management', () => {
    it('should limit number of toasts to MAX_TOASTS', () => {
      for (let i = 0; i < 10; i++) {
        service.info(`Toast ${i}`);
      }
      
      expect(service.toastCount()).toBe(5); // MAX_TOASTS = 5
    });

    it('should remove oldest toast when queue is full', () => {
      for (let i = 0; i < 6; i++) {
        service.info(`Toast ${i}`);
      }
      
      const toasts = service.activeToasts();
      expect(toasts[0].title).toBe('Toast 1');
      expect(toasts[4].title).toBe('Toast 5');
    });
  });

  describe('Position Management', () => {
    it('should have default position', () => {
      expect(service.currentPosition()).toBe(ToastPosition.TOP_RIGHT);
    });

    it('should update position', () => {
      service.setPosition(ToastPosition.BOTTOM_CENTER);
      expect(service.currentPosition()).toBe(ToastPosition.BOTTOM_CENTER);
    });

    it('should persist position to localStorage', () => {
      service.setPosition(ToastPosition.TOP_LEFT);
      expect(localStorage.getItem('toast-position')).toBe(ToastPosition.TOP_LEFT);
    });

    it('should load position from localStorage', () => {
      localStorage.setItem('toast-position', ToastPosition.BOTTOM_RIGHT);
      
      const newService = new ToastService();
      expect(newService.currentPosition()).toBe(ToastPosition.BOTTOM_RIGHT);
    });

    it('should use toast-specific position over default', () => {
      service.setPosition(ToastPosition.TOP_RIGHT);
      
      service.info('Test', undefined, { position: ToastPosition.BOTTOM_LEFT });
      
      const toast = service.activeToasts()[0];
      expect(toast.position).toBe(ToastPosition.BOTTOM_LEFT);
    });
  });

  describe('Special Toast Types', () => {
    it('should show undo toast with action', () => {
      let undoCalled = false;
      const undoFn = () => { undoCalled = true; };
      
      service.showUndo('Deleted', 'Item was deleted', undoFn);
      
      const toast = service.activeToasts()[0];
      expect(toast.actions).toBeDefined();
      expect(toast.actions!.length).toBe(1);
      expect(toast.actions![0].label).toBe('UNDO');
      
      toast.actions![0].action();
      expect(undoCalled).toBe(true);
    });

    it('should show confirmation toast', () => {
      service.showConfirmation('Success', 'Item saved');
      
      const toast = service.activeToasts()[0];
      expect(toast.severity).toBe(ToastSeverity.SUCCESS);
      expect(toast.icon).toBe('task_alt');
      expect(toast.duration).toBe(3000);
    });

    it('should show loading toast without auto-dismiss', () => {
      const id = service.showLoading('Loading', 'Please wait...');
      
      const toast = service.activeToasts()[0];
      expect(toast.severity).toBe(ToastSeverity.INFO);
      expect(toast.icon).toBe('hourglass_empty');
      expect(toast.duration).toBe(0);
      expect(toast.closable).toBe(false);
      expect(toast.id).toBe(id);
    });
  });

  describe('Toast Update', () => {
    it('should update existing toast', () => {
      const id = service.info('Original', 'Original message');
      
      service.update(id, {
        title: 'Updated',
        message: 'Updated message',
        severity: ToastSeverity.SUCCESS
      });
      
      const toast = service.activeToasts()[0];
      expect(toast.title).toBe('Updated');
      expect(toast.message).toBe('Updated message');
      expect(toast.severity).toBe(ToastSeverity.SUCCESS);
      expect(toast.id).toBe(id); // ID should not change
    });

    it('should not update non-existent toast', () => {
      service.info('Test');
      
      service.update('non-existent', { title: 'Updated' });
      
      const toast = service.activeToasts()[0];
      expect(toast.title).toBe('Test');
    });
  });

  describe('Observable Streams', () => {
    it('should emit toast on creation', (done) => {
      service.toast$.subscribe(toast => {
        expect(toast.title).toBe('Test Toast');
        done();
      });
      
      service.info('Test Toast');
    });

    it('should emit dismissal event', (done) => {
      const id = service.info('Test');
      
      service.dismiss$.subscribe(dismissedId => {
        expect(dismissedId).toBe(id);
        done();
      });
      
      service.dismiss(id);
    });

    it('should emit wildcard on dismissAll', (done) => {
      service.info('Test 1');
      service.info('Test 2');
      
      service.dismiss$.subscribe(dismissedId => {
        expect(dismissedId).toBe('*');
        done();
      });
      
      service.dismissAll();
    });
  });

  describe('Computed Signals', () => {
    it('should update hasToasts signal', () => {
      expect(service.hasToasts()).toBe(false);
      
      service.info('Test');
      expect(service.hasToasts()).toBe(true);
      
      service.dismissAll();
      expect(service.hasToasts()).toBe(false);
    });

    it('should update toastCount signal', () => {
      expect(service.toastCount()).toBe(0);
      
      service.info('Test 1');
      expect(service.toastCount()).toBe(1);
      
      service.info('Test 2');
      expect(service.toastCount()).toBe(2);
      
      service.dismissAll();
      expect(service.toastCount()).toBe(0);
    });
  });
});
