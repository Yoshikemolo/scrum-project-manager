# Frontend Structure Documentation

## Table of Contents

1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [Service Layer](#service-layer)
4. [State Management](#state-management)
5. [Routing & Guards](#routing--guards)
6. [Interceptors](#interceptors)
7. [Naming Conventions](#naming-conventions)
8. [File Organization](#file-organization)
9. [Component Status](#component-status)
10. [Related Documentation](#related-documentation)

## Overview

The frontend application is built with Angular 20 using standalone components, following a modular architecture with clear separation of concerns. The application uses NgRx for state management, Angular Material for UI components, and follows reactive programming patterns with RxJS and Angular Signals.

## Component Architecture

### Layout Components

The application uses a master-detail layout pattern with the following components:

#### HeaderComponent
- **Location**: `app/layouts/header/`
- **Purpose**: Application header with navigation, user menu, and notifications
- **Features**:
  - Logo and branding
  - Global search
  - User profile dropdown
  - Notification bell icon
  - Theme toggle

#### SidebarComponent
- **Location**: `app/layouts/sidebar/`
- **Purpose**: Main navigation menu with collapsible behavior
- **Features**:
  - Hierarchical menu structure
  - Collapsible/expandable states
  - Permission-based menu items
  - Active route highlighting
  - Badge support for notifications

#### FooterComponent
- **Location**: `app/layouts/footer/`
- **Purpose**: Application footer with links and information
- **Features**:
  - Copyright information
  - Quick links
  - Version information
  - Hidden on mobile devices

### Shared Components

#### LoaderComponent
- **Location**: `app/shared/components/loader/`
- **Purpose**: Global loading indicator
- **Usage**: Displayed during HTTP requests and async operations

#### NotificationCenterComponent
- **Location**: `app/shared/components/notification-center/`
- **Purpose**: Centralized notification management
- **Features**:
  - Real-time notifications
  - Notification history
  - Mark as read/unread
  - Filter by type

## Service Layer

### Core Services

All core services are singleton services provided at the root level:

#### AuthService
- **Path**: `app/core/services/auth.service.ts`
- **Purpose**: Authentication and authorization management
- **Key Methods**:
  - `login()`: User authentication
  - `logout()`: Clear session
  - `refreshToken()`: Token renewal
  - `checkAuthStatus()`: Verify authentication
  - `hasPermission()`: Check user permissions
  - `hasAnyPermission()`: Check multiple permissions

#### LoadingService
- **Path**: `app/core/services/loading.service.ts`
- **Purpose**: Global loading state management
- **Key Methods**:
  - `startLoading()`: Show loader
  - `stopLoading()`: Hide loader
  - `withLoader()`: Wrap async operations
  - `isLoading$`: Observable for loading state
  - `isLoading()`: Signal for loading state

#### ThemeService
- **Path**: `app/core/services/theme.service.ts`
- **Purpose**: Theme management (light/dark mode)
- **Key Methods**:
  - `setTheme()`: Set specific theme
  - `toggleTheme()`: Switch between themes
  - `getSystemTheme()`: Detect system preference
  - `isDarkTheme$`: Observable for theme state

#### WebSocketService
- **Path**: `app/core/services/websocket.service.ts`
- **Purpose**: Real-time communication via WebSockets
- **Key Methods**:
  - `connect()`: Establish connection
  - `disconnect()`: Close connection
  - `emit()`: Send message
  - `on()`: Listen for events
  - `reconnect()`: Handle reconnection

#### ShortcutService
- **Path**: `app/core/services/shortcut.service.ts`
- **Purpose**: Keyboard shortcut management
- **Key Methods**:
  - `add()`: Register shortcut
  - `remove()`: Unregister shortcut
  - `trigger()`: Manually trigger shortcut
  - `getAll()`: List all shortcuts

#### LocalStorageService
- **Path**: `app/core/services/local-storage.service.ts`
- **Purpose**: Type-safe localStorage wrapper
- **Key Methods**:
  - `setItem()`: Store data
  - `getItem()`: Retrieve data
  - `removeItem()`: Delete data
  - `clear()`: Clear all data

## State Management

### NgRx Store Structure

```typescript
interface AppState {
  router: RouterReducerState;
  auth: AuthState;
  user: UserState;        // To be implemented
  projects: ProjectState;  // To be implemented
  tasks: TaskState;       // To be implemented
  sprints: SprintState;   // To be implemented
  notifications: NotificationState; // To be implemented
  ui: UIState;           // To be implemented
}
```

### Implemented Store Modules

#### Auth Store
- **Location**: `app/store/auth/`
- **State Structure**:
  - `user`: Current user information
  - `isAuthenticated`: Authentication status
  - `tokens`: Access and refresh tokens
  - `permissions`: User permissions
  - `loading`: Loading state
  - `error`: Error messages

## Routing & Guards

### Route Guards

#### AuthGuard
- **Path**: `app/core/guards/auth.guard.ts`
- **Purpose**: Protect authenticated routes
- **Usage**: Applied to routes requiring login

#### NoAuthGuard
- **Path**: `app/core/guards/no-auth.guard.ts`
- **Purpose**: Prevent authenticated users from accessing public routes
- **Usage**: Applied to login/register pages

#### PermissionGuard
- **Path**: `app/core/guards/permission.guard.ts`
- **Purpose**: Check specific permissions
- **Usage**: Applied to routes requiring specific permissions

#### RoleGuard
- **Path**: `app/core/guards/role.guard.ts`
- **Purpose**: Check user roles
- **Usage**: Applied to role-specific routes

## Interceptors

### HTTP Interceptors

All interceptors are functional interceptors (Angular 14+ style):

#### AuthInterceptor
- **Path**: `app/core/interceptors/auth.interceptor.ts`
- **Purpose**: Add authentication token to requests
- **Features**:
  - Automatic token injection
  - Token refresh on 401
  - Request retry logic

#### ErrorInterceptor
- **Path**: `app/core/interceptors/error.interceptor.ts`
- **Purpose**: Global error handling
- **Features**:
  - Error transformation
  - User-friendly messages
  - Error logging
  - Retry logic for network errors

#### LoadingInterceptor
- **Path**: `app/core/interceptors/loading.interceptor.ts`
- **Purpose**: Automatic loading indicator
- **Features**:
  - Show/hide loader for HTTP requests
  - Exclude specific endpoints
  - Track multiple simultaneous requests

#### CacheInterceptor
- **Path**: `app/core/interceptors/cache.interceptor.ts`
- **Purpose**: HTTP response caching
- **Features**:
  - Cache GET requests
  - TTL-based invalidation
  - Manual cache clearing

## Naming Conventions

### Services
- **Pattern**: `{Feature}Service`
- **Examples**: `AuthService`, `LoadingService`, `ThemeService`
- **File**: `{feature}.service.ts`

### Components
- **Pattern**: `{Feature}Component`
- **Examples**: `HeaderComponent`, `SidebarComponent`
- **Files**:
  - `{feature}.component.ts`
  - `{feature}.component.html`
  - `{feature}.component.scss`
  - `{feature}.component.spec.ts`

### Guards
- **Pattern**: `{Feature}Guard`
- **Examples**: `AuthGuard`, `PermissionGuard`
- **File**: `{feature}.guard.ts`

### Interceptors
- **Pattern**: `{feature}Interceptor`
- **Examples**: `authInterceptor`, `loadingInterceptor`
- **File**: `{feature}.interceptor.ts`
- **Note**: Function names are camelCase, following Angular 14+ conventions

## File Organization

```
apps/frontend/src/app/
├── core/                    # Singleton services, guards, interceptors
│   ├── services/           # Core services
│   ├── guards/            # Route guards
│   └── interceptors/      # HTTP interceptors
├── layouts/                # Layout components
│   ├── header/
│   ├── sidebar/
│   └── footer/
├── shared/                 # Shared components, directives, pipes
│   ├── components/
│   ├── directives/
│   └── pipes/
├── features/              # Feature modules (to be implemented)
│   ├── auth/
│   ├── dashboard/
│   ├── projects/
│   ├── tasks/
│   └── settings/
├── store/                 # NgRx store
│   ├── auth/
│   └── index.ts
├── app.component.ts       # Root component
├── app.config.ts         # App configuration
└── app.routes.ts         # Route definitions
```

## Component Status

### ✅ Implemented Components

- `AppComponent` - Root component
- `HeaderComponent` - Application header
- `SidebarComponent` - Navigation sidebar
- `FooterComponent` - Application footer
- `LoaderComponent` - Loading indicator
- `NotificationCenterComponent` - Notification management

### 🚧 To Be Implemented

#### Core Services
- `NotificationService` - Toast notifications
- `NetworkService` - Network status monitoring
- `LocaleService` - Internationalization
- `AccessibilityService` - Accessibility features

#### Shared Components
- `ToastContainerComponent` - Toast notifications
- `GlobalSearchComponent` - Application-wide search
- `KeyboardShortcutsDialogComponent` - Shortcuts help
- `ConfirmDialogComponent` - Confirmation dialogs
- `ErrorBoundaryComponent` - Error handling

#### Feature Components
- `LoginComponent` - User login
- `RegisterComponent` - User registration
- `DashboardComponent` - Main dashboard
- `ProjectListComponent` - Project listing
- `TaskBoardComponent` - Kanban board
- `SprintPlanningComponent` - Sprint management
- `UserSettingsComponent` - User preferences

#### Store Modules
- `UserStore` - User state management
- `ProjectStore` - Project state
- `TaskStore` - Task state
- `SprintStore` - Sprint state
- `NotificationStore` - Notification state
- `UIStore` - UI state

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)
- [Testing Guide](./TESTING.md)
- [API Documentation](./API.md)
- [Project Planning](./PROJECT_PLANNING.md)
- [Security Guide](./SECURITY.md)

---

Last updated: December 11, 2024
