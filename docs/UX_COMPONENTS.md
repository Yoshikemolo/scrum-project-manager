# UX Components Guide

## Table of Contents

1. [Overview](#overview)
2. [Toast Notifications](#toast-notifications)
3. [Confirmation Dialogs](#confirmation-dialogs)
4. [Drag and Drop](#drag-and-drop)
5. [Internationalization](#internationalization)
6. [Modal System](#modal-system)
7. [Notification Center](#notification-center)
8. [Best Practices](#best-practices)
9. [Accessibility Guidelines](#accessibility-guidelines)
10. [Related Documentation](#related-documentation)

## Overview

This guide documents the advanced UX components implemented in the SCRUM Project Manager application. Each component is designed with comprehensive UX features including animations, touch support, accessibility, and internationalization.

## Toast Notifications

### ToastService

The `ToastService` provides a centralized system for displaying temporary notifications.

#### Features

- **Queue Management**: Handles multiple toasts with configurable limits
- **Auto-dismiss**: Configurable duration with progress bar
- **Severity Levels**: Success, error, warning, info
- **Actions**: Support for action buttons
- **Positioning**: 6 position options (top/bottom × left/center/right)
- **Persistence**: Save position preferences

#### Usage

```typescript
// Simple notifications
toastService.success('Operation completed successfully');
toastService.error('An error occurred', 'Please try again');
toastService.warning('Warning', 'This action cannot be undone');
toastService.info('Information', 'New update available');

// With actions
toastService.showUndo('Item deleted', 'The item has been removed', () => {
  // Undo logic
});

// Custom configuration
toastService.show({
  title: 'Custom Toast',
  message: 'With custom options',
  severity: ToastSeverity.INFO,
  duration: 10000,
  icon: 'custom_icon',
  actions: [{
    label: 'ACTION',
    action: () => console.log('Action clicked')
  }]
});
```

### ToastContainerComponent

The container component handles the display and animation of toasts.

#### Features

- **Smooth Animations**: Enter/exit animations with easing
- **Swipe-to-dismiss**: Touch gesture support for mobile
- **Progress Bar**: Visual indication of auto-dismiss timer
- **Responsive**: Adapts to mobile and desktop
- **Accessibility**: ARIA labels and keyboard support

## Confirmation Dialogs

### ConfirmDialogComponent

Provides consistent confirmation dialogs for destructive actions.

#### Features

- **Severity Levels**: Info, warning, danger, success
- **Countdown Timer**: For critical actions
- **Input Validation**: Optional input field with validation
- **Keyboard Shortcuts**: Y/N/ESC for quick actions
- **Loading States**: Show processing state
- **Details Section**: Additional information display

#### Usage

```typescript
// Simple confirmation
const dialogRef = dialog.open(ConfirmDialogComponent, {
  data: {
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    severity: ConfirmDialogSeverity.DANGER
  }
});

// With countdown
const dialogRef = dialog.open(ConfirmDialogComponent, {
  data: {
    title: 'Permanent Deletion',
    message: 'This action cannot be undone',
    severity: ConfirmDialogSeverity.DANGER,
    countdown: 5
  }
});

// With input validation
const dialogRef = dialog.open(ConfirmDialogComponent, {
  data: {
    title: 'Type to confirm',
    message: 'Type "DELETE" to confirm',
    showInput: true,
    inputValidator: (value) => 
      value !== 'DELETE' ? 'Type DELETE to confirm' : null
  }
});
```

## Drag and Drop

### DragDropService

Comprehensive drag and drop functionality for desktop and mobile.

#### Features

- **Touch Support**: Long-press detection for mobile
- **Drop Zones**: Configurable drop zones with validation
- **Auto-scroll**: Automatic scrolling near edges
- **Ghost Element**: Visual feedback during drag
- **Haptic Feedback**: Vibration on mobile devices
- **Sortable Lists**: Support for reordering items

#### Usage

```typescript
// Make element draggable
const cleanup = dragDropService.makeDraggable(element, {
  id: 'item-1',
  type: 'task',
  data: taskData
}, {
  handle: '.drag-handle',
  preview: customPreviewElement,
  haptic: true
});

// Register drop zone
const cleanup = dragDropService.registerDropZone(dropElement, {
  id: 'drop-zone-1',
  acceptTypes: ['task'],
  sortable: true,
  maxItems: 10,
  enterClass: 'drop-zone-active'
});

// Listen to drop events
dragDropService.onDrop$.subscribe(result => {
  console.log('Dropped:', result.item, 'in', result.targetZone);
});
```

## Internationalization

### I18nService

Complete internationalization support with formatting.

#### Supported Languages

- English (EN)
- Spanish (ES)
- French (FR)
- German (DE)
- Italian (IT)
- Portuguese (PT)
- Chinese (ZH)
- Japanese (JA)

#### Features

- **Translation System**: Key-based translations with parameters
- **Plural Support**: Intelligent plural handling
- **Date/Time Formatting**: Locale-aware formatting
- **Number Formatting**: Currency, percentage, file size
- **Relative Time**: "2 hours ago" style formatting
- **User Preferences**: Persistent locale settings

#### Usage

```typescript
// Simple translation
const text = i18n.translate('common.hello');

// With parameters
const welcome = i18n.translate('common.welcome', { name: 'John' });

// Plural translation
const items = i18n.translatePlural('items', count);

// Formatting
const date = i18n.formatDate(new Date());
const time = i18n.formatTime(new Date());
const number = i18n.formatNumber(1234.56);
const currency = i18n.formatCurrency(99.99, 'USD');
const relative = i18n.formatRelativeTime(yesterday);
```

## Modal System

### ModalService

Advanced modal management with stacking support.

#### Features

- **Stacked Modals**: Support for multiple modals
- **Draggable**: Move modals around the screen
- **Resizable**: Adjust modal size
- **Maximize/Minimize**: Window-like behavior
- **Custom Templates**: Flexible content projection
- **Animations**: Smooth open/close animations

#### Usage

```typescript
// Open modal
const modalRef = modalService.open(MyComponent, {
  title: 'Modal Title',
  size: 'large',
  centered: true,
  backdrop: 'static',
  data: { someData: 'value' }
});

// Handle result
modalRef.afterClosed().subscribe(result => {
  console.log('Modal closed with:', result);
});

// Update config
modalRef.updateConfig({ size: 'fullscreen' });
```

### ModalComponent

Reusable modal component with consistent structure.

#### Features

- **Header/Body/Footer**: Structured layout
- **Loading States**: Built-in loading indicator
- **Custom Classes**: Style customization
- **Keyboard Support**: ESC to close
- **Focus Management**: Proper focus trap

## Notification Center

### NotificationService

Real-time notification management system.

#### Features

- **WebSocket Integration**: Real-time updates
- **Desktop Notifications**: Browser notifications
- **Sound/Vibration**: Audio and haptic feedback
- **Filtering**: By type, priority, status
- **Grouping**: Group by type or date
- **Preferences**: User notification settings
- **Statistics**: Notification analytics

#### Usage

```typescript
// Add notification
notificationService.addNotification({
  type: NotificationType.TASK,
  priority: NotificationPriority.HIGH,
  title: 'New task assigned',
  message: 'You have been assigned a new task',
  actions: [{
    label: 'View Task',
    action: 'view-task',
    data: { taskId: '123' }
  }]
});

// Update preferences
notificationService.updatePreferences({
  desktop: true,
  sound: true,
  autoMarkAsRead: true
});

// Filter notifications
notificationService.updateFilter({
  types: [NotificationType.TASK, NotificationType.MENTION],
  unreadOnly: true
});
```

### NotificationCenterComponent

Notification management interface.

#### Features

- **Tabbed Interface**: All/Unread/Mentions
- **Search**: Filter notifications by text
- **Bulk Actions**: Select and manage multiple
- **Infinite Scroll**: Load more on scroll
- **Date Grouping**: Group by today/yesterday/week
- **Quick Actions**: Mark read, archive, delete

## Best Practices

### Component Design

1. **Consistency**: Use consistent patterns across components
2. **Feedback**: Provide immediate visual feedback
3. **Performance**: Optimize for 60fps animations
4. **Error Handling**: Graceful degradation
5. **Mobile First**: Design for touch, enhance for desktop

### State Management

1. **Use Signals**: Leverage Angular signals for performance
2. **Computed Values**: Use computed() for derived state
3. **Effects**: Handle side effects properly
4. **Cleanup**: Always clean up subscriptions

### Animation Guidelines

1. **Duration**: 200-300ms for most animations
2. **Easing**: Use cubic-bezier for natural motion
3. **Reduced Motion**: Respect prefers-reduced-motion
4. **GPU Acceleration**: Use transform and opacity

## Accessibility Guidelines

### ARIA Attributes

- Use proper roles (dialog, alert, region)
- Provide labels and descriptions
- Indicate states (expanded, selected, checked)
- Live regions for dynamic content

### Keyboard Navigation

- Support Tab/Shift+Tab navigation
- Provide keyboard shortcuts
- Trap focus in modals
- Visible focus indicators

### Screen Readers

- Semantic HTML structure
- Descriptive button labels
- Alternative text for icons
- Announce state changes

### Color and Contrast

- WCAG AA compliance (4.5:1 for text)
- Don't rely on color alone
- Support high contrast mode
- Test with color blindness simulators

## Related Documentation

- [Frontend Status](./FRONTEND_STATUS.md)
- [Frontend Structure](./FRONTEND_STRUCTURE.md)
- [Testing Guide](./TESTING.md)
- [Accessibility Standards](./ACCESSIBILITY.md)
- [Performance Guide](./PERFORMANCE.md)

---

Last updated: September 12, 2025
