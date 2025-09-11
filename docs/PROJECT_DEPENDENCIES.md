# Project Dependencies

## Table of Contents

1. [Overview](#overview)
2. [Frontend Dependencies](#frontend-dependencies)
3. [Backend Dependencies](#backend-dependencies)
4. [Development Dependencies](#development-dependencies)
5. [Dependency Management](#dependency-management)
6. [Security Considerations](#security-considerations)
7. [Update Strategy](#update-strategy)
8. [Related Documentation](#related-documentation)

## Overview

This document provides a comprehensive explanation of all external dependencies used in the SCRUM Project Manager platform. Each dependency is listed with its purpose, justification, and any relevant configuration notes.

## Frontend Dependencies

### Core Framework

#### Angular (v20.0.0)
- **Purpose**: Primary frontend framework
- **Justification**: Modern, enterprise-ready framework with excellent TypeScript support, built-in dependency injection, and comprehensive tooling
- **Modules Used**: Common, Core, Forms, Router, Platform-Browser, Animations

#### Angular Material (v20.0.0)
- **Purpose**: UI component library
- **Justification**: Official Material Design components for Angular, ensures consistent UI/UX, accessibility compliant, and well-maintained
- **Components Used**: Tables, Forms, Dialogs, Snackbars, Icons, Theming

### State Management

#### NgRx (v18.0.0)
- **Purpose**: Reactive state management
- **Justification**: Predictable state container for Angular apps, follows Redux pattern, excellent DevTools support
- **Packages**: Store, Effects, Entity, Store-DevTools

### GraphQL Integration

#### Apollo Angular (v6.0.0)
- **Purpose**: GraphQL client for Angular
- **Justification**: Type-safe GraphQL queries, caching, optimistic updates, WebSocket subscriptions support

#### Apollo Client (v3.9.0)
- **Purpose**: Core GraphQL client
- **Justification**: Industry standard GraphQL client, excellent caching mechanisms, comprehensive error handling

### Real-time Communication

#### Socket.io-client (v4.7.4)
- **Purpose**: WebSocket client for real-time updates
- **Justification**: Reliable real-time bidirectional communication, automatic reconnection, room-based messaging

### Utilities

#### RxJS (v7.8.1)
- **Purpose**: Reactive programming library
- **Justification**: Core to Angular, powerful operators for handling asynchronous operations

#### Zone.js (v0.14.3)
- **Purpose**: Execution context for Angular
- **Justification**: Required by Angular for change detection

#### date-fns (v2.30.0)
- **Purpose**: Date manipulation utilities
- **Justification**: Lightweight alternative to Moment.js, tree-shakeable, immutable

## Backend Dependencies

### Core Framework

#### NestJS (v10.3.0)
- **Purpose**: Backend framework
- **Justification**: Enterprise-grade Node.js framework, excellent TypeScript support, modular architecture, built-in microservices support
- **Modules**: Common, Core, Platform-Express, Microservices, WebSockets

### GraphQL Integration

#### @nestjs/graphql (v12.1.0)
- **Purpose**: GraphQL module for NestJS
- **Justification**: Seamless GraphQL integration with NestJS, code-first approach, automatic schema generation

#### @nestjs/apollo (v12.1.0)
- **Purpose**: Apollo Server integration
- **Justification**: Production-ready GraphQL server, subscriptions support, excellent tooling

#### Apollo Server Express (v3.13.0)
- **Purpose**: GraphQL server
- **Justification**: Industry standard, performance optimized, extensive middleware support

#### GraphQL (v16.8.1)
- **Purpose**: GraphQL language and runtime
- **Justification**: Core GraphQL implementation, required for schema definition

#### GraphQL Subscriptions (v2.0.0)
- **Purpose**: Real-time GraphQL subscriptions
- **Justification**: Enables real-time updates through GraphQL subscriptions

#### GraphQL Tools (v9.0.1)
- **Purpose**: GraphQL schema utilities
- **Justification**: Schema stitching, mocking, and transformation utilities

### Database

#### TypeORM (v0.3.19)
- **Purpose**: Object-Relational Mapping
- **Justification**: Excellent TypeScript support, supports PostgreSQL, migrations, query builder

#### pg (v8.11.3)
- **Purpose**: PostgreSQL client
- **Justification**: Native PostgreSQL driver for Node.js, required by TypeORM

### Authentication & Security

#### @nestjs/passport (v10.0.3)
- **Purpose**: Authentication middleware
- **Justification**: Standard authentication library for NestJS, strategy-based authentication

#### @nestjs/jwt (v10.2.0)
- **Purpose**: JWT token handling
- **Justification**: JWT generation and verification for stateless authentication

#### Passport (v0.7.0)
- **Purpose**: Authentication middleware core
- **Justification**: Industry standard, extensible authentication middleware

#### Passport JWT (v4.0.1)
- **Purpose**: JWT strategy for Passport
- **Justification**: Enables JWT-based authentication

#### Passport Local (v1.0.0)
- **Purpose**: Local authentication strategy
- **Justification**: Username/password authentication

#### bcryptjs (v2.4.3)
- **Purpose**: Password hashing
- **Justification**: Secure password hashing, protection against rainbow table attacks

### Validation & Transformation

#### class-validator (v0.14.1)
- **Purpose**: Validation decorators
- **Justification**: Decorator-based validation, works seamlessly with NestJS DTOs

#### class-transformer (v0.5.1)
- **Purpose**: Object transformation
- **Justification**: Transform plain objects to class instances, works with validation

### Configuration

#### @nestjs/config (v3.1.1)
- **Purpose**: Configuration module
- **Justification**: Environment-based configuration, validation, type safety

### Utilities

#### uuid (v9.0.1)
- **Purpose**: UUID generation
- **Justification**: Generate unique identifiers for entities

#### reflect-metadata (v0.2.1)
- **Purpose**: Metadata reflection API
- **Justification**: Required for decorators in TypeScript

## Development Dependencies

### Build Tools

#### Nx (v18.0.0)
- **Purpose**: Monorepo management
- **Justification**: Excellent monorepo tooling, computation caching, affected commands, dependency graph visualization
- **Plugins**: Angular, Nest, Jest, Cypress, ESLint

#### TypeScript (v5.3.3)
- **Purpose**: Type-safe JavaScript
- **Justification**: Type safety, better IDE support, required by Angular and NestJS

### Testing

#### Jest (v29.7.0)
- **Purpose**: Unit testing framework
- **Justification**: Fast, zero configuration, snapshot testing, excellent mocking capabilities

#### Karma (v6.4.2)
- **Purpose**: Test runner for Angular
- **Justification**: Angular's default test runner, browser testing support

#### Jasmine (v5.1.1)
- **Purpose**: Testing framework
- **Justification**: BDD testing framework, works with Karma

#### Cypress (v13.6.3)
- **Purpose**: E2E testing
- **Justification**: Modern E2E testing, real browser testing, excellent debugging

### Code Quality

#### ESLint (v8.56.0)
- **Purpose**: JavaScript/TypeScript linting
- **Justification**: Catch errors, enforce coding standards, customizable rules

#### Prettier (v3.2.4)
- **Purpose**: Code formatting
- **Justification**: Consistent code formatting, reduces bike-shedding

#### Husky (v8.0.3)
- **Purpose**: Git hooks
- **Justification**: Enforce quality checks before commits

#### lint-staged (v15.2.0)
- **Purpose**: Run linters on staged files
- **Justification**: Fast pre-commit checks, only check changed files

### Documentation

#### Compodoc (v1.1.23)
- **Purpose**: Documentation generator
- **Justification**: Automatic documentation from TypeScript code, supports Angular and NestJS

### Development Servers

#### ts-node (v10.9.2)
- **Purpose**: TypeScript execution
- **Justification**: Run TypeScript directly without compilation

#### Angular DevKit (v20.0.0)
- **Purpose**: Angular development tools
- **Justification**: Build, serve, and test Angular applications

#### NestJS CLI (v10.3.0)
- **Purpose**: NestJS development tools
- **Justification**: Scaffolding, development server, build tools

## Dependency Management

### Version Strategy

1. **Major versions**: Updated quarterly after thorough testing
2. **Minor versions**: Updated monthly for features and improvements
3. **Patch versions**: Updated immediately for security fixes

### Dependency Auditing

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Check outdated packages
npm outdated
```

### Lock File Management

- **package-lock.json**: Committed to repository
- **Purpose**: Ensure consistent installations across environments
- **Updates**: Only through explicit npm install or update commands

## Security Considerations

### Vulnerability Scanning

1. **Automated scanning**: GitHub Dependabot enabled
2. **Manual audits**: Monthly security audits
3. **Critical updates**: Applied within 24 hours

### Dependency Policies

1. **No deprecated packages**: Remove or replace deprecated dependencies
2. **License compliance**: MIT, Apache 2.0, or compatible licenses only
3. **Minimal dependencies**: Avoid unnecessary dependencies
4. **Regular updates**: Keep dependencies current

### Known Security Measures

- **bcryptjs**: Used instead of bcrypt for better cross-platform compatibility
- **helmet**: Added for securing Express apps (configured in NestJS)
- **cors**: Configured with specific origins
- **rate-limiting**: Implemented to prevent abuse

## Update Strategy

### Quarterly Major Updates

1. Review breaking changes
2. Update in development environment
3. Run full test suite
4. Update documentation
5. Deploy to staging
6. Monitor for issues
7. Deploy to production

### Monthly Minor Updates

1. Review changelog
2. Update dependencies
3. Run tests
4. Deploy to staging
5. Deploy to production

### Security Patches

1. Immediate assessment
2. Apply patch
3. Emergency testing
4. Deploy to all environments

### Dependency Update Commands

```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update specific dependency
npm install package@latest

# Update to specific version
npm install package@version

# Interactive update with Nx
nx migrate latest
```

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)
- [Security Guide](./SECURITY.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

Last updated: September 2025
