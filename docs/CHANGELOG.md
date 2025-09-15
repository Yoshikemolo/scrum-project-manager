# Changelog

All notable changes to the SCRUM Project Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Frontend structure documentation
- Comprehensive component architecture documentation
- Service layer documentation
- Component status tracking

### Changed
- **BREAKING**: Renamed `LoaderService` to `LoadingService` for consistency
- **BREAKING**: Renamed `loaderInterceptor` to `loadingInterceptor`
- **BREAKING**: Renamed `SidenavComponent` to `SidebarComponent`
- Updated all imports and references to use new service names
- Improved service documentation with JSDoc comments
- Enhanced component documentation

### Fixed
- Fixed inconsistent service naming across the application
- Fixed inconsistent component naming
- Fixed import order issues in app.component.ts
- Added null safety checks for environment properties
- Corrected interceptor references in app.config.ts

## [0.2.0] - 2024-12-11

### Added
- Refactored app.component with detailed documentation
- Comprehensive test suite for app.component
- Enhanced SCSS with detailed comments
- Improved accessibility features
- Animation support for better UX
- High contrast mode support
- Print styles optimization
- Reduced motion support

### Changed
- Updated project planning with detailed frontend phases
- Enhanced component documentation
- Improved test coverage to 95%+

## [0.1.0] - 2024-09-11

### Added
- Initial project setup with Nx monorepo
- Angular 20 frontend application structure
- NestJS backend microservices structure
- GraphQL API Gateway configuration
- PostgreSQL database schemas
- Redis caching setup
- Docker and Docker Compose configuration
- Kubernetes manifests
- Comprehensive documentation structure
- GitFlow workflow implementation
- Shared TypeScript interfaces
- Core services implementation:
  - AuthService
  - ThemeService
  - WebSocketService
  - ShortcutService
  - LocalStorageService
- HTTP interceptors:
  - Auth interceptor
  - Error interceptor
  - Cache interceptor
  - Loading interceptor
- Route guards:
  - AuthGuard
  - NoAuthGuard
  - PermissionGuard
  - RoleGuard
- Layout components:
  - HeaderComponent
  - FooterComponent
  - SidenavComponent
- NgRx store setup with auth module
- i18n configuration with multiple languages
- PWA configuration with service worker
- Material Design integration

### Security
- JWT-based authentication implementation
- Role-Based Access Control (RBAC)
- HTTP security headers
- CORS configuration
- SQL injection prevention
- XSS protection measures

## Version History

- **0.2.0** - Component refactoring and documentation improvements
- **0.1.0** - Initial project setup and core infrastructure

## Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## Release Process

1. Features are developed in feature branches
2. Merged to develop branch for integration
3. Release branches created from develop
4. After testing, merged to main and tagged
5. Hotfixes applied directly to main when critical

---

[Unreleased]: https://github.com/Yoshikemolo/scrum-project-manager/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Yoshikemolo/scrum-project-manager/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Yoshikemolo/scrum-project-manager/releases/tag/v0.1.0
